/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 消息通知 · 数据层
 * --------------------------------------------------------------------------
 * 「消息通知」一级分类下的全部推送类型（共 6 类）：
 *   1. 天盈 AI 仿真报告推送到达      kind = report   target = tianying_sim
 *   2. 经营分析报告生成              kind = report   target = business_report
 *   3. 策略运行报告生成              kind = report   target = strategy_report
 *   4. AI 策略开通（试运行 / 正式）  kind = activation
 *   5. AI 策略即将到期（试运行 / 正式）kind = expiry
 *
 * 时间线按一条完整的用户旅程排列（新 → 旧），保证先后关系自洽：
 *   09-25 试运行开通 → 10-03 试运行即将到期 → 10-05 正式运行开通
 *   → 昨天 正式运行即将到期 / 经营报告生成 → 今天 天盈仿真报告推送
 *
 * 未读数由 unreadNoticeCount 派生（小程序底部「消息」红点用它），不要在组件里写死。
 */

export type NoticeTarget = 'tianying_sim' | 'business_report' | 'strategy_report';

/** report：报告生成/推送（可点击进入报告）；activation：开通提醒；expiry：到期提醒 */
export type NoticeKind = 'report' | 'activation' | 'expiry';

export interface NoticeMsg {
  id: number;
  kind: NoticeKind;
  title: string;
  time: string;
  desc: string;
  /** 角标文案 */
  badge: string;
  /** 仅 kind = 'report'：点击跳转的报告页 */
  target?: NoticeTarget;
  unread?: boolean;
}

export const NOTICE_MESSAGES: NoticeMsg[] = [
  {
    id: 101,
    kind: 'report',
    title: '天盈 AI 仿真报告已生成',
    time: '今天 08:00',
    desc: '2026年09月天盈 AI 仿真回测完成：AI 策略仿真总收益 69,030 元，较实际运行提升 12.8%，点击查看完整对比报告。',
    target: 'tianying_sim',
    badge: '天盈 AI',
    unread: true,
  },
  {
    id: 102,
    kind: 'expiry',
    title: 'AI 策略正式运行服务即将到期',
    time: '昨天 09:00',
    desc: '正式运行服务将于 2026-10-31 到期，到期后 AI 策略将暂停自动调度。请及时续期以延续托管服务。',
    badge: '到期提醒',
    unread: true,
  },
  {
    id: 103,
    kind: 'report',
    title: '9月经营分析报告已生成',
    time: '昨天 08:30',
    desc: '本月微网总收益 7.51 万元，光伏消纳率 74.64%，度电成本优化至 0.32 元/kWh。点击查看月度经营分析。',
    target: 'business_report',
    badge: '经营报告',
    unread: true,
  },
  {
    id: 104,
    kind: 'activation',
    title: 'AI 策略正式运行已开通',
    time: '10-05 10:00',
    desc: 'AI 智能全景协同调度已转入正式运行，全部收益与优化指标按实际结算口径统计。',
    badge: '开通提醒',
  },
  {
    id: 105,
    kind: 'expiry',
    title: 'AI 策略试运行即将到期',
    time: '10-03 09:00',
    desc: '试运行剩余 3 天，到期后 AI 策略将暂停自动调度。可升级正式运行，避免收益中断。',
    badge: '到期提醒',
  },
  {
    id: 106,
    kind: 'activation',
    title: 'AI 策略试运行已开通',
    time: '09-25 10:00',
    desc: '已开通 AI 智能全景协同调度试运行，试用期 30 天。期内收益与优化指标按仿真估算口径统计。',
    badge: '开通提醒',
  },
  {
    id: 107,
    kind: 'report',
    title: '7月份策略运行报告已生成',
    time: '08-01 08:00',
    desc: '上月度智能微网调度成效报告已汇总完毕！AI 自动运行率达 80.6%，综合避险挽回损失 ¥580。点击查看。',
    target: 'strategy_report',
    badge: '策略报告',
  },
];

/** 未读条数（底部导航「消息」红点用） */
export const unreadNoticeCount = NOTICE_MESSAGES.filter((m) => m.unread).length;
