/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AI 策略开通入口（共用于经营分析报告 / 策略运行报告）
 * 未开通态展示「开通试用 / 开通正式」两个入口；试运行态展示「升级为正式运行」。
 *
 * id 约定（供原型核对脚本定位）：
 *   #btn_ai_trial_{scope}     开通试用
 *   #btn_ai_activated_{scope} 开通正式
 *   #btn_ai_upgrade_{scope}   升级为正式运行（试运行态）
 */

import React from 'react';
import { Timer, BadgeCheck, ArrowUpCircle } from 'lucide-react';

export interface AiActivationCtaProps {
  /** 位置标识，用于生成唯一 id（biz / rpchart / rp） */
  scope: string;
  /** 未开通 → 开通试用 */
  onTrial?: () => void;
  /** 未开通 → 开通正式 */
  onActivate?: () => void;
  /** 尺寸：md 用于整块卡片，sm 用于紧凑行内 */
  size?: 'sm' | 'md';
  /** sm 尺寸下的排列方向 */
  orientation?: 'row' | 'column';
  /** 是否展示底部说明文案 */
  showHint?: boolean;
  className?: string;
}

export const AiActivationCta: React.FC<AiActivationCtaProps> = ({
  scope,
  onTrial,
  onActivate,
  size = 'md',
  orientation = 'row',
  showHint = true,
  className = '',
}) => {
  const md = size === 'md';
  const base = md
    ? 'py-2 rounded-xl text-[11px] gap-1'
    : 'py-1 px-2 rounded-lg text-[9px] gap-0.5 whitespace-nowrap';

  return (
    <div className={className}>
      <div
        className={
          md
            ? 'grid grid-cols-2 gap-2'
            : orientation === 'row'
            ? 'flex items-center gap-1'
            : 'flex flex-col items-stretch gap-1 w-[68px]'
        }
      >
        <button
          id={`btn_ai_trial_${scope}`}
          onClick={onTrial}
          className={`${base} flex items-center justify-center font-black bg-white text-amber-600 border border-amber-300 active:scale-[0.98] transition-transform`}
        >
          <Timer className={md ? 'w-3.5 h-3.5' : 'w-3 h-3'} />
          开通试用
        </button>
        <button
          id={`btn_ai_activated_${scope}`}
          onClick={onActivate}
          className={`${base} flex items-center justify-center font-black text-white bg-gradient-to-r from-emerald-500 to-teal-500 shadow-sm shadow-emerald-500/25 active:scale-[0.98] transition-transform`}
        >
          <BadgeCheck className={md ? 'w-3.5 h-3.5' : 'w-3 h-3'} />
          开通正式
        </button>
      </div>
      {md && showHint && (
        <p className="text-[9px] text-gray-400 text-center mt-1.5">
          试用含 7 天全功能体验，到期可升级正式版
        </p>
      )}
    </div>
  );
};

/** 试运行态：升级为正式运行 */
export const AiUpgradeCta: React.FC<{
  scope: string;
  onClick?: () => void;
  size?: 'sm' | 'md';
  className?: string;
}> = ({ scope, onClick, size = 'md', className = '' }) => {
  const md = size === 'md';
  return (
    <button
      id={`btn_ai_upgrade_${scope}`}
      onClick={onClick}
      className={`${className} ${
        md
          ? 'py-2 rounded-xl text-[11px] gap-1'
          : 'py-1 px-2 rounded-lg text-[9px] gap-0.5 whitespace-nowrap'
      } flex items-center justify-center font-black text-emerald-700 bg-white border border-emerald-300 active:scale-[0.98] transition-transform`}
    >
      <ArrowUpCircle className={md ? 'w-3.5 h-3.5' : 'w-3 h-3'} />
      升级为正式运行
    </button>
  );
};
