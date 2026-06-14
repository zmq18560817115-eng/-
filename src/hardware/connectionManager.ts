import { MockHardwareAdapter, beginConnectSession, cancelMockConnect } from './mockAdapter';
import type {
  ConnectResult,
  ConnectionProgress,
  HardwareConnectionAdapter,
  HardwareTransport,
} from './types';

let adapter: HardwareConnectionAdapter = new MockHardwareAdapter();

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
