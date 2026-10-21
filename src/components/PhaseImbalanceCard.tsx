/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 四、三相不平衡治理 · 经营分析报告卡片（小程序端）
 * --------------------------------------------------------------------------
 * 与 web 用户端 components/PhaseImbalanceValueAdd.tsx 同源同口径，按 395px 手机壳重排：
 *   ① 小结头：当月累计节约电费（大数）+ 释放电量 / 释放裕量 / 有效治理天数，
 *      副行给防逆流阈值、平均不平衡度的治理前后对比，再带累计治理时长
 *   ② 逐日明细：柱（释放电量）+ 线（节约电费），双轴
 *   ③ 分析 + 口径说明
 *
 * 为什么不拆成三张卡：小程序页面本来就长，这一段只有两个数要记，
 * 拆开之后「阈值 30→10」和「¥1,986」隔了屏，读者对不上账。
 */

import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { Info, Zap } from 'lucide-react';
import {
  PHASE_CONFIG,
  PHASE_COLOR,
  phaseMonth,
  phaseMonthDaily,
  phaseReleaseMax,
} from '../data/phaseImbalanceData';

const axisProps = {
  tick: { fontSize: 9, fill: '#9CA3AF' },
  tickLine: false,
} as const;

/** 小结头里的一个小指标：标签 + 数值，宽度不够就省略标签 */
const HeadStat: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="min-w-0">
    <div className="text-[8px] text-white/50 font-bold truncate">{label}</div>
    <div className="mt-0.5 text-[11px] font-black font-mono leading-none whitespace-nowrap">{children}</div>
  </div>
);

const Unit: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="text-[7px] font-bold text-white/50 ml-1">{children}</span>
);

export const PhaseImbalanceCard: React.FC = () => {
  const cfg = PHASE_CONFIG;
  const release = phaseReleaseMax(cfg);

  /* 月度数据按阈值现算，不在文件里写死；阈值一下发，这里自动跟着变 */
  const month = phaseMonth(release);
  const daily = phaseMonthDaily(release);

  /* 未启用：给空态，不整段删掉 —— 否则客户不知道还有这个能力 */
  if (!cfg.on) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-3.5 shadow-xs">
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] font-black text-white bg-emerald-500 px-1.5 py-0.5 rounded">四</span>
            <h2 className="text-[13px] font-black text-gray-900 tracking-tight">三相不平衡治理</h2>
          </div>
          <span className="text-[9px] text-gray-400 font-bold truncate">增值服务 · 防逆流边界收益</span>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-6 flex flex-col items-center gap-1.5">
          <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400">
            <Zap className="w-4 h-4" />
          </div>
          <span className="text-[11px] font-black text-slate-500">三相不平衡治理未启用</span>
          <p className="text-[9px] text-slate-400 leading-relaxed text-center">
            启用后储能按三相独立出力，压降防逆流边界，可释放被单相逆流吃掉的容量。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-3.5 shadow-xs">
      {/* 标题行与页面其余章节同版式，右侧挂一句副标题 */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-black text-white bg-emerald-500 px-1.5 py-0.5 rounded">四</span>
          <h2 className="text-[13px] font-black text-gray-900 tracking-tight">三相不平衡治理</h2>
        </div>
        <span className="text-[9px] text-gray-400 font-bold truncate">增值服务 · 防逆流边界收益</span>
      </div>

      {/* ① 小结头：四个数，只说结论 */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#3B1F3F] via-[#4A2545] to-[#17705A] px-3 py-3 text-white">
        <div className="absolute -right-6 -top-8 w-28 h-28 rounded-full bg-fuchsia-400/10 blur-2xl" />
        <div className="relative">
          <div className="flex items-center gap-1 text-[9px] text-[#F0C4E8] font-black">
            <Zap className="w-2.5 h-2.5" />
            三相不平衡治理 · 本月边界收益
          </div>

          <div className="mt-1.5">
            <div className="text-[8px] text-white/55 font-bold">当月累计节约电费</div>
            <div className="mt-0.5 flex items-baseline gap-1">
              <span className="text-[24px] font-black font-mono leading-none tracking-tight">
                ¥{month.totalSaving.toLocaleString()}
              </span>
              <span className="text-[9px] text-white/60 font-bold">元</span>
            </div>
          </div>

          <div className="mt-2.5 grid grid-cols-3 gap-1.5">
            <HeadStat label="释放电量">
              {month.totalEnergy.toFixed(0)}
              <Unit>kWh</Unit>
            </HeadStat>
            <HeadStat label="释放功率裕量">
              {release.toFixed(0)}
              <Unit>kW</Unit>
            </HeadStat>
            <HeadStat label="有效治理">
              {month.activeDays}
              <Unit>天</Unit>
            </HeadStat>
          </div>

          {/* 治理前后对照：这两个数不报出来，上面的钱就没有参照 */}
          <div className="mt-2.5 pt-2.5 border-t border-white/15 grid grid-cols-3 gap-1.5">
            <HeadStat label="防逆流阈值">
              {cfg.baseline}
              <span className="text-[#F0C4E8] mx-1">→</span>
              {cfg.current}
              <Unit>kW</Unit>
            </HeadStat>
            <HeadStat label="平均不平衡度">
              {month.avgUbBefore}%
              <span className="text-[#9DECD3] mx-1">→</span>
              {month.avgUbAfter}%
            </HeadStat>
            <HeadStat label="累计治理时长">
              {month.totalHours.toFixed(0)}
              <Unit>h</Unit>
            </HeadStat>
          </div>
        </div>
      </div>

      {/* ② 逐日明细 */}
      <div className="mt-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] font-black text-gray-800">逐日释放电量 &amp; 节约电费</span>
          <span className="text-[9px] text-gray-400 font-bold">kWh / 元</span>
        </div>
        <div className="w-full" style={{ height: 160 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={daily} margin={{ top: 8, right: 2, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis
                dataKey="day"
                {...axisProps}
                axisLine={{ stroke: '#E5E7EB' }}
                /* 30 天塞进 285px，隔 4 天取一个刻度才不打架 */
                interval={4}
              />
              <YAxis yAxisId="l" {...axisProps} axisLine={false} />
              {/* 右轴是电费，单位不同必须单独一根；但手机宽度下 5 个刻度和左轴一模一样，
                  看着像复制错，只留 3 个刻度做参照 */}
              <YAxis yAxisId="r" orientation="right" tickCount={3} {...axisProps} axisLine={false} />
              <Bar
                yAxisId="l"
                dataKey="energy"
                fill={PHASE_COLOR.energy}
                radius={[2, 2, 0, 0]}
                maxBarSize={8}
              />
              <Line
                yAxisId="r"
                type="monotone"
                dataKey="saving"
                stroke={PHASE_COLOR.ub}
                strokeWidth={1.6}
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 mt-1.5">
          {[
            { color: PHASE_COLOR.energy, label: '释放电量(kWh)' },
            { color: PHASE_COLOR.ub, label: '节约电费(元)' },
          ].map((it) => (
            <span key={it.label} className="flex items-center gap-1 text-[9px] text-gray-500 font-bold">
              <span className="w-2 h-2 rounded-xs" style={{ backgroundColor: it.color }} />
              {it.label}
            </span>
          ))}
        </div>
      </div>

      {/* ③ 分析 */}
      <div className="mt-3 bg-emerald-50/50 border border-emerald-100/70 rounded-xl p-3">
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="w-1 h-3 bg-emerald-500 rounded-xs" />
          <span className="text-[10px] font-black text-emerald-700">分析</span>
        </div>
        <p className="text-[10px] text-gray-600 leading-relaxed">
          收益不是每天都一样。阴天光伏出力不足、储能不动，防逆流边界碰不到，当天就没有额外收益 ——
          全月 30 天里真正吃到裕量的只有 {month.activeDays} 天，其余接近 0。
        </p>
      </div>

      {/* ④ 口径 */}
      <div className="mt-2 flex items-start gap-1.5">
        <Info className="w-3 h-3 text-gray-300 shrink-0 mt-0.5" />
        <p className="text-[9px] text-gray-400 leading-relaxed">
          <span className="font-bold text-gray-500">口径说明：</span>
          以 1 分钟为统计周期，仅在储能充放电、且关口总下网功率低于治理前阈值时核算收益。
          单周期节省功率 = min(治理前阈值 − 关口总下网功率, 最大释放裕量)，节省电量 = 节省功率 × 1/60 h，
          再按该分钟分时电价折算电费，全月逐分钟累加。
        </p>
      </div>
    </div>
  );
};

export default PhaseImbalanceCard;
