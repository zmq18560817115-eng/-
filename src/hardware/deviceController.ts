import type { HardwareState, TreatmentParams } from '../types';
import {
  faultLabel,
  getDeviceStatus,
  pingDevice,
  postReset,
  postStop,
  postTare,
  postTherapy,
  type DeviceInfo,
  type DeviceStatus,
} from './deviceApi';

const DEVICE_IP_KEY = 'kneejoy_device_ip';

export function getStoredDeviceIp(): string {
  if (typeof window === 'undefined') return '';
  return (
    localStorage.getItem(DEVICE_IP_KEY) ??
    import.meta.env.VITE_DEVICE_IP ??
    ''
  ).trim();
}

export function setStoredDeviceIp(ip: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(DEVICE_IP_KEY, ip.trim());
}

export function resolveDeviceBaseUrl(override?: string): string {
  const ip = (override ?? getStoredDeviceIp()).trim();
  if (!ip) {
    throw new Error('请先在联调面板填写 ESP32 局域网 IP（如 192.168.1.100）');
  }
  return ip.startsWith('http') ? ip.replace(/\/+$/, '') : `http://${ip}`;
}

export function statusToHardwarePatch(status: DeviceStatus): Partial<HardwareState> {
  const running =
    !status.estop &&
    (status.force_l >= 1 || status.force_r >= 1 || status.heater_duty > 0);

  return {
    is_mock_mode: false,
    connection: 'wifi',
    is_running: running,
    left_force: Math.round(status.force_l),
    right_force: Math.round(status.force_r),
    temp: Math.round(status.temp),
    is_safety_clip_attached: !status.estop,
  };
}

export class DeviceController {
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private lastInfo: DeviceInfo | null = null;
  private lastStatus: DeviceStatus | null = null;

  get deviceInfo(): DeviceInfo | null {
    return this.lastInfo;
  }

  get lastDeviceStatus(): DeviceStatus | null {
    return this.lastStatus;
  }

  async connect(baseUrl?: string): Promise<{ info: DeviceInfo; status: DeviceStatus }> {
    const url = resolveDeviceBaseUrl(baseUrl);
    const result = await pingDevice(url);
    this.lastInfo = result.info;
    this.lastStatus = result.status;
    return result;
  }

  async startTherapy(
    params: Pick<TreatmentParams, 'left_force' | 'right_force' | 'temp' | 'vibration'>,
    baseUrl?: string
  ): Promise<void> {
    const url = resolveDeviceBaseUrl(baseUrl);
    await postTherapy(url, {
      left: params.left_force,
      right: params.right_force,
      temp: params.temp,
      vib: Math.min(2, Math.max(0, params.vibration)) as 0 | 1 | 2,
    });
    this.lastStatus = await getDeviceStatus(url);
  }

  async stop(baseUrl?: string): Promise<void> {
    const url = resolveDeviceBaseUrl(baseUrl);
    await postStop(url);
    this.lastStatus = await getDeviceStatus(url);
  }

  async reset(baseUrl?: string): Promise<void> {
    const url = resolveDeviceBaseUrl(baseUrl);
    await postReset(url);
    this.lastStatus = await getDeviceStatus(url);
  }

  async tare(baseUrl?: string): Promise<void> {
    const url = resolveDeviceBaseUrl(baseUrl);
    await postTare(url);
    this.lastStatus = await getDeviceStatus(url);
  }

  async pollOnce(baseUrl?: string): Promise<DeviceStatus> {
    const url = resolveDeviceBaseUrl(baseUrl);
    this.lastStatus = await getDeviceStatus(url);
    return this.lastStatus;
  }

  startPolling(onStatus: (status: DeviceStatus) => void, intervalMs = 1000, baseUrl?: string): void {
    this.stopPolling();
    const tick = async () => {
      try {
        const status = await this.pollOnce(baseUrl);
        onStatus(status);
      } catch {
        /* 轮询失败时不打断 UI */
      }
    };
    void tick();
    this.pollTimer = setInterval(tick, intervalMs);
  }

  stopPolling(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  formatAlert(status: DeviceStatus): string | null {
    if (status.estop) {
      return status.sw_estop
        ? '设备处于软件急停，请先复位或重新下发治疗参数'
        : '设备处于硬件急停，请检查急停按钮';
    }
    if (status.fault !== 0) return `设备故障：${faultLabel(status.fault)}`;
    if (status.heater_blocked) return '热垫超温保护已触发，加热已禁用';
    if (status.motor_l_end !== 0 || status.motor_r_end !== 0) {
      return '推杆已到达末端保护位置';
    }
    return null;
  }
}

export const deviceController = new DeviceController();
