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
  History,
  Zap,
  Battery,
  Plug,
  Gauge,
} from 'lucide-react';
import { motion } from 'motion/react';
import {
  DEVICE_DATA_NOTE,
  DEVICE_CONN_META,
  DEVICE_FAULT_META,
  DEVICE_LIST,
  DEVICE_SUMMARY,
  DEVICE_TYPE_LABEL,
  findDevice,
  formatDeviceRefreshTime,
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
          <span className="text-[9px] text-gray-400 font-bold block truncate mt-0.5">
            {DEVICE_TYPE_LABEL[device.type]} · {device.spec}
          </span>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
      </div>
    </div>
  );
};

/** 最新数据 / 历史数据 的页签，样式照现场那张表 */
const DataTabs: React.FC<{ active: 'latest' | 'history'; onChange: (k: 'latest' | 'history') => void }> = ({
  active,
  onChange,
}) => (
  <div className="flex items-center gap-5 border-b border-gray-200 px-1">
    {(
      [
        { key: 'history' as const, label: '历史数据' },
        { key: 'latest' as const, label: '最新数据' },
      ]
    ).map((t) => {
      const on = active === t.key;
      return (
        <button
          key={t.key}
          id={`device_data_tab_${t.key}`}
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
            <span className="text-[9px] text-gray-400 font-bold truncate">{p.label}</span>
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

/** 充电桩下属的枪：数值都在枪自己的详情里，这里只做入口 */
const GunSection: React.FC<{ gunIds: string[]; onOpen: (id: string) => void }> = ({ gunIds, onOpen }) => {
  const guns = gunIds.map((id) => findDevice(id)).filter(Boolean) as DeviceItem[];
  if (guns.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-3 shadow-xs space-y-1">
      <span className="text-[11px] font-black text-gray-800 block mb-1">下属充电枪</span>
      {guns.map((g) => {
        const state = g.points.find((p) => p.label === '枪状态')?.value ?? '--';
        return (
          <div
            key={g.id}
            id={`gun_link_${g.id}`}
            onClick={() => onOpen(g.id)}
            className="flex items-center justify-between gap-2 py-1.5 border-b border-gray-50 last:border-0 active:opacity-60"
          >
            <span className="text-[10px] font-black text-gray-800 truncate">{g.name}</span>
            <span className="flex items-center gap-1 shrink-0">
              <span className="text-[9px] text-gray-400 font-bold">{state}</span>
              <ChevronRight className="w-3 h-3 text-gray-300" />
            </span>
          </div>
        );
      })}
    </div>
  );
};

/** 历史数据还没接，先把话说清楚，别摆一个空白页 */
const HistoryPlaceholder: React.FC = () => (
  <div className="bg-white rounded-2xl border border-gray-100 px-4 py-10 flex flex-col items-center gap-2">
    <div className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center">
      <History className="w-5 h-5 text-gray-300" />
    </div>
    <span className="text-[11px] font-black text-gray-500">历史数据按小时归档</span>
    <p className="text-[9px] text-gray-400 text-center leading-relaxed">
      本期先做最新数据，历史曲线等归档任务上线后再开放。
    </p>
  </div>
);

export const DeviceMonitorPage: React.FC<DeviceMonitorPageProps> = ({ onBack }) => {
  /* 详情用页内状态而不是新路由：返回键一级一级退，符合小程序的心智 */
  const [detailId, setDetailId] = useState<string | null>(null);
  const [dataTab, setDataTab] = useState<'latest' | 'history'>('latest');
  /* 每进一次详情重新取一次时间：切设备 / 返回再进都刷新，跟真实拉数一致 */
  const refreshAt = useMemo(() => formatDeviceRefreshTime(), [detailId]);
  const detail = detailId ? findDevice(detailId) : undefined;

  const openDevice = (id: string) => {
    setDetailId(id);
    setDataTab('latest');
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

            <DataTabs active={dataTab} onChange={setDataTab} />

            {dataTab === 'history' ? (
              <HistoryPlaceholder />
            ) : (
              <>
                <PointTable device={detail} />
                {detail.strings && <StringSection device={detail} />}
                {detail.gunIds && <GunSection gunIds={detail.gunIds} onOpen={openDevice} />}
              </>
            )}

            <p className="text-[9px] text-gray-400 text-center pt-1">{DEVICE_DATA_NOTE}</p>
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

          {/* 全部设备：一个列表装下所有类型，按现场点表顺序排 */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
            className="space-y-2"
          >
            {DEVICE_LIST.map((d) => (
              <DeviceCard key={d.id} device={d} onOpen={() => openDevice(d.id)} />
            ))}
          </motion.div>

          <p className="text-[9px] text-gray-400 text-center pt-1">{DEVICE_DATA_NOTE}</p>
        </div>
      </div>
    </div>
  );
};

export default DeviceMonitorPage;
