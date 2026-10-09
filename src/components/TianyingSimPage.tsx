/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 天盈 AI 仿真报告（小程序端）
 * --------------------------------------------------------------------------
 * 正文与 web 端 -2.0《天盈 AI 仿真报告》弹窗（TianyingSimReportBody）同源，
 * 两章 + 报告头核心结论：
 *   报告头  核心结论条（增量、提升幅度、总收益两侧对照、增量主来源）
 *   第 1 章 仿真收益对比（收益构成柱图 / 逐项对照表 电量类+收益类 / 增量来源 / 电价口径）
 *   第 2 章 典型日分析（3 个案例日切换 / 逐 15min 双轴曲线 / 案例日对照表 / 判读要点）
 * 数值全部取自 src/data/tianyingSimData.ts，与 web 端逐项对齐，组件不写死数值。
 *
 * 手机端适配：web 的左右并排（lg:grid-cols-2）改为上下堆叠；表格固定四列宽度；
 * 曲线去掉 hover tooltip（小程序无悬停），改为图例 + 24h 电价档位色带常驻。
 */

import React, { useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  LabelList,
} from 'recharts';
import {
  ChevronLeft,
  ChevronRight,
  BrainCircuit,
  Sparkles,
  Zap,
  Battery,
  CheckCircle2,
  Rocket,
  Info,
  Gauge,
  CalendarClock,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AiActivationStatus } from '../data/overviewData';
import { AiActivationCta } from './AiActivationCta';
import {
  TY_META,
  TY_SIM_KPI,
  TY_SIM_DELTA,
  TY_SIM_ROWS,
  TY_SIM_WHY,
  SIM_GROUPS,
  TY_PRICE,
  TY_PRICE_COMPARE,
  TY_CASE_DAYS,
  TY_CASE_CURVES,
  TY_CURVE_TEXT,
  TY_TOU_SEGMENTS,
  TIER_META,
  CaseDayPoint,
  fmt,
  fmtSigned,
} from '../data/tianyingSimData';

const C = { green: '#1E9C7E', blue: '#3B82F6', red: '#E5484D', amber: '#F59E0B' };

interface TianyingSimPageProps {
  onBack: () => void;
  onOpenBizReport?: () => void;
  /** AI 策略开通状态：未开通时正文末尾附开通入口（与 web 弹窗 showActivateHint 同义） */
  aiStatus?: AiActivationStatus;
  onSetAiStatus?: (s: AiActivationStatus) => void;
}

// ==================== 章节外壳 ====================
const Chapter: React.FC<{
  no: string;
  title: string;
  hint?: string;
  children: React.ReactNode;
}> = ({ no, title, hint, children }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
    <div className="px-3.5 py-2.5 border-b border-gray-100 bg-slate-50/60 flex items-center gap-2">
      <span className="w-[18px] h-[18px] rounded-md bg-[#1E9C7E] text-white text-[10px] font-black flex items-center justify-center shrink-0">
        {no}
      </span>
      <h3 className="text-[12px] font-black text-gray-900">{title}</h3>
      {hint && <span className="text-[9px] text-gray-400 font-bold truncate">{hint}</span>}
    </div>
    <div className="p-3.5">{children}</div>
  </div>
);

const BlockTitle: React.FC<{ children: React.ReactNode; extra?: React.ReactNode }> = ({
  children,
  extra,
}) => (
  <div className="flex items-center justify-between mb-1.5">
    <span className="text-[11px] font-black text-gray-700">{children}</span>
    {extra}
  </div>
);

// ==================== 逐项对照表 ====================
interface CompareRow {
  item: string;
  real: number;
  sim: number;
  unit: string;
  dec: number;
}

const CompareTable: React.FC<{ rows: CompareRow[]; totalKey?: string }> = ({ rows, totalKey }) => (
  <table className="w-full table-fixed">
    <colgroup>
      <col className="w-[38%]" />
      <col className="w-[21%]" />
      <col className="w-[21%]" />
      <col className="w-[20%]" />
    </colgroup>
    <thead>
      <tr className="bg-slate-50/70 border-b border-gray-100">
        <th className="text-left px-1.5 py-1.5 text-[9px] font-black text-gray-400">指标</th>
        <th className="text-right px-1.5 py-1.5 text-[9px] font-black text-gray-400">实际运行</th>
        <th className="text-right px-1.5 py-1.5 text-[9px] font-black text-gray-400">AI 仿真</th>
        <th className="text-right px-1.5 py-1.5 text-[9px] font-black text-gray-400">绝对差</th>
      </tr>
    </thead>
    <tbody>
      {rows.map((r) => {
        const diff = r.sim - r.real;
        const isTotal = totalKey != null && r.item === totalKey;
        const zero = Math.abs(diff) < 10 ** -r.dec / 2;
        return (
          <tr
            key={r.item}
            className={`border-t border-gray-50 ${isTotal ? 'bg-emerald-50/50' : ''}`}
          >
            <td
              className={`px-1.5 py-1.5 text-[10px] truncate ${
                isTotal ? 'font-black text-gray-900' : 'text-gray-700'
              }`}
            >
              {r.item}
              <span className="text-[8px] text-gray-400 ml-0.5 font-bold">{r.unit}</span>
            </td>
            <td className="px-1.5 py-1.5 text-right text-[10px] font-mono text-gray-500">
              {fmt(r.real, r.dec)}
            </td>
            <td
              className={`px-1.5 py-1.5 text-right text-[10px] font-mono font-black ${
                isTotal ? 'text-gray-900' : 'text-gray-800'
              }`}
            >
              {fmt(r.sim, r.dec)}
            </td>
            <td
              className="px-1.5 py-1.5 text-right text-[10px] font-mono font-black"
              style={{ color: zero ? '#9AA7B4' : diff > 0 ? C.red : C.green }}
            >
              {zero ? '—' : fmtSigned(diff, r.dec)}
            </td>
          </tr>
        );
      })}
    </tbody>
  </table>
);

// ==================== 典型日逐 15min 曲线卡 ====================
const CaseDayCurve: React.FC<{
  points: CaseDayPoint[];
  date: string;
  metrics: { label: string; diff: number }[];
}> = ({ points, date, metrics }) => {
  const T = TY_CURVE_TEXT;

  /** 底部读数：由曲线积分回算，与日粒度表格同口径 */
  const kwh = (key: 'sim' | 'real', dir: 'charge' | 'discharge') =>
    points.reduce((s, p) => {
      const v = p[key];
      return s + (dir === 'charge' ? (v > 0 ? v : 0) : v < 0 ? -v : 0) * 0.25;
    }, 0);

  return (
    <div className="rounded-xl border border-gray-100 overflow-hidden">
      {/* 图表头：当日收益差常驻，看曲线时不用往下找数字 */}
      <div className="px-3 py-2.5 border-b border-gray-50 bg-slate-50/50">
        <div className="text-[11px] font-black text-gray-900">
          {T.chartTitle} · {date}
        </div>
        <div className="text-[8px] text-gray-400 font-bold mt-0.5 leading-snug">{T.rule}</div>
        <div className="flex items-center gap-4 mt-2">
          {metrics.map((m, i) => (
            <div key={m.label} className={i > 0 ? 'pl-4 border-l border-gray-200' : undefined}>
              <div className="text-[8px] text-gray-400 font-bold">{m.label}</div>
              <div
                className="text-[13px] font-black font-mono leading-tight mt-0.5"
                style={{ color: m.diff > 0 ? C.red : C.green }}
              >
                {fmtSigned(m.diff, 0)}
                <span className="text-[8px] font-bold text-gray-400 ml-0.5">元</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 曲线本体：双 Y 轴，功率实线 + SOC 虚线 */}
      <div className="px-1 pt-2">
        <div className="h-[190px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={points} margin={{ top: 6, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EFF2F5" />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 8, fill: '#9CA3AF' }}
                axisLine={{ stroke: '#EAEDF2' }}
                tickLine={false}
                interval={15}
              />
              <YAxis
                yAxisId="left"
                domain={['auto', 'auto']}
                tick={{ fontSize: 8, fill: '#9CA3AF' }}
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
              <ReferenceLine yAxisId="left" y={0} stroke="#D5DBE2" />
              <Line
                yAxisId="left"
                type="stepAfter"
                dataKey="real"
                stroke="#94A3B8"
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
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 24h 电价档位色带：曲线与色带对齐即可看出电量搬去了哪个价位 */}
      <div className="px-3 pt-1.5 pb-2 space-y-1">
        <div className="flex h-2.5 rounded overflow-hidden border border-gray-100">
          {TY_TOU_SEGMENTS.map((seg) => (
            <div
              key={seg.slot}
              style={{ width: `${100 / 96}%`, background: TIER_META[seg.tier].color }}
            />
          ))}
        </div>
        <div className="flex items-center justify-between text-[8px] text-gray-400 font-bold">
          <span>00:00</span>
          <span>06:00</span>
          <span>12:00</span>
          <span>18:00</span>
          <span>24:00</span>
        </div>
      </div>

      {/* 图例：小程序无悬停，四条线 + 电价档位全部常驻 */}
      <div className="px-3 pb-2 flex flex-wrap items-center gap-x-3 gap-y-1">
        {[
          { color: '#94A3B8', label: T.legend.realPower, solid: true },
          { color: C.blue, label: T.legend.simPower, solid: true },
          { color: '#CBD5E1', label: T.legend.realSoc, solid: false },
          { color: C.amber, label: T.legend.simSoc, solid: false },
        ].map((it) => (
          <span key={it.label} className="flex items-center gap-1 text-[8px] text-gray-500 font-bold">
            <span
              className="w-3.5 h-0.5 rounded-full"
              style={
                it.solid
                  ? { background: it.color }
                  : { backgroundImage: `repeating-linear-gradient(90deg, ${it.color} 0 3px, transparent 3px 5px)` }
              }
            />
            {it.label}
          </span>
        ))}
        <span className="flex items-center gap-1 text-[8px] text-gray-500 font-bold">
          <span className="w-1.5 h-1.5 rounded-xs" style={{ background: TIER_META.peak.color }} />
          峰
          <span className="w-1.5 h-1.5 rounded-xs ml-1" style={{ background: TIER_META.flat.color }} />
          平
          <span className="w-1.5 h-1.5 rounded-xs ml-1" style={{ background: TIER_META.valley.color }} />
          谷
        </span>
        <span className="text-[8px] text-gray-400 font-bold">功率 {T.powerNote}</span>
      </div>

      {/* 底部读数：与日粒度表格同口径 */}
      <div className="px-3 py-2 border-t border-gray-50 bg-slate-50/50 space-y-0.5">
        <div className="text-[9px] text-gray-500 font-bold">
          {T.footLabels.charge} {T.footLabels.real}
          <span className="font-mono font-black text-gray-800"> {fmt(kwh('real', 'charge'), 1)}</span>
          {' / '}
          {T.footLabels.sim}
          <span className="font-mono font-black text-gray-800"> {fmt(kwh('sim', 'charge'), 1)}</span> kWh
        </div>
        <div className="text-[9px] text-gray-500 font-bold">
          {T.footLabels.discharge} {T.footLabels.real}
          <span className="font-mono font-black text-gray-800"> {fmt(kwh('real', 'discharge'), 1)}</span>
          {' / '}
          {T.footLabels.sim}
          <span className="font-mono font-black text-gray-800"> {fmt(kwh('sim', 'discharge'), 1)}</span> kWh
        </div>
        <div className="text-[8px] text-gray-400 font-bold pt-0.5">{T.socNote}</div>
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

  /** 收益构成柱图：实际运行 → AI 策略仿真（储能 / 光伏分项） */
  const barData = [
    { name: '实际运行', 储能: TY_SIM_KPI.storage.real, 光伏: TY_SIM_KPI.pv.real },
    { name: 'AI 策略仿真', 储能: TY_SIM_KPI.storage.sim, 光伏: TY_SIM_KPI.pv.sim },
  ];

  /** 案例日对照行：把「储能充电量 (kWh)」「储能收益 (元)」统一拆成 名称 + 单位 两段 */
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
        <span className="text-[13px] font-black text-gray-900">天盈 AI 仿真报告</span>
        <span className="w-6" />
      </div>

      <div className="flex-1 overflow-y-auto bg-[#f6f7f9]">
        {/* ==================== 报告头 ==================== */}
        <div className="relative bg-gradient-to-br from-emerald-600 via-teal-500 to-cyan-500 px-4 pt-4 pb-5 overflow-hidden">
          <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/10" />
          <div className="absolute -right-2 top-10 w-16 h-16 rounded-full bg-white/10" />
          <div className="relative">
            <div className="flex items-center gap-1.5">
              <BrainCircuit className="w-4 h-4 text-white" />
              <span className="text-[10px] font-black text-white/90 tracking-wide">TIANYING AI SIMULATION</span>
            </div>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <h1 className="text-[19px] font-black text-white tracking-tight">天盈 AI 仿真报告</h1>
              <span className="text-[9px] font-black text-emerald-700 bg-white px-1.5 py-0.5 rounded-md">
                AI 策略预评估
              </span>
            </div>
            <p className="text-[9px] text-white/85 font-bold mt-1.5">
              {TY_META.station} · {TY_META.region} · {TY_META.periodLabel} · {TY_META.version}
            </p>

            {/* 核心结论条 */}
            <div className="mt-3 rounded-2xl bg-white/15 border border-white/25 px-3 py-2.5 backdrop-blur-xs">
              <div className="text-[9px] text-white/75 font-bold">基于站点历史负荷与光伏数据回算</div>
              <div className="flex items-baseline gap-1.5 mt-1 flex-wrap">
                <span className="text-[24px] font-black font-mono text-white leading-none">
                  +{fmt(TY_SIM_DELTA.net, 0)}
                </span>
                <span className="text-[10px] text-white/80 font-bold">元 / 月</span>
                <span className="text-[10px] font-black font-mono text-emerald-800 bg-white px-1.5 py-0.5 rounded-md ml-0.5">
                  提升 {fmt(TY_SIM_DELTA.liftPct, 1)}%
                </span>
              </div>
              <div className="text-[9px] text-white/80 font-bold mt-1.5">
                总收益 {fmt(TY_SIM_KPI.total.real, 0)} 元 → {fmt(TY_SIM_KPI.total.sim, 0)} 元（全月口径）
              </div>
            </div>

            {/* 增量主来源 */}
            <div className="mt-2 rounded-2xl bg-white/15 border border-white/25 px-3 py-2.5">
              <div className="text-[9px] text-white/75 font-bold">增量主来源</div>
              <div className="flex items-center gap-1.5 mt-1">
                <Battery className="w-3.5 h-3.5 text-white shrink-0" />
                <span className="text-[11px] font-black text-white">储能收益</span>
                <span className="text-[12px] font-black font-mono text-emerald-800 bg-white px-1.5 py-0.5 rounded-md">
                  {fmtSigned(TY_SIM_DELTA.storageDiff, 0)}
                </span>
              </div>
              <div className="text-[9px] text-white/80 font-bold mt-1">
                光伏收益 {fmtSigned(TY_SIM_DELTA.pvDiff, 0)}（消纳率已高位）
              </div>
            </div>
          </div>
        </div>

        <div className="px-3 pb-8 -mt-2 space-y-3">
          {/* ==================== 第 1 章 仿真收益对比 ==================== */}
          <Chapter no="1" title="仿真收益对比" hint="实际运行基准 vs AI 策略仿真">
            {/* 收益构成柱图 */}
            <div className="rounded-xl border border-gray-100 px-2.5 pt-2.5 pb-1.5 mb-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-gray-700">收益构成（元/月）</span>
                <span className="flex items-center gap-2">
                  <span className="flex items-center gap-1 text-[8px] text-gray-500 font-bold">
                    <span className="w-1.5 h-1.5 rounded-xs" style={{ background: C.blue }} />
                    储能
                  </span>
                  <span className="flex items-center gap-1 text-[8px] text-gray-500 font-bold">
                    <span className="w-1.5 h-1.5 rounded-xs" style={{ background: C.green }} />
                    光伏
                  </span>
                </span>
              </div>
              <div className="h-[124px] mt-1">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} margin={{ top: 16, right: 6, left: -14, bottom: 0 }} barGap={10}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EFF2F5" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 9, fill: '#7F8C8D' }}
                      axisLine={{ stroke: '#EAEDF2' }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 8, fill: '#9CA3AF' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v: number) => `${Math.round(v / 1000)}k`}
                    />
                    <ReferenceLine y={0} stroke="#EAEDF2" />
                    <Bar dataKey="储能" fill={C.blue} radius={[3, 3, 0, 0]} maxBarSize={30}>
                      <LabelList
                        dataKey="储能"
                        position="top"
                        style={{ fontSize: 8, fill: '#5A6B7C', fontWeight: 700 }}
                        formatter={(v: any) => fmt(Number(v), 0)}
                      />
                    </Bar>
                    <Bar dataKey="光伏" fill={C.green} radius={[3, 3, 0, 0]} maxBarSize={30}>
                      <LabelList
                        dataKey="光伏"
                        position="top"
                        style={{ fontSize: 8, fill: '#5A6B7C', fontWeight: 700 }}
                        formatter={(v: any) => fmt(Number(v), 0)}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 逐项对照：电量类 / 收益类 上下堆叠（web 端为左右并排） */}
            <BlockTitle>逐项对照：实际运行 → AI 策略仿真</BlockTitle>
            <div className="space-y-2.5">
              {SIM_GROUPS.map((g) => {
                const rows = TY_SIM_ROWS.filter((r) => r.group === g);
                return (
                  <div key={g} className="rounded-xl border border-gray-100 overflow-hidden">
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50/70 border-b border-gray-100">
                      <span className="w-0.5 h-2.5 rounded-full bg-[#1E9C7E]" />
                      <span className="text-[10px] font-black text-gray-600">{g}</span>
                    </div>
                    <CompareTable rows={rows} totalKey={g === '收益类' ? '总收益' : undefined} />

                    {/* 收益类下方接增量归因（与 web 端同位置） */}
                    {g === '收益类' && (
                      <div className="border-t border-gray-100 bg-slate-50/70 px-2.5 py-2">
                        <div className="text-[9px] font-black text-gray-400 mb-1">增量来源</div>
                        <div className="space-y-1">
                          {TY_SIM_WHY.map((w) => (
                            <div key={w.title}>
                              <div className="flex items-baseline gap-1.5">
                                <span className="text-[9px] text-gray-400 font-bold">{w.no}</span>
                                <span className="text-[10px] font-black text-gray-600">{w.title}</span>
                                <span
                                  className="text-[10px] font-black font-mono"
                                  style={{ color: w.tone === 'up' ? C.red : C.green }}
                                >
                                  {w.amount}
                                </span>
                              </div>
                              <p className="text-[9px] text-gray-400 font-bold leading-snug mt-0.5 pl-3.5">
                                {w.brief}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* 电价口径 */}
            <div className="rounded-xl border border-gray-100 p-2.5 mt-3">
              <div className="flex items-center gap-1.5 mb-2">
                <Zap className="w-3 h-3 text-amber-500" />
                <span className="text-[10px] font-black text-gray-700">电价口径</span>
                <span className="text-[8px] text-gray-400 font-bold">两侧同价，差异来自时段结构</span>
              </div>

              <div className="space-y-1.5">
                {TY_PRICE.tou.map((t) => (
                  <div
                    key={t.key}
                    className="rounded-lg border border-gray-100 px-2.5 py-1.5 flex items-start justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="text-[10px] font-black text-gray-700">购电 · {t.label}段</div>
                      <div className="text-[8px] text-gray-400 font-bold mt-0.5">{t.window}</div>
                    </div>
                    <span className="text-[11px] font-black font-mono text-gray-900 shrink-0">
                      {fmt(t.price, 4)}
                      <span className="text-[8px] font-bold text-gray-400 ml-0.5">元/kWh</span>
                    </span>
                  </div>
                ))}

                <div className="rounded-lg bg-slate-50 border border-gray-100 px-2.5 py-1.5 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-black text-gray-700">售电电价（余电上网）</div>
                    <div className="text-[8px] text-gray-400 font-bold mt-0.5">两侧同价</div>
                  </div>
                  <span className="text-[11px] font-black font-mono text-gray-900">
                    {fmt(TY_PRICE.salePrice, 4)}
                    <span className="text-[8px] font-bold text-gray-400 ml-0.5">元/kWh</span>
                  </span>
                </div>

                {TY_PRICE_COMPARE.map((it) => {
                  const diff = it.sim - it.real;
                  const pct = (diff / it.real) * 100;
                  const up = diff > 0;
                  return (
                    <div key={it.label} className="rounded-lg bg-slate-50 border border-gray-100 px-2.5 py-1.5">
                      <div className="text-[9px] font-black text-gray-500">{it.label}</div>
                      <div className="flex items-baseline gap-1 mt-0.5 flex-wrap">
                        <span className="text-[10px] font-mono text-gray-400">{fmt(it.real, it.dec)}</span>
                        <ChevronRight className="w-2.5 h-2.5 text-gray-300 self-center" />
                        <span className="text-[11px] font-black font-mono text-gray-900">
                          {fmt(it.sim, it.dec)}
                        </span>
                        <span className="text-[8px] font-bold text-gray-400">元/kWh</span>
                        <span
                          className="text-[9px] font-black font-mono ml-auto"
                          style={{ color: up ? C.red : C.green }}
                        >
                          {up ? '提升' : '降低'} {fmt(Math.abs(diff), it.dec)}（{up ? '+' : '-'}
                          {fmt(Math.abs(pct), 1)}%）
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <p className="text-[8px] text-gray-400 font-bold leading-relaxed mt-2">{TY_PRICE.note}</p>
            </div>
          </Chapter>

          {/* ==================== 第 2 章 典型日分析 ==================== */}
          <Chapter no="2" title="典型日分析" hint="案例日逐项对照与判读">
            {/* 案例日切换 */}
            <div className="grid grid-cols-3 gap-1.5 mb-3">
              {TY_CASE_DAYS.map((d, i) => (
                <button
                  key={d.date}
                  id={`btn_case_day_${i}`}
                  onClick={() => setCaseIdx(i)}
                  className={`py-1.5 rounded-lg border text-center transition-colors ${
                    i === caseIdx
                      ? 'bg-[#1E9C7E] border-[#1E9C7E] text-white'
                      : 'bg-white border-gray-200 text-gray-600'
                  }`}
                >
                  <span className="text-[10px] font-black font-mono block leading-tight">
                    {d.date.slice(5)}
                  </span>
                  <span
                    className={`text-[8px] font-bold block leading-tight ${
                      i === caseIdx ? 'text-white/85' : 'text-gray-400'
                    }`}
                  >
                    {d.tag}
                  </span>
                </button>
              ))}
            </div>

            {/* 逐 15min 双轴曲线 */}
            <CaseDayCurve
              points={TY_CASE_CURVES[caseDay.date] ?? []}
              date={caseDay.date}
              metrics={[
                { label: '当日储能收益差', diff: caseDay.storageDiff },
                { label: '当日总收益差', diff: caseDay.totalDiff },
              ]}
            />

            {/* 案例日对照表 */}
            <div className="rounded-xl border border-gray-100 overflow-hidden mt-3">
              <CompareTable rows={caseRows} />
            </div>

            {/* 判读要点 */}
            <div className="rounded-xl bg-slate-50 border border-gray-100 px-3 py-2.5 mt-3">
              <div className="text-[9px] font-black text-gray-400 mb-1">判读要点</div>
              <p className="text-[10px] text-gray-600 font-bold leading-relaxed">{caseDay.reading}</p>
            </div>
          </Chapter>

          {/* ==================== 口径说明 ==================== */}
          <div className="flex items-start gap-2 rounded-2xl bg-white border border-gray-100 px-3 py-2.5">
            <Info className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
            <p className="text-[9px] text-gray-500 font-bold leading-relaxed">
              <span className="font-black text-gray-600">报告口径：</span>
              {TY_META.caliberNote}
            </p>
          </div>

          {/* ==================== 未开通：开通入口（对应 web 弹窗 showActivateHint） ==================== */}
          <AnimatePresence>
            {aiStatus === 'not_activated' && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 px-3.5 py-3"
              >
                <div className="flex items-start gap-2">
                  <Rocket className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-[11px] font-black text-gray-900">
                      以上为售前仿真测算结果，可多创收 {fmt(TY_SIM_DELTA.net, 0)} 元 / 月
                    </div>
                    <p className="text-[9px] text-gray-500 font-bold mt-1 leading-relaxed">
                      开通试用后，本页将切换为「实测 AI 轨迹 vs 后台基线仿真」的真实对比口径，
                      数据全部来自站点实际运行；试用期内可随时退出。
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                  {['免审批自动开通', '无需改造设备', '试用期随时退出'].map((t) => (
                    <span key={t} className="flex items-center gap-1 text-[8px] text-emerald-700 font-bold">
                      <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                      {t}
                    </span>
                  ))}
                </div>
                <AiActivationCta
                  scope="sim"
                  className="mt-2.5"
                  onTrial={() => onSetAiStatus?.('trial')}
                  onActivate={() => onSetAiStatus?.('activated')}
                />
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
                  <span className="text-[11px] font-black text-gray-900 block">查看本月经营分析报告</span>
                  <span className="text-[9px] text-gray-400 font-bold">
                    仿真收益与真实运行数据的对照分析
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300" />
            </button>
          )}

          <div className="flex items-center justify-center gap-1.5 pt-1">
            <Sparkles className="w-3 h-3 text-emerald-500" />
            <span className="text-[9px] text-gray-400 font-bold">
              <CalendarClock className="w-3 h-3 inline -mt-0.5 mr-0.5" />
              与 web 端《天盈 AI 仿真报告》同源 · {TY_META.version}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TianyingSimPage;
