/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import { MonthReport, DailyData } from '../types';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  LabelList,
} from 'recharts';
import { motion } from 'motion/react';
import { Maximize2, X, Sparkles, Lock } from 'lucide-react';
import { AiActivationStatus } from '../data/overviewData';
import { AiActivationCta, AiUpgradeCta } from './AiActivationCta';

interface ChartProps {
  report: MonthReport;
  /** AI 策略开通状态：未开通 / 试运行 / 正式运行 */
  aiStatus?: AiActivationStatus;
  /** 开通状态变更（未开通态的「开通试用／开通正式」按钮） */
  onSetAiStatus?: (s: AiActivationStatus) => void;
}

// 拖拽刚结束的时间戳（用于抑制拖拽后的误触发点击）
let lastDragEndAt = 0;

// 每天占用的横向宽度（px），决定拖动总宽度与首屏可见天数（约 10~12 天）
const DAY_WIDTH = 32;

// ==================== 通用：可拖拽横向滚动区（鼠标按住拖动 / 触摸原生滑动） ====================
const DragScrollArea: React.FC<{ minWidth: number; children: React.ReactNode }> = ({ minWidth, children }) => {
  const elRef = useRef<HTMLDivElement>(null);
  const drag = useRef({ down: false, sx: 0, sl: 0, moved: 0 });

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // 触摸设备走原生横向滚动，只处理鼠标左键拖拽
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    drag.current = { down: true, sx: e.clientX, sl: elRef.current?.scrollLeft ?? 0, moved: 0 };
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current.down || !elRef.current) return;
    const dx = e.clientX - drag.current.sx;
    drag.current.moved = Math.abs(dx);
    elRef.current.scrollLeft = drag.current.sl - dx;
  };
  const onPointerUp = () => {
    if (drag.current.down && drag.current.moved > 6) lastDragEndAt = Date.now();
    drag.current.down = false;
  };

  return (
    <div
      ref={elRef}
      className="overflow-x-auto scrollbar-none -ml-2 cursor-grab active:cursor-grabbing select-none"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
    >
      <div style={{ minWidth: `${minWidth}px` }} className="h-full">
        {children}
      </div>
    </div>
  );
};

// ==================== 通用：X 轴刻度（AI 日绿色标记） ====================
const DayTick = (props: any) => {
  const { x, y, payload, hasAi } = props;
  const dayNum = parseInt(payload.value);
  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={0} dy={12} textAnchor="middle" fill={hasAi ? '#10B981' : '#94a3b8'} fontSize={8} fontWeight={hasAi ? 700 : 500}>
        {dayNum}
      </text>
      {hasAi && <circle cx={0} cy={17} r={1.2} fill="#10B981" />}
    </g>
  );
};

// ==================== 通用：横屏全屏容器 ====================
const FullscreenChartModal: React.FC<{
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
}> = ({ title, subtitle, onClose, children }) => (
  <div className="fixed inset-0 bg-slate-950/95 z-50 flex items-center justify-center">
    <div className="relative bg-white w-screen h-screen landscape:w-screen landscape:h-screen portrait:rotate-90 portrait:w-[100vh] portrait:h-[100vw] flex flex-col transition-all duration-300">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-30 p-2 bg-slate-200 text-slate-700 rounded-full transition-all"
      >
        <X className="w-5 h-5 stroke-[2.5]" />
      </button>
      <div className="px-6 pt-5 pb-2 flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2.5 h-5 bg-emerald-500 rounded-xs" />
          <h3 className="text-base font-black text-slate-900">{title}</h3>
        </div>
        {subtitle && <p className="text-[10px] text-slate-400 font-bold mb-2">{subtitle}</p>}
        <div className="flex-1 min-h-0 flex flex-col">{children}</div>
      </div>
    </div>
  </div>
);

// ==================== 通用：页内详情面板（非弹窗，原地展开） ====================
const DayDetailPanel: React.FC<{
  title: string;
  aiRunning?: boolean;
  rows: { label: string; value: React.ReactNode; strong?: boolean; colorClass?: string }[];
}> = ({ title, aiRunning, rows }) => (
  <motion.div
    initial={{ opacity: 0, height: 0 }}
    animate={{ opacity: 1, height: 'auto' }}
    exit={{ opacity: 0, height: 0 }}
    transition={{ duration: 0.2 }}
    className="overflow-hidden"
  >
    <div className="mt-2 bg-slate-50 rounded-xl border border-slate-100 p-3">
      <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-200/70">
        <span className="text-[10px] font-black text-slate-700">{title} · 当日详情</span>
        {aiRunning !== undefined && (
          <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${aiRunning ? 'text-emerald-600 bg-emerald-50' : 'text-slate-400 bg-slate-100'}`}>
            {aiRunning ? 'AI 运行' : 'AI 未运行'}
          </span>
        )}
      </div>
      <div className="space-y-1">
        {rows.map((r, i) => (
          <div key={i} className="flex items-center justify-between text-[10px]">
            <span className="text-slate-500 font-bold">{r.label}</span>
            <span className={`font-mono ${r.strong ? 'font-black' : 'font-bold'} ${r.colorClass || 'text-slate-700'}`}>{r.value}</span>
          </div>
        ))}
      </div>
    </div>
  </motion.div>
);

// ==================== 通用：图表卡片（拖动滑动 + 横屏放大） ====================
interface ChartCardProps {
  accentClass: string;
  title: string;
  badge: string;
  /** 额外的强调徽标（如「增值特性」单独标记） */
  extraBadge?: React.ReactNode;
  legends: { color: string; label: string; dashed?: boolean }[];
  onOpenFullscreen?: () => void;
  children: React.ReactNode;
}

const SwipeChartCard: React.FC<ChartCardProps> = ({ accentClass, title, badge, extraBadge, legends, onOpenFullscreen, children }) => (
  <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-2xs">
    {/* Header */}
    <div className="flex items-center justify-between mb-2.5">
      <div className="flex items-center gap-1.5 min-w-0">
        <span className={`w-2.5 h-4 ${accentClass} rounded-xs shrink-0`} />
        <h3 className="text-xs font-black text-slate-800 tracking-tight truncate">{title}</h3>
        {extraBadge}
      </div>
      <span className="text-[9px] font-extrabold px-1.5 py-0.5 bg-slate-50 text-slate-500 border border-slate-100 rounded-full shrink-0">
        {badge}
      </span>
    </div>

    {/* Legends */}
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[9px] text-slate-500 font-bold mb-2 border-b border-slate-50 pb-2">
      {legends.map((l, i) => (
        <div key={i} className="flex items-center gap-1">
          {l.dashed ? (
            <span className="w-3 h-0 border-t-2 border-dashed" style={{ borderColor: l.color }} />
          ) : (
            <span className="w-2.5 h-2.5 rounded-[2px]" style={{ backgroundColor: l.color }} />
          )}
          <span>{l.label}</span>
        </div>
      ))}
    </div>

    {/* 图表内容（可拖拽横向滑动） */}
    {children}

    {/* 底部控制条 */}
    <div className="mt-2.5 pt-2 border-t border-slate-50 flex items-center justify-between">
      <span className="text-[9px] text-slate-400 font-bold flex items-center gap-1">
        <span>🖱️</span>
        <span>按住图表左右拖动查看全月 · 点击柱形锁定当日详情</span>
      </span>
      {onOpenFullscreen && (
        <button
          onClick={onOpenFullscreen}
          className="p-1.5 bg-slate-100 rounded-lg text-slate-500 transition-colors flex items-center gap-1 shrink-0"
          title="横屏全屏展示"
        >
          <Maximize2 className="w-3.5 h-3.5" />
          <span className="text-[10px] font-bold">横屏</span>
        </button>
      )}
    </div>
  </div>
);

// 未选中日的提示条
const SelectHint = () => (
  <div className="mt-2 flex items-center justify-center gap-1 text-[9px] text-slate-400 font-bold">
    <span>👆</span>
    <span>点击柱形锁定当日详情 · 再次点击取消</span>
  </div>
);

// 差值标签（AI 日柱顶 +差值）
const DiffLabel = (props: any) => {
  const { x, y, width, value, index, data } = props;
  if (!value || value <= 0) return null;
  const hasAi = data && data[index] && data[index].hasAi;
  if (!hasAi) return null;
  return (
    <text x={x + width / 2} y={y - 4} textAnchor="middle" fill="#059669" fontSize={7} fontWeight={800}>
      +{value}
    </text>
  );
};

// 图表点击选中某天（toggle；拖拽后的抬起点不触发）
const useDaySelect = () => {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const handleChartClick = (state: any, data: { day: string }[]) => {
    if (Date.now() - lastDragEndAt < 150) return; // 刚拖拽完，忽略误触点击
    let dayStr: string | undefined = state?.activeLabel;
    if (!dayStr && typeof state?.activeTooltipIndex === 'number' && data) {
      dayStr = data[state.activeTooltipIndex]?.day;
    }
    if (!dayStr) return;
    const n = parseInt(dayStr);
    setSelectedDay((prev) => (prev === n ? null : n));
  };
  return { selectedDay, handleChartClick };
};

// ==================== CHART 1: 日收益对比 ====================
export const RevenueComparisonChart: React.FC<ChartProps> = ({ report }) => {
  const { selectedDay, handleChartClick } = useDaySelect();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const daily = report.dailyList;

  const buildData = (days: DailyData[]) =>
    days.map((d) => ({
      day: `${d.day}日`,
      hasAi: d.isAiRunning,
      simulatedRevenue: d.compRevenue,
      aiRevenue: d.aiRevenue,
    }));

  const sd = daily.find((d) => d.day === selectedDay);

  const buildChart = (data: ReturnType<typeof buildData>, heightClass: string) => (
    <DragScrollArea minWidth={Math.max(320, data.length * DAY_WIDTH)}>
      <div className={heightClass}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 14, right: 4, left: 0, bottom: 0 }}
            barGap={1}
            barCategoryGap="28%"
            onClick={(state: any) => handleChartClick(state, data)}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EAEDF2" />
            <XAxis
              dataKey="day"
              axisLine={{ stroke: '#EAEDF2' }}
              tickLine={false}
              interval={0}
              tick={(props: any) => <DayTick {...props} hasAi={data[(props as any).index]?.hasAi} />}
            />
            <YAxis
              axisLine={{ stroke: '#EAEDF2' }}
              tickLine={false}
              tick={{ fill: '#7F8C8D', fontSize: 9 }}
              tickFormatter={(val) => (val >= 1000 ? `${(val / 1000).toFixed(1)}k` : `${val}`)}
              width={34}
            />
            <Bar dataKey="simulatedRevenue" name="模拟策略收益" fill="#3B82F6" fillOpacity={0.85} radius={[2, 2, 0, 0]} barSize={7} />
            <Bar dataKey="aiRevenue" name="当日实际收益" fill="#10B981" radius={[2, 2, 0, 0]} barSize={7} isAnimationActive={false}>
              <LabelList content={<DiffLabel data={data} />} />
            </Bar>
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </DragScrollArea>
  );

  const buildBody = (days: DailyData[], fullscreen = false) => {
    const data = buildData(days);
    return (
      <>
        {buildChart(data, fullscreen ? 'h-full' : 'h-[220px]')}
        {sd ? (
          <DayDetailPanel
            title={`${sd.day}日 · 收益`}
            aiRunning={sd.isAiRunning}
            rows={[
              { label: '模拟策略收益 (基准)', value: `¥${sd.compRevenue.toLocaleString()}` },
              { label: '当日实际收益', value: `¥${sd.aiRevenue.toLocaleString()}`, strong: true, colorClass: 'text-emerald-600' },
              ...(sd.isAiRunning
                ? [
                    {
                      label: '实际提升',
                      value: `+¥${(sd.aiRevenue - sd.compRevenue).toLocaleString()} (+${(((sd.aiRevenue - sd.compRevenue) / sd.compRevenue) * 100).toFixed(1)}%)`,
                      strong: true,
                      colorClass: 'text-emerald-600',
                    },
                  ]
                : [{ label: '实际提升', value: '—（当日未运行 AI）', colorClass: 'text-slate-400' }]),
            ]}
          />
        ) : (
          <SelectHint />
        )}
      </>
    );
  };

  return (
    <>
      <SwipeChartCard
        accentClass="bg-blue-500"
        title="本月运行策略收益统计"
        badge="日收益对比"
        legends={[
          { color: '#3B82F6', label: '模拟策略收益 (基准)' },
          { color: '#10B981', label: '当日实际收益' },
        ]}
        onOpenFullscreen={() => setIsFullscreen(true)}
      >
        {buildBody(daily)}
      </SwipeChartCard>
      {isFullscreen && (
        <FullscreenChartModal title="本月运行策略收益统计 (完整 31 天)" subtitle="蓝色 = 模拟基准 · 绿色 = 当日实际 · 柱顶绿色 = 差值 · 按住拖动查看全月" onClose={() => setIsFullscreen(false)}>
          {buildBody(daily, true)}
        </FullscreenChartModal>
      )}
    </>
  );
};

// ==================== CHART 2: AI策略光伏数据评估（日消纳率对比） ====================
export const PvSelfConsumptionComparisonChart: React.FC<ChartProps> = ({ report }) => {
  const { selectedDay, handleChartClick } = useDaySelect();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const daily = report.dailyList;
  const baseRate = report.summary.solarAbsorptionBaseRate;

  const buildData = (days: DailyData[]) =>
    days.map((d) => {
      const traditional = 70 + ((d.day * 17) % 15);
      const base = parseFloat(traditional.toFixed(1));
      const aiBoost = d.isAiRunning ? parseFloat((5 + ((d.day * 7) % 8)).toFixed(1)) : 0;
      return {
        day: `${d.day}日`,
        hasAi: d.isAiRunning,
        simulatedPv: base,
        aiPv: d.isAiRunning ? parseFloat(Math.min(100, base + aiBoost).toFixed(1)) : base,
      };
    });

  const sd = daily.find((d) => d.day === selectedDay);
  const sdData = sd ? buildData([sd])[0] : null;

  const buildChart = (data: ReturnType<typeof buildData>, heightClass: string) => (
    <DragScrollArea minWidth={Math.max(320, data.length * DAY_WIDTH)}>
      <div className={heightClass}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 14, right: 4, left: 0, bottom: 0 }}
            barGap={1}
            barCategoryGap="28%"
            onClick={(state: any) => handleChartClick(state, data)}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EAEDF2" />
            <XAxis
              dataKey="day"
              axisLine={{ stroke: '#EAEDF2' }}
              tickLine={false}
              interval={0}
              tick={(props: any) => <DayTick {...props} hasAi={data[(props as any).index]?.hasAi} />}
            />
            <YAxis
              axisLine={{ stroke: '#EAEDF2' }}
              tickLine={false}
              tick={{ fill: '#7F8C8D', fontSize: 9 }}
              tickFormatter={(val) => `${val}%`}
              domain={[0, 110]}
              width={34}
            />
            <Bar dataKey="simulatedPv" name="模拟策略消纳率" fill="#F59E0B" fillOpacity={0.85} radius={[2, 2, 0, 0]} barSize={7} />
            <Bar dataKey="aiPv" name="当日实际消纳率" fill="#10B981" radius={[2, 2, 0, 0]} barSize={7} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </DragScrollArea>
  );

  const buildBody = (days: DailyData[], fullscreen = false) => {
    const data = buildData(days);
    return (
      <>
        {buildChart(data, fullscreen ? 'h-full' : 'h-[200px]')}
        {sdData ? (
          <DayDetailPanel
            title={`${sd!.day}日 · 光伏消纳`}
            aiRunning={sd!.isAiRunning}
            rows={[
              { label: '模拟策略消纳率 (基准)', value: `${sdData.simulatedPv}%` },
              { label: '当日实际消纳率', value: `${sdData.aiPv}%`, strong: true, colorClass: 'text-emerald-600' },
              {
                label: '消纳率提升',
                value: sd!.isAiRunning ? `+${(sdData.aiPv - sdData.simulatedPv).toFixed(1)} pct` : '—（当日未运行 AI）',
                strong: sd!.isAiRunning,
                colorClass: sd!.isAiRunning ? 'text-emerald-600' : 'text-slate-400',
              },
            ]}
          />
        ) : (
          <SelectHint />
        )}
      </>
    );
  };

  return (
    <>
      <SwipeChartCard
        accentClass="bg-amber-500"
        title="AI策略光伏数据评估"
        badge="日消纳率对比"
        legends={[
          { color: '#F59E0B', label: '模拟策略消纳率 (基准)' },
          { color: '#10B981', label: '当日实际消纳率' },
        ]}
        onOpenFullscreen={() => setIsFullscreen(true)}
      >
        {buildBody(daily)}
      </SwipeChartCard>
      {isFullscreen && (
        <FullscreenChartModal title="AI策略光伏数据评估 (完整 31 天)" subtitle={`当月实际消纳率 ${report.summary.solarAbsorptionRate}% · 基准 ${baseRate}% · 按住拖动查看全月`} onClose={() => setIsFullscreen(false)}>
          {buildBody(daily, true)}
        </FullscreenChartModal>
      )}
    </>
  );
};

// ==================== CHART 3: 储能充放电统计（双向柱 + 利用率折线） ====================
export const StorageComparisonChart: React.FC<ChartProps> = ({ report }) => {
  const { selectedDay, handleChartClick } = useDaySelect();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const daily = report.dailyList;

  const buildData = (days: DailyData[]) =>
    days.map((d) => {
      const simulatedDischarge = Math.round(d.dischargeEnergy * 0.82);
      const simulatedCharge = -Math.round(d.chargeEnergy * 0.82);
      const simulatedUtilRate = parseFloat(Math.min(98.5, Math.max(38, (simulatedDischarge / 750) * 100)).toFixed(1));
      const aiUtilRate = parseFloat(Math.min(99.5, Math.max(48, (d.dischargeEnergy / 750) * 100)).toFixed(1));
      return {
        day: `${d.day}日`,
        hasAi: d.isAiRunning,
        simulatedDischarge,
        aiDischarge: d.dischargeEnergy,
        simulatedCharge,
        aiCharge: -d.chargeEnergy,
        simulatedUtilRate,
        aiUtilRate,
      };
    });

  const sd = daily.find((d) => d.day === selectedDay);
  const sdData = sd ? buildData([sd])[0] : null;

  const buildChart = (data: ReturnType<typeof buildData>, heightClass: string) => (
    <DragScrollArea minWidth={Math.max(320, data.length * DAY_WIDTH)}>
      <div className={heightClass}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            stackOffset="sign"
            margin={{ top: 14, right: 4, left: 0, bottom: 0 }}
            barGap={1}
            barCategoryGap="28%"
            onClick={(state: any) => handleChartClick(state, data)}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EAEDF2" />
            <ReferenceLine y={0} stroke="#CBD5E1" strokeWidth={1} />
            <XAxis
              dataKey="day"
              axisLine={{ stroke: '#EAEDF2' }}
              tickLine={false}
              interval={0}
              tick={(props: any) => <DayTick {...props} hasAi={data[(props as any).index]?.hasAi} />}
            />
            <YAxis
              axisLine={{ stroke: '#EAEDF2' }}
              tickLine={false}
              tick={{ fill: '#7F8C8D', fontSize: 9 }}
              tickFormatter={(val) => `${Math.abs(val)}`}
              width={34}
            />
            <YAxis yAxisId="util" hide domain={[0, 100]} />
            <Bar dataKey="simulatedDischarge" name="模拟放电" stackId="simulated" fill="#FB923C" fillOpacity={0.8} radius={[2, 2, 0, 0]} barSize={7} />
            <Bar dataKey="aiDischarge" name="实际放电" stackId="actual" fill="#10B981" radius={[2, 2, 0, 0]} barSize={7} />
            <Bar dataKey="simulatedCharge" name="模拟充电" stackId="simulated" fill="#93C5FD" fillOpacity={0.8} radius={[0, 0, 2, 2]} barSize={7} />
            <Bar dataKey="aiCharge" name="实际充电" stackId="actual" fill="#059669" radius={[0, 0, 2, 2]} barSize={7} />
            <Line yAxisId="util" dataKey="simulatedUtilRate" stroke="#A855F7" strokeWidth={1.2} strokeDasharray="4 3" dot={false} />
            <Line yAxisId="util" dataKey="aiUtilRate" stroke="#4F46E5" strokeWidth={1.5} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </DragScrollArea>
  );

  const buildBody = (days: DailyData[], fullscreen = false) => {
    const data = buildData(days);
    return (
      <>
        {buildChart(data, fullscreen ? 'h-full' : 'h-[260px]')}
        {sdData ? (
          <DayDetailPanel
            title={`${sd!.day}日 · 储能充放`}
            aiRunning={sd!.isAiRunning}
            rows={[
              { label: '放电量 (基准 → 实际)', value: `${sdData.simulatedDischarge} → ${sdData.aiDischarge} kWh`, strong: true, colorClass: 'text-emerald-600' },
              { label: '充电量 (基准 → 实际)', value: `${Math.abs(sdData.simulatedCharge)} → ${Math.abs(sdData.aiCharge)} kWh`, strong: true, colorClass: 'text-blue-600' },
              { label: '储能利用率 (基准 → 实际)', value: `${sdData.simulatedUtilRate}% → ${sdData.aiUtilRate}%`, colorClass: 'text-indigo-600' },
            ]}
          />
        ) : (
          <SelectHint />
        )}
      </>
    );
  };

  return (
    <>
      <SwipeChartCard
        accentClass="bg-indigo-500"
        title="本月储能充放电统计"
        badge="充放深度与利用率"
        legends={[
          { color: '#FB923C', label: '模拟放电 (基准)' },
          { color: '#10B981', label: '实际放电 (优化)' },
          { color: '#93C5FD', label: '模拟充电 (基准)' },
          { color: '#059669', label: '实际充电 (优化)' },
          { color: '#A855F7', label: '利用率 (虚线)', dashed: true },
        ]}
        onOpenFullscreen={() => setIsFullscreen(true)}
      >
        {buildBody(daily)}
      </SwipeChartCard>
      {isFullscreen && (
        <FullscreenChartModal title="本月储能充放电统计 (完整 31 天)" subtitle="正值为放电 · 负值为充电 · 折线为储能利用率 · 按住拖动查看全月" onClose={() => setIsFullscreen(false)}>
          {buildBody(daily, true)}
        </FullscreenChartModal>
      )}
    </>
  );
};

// ==================== CHART 4: 每日储能充放电均价与套利统计 ====================
export const EssPriceSpreadChart: React.FC<ChartProps> = ({ report }) => {
  const { selectedDay, handleChartClick } = useDaySelect();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const daily = report.dailyList;

  const buildData = (days: DailyData[]) =>
    days.map((d) => {
      const gi = d.day - 1;
      const baseChargePrice = parseFloat((0.382 + Math.sin(gi * 0.7) * 0.022).toFixed(3));
      const baseDischargePrice = parseFloat((0.842 + Math.cos(gi * 0.5) * 0.026).toFixed(3));
      const aiChargePrice = d.isAiRunning ? parseFloat((0.320 + Math.sin(gi * 0.9) * 0.016).toFixed(3)) : baseChargePrice;
      const aiDischargePrice = d.isAiRunning ? parseFloat((0.918 + Math.cos(gi * 0.8) * 0.020).toFixed(3)) : baseDischargePrice;
      return {
        day: `${d.day}日`,
        hasAi: d.isAiRunning,
        simulatedChargePrice: baseChargePrice,
        simulatedDischargePrice: baseDischargePrice,
        aiChargePrice,
        aiDischargePrice,
        simulatedSpread: parseFloat((baseDischargePrice - baseChargePrice).toFixed(3)),
        actualSpread: parseFloat((aiDischargePrice - aiChargePrice).toFixed(3)),
      };
    });

  const allData = buildData(daily);
  const avgSpread = (allData.reduce((s, d) => s + d.actualSpread, 0) / allData.length).toFixed(3);
  const avgSimSpread = (allData.reduce((s, d) => s + d.simulatedSpread, 0) / allData.length).toFixed(3);
  const gain = (parseFloat(avgSpread) - parseFloat(avgSimSpread)).toFixed(3);

  const sd = daily.find((d) => d.day === selectedDay);
  const sdData = sd ? buildData([sd])[0] : null;

  const buildChart = (data: ReturnType<typeof buildData>, heightClass: string) => (
    <DragScrollArea minWidth={Math.max(320, data.length * DAY_WIDTH)}>
      <div className={heightClass}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 14, right: 4, left: 0, bottom: 0 }}
            barGap={1}
            barCategoryGap="30%"
            onClick={(state: any) => handleChartClick(state, data)}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EAEDF2" />
            <XAxis
              dataKey="day"
              axisLine={{ stroke: '#EAEDF2' }}
              tickLine={false}
              interval={0}
              tick={(props: any) => <DayTick {...props} hasAi={data[(props as any).index]?.hasAi} />}
            />
            <YAxis
              axisLine={{ stroke: '#EAEDF2' }}
              tickLine={false}
              tick={{ fill: '#7F8C8D', fontSize: 9 }}
              tickFormatter={(val) => `¥${val.toFixed(2)}`}
              domain={[0, 1.2]}
              width={40}
            />
            <Bar dataKey="actualSpread" name="充放价差" fill="#6366F1" fillOpacity={0.35} radius={[2, 2, 0, 0]} barSize={5} />
            <Line dataKey="simulatedChargePrice" stroke="#3B82F6" strokeWidth={1.2} strokeDasharray="4 3" dot={false} />
            <Line dataKey="aiChargePrice" stroke="#10B981" strokeWidth={1.5} dot={false} />
            <Line dataKey="simulatedDischargePrice" stroke="#A855F7" strokeWidth={1.2} strokeDasharray="4 3" dot={false} />
            <Line dataKey="aiDischargePrice" stroke="#F97316" strokeWidth={1.5} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </DragScrollArea>
  );

  const buildBody = (days: DailyData[], fullscreen = false) => {
    const data = buildData(days);
    return (
      <>
        {buildChart(data, fullscreen ? 'h-full' : 'h-[230px]')}
        {sdData ? (
          <DayDetailPanel
            title={`${sd!.day}日 · 充放均价与套利`}
            aiRunning={sd!.isAiRunning}
            rows={[
              { label: '放电价格 (实际 / 基准)', value: `¥${sdData.aiDischargePrice.toFixed(3)} / ¥${sdData.simulatedDischargePrice.toFixed(3)}`, colorClass: 'text-orange-500' },
              { label: '充电成本 (实际 / 基准)', value: `¥${sdData.aiChargePrice.toFixed(3)} / ¥${sdData.simulatedChargePrice.toFixed(3)}`, colorClass: 'text-emerald-600' },
              {
                label: '实际价差 (套利空间)',
                value: `¥${sdData.actualSpread.toFixed(3)} (基准 ¥${sdData.simulatedSpread.toFixed(3)}，${sdData.actualSpread - sdData.simulatedSpread > 0 ? `+${(sdData.actualSpread - sdData.simulatedSpread).toFixed(3)}` : '持平'})`,
                strong: true,
                colorClass: 'text-indigo-500',
              },
            ]}
          />
        ) : (
          <SelectHint />
        )}
      </>
    );
  };

  return (
    <>
      <SwipeChartCard
        accentClass="bg-violet-500"
        title="每日储能充放均价与套利"
        badge="度电电价与利差"
        legends={[
          { color: '#10B981', label: '充电成本 (优化)' },
          { color: '#3B82F6', label: '充电成本 (基准)', dashed: true },
          { color: '#F97316', label: '放电价格 (优化)' },
          { color: '#A855F7', label: '放电价格 (基准)', dashed: true },
          { color: '#6366F1', label: '充放价差 (柱状)' },
        ]}
        onOpenFullscreen={() => setIsFullscreen(true)}
      >
        {buildBody(daily)}
      </SwipeChartCard>
      {isFullscreen && (
        <FullscreenChartModal
          title="每日储能充放均价与套利 (完整 31 天)"
          subtitle={`全月充放均价差 ${avgSpread} 元/kWh · AI度电套利增益 +${gain} 元/kWh · 按住拖动查看全月`}
          onClose={() => setIsFullscreen(false)}
        >
          {buildBody(daily, true)}
        </FullscreenChartModal>
      )}
    </>
  );
};

// ==================== CHART 5: 光伏限电止损 ====================
export const CurtailmentStopLossChart: React.FC<ChartProps> = ({
  report,
  aiStatus = 'activated',
  onSetAiStatus,
}) => {
  const { selectedDay, handleChartClick } = useDaySelect();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const daily = report.dailyList;

  // 开通状态三态：未开通（锁定）/ 试运行（估算）/ 正式运行（全量）
  const isLocked = aiStatus === 'not_activated';
  const isTrial = aiStatus === 'trial';

  const buildData = (days: DailyData[]) =>
    days
      .filter((d) => d.curtailmentEnergy > 0)
      .map((d) => ({
        day: `${d.day}日`,
        dayNum: d.day,
        curtailedEnergy: d.curtailmentEnergy,
        lossSaved: d.stopLossRevenue,
      }));

  const allCurtailDays = daily.filter((d) => d.curtailmentEnergy > 0);
  const totalCurtail = allCurtailDays.reduce((s, d) => s + d.curtailmentEnergy, 0).toFixed(1);
  const totalSaved = allCurtailDays.reduce((s, d) => s + d.stopLossRevenue, 0);
  const sd = allCurtailDays.find((d) => d.day === selectedDay);

  const buildChart = (data: ReturnType<typeof buildData>, heightClass: string) => (
    <DragScrollArea minWidth={Math.max(320, data.length * 40)}>
      <div className={heightClass}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 14, right: 4, left: 0, bottom: 0 }}
            barGap={1}
            barCategoryGap="30%"
            onClick={(state: any) => handleChartClick(state, data)}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EAEDF2" />
            <XAxis dataKey="day" axisLine={{ stroke: '#EAEDF2' }} tickLine={false} interval={0} tick={{ fill: '#7F8C8D', fontSize: 8 }} />
            <YAxis yAxisId="energy" axisLine={{ stroke: '#EAEDF2' }} tickLine={false} tick={{ fill: '#7F8C8D', fontSize: 9 }} width={30} />
            <YAxis yAxisId="money" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#10B981', fontSize: 9 }} width={30} />
            <Bar yAxisId="energy" dataKey="curtailedEnergy" name="止损电量" fill="#F43F5E" fillOpacity={0.75} radius={[2, 2, 0, 0]} barSize={9} />
            <Line yAxisId="money" dataKey="lossSaved" stroke="#10B981" strokeWidth={1.5} dot={{ r: 2, fill: '#10B981' }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </DragScrollArea>
  );

  // 「增值特性」单独标记（区别于普通 AI 策略收益）
  const premiumBadge = isLocked ? (
    <span className="flex items-center gap-0.5 text-[8px] font-black text-slate-400 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded-full shrink-0">
      <Lock className="w-2.5 h-2.5" />
      增值特性
    </span>
  ) : (
    <span
      className={`flex items-center gap-0.5 text-[8px] font-black px-1.5 py-0.5 rounded-full border shrink-0 ${
        isTrial
          ? 'text-amber-600 bg-amber-50 border-amber-200'
          : 'text-amber-700 bg-gradient-to-r from-amber-100 to-orange-100 border-amber-200'
      }`}
    >
      <Sparkles className="w-2.5 h-2.5" />
      增值特性{isTrial ? ' · 估算' : ''}
    </span>
  );

  return (
    <>
      <SwipeChartCard
        accentClass={isLocked ? 'bg-slate-300' : 'bg-rose-500'}
        title="微电网限电调控减亏"
        badge={isLocked ? '待开通' : isTrial ? '试运行估算' : '止损电量与金额'}
        extraBadge={premiumBadge}
        legends={
          isLocked
            ? []
            : [
                { color: '#F43F5E', label: '止损电量 (kWh)' },
                { color: '#10B981', label: '止损金额 (¥)' },
              ]
        }
        onOpenFullscreen={isLocked ? undefined : () => setIsFullscreen(true)}
      >
        {isLocked ? (
          /* ---------- 未开通：增值特性锁定 ---------- */
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">
            <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mx-auto text-slate-400">
              <Lock className="w-5 h-5" />
            </div>
            <p className="text-[11px] font-black text-slate-700 mt-2.5">限电止损为 AI 策略增值特性</p>
            <p className="text-[9px] text-gray-500 leading-relaxed mt-1.5">
              开通 AI 策略后，负电价与限电指令时段将自动执行光伏入储与偏差避险，
              该部分收益单独统计并在此展示。
            </p>
            {/* 开通入口：试用 / 正式 */}
            <AiActivationCta
              scope="rpchart"
              className="mt-3"
              onTrial={() => onSetAiStatus?.('trial')}
              onActivate={() => onSetAiStatus?.('activated')}
            />
          </div>
        ) : (
          /* ---------- 试运行 / 正式运行：全量展示 ---------- */
          <>
            {isTrial && (
              <div className="mb-2 rounded-lg border border-amber-200 bg-amber-50/60 px-2.5 py-2">
                <div className="flex items-start gap-1.5">
                  <Sparkles className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
                  <span className="text-[9px] text-amber-800 font-bold leading-snug">
                    试运行期数据为 AI 仿真估算值，正式运行后按实际结算口径统计
                  </span>
                </div>
                <AiUpgradeCta scope="rpchart" size="sm" className="mt-1.5 w-full" onClick={() => onSetAiStatus?.('activated')} />
              </div>
            )}
            {buildChart(buildData(daily), 'h-[200px]')}
            {sd ? (
              <DayDetailPanel
                title={`${sd.day}日 · 限电止损`}
                aiRunning={sd.isAiRunning}
                rows={[
                  { label: '止损电量', value: `${sd.curtailmentEnergy} kWh`, strong: true, colorClass: 'text-rose-500' },
                  {
                    label: '止损金额',
                    value: `${sd.stopLossRevenue >= 0 ? '+' : ''}¥${sd.stopLossRevenue.toLocaleString()}`,
                    strong: true,
                    colorClass: sd.stopLossRevenue >= 0 ? 'text-emerald-600' : 'text-red-500',
                  },
                  { label: '光伏自发自用', value: `${sd.pvSelfConsumption} kWh` },
                  { label: '光伏上网电量', value: `${sd.pvGridFeeding} kWh` },
                  { label: '储能充电消纳', value: `${sd.chargeEnergy} kWh` },
                  ...(isTrial
                    ? [{ label: '数据口径', value: 'AI 仿真估算', colorClass: 'text-amber-600' }]
                    : []),
                ]}
              />
            ) : (
              <SelectHint />
            )}
          </>
        )}
      </SwipeChartCard>
      {isFullscreen && !isLocked && (
        <FullscreenChartModal title="微电网限电调控减亏 (全月)" subtitle={`止损电量合计 ${totalCurtail} kWh · 止损金额合计 +¥${totalSaved.toLocaleString()} · 按住拖动查看全月`} onClose={() => setIsFullscreen(false)}>
          <div className="h-full flex flex-col">
            {buildChart(buildData(allCurtailDays), 'h-full')}
            <div className="mt-2 grid grid-cols-2 gap-2 shrink-0">
              <div className="bg-slate-50 rounded-xl p-2 border border-slate-100">
                <span className="text-[9px] text-slate-400 font-extrabold block">止损电量合计</span>
                <span className="text-sm font-black text-rose-500 font-mono">{totalCurtail} kWh</span>
              </div>
              <div className="bg-emerald-50/50 rounded-xl p-2 border border-emerald-100/50">
                <span className="text-[9px] text-emerald-600 font-extrabold block">止损金额合计</span>
                <span className="text-sm font-black text-emerald-600 font-mono">+¥{totalSaved.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </FullscreenChartModal>
      )}
    </>
  );
};
