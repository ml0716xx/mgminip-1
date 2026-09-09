/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MonthReport, DailyData } from '../types';

// 指标口径对齐 -2.0 StrategyReportPage：
// - AI 非运行日 = 6/12/18/24/30（`(i+1) % 6 === 0` 规则）
// - 限电/止损为 96 点口径的日数据，止损金额含负值（偏差考核/绿电折损）
// - 月度 KPI 采用 -2.0 的两翼拆解口径：光伏收益 + 储能收益 = 全月综合运行总收益

function generateJuly2026(): MonthReport {
  const totalDays = 31;
  const dailyList: DailyData[] = [];

  const inactiveDays = [6, 12, 18, 24, 30];

  const curtailmentMap: Record<number, number> = {
    2: 4.8, 3: 10.5, 4: 7.2, 6: 16.8, 7: 15.2, 8: 8.5, 10: 20.1, 13: 12.5, 14: 3.6, 15: 48.5, 16: 26.8, 19: 6.2, 20: 9.4, 22: 8.1, 25: 23.5, 28: 11.8, 30: 5.4,
  };
  const stopLossMap: Record<number, number> = {
    2: -45, 3: 120, 4: 85, 6: 200, 7: 180, 8: -80, 10: 240, 13: 150, 14: -35, 15: 580, 16: 320, 19: -60, 20: 110, 22: 95, 25: 280, 28: 140, 30: -50,
  };

  for (let d = 1; d <= totalDays; d++) {
    const isAiRunning = !inactiveDays.includes(d);

    const compRevenue = 3000 + ((d * 37) % 11) * 100 + ((d * 23) % 7) * 40;
    const aiRevenue = isAiRunning
      ? Math.round(compRevenue + Math.round(compRevenue * (0.25 + ((d * 13) % 7) * 0.02)))
      : compRevenue;

    const pvSelfConsumption = 1000 + ((d * 41) % 13) * 60 + ((d * 17) % 5) * 25;
    const pvGridFeeding = 200 + ((d * 19) % 9) * 30;

    dailyList.push({
      day: d,
      aiRevenue,
      compRevenue,
      pvSelfConsumption,
      pvGridFeeding,
      curtailmentEnergy: curtailmentMap[d] || 0,
      stopLossRevenue: stopLossMap[d] || 0,
      isAiRunning,
      chargeEnergy: 550 + ((d * 29) % 11) * 30,
      dischargeEnergy: 480 + ((d * 31) % 9) * 35,
    });
  }

  return {
    month: '2026年07月',
    summary: {
      aiTotalRevenue: 83850,
      baseTotalRevenue: 69903,
      aiImprovementRevenue: 13947,
      revenueImprovementRate: 20.0,
      aiProfitContributionRate: 16.6,
      aiProfitAverageDaily: 450,
      dutyCycleRate: 83.9,
      dutyCycleHours: 624,
      solarAbsorptionRate: 96.8,
      solarAbsorptionImprovementRate: 8.7,
      solarAbsorptionBaseRate: 88.1,
      aiRunningDays: 26,
      monthlyPowerGeneration: 37400,
      aiSelfConsumptionRate: 96.8,
      baseSelfConsumptionRate: 88.1,
      selfConsumptionRateImprovement: 8.7,
      aiChargeEnergy: 16200,
      baseChargeEnergy: 12800,
      aiDischargeEnergy: 15400,
      baseDischargeEnergy: 11800,
      curtailmentEnergy: 227.3,
      stopLossRevenue: 2140,
    },
    dailyList,
  };
}

function generateJune2026(): MonthReport {
  const totalDays = 30;
  const dailyList: DailyData[] = [];

  const inactiveDays = [6, 12, 18, 24, 30];

  const curtailmentMap: Record<number, number> = {
    2: 9.8, 5: 12.4, 8: 14.5, 11: 19.1, 15: 38.2, 16: 21.1, 19: 9.4, 22: 11.5, 24: 20.1, 27: 10.5,
  };
  const stopLossMap: Record<number, number> = {
    2: 110, 5: 140, 8: 180, 11: 230, 15: 450, 16: 250, 19: 100, 22: 130, 24: 240, 27: 115,
  };

  for (let d = 1; d <= totalDays; d++) {
    const isAiRunning = !inactiveDays.includes(d);

    const compRevenue = 2800 + ((d * 43) % 9) * 110 + ((d * 17) % 7) * 50;
    const aiRevenue = isAiRunning
      ? Math.round(compRevenue + Math.round(compRevenue * (0.24 + ((d * 11) % 7) * 0.02)))
      : compRevenue;

    const pvSelfConsumption = 950 + ((d * 37) % 11) * 55;
    const pvGridFeeding = 180 + ((d * 13) % 7) * 25;

    dailyList.push({
      day: d,
      aiRevenue,
      compRevenue,
      pvSelfConsumption,
      pvGridFeeding,
      curtailmentEnergy: curtailmentMap[d] || 0,
      stopLossRevenue: stopLossMap[d] || 0,
      isAiRunning,
      chargeEnergy: 480 + ((d * 31) % 9) * 25,
      dischargeEnergy: 420 + ((d * 23) % 11) * 30,
    });
  }

  return {
    month: '2026年06月',
    summary: {
      aiTotalRevenue: 76100,
      baseTotalRevenue: 63535,
      aiImprovementRevenue: 12565,
      revenueImprovementRate: 19.8,
      aiProfitContributionRate: 16.5,
      aiProfitAverageDaily: 419,
      dutyCycleRate: 83.3,
      dutyCycleHours: 600,
      solarAbsorptionRate: 95.6,
      solarAbsorptionImprovementRate: 8.3,
      solarAbsorptionBaseRate: 87.3,
      aiRunningDays: 25,
      monthlyPowerGeneration: 34600,
      aiSelfConsumptionRate: 95.6,
      baseSelfConsumptionRate: 87.3,
      selfConsumptionRateImprovement: 8.3,
      aiChargeEnergy: 14800,
      baseChargeEnergy: 11700,
      aiDischargeEnergy: 14100,
      baseDischargeEnergy: 10800,
      curtailmentEnergy: 166.5,
      stopLossRevenue: 1845,
    },
    dailyList,
  };
}

function generateMay2026(): MonthReport {
  const totalDays = 31;
  const dailyList: DailyData[] = [];

  const inactiveDays = [6, 12, 18, 24, 30];

  const curtailmentMap: Record<number, number> = {
    3: 12.1, 6: 10.4, 9: 15.6, 12: 21.2, 15: 41.5, 16: 25.1, 21: 11.2, 23: 12.5, 26: 22.4, 29: 12.1,
  };
  const stopLossMap: Record<number, number> = {
    3: 130, 6: 110, 9: 190, 12: 250, 15: 520, 16: 290, 21: 120, 23: 140, 26: 260, 29: 135,
  };

  for (let d = 1; d <= totalDays; d++) {
    const isAiRunning = !inactiveDays.includes(d);

    const compRevenue = 2900 + ((d * 31) % 11) * 115 + ((d * 19) % 6) * 45;
    const aiRevenue = isAiRunning
      ? Math.round(compRevenue + Math.round(compRevenue * (0.23 + ((d * 17) % 7) * 0.02)))
      : compRevenue;

    const pvSelfConsumption = 1000 + ((d * 29) % 13) * 50;
    const pvGridFeeding = 200 + ((d * 11) % 8) * 30;

    dailyList.push({
      day: d,
      aiRevenue,
      compRevenue,
      pvSelfConsumption,
      pvGridFeeding,
      curtailmentEnergy: curtailmentMap[d] || 0,
      stopLossRevenue: stopLossMap[d] || 0,
      isAiRunning,
      chargeEnergy: 520 + ((d * 37) % 9) * 30,
      dischargeEnergy: 450 + ((d * 29) % 11) * 25,
    });
  }

  return {
    month: '2026年05月',
    summary: {
      aiTotalRevenue: 79300,
      baseTotalRevenue: 66150,
      aiImprovementRevenue: 13150,
      revenueImprovementRate: 19.9,
      aiProfitContributionRate: 16.6,
      aiProfitAverageDaily: 424,
      dutyCycleRate: 83.9,
      dutyCycleHours: 624,
      solarAbsorptionRate: 95.9,
      solarAbsorptionImprovementRate: 8.5,
      solarAbsorptionBaseRate: 87.4,
      aiRunningDays: 26,
      monthlyPowerGeneration: 35800,
      aiSelfConsumptionRate: 95.9,
      baseSelfConsumptionRate: 87.4,
      selfConsumptionRateImprovement: 8.5,
      aiChargeEnergy: 15600,
      baseChargeEnergy: 12300,
      aiDischargeEnergy: 14900,
      baseDischargeEnergy: 11400,
      curtailmentEnergy: 184.0,
      stopLossRevenue: 2155,
    },
    dailyList,
  };
}

export const REPORTS: Record<string, MonthReport> = {
  '2026年07月': generateJuly2026(),
  '2026年06月': generateJune2026(),
  '2026年05月': generateMay2026(),
};

export const AVAILABLE_MONTHS = ['2026年07月', '2026年06月', '2026年05月'];
