/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { ChevronLeft, CheckCircle2, Loader2, AlertTriangle, Wifi, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type ModeType = 'offGrid' | 'onGrid';
type StepState = 'idle' | 'running' | 'done';
type Phase = 'idle' | 'confirm' | 'running' | 'done';

interface StepDef {
  title: string;
  detail: string;
}

interface ModeMeta {
  name: string;
  desc: string[];
  warning?: string;
  steps: StepDef[];
}

// 步骤口径：截图还原（离网 7 步）；并网按领导要求去除原 1/3/5 步，保留 3 步
const MODE_META: Record<ModeType, ModeMeta> = {
  onGrid: {
    name: '并网模式',
    desc: ['与电网相连，并网运行，支持多种控制策略'],
    steps: [
      { title: '电网合闸状态确认', detail: '确认电网侧已合闸，线路带电正常' },
      { title: '确认电网正常供电', detail: '校验电网电压/频率处于并网允许范围' },
      { title: '确认切换并网模式结果', detail: '汇总校验结果，确认并网切换完成' },
    ],
  },
  offGrid: {
    name: '离网模式',
    desc: ['独立于电网运行，为设备提供应急电源'],
    warning: '当前离网运行模式，禁止电网合闸，否则将损坏储能',
    steps: [
      { title: '储能停机状态检测', detail: '确认储能变流器处于停机状态，方可执行模式切换' },
      { title: '储能SOC是否满足离网要求', detail: '校验当前SOC ≥ 20%，满足离网带载需求' },
      { title: '储能最低功率是否满足离网要求', detail: '校验储能当前可放功率满足重要负载需求' },
      { title: '储能切换离网模式', detail: '向储能变流器下发离网运行模式指令，并等待设备ACK' },
      { title: '电网断电状态确认', detail: '确认电网侧已断开，避免并/离网同时带电' },
      { title: '设置储能开机', detail: '下发开机指令，储能建立离网电压与频率' },
      { title: '确认切换离网模式结果', detail: '校验输出电压 380V±5%、频率 50Hz±0.5Hz，确认切换完成' },
    ],
  },
};

const STEP_MS = 750;

interface ModePageProps {
  onBack: () => void;
}

export const ModePage: React.FC<ModePageProps> = ({ onBack }) => {
  const [currentMode, setCurrentMode] = useState<ModeType>('offGrid');
  const [selectedMode, setSelectedMode] = useState<ModeType>('offGrid');
  const [phase, setPhase] = useState<Phase>('idle');
  const [stepStates, setStepStates] = useState<StepState[]>(MODE_META.offGrid.steps.map(() => 'idle'));
  const [showToast, setShowToast] = useState(false);

  const targetMeta = MODE_META[selectedMode];
  const busy = phase === 'confirm' || phase === 'running';
  const runningIdx = stepStates.indexOf('running');

  const handleSelect = (m: ModeType) => {
    if (busy) return;
    setSelectedMode(m);
    setPhase('idle');
    setStepStates(MODE_META[m].steps.map(() => 'idle'));
  };

  // 切换执行：逐步点亮 校验中 → 通过，全部完成后落位当前模式
  useEffect(() => {
    if (phase !== 'running') return;
    const timers: number[] = [];
    targetMeta.steps.forEach((_, i) => {
      timers.push(
        window.setTimeout(() => {
          setStepStates((prev) => prev.map((s, idx) => (idx === i ? 'running' : s)));
        }, i * STEP_MS)
      );
      timers.push(
        window.setTimeout(() => {
          setStepStates((prev) => prev.map((s, idx) => (idx === i ? 'done' : s)));
        }, (i + 1) * STEP_MS)
      );
    });
    timers.push(
      window.setTimeout(() => {
        setCurrentMode(selectedMode);
        setPhase('done');
        setShowToast(true);
        window.setTimeout(() => setShowToast(false), 2600);
      }, (targetMeta.steps.length + 0.4) * STEP_MS)
    );
    return () => timers.forEach((t) => clearTimeout(t));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  return (
    <div className="relative flex flex-col h-full bg-[#f8fafc] text-gray-800 overflow-hidden">
      {/* 顶部栏 */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-100 flex flex-col shadow-xs shrink-0">
        <div className="px-4 py-3.5 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-gray-600 transition-colors animate-none"
          >
            <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
            <span className="text-sm font-medium">返回</span>
          </button>
          <span className="text-base font-bold text-gray-900">运行模式管理</span>
          <span className="w-14" />
        </div>
      </div>

      {/* 主体 */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-6 space-y-3">
        {/* 当前运行模式 + 常驻警告（离网时） */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-sm font-black text-gray-900">当前运行模式</span>
            <span
              className={`text-xs font-black px-2.5 py-1 rounded-full flex items-center gap-1.5 ${
                currentMode === 'offGrid'
                  ? 'bg-amber-50 text-amber-600 border border-amber-200'
                  : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
              }`}
            >
              {currentMode === 'offGrid' ? <Zap className="w-3 h-3" /> : <Wifi className="w-3 h-3" />}
              {MODE_META[currentMode].name}
            </span>
          </div>
          {currentMode === 'offGrid' && (
            <div className="mt-3 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
              <span className="text-[11px] text-rose-600 font-bold leading-relaxed">
                {MODE_META.offGrid.warning}
              </span>
            </div>
          )}
        </div>

        {/* 模式选择卡片 */}
        <div className="grid grid-cols-2 gap-3">
          {(['onGrid', 'offGrid'] as ModeType[]).map((m) => {
            const selected = selectedMode === m;
            const isCurrent = currentMode === m;
            return (
              <button
                key={m}
                onClick={() => handleSelect(m)}
                disabled={busy}
                className={`relative text-left rounded-2xl border p-3 transition-all ${
                  busy
                    ? 'cursor-not-allowed opacity-70'
                    : selected
                    ? 'border-emerald-400 bg-emerald-50/70 shadow-sm active:scale-[0.98]'
                    : 'border-gray-100 bg-white active:scale-[0.98]'
                }`}
              >
                {isCurrent && (
                  <span className="absolute -top-2 right-3 bg-emerald-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-sm">
                    当前模式
                  </span>
                )}
                <div className="flex items-center gap-1.5 mb-1.5">
                  {m === 'onGrid' ? (
                    <Wifi className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                  )}
                  <span className="text-sm font-black text-gray-800">{MODE_META[m].name}</span>
                </div>
                {MODE_META[m].desc.map((d, i) => (
                  <div key={i} className="text-[10px] text-gray-400 leading-relaxed">
                    {d}
                  </div>
                ))}
              </button>
            );
          })}
        </div>

        {/* 步骤标题 + 执行进度 */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-black text-gray-800">
            {phase === 'running'
              ? `正在切换至${targetMeta.name}…`
              : phase === 'done' && selectedMode === currentMode
              ? `${targetMeta.name}切换已完成`
              : `储能${selectedMode === 'onGrid' ? '并网' : '离网'}模式切换操作&校验模式`}
          </span>
          {phase === 'running' && (
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              第{Math.min(runningIdx + 1, targetMeta.steps.length)}/{targetMeta.steps.length}步
            </span>
          )}
        </div>

        {/* 执行中提示 / 完成结果 */}
        {phase === 'running' && (
          <div className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50/70 px-3 py-2">
            <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin shrink-0" />
            <span className="text-[11px] text-blue-700 font-bold">切换执行中，请勿离开本页面或对站点执行其它操作</span>
          </div>
        )}
        {phase === 'done' && selectedMode === currentMode && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/70 px-3 py-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span className="text-[11px] text-emerald-700 font-bold">
              {targetMeta.steps.length} 项校验与指令全部通过，站点已切换至{targetMeta.name}运行
            </span>
          </div>
        )}

        {/* 校验步骤：纵向卡片流（手机竖屏） */}
        <div className="space-y-2">
          {targetMeta.steps.map((step, i) => {
            const stepNo = i + 1;
            const st = stepStates[i];
            return (
              <div
                key={`${selectedMode}-${stepNo}`}
                className={`relative rounded-xl border px-3.5 py-3 shadow-xs transition-colors ${
                  st === 'done'
                    ? 'bg-emerald-50/60 border-emerald-200'
                    : st === 'running'
                    ? 'bg-white border-emerald-300'
                    : 'bg-white border-gray-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`w-5 h-5 rounded-full text-white text-[11px] font-black flex items-center justify-center shrink-0 shadow-sm transition-colors ${
                      st === 'done'
                        ? 'bg-emerald-500'
                        : st === 'running'
                        ? 'bg-emerald-400'
                        : 'bg-gray-300'
                    }`}
                  >
                    {st === 'done' ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : st === 'running' ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      stepNo
                    )}
                  </span>
                  <span className="text-xs font-bold text-gray-700 flex-1">{step.title}</span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                      st === 'done'
                        ? 'text-emerald-600 bg-emerald-100'
                        : st === 'running'
                        ? 'text-blue-600 bg-blue-50 border border-blue-200'
                        : 'text-gray-400 bg-gray-100'
                    }`}
                  >
                    {st === 'done' ? '通过' : st === 'running' ? '校验中' : '待执行'}
                  </span>
                </div>
                <div className="text-[10px] text-gray-400 leading-relaxed mt-1.5 pl-7.5">{step.detail}</div>
              </div>
            );
          })}
        </div>

        {/* 切换按钮 */}
        {(selectedMode !== currentMode || phase === 'idle') && selectedMode !== currentMode && phase === 'idle' && (
          <div className="pt-1">
            <button
              onClick={() => setPhase('confirm')}
              className="w-full bg-emerald-500 active:bg-emerald-600 text-white text-sm font-black py-3 rounded-xl shadow-md transition-all"
            >
              开始切换{targetMeta.name}
            </button>
          </div>
        )}
      </div>

      {/* 二次确认弹窗 */}
      {phase === 'confirm' && (
        <div
          className="absolute inset-0 z-40 bg-black/50 flex items-center justify-center p-5"
          onClick={() => setPhase('idle')}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-[320px] w-full p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              </span>
              <h3 className="text-sm font-bold text-gray-900">确认切换至{targetMeta.name}？</h3>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              将按 {targetMeta.steps.length} 个步骤自动执行校验与切换指令，过程中请勿对本站执行其它操作。
            </p>
            {targetMeta.warning && (
              <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                <span className="text-[11px] text-rose-600 font-bold leading-relaxed">{targetMeta.warning}</span>
              </div>
            )}
            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => setPhase('idle')}
                className="px-4 py-2 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => {
                  setStepStates(targetMeta.steps.map(() => 'idle'));
                  setPhase('running');
                }}
                className="px-5 py-2 text-xs font-bold bg-emerald-500 active:bg-emerald-600 text-white rounded-lg shadow-sm transition-all"
              >
                确认切换
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 切换成功 Toast（小程序风格：居中轻提示） */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 bg-gray-900/90 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 whitespace-nowrap"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            已切换至{MODE_META[currentMode].name}，模式切换指令执行完成
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
