/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 消息页
 * 结构（两层，互不混淆）：
 *   一级：消息通知 / 告警消息  —— 两类消息并列
 *      · 消息通知：报告推送（天盈AI仿真 / 经营分析 / 策略运行，点击直达报告详情）
 *                 + AI 策略开通提醒 + AI 策略到期提醒
 *      · 告警消息：设备告警
 *   二级（仅告警分支内）：未恢复 / 已恢复 —— 告警的处置状态
 *
 * 消息通知的数据在 src/data/noticeData.ts，本组件只负责渲染。
 */

import React, { useState } from 'react';
import {
  Bell,
  ListFilter,
  FileText,
  ChevronRight,
  BrainCircuit,
  Inbox,
  AlertTriangle,
  Rocket,
  Timer,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { STATION } from '../data/stationData';
import { NOTICE_MESSAGES, unreadNoticeCount } from '../data/noticeData';
import type { NoticeTarget } from '../data/noticeData';

// ==================== 数据类型 ====================
interface AlarmMsg {
  id: number;
  title: string;
  important: boolean;
  alarmType: string; // 告警类型
  deviceName: string; // 设备名称
  deviceType: string; // 设备类型
  deviceSn: string; // 设备 SN
  occurTime: string; // 发生时间
  recoverTime: string | null; // 恢复时间（null = 未恢复）
}

const ALARM_MESSAGES: AlarmMsg[] = [
  {
    id: 1,
    title: '华为数采离线',
    important: true,
    alarmType: '离线告警',
    deviceName: '华为数采',
    deviceType: '光伏设备',
    deviceSn: 'TN900BT000B251225001',
    occurTime: '2026-10-08 04:14',
    recoverTime: '2026-10-08 04:14',
  },
  {
    id: 2,
    title: '储能柜-1#-PCS离线',
    important: true,
    alarmType: '离线告警',
    deviceName: '储能柜-1#-PCS',
    deviceType: '储能设备',
    deviceSn: 'TESAR125261GT00CN25125001-PCS-001',
    occurTime: '2026-10-08 04:14',
    recoverTime: '2026-10-08 04:14',
  },
  {
    id: 3,
    title: '储能柜-2#-BCM_TEMP06高温预警',
    important: false,
    alarmType: '温度告警',
    deviceName: '储能柜-2#-BCM',
    deviceType: '储能设备',
    deviceSn: 'TESAR125261GT00CN25125002-BCM-006',
    occurTime: '2026-10-07 13:52',
    recoverTime: '2026-10-07 15:08',
  },
  {
    id: 4,
    title: '电网侧C相电压越限',
    important: true,
    alarmType: '越限告警',
    deviceName: '并网计量电表',
    deviceType: '电网设备',
    deviceSn: 'DDZY666-Z-20260115-017',
    occurTime: '2026-10-06 19:41',
    recoverTime: null,
  },
];

interface MessagesTabProps {
  onOpenReport?: (target: NoticeTarget) => void;
}

export const MessagesTab: React.FC<MessagesTabProps> = ({ onOpenReport }) => {
  // 一级分类：消息通知 / 告警消息
  const [category, setCategory] = useState<'report' | 'alarm'>('alarm');
  // 二级分类（仅告警）：未恢复 / 已恢复
  const [alarmState, setAlarmState] = useState<'unrecovered' | 'recovered'>('recovered');
  const [filterOpen, setFilterOpen] = useState(false);
  const [onlyImportant, setOnlyImportant] = useState(false);

  const recoveredAlarms = ALARM_MESSAGES.filter((m) => m.recoverTime);
  const unrecoveredAlarms = ALARM_MESSAGES.filter((m) => !m.recoverTime);

  const alarmList = (alarmState === 'recovered' ? recoveredAlarms : unrecoveredAlarms).filter(
    (m) => !onlyImportant || m.important,
  );

  return (
    <div className="flex-1 overflow-y-auto bg-[#f6f7f9]">
      {/* 站点行 + 筛选（筛选仅作用于告警） */}
      <div className="px-4 pt-3 pb-1 flex items-center justify-between relative">
        <span className="text-[13px] font-black text-gray-900">{STATION.short}</span>
        {category === 'alarm' ? (
          <div className="relative">
            <button
              id="btn_msg_filter"
              onClick={() => setFilterOpen((v) => !v)}
              className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all ${
                onlyImportant
                  ? 'text-emerald-600 bg-emerald-50 border-emerald-200'
                  : 'text-gray-500 bg-white border-gray-200'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              筛选{onlyImportant ? '· 仅重要' : ''}
            </button>
            <AnimatePresence>
              {filterOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="absolute top-8 right-0 z-20 bg-white rounded-xl border border-gray-100 shadow-lg py-1 w-32"
                >
                  {(
                    [
                      { k: false, label: '全部告警' },
                      { k: true, label: '仅重要告警' },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={String(opt.k)}
                      onClick={() => {
                        setOnlyImportant(opt.k);
                        setFilterOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-[11px] font-bold flex items-center justify-between ${
                        onlyImportant === opt.k ? 'text-emerald-600' : 'text-gray-600'
                      }`}
                    >
                      {opt.label}
                      {onlyImportant === opt.k && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <span className="text-[10px] text-gray-400 font-bold">共 {NOTICE_MESSAGES.length} 条消息通知</span>
        )}
      </div>

      {/* 一级分类：消息通知 / 告警消息 */}
      <div className="px-4 pt-1 pb-2">
        <div className="grid grid-cols-2 rounded-xl bg-white border border-gray-100 p-1">
          {(
            [
              { key: 'report', label: '消息通知', icon: Inbox, count: NOTICE_MESSAGES.length, dot: unreadNoticeCount > 0 },
              { key: 'alarm', label: '告警消息', icon: AlertTriangle, count: ALARM_MESSAGES.length, dot: false },
            ] as const
          ).map((c) => {
            const Icon = c.icon;
            const active = category === c.key;
            return (
              <button
                key={c.key}
                id={`msg_cat_${c.key}`}
                onClick={() => setCategory(c.key)}
                className={`py-2 text-xs font-black rounded-lg transition-all flex items-center justify-center gap-1 relative ${
                  active ? 'text-emerald-600 bg-emerald-50/60' : 'text-gray-400'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {c.label}
                <span className={`text-[9px] font-mono ${active ? 'text-emerald-500' : 'text-gray-400'}`}>
                  {c.count}
                </span>
                {c.dot && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />}
              </button>
            );
          })}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={category}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
        >
          {/* ==================== 消息通知 ==================== */}
          {category === 'report' && (
            <div className="px-4 pb-6 pt-1 space-y-2.5">
              {NOTICE_MESSAGES.map((m) => {
                const isReport = m.kind === 'report';
                const isExpiry = m.kind === 'expiry';
                const t = m.target;

                // 图标底色：报告按类型分色，开通走绿色，到期走琥珀
                const iconClass = isReport
                  ? t === 'tianying_sim'
                    ? 'bg-gradient-to-tr from-emerald-500 to-teal-400 text-white shadow-md shadow-emerald-500/20'
                    : t === 'business_report'
                    ? 'bg-sky-50 text-sky-600 border border-sky-100'
                    : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                  : isExpiry
                  ? 'bg-amber-50 text-amber-600 border border-amber-200'
                  : 'bg-emerald-50 text-emerald-600 border border-emerald-200';

                const badgeClass = isReport
                  ? t === 'tianying_sim'
                    ? 'text-emerald-600 bg-emerald-50 border-emerald-200'
                    : t === 'business_report'
                    ? 'text-sky-600 bg-sky-50 border-sky-200'
                    : 'text-gray-500 bg-slate-50 border-slate-200'
                  : isExpiry
                  ? 'text-amber-600 bg-amber-50 border-amber-200'
                  : 'text-emerald-600 bg-emerald-50 border-emerald-200';

                const body = (
                  <>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconClass}`}>
                      {isReport ? (
                        t === 'tianying_sim' ? (
                          <BrainCircuit className="w-5 h-5" />
                        ) : (
                          <FileText className="w-5 h-5" />
                        )
                      ) : isExpiry ? (
                        <Timer className="w-5 h-5" />
                      ) : (
                        <Rocket className="w-5 h-5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-gray-900 truncate">{m.title}</span>
                        <span
                          className={`text-[8px] font-black px-1.5 py-0.5 rounded-full border shrink-0 ${badgeClass}`}
                        >
                          {m.badge}
                        </span>
                        {m.unread && (
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0 animate-pulse" />
                        )}
                      </div>
                      <p className="text-[10px] text-gray-500 leading-relaxed mt-1 line-clamp-2">{m.desc}</p>
                      <span className="text-[9px] text-gray-400 font-mono mt-1 block">{m.time}</span>
                    </div>
                  </>
                );

                // 报告类可点击进入报告详情；开通/到期提醒为纯通知，不带跳转
                return isReport ? (
                  <button
                    key={m.id}
                    onClick={() => onOpenReport?.(t!)}
                    className="w-full text-left bg-white rounded-2xl border border-gray-100 p-3.5 flex items-center gap-3 active:scale-[0.99] transition-transform"
                  >
                    {body}
                    <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
                  </button>
                ) : (
                  <div
                    key={m.id}
                    className={`bg-white rounded-2xl p-3.5 flex items-start gap-3 border ${
                      isExpiry ? 'border-amber-200 bg-amber-50/40' : 'border-gray-100'
                    }`}
                  >
                    {body}
                  </div>
                );
              })}
              <p className="text-[9px] text-gray-400 text-center pt-1">
                报告生成与 AI 策略开通、到期均自动推送，点击报告卡片直接查看详情
              </p>
            </div>
          )}

          {/* ==================== 告警消息 ==================== */}
          {category === 'alarm' && (
            <div className="px-4 pb-6 pt-1">
              {/* 二级状态：未恢复 / 已恢复（仅告警口径） */}
              <div className="grid grid-cols-2 rounded-xl bg-white border border-gray-100 p-1 mb-3">
                {(
                  [
                    { key: 'unrecovered', label: '未恢复', count: unrecoveredAlarms.length },
                    { key: 'recovered', label: '已恢复', count: recoveredAlarms.length },
                  ] as const
                ).map((t) => (
                  <button
                    key={t.key}
                    id={`alarm_state_${t.key}`}
                    onClick={() => setAlarmState(t.key)}
                    className={`py-2 text-xs font-black rounded-lg transition-all relative ${
                      alarmState === t.key ? 'text-emerald-600' : 'text-gray-400'
                    }`}
                  >
                    {t.label}
                    <span className="text-[9px] font-mono ml-1 opacity-70">{t.count}</span>
                    {alarmState === t.key && (
                      <motion.span
                        layoutId="alarmStateUnderline"
                        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-emerald-500 rounded-full"
                      />
                    )}
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                <div className="text-[10px] text-gray-400 font-bold px-0.5">
                  {alarmState === 'recovered' ? '已恢复告警' : '未恢复告警'} · 共 {alarmList.length} 条
                  {onlyImportant && ' · 仅重要'}
                </div>

                {alarmList.length === 0 && (
                  <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
                    <Bell className="w-6 h-6 text-gray-300 mx-auto" />
                    <p className="text-[11px] text-gray-400 font-bold mt-2">
                      暂无{alarmState === 'recovered' ? '已恢复' : '未恢复'}告警
                    </p>
                  </div>
                )}

                {alarmList.map((m) => (
                  <div key={m.id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-xs">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-black text-gray-900">{m.title}</span>
                      {m.important && (
                        <span className="text-[8px] font-black text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                          重要
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {(
                        [
                          { label: '告警类型', value: m.alarmType },
                          { label: '设备名称', value: m.deviceName },
                          { label: '设备类型', value: m.deviceType },
                          { label: '设备SN', value: m.deviceSn },
                          { label: '发生时间', value: m.occurTime },
                          {
                            label: '恢复时间',
                            value: m.recoverTime ?? <span className="text-red-500 font-black">未恢复</span>,
                          },
                        ] as const
                      ).map((f) => (
                        <div
                          key={f.label}
                          className="rounded-lg bg-gradient-to-b from-sky-50/80 to-blue-50/50 px-2.5 py-2 border border-sky-100/60"
                        >
                          <span className="text-[9px] text-sky-600/80 font-bold block">{f.label}</span>
                          <span className="text-[10px] text-gray-800 font-bold break-all leading-snug mt-0.5 block">
                            {f.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
