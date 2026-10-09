/* ==========================================================================
   天盈 AI 仿真报告 · 数据层（小程序端）
   --------------------------------------------------------------------------
   数据与 web 端 -2.0 `components/tianyingReportData.ts` 的售前《天盈 AI 仿真报告》
   部分**逐项对齐**，保证小程序与 web 弹窗看到的是同一份报告、同一组数字。

   口径：站点实际运行（固定规则策略） vs AI 策略仿真
   结构：报告头核心结论 + 第 1 章仿真收益对比 + 第 2 章典型日分析
   ========================================================================== */

/* ---------------------------- 站点与报告元信息 ---------------------------- */
export const TY_META = {
  station: '康达新材料-1#站',
  stationFull: '上海康达新材料 1# 站',
  region: '上海市奉贤区',
  period: '2026-09',
  periodLabel: '2026年09月',
  version: 'AI 策略仿真 V1.0',
  caliberNote:
    '本报告基于站点历史实际负荷与光伏出力数据，在相同输入条件下回算 AI 调度策略，与实际运行结果逐项对比。两侧采用同一份负荷与光伏数据，差异可直接归因于策略本身。',
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

/* ---------------------------- 逐项对照表 ---------------------------- */
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

/** 逐项对照表分组顺序（电量在前、收益在后） */
export const SIM_GROUPS = ['电量类', '收益类'] as const;

/** 收益增量来源（量价分解） */
export const TY_SIM_WHY = [
  {
    no: '①',
    title: '储能',
    amount: '+8,150 元',
    tone: 'up' as const,
    brief: '低谷充、高峰放，单位放电净收益 0.679 → 0.786 元/kWh',
  },
  {
    no: '②',
    title: '光伏',
    amount: '-320 元',
    tone: 'down' as const,
    brief: '消纳率已 98.55%，余电上网与自用各挪 26 kWh',
  },
] as const;

/* ---------------------------- 电价口径 ---------------------------- */
export const TY_PRICE = {
  tou: [
    { key: 'peak', label: '峰', price: 1.0752, window: '08:00–11:00、18:00–21:00' },
    { key: 'flat', label: '平', price: 0.6417, window: '06:00–08:00、11:00–18:00、21:00–22:00' },
    { key: 'valley', label: '谷', price: 0.2975, window: '22:00–06:00' },
  ],
  salePrice: 0.391,
  note: '购电分时三档为站点执行电价；加权电价按逐 15min 用电量加权，两侧共用同一套分时电价，差异只来自电量落在哪个时段。',
} as const;

const CHG_W = { real: 0.3428, sim: 0.3124 };
const DIS_W = { real: 0.8805, sim: 0.9168 };

/** 加权电价对比行（元/kWh） */
export const TY_PRICE_COMPARE = [
  { label: '充电加权电价', real: CHG_W.real, sim: CHG_W.sim, dec: 4 },
  { label: '放电加权电价', real: DIS_W.real, sim: DIS_W.sim, dec: 4 },
  { label: '充放电毛价差', real: DIS_W.real - CHG_W.real, sim: DIS_W.sim - CHG_W.sim, dec: 4 },
] as const;

/* ---------------------------- 案例日 ---------------------------- */
interface CaseRow {
  name: string;
  real: number;
  sim: number;
}

const isMoney = (n: string) => n.includes('(元)');

/** 收益差一律由 rows 派生，避免卡片数字与下方表格对不上 */
const caseDay = (date: string, tag: string, rows: CaseRow[], reading: string) => ({
  date,
  tag,
  rows,
  storageDiff: rows.filter((r) => isMoney(r.name) && r.name.startsWith('储能')).reduce((s, r) => s + (r.sim - r.real), 0),
  totalDiff: rows.filter((r) => isMoney(r.name)).reduce((s, r) => s + (r.sim - r.real), 0),
  reading,
});

/** 只取 AI 优于实际的正向案例：按储能收益差排序取当月前 3 个典型日 */
export const TY_CASE_DAYS = [
  caseDay(
    '2026-09-12',
    '差异最大',
    [
      { name: '储能充电量 (kWh)', real: 1652, sim: 1836 },
      { name: '储能放电量 (kWh)', real: 1518, sim: 1694 },
      { name: '储能收益 (元)', real: 1030, sim: 1516 },
      { name: '光伏收益 (元)', real: 1010, sim: 1004 },
    ],
    'AI 将 184 kWh 充电量从平段挪至谷段，放电量增加 176 kWh 且集中在峰段，当日储能收益差 +486 元，是当月差异最大的典型日。',
  ),
  caseDay(
    '2026-09-20',
    '代表日',
    [
      { name: '储能充电量 (kWh)', real: 1610, sim: 1742 },
      { name: '储能放电量 (kWh)', real: 1480, sim: 1615 },
      { name: '储能收益 (元)', real: 1002, sim: 1314 },
      { name: '光伏收益 (元)', real: 986, sim: 972 },
    ],
    '当日光伏出力中等、负荷平稳，AI 的增益主要来自峰谷时段重排，放电量增幅 9.1%，收益增幅 31.1%。',
  ),
  caseDay(
    '2026-09-08',
    '常态日',
    [
      { name: '储能充电量 (kWh)', real: 1596, sim: 1720 },
      { name: '储能放电量 (kWh)', real: 1462, sim: 1602 },
      { name: '储能收益 (元)', real: 1005, sim: 1273 },
      { name: '光伏收益 (元)', real: 978, sim: 966 },
    ],
    '当日光伏出力偏低、负荷平稳，AI 把 124 kWh 充电量挪到谷段、放电量增加 140 kWh 且集中在峰段，储能收益差 +268 元。',
  ),
];

/* ---------------------------- 典型日逐 15min 曲线 ----------------------------
   展示口径与 ml0716xx/--1「运营数据 · 典型日分析」一致：双 Y 轴
   （左轴储能功率 kW、右轴 SOC%）、两条实线功率 + 两条虚线 SOC、图下 24h 电价档位色带。
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
  return Array.from({ length: 96 }, (_, i) => ({
    time: slotTime(i),
    tier: tierOfSlot(i),
    sim: +sim.power[i].toFixed(1),
    real: +real.power[i].toFixed(1),
    socSim: +sim.socs[i].toFixed(2),
    socReal: +real.socs[i].toFixed(2),
  }));
}

export const TY_CASE_CURVES: Record<string, CaseDayPoint[]> = {
  '2026-09-12': buildDayCurves('2026-09-12'),
  '2026-09-20': buildDayCurves('2026-09-20'),
  '2026-09-08': buildDayCurves('2026-09-08'),
};

/** 24h 电价档位色带（按时间顺序，1 格 = 15min，共 96 格） */
export const TY_TOU_SEGMENTS = Array.from({ length: 96 }, (_, i) => ({ slot: i, tier: tierOfSlot(i) }));

/** 电价档位：中文名 + 配色 */
export const TIER_META: Record<string, { label: string; color: string }> = {
  peak: { label: '峰', color: '#F87171' },
  flat: { label: '平', color: '#60A5FA' },
  valley: { label: '谷', color: '#34D399' },
};

/** 曲线图例与口径说明 */
export const TY_CURVE_TEXT = {
  chartTitle: '典型日逐 15min 充放电曲线',
  rule: '案例日选取：按储能收益差排序取当月前 3 个典型日，均为 AI 策略优于实际运行的案例。',
  legend: {
    realPower: '实际运行 · 储能功率',
    simPower: 'AI 仿真 · 储能功率',
    realSoc: '实际运行 · SOC',
    simSoc: 'AI 仿真 · SOC',
  },
  axisPower: '储能功率 (kW)',
  axisSoc: 'SOC (%)',
  powerNote: '（正充负放）',
  socNote: '两侧 SOC 全程落在 5%–95% 配置区间内。',
  footLabels: { charge: '当日充电量', discharge: '当日放电量', real: '实际', sim: '仿真' },
} as const;

/* ---------------------------- 通用格式化 ---------------------------- */
export const fmt = (v: number | null | undefined, d = 2) => {
  if (v === null || v === undefined || Number.isNaN(v)) return '—';
  return v.toLocaleString('zh-CN', { minimumFractionDigits: d, maximumFractionDigits: d });
};

/** 带符号金额 */
export const fmtSigned = (v: number, d = 0) => `${v > 0 ? '+' : ''}${fmt(v, d)}`;
