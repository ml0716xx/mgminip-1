/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 设备监控（小程序端）
 * --------------------------------------------------------------------------
 * 功能页 · 微网管理 → 设备监控。
 * 一个「全部」列表装下所有类型（EMS、逆变器、储能、PCS、电池簇、储能空调、
 * 储能消防、电表、充电桩、充电枪、变压器、辐照仪、负载），不按类型分 tab。
 * 35 台设备的指标堆在卡片上没人看得完，所以卡上只留身份 + 在线 / 故障状态，
 * 点进去看「最新数据」点表。
 */

import React, { useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Wifi,
  WifiOff,
  ClipboardCheck,
  AlertTriangle,
  Check,
  Copy,
  Search,
  X,
  SlidersHorizontal,
  Zap,
  Battery,
  Plug,
  Gauge,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  DEVICE_DATA_NOTE,
  DEVICE_CONN_META,
  DEVICE_FAULT_META,
  DEVICE_SUMMARY,
  DEVICE_TABS,
  DEVICE_TYPE_LABEL,
  DEVICE_TYPE_OPTIONS,
  devicesInCategory,
  findDevice,
  formatDeviceRefreshTime,
  queryDevices,
  type DeviceCategoryKey,
  type DeviceConn,
  type DeviceItem,
  type DeviceTypeKey,
} from '../data/deviceData';

interface DeviceMonitorPageProps {
  onBack: () => void;
}

/** 设备卡左侧的小图标：按大类给个颜色，扫一眼能分出这是能量设备还是计量设备 */
const TYPE_ICON: Record<DeviceTypeKey, { icon: React.ElementType; cls: string }> = {
  ems: { icon: Gauge, cls: 'bg-emerald-50 text-emerald-600' },
  inverter: { icon: Zap, cls: 'bg-amber-50 text-amber-600' },
  ess: { icon: Battery, cls: 'bg-violet-50 text-violet-600' },
  pcs: { icon: Zap, cls: 'bg-indigo-50 text-indigo-600' },
  battery: { icon: Battery, cls: 'bg-purple-50 text-purple-600' },
  hvac: { icon: Gauge, cls: 'bg-sky-50 text-sky-600' },
  fire: { icon: AlertTriangle, cls: 'bg-orange-50 text-orange-600' },
  meter: { icon: Gauge, cls: 'bg-slate-100 text-slate-600' },
  charger: { icon: Plug, cls: 'bg-cyan-50 text-cyan-600' },
  gun: { icon: Plug, cls: 'bg-teal-50 text-teal-600' },
  transformer: { icon: Zap, cls: 'bg-rose-50 text-rose-600' },
  irradiance: { icon: Zap, cls: 'bg-yellow-50 text-yellow-600' },
  load: { icon: Gauge, cls: 'bg-gray-100 text-gray-600' },
};

/**
 * 设备状态：通信 + 故障两个维度并排，做成「图标 + 文字」，不用色块药丸。
 * 一台设备的「通不通」和「坏没坏」是两件事，所以并排摆、不合并：
 *   在线 / 离线 · 正常(0) / 故障(1)
 * 离线用灰色 —— 掉线不是故障，别把两种事混成同一个红色警告。
 */
const DeviceState: React.FC<{
  deviceId: string;
  conn: DeviceConn;
  faultCount: number;
}> = ({ deviceId, conn, faultCount }) => {
  const c = DEVICE_CONN_META[conn];
  const hasFault = faultCount > 0;
  const f = hasFault ? DEVICE_FAULT_META.fault : DEVICE_FAULT_META.normal;

  return (
    <span className="inline-flex items-center gap-2 shrink-0">
      <span
        id={`device_conn_${deviceId}`}
        className={`inline-flex items-center gap-0.5 text-[9px] font-black whitespace-nowrap ${c.cls}`}
      >
        {conn === 'online' ? (
          <Wifi className="w-2.5 h-2.5 shrink-0" />
        ) : (
          <WifiOff className="w-2.5 h-2.5 shrink-0" />
        )}
        {c.label}
      </span>
      <span
        id={`device_fault_${deviceId}`}
        className={`inline-flex items-center gap-0.5 text-[9px] font-black whitespace-nowrap ${f.cls}`}
      >
        {hasFault ? (
          <AlertTriangle className="w-2.5 h-2.5 shrink-0" />
        ) : (
          <ClipboardCheck className="w-2.5 h-2.5 shrink-0" />
        )}
        {f.label}
        <span className={`font-mono ${hasFault ? '' : 'text-gray-400'}`}>({faultCount})</span>
      </span>
    </span>
  );
};

/** 台账卡：只有身份和状态，指标留给详情页 */
const DeviceCard: React.FC<{ device: DeviceItem; onOpen: () => void }> = ({ device, onOpen }) => {
  const { icon: Icon, cls } = TYPE_ICON[device.type];
  const hasFault = device.faultCount > 0;

  return (
    <div
      id={`device_card_${device.id}`}
      onClick={onOpen}
      className={`bg-white rounded-2xl border px-3 py-2.5 shadow-xs cursor-pointer active:scale-[0.99] transition-transform ${
        hasFault ? 'border-red-200' : 'border-gray-100'
      }`}
    >
      <div className="flex items-center gap-2.5">
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${cls}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1.5">
            <span className="text-[12px] font-black text-gray-900 truncate">{device.name}</span>
            <DeviceState deviceId={device.id} conn={device.conn} faultCount={device.faultCount} />
          </div>
          {/* 列表只要名称和 SN：型号规格在详情页看，35 台堆在卡上反而更难扫 */}
          <span className="text-[9px] text-gray-400 font-mono font-bold block truncate mt-1">
            SN {device.sn}
          </span>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
      </div>
    </div>
  );
};

/** 详情页的两个页签：指标在前、最新数据在后（只有四类设备有指标） */
const DetailTabs: React.FC<{ active: 'metric' | 'latest'; onChange: (k: 'metric' | 'latest') => void }> = ({
  active,
  onChange,
}) => (
  <div className="flex items-center gap-5 border-b border-gray-200 px-1">
    {(
      [
        { key: 'metric' as const, label: '指标' },
        { key: 'latest' as const, label: '最新数据' },
      ]
    ).map((t) => {
      const on = active === t.key;
      return (
        <button
          key={t.key}
          id={`device_detail_tab_${t.key}`}
          onClick={() => onChange(t.key)}
          className={`relative pb-1.5 pt-0.5 text-[11px] font-black transition-colors ${
            on ? 'text-emerald-600' : 'text-gray-400'
          }`}
        >
          {t.label}
          {on && <span className="absolute left-0 -bottom-px h-0.5 w-full bg-emerald-500 rounded-full" />}
        </button>
      );
    })}
  </div>
);

/**
 * 指标页签：按业务给的三张截图的版式
 *   kpi —— 三等分大数（逆变器的三个发电指标）
 *   kv  —— 两列「标签 - 数值」（储能 11 项、充电桩 6 项、充电枪 8 项）
 * 数值全部来自点表，和「最新数据」看到的是同一份。
 */
const MetricView: React.FC<{ device: DeviceItem }> = ({ device }) => (
  <div className="space-y-3">
    {device.metrics?.map((sec, si) =>
      sec.layout === 'kpi' ? (
        <div key={si} className="bg-white rounded-2xl border border-gray-100 shadow-xs px-3.5 py-3">
          <div className="grid grid-cols-3">
            {sec.items.map((it, i) => {
              const [num, ...unit] = it.value.split(' ');
              return (
                <div key={it.label} className={`min-w-0 ${i > 0 ? 'border-l border-gray-100 pl-2' : ''}`}>
                  <span className="text-[9px] text-gray-400 font-bold block truncate">{it.label}</span>
                  <div className="flex items-baseline gap-0.5 mt-1">
                    <span className="text-[13px] font-black font-mono leading-none text-gray-900">
                      {num}
                    </span>
                    {unit.length > 0 && (
                      <span className="text-[8px] text-gray-400 font-bold shrink-0">{unit.join(' ')}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div key={si} className="bg-white rounded-2xl border border-gray-100 shadow-xs px-3.5 py-2">
          {sec.title && <span className="text-[11px] font-black text-gray-800 block mb-1">{sec.title}</span>}
          <div className="grid grid-cols-2 gap-x-3">
            {sec.items.map((it) => {
              /* 只有储能的工作状态与系统故障带色点，其余是纯数值 */
              const dot =
                it.label === '工作状态'
                  ? it.value === '充电'
                    ? 'bg-sky-500'
                    : it.value === '放电'
                      ? 'bg-amber-500'
                      : 'bg-gray-400'
                  : it.label === '系统故障'
                    ? it.value === '正常'
                      ? 'bg-emerald-500'
                      : 'bg-red-500'
                    : null;
              return (
                <div key={it.label} className="flex items-center justify-between gap-1.5 min-w-0 py-1.5">
                  <span className="text-[10px] text-gray-400 font-bold shrink-0">{it.label}</span>
                  <span className="text-[11px] font-black font-mono text-gray-900 truncate text-right">
                    {dot && (
                      <span className={`inline-block w-1.5 h-1.5 rounded-full ${dot} mr-1 align-middle`} />
                    )}
                    {it.value}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ),
    )}
    {device.strings && <StringSection device={device} />}
  </div>
);

/** 最新数据点表：两列，标签左、数值右，跟现场点表一个读法 */
const PointTable: React.FC<{ device: DeviceItem }> = ({ device }) => {
  /* 整行占满的点（表号）不参与左右列计数，否则后面每一行的分隔线都会错位 */
  let col = 0;
  const cells = device.points.map((p) => {
    const full = !!p.full;
    const left = !full && col % 2 === 0;
    if (!full) col += 1;
    return { p, full, left };
  });

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
      <div className="grid grid-cols-2">
        {cells.map(({ p, full, left }, i) => (
          <div
            key={`${p.label}-${i}`}
            className={`flex items-baseline justify-between gap-1 px-2.5 py-2 border-b border-gray-50 min-w-0 ${
              full ? 'col-span-2' : left ? 'border-r border-r-gray-50' : ''
            }`}
          >
            <span className="text-[9px] text-gray-400 font-bold leading-snug min-w-0">
              {p.label}
            </span>
            <span className="text-[10px] font-black font-mono text-gray-900 whitespace-nowrap shrink-0">
              {p.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

/** 逆变器组串：112 串只展示前 6 串，标题写明比例，免得以为漏了 */
const StringSection: React.FC<{ device: DeviceItem }> = ({ device }) =>
  device.strings ? (
    <div className="bg-white rounded-2xl border border-gray-100 p-3 shadow-xs">
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-[11px] font-black text-gray-800">直流侧组串</span>
        <span className="text-[9px] text-gray-400 font-bold">
          前 {device.strings.length} / 共 {device.stringTotal} 串
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {device.strings.map((s) => (
          <div key={s.name} className="rounded-xl bg-gray-50/70 border border-gray-100 px-2.5 py-2">
            <span className="text-[10px] font-black text-gray-700 block mb-1">{s.name}</span>
            {[
              { label: '组串电压', value: `${s.voltage.toFixed(1)} V` },
              { label: '组串电流', value: `${s.current.toFixed(1)} A` },
              { label: '离散率', value: `${s.divergence.toFixed(2)} %` },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between gap-1">
                <span className="text-[9px] text-gray-400 font-bold">{row.label}</span>
                <span className="text-[10px] font-black font-mono text-gray-800">{row.value}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  ) : null;

/**
 * 下属设备：充电桩带枪、储能柜带 PCS / 电池簇 / 消防 / 空调，同一套入口。
 * 数值都在子设备自己的页面上，这里只给「是谁、现在什么状态」。
 */
const ChildSection: React.FC<{ title: string; ids: string[]; onOpen: (id: string) => void }> = ({
  title,
  ids,
  onOpen,
}) => {
  const kids = ids.map((id) => findDevice(id)).filter(Boolean) as DeviceItem[];
  if (kids.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-3 shadow-xs">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] font-black text-gray-800">{title}</span>
        <span className="text-[9px] text-gray-400 font-bold">{kids.length} 台</span>
      </div>
      {kids.map((k) => {
        const { icon: Icon, cls } = TYPE_ICON[k.type];
        const state = k.points[0]?.value ?? '--';
        return (
          <div
            key={k.id}
            id={`child_link_${k.id}`}
            onClick={() => onOpen(k.id)}
            className="flex items-center gap-2 py-1.5 border-b border-gray-50 last:border-0 active:opacity-60"
          >
            <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${cls}`}>
              <Icon className="w-3 h-3" />
            </div>
            <span className="text-[10px] font-black text-gray-800 truncate flex-1 min-w-0">{k.name}</span>
            <span className="text-[9px] text-gray-400 font-bold shrink-0">
              {DEVICE_TYPE_LABEL[k.type]} · {state}
            </span>
            <ChevronRight className="w-3 h-3 text-gray-300 shrink-0" />
          </div>
        );
      })}
    </div>
  );
};

/** 搜不到：说清是「搜不到」而不是「没设备」，给一键回退 */
const NoResult: React.FC<{ onReset: () => void }> = ({ onReset }) => (
  <div className="bg-white rounded-2xl border border-gray-100 px-4 py-9 flex flex-col items-center gap-1.5">
    <div className="w-9 h-9 rounded-2xl bg-gray-50 flex items-center justify-center">
      <Search className="w-4 h-4 text-gray-300" />
    </div>
    <span className="text-[11px] font-black text-gray-500">没有匹配的设备</span>
    <p className="text-[9px] text-gray-400 text-center">换个关键词，或清除条件看全部。</p>
    <button
      id="btn_no_result_reset"
      onClick={onReset}
      className="mt-1.5 text-[10px] font-black text-emerald-600 border border-emerald-200 bg-emerald-50 rounded-lg px-3 py-1"
    >
      清除条件
    </button>
  </div>
);

export const DeviceMonitorPage: React.FC<DeviceMonitorPageProps> = ({ onBack }) => {
  /* 详情用页内状态而不是新路由：返回键一级一级退，符合小程序的心智 */
  const [detailId, setDetailId] = useState<string | null>(null);
  const [active, setActive] = useState<DeviceCategoryKey>('all');
  /* 每进一次详情重新取一次时间：切设备 / 返回再进都刷新，跟真实拉数一致 */
  const refreshAt = useMemo(() => formatDeviceRefreshTime(), [detailId]);
  const detail = detailId ? findDevice(detailId) : undefined;
  const [copied, setCopied] = useState(false);
  /* 有指标页的设备默认落在「指标」，其余只有「最新数据」 */
  const [detailTab, setDetailTab] = useState<'metric' | 'latest'>('latest');
  /* 列表查询：关键词（名称 / SN）+ 类型筛选，两者可以叠加 */
  const [keyword, setKeyword] = useState('');
  const [typeFilter, setTypeFilter] = useState<DeviceTypeKey | 'all'>('all');
  const [filterOpen, setFilterOpen] = useState(false);

  const list = useMemo(
    () => queryDevices({ category: active, type: typeFilter, keyword }),
    [active, typeFilter, keyword],
  );
  const filtering = keyword.trim() !== '' || typeFilter !== 'all';

  const openDevice = (id: string) => {
    setDetailId(id);
    setDetailTab(findDevice(id)?.metrics?.length ? 'metric' : 'latest');
    setCopied(false);
  };

  const resetFilter = () => {
    setKeyword('');
    setTypeFilter('all');
  };

  /** 复制 SN：先走剪贴板 API，不行再用隐藏 textarea 兜底（小程序 WebView 里常有权限限制） */
  const copySn = async (sn: string) => {
    const fallback = () => {
      const ta = document.createElement('textarea');
      ta.value = sn;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    };
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(sn);
      else if (!fallback()) return;
    } catch {
      if (!fallback()) return;
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  if (detail) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between gap-2 px-3 py-2.5 bg-white border-b border-gray-100 shrink-0">
          <button
            onClick={() => setDetailId(null)}
            id="btn_device_detail_back"
            className="p-1 text-gray-600 active:text-emerald-500 shrink-0"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-[13px] font-black text-gray-900 truncate">{detail.name}</span>
          <DeviceState
            deviceId={`detail_${detail.id}`}
            conn={detail.conn}
            faultCount={detail.faultCount}
          />
        </div>

        <div className="flex-1 overflow-y-auto bg-[#f6f7f9]">
          <div className="px-3 pt-2.5 pb-6 space-y-3">
            {/* 设备身份 + 数据新鲜度：看读数之前先确认「这是哪台、什么时候的」 */}
            <div className="space-y-0.5">
              <span className="text-[9px] text-gray-400 font-bold block">
                {DEVICE_TYPE_LABEL[detail.type]} · {detail.spec}
              </span>
              <div className="flex items-center gap-1 text-[9px] text-gray-400">
                <Clock className="w-2.5 h-2.5 shrink-0" />
                <span className="font-bold shrink-0">设备刷新时间</span>
                <span
                  id="device_refresh_time"
                  className="font-mono font-bold tabular-nums text-gray-500"
                >
                  {refreshAt}
                </span>
              </div>
            </div>

            {/* SN 单独一张卡：现场报修、对账都要抄这串，给个复制键少一次手打 */}
            <div className="bg-white rounded-2xl border border-gray-100 px-3 py-2.5 shadow-xs flex items-center justify-between gap-2">
              <div className="min-w-0">
                <span className="text-[9px] text-gray-400 font-bold block">设备 SN</span>
                <span
                  id="device_sn"
                  className="text-[11px] font-black font-mono text-gray-900 block truncate mt-0.5"
                >
                  {detail.sn}
                </span>
              </div>
              <button
                id="btn_copy_sn"
                onClick={() => copySn(detail.sn)}
                className={`shrink-0 inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[9px] font-black border transition-colors ${
                  copied
                    ? 'text-emerald-600 border-emerald-200 bg-emerald-50'
                    : 'text-gray-500 border-gray-200 bg-white active:bg-gray-50'
                }`}
              >
                {copied ? <Check className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5" />}
                {copied ? '已复制' : '复制'}
              </button>
            </div>

            {/* 只有逆变器 / 储能 / 充电桩 / 充电枪有指标页，其余设备直接看最新数据 */}
            {detail.metrics?.length ? (
              <>
                <DetailTabs active={detailTab} onChange={setDetailTab} />
                {detailTab === 'metric' ? (
                  <MetricView device={detail} />
                ) : (
                  <PointTable device={detail} />
                )}
              </>
            ) : (
              <PointTable device={detail} />
            )}

            {/* 下属设备常驻：切哪个页签都在，柜/桩是个整体的这层关系不能藏起来 */}
            {detail.childIds && (
              <ChildSection title="下属设备" ids={detail.childIds} onOpen={openDevice} />
            )}
            {detail.gunIds && (
              <ChildSection title="下属充电枪" ids={detail.gunIds} onOpen={openDevice} />
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* 顶部导航 */}
      <div className="flex items-center justify-between px-3 py-2.5 bg-white border-b border-gray-100 shrink-0">
        <button onClick={onBack} id="btn_device_back" className="p-1 text-gray-600 active:text-emerald-500">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="text-[13px] font-black text-gray-900">设备监控</span>
        <span className="w-6" />
      </div>

      <div className="flex-1 overflow-y-auto bg-[#f6f7f9]">
        <div className="px-3 pt-2.5 pb-6 space-y-3">
          {/* 概览：两个数都由台账派生。告警台数与告警明细不在这里 ——
              告警统一走「消息 · 告警消息」，设备页只回答「有多少台、通不通」 */}
          <div className="bg-white rounded-2xl border border-gray-100 p-3.5 shadow-xs">
            <div className="grid grid-cols-2">
              {[
                { label: '设备总数', value: DEVICE_SUMMARY.total, unit: '台', tone: 'text-gray-900' },
                { label: '在线', value: DEVICE_SUMMARY.online, unit: '台', tone: 'text-emerald-600' },
              ].map((it, i) => (
                <div
                  key={it.label}
                  className={`text-center ${i > 0 ? 'border-l border-gray-100' : ''}`}
                >
                  <span className="text-[9px] text-gray-400 font-bold block">{it.label}</span>
                  <div className="flex items-baseline justify-center gap-0.5 mt-1">
                    <span className={`text-[19px] font-black font-mono leading-none ${it.tone}`}>
                      {it.value}
                    </span>
                    <span className="text-[9px] text-gray-400 font-bold">{it.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 搜索 + 类型筛选：名称和 SN 都能搜，类型是第二个维度 */}
          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0 flex items-center gap-1.5 bg-white border border-gray-100 rounded-xl px-2.5 py-2">
              <Search className="w-3.5 h-3.5 text-gray-300 shrink-0" />
              <input
                id="device_search"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="搜索设备名称 / SN"
                className="w-full min-w-0 bg-transparent outline-none text-[11px] font-bold text-gray-800 placeholder:text-gray-300 placeholder:font-normal"
              />
              {keyword && (
                <button
                  id="btn_clear_search"
                  onClick={() => setKeyword('')}
                  className="shrink-0 p-0.5 text-gray-300 active:text-gray-500"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <button
              id="btn_type_filter"
              onClick={() => setFilterOpen((v) => !v)}
              className={`shrink-0 inline-flex items-center gap-1 rounded-xl border px-2.5 py-2 text-[10px] font-black transition-colors ${
                typeFilter !== 'all' || filterOpen
                  ? 'text-emerald-600 border-emerald-200 bg-emerald-50'
                  : 'text-gray-500 border-gray-100 bg-white'
              }`}
            >
              <SlidersHorizontal className="w-3 h-3" />
              {typeFilter === 'all' ? '类型' : DEVICE_TYPE_LABEL[typeFilter]}
            </button>
          </div>

          {/* 类型筛选面板：只列台账里真实存在的类型，点一个就收起来 */}
          {filterOpen && (
            <div id="device_type_filter" className="bg-white rounded-2xl border border-gray-100 p-2 flex flex-wrap gap-1.5">
              {[{ key: 'all' as const, label: '全部类型' }, ...DEVICE_TYPE_OPTIONS].map((opt) => {
                const on = typeFilter === opt.key;
                return (
                  <button
                    key={opt.key}
                    id={`device_type_${opt.key}`}
                    onClick={() => {
                      setTypeFilter(opt.key);
                      setFilterOpen(false);
                    }}
                    className={`px-2 py-1 rounded-lg text-[9px] font-black border transition-colors ${
                      on
                        ? 'text-emerald-600 border-emerald-200 bg-emerald-50'
                        : 'text-gray-500 border-gray-100 bg-gray-50/60'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          )}

          {/* 分类 tab：全部 / 储能 / 逆变器 / 充电桩，四等分带台数 */}
          <div className="grid grid-cols-4 gap-1 rounded-xl bg-white border border-gray-100 p-1">
            {DEVICE_TABS.map((tab) => {
              const on = active === tab.key;
              const count = devicesInCategory(tab.key).length;
              return (
                <button
                  key={tab.key}
                  id={`device_tab_${tab.key}`}
                  onClick={() => setActive(tab.key)}
                  className={`py-1.5 rounded-lg text-[10px] font-black transition-all flex items-center justify-center gap-0.5 ${
                    on ? 'text-emerald-600 bg-emerald-50/60' : 'text-gray-400'
                  }`}
                >
                  {tab.label}
                  <span className={`text-[8px] font-mono ${on ? 'text-emerald-500' : 'text-gray-400'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {filtering && (
            <div className="flex items-center justify-between px-0.5 -mt-1">
              <span id="device_result_count" className="text-[9px] text-gray-400 font-bold">
                找到 {list.length} 台
              </span>
              <button
                id="btn_reset_filter"
                onClick={resetFilter}
                className="text-[9px] font-black text-emerald-600"
              >
                清除条件
              </button>
            </div>
          )}

          {/* 设备列表：切换分类时整段淡入，别让 35 张卡硬跳 */}
          {list.length === 0 ? (
            <NoResult onReset={resetFilter} />
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
                className="space-y-2"
              >
                {list.map((d) => (
                  <DeviceCard key={d.id} device={d} onOpen={() => openDevice(d.id)} />
                ))}
              </motion.div>
            </AnimatePresence>
          )}

          <p className="text-[9px] text-gray-400 text-center pt-1">{DEVICE_DATA_NOTE}</p>
        </div>
      </div>
    </div>
  );
};

export default DeviceMonitorPage;
