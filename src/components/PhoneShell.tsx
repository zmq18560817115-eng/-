/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Bluetooth, BellRing } from 'lucide-react';
import { AppNotification } from '../types';

/** iOS 16 Pro 蜂窝信号条 */
function IOSCellularBars() {
  const heights = [4, 6, 8, 10];
  return (
    <div className="flex items-end gap-[1.5px]" style={{ height: 10 }}>
      {heights.map((h, i) => (
        <div
          key={i}
          className="w-[3px] rounded-[0.5px] bg-black"
          style={{ height: h }}
        />
      ))}
    </div>
  );
}

/** iOS 电池图标（百分比在左侧单独显示） */
function IOSBatteryIcon({ low }: { low: boolean }) {
  const stroke = low ? '#ff3b30' : '#000000';
  return (
    <svg width="27" height="13" viewBox="0 0 27 13" fill="none" aria-hidden>
      <rect
        x="0.5"
        y="0.5"
        width="22"
        height="12"
        rx="3.5"
        stroke={stroke}
        strokeWidth="1"
      />
      <path
        d="M24 4.5V8.5C25.1 8.2 26 7.2 26 6C26 4.8 25.1 3.8 24 3.5V4.5Z"
        fill={stroke}
        opacity="0.45"
      />
    </svg>
  );
}

/** iOS Wi-Fi 图标 */
function IOSWifiIcon() {
  return (
    <svg width="16" height="12" viewBox="0 0 16 12" fill="none" aria-hidden>
      <path
        d="M8 11.2C8.55 11.2 9 10.75 9 10.2C9 9.65 8.55 9.2 8 9.2C7.45 9.2 7 9.65 7 10.2C7 10.75 7.45 11.2 8 11.2Z"
        fill="black"
      />
      <path
        d="M4.5 7.8C5.85 6.65 7.55 6 8 6C8.45 6 10.15 6.65 11.5 7.8L12.55 6.6C10.85 5.15 8.95 4.35 8 4.35C7.05 4.35 5.15 5.15 3.45 6.6L4.5 7.8Z"
        fill="black"
      />
      <path
        d="M1.2 4.5C3.65 2.45 6.75 1.2 8 1.2C9.25 1.2 12.35 2.45 14.8 4.5L15.85 3.3C13.1 1.05 9.65 0 8 0C6.35 0 2.9 1.05 0.15 3.3L1.2 4.5Z"
        fill="black"
      />
    </svg>
  );
}

/** iPhone 16 Pro — 402×874 pt logical viewport @3x (1206×2622 px) */
const IP16_PRO = {
  screenW: 402,
  screenH: 874,
  bezel: 12,
  statusBarH: 59,
  homeIndicatorH: 34,
  outerRadius: 55,
  innerRadius: 43,
  dynamicIslandW: 126,
  dynamicIslandH: 37,
} as const;

const IP16_PRO_OUTER_W = IP16_PRO.screenW + IP16_PRO.bezel * 2;
const IP16_PRO_OUTER_H = IP16_PRO.screenH + IP16_PRO.bezel * 2;

interface PhoneShellProps {
  children: React.ReactNode;
  batteryLevel: number;
  connectionStatus: 'disconnected' | 'bluetooth' | 'wifi';
  activeNotification: AppNotification | null;
  onClearNotification: () => void;
  onViewPrescription?: () => void;
  currentRole: 'patient' | 'doctor' | 'family';
  onRoleClick: (role: 'patient' | 'doctor' | 'family') => void;
}

export default function PhoneShell({
  children,
  batteryLevel,
  connectionStatus,
  activeNotification,
  onClearNotification,
  onViewPrescription,
  currentRole,
  onRoleClick,
}: PhoneShellProps) {
  // Update time digits dynamically
  const [timeStr, setTimeStr] = useState('10:12');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      let hrs = now.getHours().toString().padStart(2, '0');
      let mins = now.getMinutes().toString().padStart(2, '0');
      setTimeStr(`${hrs}:${mins}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="relative mx-auto w-full select-none"
      style={{ maxWidth: IP16_PRO_OUTER_W }}
    >
      {/* Side physical buttons (visual details) — scaled to 16 Pro body height */}
      <div className="absolute top-[124px] -left-[3px] w-[3px] h-[35px] bg-slate-300 rounded-l-md border-r border-slate-400"></div>
      <div className="absolute top-[180px] -left-[3px] w-[3px] h-[50px] bg-slate-400 rounded-l-md border-r border-slate-500"></div>
      <div className="absolute top-[247px] -left-[3px] w-[3px] h-[50px] bg-slate-400 rounded-l-md border-r border-slate-500"></div>
      <div className="absolute top-[168px] -right-[3px] w-[3px] h-[65px] bg-slate-400 rounded-r-md border-l border-slate-500"></div>

      {/* Main Container Phone Shell */}
      <div
        className="relative w-full bg-slate-900 shadow-2xl ring-12 ring-slate-800/90 flex flex-col overflow-hidden"
        style={{
          width: IP16_PRO_OUTER_W,
          height: IP16_PRO_OUTER_H,
          borderRadius: IP16_PRO.outerRadius,
          padding: IP16_PRO.bezel,
        }}
      >
        
        {/* Anti-glare Inner highlight bevel */}
        <div
          className="absolute inset-x-2 top-2 h-[10px] bg-gradient-to-b from-white/10 to-transparent pointer-events-none z-50"
          style={{ borderTopLeftRadius: IP16_PRO.innerRadius, borderTopRightRadius: IP16_PRO.innerRadius }}
        ></div>
        
        {/* Device screen frame container */}
        <div
          className="relative bg-slate-50 flex flex-col overflow-hidden text-slate-800 font-sans border border-slate-950/20 shadow-inner shrink-0"
          style={{
            width: IP16_PRO.screenW,
            height: IP16_PRO.screenH,
            borderRadius: IP16_PRO.innerRadius,
          }}
        >
          
          {/* 1. iPhone 16 Pro SYSTEM STATUS BAR */}
          <div
            className="relative bg-white shrink-0 select-none z-40"
            style={{ height: IP16_PRO.statusBarH }}
          >
            {/* Dynamic Island — 悬浮于顶栏中央 */}
            <div
              className="absolute left-1/2 -translate-x-1/2 bg-black z-50"
              style={{
                top: 11,
                width: IP16_PRO.dynamicIslandW,
                height: IP16_PRO.dynamicIslandH,
                borderRadius: IP16_PRO.dynamicIslandH / 2,
              }}
            >
              {/* 前置摄像头 */}
              <div
                className="absolute rounded-full bg-[#141416]"
                style={{
                  width: 10,
                  height: 10,
                  left: 18,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06)',
                }}
              />
              {/* 隐私指示绿点（设备已连接时显示） */}
              {connectionStatus !== 'disconnected' && (
                <div
                  className="absolute rounded-full bg-[#30D158]"
                  style={{
                    width: 6,
                    height: 6,
                    right: 18,
                    top: '50%',
                    transform: 'translateY(-50%)',
                  }}
                />
              )}
            </div>

            {/* 时间 + 状态图标行 */}
            <div
              className="absolute inset-x-0 flex items-center justify-between text-black"
              style={{ top: 21, height: 22, paddingLeft: 27, paddingRight: 27 }}
            >
              <span
                className="font-display tabular-nums leading-none"
                style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em' }}
              >
                {timeStr}
              </span>

              <div className="flex items-center gap-[5px]">
                <IOSCellularBars />
                <span
                  className="font-display leading-none"
                  style={{ fontSize: 13, fontWeight: 600, marginLeft: 1 }}
                >
                  5G
                </span>
                {connectionStatus === 'wifi' && <IOSWifiIcon />}
                {connectionStatus === 'bluetooth' && (
                  <Bluetooth size={14} strokeWidth={2.5} className="text-black" />
                )}
                <span
                  className="font-display tabular-nums leading-none"
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    marginLeft: 2,
                    color: batteryLevel < 20 ? '#ff3b30' : '#000000',
                  }}
                >
                  {batteryLevel}%
                </span>
                <IOSBatteryIcon low={batteryLevel < 20} />
              </div>
            </div>
          </div>

          {/* 2. DYNAMIC ISLAND POP-UP ALERTS (Nudges / Prescriptions) */}
          {activeNotification && (
            <div className="absolute inset-x-3 top-14 bg-indigo-950/95 backdrop-blur-xl text-white rounded-2xl shadow-2xl p-4.5 z-50 border border-indigo-500/20 animate-in slide-in-from-top duration-300">
              <div className="flex gap-3 items-start">
                <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-lg shrink-0">
                  <BellRing size={18} className="animate-bounce" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-300 tracking-wider uppercase font-display">
                      {activeNotification.type === 'nudge' && '家人催促关怀'}
                      {activeNotification.type === 'prescription' && '权威医生处方'}
                      {activeNotification.type === 'alarm' && '设备断安全警报'}
                      {activeNotification.type === 'system' && '系统更新提议'}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">{activeNotification.timestamp}</span>
                  </div>
                  <h4 className="text-sm font-semibold mt-1 text-slate-100 font-display leading-tight">
                    {activeNotification.title}
                  </h4>
                  <p className="text-xs text-zinc-300 mt-1 lines-clamp-2 leading-relaxed">
                    {activeNotification.message}
                  </p>
                  
                  {/* Action Bar */}
                  <div className="mt-3 flex gap-2 justify-end">
                    <button
                      onClick={onClearNotification}
                      className="px-3 py-1 bg-white/10 hover:bg-white/20 active:scale-95 transition text-[11px] font-semibold text-white rounded-md cursor-pointer"
                    >
                      忽略
                    </button>
                    {activeNotification.type === 'prescription' && (
                      <button
                        onClick={() => {
                          if (onViewPrescription) {
                            onViewPrescription();
                          } else {
                            onClearNotification();
                            onRoleClick('patient');
                          }
                        }}
                        className="px-3.5 py-1 bg-indigo-600 hover:bg-indigo-500 active:scale-95 transition text-[11px] font-semibold text-white rounded-md shadow-md shadow-indigo-700/20 cursor-pointer"
                      >
                        去查看
                      </button>
                    )}
                    {activeNotification.type === 'nudge' && (
                      <button
                        onClick={() => {
                          onClearNotification();
                          onRoleClick('patient');
                        }}
                        className="px-3.5 py-1 bg-indigo-600 hover:bg-indigo-500 active:scale-95 transition text-[11px] font-semibold text-white rounded-md shadow-md shadow-indigo-700/20 cursor-pointer"
                      >
                        去签到理疗
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3. TERMINAL APPLICATION CONTENT INTERSPACE */}
          <div className="flex-1 bg-slate-50 flex flex-col relative overflow-hidden">
            {children}
          </div>

          {/* 4. PHYSICAL VIRTUAL HOME INDICATOR */}
          <div
            className="bg-white/95 backdrop-blur shadow-inner flex items-center justify-center shrink-0 z-40 select-none pb-1.5 border-t border-slate-100"
            style={{ height: IP16_PRO.homeIndicatorH }}
          >
            <div className="w-32 h-[4px] bg-slate-300 rounded-full hover:bg-slate-400 transition cursor-pointer"></div>
          </div>
        </div>
      </div>
      
      {/* Visual Labels beneath Device Frame */}
      <div className="mt-3 text-center">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-full text-xs font-semibold text-indigo-700 shadow-sm font-display">
          <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
          Neumorphic Mobile Terminal Simulator
        </span>
      </div>
    </div>
  );
}
