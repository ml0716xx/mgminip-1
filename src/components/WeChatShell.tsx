/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ActiveTab } from '../types';
import {
  Home,
  Box,
  MessageSquare,
  LayoutGrid,
  Wifi,
  Battery,
  Signal,
  MoreHorizontal,
  Circle,
} from 'lucide-react';
import { motion } from 'motion/react';

interface WeChatShellProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  stationName: string;
  phoneMode: boolean;
  children: React.ReactNode;
}

export const WeChatShell: React.FC<WeChatShellProps> = ({
  activeTab,
  setActiveTab,
  stationName,
  phoneMode,
  children,
}) => {
  // 站名直接完整展示，超长由样式截断（原来按前 4 字 + 「...」硬切，会把「康达新材料-1#站」砍成「康达新材...」）
  const shortStation = stationName;

  interface TabItem {
    id: ActiveTab;
    name: string;
    icon: any;
    badge?: number;
  }

  const tabs: TabItem[] = [
    { id: 'overview', name: '概览', icon: Home },
    { id: 'features', name: '功能', icon: Box },
    { id: 'messages', name: '消息', icon: MessageSquare, badge: 2 },
    { id: 'workbench', name: '工作台', icon: LayoutGrid },
  ];

  const headerTitle = {
    overview: '概览',
    features: '功能',
    messages: '消息',
    workbench: '工作台',
  }[activeTab];

  const content = (
    <div className="flex flex-col h-full bg-[#f8fafc] overflow-hidden select-none">
      {/* 1. iOS Status Bar (Visible in phoneMode) */}
      {phoneMode && (
        <div className="bg-white px-5 pt-3 pb-1 flex items-center justify-between text-[11px] font-bold text-gray-900 font-sans z-30 select-none">
          <span>15:09</span>
          <div className="flex items-center gap-1.5">
            <Signal className="w-3.5 h-3.5 text-gray-900" />
            <span className="text-[9px] uppercase tracking-wider">5G</span>
            <Wifi className="w-3.5 h-3.5 text-gray-900" />
            <div className="flex items-center gap-0.5">
              <span className="text-[9px] font-mono">94%</span>
              <Battery className="w-4 h-4" />
            </div>
          </div>
        </div>
      )}

      {/* 2. WeChat Action Bar / Capsule Bar */}
      <div className="bg-white border-b border-gray-100/80 px-4 py-2.5 flex items-center justify-between z-30 select-none">
        {/* LeftDropdown resembling WeChat screenshot */}
        <div className="flex items-center gap-1 cursor-pointer active:opacity-85 active:scale-95 transition-all">
          <span className="text-[12px] font-bold text-gray-700 truncate max-w-[126px]">{shortStation}</span>
          <span className="text-[8px] text-gray-400">▼</span>
        </div>

        {/* Center Page Title */}
        <span className="text-[14px] font-extrabold text-gray-900 font-sans tracking-wide">
          {headerTitle}
        </span>

        {/* WeChat Capsule Button */}
        <div className="flex items-center gap-2 px-2.5 py-1 bg-white border border-gray-200/80 rounded-full shadow-xs select-none">
          <button className="text-gray-900 transition-colors">
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>
          <div className="w-[1px] h-3 bg-gray-200" />
          <button className="text-gray-900 transition-colors">
            <Circle className="w-3.5 h-3.5 fill-gray-900 stroke-none" />
          </button>
        </div>
      </div>

      {/* 3. Render Page Content */}
      <div className="flex-1 overflow-hidden relative flex flex-col">
        {children}
      </div>

      {/* 4. Bottom Tab Navigation */}
      <div className="bg-white border-t border-gray-100 px-4 py-2 pb-3 flex items-center justify-around z-30 shadow-lg">
        {tabs.map((tab) => {
          const IconComponent = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex flex-col items-center justify-center gap-1 cursor-pointer min-w-[50px] relative group"
            >
              <div
                className={`p-1.5 rounded-full transition-all duration-300 relative ${
                  isActive
                    ? 'text-emerald-500 bg-emerald-50/50 scale-110'
                    : 'text-gray-400'
                }`}
              >
                <IconComponent className="w-5 h-5" />
                {tab.badge && (
                  <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white font-black rounded-full text-[7px] w-3.5 h-3.5 flex items-center justify-center animate-pulse border border-white">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span
                className={`text-[9px] transition-all font-semibold ${
                  isActive ? 'text-emerald-500 font-extrabold' : 'text-gray-400'
                }`}
              >
                {tab.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );

  if (phoneMode) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 antialiased overflow-y-auto">
        {/* Device frame markup with physical shadow and realistic proportions */}
        <div className="relative mx-auto w-[395px] h-[820px] bg-slate-900 rounded-[50px] p-3.5 shadow-2xl border-4 border-slate-800 flex flex-col shrink-0">
          {/* Speaker, camera hardware pill cutout */}
          <div className="absolute top-5 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-slate-900 rounded-full z-40 flex items-center justify-center">
            <div className="w-12 h-1 bg-slate-800 rounded-full mb-1" />
            <div className="w-2.5 h-2.5 bg-slate-800 rounded-full absolute right-5" />
          </div>

          {/* Left physical volume rockers & power buttons for realistic craft */}
          <div className="absolute top-36 -left-1 w-1 h-12 bg-slate-700 rounded-r-xs" />
          <div className="absolute top-52 -left-1 w-1 h-16 bg-slate-700 rounded-r-xs" />
          <div className="absolute top-72 -left-1 w-1 h-16 bg-slate-700 rounded-r-xs" />
          <div className="absolute top-44 -right-1 w-1 h-20 bg-slate-700 rounded-l-xs" />

          {/* Curved inner screen wrapping content */}
          <div className="flex-1 bg-white rounded-[38px] overflow-hidden relative shadow-inner border border-slate-950 flex flex-col">
            {content}
          </div>
        </div>
      </div>
    );
  }

  // Full Screen Desktop View
  return (
    <div className="min-h-screen bg-[#f8fafc] flex justify-center py-4 px-2 antialiased">
      <div className="w-full max-w-[420px] bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 flex flex-col h-[780px]">
        {content}
      </div>
    </div>
  );
};
