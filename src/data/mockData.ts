/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MonthReport, DailyData } from '../types';

function generateJuly2026(): MonthReport {
  const totalDays = 31;
  const dailyList: DailyData[] = [];

  // Inactive days for AI: 5, 12, 19, 20, 26, 27 (6 days inactive -> 25 days active)
  const inactiveDays = [5, 12, 19, 20, 26, 27];

  const curtailmentMap: Record<number, number> = {
    3: 11800, 4: 8500, 6: 15400, 7: 18200, 10: 22100, 13: 12500, 15: 48500, 16: 26400, 20: 10100, 22: 9200, 25: 24300, 28: 11200
  };
  const stopLossMap: Record<number, number> = {
    3: 150, 4: 110, 6: 0, 7: 220, 10: 260, 13: 140, 15: 580, 16: 320, 20: 120, 22: 110, 25: 280, 28: 130
  };

  for (let d = 1; d <= totalDays; d++) {
    const isAiRunning = !inactiveDays.includes(d);
    
    // Base strategy revenue (deterministic natural-looking variation)
    const compRevenue = 3200 + ((d * 37) % 11) * 120 + ((d * 23) % 7) * 40; 
    
    // AI strategy revenue
    // If AI is running, it adds a substantial smart profit premium (typically 12% to 20% extra)
    // If AI is inactive, actual revenue equals base comparative revenue
    const aiRevenue = isAiRunning 
      ? Math.round(compRevenue + 450 + ((d * 19) % 9) * 55 + ((d * 11) % 5) * 30)
      : compRevenue;

    // Solar power values
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
      aiTotalRevenue: 125430,
      baseTotalRevenue: 109546,
      aiImprovementRevenue: 18240,
      revenueImprovementRate: 14.5,
      aiProfitContributionRate: 14.5,
      aiProfitAverageDaily: 608,
      dutyCycleRate: 92.4,
      dutyCycleHours: 665.2,
      solarAbsorptionRate: 98.5,
      solarAbsorptionImprovementRate: 8.2,
      solarAbsorptionBaseRate: 90.3,
      aiRunningDays: 25,
      monthlyPowerGeneration: 48500,
      aiSelfConsumptionRate: 85.2,
      baseSelfConsumptionRate: 82.0,
      selfConsumptionRateImprovement: 3.2,
      aiChargeEnergy: 18500,
      baseChargeEnergy: 16200,
      aiDischargeEnergy: 15800,
      baseDischargeEnergy: 13500,
      curtailmentEnergy: 218200,
      stopLossRevenue: 2420,
    },
    dailyList,
  };
}

function generateJune2026(): MonthReport {
  const totalDays = 30;
  const dailyList: DailyData[] = [];

  // Inactive days for AI: 6, 13, 20, 27 (4 days inactive -> 26 days active)
  const inactiveDays = [6, 13, 20, 27];

  const curtailmentMap: Record<number, number> = {
    2: 9800, 5: 12400, 8: 14500, 11: 19100, 15: 38200, 16: 21100, 19: 9400, 22: 11500, 24: 20100, 27: 10500
  };
  const stopLossMap: Record<number, number> = {
    2: 110, 5: 140, 8: 180, 11: 230, 15: 450, 16: 250, 19: 100, 22: 130, 24: 240, 27: 115
  };

  for (let d = 1; d <= totalDays; d++) {
    const isAiRunning = !inactiveDays.includes(d);
    
    const compRevenue = 2800 + ((d * 43) % 9) * 110 + ((d * 17) % 7) * 50;
    const aiRevenue = isAiRunning 
      ? Math.round(compRevenue + 400 + ((d * 23) % 8) * 45 + ((d * 13) % 5) * 20)
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
      aiTotalRevenue: 108420,
      baseTotalRevenue: 95105,
      aiImprovementRevenue: 14520,
      revenueImprovementRate: 14.0,
      aiProfitContributionRate: 13.4,
      aiProfitAverageDaily: 558,
      dutyCycleRate: 89.1,
      dutyCycleHours: 641.5,
      solarAbsorptionRate: 96.2,
      solarAbsorptionImprovementRate: 7.5,
      solarAbsorptionBaseRate: 88.7,
      aiRunningDays: 26,
      monthlyPowerGeneration: 42100,
      aiSelfConsumptionRate: 82.5,
      baseSelfConsumptionRate: 79.5,
      selfConsumptionRateImprovement: 3.0,
      aiChargeEnergy: 15200,
      baseChargeEnergy: 13100,
      aiDischargeEnergy: 13100,
      baseDischargeEnergy: 11100,
      curtailmentEnergy: 166600,
      stopLossRevenue: 1845,
    },
    dailyList,
  };
}

function generateMay2026(): MonthReport {
  const totalDays = 31;
  const dailyList: DailyData[] = [];

  // Inactive days for AI: 5, 12, 19, 26, 31 (5 days inactive -> 26 active days)
  const inactiveDays = [5, 12, 19, 26, 31];

  const curtailmentMap: Record<number, number> = {
    3: 12100, 6: 10450, 9: 15600, 12: 21200, 15: 41500, 16: 25100, 21: 11200, 23: 12500, 26: 22400, 29: 12100
  };
  const stopLossMap: Record<number, number> = {
    3: 130, 6: 110, 9: 190, 12: 250, 15: 520, 16: 290, 21: 120, 23: 140, 26: 260, 29: 135
  };

  for (let d = 1; d <= totalDays; d++) {
    const isAiRunning = !inactiveDays.includes(d);
    
    const compRevenue = 2900 + ((d * 31) % 11) * 115 + ((d * 19) % 6) * 45;
    const aiRevenue = isAiRunning 
      ? Math.round(compRevenue + 420 + ((d * 17) % 9) * 50 + ((d * 7) % 5) * 25)
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
      aiTotalRevenue: 119500,
      baseTotalRevenue: 104824,
      aiImprovementRevenue: 16850,
      revenueImprovementRate: 14.2,
      aiProfitContributionRate: 14.1,
      aiProfitAverageDaily: 561,
      dutyCycleRate: 90.5,
      dutyCycleHours: 651.8,
      solarAbsorptionRate: 97.8,
      solarAbsorptionImprovementRate: 8.0,
      solarAbsorptionBaseRate: 89.8,
      aiRunningDays: 26,
      monthlyPowerGeneration: 46800,
      aiSelfConsumptionRate: 84.1,
      baseSelfConsumptionRate: 81.0,
      selfConsumptionRateImprovement: 3.1,
      aiChargeEnergy: 17100,
      baseChargeEnergy: 14900,
      aiDischargeEnergy: 14800,
      baseDischargeEnergy: 12500,
      curtailmentEnergy: 184150,
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
