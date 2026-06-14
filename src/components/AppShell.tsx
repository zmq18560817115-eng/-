/**
 * 全屏应用壳：真机浏览器全宽显示，无 iPhone 模拟外框
 */

import React from 'react';
import { BellRing, Bluetooth, Wifi } from 'lucide-react';
import { AppNotification } from '../types';

interface AppShellProps {
  children: React.ReactNode;
  batteryLevel: number;
  connectionStatus: 'disconnected' | 'bluetooth' | 'wifi';
  activeNotification: AppNotification | null;
  onClearNotification: () => void;
  onViewPrescription?: () => void;
  onRoleClick: (role: 'patient' | 'doctor' | 'family') => void;
}

export default function AppShell({
  children,
  batteryLevel,
  connectionStatus,
  activeNotification,
  onClearNotification,
  onViewPrescription,
  onRoleClick,
}: AppShellProps) {
  return (
    <div className="relative mx-auto flex min-h-[100dvh] w-full max-w-[480px] flex-col bg-slate-50 text-slate-800 antialiased shadow-none sm:shadow-xl sm:ring-1 sm:ring-slate-200/80">
      {/* 精简顶栏：连接与电量（非 iOS 模拟状态栏） */}
      <header
        className="sticky top-0 z-40 flex shrink-0 items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 py-2.5 backdrop-blur-md"
        style={{
          paddingTop: 'max(0.625rem, env(safe-area-inset-top))',
        }}
      >
        <span className="text-sm font-semibold text-slate-800 font-display">膝悦 KneeJoy</span>
        <div className="flex items-center gap-2 text-[11px] font-medium text-slate-500">
          {connectionStatus === 'wifi' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700">
              <Wifi size={12} /> Wi-Fi
            </span>
          )}
          {connectionStatus === 'bluetooth' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-indigo-700">
              <Bluetooth size={12} /> 已连接
            </span>
          )}
          {connectionStatus === 'disconnected' && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-500">未连接设备</span>
          )}
          <span className="tabular-nums text-slate-400">{batteryLevel}%</span>
        </div>
      </header>

      {activeNotification && (
        <div
          className="absolute inset-x-3 top-[calc(env(safe-area-inset-top)+3.25rem)] z-50 rounded-2xl border border-indigo-500/20 bg-indigo-950/95 p-4 text-white shadow-2xl backdrop-blur-xl animate-in slide-in-from-top duration-300"
        >
          <div className="flex items-start gap-3">
            <div className="shrink-0 rounded-xl bg-indigo-600 p-2.5 text-white shadow-lg">
              <BellRing size={18} className="animate-bounce" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 font-display">
                  {activeNotification.type === 'nudge' && '家人催促关怀'}
                  {activeNotification.type === 'prescription' && '权威医生处方'}
                  {activeNotification.type === 'alarm' && '设备安全警报'}
                  {activeNotification.type === 'system' && '系统更新提议'}
                </span>
                <span className="font-mono text-[10px] text-zinc-400">{activeNotification.timestamp}</span>
              </div>
              <h4 className="mt-1 text-sm font-semibold leading-tight text-slate-100 font-display">
                {activeNotification.title}
              </h4>
              <p className="mt-1 lines-clamp-2 text-xs leading-relaxed text-zinc-300">
                {activeNotification.message}
              </p>
              <div className="mt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClearNotification}
                  className="cursor-pointer rounded-md bg-white/10 px-3 py-1 text-[11px] font-semibold text-white transition hover:bg-white/20 active:scale-95"
                >
                  忽略
                </button>
                {activeNotification.type === 'prescription' && (
                  <button
                    type="button"
                    onClick={() => {
                      if (onViewPrescription) onViewPrescription();
                      else {
                        onClearNotification();
                        onRoleClick('patient');
                      }
                    }}
                    className="cursor-pointer rounded-md bg-indigo-600 px-3.5 py-1 text-[11px] font-semibold text-white shadow-md shadow-indigo-700/20 transition hover:bg-indigo-500 active:scale-95"
                  >
                    去查看
                  </button>
                )}
                {activeNotification.type === 'nudge' && (
                  <button
                    type="button"
                    onClick={() => {
                      onClearNotification();
                      onRoleClick('patient');
                    }}
                    className="cursor-pointer rounded-md bg-indigo-600 px-3.5 py-1 text-[11px] font-semibold text-white shadow-md shadow-indigo-700/20 transition hover:bg-indigo-500 active:scale-95"
                  >
                    去签到理疗
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <main
        className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-slate-50"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {children}
      </main>
    </div>
  );
}
