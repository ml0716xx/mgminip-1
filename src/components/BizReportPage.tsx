/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 经营分析报告（小程序端）
 * 按线上小程序截图还原结构：
 *   一、月度经营总览（基本信息 / 电量收益环图 / 微网供电量 / 微网用电量）
 *   1.1 光伏发电量&收益
 *   1.2 储能充放电量&收益
 *   1.3 充电桩充电量&收益
 *   二、指标分析（2.1 光伏消纳率 / 2.2 度电成本）
 *   三、AI 策略分析（新增，按未开通/试运行/正式运行三态差异展示）
 */

import React, { useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Calendar,
  Sun,
  Battery,
  Landmark,
  Plug,
  Factory,
  Zap,
  Gauge,
  BrainCircuit,
  Sparkles,
  Lock,
  ArrowRight,
  TrendingUp,
  BadgeCheck,
  Timer,
  Info,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BUSINESS_REPORT, AI_STRATEGY_CONTENT } from '../data/businessReportData';
import { AiActivationStatus, AI_STATUS_META } from '../data/overviewData';

interface BizReportPageProps {
  onBack: () => void;
  aiStatus?: AiActivationStatus;
}

// ==================== 通用件 ====================
const ChapterTitle: React.FC<{ index?: string; title: string; accent?: string }> = ({
  index,
  title,
  accent = 'bg-emerald-500',
}) => (
  <div className="flex items-center gap-2 mb-2.5">
    {index && (
      <span className={`text-[11px] font-black text-white ${accent} px-1.5 py-0.5 rounded`}>{index}</span>
    )}
    <h2 className="text-[13px] font-black text-gray-900 tracking-tight">{title}</h2>
  </div>
);

const SubTitle: React.FC<{ title: string; unit?: string }> = ({ title, unit }) => (
  <div className="flex items-center justify-between mb-1">
    <span className="text-[11px] font-black text-gray-800">{title}</span>
    {unit && <span className="text-[9px] text-gray-400 font-bold">{unit}</span>}
  </div>
);

/** 分析文字块 */
const AnalysisBlock: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="mt-3 bg-emerald-50/50 border border-emerald-100/70 rounded-xl p-3">
    <div className="flex items-center gap-1.5 mb-1.5">
      <span className="w-1 h-3 bg-emerald-500 rounded-xs" />
      <span className="text-[10px] font-black text-emerald-700">分析</span>
    </div>
    <p className="text-[10px] text-gray-600 leading-relaxed">{children}</p>
  </div>
);

/** 供电/用电 图标卡 */
const IconStatCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  unit?: string;
  color: string;
  bg: string;
}> = ({ icon, label, value, unit, color, bg }) => (
  <div className="flex items-center gap-2.5">
    <div className={`w-9 h-9 rounded-xl ${bg} ${color} flex items-center justify-center shrink-0`}>{icon}</div>
    <div className="min-w-0">
      <span className="text-[9px] text-gray-400 font-bold block truncate">{label}</span>
      <div className="flex items-baseline gap-0.5">
        <span className={`text-[14px] font-black font-mono ${color}`}>{value}</span>
        {unit && <span className="text-[9px] text-gray-400 font-bold">{unit}</span>}
      </div>
    </div>
  </div>
);

/** 图表容器 */
const ChartBox: React.FC<{ height?: number; children: React.ReactNode }> = ({
  height = 180,
  children,
}) => (
  <div className="w-full" style={{ height }}>
    <ResponsiveContainer width="100%" height="100%">
      {children as React.ReactElement}
    </ResponsiveContainer>
  </div>
);

const ChartLegend: React.FC<{ items: { color: string; label: string; dashed?: boolean }[] }> = ({ items }) => (
  <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 mt-2">
    {items.map((it) => (
      <span key={it.label} className="flex items-center gap-1 text-[9px] text-gray-500 font-bold">
        {it.dashed ? (
          <span className="w-3 h-0 border-t-2 border-dashed" style={{ borderColor: it.color }} />
        ) : (
          <span className="w-2 h-2 rounded-xs" style={{ backgroundColor: it.color }} />
        )}
        {it.label}
      </span>
    ))}
  </div>
);

const axisProps = {
  tick: { fontSize: 9, fill: '#9CA3AF' },
  tickLine: false,
} as const;

// ==================== 三、AI 策略分析 ====================
const AiStrategySection: React.FC<{ status: AiActivationStatus; onSwitch: (s: AiActivationStatus) => void }> = ({
  status,
  onSwitch,
}) => {
  const c = AI_STRATEGY_CONTENT;
  const meta = AI_STATUS_META[status];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-3.5 shadow-xs">
      <ChapterTitle index="三" title="AI 策略分析" accent="bg-emerald-600" />

      {/* 当前开通状态 */}
      <div className="flex items-center justify-between mb-3">
        <span
          className={`inline-flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-full border ${meta.badgeClass}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${meta.dotClass}`} />
          AI 策略 · {meta.label}
        </span>
        {/* 演示用状态切换（PRD 原型） */}
        <div className="flex items-center gap-0.5 bg-gray-100/80 p-0.5 rounded-lg">
          {(['not_activated', 'trial', 'activated'] as AiActivationStatus[]).map((s) => (
            <button
              key={s}
              onClick={() => onSwitch(s)}
              className={`px-1.5 py-1 rounded-md text-[9px] font-bold transition-all ${
                status === s ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-400'
              }`}
            >
              {AI_STATUS_META[s].label}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={status}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
        >
          {/* ---------- 未开通 ---------- */}
          {status === 'not_activated' && (
            <div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">
                <div className="w-11 h-11 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mx-auto text-slate-400">
                  <Lock className="w-5 h-5" />
                </div>
                <p className="text-[12px] font-black text-slate-700 mt-2.5">AI 策略暂未开通</p>
                <p className="text-[10px] text-gray-500 leading-relaxed mt-1.5">
                  开通后可获得 AI 智能全景协同调度：基于分时电价与光伏出力预测自动生成充放电策略，
                  在负电价与限电指令下主动避险、自动增收益。
                </p>
                <button className="mt-3 w-full py-2 rounded-xl bg-emerald-500 text-white text-[11px] font-black flex items-center justify-center gap-1 active:scale-[0.99] transition-transform">
                  联系开通 AI 策略
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
              {/* 能力预览（灰态） */}
              <div className="grid grid-cols-2 gap-2 mt-3">
                {[
                  { label: '预计收益提升', value: '15.5%', icon: <TrendingUp className="w-3.5 h-3.5" /> },
                  { label: '光伏消纳率提升', value: '+8.9pp', icon: <Sun className="w-3.5 h-3.5" /> },
                  { label: '度电成本下降', value: '0.072元', icon: <Gauge className="w-3.5 h-3.5" /> },
                  { label: '限电止损增收', value: '2140元', icon: <Sparkles className="w-3.5 h-3.5" /> },
                ].map((it) => (
                  <div key={it.label} className="rounded-xl bg-slate-50 border border-slate-100 p-2.5">
                    <div className="flex items-center gap-1 text-slate-400">
                      {it.icon}
                      <span className="text-[9px] font-bold">{it.label}</span>
                    </div>
                    <span className="text-[15px] font-black font-mono text-slate-400 block mt-1">{it.value}</span>
                  </div>
                ))}
              </div>
              <p className="text-[9px] text-gray-400 mt-2 text-center">
                以上为开通前的能力预估区间，实际以运行数据为准
              </p>
            </div>
          )}

          {/* ---------- 试运行 ---------- */}
          {status === 'trial' && (
            <div>
              <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3 flex items-start gap-2">
                <Timer className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[10px] text-amber-800 leading-relaxed">
                  当前处于<b>试运行期</b>，AI 策略收益与优化指标为<b>仿真估算值</b>，
                  待正式运行后按实际结算数据统计。
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-3">
                {[
                  { label: 'AI 策略月收益（估算）', value: c.aiRevenueWan, unit: '万元', color: 'text-amber-600' },
                  { label: '较基准策略提升', value: `+${c.improvementRate}`, unit: '%', color: 'text-amber-600' },
                  { label: 'AI 运行时长占比', value: c.dutyRate, unit: '%', color: 'text-gray-900' },
                  { label: '度电成本下降', value: c.perKwhSaving, unit: '元/kWh', color: 'text-gray-900' },
                ].map((it) => (
                  <div key={it.label} className="rounded-xl bg-amber-50/40 border border-amber-100 p-2.5">
                    <span className="text-[9px] text-gray-500 font-bold block leading-tight">{it.label}</span>
                    <div className="flex items-baseline gap-0.5 mt-1">
                      <span className={`text-[15px] font-black font-mono ${it.color}`}>{it.value}</span>
                      <span className="text-[8px] text-gray-400 font-bold">{it.unit}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3 rounded-xl border border-amber-200 bg-white p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <div>
                    <span className="text-[10px] font-black text-gray-800 block">限电止损（增值特性）</span>
                    <span className="text-[9px] text-gray-400 font-bold">负电价时段光伏入储，减少偏差考核</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[14px] font-black font-mono text-amber-600">
                    +¥{c.curtailmentStopLoss.toLocaleString()}
                  </span>
                  <span className="text-[8px] text-amber-500 font-bold block">估算</span>
                </div>
              </div>
            </div>
          )}

          {/* ---------- 正式运行 ---------- */}
          {status === 'activated' && (
            <div>
              <div className="rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 p-3.5 text-white">
                <div className="flex items-center gap-1.5">
                  <BadgeCheck className="w-4 h-4" />
                  <span className="text-[10px] font-black opacity-90">AI 策略月收益</span>
                </div>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-[26px] font-black font-mono leading-none">{c.aiRevenueWan}</span>
                  <span className="text-[11px] font-bold opacity-90">万元</span>
                </div>
                <div className="flex items-center gap-3 mt-2.5 pt-2.5 border-t border-white/25">
                  <span className="text-[9px] font-bold opacity-90">基准策略 {c.baselineRevenueWan} 万元</span>
                  <span className="text-[9px] font-black bg-white/20 px-1.5 py-0.5 rounded-full">
                    AI 提升 +{c.improvementWan} 万元 · +{c.improvementRate}%
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-3">
                {[
                  { label: 'AI 运行时长占比', value: c.dutyRate, unit: '%', sub: `${c.dutyHours}h` },
                  { label: 'AI 收益贡献占比', value: c.contributionRate, unit: '%', sub: '占总收益' },
                  { label: '度电成本下降', value: c.perKwhSaving, unit: '元/kWh', sub: '对比原始成本' },
                  { label: '光伏消纳率提升', value: `+8.9`, unit: 'pp', sub: '较基准策略' },
                ].map((it) => (
                  <div key={it.label} className="rounded-xl bg-gray-50 border border-gray-100 p-2.5">
                    <span className="text-[9px] text-gray-500 font-bold block leading-tight">{it.label}</span>
                    <div className="flex items-baseline gap-0.5 mt-1">
                      <span className="text-[15px] font-black font-mono text-gray-900">{it.value}</span>
                      <span className="text-[8px] text-gray-400 font-bold">{it.unit}</span>
                    </div>
                    <span className="text-[8px] text-gray-400 font-bold">{it.sub}</span>
                  </div>
                ))}
              </div>

              {/* 增值特性：限电止损 */}
              <div className="mt-3 rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50/60 p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-gray-800 flex items-center gap-1">
                      限电止损
                      <span className="text-[8px] font-black text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-full border border-amber-200">
                        增值特性
                      </span>
                    </span>
                    <span className="text-[9px] text-gray-500 font-bold">负电价 / 限电指令下的主动避险收益</span>
                  </div>
                </div>
                <span className="text-[15px] font-black font-mono text-amber-600 shrink-0">
                  +¥{c.curtailmentStopLoss.toLocaleString()}
                </span>
              </div>

              <AnalysisBlock>
                本月度 AI 策略累计运行 {c.dutyHours} 小时，运行时长占比 {c.dutyRate}%，综合收益较基准策略提升{' '}
                {c.improvementRate}%（+{c.improvementWan} 万元）。其中限电止损作为增值特性，
                在负电价与限电指令时段主动将光伏余电导入储能，避免逆功率罚款与负电价上网损失，
                单月增收 {c.curtailmentStopLoss.toLocaleString()} 元。
              </AnalysisBlock>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

// ==================== 主页面 ====================
export const BizReportPage: React.FC<BizReportPageProps> = ({ onBack, aiStatus = 'activated' }) => {
  const [status, setStatus] = useState<AiActivationStatus>(aiStatus);
  const r = BUSINESS_REPORT;
  const days = r.days;

  const pvChart = days.map((d) => ({
    x: `${d.day}`,
    gen: d.pvGen,
    rev: d.pvRevenue,
  }));
  const essChart = days.map((d) => ({
    x: `${d.day}`,
    charge: d.essCharge,
    discharge: d.essDischarge,
    rev: d.essRevenue,
  }));
  const evChart = days.map((d) => ({ x: `${d.day}`, charge: d.evCharge, rev: d.evRevenue }));
  const absorbChart = days.map((d) => ({
    x: `${d.day}`,
    gen: d.pvGen,
    selfUse: d.pvSelfUse,
    rate: d.absorptionRate,
  }));
  const costChart = days.map((d) => ({
    x: `${d.day}`,
    load: d.loadUse,
    grid: d.gridUse,
    raw: d.rawCost,
    saved: d.savedCost,
  }));

  const pieData = [
    { name: '光伏收益', value: r.pvRevenueWan, color: '#10B981' },
    { name: '储能收益', value: r.essRevenueYuan / 10000, color: '#3B82F6' },
    { name: '充电收益', value: r.evRevenueYuan, color: '#F59E0B' },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* 顶部导航 */}
      <div className="flex items-center justify-between px-3 py-2.5 bg-white border-b border-gray-100 shrink-0">
        <button onClick={onBack} id="btn_biz_back" className="p-1 text-gray-600 active:text-emerald-500">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="text-[13px] font-black text-gray-900">经营分析报告</span>
        <span className="w-6" />
      </div>

      <div className="flex-1 overflow-y-auto bg-[#f6f7f9]">
        {/* 头图 + 报告信息 */}
        <div className="relative bg-gradient-to-br from-emerald-600 to-teal-500 px-4 pt-4 pb-5">
          <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-15">
            <svg viewBox="0 0 120 120" className="w-full h-full">
              <g stroke="#fff" strokeWidth="1.5" fill="none">
                <rect x="10" y="30" width="42" height="26" rx="2" />
                <path d="M10 43h42M24 30v26M38 30v26" />
                <rect x="62" y="30" width="42" height="26" rx="2" />
                <path d="M62 43h42M76 30v26M90 30v26" />
                <rect x="36" y="72" width="42" height="26" rx="2" />
                <path d="M36 85h42M50 72v26M64 72v26" />
              </g>
            </svg>
          </div>
          <div className="relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 bg-white/20 rounded-full px-2 py-1">
                <Calendar className="w-3 h-3 text-white" />
                <span className="text-[10px] font-black text-white font-mono">{r.month}</span>
              </div>
              <span className="text-[9px] text-white/80 font-bold">
                报告统计周期：{r.periodStart} ~ {r.periodEnd}
              </span>
            </div>
            <h1 className="text-[20px] font-black text-white mt-3 tracking-tight">{r.month}经营分析报告</h1>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[10px] font-black text-white bg-white/20 px-2 py-0.5 rounded-full">
                {r.station}
              </span>
              <span className="text-[10px] font-bold text-white/90">孚瑞克森汽车部件有限公司</span>
            </div>
          </div>
        </div>

        <div className="px-3 pb-8 -mt-2 space-y-3">
          {/* 目录 */}
          <div className="bg-white rounded-2xl border border-gray-100 p-3.5 shadow-xs">
            <div className="flex items-center gap-1.5 mb-2.5">
              <span className="w-1 h-3.5 bg-emerald-500 rounded-xs" />
              <h2 className="text-[12px] font-black text-gray-900">目录</h2>
            </div>
            <div className="space-y-1.5">
              {[
                '一、月度经营总览',
                '1.1 光伏发电量&收益',
                '1.2 储能充放电量&收益',
                '1.3 充电桩充电量&收益',
                '二、指标分析',
                '2.1 光伏消纳率',
                '2.2 度电成本',
                '三、AI 策略分析',
              ].map((t) => (
                <div key={t} className="flex items-center gap-2 text-[10px] text-gray-600 font-bold">
                  <span className="w-1 h-1 rounded-full bg-emerald-400" />
                  {t}
                </div>
              ))}
            </div>
          </div>

          {/* ===== 一、月度经营总览 ===== */}
          <div className="bg-white rounded-2xl border border-gray-100 p-3.5 shadow-xs">
            <ChapterTitle index="一" title="月度经营总览" />

            {/* 基本信息 */}
            <div className="rounded-xl bg-gray-50 border border-gray-100 p-3">
              <span className="text-[10px] font-black text-gray-700 block mb-1.5">基本信息</span>
              <p className="text-[10px] text-gray-600 leading-relaxed">
                {r.site}光伏装机容量为 {r.pvCapacity} MWp，安装逆变器 {r.inverterCount} 台。储能装机容量为{' '}
                {r.essCapacity} MWh，安装储能 {r.essCount} 台。安装充电桩 {r.evCount} 台。
              </p>
            </div>

            {/* 电量收益环图 */}
            <div className="mt-3">
              <SubTitle title="电量收益" />
              <div className="flex items-center gap-2">
                <div className="w-[132px] h-[132px] relative shrink-0">
                  <ChartBox height={132}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={60}
                        paddingAngle={2}
                        stroke="none"
                      >
                        {pieData.map((p) => (
                          <Cell key={p.name} fill={p.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ChartBox>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[8px] text-gray-400 font-bold">总收益</span>
                    <span className="text-[15px] font-black font-mono text-gray-900 leading-tight">
                      {r.totalRevenueWan}
                    </span>
                    <span className="text-[8px] text-gray-400 font-bold">万元</span>
                  </div>
                </div>
                <div className="flex-1 space-y-2">
                  {[
                    { label: '光伏收益', value: `${r.pvRevenueWan} 万元`, color: '#10B981' },
                    { label: '储能收益', value: `${r.essRevenueYuan.toLocaleString()} 元`, color: '#3B82F6' },
                    { label: '充电收益', value: `${r.evRevenueYuan} 元`, color: '#F59E0B' },
                  ].map((it) => (
                    <div key={it.label} className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-xs shrink-0" style={{ backgroundColor: it.color }} />
                      <span className="text-[10px] text-gray-500 font-bold flex-1">{it.label}</span>
                      <span className="text-[10px] font-black font-mono text-gray-800">{it.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 微网供电量 */}
            <div className="mt-4">
              <SubTitle title="微网供电量" unit="单位：kWh" />
              <div className="grid grid-cols-3 gap-2">
                <IconStatCard
                  icon={<Sun className="w-4 h-4" />}
                  label="光伏发电量"
                  value={`${r.supply.pvGenWan}万`}
                  color="text-amber-600"
                  bg="bg-amber-50"
                />
                <IconStatCard
                  icon={<Battery className="w-4 h-4" />}
                  label="储能放电量"
                  value={`${r.supply.essDischargeWan}万`}
                  color="text-emerald-600"
                  bg="bg-emerald-50"
                />
                <IconStatCard
                  icon={<Landmark className="w-4 h-4" />}
                  label="电网下网电量"
                  value={`${r.supply.gridImportWan}万`}
                  color="text-sky-600"
                  bg="bg-sky-50"
                />
              </div>
            </div>

            {/* 微网用电量 */}
            <div className="mt-3">
              <SubTitle title="微网用电量" unit="单位：kWh" />
              <div className="grid grid-cols-2 gap-2.5">
                <IconStatCard
                  icon={<Zap className="w-4 h-4" />}
                  label="上网电量"
                  value={`${r.consumption.gridExportWan}万`}
                  color="text-orange-500"
                  bg="bg-orange-50"
                />
                <IconStatCard
                  icon={<Battery className="w-4 h-4" />}
                  label="储能充电量"
                  value={`${r.consumption.essChargeWan}万`}
                  color="text-violet-600"
                  bg="bg-violet-50"
                />
                <IconStatCard
                  icon={<Factory className="w-4 h-4" />}
                  label="负载用电量"
                  value={`${r.consumption.loadUseWan}万`}
                  color="text-gray-700"
                  bg="bg-gray-100"
                />
                <IconStatCard
                  icon={<Plug className="w-4 h-4" />}
                  label="充电桩充电量"
                  value={`${r.consumption.evChargeWan}`}
                  color="text-cyan-600"
                  bg="bg-cyan-50"
                />
              </div>
            </div>
          </div>

          {/* ===== 1.1 光伏发电量&收益 ===== */}
          <div className="bg-white rounded-2xl border border-gray-100 p-3.5 shadow-xs">
            <ChapterTitle index="1.1" title="光伏发电量&收益" />
            <SubTitle title="电量 (kWh) / 收益 (元)" />
            <ChartBox>
              <ComposedChart data={pvChart} margin={{ top: 10, right: 2, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="x" {...axisProps} axisLine={{ stroke: '#E5E7EB' }} />
                <YAxis yAxisId="l" {...axisProps} axisLine={false} />
                <YAxis yAxisId="r" orientation="right" {...axisProps} axisLine={false} />
                <ReferenceLine
                  yAxisId="l"
                  y={r.pvAnalysis.avgDaily}
                  stroke="#10B981"
                  strokeDasharray="4 3"
                  label={{ value: `日均 ${r.pvAnalysis.avgDaily}`, fontSize: 8, fill: '#10B981', position: 'insideTopRight' }}
                />
                <ReferenceLine
                  yAxisId="r"
                  y={r.pvAnalysis.monthRevenueWan * 10000 / 30}
                  stroke="#3B82F6"
                  strokeDasharray="4 3"
                  label={{ value: '日均收益 2326.71', fontSize: 8, fill: '#3B82F6', position: 'insideBottomRight' }}
                />
                <Bar yAxisId="l" dataKey="gen" fill="#10B981" radius={[3, 3, 0, 0]} maxBarSize={10} />
                <Line yAxisId="r" type="monotone" dataKey="rev" stroke="#3B82F6" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ChartBox>
            <ChartLegend
              items={[
                { color: '#10B981', label: '发电量(kWh)' },
                { color: '#3B82F6', label: '收益(元)' },
                { color: '#10B981', label: '日均发电量', dashed: true },
                { color: '#3B82F6', label: '日均收益', dashed: true },
              ]}
            />
            <AnalysisBlock>
              本项目电站光伏装机容量为 {r.pvCapacity} MWp，{r.month}光伏月总发电量为{' '}
              {r.pvAnalysis.monthGenWan} 万kWh，平均每日发电量为 {r.pvAnalysis.avgDaily} kWh，当年累计年发电量为{' '}
              {r.pvAnalysis.yearGenWan} 万kWh。月总收益为 {r.pvAnalysis.monthRevenueWan} 万元，其中自用收益{' '}
              {r.pvAnalysis.selfUseWan} 万元，上网收益 {r.pvAnalysis.gridFeedWan} 万元。
            </AnalysisBlock>
          </div>

          {/* ===== 1.2 储能充放电量&收益 ===== */}
          <div className="bg-white rounded-2xl border border-gray-100 p-3.5 shadow-xs">
            <ChapterTitle index="1.2" title="储能充放电量&收益" />
            <SubTitle title="电量 (kWh) / 收益 (元)" />
            <ChartBox>
              <ComposedChart data={essChart} margin={{ top: 10, right: 2, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="x" {...axisProps} axisLine={{ stroke: '#E5E7EB' }} />
                <YAxis yAxisId="l" {...axisProps} axisLine={false} />
                <YAxis yAxisId="r" orientation="right" {...axisProps} axisLine={false} />
                <Bar yAxisId="l" dataKey="charge" fill="#8B5CF6" radius={[3, 3, 0, 0]} maxBarSize={10} />
                <Bar yAxisId="l" dataKey="discharge" fill="#F0ABFC" radius={[3, 3, 0, 0]} maxBarSize={10} />
                <Line yAxisId="r" type="monotone" dataKey="rev" stroke="#10B981" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ChartBox>
            <ChartLegend
              items={[
                { color: '#8B5CF6', label: '充电量(kWh)' },
                { color: '#F0ABFC', label: '放电量(kWh)' },
                { color: '#10B981', label: '储能收益(元)' },
              ]}
            />
            <AnalysisBlock>
              本项目{r.month}储能月总充电量为 {r.essAnalysis.monthChargeWan} 万kWh，月总放电量为{' '}
              {r.essAnalysis.monthDischargeWan} 万kWh，累计年总充电量 {r.essAnalysis.yearChargeWan} 万kWh，年总放电量{' '}
              {r.essAnalysis.yearDischargeWan} 万kWh。月总收益为 {r.essAnalysis.monthRevenueYuan.toLocaleString()} 元。
            </AnalysisBlock>
          </div>

          {/* ===== 1.3 充电桩充电量&收益 ===== */}
          <div className="bg-white rounded-2xl border border-gray-100 p-3.5 shadow-xs">
            <ChapterTitle index="1.3" title="充电桩充电量&收益" />
            <SubTitle title="电量 (kWh) / 收益 (元)" />
            <ChartBox>
              <ComposedChart data={evChart} margin={{ top: 10, right: 2, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="x" {...axisProps} axisLine={{ stroke: '#E5E7EB' }} />
                <YAxis yAxisId="l" {...axisProps} axisLine={false} />
                <YAxis yAxisId="r" orientation="right" {...axisProps} axisLine={false} />
                <Bar yAxisId="l" dataKey="charge" fill="#3B82F6" radius={[3, 3, 0, 0]} maxBarSize={10} />
                <Line yAxisId="r" type="monotone" dataKey="rev" stroke="#10B981" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ChartBox>
            <ChartLegend
              items={[
                { color: '#3B82F6', label: '充电量(kWh)' },
                { color: '#10B981', label: '充电收益(元)' },
              ]}
            />
            <AnalysisBlock>
              本项目{r.month}充电桩月总充电量为 {r.evAnalysis.monthCharge} kWh，累计年总充电量 {r.evAnalysis.yearCharge}{' '}
              kWh，月总收益为 -- 元。
            </AnalysisBlock>
          </div>

          {/* ===== 二、指标分析 ===== */}
          <div className="bg-white rounded-2xl border border-gray-100 p-3.5 shadow-xs">
            <ChapterTitle index="二" title="指标分析" />

            <SubTitle title="2.1 光伏消纳率" unit="电量 (kWh) / 消纳率 (%)" />
            <ChartBox>
              <ComposedChart data={absorbChart} margin={{ top: 10, right: 2, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="x" {...axisProps} axisLine={{ stroke: '#E5E7EB' }} />
                <YAxis yAxisId="l" {...axisProps} axisLine={false} />
                <YAxis yAxisId="r" orientation="right" domain={[0, 100]} {...axisProps} axisLine={false} />
                <Bar yAxisId="l" dataKey="selfUse" fill="#3B82F6" radius={[3, 3, 0, 0]} maxBarSize={10} />
                <Bar yAxisId="l" dataKey="gen" fill="#10B981" radius={[3, 3, 0, 0]} maxBarSize={10} />
                <Line yAxisId="r" type="monotone" dataKey="rate" stroke="#2563EB" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ChartBox>
            <ChartLegend
              items={[
                { color: '#3B82F6', label: '自发自用电量(kWh)' },
                { color: '#10B981', label: '发电量(kWh)' },
                { color: '#2563EB', label: '消纳率(%)' },
              ]}
            />
            <AnalysisBlock>
              本月度，光伏总发电量 {r.absorption.monthGenWan} 万kWh，光伏自用电量 {r.absorption.selfUseWan} 万kWh，
              本月光伏消纳率为 {r.absorption.rate}%。
            </AnalysisBlock>

            <div className="mt-4 pt-4 border-t border-gray-50">
              <SubTitle title="2.2 度电成本" unit="电量 (kWh) / 成本 (元/kWh)" />
              <ChartBox>
                <ComposedChart data={costChart} margin={{ top: 10, right: 2, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="x" {...axisProps} axisLine={{ stroke: '#E5E7EB' }} />
                  <YAxis yAxisId="l" {...axisProps} axisLine={false} />
                  <YAxis yAxisId="r" orientation="right" domain={[0, 1]} {...axisProps} axisLine={false} />
                  <Bar yAxisId="l" dataKey="load" fill="#3B82F6" radius={[3, 3, 0, 0]} maxBarSize={10} />
                  <Bar yAxisId="l" dataKey="grid" fill="#10B981" radius={[3, 3, 0, 0]} maxBarSize={10} />
                  <Line
                    yAxisId="r"
                    type="monotone"
                    dataKey="raw"
                    stroke="#2563EB"
                    strokeWidth={2}
                    strokeDasharray="4 3"
                    dot={false}
                  />
                  <Line yAxisId="r" type="monotone" dataKey="saved" stroke="#F59E0B" strokeWidth={2} dot={false} />
                </ComposedChart>
              </ChartBox>
              <ChartLegend
                items={[
                  { color: '#3B82F6', label: '负载总用电量(kWh)' },
                  { color: '#10B981', label: '电网用电量(kWh)' },
                  { color: '#2563EB', label: '原始度电成本', dashed: true },
                  { color: '#F59E0B', label: '节约后度电成本' },
                ]}
              />
              <AnalysisBlock>
                本月度，总用电量 {r.cost.totalUseWan} 万kWh，其中电网用电电量 {r.cost.gridUseWan} 万kWh，
                原始用电成本 {r.cost.rawCost} 元/kWh，使用光储系统后，用电成本为 {r.cost.savedCost} 元/kWh，
                共节约 {r.cost.savingWan} 万元。
              </AnalysisBlock>
            </div>
          </div>

          {/* ===== 三、AI 策略分析 ===== */}
          <AiStrategySection status={status} onSwitch={setStatus} />

          <p className="text-[9px] text-gray-400 text-center pt-1">
            报告由天合富家智能微网平台自动生成 · 数据口径以结算单为准
          </p>
        </div>
      </div>
    </div>
  );
};

export default BizReportPage;
