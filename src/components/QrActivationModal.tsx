/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 开通入口 · 扫码办理（小程序端）
 * --------------------------------------------------------------------------
 * 「开通试用 / 开通正式 / 升级正式运行」不再是一键改状态，而是弹出这张卡片：
 * 扫码添加「零碳云管家」，由服务人员按站点开通。
 *
 * 为什么不做成自助开通：开通要绑站点与合同口径，线上按钮改个状态会和后台对不上，
 * 现场出了问题也找不到人。所以入口保留、样式保留，只是把动作落到人身上。
 *
 * 三态的展示（未开通 / 试运行 / 正式运行）不变，这里只换"点了之后发生什么"。
 */

import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowUpCircle, BadgeCheck, Timer, X } from 'lucide-react';

export type QrScene = 'trial' | 'activated' | 'upgrade';

const SCENE_META: Record<
  QrScene,
  { title: string; desc: string; icon: React.ElementType; iconCls: string }
> = {
  trial: {
    title: '开通 30 天试用',
    desc: '扫码添加后告知站点名称，由服务人员为您开通 30 天全功能体验。',
    icon: Timer,
    iconCls: 'bg-amber-500',
  },
  activated: {
    title: '开通正式运行',
    desc: '扫码添加后告知站点名称与开通范围，由服务人员为您开通正式运行。',
    icon: BadgeCheck,
    iconCls: 'bg-emerald-500',
  },
  upgrade: {
    title: '升级为正式运行',
    desc: '扫码添加后告知站点名称，由服务人员核对运行数据并完成升级。',
    icon: ArrowUpCircle,
    iconCls: 'bg-emerald-600',
  },
};

interface QrActivationModalProps {
  /** null 表示不展示 */
  scene: QrScene | null;
  onClose: () => void;
  /** 与手机壳一致的圆角，避免遮罩的直角溢出机身边缘 */
  shellRadius?: string;
}

export const QrActivationModal: React.FC<QrActivationModalProps> = ({
  scene,
  onClose,
  shellRadius = 'rounded-[50px]',
}) => (
  <AnimatePresence>
    {scene && (
      <motion.div
        key="qr_modal"
        id="qr_activation_modal"
        className={`absolute inset-0 z-[200] overflow-hidden ${shellRadius} flex items-center justify-center px-6 bg-slate-900/55`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        onClick={onClose}
      >
        <motion.div
          className="w-full max-w-[300px] bg-white rounded-[22px] overflow-hidden shadow-2xl"
          initial={{ opacity: 0, scale: 0.94, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          transition={{ type: 'spring', damping: 26, stiffness: 320 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 头部：说清楚这是在办哪件事 */}
          <div className="relative px-4 pt-4 pb-3 text-center">
            <button
              id="btn_qr_close"
              onClick={onClose}
              className="absolute right-2.5 top-2.5 p-1 text-gray-300 active:text-gray-500"
              aria-label="关闭"
            >
              <X className="w-4 h-4" />
            </button>
            <div
              className={`w-9 h-9 rounded-xl mx-auto flex items-center justify-center text-white ${SCENE_META[scene].iconCls}`}
            >
              {React.createElement(SCENE_META[scene].icon, { className: 'w-4.5 h-4.5' })}
            </div>
            <p className="text-[14px] font-black text-gray-900 mt-2">{SCENE_META[scene].title}</p>
            <p className="text-[9px] text-gray-400 font-bold mt-0.5">需由服务人员办理</p>
          </div>

          {/* 二维码 */}
          <div className="px-4">
            <div className="rounded-2xl border border-gray-100 bg-white p-2.5 shadow-xs">
              <img
                id="qr_image"
                src="/qr-lingtan.png"
                alt="零碳云管家二维码"
                className="w-full aspect-square rounded-lg block"
                draggable={false}
              />
            </div>
            <div className="flex items-center justify-center gap-1 mt-2.5">
              <span className="text-[12px] font-black text-gray-900">零碳云管家</span>
              <span className="text-[8px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-full px-1.5 py-0.5">
                企业微信
              </span>
            </div>
            <p className="text-[9px] text-gray-400 font-bold text-center mt-1">
              微信扫码，添加服务人员
            </p>
          </div>

          <div className="px-4 pt-2.5 pb-4">
            <p className="text-[9px] text-gray-400 leading-relaxed text-center">
              {SCENE_META[scene].desc}
            </p>
            <button
              id="btn_qr_done"
              onClick={onClose}
              className="w-full mt-3 py-2.5 rounded-xl text-[11px] font-black text-white bg-gradient-to-r from-emerald-500 to-teal-500 shadow-sm shadow-emerald-500/25 active:scale-[0.98] transition-transform"
            >
              我知道了
            </button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);
