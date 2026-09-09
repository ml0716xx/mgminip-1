/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface DailyData {
  day: number; // Day of the month (1-31)
  aiRevenue: number; // AI strategy revenue (元)
  compRevenue: number; // Comparative strategy revenue (元)
  pvSelfConsumption: number; // Photovoltaic self-consumption (kWh)
  pvGridFeeding: number; // Photovoltaic grid feeding (kWh)
  curtailmentEnergy: number; // Curtailment energy (kWh)
  stopLossRevenue: number; // Active stop-loss amount (元)
  isAiRunning: boolean; // Whether AI strategy was active on this day
  chargeEnergy: number; // Energy storage charging (kWh)
  dischargeEnergy: number; // Energy storage discharging (kWh)
}

export interface MonthReport {
  month: string; // e.g., "2026年07月"
  summary: {
    aiTotalRevenue: number;         // AI策略综合收益 (e.g. 125,430)
    baseTotalRevenue: number;       // 基础策略综合收益 (e.g. 109,546)
    aiImprovementRevenue: number;   // AI提升收益 (e.g. 18,240)
    revenueImprovementRate: number; // 较基础策略提升百分比 (e.g. 14.5)
    aiProfitContributionRate: number; // AI贡献占比百分比 (e.g. 14.5)
    aiProfitAverageDaily: number;   // 日均提升金额 (e.g. 608)
    dutyCycleRate: number;          // AI策略运行时长占比 (e.g. 92.4)
    dutyCycleHours: number;         // 累计运行时长小时数 (e.g. 665.2)
    solarAbsorptionRate: number;    // 光伏消纳率 (e.g. 98.5)
    solarAbsorptionImprovementRate: number; // AI优化提升百分比 (e.g. 8.2)
    solarAbsorptionBaseRate: number; // 基础消纳率百分比 (e.g. 90.3)
    
    aiRunningDays: number;          // AI运行天数
    monthlyPowerGeneration: number; // 月发电量
    aiSelfConsumptionRate: number;  // AI策略消纳率 (评估区域: 85.2)
    baseSelfConsumptionRate: number;// 基础策略消纳率
    selfConsumptionRateImprovement: number; // 消纳率提升 (评估区域: 3.2)
    aiChargeEnergy: number;         // AI策略充电量
    baseChargeEnergy: number;       // 基础策略充电量
    aiDischargeEnergy: number;      // AI策略放电量
    baseDischargeEnergy: number;    // 基础策略放电量
    curtailmentEnergy: number;      // 限电电量 (e.g. 1,200)
    stopLossRevenue: number;        // 负电价主动止损 (e.g. 580)
  };
  dailyList: DailyData[];
}

export type ActiveTab = 'overview' | 'features' | 'messages' | 'workbench';
