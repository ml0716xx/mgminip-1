/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
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
} from 'recharts';
import {
  Wifi,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Maximize2,
  Sun,
  Zap,
  Battery,
  Recycle,
  TreePine,
  Factory,
  Plug,
  CloudSun,
  Landmark,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ENERGY_FLOW,
  MICROGRID_REVENUE,
  TODAY_SUPPLY,
  TODAY_CONSUMPTION,
  SOCIAL_CONTRIBUTION,
  OVERVIEW_MODE_TEXT,
  PERIOD_LABELS,
  PeriodType,
  GRID_PERIOD,
  PV_PERIOD,
  ESS_PERIOD,
  STATION_PERIOD,
} from '../data/overviewData';

type StationTab = 'micro' | 'grid' | 'pv' | 'ess' | 'ev';

const STATION_TABS: { key: StationTab; label: string }[] = [
  { key: 'micro', label: '微网' },
  { key: 'grid', label: '电网' },
  { key: 'pv', label: '光伏' },
  { key: 'ess', label: '储能' },
  { key: 'ev', label: '充电站' },
];

// ==================== 通用小件 ====================
const SectionTitle: React.FC<{ title: string; extra?: React.ReactNode; accent?: string }> = ({
  title,
  extra,
  accent = 'bg-emerald-500',
}) => (
  <div className="flex items-center justify-between mb-3">
    <div className="flex items-center gap-1.5">
      <span className={`w-1 h-3.5 ${accent} rounded-xs`} />
      <h3 className="text-xs font-black text-gray-900 tracking-tight">{title}</h3>
    </div>
    {extra}
  </div>
);

/** 指标单元格：上方灰标签，下方大数值 + 小单位 */
const StatCell: React.FC<{
  label: string;
  value: React.ReactNode;
  unit?: string;
  valueClass?: string;
}> = ({ label, value, unit, valueClass = 'text-gray-900' }) => (
  <div className="min-w-0">
    <span className="text-[10px] text-gray-400 font-bold block truncate">{label}</span>
    <div className="flex items-baseline gap-0.5 mt-0.5">
      <span className={`text-[15px] font-black font-mono leading-none ${valueClass}`}>{value}</span>
      {unit && <span className="text-[9px] text-gray-400 font-bold">{unit}</span>}
    </div>
  </div>
);

/** 周期切换（日/月/年/累计） */
const PeriodSwitch: React.FC<{ value: PeriodType; onChange: (p: PeriodType) => void }> = ({
  value,
  onChange,
}) => (
  <div className="flex items-center gap-1 bg-gray-100/80 p-0.5 rounded-lg">
    {(Object.keys(PERIOD_LABELS) as PeriodType[]).map((k) => (
      <button
        key={k}
        onClick={() => onChange(k)}
        className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${
          value === k ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-400'
        }`}
      >
        {PERIOD_LABELS[k]}
      </button>
    ))}
  </div>
);

/** 日期选择条 */
const DateBar: React.FC<{ date: string; onShift: (delta: number) => void }> = ({ date, onShift }) => (
  <div className="flex items-center justify-between bg-gray-50 rounded-lg px-2 py-1.5 border border-gray-100 mt-2.5">
    <button onClick={() => onShift(-1)} className="p-1 text-gray-400 active:text-emerald-500">
      <ChevronLeft className="w-4 h-4" />
    </button>
    <div className="flex items-center gap-1.5">
      <span className="text-[11px] font-bold text-gray-700 font-mono">{date}</span>
      <Calendar className="w-3.5 h-3.5 text-emerald-500" />
    </div>
    <button onClick={() => onShift(1)} className="p-1 text-gray-400 active:text-emerald-500">
      <ChevronRight className="w-4 h-4" />
    </button>
  </div>
);

/** 底部图例 */
const ChartLegend: React.FC<{ items: { color: string; label: string }[] }> = ({ items }) => (
  <div className="flex items-center justify-center gap-4 mt-2">
    {items.map((it) => (
      <span key={it.label} className="flex items-center gap-1 text-[9px] text-gray-500 font-bold">
        <span className="w-2 h-2 rounded-xs" style={{ backgroundColor: it.color }} />
        {it.label}
      </span>
    ))}
  </div>
);

/** 运行情况图表（12 点柱状，无线 hover tooltip，适配小程序） */
const RunningChart: React.FC<{
  data: { x: string; a: number; b: number }[];
  bars: { key: 'a' | 'b'; color: string }[];
  yMax?: number;
}> = ({ data, bars, yMax }) => (
  <div className="h-[168px] w-full">
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={data} margin={{ top: 8, right: 4, left: -22, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
        <XAxis
          dataKey="x"
          tick={{ fontSize: 9, fill: '#9CA3AF' }}
          axisLine={{ stroke: '#E5E7EB' }}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 9, fill: '#9CA3AF' }}
          axisLine={false}
          tickLine={false}
          domain={yMax ? [0, yMax] : [0, 'auto']}
        />
        {bars.map((b) => (
          <Bar key={b.key} dataKey={b.key} fill={b.color} radius={[3, 3, 0, 0]} maxBarSize={16} />
        ))}
      </ComposedChart>
    </ResponsiveContainer>
  </div>
);

// ==================== 能量全景（能流图） ====================
const EnergyFlowPanel: React.FC = () => {
  const nodes: {
    id: string;
    label: string;
    icon: React.ReactNode;
    value: number;
    unit: string;
    sub: string;
    valuePrefix?: string;
    color: string;
    ring: string;
    style: React.CSSProperties;
    textStyle: React.CSSProperties;
    align: 'left' | 'right';
  }[] = [
    {
      id: 'pv',
      label: '光伏',
      icon: <Sun className="w-5 h-5" />,
      value: ENERGY_FLOW.pvGeneration,
      unit: 'kW',
      sub: '发电',
      color: 'text-amber-500',
      ring: 'border-amber-200 bg-amber-50',
      style: { left: 14, top: 12 },
      textStyle: { left: 66, top: 4 },
      align: 'left',
    },
    {
      id: 'grid',
      label: '电网',
      icon: <Landmark className="w-5 h-5" />,
      value: ENERGY_FLOW.gridImport,
      unit: 'kW',
      sub: '下网',
      color: 'text-sky-500',
      ring: 'border-sky-200 bg-sky-50',
      style: { right: 14, top: 12 },
      textStyle: { right: 66, top: 4 },
      align: 'right',
    },
    {
      id: 'ess',
      label: '储能',
      icon: <Battery className="w-5 h-5" />,
      value: ENERGY_FLOW.essCharge,
      unit: 'kW',
      sub: `SOC ${ENERGY_FLOW.soc}%`,
      valuePrefix: '充电',
      color: 'text-emerald-500',
      ring: 'border-emerald-200 bg-emerald-50',
      style: { left: 14, bottom: 12 },
      textStyle: { left: 66, bottom: 58 },
      align: 'left',
    },
    {
      id: 'load',
      label: '负载',
      icon: <Factory className="w-5 h-5" />,
      value: ENERGY_FLOW.loadConsumption,
      unit: 'kW',
      sub: '用电',
      color: 'text-violet-500',
      ring: 'border-violet-200 bg-violet-50',
      style: { right: 14, bottom: 12 },
      textStyle: { right: 66, bottom: 58 },
      align: 'right',
    },
  ];

  return (
    <div className="relative w-full h-[252px] bg-white rounded-xl border border-gray-100 overflow-hidden">
      {/* 连线管道（浅灰底 + 绿色流动段） */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 320 252" preserveAspectRatio="none">
        <defs>
          <linearGradient id="pipeGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#D1FAE5" />
            <stop offset="100%" stopColor="#A7F3D0" />
          </linearGradient>
        </defs>
        {[
          'M 64 48 L 140 48 Q 148 48 148 56 L 148 108',
          'M 256 48 L 180 48 Q 172 48 172 56 L 172 108',
          'M 64 204 L 140 204 Q 148 204 148 196 L 148 144',
          'M 256 204 L 180 204 Q 172 204 172 196 L 172 144',
        ].map((d, i) => (
          <g key={i}>
            <path d={d} fill="none" stroke="#E5E7EB" strokeWidth="7" strokeLinecap="round" />
            <path d={d} fill="none" stroke="url(#pipeGrad)" strokeWidth="4.5" strokeLinecap="round" />
            <path
              d={d}
              fill="none"
              stroke="#10B981"
              strokeWidth="3.5"
              strokeLinecap="round"
              className="flow-dash"
            />
          </g>
        ))}
      </svg>

      {/* 四角节点（图标 + 名称，数值贴在连线上方） */}
      {nodes.map((n) => (
        <div key={n.id} className="absolute" style={n.style}>
          <div className="flex flex-col items-center">
            <div className={`w-12 h-12 rounded-xl border flex items-center justify-center ${n.ring} ${n.color}`}>
              {n.icon}
            </div>
            <span className="text-[9px] text-gray-500 font-bold mt-1">{n.label}</span>
          </div>
          <div
            className={`absolute w-[96px] ${n.align === 'left' ? 'text-left' : 'text-right'}`}
            style={n.textStyle}
          >
            <span className="text-[8px] text-gray-400 font-bold block leading-tight truncate">{n.sub}</span>
            <span className={`text-[11px] font-black font-mono ${n.color} whitespace-nowrap`}>
              {n.valuePrefix && <span className="text-[8px] mr-0.5">{n.valuePrefix}</span>}
              {n.value}
              <span className="text-[8px] ml-0.5">{n.unit}</span>
            </span>
          </div>
        </div>
      ))}

      {/* 中心微网节点 */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="relative">
          <span className="absolute inset-0 rounded-full bg-emerald-400/40 animate-ping-slow" />
          <div className="relative w-14 h-14 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 flex flex-col items-center justify-center text-white shadow-lg shadow-emerald-500/30 border-2 border-emerald-200">
            <Zap className="w-5 h-5" />
            <span className="text-[8px] font-black mt-0.5">微网</span>
          </div>
        </div>
      </div>
    </div>
  );
};

/** 监控视图（时段趋势） */
const MonitorPanel: React.FC = () => {
  const data = Array.from({ length: 12 }, (_, i) => ({
    x: `${i * 2}:00`,
    pv: [0, 0, 12, 120, 386, 512, 486, 340, 168, 42, 0, 0][i],
    load: [186, 172, 165, 210, 468, 723, 690, 612, 540, 398, 265, 208][i],
  }));
  return (
    <div className="pt-1">
      <div className="h-[204px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 6, left: -22, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
            <XAxis
              dataKey="x"
              tick={{ fontSize: 8, fill: '#9CA3AF' }}
              axisLine={{ stroke: '#E5E7EB' }}
              tickLine={false}
            />
            <YAxis tick={{ fontSize: 9, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
            <Line type="monotone" dataKey="pv" stroke="#F59E0B" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="load" stroke="#8B5CF6" strokeWidth={2} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <ChartLegend
        items={[
          { color: '#F59E0B', label: '光伏出力' },
          { color: '#8B5CF6', label: '负载功率' },
        ]}
      />
    </div>
  );
};

// ==================== 微网 Tab ====================
const MicroPanel: React.FC = () => {
  const [flowView, setFlowView] = useState<'flow' | 'monitor'>('flow');

  const contribution = [
    {
      label: 'CO₂减排量',
      value: SOCIAL_CONTRIBUTION.co2Reduction,
      unit: '吨',
      grad: 'from-sky-400 to-blue-500',
      icon: <Recycle className="w-10 h-10" />,
    },
    {
      label: '等效植树量',
      value: SOCIAL_CONTRIBUTION.equivalentTrees,
      unit: '棵',
      grad: 'from-emerald-400 to-teal-500',
      icon: <TreePine className="w-10 h-10" />,
    },
    {
      label: '节约标准煤',
      value: SOCIAL_CONTRIBUTION.standardCoalSaved,
      unit: '吨',
      grad: 'from-amber-400 to-orange-500',
      icon: <Factory className="w-10 h-10" />,
    },
  ];

  return (
    <div className="space-y-3">
      {/* 运行模式条 */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50/60 rounded-xl px-3.5 py-2.5 flex items-center justify-between border border-emerald-100/70">
        <div className="flex items-center gap-2 min-w-0">
          <Plug className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="text-[11px] font-black text-emerald-800 truncate">{OVERVIEW_MODE_TEXT}</span>
        </div>
        <div className="flex items-center gap-1 shrink-0 ml-2">
          <CloudSun className="w-4 h-4 text-amber-500" />
          <span className="text-[11px] font-black text-gray-600 font-mono">24°C</span>
        </div>
      </div>

      {/* 能量全景 */}
      <div className="bg-white rounded-2xl border border-gray-100 p-3.5 shadow-xs">
        <SectionTitle
          title="能量全景"
          extra={
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5 bg-gray-100/80 p-0.5 rounded-lg">
                {(
                  [
                    { k: 'flow', label: '能流' },
                    { k: 'monitor', label: '监控' },
                  ] as const
                ).map((v) => (
                  <button
                    key={v.k}
                    id={`flow_view_${v.k}`}
                    onClick={() => setFlowView(v.k)}
                    className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${
                      flowView === v.k ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-400'
                    }`}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
              <button className="p-1 text-gray-400 active:text-emerald-500">
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          }
        />
        <AnimatePresence mode="wait">
          <motion.div
            key={flowView}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            {flowView === 'flow' ? <EnergyFlowPanel /> : <MonitorPanel />}
          </motion.div>
        </AnimatePresence>
        <p className="text-[9px] text-gray-400 text-center mt-2">
          {flowView === 'flow'
            ? '瞬时功率仅供参考，时段趋势请切换「监控」查看'
            : '时段趋势为 2 小时粒度抽点，点击「能流」可返回实时全景'}
        </p>
      </div>

      {/* 微网收益 */}
      <div className="bg-white rounded-2xl border border-gray-100 p-3.5 shadow-xs">
        <SectionTitle title="微网收益" />
        <div className="grid grid-cols-3 gap-2">
          <StatCell label="当月收益" value={MICROGRID_REVENUE.month} unit="元" valueClass="text-emerald-600" />
          <StatCell label="当年收益" value={MICROGRID_REVENUE.year} unit="万元" />
          <StatCell label="累计收益" value={MICROGRID_REVENUE.total} unit="万元" />
        </div>
      </div>

      {/* 今日供电 */}
      <div className="bg-white rounded-2xl border border-gray-100 p-3.5 shadow-xs">
        <SectionTitle title="今日供电" accent="bg-amber-500" />
        <div className="grid grid-cols-3 gap-2">
          <StatCell label="下网电量" value={TODAY_SUPPLY.gridImport} unit="kWh" />
          <StatCell label="光伏发电量" value={TODAY_SUPPLY.pvGeneration} unit="kWh" valueClass="text-amber-600" />
          <StatCell label="储能放电量" value={TODAY_SUPPLY.essDischarge} unit="kWh" valueClass="text-emerald-600" />
        </div>
      </div>

      {/* 今日用电 */}
      <div className="bg-white rounded-2xl border border-gray-100 p-3.5 shadow-xs">
        <SectionTitle title="今日用电" accent="bg-violet-500" />
        <div className="grid grid-cols-3 gap-2">
          <StatCell label="上网电量" value={TODAY_CONSUMPTION.gridExport} unit="kWh" />
          <StatCell label="储能充电量" value={TODAY_CONSUMPTION.essCharge} unit="kWh" valueClass="text-emerald-600" />
          <StatCell
            label="负载用电量"
            value={TODAY_CONSUMPTION.loadConsumption}
            unit="kWh"
            valueClass="text-violet-600"
          />
        </div>
      </div>

      {/* 社会贡献 */}
      <div className="bg-white rounded-2xl border border-gray-100 p-3.5 shadow-xs">
        <SectionTitle title="社会贡献" accent="bg-teal-500" />
        <div className="grid grid-cols-3 gap-2">
          {contribution.map((c) => (
            <div
              key={c.label}
              className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${c.grad} p-2.5 text-white`}
            >
              <div className="absolute -right-2 -bottom-2 opacity-20">{c.icon}</div>
              <div className="relative">
                <span className="text-[9px] font-bold opacity-90 block leading-tight">{c.label}</span>
                <span className="text-[16px] font-black font-mono block mt-1 leading-none">{c.value}</span>
                <span className="text-[8px] font-bold opacity-80 mt-0.5 block">{c.unit}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ==================== 电网 Tab ====================
const GridPanel: React.FC = () => {
  const [period, setPeriod] = useState<PeriodType>('day');
  const [date, setDate] = useState('2026-10-08');
  const d = GRID_PERIOD[period];

  const shift = (delta: number) => {
    const dt = new Date(date);
    dt.setDate(dt.getDate() + delta);
    setDate(dt.toISOString().slice(0, 10));
  };

  return (
    <div className="space-y-3">
      <div className="bg-white rounded-2xl border border-gray-100 p-3.5 shadow-xs">
        <SectionTitle title="效益总览" />
        <div className="grid grid-cols-2 gap-3">
          <StatCell label="今日下网电量" value={TODAY_SUPPLY.gridImport} unit="kWh" valueClass="text-amber-600" />
          <StatCell
            label="今日上网电量"
            value={TODAY_CONSUMPTION.gridExport}
            unit="kWh"
            valueClass="text-orange-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-3.5 shadow-xs">
        <SectionTitle title="电网电量" extra={<PeriodSwitch value={period} onChange={setPeriod} />} />
        <DateBar date={date} onShift={shift} />
        <div className="grid grid-cols-2 gap-3 mt-3">
          <StatCell label="下网电量" value={d.gridImport} unit="kWh" valueClass="text-amber-600" />
          <StatCell label="上网电量" value={d.gridExport} unit="kWh" valueClass="text-orange-500" />
        </div>
        <div className="mt-3 pt-3 border-t border-gray-50">
          <span className="text-[10px] font-black text-gray-700 block mb-1">运行情况</span>
          <RunningChart
            data={d.bars}
            bars={[
              { key: 'a', color: '#FBBF24' },
              { key: 'b', color: '#F97316' },
            ]}
          />
          <ChartLegend
            items={[
              { color: '#FBBF24', label: '电网下网电量' },
              { color: '#F97316', label: '电网上网电量' },
            ]}
          />
        </div>
      </div>
    </div>
  );
};

// ==================== 光伏 Tab ====================
const PvPanel: React.FC = () => {
  const [period, setPeriod] = useState<PeriodType>('day');
  const [date, setDate] = useState('2026-10-08');
  const d = PV_PERIOD[period];

  const shift = (delta: number) => {
    const dt = new Date(date);
    dt.setDate(dt.getDate() + delta);
    setDate(dt.toISOString().slice(0, 10));
  };

  return (
    <div className="space-y-3">
      <div className="bg-white rounded-2xl border border-gray-100 p-3.5 shadow-xs">
        <SectionTitle title="效益总览" accent="bg-amber-500" />
        <div className="grid grid-cols-2 gap-3">
          <StatCell label="今日发电量" value={TODAY_SUPPLY.pvGeneration} unit="kWh" valueClass="text-amber-600" />
          <StatCell label="今日光伏收益" value="2677.35" unit="元" valueClass="text-emerald-600" />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-3.5 shadow-xs">
        <SectionTitle title="设备统计" accent="bg-slate-400" />
        <div className="grid grid-cols-2 gap-3">
          <StatCell label="装机容量" value="1.6" unit="MWp" />
          <StatCell label="逆变器数量" value="1" unit="台" />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-3.5 shadow-xs">
        <SectionTitle title="发电量&收益" extra={<PeriodSwitch value={period} onChange={setPeriod} />} />
        <DateBar date={date} onShift={shift} />
        <div className="grid grid-cols-2 gap-3 mt-3">
          <StatCell label="发电量" value={d.generation} unit="kWh" valueClass="text-amber-600" />
          <StatCell label="光伏收益" value={d.revenue} unit="元" valueClass="text-emerald-600" />
        </div>
        <div className="mt-3 pt-3 border-t border-gray-50">
          <span className="text-[10px] font-black text-gray-700 block mb-1">运行情况</span>
          <RunningChart data={d.bars} bars={[{ key: 'a', color: '#3B82F6' }]} />
          <ChartLegend items={[{ color: '#3B82F6', label: '光伏发电量' }]} />
        </div>
      </div>
    </div>
  );
};

// ==================== 储能 Tab ====================
const EssPanel: React.FC = () => {
  const [period, setPeriod] = useState<PeriodType>('day');
  const [date, setDate] = useState('2026-10-08');
  const d = ESS_PERIOD[period];

  const shift = (delta: number) => {
    const dt = new Date(date);
    dt.setDate(dt.getDate() + delta);
    setDate(dt.toISOString().slice(0, 10));
  };

  return (
    <div className="space-y-3">
      <div className="bg-white rounded-2xl border border-gray-100 p-3.5 shadow-xs">
        <SectionTitle title="效益总览" accent="bg-violet-500" />
        <div className="grid grid-cols-3 gap-2">
          <StatCell label="今日充电量" value={TODAY_CONSUMPTION.essCharge} unit="kWh" valueClass="text-violet-600" />
          <StatCell label="今日放电量" value={TODAY_SUPPLY.essDischarge} unit="kWh" valueClass="text-fuchsia-500" />
          <StatCell label="今日储能收益" value="-375.44" unit="元" valueClass="text-red-500" />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-3.5 shadow-xs">
        <SectionTitle title="设备统计" accent="bg-slate-400" />
        <div className="grid grid-cols-2 gap-3">
          <StatCell label="装机容量" value="1.04" unit="MWh" />
          <StatCell label="储能数量" value="4" unit="台" />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-3.5 shadow-xs">
        <SectionTitle title="充放电量&收益" extra={<PeriodSwitch value={period} onChange={setPeriod} />} />
        <DateBar date={date} onShift={shift} />
        <div className="grid grid-cols-3 gap-2 mt-3">
          <StatCell label="充电量" value={d.charge} unit="kWh" valueClass="text-violet-600" />
          <StatCell label="放电量" value={d.discharge} unit="kWh" valueClass="text-fuchsia-500" />
          <StatCell label="储能收益" value={d.revenue} unit="元" valueClass="text-emerald-600" />
        </div>
        <div className="mt-3 pt-3 border-t border-gray-50">
          <span className="text-[10px] font-black text-gray-700 block mb-1">运行情况</span>
          <RunningChart
            data={d.bars}
            bars={[
              { key: 'b', color: '#F0ABFC' },
              { key: 'a', color: '#8B5CF6' },
            ]}
          />
          <ChartLegend
            items={[
              { color: '#F0ABFC', label: '储能放电量' },
              { color: '#8B5CF6', label: '储能充电量' },
            ]}
          />
        </div>
      </div>
    </div>
  );
};

// ==================== 充电站 Tab ====================
const EvPanel: React.FC = () => {
  const [period, setPeriod] = useState<PeriodType>('day');
  const [date, setDate] = useState('2026-10-08');
  const d = STATION_PERIOD[period];

  const shift = (delta: number) => {
    const dt = new Date(date);
    dt.setDate(dt.getDate() + delta);
    setDate(dt.toISOString().slice(0, 10));
  };

  return (
    <div className="space-y-3">
      <div className="bg-white rounded-2xl border border-gray-100 p-3.5 shadow-xs">
        <SectionTitle title="效益总览" accent="bg-cyan-500" />
        <div className="grid grid-cols-2 gap-3">
          <StatCell label="今日充电量" value="0" unit="kWh" />
          <StatCell label="今日充电收益" value="0" unit="元" />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-3.5 shadow-xs">
        <SectionTitle title="设备统计" accent="bg-slate-400" />
        <div className="grid grid-cols-2 gap-3">
          <StatCell label="直流桩数量" value="0" unit="台" />
          <StatCell label="交流桩数量" value="0" unit="台" />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-3.5 shadow-xs">
        <SectionTitle title="充电量&收益" extra={<PeriodSwitch value={period} onChange={setPeriod} />} />
        <DateBar date={date} onShift={shift} />
        <div className="grid grid-cols-2 gap-3 mt-3">
          <StatCell label="充电量" value={d.charge} unit="kWh" valueClass="text-cyan-600" />
          <StatCell label="充电收益" value={d.revenue} unit="元" valueClass="text-emerald-600" />
        </div>
        <div className="mt-3 pt-3 border-t border-gray-50">
          <span className="text-[10px] font-black text-gray-700 block mb-1">运行情况</span>
          <RunningChart data={d.bars} bars={[{ key: 'a', color: '#10B981' }]} yMax={10} />
          <ChartLegend items={[{ color: '#10B981', label: '充电站充电量' }]} />
        </div>
      </div>
    </div>
  );
};

// ==================== 主组件 ====================
export const OverviewTab: React.FC = () => {
  const [tab, setTab] = useState<StationTab>('micro');

  return (
    <div className="flex-1 overflow-y-auto bg-[#f6f7f9]">
      {/* 站点栏 */}
      <div className="px-4 pt-3 pb-1 flex items-center justify-between">
        <span className="text-[13px] font-black text-gray-900">1#站</span>
        <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600">
          <Wifi className="w-3.5 h-3.5" />
          在线
        </span>
      </div>

      {/* 子 Tab */}
      <div className="flex items-center gap-1 px-3 pb-2 overflow-x-auto scrollbar-none">
        {STATION_TABS.map((t) => (
          <button
            key={t.key}
            id={`ov_tab_${t.key}`}
            onClick={() => setTab(t.key)}
            className={`relative px-3 py-2 text-[12px] font-bold transition-all shrink-0 ${
              tab === t.key ? 'text-emerald-600' : 'text-gray-400'
            }`}
          >
            {t.label}
            {tab === t.key && (
              <motion.span
                layoutId="ovTabUnderline"
                className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-emerald-500 rounded-full"
              />
            )}
          </button>
        ))}
      </div>

      <div className="px-3 pb-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
          >
            {tab === 'micro' && <MicroPanel />}
            {tab === 'grid' && <GridPanel />}
            {tab === 'pv' && <PvPanel />}
            {tab === 'ess' && <EssPanel />}
            {tab === 'ev' && <EvPanel />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
