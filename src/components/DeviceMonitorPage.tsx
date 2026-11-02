/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 设备监控（小程序端）
 * --------------------------------------------------------------------------
 * 功能页 · 微网管理 → 设备监控。
 * 按四类设备分 tab：逆变器 / 储能 / 充电桩 / 电表，只做平台层的「设备台账 + 关键读数」。
 * 点进单台看曲线与参数（设备详情）还没定，卡片先不挂跳转，免得点出一个空页。
 */

import React, { useState } from 'react';
import { ChevronLeft, Zap, Battery, Plug, Gauge } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  DEVICE_CATEGORIES,
  DEVICE_DATA_NOTE,
  DEVICE_STATUS_META,
  DEVICE_SUMMARY,
  type DeviceCategoryKey,
  type DeviceItem,
} from '../data/deviceData';

interface DeviceMonitorPageProps {
  onBack: () => void;
}

/** 分类图标与配色：四类各有各的颜色，扫一眼就知道在看哪一类 */
const CATEGORY_ICON: Record<DeviceCategoryKey, { icon: React.ElementType; cls: string }> = {
  inverter: { icon: Zap, cls: 'bg-amber-50 text-amber-600' },
  ess: { icon: Battery, cls: 'bg-violet-50 text-violet-600' },
  charger: { icon: Plug, cls: 'bg-cyan-50 text-cyan-600' },
  meter: { icon: Gauge, cls: 'bg-slate-100 text-slate-600' },
};

const CATEGORY_LABEL: Record<DeviceCategoryKey, string> = {
  inverter: '逆变器',
  ess: '储能',
  charger: '充电桩',
  meter: '电表',
};

/** tab：全部 + 四个分类 */
type TabKey = 'all' | DeviceCategoryKey;

/** 展平成一维，供「全部」使用；每条带上自己属于哪一类 */
const ALL_DEVICES = DEVICE_CATEGORIES.flatMap((c) =>
  c.devices.map((device) => ({ device, category: c.key })),
);

/** 状态徽标：圆点 + 文案，颜色只表达运行状态，不表达设备类别 */
const StatusPill: React.FC<{ status: DeviceItem['status'] }> = ({ status }) => {
  const meta = DEVICE_STATUS_META[status];
  return (
    <span
      className={`inline-flex items-center gap-1 shrink-0 text-[9px] font-black px-1.5 py-0.5 rounded-full border ${meta.pill}`}
    >
      <span className={`w-1 h-1 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
};

const DeviceCard: React.FC<{
  device: DeviceItem;
  category: DeviceCategoryKey;
  /** 「全部」里混着四类设备，规格前带一句分类名，否则分不清这是台什么 */
  showCategory?: boolean;
}> = ({ device, category, showCategory }) => {
  const { icon: Icon, cls } = CATEGORY_ICON[category];
  const isAlarm = device.status === 'alarm';

  return (
    <div
      className={`bg-white rounded-2xl border p-3 shadow-xs ${
        isAlarm ? 'border-red-200' : 'border-gray-100'
      }`}
    >
      <div className="flex items-center gap-2.5">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${cls}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[12px] font-black text-gray-900 truncate">{device.name}</span>
            <StatusPill status={device.status} />
          </div>
          <span className="text-[9px] text-gray-400 font-bold block truncate mt-0.5">
            {showCategory ? `${CATEGORY_LABEL[category]} · ${device.spec}` : device.spec}
          </span>
        </div>
      </div>

      {/* 三个读数：标签在上、数值在下，跟报告里的指标卡一个读法 */}
      <div className="mt-2.5 pt-2.5 border-t border-gray-50 grid grid-cols-3 gap-1">
        {device.metrics.map((m) => (
          <div key={m.label} className="min-w-0">
            <span className="text-[9px] text-gray-400 font-bold block truncate">{m.label}</span>
            <div className="flex items-baseline gap-0.5 mt-0.5">
              <span
                className={`text-[13px] font-black font-mono leading-none ${
                  m.alert ? 'text-red-500' : 'text-gray-900'
                }`}
              >
                {m.value}
              </span>
              {m.unit && <span className="text-[8px] text-gray-400 font-bold">{m.unit}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/** 分类下没有设备：说清是「没接入」，不是「加载失败」 */
const EmptyDeviceList: React.FC<{ label: string; category: DeviceCategoryKey }> = ({
  label,
  category,
}) => {
  const { icon: Icon, cls } = CATEGORY_ICON[category];
  return (
    <div className="bg-white rounded-2xl border border-gray-100 px-4 py-8 min-h-[300px] flex flex-col items-center justify-center gap-2">
      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${cls}`}>
        <Icon className="w-5 h-5" />
      </div>
      <span className="text-[11px] font-black text-gray-500">本站暂未接入{label}</span>
      <p className="text-[9px] text-gray-400 leading-relaxed text-center">
        接入后设备会自动出现在这里，并按设备口径累计电量。
      </p>
    </div>
  );
};

export const DeviceMonitorPage: React.FC<DeviceMonitorPageProps> = ({ onBack }) => {
  /* 默认落在「全部」：先看见站里一共有哪些设备，再按类往下筛 */
  const [active, setActive] = useState<TabKey>('all');
  const current = DEVICE_CATEGORIES.find((c) => c.key === active) ?? DEVICE_CATEGORIES[0];

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
          {/* 概览：两个数都由设备列表派生。告警台数与告警明细不在这里 ——
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

          {/* 分类 tab：全部 + 四类，横向五等分，带台数 */}
          <div className="grid grid-cols-5 rounded-xl bg-white border border-gray-100 p-1">
            {(
              [
                { key: 'all' as const, label: '全部', count: DEVICE_SUMMARY.total },
                ...DEVICE_CATEGORIES.map((c) => ({
                  key: c.key,
                  label: c.label,
                  count: c.devices.length,
                })),
              ] as const
            ).map((c) => {
              const isActive = active === c.key;
              return (
                <button
                  key={c.key}
                  id={`device_tab_${c.key}`}
                  onClick={() => setActive(c.key)}
                  className={`py-1.5 rounded-lg text-[10px] font-black transition-all flex items-center justify-center gap-0.5 ${
                    isActive ? 'text-emerald-600 bg-emerald-50/60' : 'text-gray-400'
                  }`}
                >
                  {c.label}
                  <span className={`text-[8px] font-mono ${isActive ? 'text-emerald-500' : 'text-gray-400'}`}>
                    {c.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* 设备列表 */}
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="space-y-2.5"
            >
              {active === 'all' ? (
                ALL_DEVICES.map(({ device, category }) => (
                  <DeviceCard key={device.id} device={device} category={category} showCategory />
                ))
              ) : current.devices.length === 0 ? (
                <EmptyDeviceList label={current.label} category={current.key} />
              ) : (
                current.devices.map((d) => (
                  <DeviceCard key={d.id} device={d} category={current.key} />
                ))
              )}
            </motion.div>
          </AnimatePresence>

          <p className="text-[9px] text-gray-400 text-center pt-1">{DEVICE_DATA_NOTE}</p>
        </div>
      </div>
    </div>
  );
};

export default DeviceMonitorPage;
