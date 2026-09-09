/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Sliders, Shield, Smartphone, RefreshCw, Layers, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface WorkbenchTabProps {
  pvCurtailmentView: boolean;
  setPvCurtailmentView: (view: boolean) => void;
  stationName: string;
  setStationName: (name: string) => void;
  phoneMode: boolean;
  setPhoneMode: (mode: boolean) => void;
}

export const WorkbenchTab: React.FC<WorkbenchTabProps> = ({
  pvCurtailmentView,
  setPvCurtailmentView,
  stationName,
  setStationName,
  phoneMode,
  setPhoneMode,
}) => {
  const stations = [
    '常州好迪机械有限公司',
    '常州智能电网示范区',
    '常州储能科技创新园',
  ];

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
      {/* Introduction Card */}
      <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-sm space-y-2">
        <h3 className="text-xs font-bold text-emerald-400 flex items-center gap-1">
          <Sliders className="w-4 h-4" /> 开发者调试控制台 (AI Studio Sandbox)
        </h3>
        <p className="text-[10px] text-slate-300 leading-relaxed">
          此处包含用于演示本微网系统的控制参数。您可以自由切换权限、虚拟电站或预览模式，以测试月度策略报告的完整交互生命周期。
        </p>
      </div>

      {/* 1. 核心权限控制 (Core Requirement) */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-500" />
          <h4 className="text-xs font-bold text-gray-900">限电止损权限管理</h4>
        </div>
        
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
          <div>
            <span className="text-[11px] font-bold text-gray-800 block">
              限电电量与止损额查看权限
            </span>
            <span className="text-[9px] text-gray-400 font-medium font-mono">
              (pv_curtailment_view)
            </span>
          </div>
          <button
            onClick={() => setPvCurtailmentView(!pvCurtailmentView)}
            id="toggle_permission"
            className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-hidden ${
              pvCurtailmentView ? 'bg-emerald-500' : 'bg-gray-300'
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                pvCurtailmentView ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Dynamic description of current permission state */}
        <div className="p-3 rounded-xl text-[10px] leading-relaxed transition-all">
          {pvCurtailmentView ? (
            <div className="text-emerald-700 bg-emerald-50/50 border border-emerald-100 p-2 rounded-lg flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">有权限状态开启：</span>
                <p className="text-gray-600 mt-0.5">
                  策略评估卡片中将<b>展示全部4个标签</b>（含新增的“限电电量”与“负电价主动止损”）和<b>每日限电止损柱状折线图</b>。
                </p>
              </div>
            </div>
          ) : (
            <div className="text-gray-600 bg-gray-50 border border-gray-200/50 p-2 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-gray-700">无权限状态：</span>
                <p className="text-gray-500 mt-0.5">
                  报告卡片仅展示前 2 个普通指标（光伏消纳率、AI提升优化）及基础堆叠消纳图。<b>新增数据及下部子图将被安全隐藏</b>。
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. 虚拟电站切换 */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-sky-500" />
          <h4 className="text-xs font-bold text-gray-900">微电网站点切换</h4>
        </div>
        <div className="space-y-2">
          {stations.map((name) => (
            <button
              key={name}
              onClick={() => setStationName(name)}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-xs transition-all flex items-center justify-between border ${
                stationName === name
                  ? 'border-emerald-500 bg-emerald-50/40 font-bold text-emerald-700 shadow-xs'
                  : 'border-gray-100 bg-gray-50 text-gray-600 font-medium'
              }`}
            >
              <span>{name}</span>
              {stationName === name && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 3. 视图容器选择 */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-purple-500" />
          <h4 className="text-xs font-bold text-gray-900">小程序预览模式</h4>
        </div>
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
          <div>
            <span className="text-[11px] font-bold text-gray-800 block">
              使用精致手机框体包裹
            </span>
            <span className="text-[9px] text-gray-400">
              切换是否在屏幕正中模拟手机端小程序体验
            </span>
          </div>
          <button
            onClick={() => setPhoneMode(!phoneMode)}
            id="toggle_phone_mode"
            className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-hidden ${
              phoneMode ? 'bg-emerald-500' : 'bg-gray-300'
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                phoneMode ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
};
