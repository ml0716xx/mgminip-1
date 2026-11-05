/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 测点趋势（小程序端）
 * --------------------------------------------------------------------------
 * 从设备详情的「测点数据」点任意一行进来，看这个测点一整天怎么走。
 *
 * 三件事：
 *   ① 日期可切换 —— 今天往前 7 天，未来不可选；
 *   ② 曲线只画到该画的时刻 —— 今天到此刻为止，历史日期给完整 24 小时；
 *   ③ 支持横屏 —— 手机上横过来看图更清楚，这里给一个全屏宽幅视图，
 *      横屏下横轴刻度加密到 2 小时一格。
 *
 * 曲线在「此刻」那一点必须等于点表上的数，锚点对不上就没法对账。
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  TrendingUp,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { DeviceItem, DevicePoint } from '../data/deviceData';
import {
  addDays,
  buildPointTrend,
  canGoNext,
  canGoPrev,
  fmtDate,
  fmtValue,
  HISTORY_DAYS,
  isToday,
  type PointTrend,
} from '../data/deviceTrendData';

interface PointTrendPageProps {
  device: DeviceItem;
  point: DevicePoint;
  onBack: () => void;
  /** 换当前设备下的另一个测点，不退出趋势页 */
  onChangePoint: (p: DevicePoint) => void;
}

const pad = (n: number) => String(n).padStart(2, '0');
const clock = (minute: number) => `${pad(Math.floor(minute / 60) % 24)}:${pad(Math.floor(minute % 60))}`;

/** 曲线本体：竖屏和横屏共用一套，只换刻度和边距 */
const TrendChart: React.FC<{ trend: PointTrend; landscape: boolean; endMinute: number }> = ({
  trend,
  landscape,
  endMinute,
}) => {
  const ticks = landscape
    ? [0, 120, 240, 360, 480, 600, 720, 840, 960, 1080, 1200, 1320, 1440]
    : [0, 240, 480, 720, 960, 1200, 1440];
  const unit = trend.unit ? ` ${trend.unit}` : '';
  /* 上下留白：极值点要带文字标注，贴着边框会被裁掉。
     按跨度取 22%，再给个相对量兜底（累计电量这类大基数、小日增的测点）。 */
  const padY = trend.stats
    ? Math.max((trend.stats.max - trend.stats.min) * 0.22, Math.abs(trend.stats.max) * 0.0005, 0.4)
    : 1;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={trend.samples} margin={{ top: 12, right: 12, left: landscape ? -6 : -6, bottom: 0 }}>
        <defs>
          <linearGradient id="trend_fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10B981" stopOpacity={0.26} />
            <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
        {/* 今天还没过完：在「此刻」画一条虚线，右边空着就是还没发生 */}
        {endMinute > 0 && endMinute < 1440 && (
          <ReferenceLine x={endMinute} stroke="#CBD5E1" strokeDasharray="3 3" />
        )}
        <XAxis
          dataKey="minute"
          type="number"
          domain={[0, 1440]}
          ticks={ticks}
          tickFormatter={clock}
          tick={{ fontSize: landscape ? 10 : 8, fill: '#9CA3AF' }}
          axisLine={{ stroke: '#E5E7EB' }}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: landscape ? 10 : 8, fill: '#9CA3AF' }}
          axisLine={false}
          tickLine={false}
          width={landscape ? 52 : 44}
          domain={[
            trend.stats ? trend.stats.min - padY : 0,
            trend.stats ? trend.stats.max + padY : 1,
          ]}
          tickFormatter={(v: number) => {
            /* 跨度小（SOC 一天就走几个点）留一位小数，不然刻度全是同一个整数；
               万级量（累计电量）不缩写，缩写会让 78.4k 和 78.2k 变成同一个 78k */
            return v.toLocaleString('zh-CN', { maximumFractionDigits: padY * 2 < 5 ? 1 : 0 });
          }}
        />
        <Tooltip
          /* 手机上点一下才出读数：默认 hover 会让浮层一直挂在那儿挡曲线 */
          trigger="click"
          cursor={{ stroke: '#CBD5E1', strokeDasharray: '3 3' }}
          contentStyle={{
            borderRadius: 10,
            border: '1px solid #E5E7EB',
            fontSize: 11,
            padding: '6px 8px',
            boxShadow: '0 4px 12px rgba(15,23,42,.08)',
          }}
          labelFormatter={(m: number) => clock(m)}
          formatter={(v: number) => [`${fmtValue(v, trend.decimals)}${unit}`, '数值']}
        />
        <Area
          type="monotone"
          dataKey="v"
          stroke="#10B981"
          strokeWidth={landscape ? 2.2 : 1.8}
          fill="url(#trend_fill)"
          dot={false}
          activeDot={{ r: 3, fill: '#10B981', stroke: '#fff', strokeWidth: 2 }}
          isAnimationActive={false}
        />
        {/* 当日最高 / 最低在图上直接标出来，不用去表里对 */}
        {trend.extremes && (
          <>
            <ReferenceDot
              x={trend.extremes.max.minute}
              y={trend.extremes.max.v}
              r={3}
              fill="#E5484D"
              stroke="#fff"
              strokeWidth={1.5}
              ifOverflow="extendDomain"
              label={{
                value: `最高 ${fmtValue(trend.extremes.max.v, trend.decimals)}`,
                position: 'top',
                fill: '#E5484D',
                fontSize: landscape ? 11 : 9,
                fontWeight: 700,
              }}
            />
            <ReferenceDot
              x={trend.extremes.min.minute}
              y={trend.extremes.min.v}
              r={3}
              fill="#1E9C7E"
              stroke="#fff"
              strokeWidth={1.5}
              ifOverflow="extendDomain"
              label={{
                value: `最低 ${fmtValue(trend.extremes.min.v, trend.decimals)}`,
                position: 'bottom',
                fill: '#1E9C7E',
                fontSize: landscape ? 11 : 9,
                fontWeight: 700,
              }}
            />
          </>
        )}
      </AreaChart>
    </ResponsiveContainer>
  );
};

/**
 * 统计两格：当日最高 / 最低，各带出现时刻。
 * 不取平均 —— 现场看的是「冲到过多少、掉到过多少」，均值对判断没用。
 */
const StatRow: React.FC<{ trend: PointTrend; landscape?: boolean }> = ({ trend, landscape }) => {
  if (!trend.stats || !trend.extremes) return null;
  const unit = trend.unit ? ` ${trend.unit}` : '';
  const items = [
    { key: 'max', label: '当日最高', value: trend.stats.max, at: trend.extremes.max.minute, tone: 'text-[#E5484D]' },
    { key: 'min', label: '当日最低', value: trend.stats.min, at: trend.extremes.min.minute, tone: 'text-[#1E9C7E]' },
  ];
  return (
    <div className={`grid grid-cols-2 ${landscape ? 'gap-3' : 'gap-1.5'}`}>
      {items.map((it) => (
        <div key={it.key} className="rounded-xl bg-gray-50/80 border border-gray-100 px-2 py-1.5 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[9px] text-gray-400 font-bold truncate">{it.label}</span>
            <span className="text-[8px] text-gray-300 font-mono shrink-0">{clock(it.at)}</span>
          </div>
          <span
            id={`trend_stat_${it.key}`}
            className={`font-black font-mono block truncate mt-0.5 ${it.tone} ${
              landscape ? 'text-[15px]' : 'text-[12px]'
            }`}
          >
            {fmtValue(it.value, trend.decimals)}
            <span className="text-[9px] text-gray-400 font-bold ml-0.5">{unit}</span>
          </span>
        </div>
      ))}
    </div>
  );
};

/** 状态量：没有曲线，给一条当日状态时序带 */
const StateTimeline: React.FC<{ trend: PointTrend; landscape: boolean }> = ({ trend, landscape }) => {
  const total = trend.states.length ? trend.states[trend.states.length - 1].to : 1440;
  return (
    <div className={landscape ? 'space-y-4' : 'space-y-3'}>
      <div>
        <span className="text-[9px] text-gray-400 font-bold block mb-1.5">
          当日状态时序（00:00 – {clock(total)}）
        </span>
        <div className="flex h-4 rounded-full overflow-hidden bg-gray-100">
          {trend.states.map((s) => (
            <div
              key={s.from}
              className={s.cls}
              style={{ width: `${((s.to - s.from) / total) * 100}%` }}
              title={`${clock(s.from)}–${clock(s.to)} ${s.label}`}
            />
          ))}
        </div>
        <div className="flex justify-between text-[8px] text-gray-300 font-mono mt-1">
          <span>00:00</span>
          <span>{clock(total)}</span>
        </div>
      </div>
      <div className="space-y-1">
        {trend.states.map((s) => (
          <div key={s.from} className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-sm shrink-0 ${s.cls}`} />
            <span className="text-[10px] font-bold text-gray-700 flex-1 min-w-0 truncate">{s.label}</span>
            <span className="text-[9px] font-mono text-gray-400 shrink-0">
              {clock(s.from)} – {clock(s.to)}
            </span>
          </div>
        ))}
      </div>
      <p className="text-[9px] text-gray-400 leading-relaxed">
        该测点为状态量，没有连续数值曲线，只能看状态切换。
      </p>
    </div>
  );
};

export const PointTrendPage: React.FC<PointTrendPageProps> = ({
  device,
  point,
  onBack,
  onChangePoint,
}) => {
  const [date, setDate] = useState(() => fmtDate(new Date()));
  const [landscape, setLandscape] = useState(false);
  /* 测点切换抽屉：同一台设备 18–21 个测点，不用退回去再点一次 */
  const [pickerOpen, setPickerOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pickerListRef = useRef<HTMLDivElement>(null);

  /* 换测点后回到顶部：否则停在上一张图的统计卡位置，会以为没切过来 */
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [point.label]);

  /* 打开抽屉先把当前测点滚到中间 —— 18 项里第 16 项藏在屏幕外，看不到自己在哪 */
  useEffect(() => {
    const list = pickerListRef.current;
    if (!pickerOpen || !list) return;
    const cur = list.querySelector<HTMLElement>('[data-current="1"]');
    if (cur) {
      list.scrollTop = cur.offsetTop - list.clientHeight / 2 + cur.clientHeight / 2;
    }
  }, [pickerOpen]);

  const trend = useMemo(() => buildPointTrend(device, point, date), [device, point, date]);
  const today = isToday(date);
  const unit = trend.unit ? ` ${trend.unit}` : '';
  /* 曲线画到哪一刻：数值量看最后一个采样点，状态量看最后一段的结束时刻 */
  const endMinute =
    trend.kind === 'state'
      ? trend.states.length
        ? trend.states[trend.states.length - 1].to
        : 0
      : trend.samples.length
        ? trend.samples[trend.samples.length - 1].minute
        : 0;
  const endLabel = today ? `截至 ${clock(endMinute)}` : '全天';

  /* ---------------- 日期切换条 ---------------- */
  const dateBar = (dark = false) => (
    <div
      className={`flex items-center justify-between rounded-xl border px-1.5 py-1 ${
        dark ? 'bg-white/10 border-white/10' : 'bg-white border-gray-100 shadow-xs'
      }`}
    >
      <button
        id="btn_trend_prev_day"
        disabled={!canGoPrev(date)}
        onClick={() => setDate(addDays(date, -1))}
        className={`p-1 rounded-lg ${dark ? 'text-white/70 disabled:text-white/20' : 'text-gray-500 disabled:text-gray-200'}`}
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <span
        id="trend_date"
        className={`inline-flex items-center gap-1 text-[11px] font-black font-mono tabular-nums ${
          dark ? 'text-white' : 'text-gray-900'
        }`}
      >
        <CalendarDays className={`w-3 h-3 ${dark ? 'text-white/50' : 'text-gray-300'}`} />
        {date}
        {today && (
          <span className={`text-[8px] font-bold ml-0.5 ${dark ? 'text-emerald-300' : 'text-emerald-600'}`}>
            今天
          </span>
        )}
      </span>
      <button
        id="btn_trend_next_day"
        disabled={!canGoNext(date)}
        onClick={() => setDate(addDays(date, 1))}
        className={`p-1 rounded-lg ${dark ? 'text-white/70 disabled:text-white/20' : 'text-gray-500 disabled:text-gray-200'}`}
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );

  /* ---------------- 横屏全屏 ---------------- */
  if (landscape) {
    return (
      <div id="trend_landscape" className="fixed inset-0 z-[100] bg-slate-900 flex flex-col">
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 shrink-0">
          <div className="min-w-0">
            <span className="text-[11px] font-black text-white block truncate">
              {point.label}
              <span className="text-white/40 font-bold ml-1.5">{device.name}</span>
            </span>
            <span className="text-[9px] text-white/40 font-bold">
              {date} · {device.sn}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-[190px]">{dateBar(true)}</div>
            <button
              id="btn_trend_portrait"
              onClick={() => setLandscape(false)}
              className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-2.5 py-1.5 text-[10px] font-black text-white/90 active:bg-white/20"
            >
              <Minimize2 className="w-3.5 h-3.5" />
              竖屏
            </button>
          </div>
        </div>
        <div className="flex-1 bg-white mx-3 mb-3 rounded-2xl p-3 flex flex-col min-h-0">
          <div className="flex items-start justify-between gap-4 shrink-0">
            <div className="flex items-baseline gap-1">
              <span id="trend_current_land" className="text-[24px] font-black font-mono leading-none text-gray-900">
                {trend.kind === 'state' ? point.value : fmtValue(trend.last ?? 0, trend.decimals)}
              </span>
              <span className="text-[10px] text-gray-400 font-bold">{unit || '状态量'}</span>
              <span className="text-[9px] text-gray-400 font-bold ml-2">
                {endLabel}
              </span>
            </div>
            <div className="w-[320px]">
              <StatRow trend={trend} landscape />
            </div>
          </div>
          <div className="flex-1 min-h-0 mt-2">
            {trend.kind === 'number' ? (
              <TrendChart trend={trend} landscape endMinute={endMinute} />
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="w-[520px]">
                  <StateTimeline trend={trend} landscape />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ---------------- 竖屏 ---------------- */
  return (
    <div className="flex-1 flex flex-col overflow-hidden relative">
      <div className="flex items-center justify-between gap-2 px-3 py-2.5 bg-white border-b border-gray-100 shrink-0">
        <button onClick={onBack} id="btn_trend_back" className="p-1 text-gray-600 active:text-emerald-500 shrink-0">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="text-[13px] font-black text-gray-900 truncate">测点趋势</span>
        <button
          id="btn_trend_landscape"
          onClick={() => setLandscape(true)}
          className="p-1 text-gray-600 active:text-emerald-500 shrink-0"
          title="横屏查看"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto bg-[#f6f7f9]">
        <div className="px-3 pt-2.5 pb-6 space-y-3">
          {/* 测点身份 + 当前值 */}
          <div className="bg-white rounded-2xl border border-gray-100 p-3.5 shadow-xs">
            <div className="flex items-center gap-1 text-[9px] text-gray-400 font-bold">
              <TrendingUp className="w-2.5 h-2.5 shrink-0" />
              <span className="truncate">
                {device.name}
              </span>
            </div>
            <button
              id="btn_trend_picker"
              onClick={() => setPickerOpen(true)}
              className="inline-flex items-center gap-1 mt-0.5 -ml-0.5 pl-0.5 pr-1 py-0.5 rounded-md active:bg-gray-50"
            >
              <span className="text-[13px] font-black text-gray-900">{point.label}</span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-[8px] text-gray-300 font-bold">切换测点</span>
            </button>
            <div className="flex items-end justify-between gap-2 mt-2">
              <div className="flex items-baseline gap-1 min-w-0">
                <span id="trend_current" className="text-[26px] font-black font-mono leading-none text-gray-900">
                  {trend.kind === 'state' ? point.value : fmtValue(trend.last ?? 0, trend.decimals)}
                </span>
                <span className="text-[10px] text-gray-400 font-bold truncate">{unit}</span>
              </div>
              <span className="text-[9px] text-gray-400 font-bold shrink-0">{endLabel}</span>
            </div>
          </div>

          {/* 日期切换 */}
          {dateBar()}

          {/* 曲线 / 状态时序 */}
          <div className="bg-white rounded-2xl border border-gray-100 p-3 shadow-xs">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-black text-gray-800">
                {trend.kind === 'state' ? '状态时序' : '当日曲线'}
              </span>
            </div>
            {trend.kind === 'number' ? (
              <div id="trend_chart" className="h-[200px] w-full">
                <TrendChart trend={trend} landscape={false} endMinute={endMinute} />
              </div>
            ) : (
              <div id="trend_state" className="pt-1.5">
                <StateTimeline trend={trend} landscape={false} />
              </div>
            )}
          </div>

          <StatRow trend={trend} />

          <p className="text-[9px] text-gray-400 text-center leading-relaxed">
            数据来自站控网关
            <br />
            今天只统计到此刻，历史日期为完整一天；最多回看 {HISTORY_DAYS} 天
          </p>
        </div>
      </div>

      {/* 切换测点：底部抽屉，点一项就地换图，日期保持不变 */}
      <AnimatePresence>
        {pickerOpen && (
          <motion.div
            id="trend_point_picker_mask"
            className="absolute inset-0 z-50 bg-black/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            onClick={() => setPickerOpen(false)}
          >
            <motion.div
              id="trend_point_picker"
              className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[72%] flex flex-col shadow-2xl"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 32, stiffness: 320 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-3.5 pt-3 pb-2 border-b border-gray-100 shrink-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[12px] font-black text-gray-900 block">切换测点</span>
                    <span className="text-[9px] text-gray-400 font-bold block truncate mt-0.5">
                      {device.name} · 共 {device.points.length} 项
                    </span>
                  </div>
                  <button
                    onClick={() => setPickerOpen(false)}
                    className="p-1 -mr-1 text-gray-400 active:text-gray-600 shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div ref={pickerListRef} className="overflow-y-auto py-1">
                {device.points.map((p, i) => {
                  const on = p.label === point.label;
                  return (
                    <button
                      key={`${p.label}-${i}`}
                      id={`trend_pick_${i}`}
                      data-current={on ? '1' : '0'}
                      onClick={() => {
                        onChangePoint(p);
                        setPickerOpen(false);
                      }}
                      className={`w-full flex items-center justify-between gap-2 px-3.5 py-2 text-left transition-colors ${
                        on ? 'bg-emerald-50/70' : 'active:bg-gray-50'
                      }`}
                    >
                      <span className="flex items-center gap-1.5 min-w-0">
                        {on ? (
                          <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                        ) : (
                          <span className="w-3 shrink-0" />
                        )}
                        <span
                          className={`text-[11px] font-bold truncate ${
                            on ? 'text-emerald-700' : 'text-gray-700'
                          }`}
                        >
                          {p.label}
                        </span>
                      </span>
                      <span
                        className={`text-[10px] font-black font-mono shrink-0 ${
                          on ? 'text-emerald-700' : 'text-gray-400'
                        }`}
                      >
                        {p.value}
                      </span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
