import React, { useState } from 'react';
import { ArrowDownToLine, Square } from 'lucide-react';
import {
  deviceController,
  getStoredDeviceIp,
  statusToHardwarePatch,
} from '../hardware/deviceController';
import type { MotorSide } from '../hardware/deviceApi';
import type { HardwareState } from '../types';

interface MotorRetractPanelProps {
  hardwareState: HardwareState;
  onUpdateHardware?: (updates: Partial<HardwareState>) => void;
  onLog?: (message: string) => void;
  compact?: boolean;
}

const SIDE_LABELS: Record<MotorSide, string> = {
  left: '左侧',
  right: '右侧',
  all: '双侧',
};

export default function MotorRetractPanel({
  hardwareState,
  onUpdateHardware,
  onLog,
  compact = false,
}: MotorRetractPanelProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSide, setActiveSide] = useState<MotorSide | null>(null);

  const canUseDeviceApi =
    hardwareState.connection === 'wifi' &&
    !hardwareState.is_mock_mode &&
    Boolean(getStoredDeviceIp());

  const deviceStatus = deviceController.lastDeviceStatus;
  const estopBlocked = deviceStatus?.estop === true;

  const refreshStatus = async () => {
    const next = await deviceController.pollOnce();
    onUpdateHardware?.(statusToHardwarePatch(next));
    return next;
  };

  const runMotor = async (label: string, fn: () => Promise<void>, side?: MotorSide) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
      await refreshStatus();
      if (side) setActiveSide(side);
      onLog?.(`[推杆缩回] ${label}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '操作失败';
      setError(msg);
      onLog?.(`[推杆缩回失败] ${label} → ${msg}`);
    } finally {
      setBusy(false);
    }
  };

  const handleRetract = (side: MotorSide) =>
    runMotor(`${SIDE_LABELS[side]}开始缩回`, () => deviceController.retractMotor(side), side);

  const handleStopRetract = () =>
    runMotor('停止缩回', async () => {
      await deviceController.stopMotorRetract('all');
      setActiveSide(null);
    });

  if (hardwareState.connection !== 'wifi') {
    return null;
  }

  return (
    <div
      className={`rounded-2xl border border-amber-200/80 bg-amber-50/70 ${
        compact ? 'p-3' : 'p-4'
      }`}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-black text-amber-950">推杆手动缩回</p>
          <p className="mt-0.5 text-[10px] leading-snug text-amber-800/90">
            治疗结束后力闭环不会自动缩回，请手动缩回推杆；缩回为持续运动，完成后请点「停止缩回」。
          </p>
        </div>
        {activeSide && (
          <span className="shrink-0 rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-900">
            {SIDE_LABELS[activeSide]}缩回中
          </span>
        )}
      </div>

      {!canUseDeviceApi && (
        <p className="mb-2 text-[10px] font-bold text-amber-700">
          请通过 Wi-Fi 连接真实设备（硬件联调面板填写 IP）后使用。
        </p>
      )}

      {deviceStatus && (deviceStatus.motor_l_end !== 0 || deviceStatus.motor_r_end !== 0) && (
        <p className="mb-2 text-[10px] font-bold text-rose-700">
          推杆已触达末端保护（左 {deviceStatus.motor_l_end} / 右 {deviceStatus.motor_r_end}）
        </p>
      )}

      <div className={`grid gap-2 ${compact ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-4'}`}>
        {(['left', 'right', 'all'] as MotorSide[]).map((side) => (
          <button
            key={side}
            type="button"
            disabled={busy || !canUseDeviceApi || estopBlocked || hardwareState.is_running}
            onClick={() => handleRetract(side)}
            className="flex items-center justify-center gap-1 rounded-xl border border-amber-300/80 bg-white px-2 py-2 text-[11px] font-black text-amber-950 shadow-sm transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-45"
          >
            <ArrowDownToLine size={13} />
            {SIDE_LABELS[side]}缩回
          </button>
        ))}
        <button
          type="button"
          disabled={busy || !canUseDeviceApi || estopBlocked}
          onClick={handleStopRetract}
          className={`flex items-center justify-center gap-1 rounded-xl bg-slate-800 px-2 py-2 text-[11px] font-black text-white shadow-sm transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-45 ${
            compact ? 'col-span-2' : 'col-span-2 sm:col-span-1'
          }`}
        >
          <Square size={12} />
          停止缩回
        </button>
      </div>

      {hardwareState.is_running && (
        <p className="mt-2 text-[10px] text-amber-800">请先结束治疗，再进行推杆缩回。</p>
      )}

      {estopBlocked && (
        <p className="mt-2 text-[10px] font-bold text-rose-700">设备处于急停状态，请先复位后再缩回。</p>
      )}

      {error && <p className="mt-2 text-[10px] font-bold text-rose-700">{error}</p>}
    </div>
  );
}
