/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * AI 策略开通状态（三态，对齐天合富家 VPP 业务口径）
 * - not_activated: 未开通 —— AI 相关内容隐藏，展示引导开通
 * - trial:         试运行 —— 展示估算收益，带「试运行」琥珀徽标，口径标注"估算"
 * - activated:     正式运行 —— 全量展示，品牌绿
 */
export type AiActivationStatus = 'not_activated' | 'trial' | 'activated';

export const AI_STATUS_META: Record<
  AiActivationStatus,
  { label: string; badgeClass: string; dotClass: string }
> = {
  not_activated: {
    label: '未开通',
    badgeClass: 'bg-slate-100 text-slate-500 border-slate-200',
    dotClass: 'bg-slate-400',
  },
  trial: {
    label: '试运行',
    badgeClass: 'bg-amber-50 text-amber-600 border-amber-200',
    dotClass: 'bg-amber-500',
  },
  activated: {
    label: '正式运行',
    badgeClass: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    dotClass: 'bg-emerald-500',
  },
};

// ==================== 概览页 · 顶部运行模式条 ====================
export const OVERVIEW_MODE_TEXT = '并网模式：余电上网峰谷套利需量控制';

// ==================== 概览页 · 微网 Tab ====================
export interface EnergyFlowSnapshot {
  pvGeneration: number; // 光伏发电 kW
  gridImport: number; // 下网 kW
  essCharge: number; // 充电 kW
  soc: number; // SOC %
  loadConsumption: number; // 用电 kW
}

export const ENERGY_FLOW: EnergyFlowSnapshot = {
  pvGeneration: 486.74,
  gridImport: 385.7,
  essCharge: 149.2,
  soc: 81.1,
  loadConsumption: 723.24,
};

export const MICROGRID_REVENUE = {
  month: 7765.59, // 当月收益 元
  year: 69.53, // 当年收益 万元
  total: 70.55, // 累计收益 万元
};

export const TODAY_SUPPLY = {
  gridImport: 3045, // 下网电量 kWh
  pvGeneration: 6149.2, // 光伏发电量 kWh
  essDischarge: 436, // 储能放电量 kWh
};

export const TODAY_CONSUMPTION = {
  gridExport: 504, // 上网电量 kWh
  essCharge: 1198, // 储能充电量 kWh
  loadConsumption: 7928.2, // 负载用电量 kWh
};

export const SOCIAL_CONTRIBUTION = {
  co2Reduction: 947.24, // CO2 减排量 吨
  equivalentTrees: 1276, // 等效植树量 棵
  standardCoalSaved: 487.15, // 节约标准煤 吨
};

// ==================== 概览页 · 通用周期数据（日/月/年/累计） ====================
export type PeriodType = 'day' | 'month' | 'year' | 'total';

export const PERIOD_LABELS: Record<PeriodType, string> = {
  day: '日',
  month: '月',
  year: '年',
  total: '累计',
};

/** 生成 12 个点的柱状图数据（日=24h 太密，线上截图 X 轴是 1~12，按 12 点口径统一） */
export interface BarPoint {
  x: string;
  a: number; // 主序列（下网/充电/发电）
  b: number; // 副序列（上网/放电），可为 0
}

const makeBars = (
  aBase: number,
  aVar: number,
  bBase: number,
  bVar: number,
  seed: number,
  peaks: number[] = [3, 7, 10],
): BarPoint[] =>
  Array.from({ length: 12 }, (_, i) => {
    const s = (seed * (i + 3) * 37) % 97;
    const isPeak = peaks.includes(i + 1);
    const a = Math.round(aBase + (s / 97) * aVar + (isPeak ? aVar * 0.45 : 0));
    const b = Math.round(bBase + ((s * 7) % 53) / 53 * bVar + (isPeak ? bVar * 0.3 : 0));
    return { x: `${i + 1}`, a, b: i === 8 ? 0 : b };
  });

export interface GridPeriodData {
  gridImport: number;
  gridExport: number;
  bars: BarPoint[];
}

export const GRID_PERIOD: Record<PeriodType, GridPeriodData> = {
  day: { gridImport: 5236, gridExport: 7, bars: makeBars(180, 260, 4, 14, 11, [3, 4, 8]) },
  month: { gridImport: 48230, gridExport: 1210, bars: makeBars(1200, 2200, 30, 90, 23, [6, 7, 8]) },
  year: { gridImport: 315600, gridExport: 9860, bars: makeBars(20000, 12000, 400, 600, 37, [3, 7, 10]) },
  total: { gridImport: 892400, gridExport: 31500, bars: makeBars(24000, 15000, 500, 800, 53, [2, 6, 9]) },
};

export interface PvPeriodData {
  generation: number; // 发电量 kWh
  revenue: number; // 光伏收益 元
  bars: BarPoint[];
}

export const PV_PERIOD: Record<PeriodType, PvPeriodData> = {
  day: { generation: 6552.7, revenue: 1046.44, bars: makeBars(0, 0, 0, 0, 71, [9, 10, 11, 12]) },
  month: { generation: 153800, revenue: 26773.5, bars: makeBars(3800, 4200, 0, 0, 29, [6, 7, 12]) },
  year: { generation: 986300, revenue: 168420, bars: makeBars(30000, 55000, 0, 0, 41, [5, 8, 11]) },
  total: { generation: 2450000, revenue: 421050, bars: makeBars(35000, 62000, 0, 0, 61, [4, 9, 12]) },
};

export interface EssPeriodData {
  charge: number;
  discharge: number;
  revenue: number;
  bars: BarPoint[];
}

export const ESS_PERIOD: Record<PeriodType, EssPeriodData> = {
  day: { charge: 1285, discharge: 1168, revenue: 443.82, bars: makeBars(80, 260, 60, 200, 17, [4, 8, 12]) },
  month: { charge: 27900, discharge: 25500, revenue: 5295.29, bars: makeBars(500, 700, 400, 650, 31, [3, 7, 11]) },
  year: { charge: 288500, discharge: 265600, revenue: 52140, bars: makeBars(15000, 11000, 12000, 9000, 47, [2, 6, 10]) },
  total: { charge: 885000, discharge: 756000, revenue: 152300, bars: makeBars(20000, 16000, 16000, 13000, 67, [5, 8, 12]) },
};

export interface StationPeriodData {
  charge: number;
  revenue: number;
  bars: BarPoint[];
}

export const STATION_PERIOD: Record<PeriodType, StationPeriodData> = {
  day: { charge: 0, revenue: 0, bars: Array.from({ length: 12 }, (_, i) => ({ x: `${i + 1}`, a: 0, b: 0 })) },
  month: { charge: 0, revenue: 0, bars: Array.from({ length: 12 }, (_, i) => ({ x: `${i + 1}`, a: 0, b: 0 })) },
  year: { charge: 12400, revenue: 9860, bars: makeBars(300, 800, 0, 0, 19, [6, 10]) },
  total: { charge: 45800, revenue: 36500, bars: makeBars(500, 1100, 0, 0, 43, [4, 9]) },
};

// ==================== 天盈 AI 仿真报告 ====================
// 报告正文与数据已迁至 src/data/tianyingSimData.ts（与 web 端 -2.0 弹窗同源），此处不再保留旧 mock。
