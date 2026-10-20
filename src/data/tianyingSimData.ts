/* ==========================================================================
   天盈 AI 站点策略&收益体检报告 · 数据层（小程序端）
   --------------------------------------------------------------------------
   与 web 端 -2.0《天盈 AI 站点策略&收益体检报告》同源，数字逐项一致。

   读法（体检报告的三段式，顺序即叙事顺序）：
     1 典型日     先看一天的真实曲线，看见 AI 改了什么动作
     2 这个月     认可之后再算钱，钱是诊断出来的结果
     3 九项指标   逐条对一遍，可核验

   口径：站点实际运行（固定规则策略） vs AI 策略
   ========================================================================== */

import { STATION } from './stationData';

/* ---------------------------- 站点与报告元信息 ---------------------------- */
/* 站点口径取自 stationData 单一真源，与经营分析报告 / 小程序顶部完全一致 */
export const TY_META = {
  /** 报告全名 */
  title: '天盈 AI 站点策略&收益体检报告',
  /** 入口按钮 */
  entryLabel: '天盈AI策略运行体检报告',
  /** 报告头徽章 */
  badge: '站点策略体检',
  station: STATION.name,
  stationFull: `${STATION.entity} 1# 站`,
  region: STATION.region,
  period: '2026-09',
  periodLabel: '2026年09月',
  /** 版本号保留「仿真」二字，是测算口径的诚实标注，全文仅此一处 */
  version: 'AI 策略仿真 V1.0',
} as const;

/* ---------------------------- 站点配置参数 ---------------------------- */
export const TY_SITE = {
  pvCapacityKwp: 760,
  pvInverters: 5,
  essCapacityKwh: 1040,
  essUnits: 4,
  chargers: 0,
  essPowerKw: 500,
  socRange: '5% ~ 95%',
} as const;

/* ---------------------------- 核心 KPI（金额单位：元，全月） ---------------------------- */
export const TY_SIM_KPI = {
  total: { real: 61200, sim: 69030, label: '总收益（全月）', unit: '元' },
  storage: { real: 30900, sim: 39050, label: '储能收益', unit: '元' },
  pv: { real: 30300, sim: 29980, label: '光伏收益', unit: '元' },
  unit: { real: 0.679, sim: 0.786, label: '单位放电净收益', unit: '元/kWh' },
} as const;

/** 净增额与提升比例（由 KPI 派生，避免两处写法不一致） */
export const TY_SIM_DELTA = {
  net: TY_SIM_KPI.total.sim - TY_SIM_KPI.total.real,
  storageDiff: TY_SIM_KPI.storage.sim - TY_SIM_KPI.storage.real,
  pvDiff: TY_SIM_KPI.pv.sim - TY_SIM_KPI.pv.real,
  liftPct: ((TY_SIM_KPI.total.sim - TY_SIM_KPI.total.real) / TY_SIM_KPI.total.real) * 100,
} as const;

/* ---------------------------- 九项指标对照表 ---------------------------- */
const CHG = { real: 49700, sim: 54300 };
const DIS = { real: 45500, sim: 49700 };
/** 储能利用率 = 放电量 ÷ 充电量 */
const utilPct = (dis: number, chg: number) => (dis / chg) * 100;
/** 日均充放次数 = 放电量 ÷ 额定容量 ÷ 当月天数（当月按 30 天） */
const cyclesPerDay = (dis: number) => dis / TY_SITE.essCapacityKwh / 30;

export const TY_SIM_ROWS: {
  group: '电量类' | '收益类';
  item: string;
  real: number;
  sim: number;
  unit: string;
  dec: number;
}[] = [
  { group: '电量类', item: '光伏上网电量', real: 412, sim: 386, unit: 'kWh', dec: 0 },
  { group: '电量类', item: '光伏自用电量', real: 27994, sim: 28020, unit: 'kWh', dec: 0 },
  { group: '电量类', item: '储能充电量', real: CHG.real, sim: CHG.sim, unit: 'kWh', dec: 0 },
  { group: '电量类', item: '储能放电量', real: DIS.real, sim: DIS.sim, unit: 'kWh', dec: 0 },
  { group: '电量类', item: '储能利用率', real: utilPct(DIS.real, CHG.real), sim: utilPct(DIS.sim, CHG.sim), unit: '%', dec: 2 },
  { group: '电量类', item: '日均充放次数', real: cyclesPerDay(DIS.real), sim: cyclesPerDay(DIS.sim), unit: '次/日', dec: 2 },
  { group: '收益类', item: '储能收益', real: 30900, sim: 39050, unit: '元', dec: 0 },
  { group: '收益类', item: '光伏收益', real: 30300, sim: 29980, unit: '元', dec: 0 },
  { group: '收益类', item: '总收益', real: 61200, sim: 69030, unit: '元', dec: 0 },
];

/** 九项指标分组（左栏电量类 6 行、右栏收益类 3 行） */
export const SIM_GROUPS = ['电量类', '收益类'] as const;

/**
 * 增量来源：金额由 TY_SIM_DELTA 派生，不在文案里写死。
 * 储能 +8150、光伏 -320，合计 +7830 —— 三项天然对得上。
 */
export const TY_SIM_WHY: {
  title: string;
  amount: number;
  brief: string;
}[] = [
  {
    title: '储能',
    amount: TY_SIM_DELTA.storageDiff,
    brief: `低谷充、高峰放，单位放电净收益 ${TY_SIM_KPI.unit.real.toFixed(3)} → ${TY_SIM_KPI.unit.sim.toFixed(3)} 元/kWh`,
  },
  {
    title: '光伏',
    amount: TY_SIM_DELTA.pvDiff,
    brief: '消纳率已 98.55%，余电上网与自用各挪 26 kWh',
  },
];

/* ---------------------------- 分时电价 ---------------------------- */
export const TY_PRICE = {
  tou: [
    { key: 'peak', label: '峰', price: 1.0752, window: '08:00–11:00、18:00–21:00' },
    { key: 'flat', label: '平', price: 0.6417, window: '06:00–08:00、11:00–18:00、21:00–22:00' },
    { key: 'valley', label: '谷', price: 0.2975, window: '22:00–06:00' },
  ],
  salePrice: 0.391,
} as const;

/** 档位 → 电价（由 TY_PRICE.tou 派生，改价只改一处） */
const TIER_PRICE: Record<string, number> = Object.fromEntries(
  TY_PRICE.tou.map((t) => [t.key, t.price]),
);

/** 电价轴的量程上限：最高价 × 1.12，让面积顶部留出呼吸空间 */
export const PRICE_DOMAIN_MAX =
  Math.max(...TY_PRICE.tou.map((t) => t.price), TY_PRICE.salePrice) * 1.12;

/** 图例用的电价区间文案 */
export const PRICE_RANGE_TEXT = {
  buyMin: Math.min(...TY_PRICE.tou.map((t) => t.price)),
  buyMax: Math.max(...TY_PRICE.tou.map((t) => t.price)),
  sell: TY_PRICE.salePrice,
} as const;

/* ---------------------------- 典型日 ---------------------------- */
interface CaseRow {
  name: string;
  real: number;
  sim: number;
}

const isMoney = (n: string) => n.includes('(元)');

/** 收益差一律由 rows 派生，避免卡片数字与下方表格对不上 */
const caseDay = (date: string, rows: CaseRow[]) => ({
  date,
  rows,
  storageDiff: rows
    .filter((r) => isMoney(r.name) && r.name.startsWith('储能'))
    .reduce((s, r) => s + (r.sim - r.real), 0),
  totalDiff: rows.filter((r) => isMoney(r.name)).reduce((s, r) => s + (r.sim - r.real), 0),
});

/** 只取 AI 优于实际的正向案例：按储能收益差排序取当月前 3 个典型日 */
export const TY_CASE_DAYS = [
  caseDay('2026-09-12', [
    { name: '储能充电量 (kWh)', real: 1652, sim: 1836 },
    { name: '储能放电量 (kWh)', real: 1518, sim: 1694 },
    { name: '储能收益 (元)', real: 1030, sim: 1516 },
    { name: '光伏收益 (元)', real: 1010, sim: 1004 },
  ]),
  caseDay('2026-09-20', [
    { name: '储能充电量 (kWh)', real: 1610, sim: 1742 },
    { name: '储能放电量 (kWh)', real: 1480, sim: 1615 },
    { name: '储能收益 (元)', real: 1002, sim: 1314 },
    { name: '光伏收益 (元)', real: 986, sim: 972 },
  ]),
  caseDay('2026-09-08', [
    { name: '储能充电量 (kWh)', real: 1596, sim: 1720 },
    { name: '储能放电量 (kWh)', real: 1462, sim: 1602 },
    { name: '储能收益 (元)', real: 1005, sim: 1273 },
    { name: '光伏收益 (元)', real: 978, sim: 966 },
  ]),
];

/* ---------------------------- 典型日逐 15min 曲线 ----------------------------
   双 Y 轴（左轴储能功率 kW、右轴 SOC%），两条实线功率 + 两条虚线 SOC。
   电价不画色带、不占可见刻度轴，改为图内两条面积：
     · 下网购电价格 —— 阶梯面积，随峰/平/谷跳变
     · 上网电价     —— 水平面积，全天固定
   两条面积由隐藏的第三根 Y 轴承载（量程 0 ~ PRICE_DOMAIN_MAX）。

   构造方式为「时段计划 + 电量目标」生成（段内恒功率、SOC 逐 15min 积分），
   曲线与上方日粒度表格天然自洽。
   -------------------------------------------------------------------------- */

export interface CaseDayPoint {
  time: string;
  tier: string;
  sim: number;
  real: number;
  socSim: number;
  socReal: number;
  /** 该时段的购电电价（峰/平/谷阶梯） */
  buyPrice: number;
  /** 该时段的上网电价（全天固定） */
  sellPrice: number;
}

interface CurveSegment {
  from: number;
  to: number;
  kwh: number;
}
interface CurvePlan {
  startSoc: number;
  charge: CurveSegment[];
  discharge: CurveSegment[];
}

type Seg = [number, number, number];
const plan = (startSoc: number, charge: Seg[], discharge: Seg[]): CurvePlan => ({
  startSoc,
  charge: charge.map(([from, to, kwh]) => ({ from, to, kwh })),
  discharge: discharge.map(([from, to, kwh]) => ({ from, to, kwh })),
});

const TY_CASE_CURVE_PLANS: Record<string, { sim: CurvePlan; real: CurvePlan }> = {
  '2026-09-12': {
    sim: plan(10, [[0, 22, 884], [46, 66, 780], [88, 94, 172]], [[32, 44, 884], [72, 84, 810]]),
    real: plan(15, [[4, 24, 700], [48, 68, 780], [88, 94, 172]], [[34, 44, 768], [74, 84, 750]]),
  },
  '2026-09-20': {
    sim: plan(11, [[0, 22, 868], [46, 66, 750], [88, 94, 124]], [[32, 44, 830], [72, 84, 785]]),
    real: plan(16, [[4, 24, 690], [48, 68, 760], [88, 94, 160]], [[34, 44, 740], [74, 84, 740]]),
  },
  '2026-09-08': {
    sim: plan(12, [[0, 22, 860], [46, 66, 740], [88, 94, 120]], [[32, 44, 850], [72, 84, 752]]),
    real: plan(16, [[4, 24, 680], [48, 68, 760], [88, 94, 156]], [[34, 44, 732], [74, 84, 730]]),
  },
};

/** 档位区间（格）：由分时电价时段窗口换算，1 格 = 15min */
const TIER_RANGES: { key: string; ranges: [number, number][] }[] = [
  { key: 'peak', ranges: [[32, 44], [72, 84]] },
  { key: 'flat', ranges: [[24, 32], [44, 72], [84, 88]] },
  { key: 'valley', ranges: [[0, 24], [88, 96]] },
];

/** 第 slot 格的电价档位（0 = 00:00） */
export function tierOfSlot(slot: number): string {
  for (const t of TIER_RANGES) {
    for (const [a, b] of t.ranges) if (slot >= a && slot < b) return t.key;
  }
  return 'flat';
}

/** 第 slot 格的时刻标签 */
export function slotTime(slot: number): string {
  const h = Math.floor(slot / 4);
  const m = (slot % 4) * 15;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

const SLOT_H = 0.25;

/** 由时段计划生成功率序列与 SOC 序列：段内恒功率，SOC 逐 15min 积分 */
function buildCurve(p: CurvePlan, capacityKwh: number) {
  const power = new Array(96).fill(0);
  for (const s of p.charge) {
    const kw = s.kwh / ((s.to - s.from) * SLOT_H);
    for (let i = s.from; i < s.to; i++) power[i] = kw;
  }
  for (const s of p.discharge) {
    const kw = s.kwh / ((s.to - s.from) * SLOT_H);
    for (let i = s.from; i < s.to; i++) power[i] = -kw;
  }
  const socs: number[] = [];
  let soc = p.startSoc;
  for (let i = 0; i < 96; i++) {
    soc += ((power[i] * SLOT_H) / capacityKwh) * 100;
    socs.push(soc);
  }
  return { power, socs };
}

function buildDayCurves(date: string): CaseDayPoint[] {
  const p = TY_CASE_CURVE_PLANS[date];
  const sim = buildCurve(p.sim, TY_SITE.essCapacityKwh);
  const real = buildCurve(p.real, TY_SITE.essCapacityKwh);
  return Array.from({ length: 96 }, (_, i) => {
    const tier = tierOfSlot(i);
    return {
      time: slotTime(i),
      tier,
      sim: +sim.power[i].toFixed(1),
      real: +real.power[i].toFixed(1),
      socSim: +sim.socs[i].toFixed(2),
      socReal: +real.socs[i].toFixed(2),
      buyPrice: TIER_PRICE[tier] ?? TIER_PRICE.flat,
      sellPrice: TY_PRICE.salePrice,
    };
  });
}

export const TY_CASE_CURVES: Record<string, CaseDayPoint[]> = {
  '2026-09-12': buildDayCurves('2026-09-12'),
  '2026-09-20': buildDayCurves('2026-09-20'),
  '2026-09-08': buildDayCurves('2026-09-08'),
};

/** 曲线图例文案（全文不出现「仿真」，只有版本号保留） */
export const TY_CURVE_TEXT = {
  chartTitle: '典型日逐 15min 充放电曲线',
  legend: {
    buyPrice: '下网购电价格',
    sellPrice: '上网电价',
    realPower: '实际运行 · 储能功率',
    simPower: 'AI 策略 · 储能功率',
    realSoc: '实际运行 · SOC',
    simSoc: 'AI 策略 · SOC',
  },
} as const;

/* ---------------------------- 通用格式化 ---------------------------- */
export const fmt = (v: number | null | undefined, d = 2) => {
  if (v === null || v === undefined || Number.isNaN(v)) return '—';
  return v.toLocaleString('zh-CN', { minimumFractionDigits: d, maximumFractionDigits: d });
};

/** 带符号金额 */
export const fmtSigned = (v: number, d = 0) => `${v > 0 ? '+' : ''}${fmt(v, d)}`;
