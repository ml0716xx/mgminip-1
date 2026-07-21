/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Bell, AlertCircle, Sparkles, TrendingDown, HelpCircle } from 'lucide-react';

export const MessagesTab: React.FC = () => {
  const systemMessages = [
    {
      id: 1,
      type: 'warning',
      title: '负电价避险主动止损触发',
      time: '今天 11:30',
      desc: '监测到省电力交易中心发布 11:30 - 13:45 实时负电价告警。AI调度系统已自动发出光伏限电上网指令，并启动储能满额充电吸纳绿电，预计避免并网负电价倒贴亏损。',
      status: '已执行',
    },
    {
      id: 2,
      type: 'info',
      title: '7月份策略运行报告已生成',
      time: '昨天 08:00',
      desc: '上月度智能微网调度成效报告已汇总完毕！AI自动运行率达 80.6%，综合避险挽回损失 ¥580，并网消纳自用率提高 3.2%。点击功能菜单的[策略运行报告]即可阅读。',
      status: '未读',
    },
    {
      id: 3,
      type: 'alert',
      title: '变压器超温高载预警',
      time: '3天前',
      desc: '常州好迪2号母线主变压器绕组温升达到 85°C。AI系统已微调储能放电时段，执行削峰避峰策略平抑过载。',
      status: '已恢复',
    },
    {
      id: 4,
      type: 'info',
      title: '储能电池健康度(SOH)安全评估',
      time: '5天前',
      desc: '月度深度充放电自适应检验完成。1号电池堆健康度 98.2%，电池容量均衡性完美，无安全漂移隐患。',
      status: '已归档',
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs font-bold text-gray-400">微电网策略运行与系统告警日志</h3>
        <span className="text-[10px] text-gray-400">共 4 条记录</span>
      </div>

      <div className="space-y-3">
        {systemMessages.map((msg) => {
          const isWarning = msg.type === 'warning';
          const isAlert = msg.type === 'alert';
          const isUnread = msg.status === '未读';

          return (
            <div
              key={msg.id}
              className={`p-4 rounded-2xl border transition-all ${
                isWarning
                  ? 'bg-amber-50/50 border-amber-100'
                  : isAlert
                  ? 'bg-red-50/40 border-red-100'
                  : 'bg-white border-gray-100'
              } relative overflow-hidden shadow-xs`}
            >
              {isUnread && (
                <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              )}
              <div className="flex items-start gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                    isWarning
                      ? 'bg-amber-100/70 text-amber-600 border-amber-200'
                      : isAlert
                      ? 'bg-red-100/70 text-red-600 border-red-200'
                      : 'bg-sky-50 text-sky-600 border-sky-100'
                  }`}
                >
                  {isWarning ? (
                    <TrendingDown className="w-5 h-5" />
                  ) : isAlert ? (
                    <AlertCircle className="w-5 h-5" />
                  ) : (
                    <Bell className="w-5 h-5" />
                  )}
                </div>
                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-900">{msg.title}</span>
                    <span className="text-[9px] text-gray-400 font-mono">{msg.time}</span>
                  </div>
                  <p className="text-[10px] text-gray-500 leading-relaxed">{msg.desc}</p>
                  <div className="flex items-center justify-between pt-1.5 mt-1 border-t border-gray-50">
                    <span className="text-[8px] text-gray-400">状态: {msg.status}</span>
                    {isWarning && (
                      <span className="text-[9px] text-amber-600 font-bold bg-amber-50 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                        <Sparkles className="w-2.5 h-2.5 animate-pulse" /> 智能避险中
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
