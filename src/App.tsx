/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { ActiveTab } from './types';
import { WeChatShell } from './components/WeChatShell';
import { OverviewTab } from './components/OverviewTab';
import { FeaturesTab } from './components/FeaturesTab';
import { MessagesTab } from './components/MessagesTab';
import { WorkbenchTab } from './components/WorkbenchTab';
import { ReportPage } from './components/ReportPage';
import { ModePage } from './components/ModePage';
import { BizReportPage } from './components/BizReportPage';
import { TianyingSimPage } from './components/TianyingSimPage';
import { AiActivationStatus } from './data/overviewData';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, X } from 'lucide-react';

type FullScreenPage = 'mode' | 'report' | 'biz' | 'sim' | null;

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [pvCurtailmentView, setPvCurtailmentView] = useState<boolean>(true); // Default has permission (有权限)
  const [stationName, setStationName] = useState<string>('常州好迪机械有限公司');
  const [phoneMode, setPhoneMode] = useState<boolean>(true); // Elegant mobile simulation default
  const [fullScreen, setFullScreen] = useState<FullScreenPage>(null);
  const [aiStatus, setAiStatus] = useState<AiActivationStatus>('activated');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    // 连续触发时先清掉上一个定时器，避免旧 toast 的新计时把新提示提前关掉
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMessage(null), 2500);
  };

  /** 开通状态变更（经营报告／策略运行报告的「开通试用／开通正式」按钮、工作台演示开关） */
  const handleAiStatusChange = (s: AiActivationStatus) => {
    setAiStatus(s);
    showToast(
      s === 'trial'
        ? '已开通 AI 策略试用（7 天全功能体验）'
        : s === 'activated'
        ? '已开通 AI 策略正式运行'
        : '已切换为「未开通」状态',
    );
  };

  // Handle Menu Clicking
  const handleSelectFeature = (featureId: string) => {
    if (featureId === 'strategy_report') {
      setFullScreen('report');
    } else if (featureId === 'operating_mode') {
      setFullScreen('mode');
    } else if (featureId === 'business_report') {
      setFullScreen('biz');
    } else if (featureId === 'tianying_sim') {
      setFullScreen('sim');
    } else {
      // Elegant micro toast notification for unimplemented features
      const names: Record<string, string> = {
        fault_alarm: '故障报警监控',
        event_alarm: '事件分析系统',
        strategy_run: '实时策略调控',
        schedule_manage: '值班排班配置',
      };
      showToast(`「${names[featureId] || '该功能'}」正在紧密研发中，敬请期待！`);
    }
  };

  // 消息页报告推送 → 打开对应报告
  const handleOpenReport = (target: 'tianying_sim' | 'business_report' | 'strategy_report') => {
    if (target === 'tianying_sim') setFullScreen('sim');
    else if (target === 'business_report') setFullScreen('biz');
    else setFullScreen('report');
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab />;
      case 'features':
        return <FeaturesTab onSelectFeature={handleSelectFeature} stationName={stationName} />;
      case 'messages':
        return <MessagesTab onOpenReport={handleOpenReport} />;
      case 'workbench':
        return (
          <WorkbenchTab
            pvCurtailmentView={pvCurtailmentView}
            setPvCurtailmentView={setPvCurtailmentView}
            stationName={stationName}
            setStationName={setStationName}
            phoneMode={phoneMode}
            setPhoneMode={setPhoneMode}
            aiStatus={aiStatus}
            setAiStatus={handleAiStatusChange}
          />
        );
      default:
        return null;
    }
  };

  // 全屏页共用的手机壳样式
  const shellClass = phoneMode
    ? 'relative mx-auto w-[395px] h-[820px] bg-slate-900 rounded-[50px] p-3.5 shadow-2xl border-4 border-slate-800 shrink-0'
    : 'w-full max-w-[420px] h-[780px] bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100';

  const renderFullScreenPage = (page: Exclude<FullScreenPage, null>) => {
    const inner = (() => {
      switch (page) {
        case 'mode':
          return <ModePage onBack={() => setFullScreen(null)} />;
        case 'report':
          return (
            <ReportPage
              onBack={() => setFullScreen(null)}
              pvCurtailmentView={pvCurtailmentView}
              aiStatus={aiStatus}
              onSetAiStatus={handleAiStatusChange}
            />
          );
        case 'biz':
          return (
            <BizReportPage
              onBack={() => setFullScreen(null)}
              aiStatus={aiStatus}
              onSetAiStatus={handleAiStatusChange}
            />
          );
        case 'sim':
          return (
            <TianyingSimPage
              onBack={() => setFullScreen(null)}
              onOpenBizReport={() => setFullScreen('biz')}
            />
          );
      }
    })();

    return (
      <motion.div
        key={page}
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 50 }}
        transition={{ type: 'spring', damping: 25, stiffness: 240 }}
        className={shellClass}
      >
        {phoneMode ? (
          <div className="w-full h-full bg-white rounded-[38px] overflow-hidden relative shadow-inner border border-slate-950 flex flex-col pt-5">
            {inner}
          </div>
        ) : (
          <div className="w-full h-full bg-white flex flex-col">{inner}</div>
        )}
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center relative font-sans selection:bg-emerald-500/20 selection:text-emerald-900 overflow-hidden">
      {/* Background visual graphics for premium ambient */}
      <div className="absolute top-0 left-0 right-0 h-[450px] bg-gradient-to-b from-emerald-100/30 via-teal-50/10 to-transparent pointer-events-none" />
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-cyan-400/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Orcherstrating Container */}
      <div className="relative z-10 w-full flex items-center justify-center">
        <AnimatePresence mode="wait">
          {fullScreen ? (
            renderFullScreenPage(fullScreen)
          ) : (
            <motion.div
              key="shell"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.25 }}
            >
              <WeChatShell
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                stationName={stationName}
                phoneMode={phoneMode}
              >
                {renderActiveTab()}
              </WeChatShell>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Elegant Toast notification element */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-50 bg-gray-900/90 backdrop-blur-md border border-gray-800 text-white text-xs px-4 py-3 rounded-2xl flex items-center gap-2 shadow-2xl min-w-[260px] justify-between"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse shrink-0" />
              <span className="font-semibold">{toastMessage}</span>
            </div>
            <button onClick={() => setToastMessage(null)} className="text-gray-400">
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
