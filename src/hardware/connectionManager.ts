import { MockHardwareAdapter, beginConnectSession, cancelMockConnect } from './mockAdapter';
import { WifiHttpAdapter } from './wifiHttpAdapter';
import type {
  ConnectResult,
  ConnectionProgress,
  HardwareConnectionAdapter,
  HardwareTransport,
} from './types';

const hardwareMode = import.meta.env.VITE_HARDWARE_MODE ?? 'mock';

let adapter: HardwareConnectionAdapter =
  hardwareMode === 'wifi' ? new WifiHttpAdapter() : new MockHardwareAdapter();

/** 接入真实硬件时：setHardwareAdapter(new YourBleAdapter()) */
export function setHardwareAdapter(next: HardwareConnectionAdapter): void {
  adapter = next;
}

export function getHardwareAdapter(): HardwareConnectionAdapter {
  return adapter;
}

export async function connectHardwareDevice(
  transport: HardwareTransport,
  onProgress?: (progress: ConnectionProgress) => void
): Promise<ConnectResult> {
  beginConnectSession();
  return adapter.connect(transport, onProgress);
}

export async function disconnectHardwareDevice(): Promise<void> {
  cancelMockConnect();
  await adapter.disconnect();
}

export function cancelHardwareConnection(): void {
  cancelMockConnect();
}
