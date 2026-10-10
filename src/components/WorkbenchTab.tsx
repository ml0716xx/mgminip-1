/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Sliders,
  Shield,
  Smartphone,
  Layers,
  CheckCircle2,
  AlertCircle,
  BrainCircuit,
  Sparkles,
} from 'lucide-react';
import { motion } from 'motion/react';
import { AiActivationStatus, AI_STATUS_META } from '../data/overviewData';
import { DEMO_STATIONS } from '../data/stationData';

interface WorkbenchTabProps {
  pvCurtailmentView: boolean;
  setPvCurtailmentView: (view: boolean) => void;
  stationName: string;
  setStationName: (name: string) => void;
  phoneMode: boolean;
  setPhoneMode: (mode: boolean) => void;
  aiStatus: AiActivationStatus;
  setAiStatus: (status: AiActivationStatus) => void;
}

export const WorkbenchTab: React.FC<WorkbenchTabProps> = ({
  pvCurtailmentView,
  setPvCurtailmentView,
  stationName,
  setStationName,
  phoneMode,
  setPhoneMode,
  aiStatus,
  setAiStatus,
}) => {
  const stations = [...DEMO_STATIONS];

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

      {/* 2. AI 策略开通状态（三态，联动策略运行报告 / 经营分析报告） */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <BrainCircuit className="w-4 h-4 text-emerald-500" />
          <h4 className="text-xs font-bold text-gray-900">AI 策略开通状态</h4>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {(['not_activated', 'trial', 'activated'] as AiActivationStatus[]).map((s) => {
            const meta = AI_STATUS_META[s];
            const active = aiStatus === s;
            return (
              <button
                key={s}
                id={`btn_ai_status_${s}`}
                onClick={() => setAiStatus(s)}
                className={`py-2.5 rounded-xl text-[11px] font-black border transition-all flex flex-col items-center gap-1 ${
                  active
                    ? 'border-emerald-500 bg-emerald-50/50 text-emerald-700 shadow-xs'
                    : 'border-gray-100 bg-gray-50 text-gray-500'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${active ? meta.dotClass : 'bg-gray-300'}`} />
                {meta.label}
              </button>
            );
          })}
        </div>

        <div className="p-3 rounded-xl text-[10px] leading-relaxed bg-gray-50 border border-gray-100">
          {aiStatus === 'not_activated' && (
            <div className="text-gray-600 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-gray-700">未开通：</span>
                <p className="text-gray-500 mt-0.5">
                  策略运行报告中的<b>限电止损（增值特性）</b>以锁定态展示，并提供
                  <b>「开通试用」/「开通正式」</b>两个入口；经营分析报告的 AI 策略章节展示
                  能力预览与同样的开通入口。
                </p>
              </div>
            </div>
          )}
          {aiStatus === 'trial' && (
            <div className="text-amber-700 bg-amber-50/60 border border-amber-100 p-2 rounded-lg flex items-start gap-2 -m-1.5">
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">试运行：</span>
                <p className="text-amber-800/80 mt-0.5">
                  限电止损与 AI 收益按<b>仿真估算值</b>展示，并统一附加「估算」标注与琥珀徽标。
                </p>
              </div>
            </div>
          )}
          {aiStatus === 'activated' && (
            <div className="text-emerald-700 bg-emerald-50/50 border border-emerald-100 p-2 rounded-lg flex items-start gap-2 -m-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">正式运行：</span>
                <p className="text-gray-600 mt-0.5">
                  限电止损增值特性全量展示（含止损电量、止损金额与逐日穿透），AI 收益按实际结算口径统计。
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. 虚拟电站切换 */}
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

      {/* 4. 视图容器选择 */}
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
