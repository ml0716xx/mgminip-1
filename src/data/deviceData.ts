/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 设备监控 · 数据层
 * --------------------------------------------------------------------------
 * 四类设备：逆变器 / 储能 / 充电桩 / 电表，按设备一台一条列出来。
 *
 * 数字不是随手编的，全部咬住概览页那份实时快照（ENERGY_FLOW / TODAY_*）：
 *   光伏发电 486.74 + 电网下网 385.7 = 负载 723.24 + 储能充电 149.2
 * 这条平衡是概览页已经算好的，设备页只要照抄其中每一项，就不会出现
 * 「设备读数加起来和概览对不上」的尴尬。
 *
 * 台数也和经营分析报告对齐：inverterCount = 1、essCount = 4、evCount = 0。
 * 本站没有充电桩，所以充电桩分类是空态 —— 不是漏做，是这站真没有。
 *
 * 设备详情（点进去看曲线、参数、告警历史）还没定，这里只落平台层要用的
 * 台账 + 关键读数，详情页后面接。
 */

import { ENERGY_FLOW, TODAY_CONSUMPTION, TODAY_SUPPLY } from './overviewData';

/** 设备状态：只区分监控页要用的四种 */
export type DeviceStatus = 'running' | 'charging' | 'alarm' | 'offline';

export const DEVICE_STATUS_META: Record<
  DeviceStatus,
  { label: string; pill: string; dot: string }
> = {
  running: {
    label: '运行中',
    pill: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    dot: 'bg-emerald-500',
  },
  charging: {
    label: '充电中',
    pill: 'bg-sky-50 text-sky-600 border-sky-100',
    dot: 'bg-sky-500',
  },
  alarm: {
    label: '告警',
    pill: 'bg-red-50 text-red-600 border-red-100',
    dot: 'bg-red-500',
  },
  offline: {
    label: '离线',
    pill: 'bg-gray-100 text-gray-500 border-gray-200',
    dot: 'bg-gray-400',
  },
};

export interface DeviceMetric {
  label: string;
  value: string;
  unit?: string;
  /** 越限/异常，数值标红 */
  alert?: boolean;
}

export interface DeviceItem {
  id: string;
  name: string;
  /** 一句话说清这台是什么：装在哪、什么规格 */
  spec: string;
  status: DeviceStatus;
  metrics: DeviceMetric[];
}

export type DeviceCategoryKey = 'inverter' | 'ess' | 'charger' | 'meter';

export interface DeviceCategory {
  key: DeviceCategoryKey;
  label: string;
  devices: DeviceItem[];
}

const sum = (arr: number[]) => arr.reduce((s, v) => s + v, 0);

/* ------------------------------------------------------------ 储能：4 台 */
/**
 * 4 台储能柜的 SOC 与充电功率逐台给出。
 * 最后一台用总量减出来，保证「4 台之和 = 概览页总数」这条永远成立 ——
 * 以后有人改了快照里的 149.2，这里自动跟上，不用回来改四个数。
 */
const ESS_SOC_HEAD = [82.4, 80.9, 81.3];
const ESS_POWER_HEAD = [41.2, 38.6, 35.4];
const ESS_TEMP = [32.5, 33.1, 32.8, 34.2];

const essSoc = [...ESS_SOC_HEAD, +(ENERGY_FLOW.soc * 4 - sum(ESS_SOC_HEAD)).toFixed(1)];
const essPower = [...ESS_POWER_HEAD, +(ENERGY_FLOW.essCharge - sum(ESS_POWER_HEAD)).toFixed(1)];

const ESS_DEVICES: DeviceItem[] = essSoc.map((soc, i) => ({
  id: `ess-${i + 1}`,
  name: `储能柜-${i + 1}#`,
  spec: '260 kWh / 125 kW · PCS 一体柜',
  /* 四台都在充电（光伏余电入储），没有一台待机 */
  status: 'charging',
  metrics: [
    { label: 'SOC', value: soc.toFixed(1), unit: '%' },
    { label: '充电功率', value: essPower[i].toFixed(1), unit: 'kW' },
    { label: '电芯温度', value: ESS_TEMP[i].toFixed(1), unit: '℃' },
  ],
}));

/* -------------------------------------------------------- 电表：5 块 */
/**
 * 两块负荷表的功率与用电量用「总量 - 已知」算出来，
 * 保证支路之和等于概览页的负载功率 723.24 kW、今日负载用电 7928.2 kWh。
 */
const LOAD1_POWER = 412.6;
const LOAD1_ENERGY = 4520.3;
const load2Power = +(ENERGY_FLOW.loadConsumption - LOAD1_POWER).toFixed(1);
const load2Energy = +(TODAY_CONSUMPTION.loadConsumption - LOAD1_ENERGY).toFixed(1);

const METER_DEVICES: DeviceItem[] = [
  {
    id: 'meter-1',
    name: '并网计量电表',
    spec: '关口总表 · 三相四线',
    /* 与「消息 · 告警消息」里那条未恢复的「电网侧 C 相电压越限」同源 */
    status: 'alarm',
    metrics: [
      { label: '有功功率', value: ENERGY_FLOW.gridImport.toFixed(1), unit: 'kW' },
      { label: 'C 相电压', value: '246.8', unit: 'V', alert: true },
      { label: '今日下网', value: TODAY_SUPPLY.gridImport.toLocaleString(), unit: 'kWh' },
    ],
  },
  {
    id: 'meter-2',
    name: '光伏并网电表',
    spec: '光伏并网点 · 三相四线',
    status: 'running',
    metrics: [
      { label: '有功功率', value: ENERGY_FLOW.pvGeneration.toFixed(1), unit: 'kW' },
      { label: '电压', value: '231.5', unit: 'V' },
      { label: '今日发电', value: TODAY_SUPPLY.pvGeneration.toLocaleString(), unit: 'kWh' },
    ],
  },
  {
    id: 'meter-3',
    name: '储能计量电表',
    spec: '储能并网点 · 双向计量',
    status: 'running',
    metrics: [
      { label: '有功功率', value: ENERGY_FLOW.essCharge.toFixed(1), unit: 'kW' },
      { label: '电压', value: '230.8', unit: 'V' },
      { label: '今日充电', value: TODAY_CONSUMPTION.essCharge.toLocaleString(), unit: 'kWh' },
    ],
  },
  {
    id: 'meter-4',
    name: '1# 厂房负荷电表',
    spec: '生产负荷 · 三相四线',
    status: 'running',
    metrics: [
      { label: '有功功率', value: LOAD1_POWER.toFixed(1), unit: 'kW' },
      { label: '电压', value: '229.6', unit: 'V' },
      { label: '今日用电', value: LOAD1_ENERGY.toLocaleString(), unit: 'kWh' },
    ],
  },
  {
    id: 'meter-5',
    name: '2# 厂房负荷电表',
    spec: '生产负荷 · 三相四线',
    status: 'running',
    metrics: [
      { label: '有功功率', value: load2Power.toFixed(1), unit: 'kW' },
      { label: '电压', value: '230.2', unit: 'V' },
      { label: '今日用电', value: load2Energy.toLocaleString(), unit: 'kWh' },
    ],
  },
];

/* -------------------------------------------------- 逆变器：1 台 / 充电桩：0 台 */
const INVERTER_DEVICES: DeviceItem[] = [
  {
    id: 'inv-1',
    name: '1# 光伏逆变器',
    spec: '集中式 · 1.6 MW',
    status: 'running',
    metrics: [
      { label: '当前功率', value: ENERGY_FLOW.pvGeneration.toFixed(1), unit: 'kW' },
      { label: '今日发电', value: TODAY_SUPPLY.pvGeneration.toLocaleString(), unit: 'kWh' },
      { label: '转换效率', value: '98.6', unit: '%' },
    ],
  },
];

/** 本站未接入充电桩（经营报告 evCount = 0），分类保留但为空 */
const CHARGER_DEVICES: DeviceItem[] = [];

export const DEVICE_CATEGORIES: DeviceCategory[] = [
  { key: 'inverter', label: '逆变器', devices: INVERTER_DEVICES },
  { key: 'ess', label: '储能', devices: ESS_DEVICES },
  { key: 'charger', label: '充电桩', devices: CHARGER_DEVICES },
  { key: 'meter', label: '电表', devices: METER_DEVICES },
];

/** 顶部概览：全部由设备列表派生，不另外维护一份数字 */
export const DEVICE_SUMMARY = (() => {
  const all = DEVICE_CATEGORIES.flatMap((c) => c.devices);
  return {
    total: all.length,
    online: all.filter((d) => d.status !== 'offline').length,
    alarm: all.filter((d) => d.status === 'alarm').length,
  };
})();

/** 设备数据的采集口径，页脚用 */
export const DEVICE_DATA_NOTE = '数据来自站控网关 · 5 分钟刷新一次';
