/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 天盈 AI 仿真报告（小程序端）
 * 由消息页「天盈 AI 仿真报告已生成」推送点击进入。
 * 结构与策略运行报告口径对齐：核心结论 → 关键指标 → 日度对比 → 结论建议。
 */

import React, { useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import {
  ChevronLeft,
  BrainCircuit,
  Sparkles,
  TrendingUp,
  Sun,
  Gauge,
  Timer,
  CalendarClock,
  ShieldCheck,
  ChevronRight,
  Info,
} from 'lucide-react';
import { motion } from 'motion/react';
import { TIANYING_REPORT } from '../data/overviewData';

interface TianyingSimPageProps {
  onBack: () => void;
  onOpenBizReport?: () => void;
}

const SectionTitle: React.FC<{ title: string; accent?: string; extra?: React.ReactNode }> = ({
  title,
  accent = 'bg-emerald-500',
  extra,
}) => (
  <div className="flex items-center justify-between mb-3">
    <div className="flex items-center gap-1.5">
      <span className={`w-1 h-3.5 ${accent} rounded-xs`} />
      <h3 className="text-xs font-black text-gray-900 tracking-tight">{title}</h3>
    </div>
    {extra}
  </div>
);

export const TianyingSimPage: React.FC<TianyingSimPageProps> = ({ onBack, onOpenBizReport }) => {
  const r = TIANYING_REPORT;
  const [showAll, setShowAll] = useState(false);

  const chartData = r.days.map((d) => ({
    x: `${d.day}`,
    baseline: d.baseline,
    ai: d.aiSim,
  }));

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
        {/* 品牌头图 */}
        <div className="relative bg-gradient-to-br from-emerald-600 via-teal-500 to-cyan-500 px-4 pt-4 pb-5 overflow-hidden">
          <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/10" />
          <div className="absolute -right-2 top-10 w-16 h-16 rounded-full bg-white/10" />
          <div className="relative">
            <div className="flex items-center gap-1.5">
              <BrainCircuit className="w-4 h-4 text-white" />
              <span className="text-[10px] font-black text-white/90 tracking-wide">TIANYING AI SIMULATION</span>
            </div>
            <h1 className="text-[20px] font-black text-white mt-2 tracking-tight">
              {r.month}天盈 AI 仿真报告
            </h1>
            <p className="text-[10px] text-white/85 font-bold mt-1.5 leading-relaxed">
              基于本月实际工况与气象数据，对 AI 智能全景协同策略进行全月回测推演，
              并与基准策略逐日对比。
            </p>
            <div className="flex items-center gap-2 mt-3">
              <span className="flex items-center gap-1 text-[9px] font-black text-white bg-white/20 px-2 py-1 rounded-full">
                <CalendarClock className="w-3 h-3" />
                {r.generatedAt} 生成
              </span>
              <span className="flex items-center gap-1 text-[9px] font-black text-emerald-700 bg-white px-2 py-1 rounded-full">
                <Sparkles className="w-3 h-3" />
                仿真回测完成
              </span>
            </div>
          </div>
        </div>

        <div className="px-3 pb-8 -mt-2 space-y-3">
          {/* 核心结论 */}
          <div className="bg-white rounded-2xl border border-gray-100 p-3.5 shadow-xs">
            <SectionTitle title="核心结论" />
            <div className="rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 p-3.5 text-white">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black opacity-90">AI 策略仿真总收益</span>
                <span className="text-[9px] font-black bg-white/20 px-2 py-0.5 rounded-full">
                  基准策略 {(r.baselineRevenue / 10000).toFixed(2)} 万元
                </span>
              </div>
              <div className="flex items-baseline gap-1 mt-1.5">
                <span className="text-[28px] font-black font-mono leading-none">
                  {(r.aiSimRevenue / 10000).toFixed(2)}
                </span>
                <span className="text-[11px] font-bold opacity-90">万元</span>
              </div>
              <div className="flex items-center gap-3 mt-3 pt-2.5 border-t border-white/25">
                <span className="flex items-center gap-1 text-[10px] font-black">
                  <TrendingUp className="w-3.5 h-3.5" />
                  提升 +{(r.improvement / 10000).toFixed(2)} 万元
                </span>
                <span className="text-[10px] font-black bg-white/20 px-1.5 py-0.5 rounded-full">
                  +{r.improvementRate}%
                </span>
              </div>
            </div>

            {/* 关键指标 */}
            <div className="grid grid-cols-2 gap-2 mt-3">
              {[
                {
                  icon: <Sun className="w-3.5 h-3.5" />,
                  label: '光伏消纳率',
                  value: r.absorptionRate,
                  unit: '%',
                  sub: `较基准 +${r.absorptionImprovement}pp`,
                  color: 'text-amber-600',
                  bg: 'bg-amber-50',
                },
                {
                  icon: <Gauge className="w-3.5 h-3.5" />,
                  label: '综合度电成本',
                  value: r.perKwhCost,
                  unit: '元/kWh',
                  sub: `下降 ${r.perKwhSaving} 元`,
                  color: 'text-emerald-600',
                  bg: 'bg-emerald-50',
                },
                {
                  icon: <Timer className="w-3.5 h-3.5" />,
                  label: 'AI 运行时长',
                  value: r.dutyHours,
                  unit: 'h',
                  sub: `全月 ${r.aiRunningDays} 天`,
                  color: 'text-violet-600',
                  bg: 'bg-violet-50',
                },
                {
                  icon: <Sparkles className="w-3.5 h-3.5" />,
                  label: '限电止损增收',
                  value: '2140',
                  unit: '元',
                  sub: '增值特性',
                  color: 'text-orange-500',
                  bg: 'bg-orange-50',
                },
              ].map((it) => (
                <div key={it.label} className="rounded-xl bg-gray-50 border border-gray-100 p-2.5">
                  <div className={`flex items-center gap-1 ${it.color}`}>
                    {it.icon}
                    <span className="text-[9px] font-bold text-gray-500">{it.label}</span>
                  </div>
                  <div className="flex items-baseline gap-0.5 mt-1">
                    <span className={`text-[15px] font-black font-mono ${it.color}`}>{it.value}</span>
                    <span className="text-[8px] text-gray-400 font-bold">{it.unit}</span>
                  </div>
                  <span className="text-[8px] text-gray-400 font-bold">{it.sub}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 日度收益对比 */}
          <div className="bg-white rounded-2xl border border-gray-100 p-3.5 shadow-xs">
            <SectionTitle
              title="日收益对比 · 基准 vs AI 仿真"
              extra={<span className="text-[9px] text-gray-400 font-bold">单位：元</span>}
            />
            <div className="h-[186px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 8, right: 4, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis
                    dataKey="x"
                    tick={{ fontSize: 9, fill: '#9CA3AF' }}
                    axisLine={{ stroke: '#E5E7EB' }}
                    tickLine={false}
                  />
                  <YAxis tick={{ fontSize: 9, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <Bar dataKey="baseline" fill="#94A3B8" radius={[3, 3, 0, 0]} maxBarSize={9} />
                  <Bar dataKey="ai" fill="#10B981" radius={[3, 3, 0, 0]} maxBarSize={9} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-4 mt-2">
              {[
                { color: '#94A3B8', label: '基准策略收益' },
                { color: '#10B981', label: 'AI 仿真收益' },
              ].map((it) => (
                <span key={it.label} className="flex items-center gap-1 text-[9px] text-gray-500 font-bold">
                  <span className="w-2 h-2 rounded-xs" style={{ backgroundColor: it.color }} />
                  {it.label}
                </span>
              ))}
            </div>
            <div className="flex items-center justify-center mt-2">
              <button
                onClick={() => setShowAll((v) => !v)}
                className="flex items-center gap-1 text-[10px] font-black text-emerald-600"
              >
                {showAll ? '收起' : `查看全部 ${r.aiRunningDays} 天明细`}
                <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showAll ? 'rotate-90' : ''}`} />
              </button>
            </div>

            {/* 明细表 */}
            {showAll && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="overflow-hidden mt-2"
              >
                <div className="border-t border-gray-50 pt-2">
                  <div className="grid grid-cols-4 text-[9px] font-black text-gray-400 px-1 pb-1.5">
                    <span>日期</span>
                    <span className="text-right">基准收益</span>
                    <span className="text-right">AI 仿真</span>
                    <span className="text-right">提升</span>
                  </div>
                  {r.days.map((d) => {
                    const diff = d.aiSim - d.baseline;
                    return (
                      <div key={d.day} className="grid grid-cols-4 text-[10px] py-1 border-t border-gray-50 px-1">
                        <span className="text-gray-600 font-bold">{d.day}日</span>
                        <span className="text-right font-mono text-gray-500">{d.baseline}</span>
                        <span className="text-right font-mono text-emerald-600 font-bold">{d.aiSim}</span>
                        <span className="text-right font-mono text-emerald-600 font-black">
                          +{diff}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </div>

          {/* 结论与建议 */}
          <div className="bg-white rounded-2xl border border-gray-100 p-3.5 shadow-xs">
            <SectionTitle title="结论与建议" accent="bg-emerald-600" />
            <div className="space-y-2">
              {[
                { icon: <ShieldCheck className="w-4 h-4" />, text: `AI 策略全月仿真收益较基准提升 ${r.improvementRate}%，主要来自光伏消纳率提升与储能套利优化。`, color: 'text-emerald-600 bg-emerald-50' },
                { icon: <Sparkles className="w-4 h-4" />, text: '限电止损为增值特性：负电价时段自动将光伏余电导入储能，避免逆功率考核，建议开启。', color: 'text-amber-600 bg-amber-50' },
                { icon: <Info className="w-4 h-4" />, text: '仿真结果为算法推演值，实际收益以正式运行后的结算数据为准。', color: 'text-sky-600 bg-sky-50' },
              ].map((it, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${it.color}`}>
                    {it.icon}
                  </div>
                  <p className="text-[10px] text-gray-600 leading-relaxed pt-0.5">{it.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 跳转经营分析报告 */}
          {onOpenBizReport && (
            <button
              onClick={onOpenBizReport}
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

          <p className="text-[9px] text-gray-400 text-center pt-1">
            天盈 AI 仿真引擎 · 多时间尺度滚动优化 · 数据更新于 {r.generatedAt}
          </p>
        </div>
      </div>
    </div>
  );
};

export default TianyingSimPage;
