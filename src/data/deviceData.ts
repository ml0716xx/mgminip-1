/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 设备监控 · 数据层
 * --------------------------------------------------------------------------
 * 台账只有一份，按设备类型排下来（类型顺序与现场点表下拉框一致）：
 *   EMS / 逆变器 / 储能 / PCS / 电池簇 / 储能空调 / 储能消防 /
 *   电表 / 充电桩 / 充电枪 / 变压器 / 辐照仪 / 负载
 *
 * 每台设备只存两样东西：
 *   ① 身份 —— 名称、规格、通信状态、故障条数
 *   ② 点表 —— 「最新数据」里的字段，顺序即展示顺序
 * 列表卡不再放指标：整机 17 台，指标堆在卡上没人看得完，点进去看最新数据更清楚。
 *
 * 层级：整机 17 台在前台列表里出现；PCS / 电池簇 / 消防 / 空调挂在储能柜下，
 * 充电枪挂在充电桩下，只在上级设备详情的「下属设备」里出现，不单独占一张卡。
 *
 * 数字不是随手编的，全部咬住概览页那份实时快照（ENERGY_FLOW / TODAY_*）：
 *   光伏 486.74 + 下网 385.7 = 负载 723.24 + 储能 149.2
 * 分项一律用「总量 − 已知」算出来，保证几台之和永远等于概览上的总数。
 */

import { ENERGY_FLOW, TODAY_CONSUMPTION, TODAY_SUPPLY } from './overviewData';
import { BUSINESS_REPORT } from './businessReportData';

/* ------------------------------------------------------------ 状态两维度 */
/**
 * 通信与故障分开存，不合成一个字段：
 *   · conn       —— 通信通不通（在线 / 离线），说的是「数据还上不上得来」
 *   · faultCount —— 故障条数，0 就是「正常」，>0 显示条数
 * 一台设备可以「离线」但「无故障」（掉线不等于坏了），也可以「在线」但「故障 (1)」。
 */
export type DeviceConn = 'online' | 'offline';

export const DEVICE_CONN_META: Record<DeviceConn, { label: string; cls: string }> = {
  online: { label: '在线', cls: 'text-emerald-600' },
  offline: { label: '离线', cls: 'text-gray-400' },
};

export const DEVICE_FAULT_META = {
  normal: { label: '正常', cls: 'text-emerald-600' },
  fault: { label: '故障', cls: 'text-red-500' },
} as const;

/* -------------------------------------------------------------- 设备类型 */
export type DeviceTypeKey =
  | 'ems'
  | 'inverter'
  | 'ess'
  | 'pcs'
  | 'battery'
  | 'hvac'
  | 'fire'
  | 'meter'
  | 'charger'
  | 'gun'
  | 'transformer'
  | 'irradiance'
  | 'load';

/** 台账卡上的类型名 */
export const DEVICE_TYPE_LABEL: Record<DeviceTypeKey, string> = {
  ems: 'EMS',
  inverter: '逆变器',
  ess: '储能',
  pcs: 'PCS',
  battery: '电池簇',
  hvac: '储能空调',
  fire: '储能消防',
  meter: '电表',
  charger: '充电桩',
  gun: '充电枪',
  transformer: '变压器',
  irradiance: '辐照仪',
  load: '负载',
};

/* -------------------------------------------------------------- 归类 */
/**
 * 设备监控只分三组：储能 / 逆变器 / 充电桩，全部在「全部」里也能看到。
 * 归类按子系统走，不按点表里的叶子类型走 —— 现场说「储能」指的是整套
 * （柜 + PCS + 簇 + 空调 + 消防），说「充电桩」也带着枪。
 * EMS / 电表 / 变压器 / 辐照仪 / 负载 属于站级公共设备，只在「全部」里出现。
 */
export type DeviceCategoryKey = 'all' | 'ess' | 'inverter' | 'charger';

const TYPE_CATEGORY: Record<DeviceTypeKey, Exclude<DeviceCategoryKey, 'all'> | null> = {
  ess: 'ess',
  pcs: 'ess',
  battery: 'ess',
  hvac: 'ess',
  fire: 'ess',
  inverter: 'inverter',
  charger: 'charger',
  gun: 'charger',
  ems: null,
  meter: null,
  transformer: null,
  irradiance: null,
  load: null,
};

/** 一个点：标签 + 已经带单位的数值，页面不再做格式化 */
export interface DevicePoint {
  label: string;
  value: string;
  /** 占满整行：表号这种长串两列放不下 */
  full?: boolean;
}

/** 逆变器组串：112 串太多，只展示前若干串 */
export interface InverterString {
  name: string;
  voltage: number;
  current: number;
  divergence: number;
}

export interface DeviceItem {
  id: string;
  type: DeviceTypeKey;
  name: string;
  /** 设备 SN：出厂编号，报修对账都靠它，详情页可复制 */
  sn: string;
  /** 一句话说清这台是什么：装在哪、什么规格 */
  spec: string;
  conn: DeviceConn;
  faultCount: number;
  /** 最新数据点表 */
  points: DevicePoint[];
  /**
   * 指标页签（只有逆变器 / 储能 / 充电桩 / 充电枪有）。
   * 不另写一套数字，全部按 label 从 points 里取，两个页签永远不会打架。
   */
  metrics?: MetricSection[];
  /** 逆变器专用：直流侧组串 */
  strings?: InverterString[];
  stringTotal?: number;
  /** 充电桩专用：下属枪的设备 id，数值只存一份在枪身上 */
  gunIds?: string[];
  /** 储能柜专用：挂在这台柜下面的 PCS / 电池簇 / 消防 / 空调，同样只存 id */
  childIds?: string[];
}

/** 指标页签里的一组：kpi 是三等分大数，kv 是两列标签-数值 */
export interface MetricSection {
  title?: string;
  layout: 'kpi' | 'kv';
  items: DevicePoint[];
}

/** SN 统一在出口处按类型编号补齐，各设备字面量里不必逐台手写 */
type DeviceSeed = Omit<DeviceItem, 'sn'> & { sn?: string };

/* -------------------------------------------------------------- 小工具 */
const sum = (arr: number[]) => arr.reduce((s, v) => s + v, 0);
/** 整数万千瓦时之类的大数，带千分位 */
const big = (v: number) => Math.round(v).toLocaleString('zh-CN');
/** 一位小数 + 千分位 */
const one = (v: number) => v.toLocaleString('zh-CN', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
/** 三相拆分：给 A、B 两相，C 相用「总量 − 已知」兜底，保证三相加起来等于总量 */
const split3 = (total: number, a: number, b: number): [number, number, number] => [
  a,
  b,
  +(total - a - b).toFixed(1),
];

/* ------------------------------------------------------------ EMS 网关 1 台 */
/**
 * 网关点表就两项（现场截图口径）：信号强度、并离网模式。
 * 站级功率那些量不挂在网关身上 —— 网关只回答「通得好不好、现在并网还是离网」。
 */
const EMS_DEVICES: DeviceSeed[] = [
  {
    id: 'ems-1',
    type: 'ems',
    name: 'EMS 网关',
    spec: '站控网关 · Modbus TCP',
    conn: 'online',
    faultCount: 0,
    points: [
      { label: '信号强度', value: '100 %' },
      { label: '并离网模式', value: '0' },
    ],
  },
];

/* ------------------------------------------------------------- 逆变器 1 台 */
/**
 * 1.6 MWp 配 1 台集中式逆变器，直流侧上百串。
 * 详情只展示前 6 串（和业务截图的展示量一致），所以电量和「6 串之和」对不上是正常的，
 * 组串区标题会写明「前 6 / 共 112 串」。
 *
 * 单串功率 ≈ 486.7 kW / 112 ≈ 4.3 kW，对应 700V 上下、6~8A，量级自洽。
 */
const INVERTER_STRING_TOTAL = 112;

const INVERTER_STRINGS: InverterString[] = [
  { name: '1# 组串', voltage: 712.3, current: 6.4, divergence: 9.36 },
  { name: '2# 组串', voltage: 698.4, current: 7.9, divergence: 8.62 },
  { name: '3# 组串', voltage: 718.4, current: 6.8, divergence: 6.35 },
  { name: '4# 组串', voltage: 704.1, current: 7.2, divergence: 5.18 },
  { name: '5# 组串', voltage: 689.6, current: 7.6, divergence: 4.72 },
  { name: '6# 组串', voltage: 701.2, current: 6.9, divergence: 3.87 },
];

/** 三相相电压：A 相略高、C 相略低，跟现场读数一个样子 */
const INV_PHASE_V = [231.4, 230.8, 230.2];
/** 相电流 = 有功 / 3 / 相电压 */
const invPhaseCurrent = (v: number) => +((ENERGY_FLOW.pvGeneration * 1000) / 3 / v).toFixed(1);
/** 逆变器额定有功 */
const INVERTER_RATED_KW = 1600;

const INVERTER_DEVICES: DeviceSeed[] = [
  {
    id: 'inv-1',
    type: 'inverter',
    name: '1# 光伏逆变器',
    spec: '集中式 · 1.6 MW',
    conn: 'online',
    faultCount: 0,
    /* 点表照现场截图：频率 / 三相电压电流 / 功率 / 限定值 / 组串离散率 / 直流输入电压 */
    points: [
      { label: '交流输出频率', value: '50.05 Hz' },
      { label: 'C相交流输出电压', value: `${INV_PHASE_V[2].toFixed(1)} V` },
      { label: 'B相交流输出电压', value: `${INV_PHASE_V[1].toFixed(1)} V` },
      { label: 'A相交流输出电压', value: `${INV_PHASE_V[0].toFixed(1)} V` },
      { label: '有功功率', value: `${one(ENERGY_FLOW.pvGeneration)} kW` },
      { label: '有功功率限定值', value: `${big(INVERTER_RATED_KW)} kW` },
      { label: '组串1离散率', value: `${INVERTER_STRINGS[0].divergence.toFixed(2)} %` },
      { label: '无功功率', value: '-2.6 kVar' },
      { label: '组串2离散率', value: `${INVERTER_STRINGS[1].divergence.toFixed(2)} %` },
      { label: 'B相交流输出电流', value: `${invPhaseCurrent(INV_PHASE_V[1]).toFixed(1)} A` },
      { label: 'A相交流输出电流', value: `${invPhaseCurrent(INV_PHASE_V[0]).toFixed(1)} A` },
      { label: 'C相交流输出电流', value: `${invPhaseCurrent(INV_PHASE_V[2]).toFixed(1)} A` },
      { label: '现在功率', value: `${one(ENERGY_FLOW.pvGeneration)} kVA` },
      { label: '直流输入电压2', value: `${INVERTER_STRINGS[2].voltage.toFixed(1)} V` },
      { label: '直流输入电压1', value: `${INVERTER_STRINGS[0].voltage.toFixed(1)} V` },
      { label: '输出功率', value: `${one(ENERGY_FLOW.pvGeneration)} kW` },
      { label: '调节无功电量', value: '0.0 kVarh' },
      { label: '功率因数', value: '1.000' },
    ],
    strings: INVERTER_STRINGS,
    stringTotal: INVERTER_STRING_TOTAL,
  },
];

/* ---------------------------------------------------------- 储能 4 台 */
/**
 * 4 台储能柜的 SOC、功率、今日充放电量逐台给出。
 * 最后一台用总量减出来，保证「4 台之和 = 概览页总数」这条永远成立。
 *
 * 单柜 260 kWh：系统可充电量 = 260 ×(1−SOC)、可放电量 = 260 × SOC，
 * 两者相加恒等于额定容量，与截图的量级关系一致。
 */
const ESS_CAPACITY = 260;
const ESS_SOC_HEAD = [82.4, 80.9, 81.3];
const ESS_POWER_HEAD = [41.2, 38.6, 35.4];
const ESS_CHARGE_HEAD = [312.4, 305.6, 291.8];
const ESS_DISCHARGE_HEAD = [112.4, 108.6, 106.2];
const ESS_MAX_TEMP = [32.5, 33.1, 32.8, 34.2];
const ESS_TEMP_SPREAD = [1.1, 1.3, 1.0, 1.4];
const ESS_SOH = [99.2, 98.8, 99.0, 98.5];
/** 累计充放电量：投运以来，四台各有先后 */
const ESS_CUM_CHARGE = [78420, 77930, 78110, 77580];
const ESS_CUM_DISCHARGE = [71860, 71340, 71520, 71020];

const essSoc = [...ESS_SOC_HEAD, +(ENERGY_FLOW.soc * 4 - sum(ESS_SOC_HEAD)).toFixed(1)];
const essPower = [...ESS_POWER_HEAD, +(ENERGY_FLOW.essCharge - sum(ESS_POWER_HEAD)).toFixed(1)];
const essCharge = [...ESS_CHARGE_HEAD, +(TODAY_CONSUMPTION.essCharge - sum(ESS_CHARGE_HEAD)).toFixed(1)];
const essDischarge = [
  ...ESS_DISCHARGE_HEAD,
  +(TODAY_SUPPLY.essDischarge - sum(ESS_DISCHARGE_HEAD)).toFixed(1),
];

const ESS_DEVICES: DeviceSeed[] = essSoc.map((soc, i) => {
  const chargeable = +((ESS_CAPACITY * (100 - soc)) / 100).toFixed(1);
  const dischargeable = +((ESS_CAPACITY * soc) / 100).toFixed(1);

  return {
    id: `ess-${i + 1}`,
    type: 'ess',
    name: `储能柜-${i + 1}#`,
    spec: '260 kWh / 125 kW · PCS 一体柜',
    conn: 'online',
    faultCount: 0,
    /* 点表照现场截图：状态 / 通讯与故障 / 最大可充功率 / 剩余可充放容量 / 累计与今日电量 */
    points: [
      { label: '工作状态', value: '充电' },
      { label: '剩余可充电容量', value: `${chargeable.toFixed(2)} kWh` },
      { label: 'PCS 通讯错误状态', value: '通讯正常' },
      { label: '总有功功率', value: `${(-essPower[i]).toFixed(1)} kW` },
      { label: '电池簇(柜)最大可充电功率', value: '125.0 kW' },
      { label: '总无功功率', value: '-1.2 kVar' },
      { label: '剩余可放电容量', value: `${dischargeable.toFixed(2)} kWh` },
      { label: 'PCS 故障状态', value: '正常' },
      { label: 'BMS 通讯错误状态', value: '通讯正常' },
      { label: '门限状态', value: '门关闭' },
      { label: '总充电量', value: `${big(ESS_CUM_CHARGE[i])} kWh` },
      { label: '总放电量', value: `${big(ESS_CUM_DISCHARGE[i])} kWh` },
      { label: '系统故障', value: '正常' },
      { label: '工作模式', value: '并网恒流' },
      { label: '今日放电总电量', value: `${essDischarge[i].toFixed(1)} kWh` },
      { label: '系统SOC', value: `${soc.toFixed(1)} %` },
      { label: '今日充电总电量', value: `${essCharge[i].toFixed(1)} kWh` },
      { label: '防雷器', value: '正常' },
    ],
    /* 一台柜是一个整体：PCS、两簇、消防、空调都挂在柜下面，跟充电桩带枪一个关系 */
    childIds: [
      `pcs-${i + 1}`,
      `battery-${i + 1}-1`,
      `battery-${i + 1}-2`,
      `fire-${i + 1}`,
      `hvac-${i + 1}`,
    ],
  };
});

/* ------------------------------------------------------------- PCS 4 台 */
/**
 * 一台柜一个 PCS，参数跟对应储能柜咬死：
 * 直流侧电压 = 电池簇电压，直流电流 = 功率 / 电压，交流电流按 400V 线电压算。
 * 充电时 PCS 有功记负，与储能柜「当前功率 −41.2 kW」一致。
 */
const PCS_DC_VOLTAGE = [748.2, 742.6, 745.1, 750.4];
const PCS_IGBT_TEMP = [42.5, 43.1, 42.8, 44.2];

const PCS_DEVICES: DeviceSeed[] = essPower.map((p, i) => {
  const dcCurrent = +((p * 1000) / PCS_DC_VOLTAGE[i]).toFixed(1);
  const acCurrent = +((p * 1000) / (Math.sqrt(3) * 400.1)).toFixed(1);

  return {
    id: `pcs-${i + 1}`,
    type: 'pcs',
    name: `PCS-${i + 1}#`,
    spec: '125 kW · 三相四线 · 双向变流',
    conn: 'online',
    faultCount: 0,
    points: [
      { label: '运行状态', value: '充电' },
      { label: '有功功率', value: `${(-p).toFixed(1)} kW` },
      { label: '无功功率', value: '0.0 kVar' },
      { label: '直流侧电压', value: `${PCS_DC_VOLTAGE[i].toFixed(1)} V` },
      { label: '直流侧电流', value: `${(-dcCurrent).toFixed(1)} A` },
      { label: '交流侧线电压', value: '400.1 V' },
      { label: '交流侧电流', value: `${acCurrent.toFixed(1)} A` },
      { label: '电网频率', value: '50.01 Hz' },
      { label: '功率因数', value: '−0.99' },
      { label: 'IGBT 温度', value: `${PCS_IGBT_TEMP[i].toFixed(1)} ℃` },
      { label: '今日充电量', value: `${essCharge[i].toFixed(1)} kWh` },
      { label: '今日放电量', value: `${essDischarge[i].toFixed(1)} kWh` },
    ],
  };
});

/* ------------------------------------------------------------ 电池簇 8 簇 */
/**
 * 一柜两簇。两簇 SOC 取「柜 SOC ± 0.2」，平均正好回到柜值，上下级不会打架。
 * 总电流按「柜功率 / 2 簇 / 簇电压」算。
 */
const BATTERY_DEVICES: DeviceSeed[] = essSoc.flatMap((soc, i) =>
  [0, 1].map((k) => {
    const s = +(soc + (k === 0 ? 0.2 : -0.2)).toFixed(1);
    const voltage = PCS_DC_VOLTAGE[i];
    const current = +((essPower[i] / 2 / voltage) * 1000).toFixed(1);

    return {
      id: `battery-${i + 1}-${k + 1}`,
      type: 'battery' as const,
      name: `储能柜-${i + 1}# · ${k + 1}簇`,
      spec: '1P240S · 130 kWh',
      conn: 'online' as const,
      faultCount: 0,
      points: [
        { label: 'SOC', value: `${s.toFixed(1)} %` },
        { label: 'SOH', value: `${(ESS_SOH[i] + (k === 0 ? 0.1 : -0.1)).toFixed(1)} %` },
        { label: '簇总电压', value: `${voltage.toFixed(1)} V` },
        { label: '簇总电流', value: `${(-current).toFixed(1)} A` },
        { label: '最高单体电压', value: '3.352 V' },
        { label: '最低单体电压', value: '3.318 V' },
        { label: '最高单体温度', value: `${ESS_MAX_TEMP[i].toFixed(1)} ℃` },
        { label: '最低单体温度', value: `${(ESS_MAX_TEMP[i] - ESS_TEMP_SPREAD[i]).toFixed(1)} ℃` },
        { label: '绝缘电阻', value: '5.2 MΩ' },
        { label: '累计循环次数', value: `${486 + i * 3} 次` },
      ],
    };
  }),
);

/* ---------------------------------------------- 储能空调 / 储能消防 各 4 台 */
/**
 * 柜式一体机：一台柜自带一套温控和一套消防，
 * 所以是一柜一台，跟着 childIds 挂在柜下面，而不是按「舱」算。
 */
const HVAC_TEMP = [
  ['26.4 ℃', '18.6 ℃', '780 rpm', '5.2 kW'],
  ['26.9 ℃', '18.9 ℃', '800 rpm', '5.4 kW'],
  ['27.1 ℃', '19.2 ℃', '820 rpm', '5.6 kW'],
  ['27.6 ℃', '19.5 ℃', '840 rpm', '5.8 kW'],
];
const HVAC_DEVICES: DeviceSeed[] = [1, 2, 3, 4].map((n) => ({
  id: `hvac-${n}`,
  type: 'hvac',
  name: `储能柜-${n}# 空调`,
  spec: '5 kW 一体式 · 柜内温控',
  conn: 'online',
  faultCount: 0,
  points: [
    { label: '运行状态', value: '制冷' },
    { label: '回风温度', value: HVAC_TEMP[n - 1][0] },
    { label: '送风温度', value: HVAC_TEMP[n - 1][1] },
    { label: '设定温度', value: '25.0 ℃' },
    { label: '压缩机状态', value: '运行' },
    { label: '风机转速', value: HVAC_TEMP[n - 1][2] },
    { label: '制冷量', value: HVAC_TEMP[n - 1][3] },
    { label: '告警', value: '无' },
  ],
}));

const FIRE_TEMP = ['26.3 ℃', '26.7 ℃', '27.0 ℃', '27.4 ℃'];
const FIRE_DEVICES: DeviceSeed[] = [1, 2, 3, 4].map((n) => ({
  id: `fire-${n}`,
  type: 'fire',
  name: `储能柜-${n}# 消防`,
  spec: '全氟己酮 · 烟感 / 温感 / 可燃气体',
  conn: 'online',
  faultCount: 0,
  points: [
    { label: '运行状态', value: '正常' },
    { label: '烟感', value: '无火警' },
    { label: '温感', value: FIRE_TEMP[n - 1] },
    { label: '可燃气体', value: '0 ppm' },
    { label: 'H₂ 浓度', value: '0 ppm' },
    { label: '灭火装置', value: '就绪' },
    { label: '阀门状态', value: '关闭' },
    { label: '告警', value: '无' },
  ],
}));

/* ------------------------------------------------------------- 电表 5 块 */
const LOAD1_POWER = 412.6;
const LOAD1_ENERGY = 4520.3;
const load2Power = +(ENERGY_FLOW.loadConsumption - LOAD1_POWER).toFixed(1);
const load2Energy = +(TODAY_CONSUMPTION.loadConsumption - LOAD1_ENERGY).toFixed(1);

/**
 * 电表点表照业务截图那张来：三相电压 / 电流 / 分相有功 / 分相无功 / 功率因数 /
 * 瞬时总有功 / 瞬时总无功 / 正反向电量 / 组合无功总电能。
 * 分相有功、分相无功都用「总量 − 两相」兜底，三相之和恒等于瞬时总量。
 */
const meterPoints = (o: {
  power: number;
  voltages: [number, number, number];
  /** A、B 两相有功占总量的大致比例，C 相由总量兜底 */
  split?: [number, number];
  /** A、B 两相无功 */
  reactive: [number, number];
  pf: [string, string, string];
  importEnergy: number;
  exportEnergy: number;
  reactiveEnergy: number;
  energyLabel: string;
  todayEnergy: number;
}): DevicePoint[] => {
  const p = split3(o.power, ...(o.split ?? [o.power * 0.345, o.power * 0.336]));
  const totalReactive = +(o.reactive[0] + o.reactive[1]).toFixed(1);
  const q = split3(totalReactive, ...o.reactive);
  /** 相电流 = 相有功 / 相电压 / 功率因数 */
  const current = (pw: number, v: number, pf: string) =>
    +((pw * 1000) / (v * parseFloat(pf))).toFixed(1);

  const rows: DevicePoint[] = [];

  rows.push(
    { label: 'A相电压', value: `${o.voltages[0].toFixed(1)} V` },
    { label: 'B相电压', value: `${o.voltages[1].toFixed(1)} V` },
    { label: 'C相电压', value: `${o.voltages[2].toFixed(1)} V` },
    { label: 'A相电流', value: `${current(p[0], o.voltages[0], o.pf[0]).toFixed(1)} A` },
    { label: 'B相电流', value: `${current(p[1], o.voltages[1], o.pf[1]).toFixed(1)} A` },
    { label: 'C相电流', value: `${current(p[2], o.voltages[2], o.pf[2]).toFixed(1)} A` },
    { label: '瞬时A相有功功率', value: `${p[0].toFixed(1)} kW` },
    { label: '瞬时B相有功功率', value: `${p[1].toFixed(1)} kW` },
    { label: '瞬时C相有功功率', value: `${p[2].toFixed(1)} kW` },
    { label: '瞬时总有功功率', value: `${o.power.toFixed(1)} kW` },
    { label: '瞬时A相无功功率', value: `${q[0].toFixed(1)} kVar` },
    { label: '瞬时B相无功功率', value: `${q[1].toFixed(1)} kVar` },
    { label: '瞬时C相无功功率', value: `${q[2].toFixed(1)} kVar` },
    { label: '瞬时总无功功率', value: `${totalReactive.toFixed(1)} kVar` },
    { label: 'A相功率因数', value: o.pf[0] },
    { label: 'B相功率因数', value: o.pf[1] },
    { label: 'C相功率因数', value: o.pf[2] },
    { label: o.energyLabel, value: `${one(o.todayEnergy)} kWh` },
    { label: '下网电量（正向）', value: `${big(o.importEnergy)} kWh` },
    { label: '上网电量（反向）', value: `${big(o.exportEnergy)} kWh` },
    { label: '当前组合无功总电能', value: `${big(o.reactiveEnergy)} kVarh` },
  );

  return rows;
};

const METER_DEVICES: DeviceSeed[] = [
  {
    id: 'meter-1',
    type: 'meter',
    name: '并网计量电表',
    /* 表号来自「消息 · 告警消息」那条未恢复告警，不另编 */
    sn: 'DDZY666-Z-20260115-017',
    spec: '关口总表 · 三相四线',
    conn: 'online',
    faultCount: 0,
    points: meterPoints({
      power: ENERGY_FLOW.gridImport,
      /* C 相偏高：与「C 相电压越限 + 三相不平衡」同一条现场问题 */
      voltages: [231.4, 230.8, 246.8],
      split: [132.4, 129.8],
      reactive: [-3.2, -2.6],
      pf: ['0.998', '0.997', '0.994'],
      importEnergy: 43542,
      exportEnergy: 504,
      reactiveEnergy: 126,
      energyLabel: '今日下网电量',
      todayEnergy: TODAY_SUPPLY.gridImport,
    }),
  },
  {
    id: 'meter-2',
    type: 'meter',
    sn: 'DDZY666-Z-20260115-021',
    name: '光伏并网电表',
    spec: '光伏并网点 · 三相四线',
    conn: 'online',
    faultCount: 0,
    points: meterPoints({
      power: ENERGY_FLOW.pvGeneration,
      voltages: [231.5, 230.9, 231.2],
      split: [162.6, 161.9],
      reactive: [0, 0],
      pf: ['1.000', '1.000', '1.000'],
      importEnergy: 0,
      exportEnergy: 68590,
      reactiveEnergy: 0,
      energyLabel: '今日发电量',
      todayEnergy: TODAY_SUPPLY.pvGeneration,
    }),
  },
  {
    id: 'meter-3',
    type: 'meter',
    sn: 'DDZY666-Z-20260115-023',
    name: '储能计量电表',
    spec: '储能并网点 · 双向计量',
    conn: 'online',
    faultCount: 0,
    points: meterPoints({
      power: ENERGY_FLOW.essCharge,
      voltages: [230.8, 230.4, 231.1],
      split: [50.2, 49.6],
      reactive: [-1.1, -0.9],
      pf: ['0.999', '0.999', '0.998'],
      importEnergy: 12486,
      exportEnergy: 9120,
      reactiveEnergy: 38,
      energyLabel: '今日充电量',
      todayEnergy: TODAY_CONSUMPTION.essCharge,
    }),
  },
  {
    id: 'meter-4',
    type: 'meter',
    sn: 'DDZY666-Z-20260115-025',
    name: '1# 厂房负荷电表',
    spec: '生产负荷 · 三相四线',
    conn: 'online',
    faultCount: 0,
    points: meterPoints({
      power: LOAD1_POWER,
      voltages: [229.6, 229.1, 230.2],
      split: [137.9, 137.2],
      reactive: [18.6, 17.8],
      pf: ['0.991', '0.990', '0.989'],
      importEnergy: 86420,
      exportEnergy: 0,
      reactiveEnergy: 12640,
      energyLabel: '今日用电量',
      todayEnergy: LOAD1_ENERGY,
    }),
  },
  {
    id: 'meter-5',
    type: 'meter',
    sn: 'DDZY666-Z-20260115-027',
    name: '2# 厂房负荷电表',
    spec: '生产负荷 · 三相四线',
    conn: 'online',
    faultCount: 0,
    points: meterPoints({
      power: load2Power,
      voltages: [230.2, 229.7, 230.4],
      split: [104.2, 103.1],
      reactive: [13.9, 13.2],
      pf: ['0.992', '0.991', '0.990'],
      importEnergy: 64180,
      exportEnergy: 0,
      reactiveEnergy: 9180,
      energyLabel: '今日用电量',
      todayEnergy: load2Energy,
    }),
  },
];

/* -------------------------------------------------------- 充电桩 / 枪 */
/**
 * 两台 V2G 双向桩，本月还没插过枪，所以除了「今日放电量 0」全是「--」。
 * 与经营报告 1.3 节「充电量 0、收益 --」同源，不是没做，是真没充。
 */
const CHARGER_DEVICES: DeviceSeed[] = [1, 2].map((n) => ({
  id: `charger-${n}`,
  type: 'charger',
  name: `V2G 充电桩-${n}#`,
  spec: '60 kW 双向 · 单枪',
  conn: 'online',
  faultCount: 0,
  points: [
    { label: '功率达成率', value: '--' },
    { label: '实时功率', value: '--' },
    { label: '需求功率', value: '--' },
    { label: '今日充电量', value: '--' },
    { label: '今日放电量', value: '0 kWh' },
    { label: '枪数', value: '1 把' },
  ],
  gunIds: [`gun-${n}`],
}));

const GUN_DEVICES: DeviceSeed[] = [1, 2].map((n) => ({
  id: `gun-${n}`,
  type: 'gun',
  name: `V2G 充电桩-${n}# 枪1`,
  spec: '单枪 · CCS2 直流',
  conn: 'online',
  faultCount: 0,
  points: [
    { label: '枪状态', value: '未插枪' },
    { label: '车辆SOC', value: '--' },
    { label: '本次充电量', value: '--' },
    { label: '实时功率', value: '--' },
    { label: '需求功率', value: '--' },
    { label: '输出电压', value: '--' },
    { label: '需求电压', value: '--' },
    { label: '输出电流', value: '--' },
    { label: '需求电流', value: '--' },
    { label: '累计充电量', value: '0 kWh' },
  ],
}));

/* ------------------------------------------------------------- 变压器 1 台 */
const TRANSFORMER_DEVICES: DeviceSeed[] = [
  {
    id: 'transformer-1',
    type: 'transformer',
    name: '1# 升压变压器',
    spec: 'S11-M-1250/10 · 1250 kVA',
    conn: 'online',
    faultCount: 0,
    points: [
      { label: '高压侧电压', value: '10.02 kV' },
      { label: '高压侧电流', value: '22.4 A' },
      { label: '低压侧电压', value: '400.3 V' },
      /* 低压侧电流 = 并网功率 / (√3 × 400V) */
      {
        label: '低压侧电流',
        value: `${((ENERGY_FLOW.gridImport * 1000) / (Math.sqrt(3) * 400.3)).toFixed(1)} A`,
      },
      { label: '有功功率', value: `${one(ENERGY_FLOW.gridImport)} kW` },
      { label: '无功功率', value: '−7.9 kVar' },
      { label: '功率因数', value: '0.998' },
      /* 负载率 = 有功 / 额定容量 */
      { label: '负载率', value: `${((ENERGY_FLOW.gridImport / 1250) * 100).toFixed(1)} %` },
      { label: '油面温度', value: '58.2 ℃' },
      { label: '绕组温度', value: '71.5 ℃' },
      { label: '分接头档位', value: '3 档' },
    ],
  },
];

/* ------------------------------------------------------------- 辐照仪 1 台 */
const IRRADIANCE_DEVICES: DeviceSeed[] = [
  {
    id: 'irradiance-1',
    type: 'irradiance',
    name: '1# 辐照仪',
    spec: '总辐射表 · 组件平面',
    conn: 'online',
    faultCount: 0,
    points: [
      { label: '辐照度', value: '682 W/m²' },
      { label: '组件温度', value: '41.2 ℃' },
      { label: '环境温度', value: '28.6 ℃' },
      { label: '风速', value: '2.4 m/s' },
      { label: '风向', value: '东南' },
      { label: '相对湿度', value: '56 %' },
      { label: '大气压', value: '100.8 kPa' },
    ],
  },
];

/* --------------------------------------------------------------- 负载 2 路 */
const LOAD_DEVICES: DeviceSeed[] = [
  {
    id: 'load-1',
    type: 'load',
    name: '1# 生产负荷',
    spec: '厂区低压出线 · 三相四线',
    conn: 'online',
    faultCount: 0,
    points: [
      { label: '有功功率', value: `${one(LOAD1_POWER)} kW` },
      { label: '无功功率', value: '36.4 kVar' },
      { label: '功率因数', value: '0.991' },
      { label: 'A相电压', value: '229.6 V' },
      { label: 'B相电压', value: '229.1 V' },
      { label: 'C相电压', value: '230.2 V' },
      { label: 'A相电流', value: '603.2 A' },
      { label: 'B相电流', value: '601.8 A' },
      { label: 'C相电流', value: '598.4 A' },
      { label: '今日用电量', value: `${one(LOAD1_ENERGY)} kWh` },
    ],
  },
  {
    id: 'load-2',
    type: 'load',
    name: '2# 生产负荷',
    spec: '厂区低压出线 · 三相四线',
    conn: 'online',
    faultCount: 0,
    points: [
      { label: '有功功率', value: `${one(load2Power)} kW` },
      { label: '无功功率', value: '27.1 kVar' },
      { label: '功率因数', value: '0.992' },
      { label: 'A相电压', value: '230.2 V' },
      { label: 'B相电压', value: '229.7 V' },
      { label: 'C相电压', value: '230.4 V' },
      { label: 'A相电流', value: '452.6 A' },
      { label: 'B相电流', value: '451.2 A' },
      { label: 'C相电流', value: '449.8 A' },
      { label: '今日用电量', value: `${one(load2Energy)} kWh` },
    ],
  },
];

/* ------------------------------------------------------------- 台账出口 */
/** 顺序即现场点表下拉框的顺序，页面按这个顺序往下排 */
const DEVICE_SEEDS: DeviceSeed[] = [
  ...EMS_DEVICES,
  ...INVERTER_DEVICES,
  ...ESS_DEVICES,
  ...PCS_DEVICES,
  ...BATTERY_DEVICES,
  ...HVAC_DEVICES,
  ...FIRE_DEVICES,
  ...METER_DEVICES,
  ...CHARGER_DEVICES,
  ...GUN_DEVICES,
  ...TRANSFORMER_DEVICES,
  ...IRRADIANCE_DEVICES,
  ...LOAD_DEVICES,
];

/** SN 里的类型码，照厂家给设备的编号习惯取：MG-ESS-0001 */
const SN_PREFIX: Record<DeviceTypeKey, string> = {
  ems: 'EMS',
  inverter: 'INV',
  ess: 'ESS',
  pcs: 'PCS',
  battery: 'BAT',
  hvac: 'HVAC',
  fire: 'FIRE',
  meter: 'METER',
  charger: 'EVC',
  gun: 'EVG',
  transformer: 'TR',
  irradiance: 'IRR',
  load: 'LD',
};

/**
 * 指标页签的字段，按业务给的三张截图来：
 *   逆变器 —— 发电功率 / 今日发电量 / 当年累计发电量（三个大数），组串另成一块
 *   储能   —— 11 个字段，状态带色点
 *   充电桩 —— 功率达成率 / 充放电量 / 实时与需求功率
 *   充电枪 —— 车辆 SOC、本次充电量、功率电压电流（实时 vs 需求）
 * 其余类型（EMS、PCS、电池簇、空调、消防、电表、变压器、辐照仪、负载）不给指标页，
 * 点表的字段就是它们能说清的全部，多一个页签只是多一次点击。
 */
const METRIC_SPEC: Partial<
  Record<DeviceTypeKey, { title?: string; layout: 'kpi' | 'kv'; labels: string[] }[]>
> = {
  inverter: [
    { layout: 'kpi', labels: ['发电功率', '今日发电量', '当年累计发电量'] },
  ],
  ess: [
    {
      layout: 'kv',
      labels: [
        '工作状态',
        '系统故障',
        '系统SOC',
        '总有功功率',
        '今日充电总电量',
        '今日放电总电量',
        '剩余可充电容量',
        '剩余可放电容量',
        'PCS 故障状态',
        '工作模式',
      ],
    },
  ],
  charger: [
    {
      layout: 'kv',
      labels: ['功率达成率', '今日充电量', '今日放电量', '实时功率', '需求功率', '枪数'],
    },
  ],
  gun: [
    {
      layout: 'kv',
      labels: [
        '车辆SOC',
        '本次充电量',
        '实时功率',
        '需求功率',
        '输出电压',
        '需求电压',
        '输出电流',
        '需求电流',
      ],
    },
  ],
};

/** 指标里的字段在点表里另叫一个名字时，做个别名 */
const METRIC_ALIAS: Partial<Record<DeviceTypeKey, Record<string, string>>> = {
  inverter: { 发电功率: '有功功率' },
};

/** 点表里没有、但指标页要看的值（都由概览快照算得出来，仍是一份数据） */
const METRIC_EXTRA: Partial<Record<DeviceTypeKey, Record<string, string>>> = {
  inverter: {
    今日发电量: `${one(TODAY_SUPPLY.pvGeneration)} kWh`,
    当年累计发电量: `${BUSINESS_REPORT.pvAnalysis.yearGenWan.toFixed(2)} 万kWh`,
  },
};

/** 按 label 从点表里取指标；同一个数不会在文件里出现两份 */
const withMetrics = (list: DeviceItem[]): DeviceItem[] =>
  list.map((d) => {
    const spec = METRIC_SPEC[d.type];
    if (!spec) return d;
    const resolve = (label: string) => {
      const alias = METRIC_ALIAS[d.type]?.[label] ?? label;
      const p = d.points.find((x) => x.label === alias);
      if (p) return { label, value: p.value };
      return { label, value: METRIC_EXTRA[d.type]?.[label] ?? '--' };
    };
    const sections: MetricSection[] = spec.map((s) => ({
      title: s.title,
      layout: s.layout,
      items: s.labels.map(resolve),
    }));
    return { ...d, metrics: sections };
  });

/**
 * 没手写 SN 的设备按「类型码 + 该类型序号」补一个，四位数补零。
 * 手写的（五块电表的出厂表号）原样保留。
 */
const withSn = (seeds: DeviceSeed[]): DeviceItem[] => {
  const seq: Partial<Record<DeviceTypeKey, number>> = {};
  return seeds.map((d) => {
    const n = (seq[d.type] ?? 0) + 1;
    seq[d.type] = n;
    return {
      ...d,
      sn: d.sn ?? `MG-${SN_PREFIX[d.type]}-${String(n).padStart(4, '0')}`,
    };
  });
};

export const DEVICE_LIST: DeviceItem[] = withMetrics(withSn(DEVICE_SEEDS));

export const findDevice = (id: string) => DEVICE_LIST.find((d) => d.id === id);

/** 四个 tab，顺序就是展示顺序 */
export const DEVICE_TABS: { key: DeviceCategoryKey; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'ess', label: '储能' },
  { key: 'inverter', label: '逆变器' },
  { key: 'charger', label: '充电桩' },
];

/**
 * 下属设备（充电枪、PCS、电池簇、消防、空调）的 id 集合。
 * 它们挂在整机下面，四个 tab 都不单列 —— 一台设备只有一个入口，
 * 从柜/桩的详情页点进去看。
 */
const CHILD_IDS = new Set<string>();
DEVICE_LIST.forEach((d) => {
  d.childIds?.forEach((id) => CHILD_IDS.add(id));
  d.gunIds?.forEach((id) => CHILD_IDS.add(id));
});
export const isSubDevice = (id: string) => CHILD_IDS.has(id);

/**
 * 整机台账：把下属设备摘掉之后的设备清单。
 * 列表、tab 台数、概览、类型筛选全部按这一份算，页面上的数字才对得上。
 */
export const DEVICE_UNITS: DeviceItem[] = DEVICE_LIST.filter((d) => !CHILD_IDS.has(d.id));

/** 某个 tab 下的设备：四个 tab 都只列整机 */
export const devicesInCategory = (k: DeviceCategoryKey): DeviceItem[] =>
  k === 'all' ? DEVICE_UNITS : DEVICE_UNITS.filter((d) => TYPE_CATEGORY[d.type] === k);

/** 筛选面板用的类型清单：只列整机里真实有的类型，顺序照台账 */
export const DEVICE_TYPE_OPTIONS = (() => {
  const seen = new Set<DeviceTypeKey>();
  const out: { key: DeviceTypeKey; label: string }[] = [];
  DEVICE_UNITS.forEach((d) => {
    if (!seen.has(d.type)) {
      seen.add(d.type);
      out.push({ key: d.type, label: DEVICE_TYPE_LABEL[d.type] });
    }
  });
  return out;
})();

/**
 * 列表查询：先按大类（tab）圈定范围，再按类型筛，最后按关键词匹配名称或 SN。
 * 关键词不区分大小写，SN 里带连字符也照样能搜中间一段。
 */
export const queryDevices = (o: {
  category: DeviceCategoryKey;
  type: DeviceTypeKey | 'all';
  keyword: string;
}): DeviceItem[] => {
  const kw = o.keyword.trim().toLowerCase();
  return devicesInCategory(o.category).filter((d) => {
    if (o.type !== 'all' && d.type !== o.type) return false;
    if (!kw) return true;
    return d.name.toLowerCase().includes(kw) || d.sn.toLowerCase().includes(kw);
  });
};

/** 概览：按整机台账派生，和列表里看得到的台数一致 */
export const DEVICE_SUMMARY = {
  total: DEVICE_UNITS.length,
  online: DEVICE_UNITS.filter((d) => d.conn === 'online').length,
  fault: DEVICE_UNITS.filter((d) => d.faultCount > 0).length,
};

/** 设备数据的采集口径，页脚用 */
export const DEVICE_DATA_NOTE = '数据来自站控网关 · 5 分钟刷新一次';

/**
 * 设备刷新时间，格式 yyyy-mm-dd hh:mm:ss。
 * 按打开详情这一刻的项目本地时间生成 —— 详情页看到的就是本次拉取的那一帧，
 * 写死一个常量早晚会变成一个对不上当前时间的假时间。
 */
export const formatDeviceRefreshTime = (d: Date = new Date()): string => {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(
    d.getMinutes(),
  )}:${p(d.getSeconds())}`;
};
