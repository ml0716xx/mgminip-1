/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 天盈 AI 站点策略&收益体检报告（小程序端）
 * --------------------------------------------------------------------------
 * 按 PC 端（微网首页改版 2.0）最终形态对齐，读法是「体检报告」而非「说明书」：
 *   先看一天的真实曲线 → 认可动作 → 再算这个月多赚多少 → 九项指标逐条核验
 *
 *   1 典型日：天盈 AI 发现了什么？   三个日期按钮 / 逐 15min 双轴曲线 / 4 行单日对照
 *   2 这个月能多赚多少               一句话 + 收益构成柱图 + 增量来源（含合计）
 *   3 九项指标逐条对一遍             左栏电量类 6 行 / 右栏收益类 3 行，并排
 *
 * 只保留标题、数字、图表。替读者归纳的判读、方法论说明、口径注释一律不写。
 * 全文不出现「仿真」二字，唯一例外是元信息里的版本号「AI 策略仿真 V1.0」。
 *
 * 手机端适配（相对 PC）：
 *   · 无 hover —— 电价改为图内两条面积常驻呈现，点按曲线可读出该时刻买卖电价；
 *   · 图例 6 项在 395px 宽度下自动折成两行（顺序不变：两个电价 → 四条曲线）；
 *   · 九项指标左右两栏并排，两栏各自按内容收高，不强行拉等高。
 * 数值全部取自 src/data/tianyingSimData.ts，组件不写死数值。
 */

import React, { useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  Bar,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  LabelList,
  Tooltip,
} from 'recharts';
import { ChevronLeft, ChevronRight, BrainCircuit, Rocket, Gauge } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AiActivationStatus } from '../data/overviewData';
import {
  TY_META,
  TY_SIM_KPI,
  TY_SIM_DELTA,
  TY_SIM_ROWS,
  TY_SIM_WHY,
  SIM_GROUPS,
  TY_CASE_DAYS,
  TY_CASE_CURVES,
  TY_CURVE_TEXT,
  PRICE_DOMAIN_MAX,
  PRICE_RANGE_TEXT,
  CaseDayPoint,
  fmt,
  fmtSigned,
} from '../data/tianyingSimData';

/** 配色：数值增减按方向着色（增红减绿），文字三档层级 */
const C = {
  green: '#1E9C7E',
  blue: '#3B82F6',
  red: '#E5484D',
  amber: '#F59E0B',
  realPower: '#94A3B8',
};
const INK = {
  body: '#1A2A3A',
  second: '#5A6B7C',
  muted: '#8A98A6',
  line: '#EAEDF2',
};

interface TianyingSimPageProps {
  onBack: () => void;
  onOpenBizReport?: () => void;
  /** AI 策略开通状态：未开通时正文末尾附开通引导条 */
  aiStatus?: AiActivationStatus;
  onSetAiStatus?: (s: AiActivationStatus) => void;
}

// ==================== 章节外壳 ====================
const Chapter: React.FC<{ no: string; title: string; children: React.ReactNode }> = ({
  no,
  title,
  children,
}) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
    <div className="px-3.5 py-2.5 border-b border-gray-100 bg-slate-50/60 flex items-center gap-2">
      <span className="w-[18px] h-[18px] rounded-md bg-[#1E9C7E] text-white text-[10px] font-black flex items-center justify-center shrink-0">
        {no}
      </span>
      <h3 className="text-[12px] font-black" style={{ color: INK.body }}>
        {title}
      </h3>
    </div>
    <div className="p-3.5">{children}</div>
  </div>
);

// ==================== 对照表（四列：指标 / 实际运行 / AI 策略 / 绝对差） ====================
interface CompareRow {
  item: string;
  real: number;
  sim: number;
  unit: string;
  dec: number;
}

const diffColor = (d: number, dec: number) =>
  Math.abs(d) < 10 ** -dec / 2 ? INK.muted : d > 0 ? C.red : C.green;

const CompareTable: React.FC<{ rows: CompareRow[] }> = ({ rows }) => (
  <table className="w-full table-fixed">
    <colgroup>
      <col style={{ width: '38%' }} />
      <col style={{ width: '21%' }} />
      <col style={{ width: '21%' }} />
      <col style={{ width: '20%' }} />
    </colgroup>
    <thead>
      <tr className="bg-slate-50/70 border-b" style={{ borderColor: INK.line }}>
        <th className="text-left px-1.5 py-1.5 text-[9px] font-black" style={{ color: INK.muted }}>
          指标
        </th>
        <th className="text-right px-1.5 py-1.5 text-[9px] font-black" style={{ color: INK.muted }}>
          实际运行
        </th>
        <th className="text-right px-1.5 py-1.5 text-[9px] font-black" style={{ color: INK.muted }}>
          AI 策略
        </th>
        <th className="text-right px-1.5 py-1.5 text-[9px] font-black" style={{ color: INK.muted }}>
          绝对差
        </th>
      </tr>
    </thead>
    <tbody>
      {rows.map((r) => {
        const d = r.sim - r.real;
        return (
          <tr key={r.item} className="border-t border-gray-50">
            <td className="px-1.5 py-1.5 text-[10px] truncate" style={{ color: INK.body }}>
              {r.item}
              <span className="text-[8px] ml-0.5 font-bold" style={{ color: INK.muted }}>
                {r.unit}
              </span>
            </td>
            <td className="px-1.5 py-1.5 text-right text-[10px] font-mono" style={{ color: INK.second }}>
              {fmt(r.real, r.dec)}
            </td>
            <td
              className="px-1.5 py-1.5 text-right text-[10px] font-mono font-black"
              style={{ color: INK.body }}
            >
              {fmt(r.sim, r.dec)}
            </td>
            <td
              className="px-1.5 py-1.5 text-right text-[10px] font-mono font-black"
              style={{ color: diffColor(d, r.dec) }}
            >
              {Math.abs(d) < 10 ** -r.dec / 2 ? '—' : fmtSigned(d, r.dec)}
            </td>
          </tr>
        );
      })}
    </tbody>
  </table>
);

// ==================== 九项指标 · 分组卡（上下堆叠，全宽） ====================
/* 小程序 395px 宽下两栏并排会把数值压到 7.5px、贴边难读，改为每类一张全宽卡。
   单位只在行内标注：电量类里混着 %(储能利用率) 与 次/日(日均充放次数)，
   分组标题若写 kWh 会以偏概全。 */
const MetricGroup: React.FC<{ title: string; rows: CompareRow[] }> = ({ title, rows }) => (
  <div className="rounded-xl border overflow-hidden" style={{ borderColor: INK.line }}>
    <div
      className="px-2.5 py-1.5 bg-slate-50/70 border-b"
      style={{ borderColor: INK.line }}
    >
      <span className="text-[10px] font-black" style={{ color: INK.body }}>
        {title}
      </span>
    </div>
    <CompareTable rows={rows} />
  </div>
);

// ==================== 点按读价（小程序无 hover，改点按） ====================
const PriceTip: React.FC<any> = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload as CaseDayPoint;
  if (!p) return null;
  return (
    <div className="rounded-lg bg-white/96 border border-gray-200 shadow-md px-2 py-1.5">
      <div className="text-[8px] font-black font-mono" style={{ color: INK.second }}>
        {p.time}
      </div>
      <div className="text-[8px] font-bold mt-0.5" style={{ color: INK.body }}>
        下网购电{' '}
        <span className="font-mono font-black">{fmt(p.buyPrice, 4)}</span>
        <span style={{ color: INK.muted }}> 元/kWh</span>
      </div>
      <div className="text-[8px] font-bold" style={{ color: INK.body }}>
        上网电价{' '}
        <span className="font-mono font-black">{fmt(p.sellPrice, 4)}</span>
        <span style={{ color: INK.muted }}> 元/kWh</span>
      </div>
    </div>
  );
};

// ==================== 典型日逐 15min 曲线 ====================
const CaseDayCurve: React.FC<{
  points: CaseDayPoint[];
  date: string;
  totalDiff: number;
  storageDiff: number;
}> = ({ points, date, totalDiff, storageDiff }) => {
  const T = TY_CURVE_TEXT;

  const metrics = [
    { label: '这一天可多赚', diff: totalDiff },
    { label: '储能多赚', diff: storageDiff },
  ];

  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: INK.line }}>
      {/* 图表头：当日两个数字常驻在标题旁，看曲线时不用往下找 */}
      <div className="px-3 py-2.5 border-b bg-slate-50/50" style={{ borderColor: INK.line }}>
        <div className="flex items-start justify-between gap-x-2 gap-y-1.5 flex-wrap">
          <div
            className="text-[10px] font-black leading-snug"
            style={{ color: INK.body }}
          >
            {T.chartTitle} · {date}
          </div>
          <div className="flex items-center gap-3 shrink-0 ml-auto">
            {metrics.map((m, i) => (
              <div key={m.label} className={i > 0 ? 'pl-3 border-l' : undefined} style={{ borderColor: INK.line }}>
                <div className="text-[8px] font-bold" style={{ color: INK.muted }}>
                  {m.label}
                </div>
                <div
                  className="text-[13px] font-black font-mono leading-tight"
                  style={{ color: m.diff > 0 ? C.red : C.green }}
                >
                  {fmtSigned(m.diff, 0)}
                  <span className="text-[8px] font-bold ml-0.5" style={{ color: INK.muted }}>
                    元
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 曲线本体：面积在下（电价）、折线在上（功率 + SOC） */}
      <div className="px-1 pt-2">
        <div className="h-[196px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={points} margin={{ top: 6, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="tyBuyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#94A3B8" stopOpacity={0.18} />
                  <stop offset="100%" stopColor="#94A3B8" stopOpacity={0.03} />
                </linearGradient>
                <linearGradient id="tySellGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1E9C7E" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#1E9C7E" stopOpacity={0.04} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EFF2F5" />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 8, fill: INK.muted }}
                axisLine={{ stroke: INK.line }}
                tickLine={false}
                interval={15}
              />
              <YAxis
                yAxisId="left"
                domain={['auto', 'auto']}
                tick={{ fontSize: 8, fill: INK.muted }}
                axisLine={false}
                tickLine={false}
                width={36}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                domain={[0, 100]}
                tick={{ fontSize: 8, fill: '#D1A85F' }}
                axisLine={false}
                tickLine={false}
                width={24}
              />
              {/* 隐藏的第三根轴：只承载电价，不占可见刻度 */}
              <YAxis yAxisId="price" hide domain={[0, PRICE_DOMAIN_MAX]} />

              <Area
                yAxisId="price"
                type="stepAfter"
                dataKey="buyPrice"
                baseValue={0}
                stroke="#94A3B8"
                strokeWidth={0.8}
                strokeOpacity={0.45}
                fill="url(#tyBuyGrad)"
                isAnimationActive={false}
              />
              <Area
                yAxisId="price"
                type="monotone"
                dataKey="sellPrice"
                baseValue={0}
                stroke={C.green}
                strokeWidth={1}
                strokeDasharray="4 3"
                fill="url(#tySellGrad)"
                isAnimationActive={false}
              />

              <ReferenceLine yAxisId="left" y={0} stroke="#D5DBE2" />

              <Line
                yAxisId="left"
                type="stepAfter"
                dataKey="real"
                stroke={C.realPower}
                strokeWidth={1.8}
                dot={false}
                isAnimationActive={false}
              />
              <Line
                yAxisId="left"
                type="stepAfter"
                dataKey="sim"
                stroke={C.blue}
                strokeWidth={1.8}
                dot={false}
                isAnimationActive={false}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="socReal"
                stroke="#CBD5E1"
                strokeWidth={1.2}
                strokeDasharray="3 3"
                dot={false}
                isAnimationActive={false}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="socSim"
                stroke={C.amber}
                strokeWidth={1.2}
                strokeDasharray="4 3"
                dot={false}
                isAnimationActive={false}
              />

              <Tooltip
                trigger="click"
                content={<PriceTip />}
                cursor={{ stroke: '#CBD5E1', strokeDasharray: '3 3' }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 图例 6 项：两个电价色块 → 实际运行功率 → AI 策略功率 → 实际运行 SOC → AI 策略 SOC */}
      <div className="px-3 pt-1 pb-2.5 flex flex-wrap items-center gap-x-2.5 gap-y-1">
        <span
          className="flex items-center gap-1 text-[8px] font-bold"
          style={{ color: INK.second }}
        >
          <span
            className="w-3.5 h-2 rounded-[1px]"
            style={{
              background:
                'linear-gradient(180deg, rgba(148,163,184,.55) 0%, rgba(148,163,184,.12) 100%)',
              borderTop: '1px solid rgba(148,163,184,.75)',
            }}
          />
          {T.legend.buyPrice}{' '}
          <span className="font-mono font-black" style={{ color: INK.body }}>
            {fmt(PRICE_RANGE_TEXT.buyMin, 4)}–{fmt(PRICE_RANGE_TEXT.buyMax, 4)}
          </span>{' '}
          元/kWh
        </span>
        <span
          className="flex items-center gap-1 text-[8px] font-bold"
          style={{ color: INK.second }}
        >
          <span
            className="w-3.5 h-2 rounded-[1px]"
            style={{
              background: 'rgba(30,156,126,.18)',
              borderTop: `1px dashed ${C.green}`,
            }}
          />
          {T.legend.sellPrice}{' '}
          <span className="font-mono font-black" style={{ color: INK.body }}>
            {fmt(PRICE_RANGE_TEXT.sell, 4)}
          </span>{' '}
          元/kWh
        </span>
        {[
          { color: C.realPower, label: T.legend.realPower, solid: true },
          { color: C.blue, label: T.legend.simPower, solid: true },
          { color: '#CBD5E1', label: T.legend.realSoc, solid: false },
          { color: C.amber, label: T.legend.simSoc, solid: false },
        ].map((it) => (
          <span
            key={it.label}
            className="flex items-center gap-1 text-[8px] font-bold"
            style={{ color: INK.second }}
          >
            <span
              className="w-3.5 h-0.5 rounded-full"
              style={
                it.solid
                  ? { background: it.color }
                  : {
                      backgroundImage: `repeating-linear-gradient(90deg, ${it.color} 0 3px, transparent 3px 5px)`,
                    }
              }
            />
            {it.label}
          </span>
        ))}
      </div>
    </div>
  );
};

// ==================== 主页面 ====================
export const TianyingSimPage: React.FC<TianyingSimPageProps> = ({
  onBack,
  onOpenBizReport,
  aiStatus = 'activated',
  onSetAiStatus,
}) => {
  const [caseIdx, setCaseIdx] = useState(0);
  const caseDay = TY_CASE_DAYS[caseIdx];

  /** 收益构成柱图：实际运行 → AI 策略（储能 / 光伏分项） */
  const barData = [
    { name: '实际运行', 储能: TY_SIM_KPI.storage.real, 光伏: TY_SIM_KPI.pv.real },
    { name: 'AI 策略', 储能: TY_SIM_KPI.storage.sim, 光伏: TY_SIM_KPI.pv.sim },
  ];

  /** 单日 4 行对照：把「储能充电量 (kWh)」拆成 名称 + 单位 */
  const caseRows: CompareRow[] = caseDay.rows.map((r) => {
    const m = r.name.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
    return { item: m ? m[1] : r.name, unit: m ? m[2] : '', real: r.real, sim: r.sim, dec: 0 };
  });

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* 顶部导航 */}
      <div className="flex items-center justify-between px-3 py-2.5 bg-white border-b border-gray-100 shrink-0">
        <button onClick={onBack} id="btn_sim_back" className="p-1 text-gray-600 active:text-emerald-500">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="text-[12px] font-black text-gray-900 truncate mx-1">{TY_META.title}</span>
        <span className="w-6 shrink-0" />
      </div>

      <div className="flex-1 overflow-y-auto bg-[#f6f7f9]">
        {/* ==================== 报告头（只有标题与元信息，不放任何总结句） ==================== */}
        <div className="relative bg-gradient-to-br from-emerald-600 via-teal-500 to-cyan-500 px-4 pt-3.5 pb-4 overflow-hidden">
          <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/10" />
          <div className="absolute -right-2 top-10 w-16 h-16 rounded-full bg-white/10" />
          <div className="relative">
            <div className="flex items-center gap-1.5">
              <BrainCircuit className="w-3.5 h-3.5 text-white" />
              <span className="text-[9px] font-black text-white/85 tracking-wide">
                TIANYING AI · SITE DIAGNOSIS
              </span>
            </div>
            <h1 className="text-[16px] font-black text-white tracking-tight mt-1.5 leading-snug">
              {TY_META.title}
            </h1>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="text-[9px] font-black text-emerald-700 bg-white px-1.5 py-0.5 rounded-md">
                {TY_META.badge}
              </span>
              <span className="text-[9px] text-white/85 font-bold">
                {TY_META.station} · {TY_META.region}
              </span>
            </div>
            <p className="text-[9px] text-white/70 font-bold mt-1">
              {TY_META.periodLabel} · {TY_META.version}
            </p>
          </div>
        </div>

        <div className="px-3 pb-8 -mt-2 space-y-3">
          {/* ==================== 第 1 段 典型日 ==================== */}
          <Chapter no="1" title="典型日：天盈 AI 发现了什么？">
            <div className="grid grid-cols-3 gap-1.5">
              {TY_CASE_DAYS.map((d, i) => (
                <button
                  key={d.date}
                  id={`btn_case_day_${i}`}
                  onClick={() => setCaseIdx(i)}
                  className={`py-2 rounded-lg border text-center transition-colors ${
                    i === caseIdx
                      ? 'bg-[#1E9C7E] border-[#1E9C7E]'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <span
                    className="text-[11px] font-black font-mono block leading-none"
                    style={{ color: i === caseIdx ? '#fff' : INK.second }}
                  >
                    {d.date.slice(5)}
                  </span>
                </button>
              ))}
            </div>

            <div className="mt-2.5">
              <CaseDayCurve
                points={TY_CASE_CURVES[caseDay.date] ?? []}
                date={caseDay.date}
                totalDiff={caseDay.totalDiff}
                storageDiff={caseDay.storageDiff}
              />
            </div>

            <div className="rounded-xl border overflow-hidden mt-2.5" style={{ borderColor: INK.line }}>
              <CompareTable rows={caseRows} />
            </div>
          </Chapter>

          {/* ==================== 第 2 段 这个月能多赚多少 ==================== */}
          <Chapter no="2" title="这个月能多赚多少">
            <p className="text-[10px] font-bold leading-relaxed" style={{ color: INK.body }}>
              钱从哪来：同样的设备、同样的电价，只换排法，一个月多赚{' '}
              <span className="whitespace-nowrap">
                <span className="font-mono font-black" style={{ color: C.red }}>
                  {fmt(TY_SIM_DELTA.net, 0)}
                </span>{' '}
                元
              </span>
            </p>

            {/* 收益构成柱图 */}
            <div className="rounded-xl border px-2.5 pt-2 pb-1 mt-2.5" style={{ borderColor: INK.line }}>
              <div className="flex items-center justify-between">
                <span className="text-[8px] font-bold" style={{ color: INK.muted }}>
                  元 / 月
                </span>
                <span className="flex items-center gap-2">
                  <span className="flex items-center gap-1 text-[8px] font-bold" style={{ color: INK.second }}>
                    <span className="w-1.5 h-1.5 rounded-xs" style={{ background: C.blue }} />
                    储能
                  </span>
                  <span className="flex items-center gap-1 text-[8px] font-bold" style={{ color: INK.second }}>
                    <span className="w-1.5 h-1.5 rounded-xs" style={{ background: C.green }} />
                    光伏
                  </span>
                </span>
              </div>
              <div className="h-[124px] mt-1">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={barData}
                    margin={{ top: 16, right: 6, left: -14, bottom: 0 }}
                    barGap={10}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EFF2F5" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 9, fill: INK.second }}
                      axisLine={{ stroke: INK.line }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 8, fill: INK.muted }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v: number) => `${Math.round(v / 1000)}k`}
                    />
                    <ReferenceLine y={0} stroke={INK.line} />
                    <Bar dataKey="储能" fill={C.blue} radius={[3, 3, 0, 0]} maxBarSize={30}>
                      <LabelList
                        dataKey="储能"
                        position="top"
                        style={{ fontSize: 8, fill: INK.second, fontWeight: 700 }}
                        formatter={(v: any) => fmt(Number(v), 0)}
                      />
                    </Bar>
                    <Bar dataKey="光伏" fill={C.green} radius={[3, 3, 0, 0]} maxBarSize={30}>
                      <LabelList
                        dataKey="光伏"
                        position="top"
                        style={{ fontSize: 8, fill: INK.second, fontWeight: 700 }}
                        formatter={(v: any) => fmt(Number(v), 0)}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 增量来源：两行归因 + 一行合计，金额全部由 KPI 派生 */}
            <div
              className="rounded-xl border overflow-hidden mt-2.5"
              style={{ borderColor: INK.line }}
            >
              {TY_SIM_WHY.map((w) => (
                <div
                  key={w.title}
                  className="px-2.5 py-2 border-b flex items-start justify-between gap-2"
                  style={{ borderColor: INK.line }}
                >
                  <div className="min-w-0">
                    <div className="text-[10px] font-black" style={{ color: INK.body }}>
                      {w.title}
                    </div>
                    <p className="text-[9px] font-bold leading-snug mt-0.5" style={{ color: INK.muted }}>
                      {w.brief}
                    </p>
                  </div>
                  <span
                    className="text-[11px] font-black font-mono shrink-0"
                    style={{ color: w.amount > 0 ? C.red : C.green }}
                  >
                    {fmtSigned(w.amount, 0)}
                    <span className="text-[8px] font-bold ml-0.5" style={{ color: INK.muted }}>
                      元
                    </span>
                  </span>
                </div>
              ))}
              <div className="px-2.5 py-2 bg-slate-50/70 flex items-center justify-between">
                <span className="text-[10px] font-black" style={{ color: INK.body }}>
                  合计
                </span>
                <span className="text-[12px] font-black font-mono" style={{ color: C.red }}>
                  {fmtSigned(TY_SIM_DELTA.net, 0)}
                  <span className="text-[8px] font-bold ml-0.5" style={{ color: INK.muted }}>
                    元 / 月（全月口径）
                  </span>
                </span>
              </div>
            </div>
          </Chapter>

          {/* ==================== 第 3 段 九项指标 ==================== */}
          <Chapter no="3" title="九项指标逐条对一遍">
            <div className="space-y-2.5">
              {SIM_GROUPS.map((g) => {
                const rows = TY_SIM_ROWS.filter((r) => r.group === g).map((r) => ({
                  item: r.item,
                  real: r.real,
                  sim: r.sim,
                  unit: r.unit,
                  dec: r.dec,
                }));
                return <MetricGroup key={g} title={g} rows={rows} />;
              })}
            </div>
          </Chapter>

          {/* ============ 未开通：开通 30 天试用 + 申请开通正式运行（两个入口，勿合并） ============ */}
          <AnimatePresence>
            {aiStatus === 'not_activated' && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                id="banner_trial_open"
                className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 px-3.5 py-3"
              >
                <div className="flex items-center gap-2">
                  <Rocket className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-[12px] font-black" style={{ color: INK.body }}>
                    开通 30 天试用
                  </span>
                </div>
                <div className="mt-2.5 flex items-stretch gap-2">
                  <button
                    id="btn_ai_trial_sim"
                    onClick={() => onSetAiStatus?.('trial')}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[11px] font-black shadow-sm shadow-emerald-500/25 active:scale-[0.99] transition-transform whitespace-nowrap"
                  >
                    一键免费开通 30 天试用
                  </button>
                  <button
                    id="btn_ai_activated_sim"
                    onClick={() => onSetAiStatus?.('activated')}
                    className="shrink-0 px-3 py-2.5 rounded-xl bg-white border border-emerald-300 text-emerald-700 text-[11px] font-black active:scale-[0.99] transition-transform whitespace-nowrap"
                  >
                    开通正式
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ==================== 跳转经营分析报告 ==================== */}
          {onOpenBizReport && (
            <button
              onClick={onOpenBizReport}
              id="btn_sim_open_biz"
              className="w-full bg-white rounded-2xl border border-gray-100 p-3.5 shadow-xs flex items-center justify-between active:scale-[0.99] transition-transform"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                  <Gauge className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <span className="text-[11px] font-black block" style={{ color: INK.body }}>
                    查看本月经营分析报告
                  </span>
                  <span className="text-[9px] font-bold" style={{ color: INK.muted }}>
                    策略收益与真实运行数据的对照分析
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TianyingSimPage;
