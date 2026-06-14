/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import { Radio, AlertCircle, Shield, Cable, RefreshCw, Layers, Plug, AlertTriangle } from 'lucide-react';
import { HardwareState } from '../types';

interface HardwareSimulatorProps {
  hardwareState: HardwareState;
  onUpdateHardware: (updates: Partial<HardwareState>) => void;
  serialLogs: string[];
  onClearLogs: () => void;
  onSendHardwareAction: (commandLog: string) => void;
}

export default function HardwareSimulator({
  hardwareState,
  onUpdateHardware,
  serialLogs,
  onClearLogs,
  onSendHardwareAction
}: HardwareSimulatorProps) {
  
  // Ref to automatically scroll the logs box
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [serialLogs]);

  // Handle safety clip unplug
  const handleToggleSafetyClip = () => {
    const nextState = !hardwareState.is_safety_clip_attached;
    
    if (!nextState) {
      // Disconnected safety clip -> halt therapy immediately
      onUpdateHardware({
        is_safety_clip_attached: false,
        is_running: false,
      });
      onSendHardwareAction(`[安全断电机制触发] 物理检测环卸扣脱开！硬件中断启动。气缸压瞬释为0.0N，声光蜂鸣器 HZ_BUZ 激活，APP强制阻截！`);
    } else {
      onUpdateHardware({
        is_safety_clip_attached: true
      });
      onSendHardwareAction(`[系统安全复位] 物理防夹安全滑环(Safety-Clip)插脚扣紧，继电器高压允许线圈接通。安全预检通过。`);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-[32px] p-6 text-slate-100 flex flex-col gap-5 h-full relative select-none">
      
      {/* 1. COMPONENT HEADER */}
      <div className="flex justify-between items-center shrink-0">
        <div className="flex items-center gap-2">
          <Layers className="text-violet-400" size={20} />
          <div>
            <h2 className="text-sm font-bold font-display tracking-tight text-white">智慧套筒膝部物理理疗器</h2>
            <span className="text-[10px] text-zinc-400 font-mono tracking-widest uppercase">
              Smart Knee-Appraisal Device v2.0 (Physical Hardware Mockup)
            </span>
          </div>
        </div>
        
        {/* Status indicator pill */}
        <span className={`text-[9px] px-2.5 py-1 font-mono font-bold tracking-widest rounded-full uppercase shadow-lg ${
          hardwareState.is_running 
            ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 animate-pulse'
            : 'bg-zinc-800 border border-zinc-750 text-zinc-400'
        }`}>
          {hardwareState.is_running ? '● Running' : '待命 Ready'}
        </span>
      </div>

      {/* 2. REAL-TIME INTERACTIVE SVG HARDWARE DIAGRAM */}
      <div className="bg-zinc-950/80 border border-zinc-900 rounded-2xl p-5 flex flex-col items-center justify-center relative shadow-inner flex-1 min-h-[220px]">
        {/* Connection health wires indicators */}
        <div className="absolute top-3 left-4 flex items-center gap-1.5 text-[9px] font-mono text-zinc-500 font-bold">
          <Cable size={12} className={`${hardwareState.is_safety_clip_attached ? 'text-violet-400' : 'text-rose-500 animate-ping'}`} />
          <span>安全栓状态：</span>
          <span className={hardwareState.is_safety_clip_attached ? 'text-indigo-400' : 'text-rose-500 font-bold'}>
            {hardwareState.is_safety_clip_attached ? '已紧扣 (ATTACHED)' : '受阻断 (UNPLUGGED)'}
          </span>
        </div>

        {/* SVG Diagram Canvas */}
        <div className="w-full max-w-[280px] h-40 flex items-center justify-center mt-2">
          <svg className="w-full h-full" viewBox="0 0 160 100" fill="none">
            {/* Ambient Background Glow matching state */}
            {hardwareState.is_running && (
              <circle cx="80" cy="50" r="35" className="animate-thermal" fill="rgba(239, 68, 68, 0.15)" />
            )}

            {/* Guide Grid lines */}
            <line x1="10" y1="50" x2="150" y2="50" stroke="#1E293B" strokeWidth="0.5" strokeDasharray="2,2" />
            <line x1="80" y1="10" x2="80" y2="90" stroke="#1E293B" strokeWidth="0.5" strokeDasharray="2,2" />

            {/* Left Pneumatic Piston Cylinder (Traction Actuator) */}
            <g transform="translate(15, 30)">
              {/* Actuator body frame */}
              <rect x="0" y="5" width="22" height="30" rx="3" fill="#3F3F46" stroke="#52525B" strokeWidth="1" />
              {/* Dynamic extended pushrod shaft */}
              <rect 
                x="8" 
                y="-15" 
                width="6" 
                height="22" 
                fill="#A1A1AA" 
                className="transition-all duration-700"
                style={{ transform: `translateY(${hardwareState.is_running ? (30 - hardwareState.left_force) * 0.4 : 10}px)` }}
              />
              {/* Joint node */}
              <circle x="11" y="0" r="2.5" fill="#E4E4E7" />
              <text x="11" y="23" textAnchor="middle" fill="#FFFFFF" fontSize="6" fontFamily="monospace" fontWeight="bold">L-Rod</text>
              <text x="11" y="32" textAnchor="middle" fill="#A78BFA" fontSize="5.5" fontFamily="monospace" fontWeight="bold">
                {hardwareState.is_running ? `${hardwareState.left_force}N` : '0N'}
              </text>
            </g>

            {/* Right Pneumatic Piston Cylinder (Traction Actuator) */}
            <g transform="translate(123, 30)">
              {/* Actuator body frame */}
              <rect x="0" y="5" width="22" height="30" rx="3" fill="#3F3F46" stroke="#52525B" strokeWidth="1" />
              {/* Dynamic extended pushrod shaft */}
              <rect 
                x="8" 
                y="-15" 
                width="6" 
                height="22" 
                fill="#A1A1AA" 
                className="transition-all duration-700"
                style={{ transform: `translateY(${hardwareState.is_running ? (30 - hardwareState.right_force) * 0.4 : 10}px)` }}
              />
              {/* Joint node */}
              <circle x="11" y="0" r="2.5" fill="#E4E4E7" />
              <text x="11" y="23" textAnchor="middle" fill="#FFFFFF" fontSize="6" fontFamily="monospace" fontWeight="bold">R-Rod</text>
              <text x="11" y="32" textAnchor="middle" fill="#A78BFA" fontSize="5.5" fontFamily="monospace" fontWeight="bold">
                {hardwareState.is_running ? `${hardwareState.right_force}N` : '0N'}
              </text>
            </g>

            {/* Knee joint wrap in center */}
            <g transform="translate(52, 20)">
              {/* Soft knee protector outer contour */}
              <rect x="2" y="2" width="52" height="56" rx="16" fill="#18181B" stroke="#27272A" strokeWidth="1.5" />
              {/* Outer logo branding strip */}
              <rect x="6" y="26" width="44" height="8" rx="2" fill="#5E4F9E" opacity="0.3" />
              
              {/* Thermal heating elements indicator */}
              <path 
                d="M 12,18 C 18,16 22,22 28,18 C 34,14 38,20 44,18" 
                fill="none" 
                stroke={hardwareState.is_running ? "#EF4444" : "#27272A"} 
                strokeWidth="1.5" 
                strokeLinecap="round"
                className={hardwareState.is_running ? "animate-pulse" : ""} 
              />
              <path 
                d="M 12,32 C 18,30 22,36 28,32 C 34,28 38,34 44,32" 
                fill="none" 
                stroke={hardwareState.is_running ? "#EF4444" : "#27272A"} 
                strokeWidth="1.5" 
                strokeLinecap="round"
                className={hardwareState.is_running ? "animate-pulse" : ""} 
              />
              <path 
                d="M 12,46 C 18,44 22,50 28,46 C 34,42 38,48 44,46" 
                fill="none" 
                stroke={hardwareState.is_running ? "#EF4444" : "#27272A"} 
                strokeWidth="1.5" 
                strokeLinecap="round"
                className={hardwareState.is_running ? "animate-pulse" : ""} 
              />

              {/* Central temperature digits indicator */}
              <rect x="16" y="23" width="24" height="14" rx="4" fill="#09090B" stroke="#18181B" strokeWidth="1" />
              <text 
                x="28" 
                y="32" 
                textAnchor="middle" 
                fill={hardwareState.is_running ? "#EF4444" : "#52525B"} 
                fontSize="8" 
                fontFamily="monospace" 
                fontWeight="bold"
              >
                {hardwareState.is_running ? `${hardwareState.temp}℃` : '26℃'}
              </text>
              <text x="28" y="48" textAnchor="middle" fill="#FFFFFF" opacity="0.4" fontSize="5" fontFamily="sans-serif">
                {hardwareState.vibration === 0 ? 'Vib: OFF' : hardwareState.vibration === 1 ? 'Vib: LOW' : 'Vib: HIGH'}
              </text>
            </g>

            {/* Shock wave indicators (vibration effects) */}
            {hardwareState.is_running && hardwareState.vibration > 0 && (
              <g stroke="#14B8A6" strokeWidth="0.8" strokeLinecap="round" opacity="0.6">
                <path d="M 44,40 Q 42,45 44,50" className="animate-pulse" />
                <path d="M 41,38 Q 38,45 41,52" className="animate-pulse" />
                <path d="M 116,40 Q 118,45 116,50" className="animate-pulse" />
                <path d="M 119,38 Q 122,45 119,52" className="animate-pulse" />
              </g>
            )}
          </svg>
        </div>

        {/* Dynamic status string */}
        <div className="text-center text-[10px] text-zinc-400 font-mono flex items-center gap-2 mt-1 select-none">
          {hardwareState.is_running ? (
            <span className="flex items-center gap-1 text-emerald-400 font-bold">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></span>
              气驱推杆牵拉、恒温红外热敷及低频振动同步中...
            </span>
          ) : (
            <span>待连接物理端口：@COM3 / 蓝牙设备: HMT_Knee_2.0</span>
          )}
        </div>
      </div>

      {/* 3. PHYSICAL INTERACTIVE CRITICAL FAILURE TRIGGERS PANEL */}
      <div className="bg-slate-950 p-4 border border-slate-800 rounded-2xl flex flex-col gap-2.5 shrink-0">
        <span className="text-[10px] text-zinc-400 font-bold font-mono tracking-wider flex items-center gap-1">
          <Shield size={12} className="text-violet-400" /> PHYSICAL SAFETY TESTS FAILSFE ENGINE
        </span>
        
        <div className="grid grid-cols-2 gap-3 text-xs">
          {/* A. Safety clip switch tool */}
          <button
            onClick={handleToggleSafetyClip}
            className={`py-2 px-3 border border-transparent rounded-xl text-[10.5px] font-bold text-white cursor-pointer transition active:scale-95 flex items-center justify-center gap-1.5 ${
              hardwareState.is_safety_clip_attached
                ? 'bg-rose-950/40 border border-rose-900/50 hover:bg-rose-900/40 text-rose-300'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md'
            }`}
          >
            <Plug size={13} strokeWidth={2.2} />
            {hardwareState.is_safety_clip_attached ? '拔出安全插栓(模拟断电)' : '插入安全插栓(复位正常)'}
          </button>

          {/* B. Mechanical Slip simulation trigger */}
          <button
            onClick={() => {
              if (hardwareState.is_running) {
                onUpdateHardware({ is_running: false });
                onSendHardwareAction(`[气阀防滑爆锁] 阻传感器检测到“膝腔防转扭矩”超过过荷 1.25r.m.s，空载放空阀瞬发启动 (SOL_VALVE=1)，拉力瞬降！`);
              } else {
                onSendHardwareAction(`[安全自检] 扭过扭检测阻正常。待命状态中。`);
              }
            }}
            className="py-2 px-3 bg-zinc-800 border-zinc-750 hover:bg-zinc-700 active:scale-95 rounded-xl text-[10.5px] font-bold text-zinc-300 transition cursor-pointer flex items-center justify-center gap-1.5"
          >
            <AlertTriangle size={13} strokeWidth={2.2} />
            模拟防转断开过压
          </button>
        </div>
      </div>

      {/* 4. REAL-TIME MULTICAST SERIAL UART LOGS LOGGER */}
      <div className="flex flex-col gap-2 flex-1 min-h-[160px]">
        <div className="flex justify-between items-center text-zinc-400 select-none">
          <span className="text-[10px] font-bold font-mono tracking-wider flex items-center gap-1">
            <Radio size={12} className="text-teal-400" /> MOCK SERIAL PORT TRANSCEIVER CONSOLE
          </span>
          <button
            onClick={onClearLogs}
            className="text-[9px] text-zinc-500 hover:text-zinc-300 underline font-mono cursor-pointer"
          >
            Clear Terminal
          </button>
        </div>

        {/* Logs container box */}
        <div className="bg-black/90 p-4 border border-zinc-800 rounded-2xl flex-1 max-h-[180px] overflow-y-auto font-mono text-[9px] leading-relaxed text-emerald-400 scrollbar-thin select-text">
          {serialLogs.length === 0 ? (
            <div className="text-zinc-600 italic">Waiting for serial actions... Try starting treatments or assessments on the phone.</div>
          ) : (
            <div className="flex flex-col gap-1.5 word-break">
              {serialLogs.map((log, index) => (
                <div key={index} className="border-b border-zinc-950 pb-1 last:border-b-0">
                  <span className="text-zinc-500 font-bold mr-1.5">[{new Date().toLocaleTimeString('zh-CN', { hour12: false })}]</span>
                  <span className={
                    log.includes('安全断电') || log.includes('报警') || log.includes('阻断') 
                      ? 'text-rose-400 font-bold' 
                      : log.includes('[AI') || log.includes('匹配')
                        ? 'text-teal-300 font-bold'
                        : log.includes('指令') || log.includes('STxCMD')
                          ? 'text-yellow-300'
                          : 'text-emerald-400'
                  }>
                    {log}
                  </span>
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
