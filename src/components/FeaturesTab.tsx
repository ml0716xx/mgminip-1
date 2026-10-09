/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  BellRing,
  AlertTriangle,
  FolderLock,
  FileCheck,
  CalendarDays,
  FilePieChart,
  GitFork,
  ArrowRight,
  Shield,
  CirclePlay,
  HeartPulse,
  BrainCircuit,
  Sparkles,
} from 'lucide-react';
import { motion } from 'motion/react';

interface FeaturesTabProps {
  onSelectFeature: (featureId: string) => void;
  stationName: string;
}

export const FeaturesTab: React.FC<FeaturesTabProps> = ({ onSelectFeature, stationName }) => {
  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
      {/* Active Station Header */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <div>
            <h2 className="text-sm font-bold text-gray-800">{stationName}</h2>
            <p className="text-[10px] text-gray-400 font-medium mt-0.5">设备通信已建立 · 微网系统在线中</p>
          </div>
        </div>
        <span className="text-[10px] text-emerald-600 bg-emerald-50 font-bold px-2 py-0.5 rounded-full border border-emerald-100">
          在线
        </span>
      </div>

      {/* Section 1: 报警管理 */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 pl-0.5">
          <div className="w-1.5 h-4 bg-emerald-500 rounded-xs" />
          <h3 className="text-sm font-bold text-gray-900 tracking-tight">报警管理</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {/* 故障报警 */}
          <div
            id="btn_fault_alarm"
            className="bg-white p-4 rounded-2xl border border-orange-100 transition-all flex flex-col items-center justify-center text-center group cursor-pointer"
            onClick={() => onSelectFeature('fault_alarm')}
          >
            <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20 text-white group-active:scale-95 transition-transform">
              <BellRing className="w-6 h-6 animate-swing" />
            </div>
            <span className="text-xs font-bold text-gray-800 mt-3">故障报警</span>
          </div>

          {/* 事件报警 */}
          <div
            id="btn_event_alarm"
            className="bg-white p-4 rounded-2xl border border-amber-100 transition-all flex flex-col items-center justify-center text-center group cursor-pointer"
            onClick={() => onSelectFeature('event_alarm')}
          >
            <div className="w-12 h-12 bg-amber-400 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-400/20 text-white group-active:scale-95 transition-transform">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-gray-800 mt-3">事件报警</span>
          </div>
        </div>
      </div>

      {/* Section 2: 策略管理 */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 pl-0.5">
          <div className="w-1.5 h-4 bg-emerald-500 rounded-xs" />
          <h3 className="text-sm font-bold text-gray-900 tracking-tight">策略管理</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {/* 策略运行 */}
          <div
            id="btn_strategy_run"
            className="bg-white p-4 rounded-2xl border border-cyan-100 transition-all flex flex-col items-center justify-center text-center group cursor-pointer"
            onClick={() => onSelectFeature('strategy_run')}
          >
            <div className="w-12 h-12 bg-[#00bcd4] rounded-2xl flex items-center justify-center shadow-lg shadow-[#00bcd4]/20 text-white group-active:scale-95 transition-transform">
              <FolderLock className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-gray-800 mt-3">策略运行</span>
          </div>

          {/* 策略运行报告 (NEWLY ADDED) */}
          <div
            id="btn_strategy_report"
            className="bg-white p-4 rounded-2xl border-2 border-emerald-500/60 shadow-md shadow-emerald-500/5 transition-all flex flex-col items-center justify-center text-center group cursor-pointer"
            onClick={() => onSelectFeature('strategy_report')}
          >
            <div className="w-12 h-12 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white group-active:scale-95 transition-transform">
              <FileCheck className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-gray-900 mt-3 flex items-center gap-0.5">
              策略运行报告
            </span>
          </div>

          {/* 天盈 AI 仿真报告 */}
          <div
            id="btn_tianying_sim"
            className="bg-white p-4 rounded-2xl border border-teal-100 transition-all flex flex-col items-center justify-center text-center group cursor-pointer relative overflow-hidden"
            onClick={() => onSelectFeature('tianying_sim')}
          >
            <span className="absolute top-1.5 right-1.5 text-[8px] font-black text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
              <Sparkles className="w-2 h-2" />
              天盈 AI
            </span>
            <div className="w-12 h-12 bg-gradient-to-tr from-teal-500 to-cyan-400 rounded-2xl flex items-center justify-center shadow-lg shadow-teal-500/20 text-white group-active:scale-95 transition-transform">
              <BrainCircuit className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-gray-800 mt-3">天盈 AI 仿真报告</span>
          </div>
        </div>
      </div>

      {/* Section 3: 微网管理 */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 pl-0.5">
          <div className="w-1.5 h-4 bg-emerald-500 rounded-xs" />
          <h3 className="text-sm font-bold text-gray-900 tracking-tight">微网管理</h3>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {/* 排班管理 */}
          <div
            id="btn_schedule_manage"
            className="bg-white p-3 rounded-2xl border border-emerald-100 transition-all flex flex-col items-center justify-center text-center group cursor-pointer"
            onClick={() => onSelectFeature('schedule_manage')}
          >
            <div className="w-10 h-10 bg-[#26a69a] rounded-xl flex items-center justify-center shadow-lg shadow-[#26a69a]/20 text-white group-active:scale-95 transition-transform">
              <CalendarDays className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-extrabold text-gray-800 mt-2.5">排班管理</span>
          </div>

          {/* 经营报告 */}
          <div
            id="btn_business_report"
            className="bg-white p-3 rounded-2xl border border-cyan-100 transition-all flex flex-col items-center justify-center text-center group cursor-pointer"
            onClick={() => onSelectFeature('business_report')}
          >
            <div className="w-10 h-10 bg-[#00acc1] rounded-xl flex items-center justify-center shadow-lg shadow-[#00acc1]/20 text-white group-active:scale-95 transition-transform">
              <FilePieChart className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-extrabold text-gray-800 mt-2.5">经营报告</span>
          </div>

          {/* 运行模式 */}
          <div
            id="btn_operating_mode"
            className="bg-white p-3 rounded-2xl border border-cyan-100 transition-all flex flex-col items-center justify-center text-center group cursor-pointer"
            onClick={() => onSelectFeature('operating_mode')}
          >
            <div className="w-10 h-10 bg-[#26c6da] rounded-xl flex items-center justify-center shadow-lg shadow-[#26c6da]/20 text-white group-active:scale-95 transition-transform">
              <CirclePlay className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-extrabold text-gray-800 mt-2.5">运行模式</span>
          </div>
        </div>
      </div>


    </div>
  );
};
