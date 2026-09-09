/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { MonthReport } from '../types';
import { REPORTS, AVAILABLE_MONTHS } from '../data/mockData';
import {
  RevenueComparisonChart,
  PvSelfConsumptionComparisonChart,
  StorageComparisonChart,
  EssPriceSpreadChart,
  CurtailmentStopLossChart,
} from './ReportCharts';
import {
  ChevronLeft,
  ChevronRight,
  Sun,
  Zap,
  Sparkles,
} from 'lucide-react';
import { motion } from 'motion/react';

interface ReportPageProps {
  onBack: () => void;
  pvCurtailmentView?: boolean;
}

export const ReportPage: React.FC<ReportPageProps> = ({ onBack, pvCurtailmentView = true }) => {
  const [selectedMonth, setSelectedMonth] = useState<string>('2026年07月');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(timer);
  }, [selectedMonth]);

  const reportData: MonthReport | undefined = REPORTS[selectedMonth];

  const handlePrevMonth = () => {
    const idx = AVAILABLE_MONTHS.indexOf(selectedMonth);
    if (idx < AVAILABLE_MONTHS.length - 1) setSelectedMonth(AVAILABLE_MONTHS[idx + 1]);
  };
  const handleNextMonth = () => {
    const idx = AVAILABLE_MONTHS.indexOf(selectedMonth);
    if (idx > 0) setSelectedMonth(AVAILABLE_MONTHS[idx - 1]);
  };
  const idx = AVAILABLE_MONTHS.indexOf(selectedMonth);
  const hasPrev = idx < AVAILABLE_MONTHS.length - 1;
  const hasNext = idx > 0;

  // ===== -2.0 口径指标计算（去除配置策略模拟态，仅实际口径） =====
  const s = reportData?.summary;
  const pvConsumptionRate = s ? s.solarAbsorptionRate : 0;              // 光伏消纳率
  const pvConsumptionBaseline = s ? s.solarAbsorptionBaseRate : 0;       // 基准消纳率
  const pvConsumptionGain = s ? Math.round(s.aiTotalRevenue * 0.33) : 0; // 消纳率提升收益
  const pvToStorageGain = s ? Math.round(s.aiTotalRevenue * 0.255) : 0;  // 光伏入储电量提升收益
  const pvCurtailmentGain = s ? s.stopLossRevenue : 0;                   // 限电止损金额
  const pvTotalRevenue = pvConsumptionGain + pvToStorageGain + pvCurtailmentGain;

  const essUtilRate = 97.2;
  const essUtilRateBaseline = 84.8;
  const essUtilizationGain = s ? Math.round(s.aiTotalRevenue * 0.22) : 0;   // 储能利用率提升收益
  const essThroughputGain = s ? Math.round(s.aiTotalRevenue * 0.17) : 0;    // 储能充放电量提升收益
  const essTotalRevenue = essUtilizationGain + essThroughputGain;

  const totalOperationalRevenue = pvTotalRevenue + essTotalRevenue;
  const pvSharePercent = totalOperationalRevenue > 0 ? ((pvTotalRevenue / totalOperationalRevenue) * 100).toFixed(1) : '0';
  const essSharePercent = totalOperationalRevenue > 0 ? ((essTotalRevenue / totalOperationalRevenue) * 100).toFixed(1) : '0';

  const chargeCostAvg = 0.312;
  const baselineChargeCostAvg = 0.358;
  const chargeCostDiffPct = (((baselineChargeCostAvg - chargeCostAvg) / baselineChargeCostAvg) * 100).toFixed(1);
  const dischargePriceAvg = 0.925;
  const baselineDischargePriceAvg = 0.867;
  const dischargePriceDiffPct = (((dischargePriceAvg - baselineDischargePriceAvg) / baselineDischargePriceAvg) * 100).toFixed(1);

  const avgUnitCost = 0.386;
  const baselineAvgUnitCost = 0.458;
  const unitCostReduced = (baselineAvgUnitCost - avgUnitCost).toFixed(3);
  const unitCostReducedPct = (((baselineAvgUnitCost - avgUnitCost) / baselineAvgUnitCost) * 100).toFixed(1);
  const totalCostSavings = 14260;

  const curtailedDays = reportData ? reportData.dailyList.filter((d) => d.curtailmentEnergy > 0) : [];
  const totalCurtailedEnergy = curtailedDays.reduce((sum, d) => sum + d.curtailmentEnergy, 0);
  const avgCurtailmentSavedDaily = reportData ? (s!.stopLossRevenue / reportData.dailyList.length).toFixed(2) : '0';

  return (
    <div className="relative flex flex-col h-full bg-[#f8fafc] text-gray-800 overflow-hidden">
      {/* 1. 顶部栏（配置策略功能已移除） */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-100 flex flex-col shadow-xs">
        <div className="px-4 py-3.5 flex items-center justify-between">
          <button
            onClick={onBack}
            id="btn_back_to_features"
            className="flex items-center gap-1.5 text-gray-600 transition-colors animate-none"
          >
            <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
            <span className="text-sm font-bold">返回</span>
          </button>
          <h1 className="text-base font-black text-gray-900 tracking-tight">策略运行报告</h1>
          {/* 占位保持标题居中（原配置策略按钮已按要求移除） */}
          <div className="w-[64px]" />
        </div>

        <div className="px-4 py-2 bg-gray-50/70 border-t border-gray-50 flex items-center justify-between">
          <span className="text-xs text-gray-400 font-bold">分析统计周期</span>
          <div className="flex items-center gap-1 bg-white border border-gray-100 p-0.5 rounded-lg shadow-2xs">
            <button
              onClick={handlePrevMonth}
              disabled={!hasPrev}
              className={`p-1 rounded-md transition-colors ${hasPrev ? 'text-gray-600 bg-gray-100' : 'text-gray-300 cursor-not-allowed'}`}
              title="上个月"
            >
              <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
            </button>
            <span className="text-xs font-extrabold text-gray-800 px-3 font-mono min-w-[85px] text-center">
              {selectedMonth}
            </span>
            <button
              onClick={handleNextMonth}
              disabled={!hasNext}
              className={`p-1 rounded-md transition-colors ${hasNext ? 'text-gray-600 bg-gray-100' : 'text-gray-300 cursor-not-allowed'}`}
              title="下个月"
            >
              <ChevronRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-24">
        {loading ? (
          <div className="space-y-4 animate-pulse">
            <div className="bg-white rounded-2xl h-36 border border-gray-100" />
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-2xl h-24 border border-gray-100" />
              ))}
            </div>
            <div className="bg-white h-48 rounded-2xl border border-gray-100" />
          </div>
        ) : reportData ? (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">

            {/* 2. 全月综合运行总收益 HUB（-2.0 口径） */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-700 tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  全月综合运行总收益
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-black text-slate-400 bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded-full">
                    当月 {reportData.dailyList.length} 天
                  </span>
                  <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                    <Sparkles className="w-2.5 h-2.5" />
                    AI 运行 {s!.aiRunningDays} 天
                  </span>
                </div>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-emerald-600 font-mono tracking-tight leading-none">
                  {(totalOperationalRevenue / 10000).toFixed(2)}
                </span>
                <span className="text-xs font-bold text-slate-400">万元</span>
                <span className="text-[10px] text-slate-400 font-mono">(¥{totalOperationalRevenue.toLocaleString()})</span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-50">
                <div className="bg-slate-50/70 rounded-xl p-2.5 border border-slate-100">
                  <span className="text-[9px] text-slate-400 font-extrabold block mb-0.5">AI提升收益</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-sm font-black text-slate-800 font-mono">¥{(totalCostSavings / 10000).toFixed(2)}万</span>
                    <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded">+{unitCostReducedPct}%</span>
                  </div>
                </div>
                <div className="bg-slate-50/70 rounded-xl p-2.5 border border-slate-100">
                  <span className="text-[9px] text-slate-400 font-extrabold block mb-0.5">综合度电成本</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-sm font-black text-slate-800 font-mono">¥{avgUnitCost}</span>
                    <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded">-¥{unitCostReduced}</span>
                  </div>
                </div>
              </div>

              {/* 光伏/储能收益占比双色条 */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-[10px] font-bold">
                  <span className="text-amber-600 flex items-center gap-1">
                    <Sun className="w-3 h-3 text-amber-500" />
                    光伏 {pvSharePercent}%
                  </span>
                  <span className="text-blue-600 flex items-center gap-1">
                    <Zap className="w-3 h-3 text-blue-500" />
                    储能 {essSharePercent}%
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex p-0.5 border border-slate-100">
                  <div className="h-full bg-amber-500 rounded-l-full transition-all duration-500" style={{ width: `${pvSharePercent}%` }} />
                  <div className="h-full bg-blue-600 rounded-r-full transition-all duration-500" style={{ width: `${essSharePercent}%` }} />
                </div>
                <div className="flex items-center justify-between text-[8px] text-slate-400 font-bold">
                  <span>消纳率 + 入储 + 限电止损</span>
                  <span>利用率 + 充放电量</span>
                </div>
              </div>
            </div>

            {/* 3. 光伏收益板块（琥珀金） */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-50 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-4 bg-amber-500 rounded-full" />
                  <h3 className="text-sm font-black text-slate-800 flex items-center gap-1.5">
                    <Sun className="w-4 h-4 text-amber-500" />
                    光伏收益
                  </h3>
                  <span className="text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">
                    占比 {pvSharePercent}%
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[8px] text-slate-400 font-bold block">总收益</span>
                  <span className="text-base font-black text-amber-600 font-mono leading-none">
                    {(pvTotalRevenue / 10000).toFixed(2)}<span className="text-[9px] text-slate-400 ml-0.5">万</span>
                  </span>
                </div>
              </div>

              {/* 1.1 消纳率提升 */}
              <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-600">消纳率提升</span>
                  <span className="text-[9px] font-black text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                    +{s!.solarAbsorptionImprovementRate}%
                  </span>
                </div>
                <div className="flex items-baseline justify-between mt-1">
                  <div className="flex items-baseline gap-1">
                    <span className="text-base font-black text-slate-800 font-mono">{pvConsumptionRate}%</span>
                    <span className="text-[9px] font-bold text-slate-400">消纳率</span>
                  </div>
                  <span className="text-[9px] text-slate-400">基准 {pvConsumptionBaseline}%</span>
                </div>
              </div>

              {/* 1.2~1.4 光伏电量三卡 */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: '光伏发电量', badge: '+2.1%', value: '3.74', baseline: '3.66' },
                  { label: '光伏上网电量', badge: '-11.5%', value: '0.52', baseline: '0.59' },
                  { label: '光伏入储电量', badge: '+24.6%', value: '1.18', baseline: '0.95' },
                ].map((c) => (
                  <div key={c.label} className="bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-[8px] font-bold text-slate-500 block leading-tight">{c.label}</span>
                    <span className="text-[9px] font-black text-amber-700 bg-amber-50 px-1 py-0.5 rounded inline-block mt-1">{c.badge}</span>
                    <div className="flex items-baseline gap-0.5 mt-1">
                      <span className="text-sm font-black text-slate-800 font-mono">{c.value}</span>
                      <span className="text-[8px] font-bold text-slate-400">万kWh</span>
                    </div>
                    <span className="text-[8px] text-slate-400 block">基准 {c.baseline}</span>
                  </div>
                ))}
              </div>

              {/* 1.5 限电止损 */}
              <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-slate-600">限电止损</span>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className="text-base font-black text-slate-800 font-mono">{totalCurtailedEnergy.toFixed(1)}</span>
                      <span className="text-[9px] font-bold text-slate-400">kWh 止损电量</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[9px] font-black text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                      +¥{pvCurtailmentGain.toLocaleString()}
                    </span>
                    <span className="text-[8px] text-slate-400">日均减亏 +¥{avgCurtailmentSavedDaily}/天</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-50 pt-2 flex items-center justify-between text-[9px] text-slate-400 font-bold">
                <span>消纳率 · 入储量 · 限电止损</span>
                <span className="text-amber-600 font-black">当月光伏收益: ¥{pvTotalRevenue.toLocaleString()}</span>
              </div>
            </div>

            {/* 4. 储能收益板块（电能蓝） */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-50 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-4 bg-blue-600 rounded-full" />
                  <h3 className="text-sm font-black text-slate-800 flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-blue-600" />
                    储能收益
                  </h3>
                  <span className="text-[9px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded-full">
                    占比 {essSharePercent}%
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[8px] text-slate-400 font-bold block">总收益</span>
                  <span className="text-base font-black text-blue-600 font-mono leading-none">
                    {(essTotalRevenue / 10000).toFixed(2)}<span className="text-[9px] text-slate-400 ml-0.5">万</span>
                  </span>
                </div>
              </div>

              {/* 2.1 储能利用率 */}
              <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-600">储能利用率提升</span>
                  <span className="text-[9px] font-black text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">+12.4%</span>
                </div>
                <div className="flex items-baseline justify-between mt-1">
                  <div className="flex items-baseline gap-1">
                    <span className="text-base font-black text-slate-800 font-mono">{essUtilRate}%</span>
                    <span className="text-[9px] font-bold text-slate-400">综合利用率</span>
                  </div>
                  <span className="text-[9px] text-slate-400">基准 {essUtilRateBaseline}%</span>
                </div>
              </div>

              {/* 2.2 & 2.3 充放电量 */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-600">充电量提升</span>
                    <span className="text-[9px] font-black text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">+26.6%</span>
                  </div>
                  <div className="flex items-baseline justify-between mt-1">
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm font-black text-slate-800 font-mono">{(s!.aiChargeEnergy / 10000).toFixed(2)}</span>
                      <span className="text-[8px] font-bold text-slate-400">万kWh</span>
                    </div>
                    <span className="text-[8px] text-slate-400">基准 {(s!.baseChargeEnergy / 10000).toFixed(2)}</span>
                  </div>
                </div>
                <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-600">放电量提升</span>
                    <span className="text-[9px] font-black text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">+30.5%</span>
                  </div>
                  <div className="flex items-baseline justify-between mt-1">
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm font-black text-slate-800 font-mono">{(s!.aiDischargeEnergy / 10000).toFixed(2)}</span>
                      <span className="text-[8px] font-bold text-slate-400">万kWh</span>
                    </div>
                    <span className="text-[8px] text-slate-400">基准 {(s!.baseDischargeEnergy / 10000).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* 2.4 & 2.5 充电成本 / 放电价格 */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-600">储能充电成本</span>
                    <span className="text-[9px] font-black text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">-{chargeCostDiffPct}%</span>
                  </div>
                  <div className="flex items-baseline justify-between mt-1">
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm font-black text-slate-800 font-mono">¥{chargeCostAvg}</span>
                      <span className="text-[8px] font-bold text-slate-400">/kWh</span>
                    </div>
                    <span className="text-[8px] text-slate-400">基准 ¥{baselineChargeCostAvg}</span>
                  </div>
                </div>
                <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-600">储能放电价格</span>
                    <span className="text-[9px] font-black text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">+{dischargePriceDiffPct}%</span>
                  </div>
                  <div className="flex items-baseline justify-between mt-1">
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm font-black text-slate-800 font-mono">¥{dischargePriceAvg}</span>
                      <span className="text-[8px] font-bold text-slate-400">/kWh</span>
                    </div>
                    <span className="text-[8px] text-slate-400">基准 ¥{baselineDischargePriceAvg}</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-50 pt-2 flex items-center justify-between text-[9px] text-slate-400 font-bold">
                <span>利用率 · 充放电量 · 充放价差</span>
                <span className="text-blue-600 font-black">当月储能收益: ¥{essTotalRevenue.toLocaleString()}</span>
              </div>
            </div>

            {/* 5. 图表区（12 天分段滑动 + 横屏全屏 + 点击柱看页内详情） */}
            <RevenueComparisonChart report={reportData} />
            <PvSelfConsumptionComparisonChart report={reportData} />
            {pvCurtailmentView && (
              <CurtailmentStopLossChart report={reportData} />
            )}
            <StorageComparisonChart report={reportData} />
            <EssPriceSpreadChart report={reportData} />

          </motion.div>
        ) : (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 p-6 space-y-2">
            <span className="text-2xl">📊</span>
            <h3 className="text-sm font-bold text-gray-800">该月暂无报告数据</h3>
            <p className="text-xs text-gray-400">请选择历史其他有统计数据的周期查看。</p>
          </div>
        )}
      </div>
    </div>
  );
};
