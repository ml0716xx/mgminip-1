/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Zap, Sun, Battery, Building, ShieldCheck, Heart, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

export const OverviewTab: React.FC = () => {
  const [pvPower, setPvPower] = useState<number>(185.4);
  const [batterySoc, setBatterySoc] = useState<number>(68.5);
  const [loadPower, setLoadPower] = useState<number>(150.2);
  const [gridPower, setGridPower] = useState<number>(-10.2); // Negative means feeding back or positive means buying

  // Simulate real-time fluctuations
  useEffect(() => {
    const interval = setInterval(() => {
      setPvPower((prev) => parseFloat((prev + (Math.random() - 0.5) * 5).toFixed(1)));
      setBatterySoc((prev) => {
        const next = prev + 0.1;
        return next > 100 ? 100 : parseFloat(next.toFixed(1));
      });
      setLoadPower((prev) => parseFloat((prev + (Math.random() - 0.5) * 4).toFixed(1)));
      setGridPower((prev) => parseFloat((prev + (Math.random() - 0.5) * 3).toFixed(1)));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
      {/* Real-time Flow Diagram */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping-slow" />
            <h3 className="text-sm font-bold text-gray-900">微电网动态能量流</h3>
          </div>
          <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
            AI 自动调度
          </span>
        </div>

        {/* Animated flow SVG diagram */}
        <div className="relative w-full h-[180px] bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center p-3">
          {/* Moving particles & background grid using Tailwind/CSS animation */}
          <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />

          {/* Canvas SVG */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {/* Connection Lines */}
            {/* PV to Center */}
            <path d="M 60 45 L 170 90" stroke="#f59e0b" strokeWidth="2" strokeDasharray="5 3" />
            {/* Grid to Center */}
            <path d="M 170 40 L 170 90" stroke="#38bdf8" strokeWidth="2" strokeDasharray="5 3" />
            {/* Battery to Center */}
            <path d="M 280 45 L 170 90" stroke="#10b981" strokeWidth="2" strokeDasharray="5 3" />
            {/* Center to Factory */}
            <path d="M 170 90 L 170 145" stroke="#a78bfa" strokeWidth="2" strokeDasharray="5 3" />

            {/* Glowing Center Controller Indicator */}
            <circle cx="170" cy="90" r="18" fill="#10b981" fillOpacity="0.15" />
            <circle cx="170" cy="90" r="12" fill="#10b981" fillOpacity="0.3" className="animate-ping" />
          </svg>

          {/* Nodes placed on top of lines */}
          {/* Node 1: Photovoltaic (Top Left) */}
          <div className="absolute top-[20px] left-[20px] flex flex-col items-center">
            <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-amber-500/20 border border-amber-400">
              <Sun className="w-5 h-5 animate-spin-slow" />
            </div>
            <span className="text-[8px] text-gray-400 mt-1">光伏发电</span>
            <span className="text-[10px] text-amber-500 font-extrabold font-mono mt-0.5">{pvPower} kW</span>
          </div>

          {/* Node 2: Power Grid (Top Center) */}
          <div className="absolute top-[10px] left-[140px] flex flex-col items-center">
            <div className="w-10 h-10 bg-sky-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-sky-500/20 border border-sky-400">
              <Zap className="w-5 h-5" />
            </div>
            <span className="text-[8px] text-gray-400 mt-1">国家电网</span>
            <span className="text-[10px] text-sky-400 font-extrabold font-mono mt-0.5">
              {gridPower > 0 ? `馈入 ${gridPower}` : `网调 ${Math.abs(gridPower)}`} kW
            </span>
          </div>

          {/* Node 3: Storage battery (Top Right) */}
          <div className="absolute top-[20px] right-[20px] flex flex-col items-center">
            <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 border border-emerald-400">
              <Battery className="w-5 h-5" />
            </div>
            <span className="text-[8px] text-gray-400 mt-1">储能系统</span>
            <span className="text-[10px] text-emerald-400 font-extrabold font-mono mt-0.5">{batterySoc}% (充)</span>
          </div>

          {/* Node 4: AI Smart Controller (Center) */}
          <div className="absolute top-[70px] left-[150px] flex flex-col items-center">
            <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center text-white shadow-xl shadow-emerald-600/30 border-2 border-emerald-300">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="text-[7px] text-emerald-400 font-bold tracking-widest mt-1">AI智脑</span>
          </div>

          {/* Node 5: Factory Load (Bottom Center) */}
          <div className="absolute bottom-[10px] left-[140px] flex flex-col items-center">
            <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-purple-500/20 border border-purple-400">
              <Building className="w-5 h-5" />
            </div>
            <span className="text-[8px] text-gray-400 mt-1">负载消耗</span>
            <span className="text-[10px] text-purple-400 font-extrabold font-mono mt-0.5">{loadPower} kW</span>
          </div>
        </div>
      </div>

      {/* Save Summary widgets */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-sm">
          <span className="text-[9px] text-gray-400 font-bold block">实时节费率</span>
          <span className="text-base font-extrabold text-emerald-600 font-mono">¥245.5</span>
          <span className="text-[9px] text-gray-400 font-semibold block mt-1">/ 小时节省</span>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-sm">
          <span className="text-[9px] text-gray-400 font-bold block">碳减排贡献</span>
          <span className="text-base font-extrabold text-sky-500 font-mono">1.82</span>
          <span className="text-[9px] text-gray-400 font-semibold block mt-1">tCO₂ / 累计</span>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-sm">
          <span className="text-[9px] text-gray-400 font-bold block">安全保障天数</span>
          <span className="text-base font-extrabold text-purple-600 font-mono">245</span>
          <span className="text-[9px] text-gray-400 font-semibold block mt-1">天无事故运行</span>
        </div>
      </div>

      {/* Safety Score Section */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500 border border-emerald-100">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-gray-800">系统运行评分：100 (优)</h4>
            <p className="text-[9px] text-gray-400 mt-0.5">全站并网电压稳定，储能温控在 24.5°C 安全域</p>
          </div>
        </div>
        <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
          <Heart className="w-3.5 h-3.5 fill-current text-emerald-500 animate-pulse" /> 健康
        </span>
      </div>
    </div>
  );
};
