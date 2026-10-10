/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 站点口径 · 单一真源
 * --------------------------------------------------------------------------
 * 全端所有页面统一显示同一个站点，避免同一份原型里出现两个站名/两个地区。
 * 取值与 web 端 -2.0 的 `components/tianyingReportData.ts` 的 TY_META / BIZ_META 一致：
 *   · TY_META.station = '康达新材料-1#站'
 *   · TY_META.region  = '上海市奉贤区'
 *   · BIZ_META.entity = '上海康达新材料'
 * 改站点只改这里，组件与数据层都不写死。
 */

export const STATION = {
  /** 完整站名（小程序顶部下拉 / 页面标题 / 报告头部） */
  name: '康达新材料-1#站',
  /** 页内站点栏用的短名（同一站，避免与顶部栏重复显示同一串站名） */
  short: '1#站',
  /** 站点主体（公司名） */
  entity: '上海康达新材料',
  /** 所在地区 */
  region: '上海市奉贤区',
  /** 站点位置描述句（经营分析报告正文用） */
  siteText: '站点位于上海市奉贤区。',
} as const;

/** 开发者调试台可切换的演示站点（同一园区，仅站号不同） */
export const DEMO_STATIONS = ['康达新材料-1#站', '康达新材料-2#站', '康达新材料-3#站'] as const;
