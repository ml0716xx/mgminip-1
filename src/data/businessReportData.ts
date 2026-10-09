/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AiActivationStatus } from './overviewData';

// ==================== 经营分析报告（按线上小程序截图结构还原） ====================
// 章节结构：
// 一、月度经营总览（基本信息 / 电量收益环图 / 微网供电量 / 微网用电量）
// 1.1 光伏发电量&收益（柱线双轴 + 分析）
// 1.2 储能充放电量&收益（双柱+折线 + 分析）
// 1.3 充电桩充电量&收益（柱线 + 分析）
// 二、指标分析
//   2.1 光伏消纳率（双柱+折线 + 分析）
//   2.2 度电成本（双柱+双折线 + 分析）
// 三、AI 策略分析（小程序端新增，三态开通状态差异展示）

export interface BusinessDayRow {
  day: number;
  pvGen: number; // 光伏发电量 kWh
  pvRevenue: number; // 光伏收益 元
  essCharge: number; // 储能充电量 kWh
  essDischarge: number; // 储能放电量 kWh
  essRevenue: number; // 储能收益 元
  evCharge: number; // 充电桩充电量 kWh
  evRevenue: number; // 充电桩收益 元
  pvSelfUse: number; // 光伏自用电量 kWh
  loadUse: number; // 负载用电量 kWh
  gridUse: number; // 电网用电量 kWh
  absorptionRate: number; // 消纳率 %
  rawCost: number; // 原始度电成本 元/kWh
  savedCost: number; // 节约后度电成本 元/kWh
}

const mkDays = (): BusinessDayRow[] =>
  Array.from({ length: 15 }, (_, i) => {
    const d = i + 1;
    const pvGen = 5200 + ((d * 53) % 13) * 240 + ((d * 31) % 7) * 60;
    const pvSelfUse = Math.round(pvGen * (0.55 + ((d * 17) % 5) * 0.06));
    const essCharge = 700 + ((d * 41) % 9) * 90 + ((d * 11) % 5) * 40;
    const essDischarge = 620 + ((d * 37) % 8) * 85 + ((d * 13) % 5) * 30;
    const gridUse = 5200 + ((d * 43) % 11) * 520;
    const loadUse = pvSelfUse + gridUse + essDischarge - 800 - ((d * 7) % 6) * 100;
    return {
      day: d,
      pvGen,
      pvRevenue: Math.round(pvGen * 0.16),
      essCharge,
      essDischarge,
      essRevenue: Math.round(essDischarge * 0.45),
      evCharge: 0,
      evRevenue: 0,
      pvSelfUse,
      loadUse,
      gridUse,
      absorptionRate: 55 + ((d * 23) % 9) * 5,
      rawCost: 0.42 + ((d * 19) % 5) * 0.05,
      savedCost: 0.28 + ((d * 29) % 4) * 0.03,
    };
  });

export interface BusinessReportData {
  month: string;
  periodStart: string;
  periodEnd: string;
  station: string;
  site: string; // 站点位置描述
  pvCapacity: number; // MWp
  inverterCount: number; // 台
  essCapacity: number; // MWh
  essCount: number; // 台
  evCount: number; // 台
  totalRevenueWan: number; // 总收益 万元
  pvRevenueWan: number; // 光伏收益 万元
  evRevenueYuan: number; // 充电收益 元
  essRevenueYuan: number; // 储能收益 元
  supply: { pvGenWan: number; essDischargeWan: number; gridImportWan: number };
  consumption: { gridExportWan: number; essChargeWan: number; loadUseWan: number; evChargeWan: number };
  pvAnalysis: {
    monthGenWan: number;
    avgDaily: number;
    yearGenWan: number;
    monthRevenueWan: number;
    selfUseWan: number;
    gridFeedWan: number;
  };
  essAnalysis: {
    monthChargeWan: number;
    monthDischargeWan: number;
    yearChargeWan: number;
    yearDischargeWan: number;
    monthRevenueYuan: number;
  };
  evAnalysis: { monthCharge: number; yearCharge: number; monthRevenue: number | null };
  absorption: { monthGenWan: number; selfUseWan: number; rate: number };
  cost: { totalUseWan: number; gridUseWan: number; rawCost: number; savedCost: number; savingWan: number };
  days: BusinessDayRow[];
}

export const BUSINESS_REPORT: BusinessReportData = {
  month: '2026年09月',
  periodStart: '2026-09-01',
  periodEnd: '2026-09-30',
  station: '1#站',
  site: '站点位于山东省烟台市蓬莱区。',
  pvCapacity: 1.6,
  inverterCount: 1,
  essCapacity: 1.04,
  essCount: 4,
  evCount: 0,
  totalRevenueWan: 7.51,
  pvRevenueWan: 6.98,
  evRevenueYuan: 0,
  essRevenueYuan: 5295.29,
  supply: { pvGenWan: 15.38, essDischargeWan: 2.55, gridImportWan: 10.5 },
  consumption: { gridExportWan: 4.09, essChargeWan: 2.79, loadUseWan: 21.55, evChargeWan: 0 },
  pvAnalysis: {
    monthGenWan: 15.38,
    avgDaily: 5127.8,
    yearGenWan: 132.76,
    monthRevenueWan: 6.98,
    selfUseWan: 5.79,
    gridFeedWan: 1.19,
  },
  essAnalysis: {
    monthChargeWan: 2.79,
    monthDischargeWan: 2.55,
    yearChargeWan: 28.85,
    yearDischargeWan: 26.56,
    monthRevenueYuan: 5295.29,
  },
  evAnalysis: { monthCharge: 0, yearCharge: 0, monthRevenue: null },
  absorption: { monthGenWan: 16.17, selfUseWan: 12.07, rate: 74.64 },
  cost: { totalUseWan: 22.45, gridUseWan: 10.62, rawCost: 0.58, savedCost: 0.32, savingWan: 5.84 },
  days: mkDays(),
};

// ==================== AI 策略分析（三态开通状态） ====================
export interface AiStrategyContent {
  status: AiActivationStatus;
  // 以下字段仅 trial / activated 有意义
  aiRevenueWan: number; // AI 策略月收益 万元
  baselineRevenueWan: number; // 基准策略收益 万元
  improvementWan: number; // AI 提升收益 万元
  improvementRate: number; // 提升率 %
  dutyRate: number; // AI 运行时长占比 %
  dutyHours: number; // 运行时长 h
  contributionRate: number; // AI 收益贡献占比 %
  perKwhSaving: number; // 度电成本下降 元/kWh
  curtailmentStopLoss: number; // 限电止损增收 元（增值特性）
}

export const AI_STRATEGY_CONTENT: AiStrategyContent = {
  status: 'activated', // 演示默认正式运行；工作台可切换
  aiRevenueWan: 8.71,
  baselineRevenueWan: 7.54,
  improvementWan: 1.17,
  improvementRate: 15.5,
  dutyRate: 96.8,
  dutyHours: 697.2,
  contributionRate: 13.4,
  perKwhSaving: 0.072,
  curtailmentStopLoss: 2140,
};
