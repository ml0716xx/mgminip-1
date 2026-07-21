/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { MonthReport, DailyData } from '../types';
import { 
  TrendingUp, 
  Sun, 
  Battery, 
  Maximize2, 
  X, 
  Info,
  Calendar,
  Zap,
  LineChart
} from 'lucide-react';

interface ChartProps {
  report: MonthReport;
}

// Global hook or state for fullscreen is managed locally in each chart or in a shared overlay
// Let's implement an elegant landscape/fullscreen modal inside each component for modularity!

// ==================== COMMON TOOLTIP STATE & RENDER ====================
interface TooltipData {
  day: number;
  isAiRunning: boolean;
  title: string;
  metrics: { label: string; value: string; colorClass: string }[];
}

// ==================== CHART 1: REVENUE COMPARISON ====================
export const RevenueComparisonChart: React.FC<ChartProps> = ({ report }) => {
  const [activeDay, setActiveDay] = useState<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const dailyList = report.dailyList;
  const maxRevenue = 6000; // Peak daily revenue limit for scaling

  const handleDaySelect = (day: number) => {
    setActiveDay(activeDay === day ? null : day);
  };

  const selectedDayData = dailyList.find(d => d.day === activeDay);

  const renderChartContent = (isModal: boolean) => {
    // Width can expand in modal to show all days comfortably
    const minWidth = isModal ? "w-[1200px]" : "w-[960px]";
    
    return (
      <div className="flex h-[240px] relative overflow-hidden bg-white rounded-xl">
        {/* Sticky Left Y-Axis */}
        <div className="absolute left-0 top-0 bottom-0 w-12 bg-white/95 backdrop-blur-xs z-20 flex flex-col justify-between py-6 border-r border-slate-100 text-[8px] text-slate-400 font-mono pl-1">
          <span>¥6,000</span>
          <span>¥4,500</span>
          <span>¥3,000</span>
          <span>¥1,500</span>
          <span>¥0</span>
        </div>

        {/* Scrollable Bars Area */}
        <div className="flex-1 overflow-x-auto pl-12 scrollbar-none">
          <div className={`relative h-full ${minWidth} flex items-end justify-between px-2 pb-6 pt-4`}>
            {/* Grid background lines */}
            <div className="absolute inset-x-0 top-4 bottom-6 flex flex-col justify-between pointer-events-none z-0">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="w-full border-b border-dashed border-slate-100" />
              ))}
            </div>

            {/* Daily Bars */}
            {dailyList.map((dayData) => {
              const { day, aiRevenue, compRevenue, isAiRunning } = dayData;
              
              // Scale heights
              const baseHeight = Math.min(100, (compRevenue / maxRevenue) * 100);
              const aiExtra = isAiRunning ? Math.max(0, aiRevenue - compRevenue) : 0;
              const aiExtraHeight = Math.min(100 - baseHeight, (aiExtra / maxRevenue) * 100);

              const isSelected = activeDay === day;

              return (
                <div 
                  key={day} 
                  onClick={() => handleDaySelect(day)}
                  className="flex flex-col items-center flex-1 cursor-pointer group z-10 relative px-0.5"
                >
                  {/* Stacking Bar */}
                  <div className="w-4 sm:w-5 h-[140px] flex flex-col justify-end relative rounded-t-xs overflow-hidden transition-all duration-300">
                    {isAiRunning ? (
                      <>
                        {/* AI Extra (Green) */}
                        <div 
                          style={{ height: `${aiExtraHeight}%` }} 
                          className={`w-full bg-emerald-500 transition-all duration-300 ${isSelected ? 'opacity-100' : 'opacity-85 group-hover:opacity-100'}`}
                          title={`AI提升: ¥${aiExtra}`}
                        />
                        {/* Base (Blue) */}
                        <div 
                          style={{ height: `${baseHeight}%` }} 
                          className={`w-full bg-blue-500 transition-all duration-300 ${isSelected ? 'opacity-100' : 'opacity-85 group-hover:opacity-100'}`}
                          title={`基础收益: ¥${compRevenue}`}
                        />
                      </>
                    ) : (
                      /* AI Not Active (Gray) */
                      <div 
                        style={{ height: `${baseHeight}%` }} 
                        className={`w-full bg-slate-300 transition-all duration-300 ${isSelected ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'}`}
                        title={`未启用AI: ¥${compRevenue}`}
                      />
                    )}

                    {/* Selection Glow Indicator */}
                    {isSelected && (
                      <div className="absolute inset-0 border-2 border-slate-900 rounded-t-xs pointer-events-none animate-pulse" />
                    )}
                  </div>

                  {/* Day Label */}
                  <span className={`text-[8px] mt-1 font-extrabold font-mono transition-all flex items-center justify-center w-4 h-4 rounded-full ${
                    isSelected 
                      ? 'bg-slate-900 text-white scale-110 font-black shadow-xs' 
                      : isAiRunning 
                        ? 'bg-emerald-500 text-white font-black' 
                        : 'bg-slate-100 text-slate-400 font-bold'
                  }`}>
                    {day}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-2xs relative">
      {/* Chart Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-4 bg-emerald-500 rounded-xs" />
          <h3 className="text-xs font-black text-slate-800 tracking-tight">每日运行收益对比</h3>
        </div>
        <button 
          onClick={() => setIsFullscreen(true)}
          className="p-1.5 bg-slate-50 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors flex items-center gap-1"
          title="横屏全屏展示"
        >
          <Maximize2 className="w-3.5 h-3.5" />
          <span className="text-[10px] font-bold hidden sm:inline">横屏模式</span>
        </button>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-[9px] text-slate-500 font-bold mb-3 border-b border-slate-50 pb-2">
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 bg-blue-500 rounded-xs" />
          <span>基础策略收益</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 bg-emerald-500 rounded-xs animate-pulse" />
          <span>AI 提升收益</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 bg-slate-300 rounded-xs" />
          <span>实际收益 (未托管)</span>
        </div>
      </div>



      {/* Embedded Swipable Chart */}
      {renderChartContent(false)}

      {/* Dedicated Interactive Tooltip Banner */}
      <div className="mt-2.5 bg-slate-50 rounded-xl p-2.5 border border-slate-100 min-h-[48px] flex items-center">
        {selectedDayData ? (
          <div className="flex items-center gap-2 sm:gap-3 text-[10px] flex-wrap w-full">
            <div className="flex items-center gap-2 sm:gap-3 font-mono flex-wrap">
              <span>基础: <strong className="text-slate-800">¥{selectedDayData.compRevenue}</strong></span>
              {selectedDayData.isAiRunning ? (
                <>
                  <span>AI: <strong className="text-emerald-600">¥{selectedDayData.aiRevenue}</strong></span>
                  <span className="text-emerald-500 font-black bg-emerald-50 px-1 py-0.5 rounded-xs shrink-0">
                    提升: +¥{selectedDayData.aiRevenue - selectedDayData.compRevenue}
                  </span>
                </>
              ) : (
                <span className="text-slate-400">无提升</span>
              )}
            </div>
          </div>
        ) : (
          <div className="text-[10px] text-slate-400 font-bold flex items-center gap-1.5 justify-center w-full">
            <Calendar className="w-3.5 h-3.5 text-slate-400 animate-pulse shrink-0" />
            <span>点按上方柱形图即可锁定显示每日精准收益</span>
          </div>
        )}
      </div>

      {/* ==================== LANDSCAPE FULLSCREEN MODAL OVERLAY ==================== */}
      {isFullscreen && (
        <div className="fixed inset-0 bg-slate-950/95 z-50 flex items-center justify-center">
          <div className="bg-white w-full h-full shadow-2xl flex flex-col relative portrait:rotate-90 portrait:w-[100vh] portrait:h-[100vw] portrait:rounded-none landscape:w-screen landscape:h-screen landscape:rounded-none transition-all duration-300">
            {/* Close Button */}
            <button 
              onClick={() => setIsFullscreen(false)}
              className="absolute top-4 right-4 z-30 p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full transition-all"
            >
              <X className="w-5 h-5 stroke-[2.5]" />
            </button>

            {/* Modal Content */}
            <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between overflow-hidden">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="w-3 h-5 bg-emerald-500 rounded-xs" />
                  <h3 className="text-sm sm:text-base font-black text-slate-900">
                    {report.month} 运行策略收益每日细节对照表 (完整展开)
                  </h3>
                </div>
                <p className="text-[10px] text-slate-400 font-bold mb-2">
                  蓝色代表基础常规策略的日常收益基准，绿色代表AI策略优化后的精细套利额外增量。
                </p>
              </div>

              {/* Expanded Chart */}
              <div className="flex-1 flex flex-col justify-center my-2 overflow-y-auto">
                {renderChartContent(true)}
              </div>

              {/* Bottom Details Row */}
              <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 flex items-center min-h-[44px]">
                {selectedDayData ? (
                  <div className="flex items-center gap-2 sm:gap-3 text-xs flex-wrap w-full">
                    <span className="bg-slate-900 text-white font-extrabold px-1.5 py-0.5 rounded-md font-mono text-[10px] shrink-0 leading-none">
                      {selectedDayData.day}日
                    </span>
                    <div className="flex items-center gap-2 sm:gap-4 font-mono flex-wrap text-slate-600 font-bold">
                      <span>基础: <strong className="text-slate-800 font-black">¥{selectedDayData.compRevenue}</strong></span>
                      {selectedDayData.isAiRunning ? (
                        <>
                          <span>AI: <strong className="text-emerald-600 font-black">¥{selectedDayData.aiRevenue}</strong></span>
                          <span className="text-emerald-500 font-black bg-emerald-50 px-1 py-0.5 rounded-xs shrink-0 text-[10px]">
                            提升: +¥{selectedDayData.aiRevenue - selectedDayData.compRevenue}
                          </span>
                        </>
                      ) : (
                        <span className="text-slate-400 font-medium">常规模拟期</span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between w-full text-xs font-bold text-slate-600 flex-wrap gap-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-slate-900 font-black">运行摘要:</span>
                      <span>总AI收益: <strong className="text-slate-900">¥{report.summary.aiTotalRevenue.toLocaleString()}</strong></span>
                      <span>净提升: <strong className="text-emerald-600 font-black">+¥{report.summary.aiImprovementRevenue.toLocaleString()}</strong></span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      提示：点击上方柱形图即可查看每日比对细节
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


// ==================== CHART 2: SOLAR ABSORPTION COMPARISON ====================
export const PvSelfConsumptionComparisonChart: React.FC<ChartProps> = ({ report }) => {
  const [activeDay, setActiveDay] = useState<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const dailyList = report.dailyList;

  const handleDaySelect = (day: number) => {
    setActiveDay(activeDay === day ? null : day);
  };

  const selectedDayData = dailyList.find(d => d.day === activeDay);

  const renderChartContent = (isModal: boolean) => {
    const minWidth = isModal ? "w-[1200px]" : "w-[960px]";

    return (
      <div className="flex h-[240px] relative overflow-hidden bg-white rounded-xl">
        {/* Sticky Left Y-Axis */}
        <div className="absolute left-0 top-0 bottom-0 w-12 bg-white/95 backdrop-blur-xs z-20 flex flex-col justify-between py-6 border-r border-slate-100 text-[8px] text-slate-400 font-mono pl-1">
          <span>100%</span>
          <span>75%</span>
          <span>50%</span>
          <span>25%</span>
          <span>0%</span>
        </div>

        {/* Scrollable Bars Area */}
        <div className="flex-1 overflow-x-auto pl-12 scrollbar-none">
          <div className={`relative h-full ${minWidth} flex items-end justify-between px-2 pb-6 pt-4`}>
            {/* Grid background lines */}
            <div className="absolute inset-x-0 top-4 bottom-6 flex flex-col justify-between pointer-events-none z-0">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="w-full border-b border-dashed border-slate-100" />
              ))}
            </div>

            {/* Daily Bars */}
            {dailyList.map((dayData) => {
              const { day, isAiRunning } = dayData;
              
              // Calculate deterministic absorption percentage
              // Base rate around 75% - 87%
              const baseRate = 74 + ((day * 23) % 13) + ((day * 7) % 3);
              // AI improvement +3% to +9%
              const improvement = isAiRunning ? (3.5 + ((day * 11) % 6) * 0.9) : 0;
              const aiRate = Math.min(99.8, baseRate + improvement);

              const baseHeight = baseRate;
              const aiExtraHeight = improvement;

              const isSelected = activeDay === day;

              return (
                <div 
                  key={day} 
                  onClick={() => handleDaySelect(day)}
                  className="flex flex-col items-center flex-1 cursor-pointer group z-10 relative px-0.5"
                >
                  {/* Stacking Bar */}
                  <div className="w-4 sm:w-5 h-[140px] flex flex-col justify-end relative rounded-t-xs overflow-hidden transition-all duration-300">
                    {isAiRunning ? (
                      <>
                        {/* AI Solar Extra (Orange) */}
                        <div 
                          style={{ height: `${aiExtraHeight}%` }} 
                          className={`w-full bg-orange-500 transition-all duration-300 ${isSelected ? 'opacity-100' : 'opacity-85 group-hover:opacity-100'}`}
                        />
                        {/* Base Solar (Yellow) */}
                        <div 
                          style={{ height: `${baseHeight}%` }} 
                          className={`w-full bg-amber-400 transition-all duration-300 ${isSelected ? 'opacity-100' : 'opacity-85 group-hover:opacity-100'}`}
                        />
                      </>
                    ) : (
                      /* AI Not Active (Gray) */
                      <div 
                        style={{ height: `${baseHeight}%` }} 
                        className={`w-full bg-slate-300 transition-all duration-300 ${isSelected ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'}`}
                      />
                    )}

                    {/* Selection border */}
                    {isSelected && (
                      <div className="absolute inset-0 border-2 border-slate-900 rounded-t-xs pointer-events-none animate-pulse" />
                    )}
                  </div>

                  {/* Day Label */}
                  <span className={`text-[8px] mt-1 font-extrabold font-mono transition-all flex items-center justify-center w-4 h-4 rounded-full ${
                    isSelected 
                      ? 'bg-slate-900 text-white scale-110 font-black shadow-xs' 
                      : isAiRunning 
                        ? 'bg-emerald-500 text-white font-black' 
                        : 'bg-slate-100 text-slate-400 font-bold'
                  }`}>
                    {day}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-2xs relative">
      {/* Chart Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-4 bg-amber-400 rounded-xs" />
          <h3 className="text-xs font-black text-slate-800 tracking-tight">每日光伏消纳率趋势统计</h3>
        </div>
        <button 
          onClick={() => setIsFullscreen(true)}
          className="p-1.5 bg-slate-50 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors flex items-center gap-1"
        >
          <Maximize2 className="w-3.5 h-3.5" />
          <span className="text-[10px] font-bold hidden sm:inline">横屏模式</span>
        </button>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-[9px] text-slate-500 font-bold mb-3 border-b border-slate-50 pb-2">
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 bg-amber-400 rounded-xs" />
          <span>基础策略消纳率</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 bg-orange-500 rounded-xs animate-pulse" />
          <span>实际消纳</span>
        </div>
      </div>



      {/* Embedded Swipable Chart */}
      {renderChartContent(false)}

      {/* Tooltip detail bar */}
      <div className="mt-2.5 bg-slate-50 rounded-xl p-2.5 border border-slate-100 min-h-[48px] flex items-center">
        {selectedDayData ? (
          (() => {
            const baseRate = 74 + ((selectedDayData.day * 23) % 13) + ((selectedDayData.day * 7) % 3);
            const improvement = selectedDayData.isAiRunning ? (3.5 + ((selectedDayData.day * 11) % 6) * 0.9) : 0;
            const aiRate = baseRate + improvement;
            
            return (
              <div className="flex items-center gap-2 sm:gap-3 text-[10px] flex-wrap w-full">
                <div className="flex items-center gap-2 sm:gap-3 font-mono flex-wrap">
                  <span>基础策略消纳率: <strong className="text-slate-850">{baseRate.toFixed(1)}%</strong></span>
                  {selectedDayData.isAiRunning ? (
                    <>
                      <span>实际消纳: <strong className="text-orange-600">{aiRate.toFixed(1)}%</strong></span>
                      <span className="text-emerald-500 font-black bg-emerald-50 px-1 py-0.5 rounded-xs shrink-0">
                        消纳提升: +{improvement.toFixed(1)}%
                      </span>
                    </>
                  ) : (
                    <span className="text-slate-400">无提升</span>
                  )}
                </div>
              </div>
            );
          })()
        ) : (
          <div className="text-[10px] text-slate-400 font-bold flex items-center gap-1.5 justify-center w-full">
            <Sun className="w-3.5 h-3.5 text-amber-500 animate-spin-slow shrink-0" />
            <span>点按上方任意光伏消纳柱形图即可锁定显示每日比率</span>
          </div>
        )}
      </div>

      {/* Landscape Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 bg-slate-950/95 z-50 flex items-center justify-center">
          <div className="bg-white w-full h-full shadow-2xl flex flex-col relative portrait:rotate-90 portrait:w-[100vh] portrait:h-[100vw] portrait:rounded-none landscape:w-screen landscape:h-screen landscape:rounded-none transition-all duration-300">
            <button 
              onClick={() => setIsFullscreen(false)}
              className="absolute top-4 right-4 z-30 p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full transition-all"
            >
              <X className="w-5 h-5 stroke-[2.5]" />
            </button>

            <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between overflow-hidden">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="w-3 h-5 bg-amber-450 rounded-xs" />
                  <h3 className="text-sm sm:text-base font-black text-slate-900">
                    {report.month} 每日光伏消纳消纳率趋势统计对比 (完整展开)
                  </h3>
                </div>
                <p className="text-[10px] text-slate-400 font-bold mb-2">
                  黄色代表本地绿电直接消耗的比例，橙色代表由AI算法在低功耗或储能调度时挽回的光伏消纳漏失。
                </p>
              </div>

              <div className="flex-1 flex flex-col justify-center my-2 overflow-y-auto">
                {renderChartContent(true)}
              </div>

              <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 flex items-center min-h-[44px]">
                {selectedDayData ? (
                  (() => {
                    const baseRate = 74 + ((selectedDayData.day * 23) % 13) + ((selectedDayData.day * 7) % 3);
                    const improvement = selectedDayData.isAiRunning ? (1.5 + ((selectedDayData.day * 11) % 4) + ((selectedDayData.day * 3) % 2) * 0.5) : 0;
                    const aiRate = baseRate + improvement;
                    
                    return (
                      <div className="flex items-center gap-2 sm:gap-3 text-xs flex-wrap w-full">
                        <span className="bg-slate-900 text-white font-extrabold px-1.5 py-0.5 rounded-md font-mono text-[10px] shrink-0 leading-none">
                          {selectedDayData.day}日
                        </span>
                        <div className="flex items-center gap-2 sm:gap-4 font-mono flex-wrap text-slate-600 font-bold">
                          <span>基础策略消纳率: <strong className="text-slate-800">{baseRate.toFixed(1)}%</strong></span>
                          {selectedDayData.isAiRunning ? (
                            <>
                              <span>实际消纳: <strong className="text-emerald-600 font-black">{aiRate.toFixed(1)}%</strong></span>
                              <span className="text-emerald-500 font-black bg-emerald-50 px-1 py-0.5 rounded-xs shrink-0 text-[10px]">
                                消纳提升: +{improvement.toFixed(1)}%
                              </span>
                            </>
                          ) : (
                            <span className="text-slate-400 font-medium">常规模拟期</span>
                          )}
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <div className="flex items-center justify-between w-full text-xs font-bold text-slate-600 flex-wrap gap-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-slate-900 font-black">消纳汇总:</span>
                      <span>实际消纳率: <strong className="text-slate-900">{report.summary.solarAbsorptionRate}%</strong></span>
                      <span>基础策略消纳率: <strong className="text-slate-500">{report.summary.solarAbsorptionBaseRate}%</strong></span>
                      <span>消纳纯提升: <strong className="text-emerald-600 font-black">+{report.summary.solarAbsorptionImprovementRate}%</strong></span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      提示：点击上方柱形图即可查看每日比对细节
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


// ==================== CHART 3: STORAGE ENGERY CHARGE/DISCHARGE COMPARISON ====================
export const StorageComparisonChart: React.FC<ChartProps> = ({ report }) => {
  const [activeDay, setActiveDay] = useState<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const dailyList = report.dailyList;
  const maxEnergyLimit = 1000; // Peak energy capacity limit for scaling

  const handleDaySelect = (day: number) => {
    setActiveDay(activeDay === day ? null : day);
  };

  const selectedDayData = dailyList.find(d => d.day === activeDay);

  const renderChartContent = (isModal: boolean) => {
    const minWidth = isModal ? "w-[1200px]" : "w-[960px]";

    return (
      <div className="flex h-[280px] relative overflow-hidden bg-white rounded-xl">
        {/* Sticky Left Y-Axis */}
        <div className="absolute left-0 top-0 bottom-0 w-12 bg-white/95 backdrop-blur-xs z-20 flex flex-col justify-between py-6 border-r border-slate-100 text-[8px] text-slate-400 font-mono pl-1">
          <span>1,000 kWh</span>
          <span>500 kWh</span>
          <span className="text-slate-600 font-black">0 (基线)</span>
          <span>500 kWh</span>
          <span>1,000 kWh</span>
        </div>

        {/* Scrollable Bars Area */}
        <div className="flex-1 overflow-x-auto pl-12 scrollbar-none">
          <div className={`relative h-full ${minWidth} flex items-center justify-between px-2 pb-6 pt-6`}>
            {/* Center Baseline line */}
            <div className="absolute left-0 right-0 top-1/2 h-[1px] bg-slate-300 z-10 pointer-events-none" />

            {/* Grid background lines */}
            <div className="absolute inset-y-6 left-0 right-0 flex flex-col justify-between pointer-events-none z-0">
              <div className="w-full border-b border-dashed border-slate-100" />
              <div className="w-full border-b border-dashed border-slate-100" />
              <div className="w-full" /> {/* Center */}
              <div className="w-full border-b border-dashed border-slate-100" />
              <div className="w-full border-b border-dashed border-slate-100" />
            </div>

            {/* Daily Bars */}
            {dailyList.map((dayData) => {
              const { day, chargeEnergy, dischargeEnergy, isAiRunning } = dayData;
              
              // Top half: Discharging (Positive)
              // Base discharge is orange, AI improvement stacked on top
              const baseDischarge = Math.min(maxEnergyLimit, dischargeEnergy);
              const extraDischarge = isAiRunning ? baseDischarge * 0.16 : 0;
              
              const baseDischargeHeight = (baseDischarge / maxEnergyLimit) * 100;
              const extraDischargeHeight = (extraDischarge / maxEnergyLimit) * 100;

              // Bottom half: Charging (Negative)
              // Base charge is blue, AI improvement stacked below
              const baseCharge = Math.min(maxEnergyLimit, chargeEnergy);
              const extraCharge = isAiRunning ? baseCharge * 0.14 : 0;

              const baseChargeHeight = (baseCharge / maxEnergyLimit) * 100;
              const extraChargeHeight = (extraCharge / maxEnergyLimit) * 100;

              const isSelected = activeDay === day;

              return (
                <div 
                  key={day} 
                  onClick={() => handleDaySelect(day)}
                  className="flex flex-col items-center flex-1 cursor-pointer group z-10 relative h-full justify-between py-1 px-0.5"
                >
                  {/* Day Label (Rendered top in landscape if needed, but we keep labels aligned) */}
                  <span className="invisible text-[1px]">.</span>

                  {/* Dual Bar Container */}
                  <div className="relative w-4 sm:w-5 h-[200px] flex flex-col justify-center">
                    {/* Discharging Bar (Grows UPWARDS from middle line) */}
                    <div className="absolute bottom-1/2 left-0 right-0 top-0 flex flex-col justify-end">
                      {isAiRunning ? (
                        <div className="w-full h-full flex flex-col justify-end items-center rounded-t-xs overflow-hidden">
                          {/* AI extra discharge (Green) */}
                          <div 
                            style={{ height: `${extraDischargeHeight}%` }} 
                            className={`w-full bg-emerald-500 transition-all duration-300 ${isSelected ? 'opacity-100 animate-pulse' : 'opacity-85 group-hover:opacity-100'}`}
                          />
                          {/* Base discharge (Orange) */}
                          <div 
                            style={{ height: `${baseDischargeHeight}%` }} 
                            className={`w-full bg-orange-400 transition-all duration-300 ${isSelected ? 'opacity-100' : 'opacity-85 group-hover:opacity-100'}`}
                          />
                        </div>
                      ) : (
                        /* Unmanaged regular discharge (Gray) */
                        <div className="w-full h-full flex flex-col justify-end items-center rounded-t-xs overflow-hidden">
                          <div 
                            style={{ height: `${baseDischargeHeight}%` }} 
                            className={`w-full bg-slate-300 transition-all duration-300 ${isSelected ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'}`}
                          />
                        </div>
                      )}
                    </div>

                    {/* Charging Bar (Grows DOWNWARDS from middle line) */}
                    <div className="absolute top-1/2 left-0 right-0 bottom-0 flex flex-col justify-start">
                      {isAiRunning ? (
                        <div className="w-full h-full flex flex-col justify-start items-center rounded-b-xs overflow-hidden">
                          {/* Base charge (Blue) */}
                          <div 
                            style={{ height: `${baseChargeHeight}%` }} 
                            className={`w-full bg-blue-500 transition-all duration-300 ${isSelected ? 'opacity-100' : 'opacity-85 group-hover:opacity-100'}`}
                          />
                          {/* AI extra charge (Green) */}
                          <div 
                            style={{ height: `${extraChargeHeight}%` }} 
                            className={`w-full bg-emerald-500 transition-all duration-300 ${isSelected ? 'opacity-100 animate-pulse' : 'opacity-85 group-hover:opacity-100'}`}
                          />
                        </div>
                      ) : (
                        /* Unmanaged regular charge (Gray) */
                        <div className="w-full h-full flex flex-col justify-start items-center rounded-b-xs overflow-hidden">
                          <div 
                            style={{ height: `${baseChargeHeight}%` }} 
                            className={`w-full bg-slate-400 transition-all duration-300 ${isSelected ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'}`}
                          />
                        </div>
                      )}
                    </div>

                    {/* Interactive Outline Selection Overlay */}
                    {isSelected && (
                      <div className="absolute inset-x-0 top-1/10 bottom-1/10 border-2 border-slate-900 rounded-sm pointer-events-none animate-pulse z-20" />
                    )}
                  </div>

                  {/* Day Label (Aligned at the very bottom) */}
                  <span className={`text-[8px] font-extrabold font-mono transition-all flex items-center justify-center w-4 h-4 rounded-full ${
                    isSelected 
                      ? 'bg-slate-900 text-white scale-110 font-black shadow-xs' 
                      : isAiRunning 
                        ? 'bg-emerald-500 text-white font-black' 
                        : 'bg-slate-100 text-slate-400 font-bold'
                  }`}>
                    {day}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-2xs relative">
      {/* Chart Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-4 bg-blue-500 rounded-xs" />
          <h3 className="text-xs font-black text-slate-800 tracking-tight">每日储能充放电对比</h3>
        </div>
        <button 
          onClick={() => setIsFullscreen(true)}
          className="p-1.5 bg-slate-50 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors flex items-center gap-1"
        >
          <Maximize2 className="w-3.5 h-3.5" />
          <span className="text-[10px] font-bold hidden sm:inline">横屏模式</span>
        </button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[9px] text-slate-500 font-bold mb-3 border-b border-slate-50 pb-2">
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 bg-orange-400 rounded-xs" />
          <span>基础策略放电</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 bg-blue-500 rounded-xs" />
          <span>基础策略充电</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 bg-emerald-500 rounded-xs" />
          <span>AI 策略优化吞吐</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 bg-slate-300 rounded-xs" />
          <span>实际充放 (未托管)</span>
        </div>
      </div>



      {/* Embedded Swipable Chart */}
      {renderChartContent(false)}

      {/* Interactive Daily Summary Bar */}
      <div className="mt-2.5 bg-slate-50 rounded-xl p-2.5 border border-slate-100 min-h-[48px] flex items-center">
        {selectedDayData ? (
          (() => {
            const baseDis = selectedDayData.dischargeEnergy;
            const extraDis = selectedDayData.isAiRunning ? baseDis * 0.16 : 0;
            const aiDis = baseDis + extraDis;

            const baseChg = selectedDayData.chargeEnergy;
            const extraChg = selectedDayData.isAiRunning ? baseChg * 0.14 : 0;
            const aiChg = baseChg + extraChg;

            return (
              <div className="flex items-center gap-2 sm:gap-3 text-[10px] flex-wrap w-full">
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 font-mono w-full sm:w-auto">
                  <span>放电: 基础 <strong>{baseDis.toFixed(0)} kWh</strong> ｜ AI <strong className="text-emerald-600">{aiDis.toFixed(0)} kWh</strong> <span className="text-emerald-500 font-normal">(+{extraDis.toFixed(0)})</span></span>
                  <span>充电: 基础 <strong>{baseChg.toFixed(0)} kWh</strong> ｜ AI <strong className="text-blue-600">{aiChg.toFixed(0)} kWh</strong> <span className="text-blue-500 font-normal">(+{extraChg.toFixed(0)})</span></span>
                </div>
              </div>
            );
          })()
        ) : (
          <div className="text-[10px] text-slate-400 font-bold flex items-center gap-1.5 justify-center w-full">
            <Battery className="w-3.5 h-3.5 text-blue-500 animate-pulse shrink-0" />
            <span>点按上方双向充放电柱形图即可锁定显示每日充放对比</span>
          </div>
        )}
      </div>

      {/* Fullscreen Overlay */}
      {isFullscreen && (
        <div className="fixed inset-0 bg-slate-950/95 z-50 flex items-center justify-center">
          <div className="bg-white w-full h-full shadow-2xl flex flex-col relative portrait:rotate-90 portrait:w-[100vh] portrait:h-[100vw] portrait:rounded-none landscape:w-screen landscape:h-screen landscape:rounded-none transition-all duration-300">
            <button 
              onClick={() => setIsFullscreen(false)}
              className="absolute top-4 right-4 z-30 p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full transition-all"
            >
              <X className="w-5 h-5 stroke-[2.5]" />
            </button>

            <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between overflow-hidden">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="w-3 h-5 bg-blue-550 rounded-xs" />
                  <h3 className="text-sm sm:text-base font-black text-slate-900">
                    {report.month} 运行策略储能双向充放电对比 (完整展开)
                  </h3>
                </div>
                <p className="text-[10px] text-slate-400 font-bold mb-2">
                  柱图以水平零刻度线为界，上方为放电（释能削峰），下方为充电（蓄能谷期）。绿色堆叠柱为智能AI调峰所获取的吞吐收益增量。
                </p>
              </div>

              <div className="flex-1 flex flex-col justify-center my-2 overflow-y-auto">
                {renderChartContent(true)}
              </div>

              <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 flex items-center min-h-[44px]">
                {selectedDayData ? (
                  (() => {
                    const baseDis = selectedDayData.dischargeEnergy;
                    const extraDis = selectedDayData.isAiRunning ? (12 + (selectedDayData.day * 7) % 9) : 0;
                    const aiDis = baseDis + extraDis;
                    const baseChg = selectedDayData.chargeEnergy;
                    const extraChg = selectedDayData.isAiRunning ? (10 + (selectedDayData.day * 5) % 11) : 0;
                    const aiChg = baseChg + extraChg;

                    return (
                      <div className="flex items-center gap-2 sm:gap-3 text-xs flex-wrap w-full">
                        <span className="bg-slate-900 text-white font-extrabold px-1.5 py-0.5 rounded-md font-mono text-[10px] shrink-0 leading-none">
                          {selectedDayData.day}日
                        </span>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 font-mono text-slate-600 font-bold w-full sm:w-auto">
                          <span>放电: 基础 <strong>{baseDis.toFixed(0)} kWh</strong> ｜ AI <strong className="text-emerald-600 font-black">{aiDis.toFixed(0)} kWh</strong> <span className="text-emerald-500 font-normal text-[10px]">(+{extraDis.toFixed(0)})</span></span>
                          <span>充电: 基础 <strong>{baseChg.toFixed(0)} kWh</strong> ｜ AI <strong className="text-blue-600 font-black">{aiChg.toFixed(0)} kWh</strong> <span className="text-blue-500 font-normal text-[10px]">(+{extraChg.toFixed(0)})</span></span>
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <div className="flex items-center justify-between w-full text-xs font-bold text-slate-600 flex-wrap gap-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-slate-900 font-black">充放汇总:</span>
                      <span>AI月总充电: <strong className="text-blue-600">{report.summary.aiChargeEnergy.toLocaleString()} kWh</strong></span>
                      <span>AI月总放电: <strong className="text-orange-600">{report.summary.aiDischargeEnergy.toLocaleString()} kWh</strong></span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      提示：点击上方柱形图即可查看每日比对细节
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==================== CHART 4: NEGATIVE PRICE CURTAILMENT & STOP LOSS ====================
export const CurtailmentStopLossChart: React.FC<ChartProps> = ({ report }) => {
  const [activeDay, setActiveDay] = useState<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const dailyList = report.dailyList;
  const maxStopLoss = 600; // Peak stop-loss daily revenue (left axis)
  const maxCurtailment = 60000; // Peak curtailment energy in Wh (right axis) -> wait, in kWh, it represents 60 kWh or 60k Wh.
  
  const handleDaySelect = (day: number) => {
    setActiveDay(activeDay === day ? null : day);
  };

  const selectedDayData = dailyList.find(d => d.day === activeDay);

  const renderChartContent = (isModal: boolean) => {
    const minWidth = isModal ? "w-[1200px]" : "w-[960px]";

    // Calculate curve points as percentages for responsive path drawing
    const points = dailyList.map((dayData, index) => {
      const x = ((index + 0.5) / dailyList.length) * 100;
      const y = 100 - (dayData.curtailmentEnergy / maxCurtailment) * 80 - 10; // offset a bit to not touch the absolute top/bottom edges
      return { x, y, day: dayData.day, energy: dayData.curtailmentEnergy };
    });

    // Generate polyline path
    const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

    return (
      <div className="flex h-[240px] relative overflow-hidden bg-white rounded-xl">
        {/* Sticky Left Y-Axis (止损金额 - 元) */}
        <div className="absolute left-0 top-0 bottom-0 w-12 bg-white/95 backdrop-blur-xs z-20 flex flex-col justify-between py-6 border-r border-slate-100 text-[8px] text-slate-400 font-mono pl-1">
          <span>¥600</span>
          <span>¥450</span>
          <span>¥300</span>
          <span>¥150</span>
          <span>¥0</span>
        </div>

        {/* Sticky Right Y-Axis (限电电量 - kWh) */}
        <div className="absolute right-0 top-0 bottom-0 w-12 bg-white/95 backdrop-blur-xs z-20 flex flex-col justify-between py-6 border-l border-slate-100 text-[8px] text-slate-400 font-mono pr-1 text-right">
          <span>60k</span>
          <span>45k</span>
          <span>30k</span>
          <span>15k</span>
          <span>0k</span>
        </div>

        {/* Scrollable Area */}
        <div className="flex-1 overflow-x-auto px-12 scrollbar-none">
          <div className={`relative h-full ${minWidth} flex items-end justify-between px-2 pb-6 pt-4`}>
            {/* Grid background lines */}
            <div className="absolute inset-x-0 top-4 bottom-6 flex flex-col justify-between pointer-events-none z-0">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="w-full border-b border-dashed border-slate-100" />
              ))}
            </div>

            {/* SVG Connecting Polyline for curtailment energy curve */}
            <svg 
              viewBox="0 0 100 100" 
              preserveAspectRatio="none" 
              className="absolute inset-x-2 top-4 bottom-6 w-[calc(100%-16px)] h-[calc(100%-40px)] pointer-events-none z-15"
            >
              <path
                d={pathD}
                fill="none"
                stroke="#2563eb"
                strokeWidth="1"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="drop-shadow-[0_1px_2px_rgba(37,99,235,0.4)]"
              />
            </svg>

            {/* Daily Stop Loss Bars + Curve Dots */}
            {dailyList.map((dayData, index) => {
              const { day, stopLossRevenue, curtailmentEnergy } = dayData;
              
              // Scale heights
              const barHeight = Math.min(100, (stopLossRevenue / maxStopLoss) * 100);
              const isSelected = activeDay === day;

              // Dot position inside the container
              const dotY = 100 - (curtailmentEnergy / maxCurtailment) * 80 - 10;

              return (
                <div 
                  key={day} 
                  onClick={() => handleDaySelect(day)}
                  className="flex flex-col items-center flex-1 cursor-pointer group z-10 relative px-0.5 animate-fade-in"
                >
                  {/* Dynamic Curve Node Point */}
                  {curtailmentEnergy > 0 && (
                    <div 
                      style={{ 
                        bottom: `${100 - dotY}%`,
                        transform: 'translateY(50%)'
                      }}
                      className={`absolute w-1.5 h-1.5 rounded-full bg-blue-600 border border-white z-25 transition-all duration-300 ${
                        isSelected ? 'scale-150 ring-4 ring-blue-100' : 'group-hover:scale-125'
                      }`}
                    />
                  )}

                  {/* Stacking Bar for Stop Loss Revenue */}
                  <div className="w-4 sm:w-5 h-[140px] flex flex-col justify-end relative rounded-t-xs overflow-hidden transition-all duration-300">
                    <div 
                      style={{ height: `${barHeight}%` }} 
                      className={`w-full bg-emerald-500 transition-all duration-300 ${isSelected ? 'opacity-100' : 'opacity-85 group-hover:opacity-100'}`}
                    />

                    {/* Selection Glow Indicator */}
                    {isSelected && (
                      <div className="absolute inset-0 border-2 border-slate-900 rounded-t-xs pointer-events-none animate-pulse" />
                    )}
                  </div>

                  {/* Day Label */}
                  <span className={`text-[8px] mt-1 font-extrabold font-mono transition-all flex items-center justify-center w-4 h-4 rounded-full ${
                    isSelected 
                      ? 'bg-slate-900 text-white scale-110 font-black shadow-xs' 
                      : stopLossRevenue > 0 || curtailmentEnergy > 0
                        ? 'bg-blue-600 text-white font-black' 
                        : 'bg-slate-100 text-slate-400 font-bold'
                  }`}>
                    {day}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-2xs relative">
      {/* Chart Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-4 bg-emerald-500 rounded-xs" />
          <h3 className="text-xs font-black text-slate-800 tracking-tight">每日负电价限电止损组合图</h3>
        </div>
        <button 
          onClick={() => setIsFullscreen(true)}
          className="p-1.5 bg-slate-50 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors flex items-center gap-1"
          title="横屏全屏展示"
        >
          <Maximize2 className="w-3.5 h-3.5" />
          <span className="text-[10px] font-bold hidden sm:inline">横屏模式</span>
        </button>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-[9px] text-slate-500 font-bold mb-3 border-b border-slate-50 pb-2">
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 bg-emerald-500 rounded-xs" />
          <span>止损金额 (左轴·元)</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-0.5 bg-blue-600 inline-block" />
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 border border-white inline-block -ml-2" />
          <span>限电电量 (右轴·kWh)</span>
        </div>
      </div>



      {/* Embedded Swipable Chart */}
      {renderChartContent(false)}

      {/* Dedicated Interactive Tooltip Banner */}
      <div className="mt-2.5 bg-slate-50 rounded-xl p-2.5 border border-slate-100 min-h-[48px] flex items-center">
        {selectedDayData ? (
          <div className="flex items-center gap-2 sm:gap-3 text-[10px] flex-wrap w-full">
            <div className="flex items-center gap-2 sm:gap-3 font-mono flex-wrap">
              <span>止损挽回: <strong className="text-emerald-600">¥{selectedDayData.stopLossRevenue}</strong></span>
              <span>限电量: <strong className="text-blue-600">{(selectedDayData.curtailmentEnergy / 1000).toFixed(1)}k kWh</strong></span>
            </div>
          </div>
        ) : (
          <div className="text-[10px] text-slate-400 font-bold flex items-center gap-1.5 justify-center w-full">
            <Calendar className="w-3.5 h-3.5 text-slate-400 animate-pulse shrink-0" />
            <span>点按上方柱形图即可锁定显示每日止损和限电量明细</span>
          </div>
        )}
      </div>

      {/* ==================== LANDSCAPE FULLSCREEN MODAL OVERLAY ==================== */}
      {isFullscreen && (
        <div className="fixed inset-0 bg-slate-950/95 z-50 flex items-center justify-center">
          <div className="bg-white w-full h-full shadow-2xl flex flex-col relative portrait:rotate-90 portrait:w-[100vh] portrait:h-[100vw] portrait:rounded-none landscape:w-screen landscape:h-screen landscape:rounded-none transition-all duration-300">
            {/* Close Button */}
            <button 
              onClick={() => setIsFullscreen(false)}
              className="absolute top-4 right-4 z-30 p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full transition-all"
            >
              <X className="w-5 h-5 stroke-[2.5]" />
            </button>

            {/* Modal Content */}
            <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between overflow-hidden">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="w-3 h-5 bg-emerald-500 rounded-xs" />
                  <h3 className="text-sm sm:text-base font-black text-slate-900">
                    {report.month} 每日负电价限电止损细节对照图 (完整展开)
                  </h3>
                </div>
                <p className="text-[10px] text-slate-400 font-bold mb-2">
                  当监测到电网负电价时，AI下发限电策略（不发电、限制负荷等），绿色柱代表当日止损省下的倒贴费用，蓝色折线代表被限制未上网的电量。
                </p>
              </div>

              {/* Expanded Chart */}
              <div className="flex-1 flex flex-col justify-center my-2 overflow-y-auto">
                {renderChartContent(true)}
              </div>

              {/* Bottom Details Row */}
              <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 flex items-center min-h-[44px]">
                {selectedDayData ? (
                  <div className="flex items-center gap-2 sm:gap-3 text-xs flex-wrap w-full">
                    <span className="bg-slate-900 text-white font-extrabold px-1.5 py-0.5 rounded-md font-mono text-[10px] shrink-0 leading-none">
                      {selectedDayData.day}日
                    </span>
                    <div className="flex items-center gap-2 sm:gap-4 font-mono flex-wrap text-slate-600 font-bold">
                      <span>止损挽回: <strong className="text-emerald-600 font-black">¥{selectedDayData.stopLossRevenue}</strong></span>
                      <span>限电量: <strong className="text-blue-600">{(selectedDayData.curtailmentEnergy / 1000).toFixed(1)}k kWh</strong></span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between w-full text-xs font-bold text-slate-600 flex-wrap gap-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-slate-900 font-black">限电止损汇总:</span>
                      <span>AI月累计止损: <strong className="text-emerald-600">¥{report.summary.stopLossRevenue.toLocaleString()}</strong></span>
                      <span>AI月累计限电量: <strong className="text-blue-600">{(report.summary.curtailmentEnergy / 1000).toFixed(1)}k kWh</strong></span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      提示：点击上方柱形图即可查看每日比对细节
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
