/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { MonthReport, SelectedStrategy, STRATEGIES } from '../types';
import { REPORTS, AVAILABLE_MONTHS } from '../data/mockData';
import {
  RevenueComparisonChart,
  PvSelfConsumptionComparisonChart,
  StorageComparisonChart,
  CurtailmentStopLossChart,
} from './ReportCharts';
import {
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Cpu,
  Zap,
  Layers,
  Battery,
  LineChart,
  Sun,
  Clock,
  Calendar,
  BarChart3,
  ShieldCheck,
  Sparkles,
  X,
  Settings,
  Check,
  Loader2,
  Info,
  Sliders,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ReportPageProps {
  onBack: () => void;
  pvCurtailmentView?: boolean;
}



export const ReportPage: React.FC<ReportPageProps> = ({ onBack, pvCurtailmentView = true }) => {
  const [selectedMonth, setSelectedMonth] = useState<string>('2026年07月');
  const [loading, setLoading] = useState<boolean>(false);
  
  // Strategy configurations states
  const [selectedStrategy, setSelectedStrategy] = useState<SelectedStrategy>('mean_adaptive');
  const [isConfigOpen, setIsConfigOpen] = useState<boolean>(false);
  
  // Advanced strategy configuration params
  const [socDepth, setSocDepth] = useState<number>(90); // 80 - 95%
  const [maxDemandLimit, setMaxDemandLimit] = useState<number>(220); // kW
  const [stopLossEnabled, setStopLossEnabled] = useState<boolean>(true);
  const [learningPeriod, setLearningPeriod] = useState<number>(14); // days
  
  // Down-linking state animation
  const [isApplying, setIsApplying] = useState<boolean>(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Base strategy configurations (from screenshot)
  const [selectedTemplate, setSelectedTemplate] = useState<string>('peak_valley_2c2f');

  // Trigger Skeleton Screen loading animation upon month switch
  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      setLoading(false);
    }, 400); // Premium interactive loader delay
    return () => clearTimeout(timer);
  }, [selectedMonth]);

  // Dynamic report modifier based on selected strategy
  const getModifiedReportData = (): MonthReport => {
    const original = REPORTS[selectedMonth];
    if (!original) return original;

    if (selectedStrategy === 'mean_adaptive') {
      return original;
    }

    if (selectedStrategy === 'regular_schedule') {
      // Scale down AI improvement since regular schedule is less optimized
      const scaleFactor = 0.55; 
      const aiImprovementRevenue = Math.round(original.summary.aiImprovementRevenue * scaleFactor);
      const aiTotalRevenue = original.summary.baseTotalRevenue + aiImprovementRevenue;
      
      const solarAbsorptionImprovementRate = original.summary.solarAbsorptionImprovementRate * scaleFactor;
      const solarAbsorptionRate = original.summary.solarAbsorptionBaseRate + solarAbsorptionImprovementRate;

      const modifiedDailyList = original.dailyList.map(day => {
        if (!day.isAiRunning) return day;
        const extraRevenue = day.aiRevenue - day.compRevenue;
        const scaledExtra = Math.round(extraRevenue * scaleFactor);
        
        const baseDis = day.dischargeEnergy;
        const extraDis = day.dischargeEnergy - 45; // simulated baseline vs ai extra
        const scaledDis = baseDis + Math.max(0, extraDis) * scaleFactor;

        const baseChg = day.chargeEnergy;
        const extraChg = day.chargeEnergy - 40;
        const scaledChg = baseChg + Math.max(0, extraChg) * scaleFactor;

        return {
          ...day,
          aiRevenue: day.compRevenue + scaledExtra,
          dischargeEnergy: parseFloat(scaledDis.toFixed(1)),
          chargeEnergy: parseFloat(scaledChg.toFixed(1)),
        };
      });

      return {
        ...original,
        summary: {
          ...original.summary,
          aiTotalRevenue,
          aiImprovementRevenue,
          solarAbsorptionImprovementRate: parseFloat(solarAbsorptionImprovementRate.toFixed(1)),
          solarAbsorptionRate: parseFloat(solarAbsorptionRate.toFixed(1)),
          aiProfitAverageDaily: Math.round(original.summary.aiProfitAverageDaily * scaleFactor),
          aiChargeEnergy: Math.round(original.summary.baseChargeEnergy + (original.summary.aiChargeEnergy - original.summary.baseChargeEnergy) * scaleFactor),
          aiDischargeEnergy: Math.round(original.summary.baseDischargeEnergy + (original.summary.aiDischargeEnergy - original.summary.baseDischargeEnergy) * scaleFactor),
        },
        dailyList: modifiedDailyList,
      };
    }

    if (selectedStrategy === 'no_battery') {
      // Disabled storage completely
      const modifiedDailyList = original.dailyList.map(day => {
        return {
          ...day,
          aiRevenue: day.compRevenue,
          isAiRunning: false,
          chargeEnergy: 0,
          dischargeEnergy: 0,
        };
      });

      return {
        ...original,
        summary: {
          ...original.summary,
          aiTotalRevenue: original.summary.baseTotalRevenue,
          aiImprovementRevenue: 0,
          solarAbsorptionImprovementRate: 0,
          solarAbsorptionRate: original.summary.solarAbsorptionBaseRate,
          aiProfitAverageDaily: 0,
          aiRunningDays: 0,
          aiChargeEnergy: 0,
          aiDischargeEnergy: 0,
          dutyCycleHours: 0,
          dutyCycleRate: 0,
        },
        dailyList: modifiedDailyList,
      };
    }

    return original;
  };

  const reportData = getModifiedReportData();

  const handlePrevMonth = () => {
    const idx = AVAILABLE_MONTHS.indexOf(selectedMonth);
    if (idx < AVAILABLE_MONTHS.length - 1) {
      setSelectedMonth(AVAILABLE_MONTHS[idx + 1]);
    }
  };

  const handleNextMonth = () => {
    const idx = AVAILABLE_MONTHS.indexOf(selectedMonth);
    if (idx > 0) {
      setSelectedMonth(AVAILABLE_MONTHS[idx - 1]);
    }
  };

  const idx = AVAILABLE_MONTHS.indexOf(selectedMonth);
  const hasPrev = idx < AVAILABLE_MONTHS.length - 1;
  const hasNext = idx > 0;

  const handleApplyStrategy = () => {
    setIsApplying(true);
    setIsConfigOpen(false); // Close the modal immediately so the user can see the loading state on the page entrance
    setTimeout(() => {
      setIsApplying(false);
      setSuccessToast('数据已更新');
      setTimeout(() => {
        setSuccessToast(null);
      }, 2500);
    }, 1500); // 1.5 seconds high-fidelity simulation time
  };

  return (
    <div className="relative flex flex-col h-full bg-[#f8fafc] text-gray-800 overflow-hidden">
      {/* 1. 顶部栏 (Title & Month Selection, Sticky Float) */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-100 flex flex-col shadow-xs">
        {/* Navigation row */}
        <div className="px-4 py-3.5 flex items-center justify-between">
          <button
            onClick={onBack}
            id="btn_back_to_features"
            className="flex items-center gap-1.5 text-gray-600 hover:text-emerald-600 transition-colors animate-none"
          >
            <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
            <span className="text-sm font-bold">返回</span>
          </button>
          <h1 className="text-base font-black text-gray-900 tracking-tight">策略运行报告</h1>
          <button
            onClick={() => !isApplying && setIsConfigOpen(true)}
            disabled={isApplying}
            id="btn_open_strategy_config"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all font-extrabold text-[10px] shadow-3xs ${
              isApplying
                ? 'text-indigo-600 bg-indigo-50/70 border border-indigo-150 animate-pulse cursor-not-allowed'
                : 'text-emerald-600 hover:text-emerald-700 bg-emerald-50 active:scale-95 cursor-pointer'
            }`}
          >
            {isApplying ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sliders className="w-3.5 h-3.5" />
            )}
            <span>{isApplying ? '正在模拟中...' : '配置策略'}</span>
          </button>
        </div>

        {/* Month Picker Row with Arrows */}
        <div className="px-4 py-2 bg-gray-50/70 border-t border-gray-50 flex items-center justify-between">
          <span className="text-xs text-gray-400 font-bold">分析统计周期</span>
          <div className="flex items-center gap-1 bg-white border border-gray-100 p-0.5 rounded-lg shadow-2xs">
            <button
              onClick={handlePrevMonth}
              disabled={!hasPrev}
              className={`p-1 rounded-md transition-colors ${
                hasPrev ? 'text-gray-600 hover:bg-gray-100' : 'text-gray-300 cursor-not-allowed'
              }`}
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
              className={`p-1 rounded-md transition-colors ${
                hasNext ? 'text-gray-600 hover:bg-gray-100' : 'text-gray-300 cursor-not-allowed'
              }`}
              title="下个月"
            >
              <ChevronRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content (Vertically Scrollable) */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-24">
        {loading ? (
          // Elegant, Polished Minimal Skeleton Loading Screen
          <div className="space-y-4 animate-pulse">
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white rounded-2xl h-16 border border-gray-100" />
              ))}
            </div>
            <div className="bg-white h-48 rounded-2xl border border-gray-100" />
            <div className="bg-white h-48 rounded-2xl border border-gray-100" />
            <div className="bg-white h-48 rounded-2xl border border-gray-100" />
          </div>
        ) : reportData ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >


            {/* 2. 精简版月度汇总 KPI */}
            <div className="space-y-2 bg-white p-3.5 rounded-2xl border border-slate-100 shadow-3xs">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-50">
                <span className="text-[10px] font-black text-slate-500 tracking-wider">月度汇总 KPI</span>
                <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-sm">
                  AI策略综合分析期
                </span>
              </div>
              
              {/* Redesigned 2x2 Merged Grid without secondary metrics */}
              <div className="grid grid-cols-2 gap-2.5">
                {/* Card 1: 本月总收益 */}
                <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-100 flex flex-col justify-center min-h-[60px]">
                  <span className="text-[9px] text-slate-400 font-extrabold tracking-wider block mb-1">本月收益</span>
                  <span className="text-lg font-black text-slate-800 font-mono tracking-tight leading-none">
                    ¥{reportData.summary.aiTotalRevenue.toLocaleString()}
                  </span>
                </div>

                {/* Card 2: AI提升收益 */}
                <div className="bg-emerald-50/55 p-3 rounded-xl border border-emerald-100/20 flex flex-col justify-center min-h-[60px]">
                  <span className="text-[9px] text-emerald-700 font-extrabold tracking-wider block mb-1">AI提升</span>
                  <span className="text-lg font-black text-emerald-600 font-mono tracking-tight leading-none">
                    ¥{reportData.summary.aiImprovementRevenue.toLocaleString()}
                  </span>
                </div>

                {pvCurtailmentView && (
                  <>
                    {/* Card 3: 自消纳率 */}
                    <div className="bg-amber-50/45 p-3 rounded-xl border border-amber-100/20 flex flex-col justify-center min-h-[60px]">
                      <span className="text-[9px] text-amber-700 font-extrabold tracking-wider block mb-1">自消纳率</span>
                      <div className="flex items-baseline gap-1.5 leading-none">
                        <span className="text-base font-black text-amber-500 font-mono tracking-tight">
                          {reportData.summary.solarAbsorptionRate}%
                        </span>
                      </div>
                    </div>

                    {/* Card 4: AI 运行时长 & 运行天数 (Merged) */}
                    <div className="bg-indigo-50/40 p-3 rounded-xl border border-indigo-100/20 flex flex-col justify-center min-h-[60px]">
                      <span className="text-[9px] text-indigo-700 font-extrabold tracking-wider block mb-1">AI 运行时长 / 运行天数</span>
                      <div className="flex items-baseline gap-1.5 leading-none">
                        <span className="text-base font-black text-indigo-600 font-mono tracking-tight">
                          {reportData.summary.dutyCycleHours}时
                        </span>
                        <span className="text-xs font-black text-slate-600 font-mono">
                          / {reportData.summary.aiRunningDays}天
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* 3. 图表1：收益对比 */}
            <RevenueComparisonChart report={reportData} />

            {/* 4. 图表2：光伏消纳率对比 */}
            <PvSelfConsumptionComparisonChart report={reportData} />

            {/* 5. 图表3：每日负电价限电止损组合图 */}
            {pvCurtailmentView && <CurtailmentStopLossChart report={reportData} />}

            {/* 6. 图表4：储能充放电对比 */}
            {pvCurtailmentView && <StorageComparisonChart report={reportData} />}

          </motion.div>
        ) : (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 p-6 space-y-2">
            <span className="text-2xl">📊</span>
            <h3 className="text-sm font-bold text-gray-800">该月暂无报告数据</h3>
            <p className="text-xs text-gray-400">请选择历史其他有统计数据的周期查看。</p>
          </div>
        )}
      </div>

      {/* ==================== STRATEGY CONFIGURATION DRAWER ==================== */}
      <AnimatePresence>
        {isConfigOpen && (
          <>
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isApplying && setIsConfigOpen(false)}
              className="absolute inset-0 bg-slate-950/60 z-30"
            />

            {/* Bottom Drawer */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="absolute bottom-0 left-0 right-0 bg-[#f8fafc] rounded-t-3xl shadow-2xl z-40 flex flex-col max-h-[92%] border-t border-slate-150 overflow-hidden"
            >
              {/* Header handle line */}
              <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto my-3 shrink-0" />
              
              {/* Title row */}
              <div className="px-5 pb-3 border-b border-slate-100 flex items-start justify-between bg-white shrink-0">
                <div className="flex items-start gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 mt-0.5 animate-pulse">
                    <Settings className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-black text-slate-800">策略模拟配置与下发</h3>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                      选择对比基准基础策略，并选择用于模拟的 AI 策略核心
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => !isApplying && setIsConfigOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable contents */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                
                {/* 1. Step 1 Card wrapper */}
                <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-3xs space-y-3.5">
                  {/* Step Title Header */}
                  <div className="flex items-start gap-2.5">
                    <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 font-mono font-black text-xs flex items-center justify-center shrink-0">
                      1
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-800">
                        1. 选择对比基准策略
                      </h4>
                      <p className="text-[9px] text-slate-400 font-bold">
                        选择作为计算收益提升基准的传统固定物理策略
                      </p>
                    </div>
                  </div>
                  {/* Template Selector dropdown */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold text-slate-500 block">
                      选择已创建的策略模板
                    </label>
                    <div className="relative flex items-center justify-between bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-[11px] text-slate-700 font-black">
                      <span>峰谷套利策略 (非AI-两充两放)</span>
                      <span className="text-slate-400 text-[8px]">▼</span>
                    </div>
                  </div>
                </div>

                {/* 2. Step 2 Card wrapper */}
                <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-3xs space-y-3">
                  {/* Step Title Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2.5">
                      <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 font-mono font-black text-xs flex items-center justify-center shrink-0">
                        2
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-800">
                          2. 基础策略时段配置详情
                        </h4>
                        <p className="text-[9px] text-slate-400 font-bold">
                          当前所选非 AI 策略的运行时间及充放参数详情
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Sub-plan 1 */}
                  <div className="bg-slate-50/40 p-3 rounded-xl border border-slate-100 space-y-2.5">
                    <div className="text-[10px] font-black text-slate-700">计划时段 1</div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] text-slate-400 font-bold shrink-0">适用时段</span>
                        <div className="flex-1 flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-[11px] font-mono font-black text-slate-800">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>02:00</span>
                          <span className="text-slate-300">~</span>
                          <span>06:00</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-1">
                          <span className="text-[9px] text-slate-400 font-bold block">充电预留</span>
                          <div className="flex items-center justify-between bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-[11px] font-mono font-black text-slate-700">
                            <span>98%</span>
                            <span className="text-[9px] text-indigo-500 bg-indigo-50 px-1 py-0.2 rounded-xs">⚡</span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] text-slate-400 font-bold block">放电预留</span>
                          <div className="flex items-center justify-between bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-[11px] font-mono font-black text-slate-700">
                            <span>2%</span>
                            <span className="text-[9px] text-slate-450 bg-slate-50 px-1 py-0.2 rounded-xs">🔋</span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] text-slate-400 font-bold block">可逆流阈值</span>
                          <div className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-[11px] font-mono font-black text-slate-700 text-center">
                            125 kW
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] text-slate-400 font-bold shrink-0">策略类型</span>
                        <div className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-[11px] font-bold text-slate-700">
                          峰谷套利
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sub-plan 2 */}
                  <div className="bg-slate-50/40 p-3 rounded-xl border border-slate-100 space-y-2.5">
                    <div className="text-[10px] font-black text-slate-700">计划时段 2</div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] text-slate-400 font-bold shrink-0">适用时段</span>
                        <div className="flex-1 flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-[11px] font-mono font-black text-slate-800">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>10:00</span>
                          <span className="text-slate-300">~</span>
                          <span>14:00</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-1">
                          <span className="text-[9px] text-slate-400 font-bold block">充电预留</span>
                          <div className="flex items-center justify-between bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-[11px] font-mono font-black text-slate-700">
                            <span>98%</span>
                            <span className="text-[9px] text-indigo-500 bg-indigo-50 px-1 py-0.2 rounded-xs">⚡</span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] text-slate-400 font-bold block">放电预留</span>
                          <div className="flex items-center justify-between bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-[11px] font-mono font-black text-slate-700">
                            <span>2%</span>
                            <span className="text-[9px] text-slate-450 bg-slate-50 px-1 py-0.2 rounded-xs">🔋</span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] text-slate-400 font-bold block">可逆流阈值</span>
                          <div className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-[11px] font-mono font-black text-slate-700 text-center">
                            125 kW
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] text-slate-400 font-bold shrink-0">策略类型</span>
                        <div className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-[11px] font-bold text-slate-700">
                          峰谷套利
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sub-plan 3 */}
                  <div className="bg-slate-50/40 p-3 rounded-xl border border-slate-100 space-y-2.5">
                    <div className="text-[10px] font-black text-slate-700">计划时段 3</div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] text-slate-400 font-bold shrink-0">适用时段</span>
                        <div className="flex-1 flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-[11px] font-mono font-black text-slate-800">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>15:00</span>
                          <span className="text-slate-300">~</span>
                          <span>22:00</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-1">
                          <span className="text-[9px] text-slate-400 font-bold block">充电预留</span>
                          <div className="flex items-center justify-between bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-[11px] font-mono font-black text-slate-700">
                            <span>2%</span>
                            <span className="text-[9px] text-indigo-500 bg-indigo-50 px-1 py-0.2 rounded-xs">⚡</span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] text-slate-400 font-bold block">放电预留</span>
                          <div className="flex items-center justify-between bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-[11px] font-mono font-black text-slate-700">
                            <span>98%</span>
                            <span className="text-[9px] text-slate-450 bg-slate-50 px-1 py-0.2 rounded-xs">🔋</span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] text-slate-400 font-bold block">可逆流阈值</span>
                          <div className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-[11px] font-mono font-black text-slate-700 text-center">
                            125 kW
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] text-slate-400 font-bold shrink-0">策略类型</span>
                        <div className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-[11px] font-bold text-slate-700">
                          峰谷套利
                        </div>
                      </div>
                    </div>
                  </div>

                </div>

              </div>

              {/* Sticky action row at the bottom */}
              <div className="p-3 border-t border-slate-150 bg-white flex flex-col gap-2.5 shrink-0">
                <div className="flex items-start gap-2 text-slate-400 text-[9px] px-2 leading-normal font-bold">
                  <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <p>算法模拟回测将完全参考本站历史真实负荷及充放参数。</p>
                </div>
                
                <div className="flex gap-2 w-full">
                  <button
                    onClick={() => !isApplying && setIsConfigOpen(false)}
                    disabled={isApplying}
                    className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-500 font-black text-xs hover:bg-slate-50 active:scale-98 transition-all cursor-pointer text-center"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleApplyStrategy}
                    disabled={isApplying}
                    className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1 active:scale-98 cursor-pointer"
                  >
                    {isApplying ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>正在计算...</span>
                      </>
                    ) : (
                      <span>保存并重新模拟 ↗</span>
                    )}
                  </button>
                </div>
              </div>

              {/* Inner Full Loading Glass Cover */}
              {isApplying && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center z-50">
                  <div className="w-12 h-12 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-2.5 text-indigo-600 animate-bounce">
                    <Cpu className="w-6 h-6 animate-spin-slow" />
                  </div>
                  <h4 className="text-[11px] font-black text-slate-800 animate-pulse">正在保存策略配置并重新进行算法回测...</h4>
                  <p className="text-[9px] text-slate-400 mt-1 max-w-[200px]">
                    正在通过多维度寻优重新拟合本周期收益数据，过程大约需要 1.2 秒
                  </p>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* successToast Notification */}
      <AnimatePresence>
        {successToast && (
          <motion.div
            initial={{ opacity: 0, y: 20, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 20, x: "-50%" }}
            transition={{ type: 'spring', damping: 11, stiffness: 180 }}
            className="absolute bottom-6 left-1/2 z-50 bg-slate-900/90 text-white text-[10px] font-bold px-3.5 py-2 rounded-full shadow-2xl flex items-center gap-1.5 border border-slate-800/50 backdrop-blur-md"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>{successToast}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
