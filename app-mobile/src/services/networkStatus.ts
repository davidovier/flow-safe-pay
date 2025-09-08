import { useEffect, useState } from 'react';
import NetInfo, { NetInfoState, NetInfoStateType } from '@react-native-community/netinfo';

export interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: NetInfoStateType;
  isWifiEnabled: boolean | null;
  strength: number | null;
}

class NetworkStatusManager {
  private listeners: Set<(status: NetworkStatus) => void> = new Set();
  private currentStatus: NetworkStatus = {
    isConnected: true,
    isInternetReachable: null,
    type: NetInfoStateType.unknown,
    isWifiEnabled: null,
    strength: null,
  };

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    // Get initial network state
    const state = await NetInfo.fetch();
    this.updateStatus(state);

    // Subscribe to network state changes
    NetInfo.addEventListener(this.handleNetworkChange);
  }

  private handleNetworkChange = (state: NetInfoState): void => {
    this.updateStatus(state);
  };

  private updateStatus(state: NetInfoState): void {
    const newStatus: NetworkStatus = {
      isConnected: state.isConnected ?? false,
      isInternetReachable: state.isInternetReachable,
      type: state.type,
      isWifiEnabled: state.type === NetInfoStateType.wifi ? state.isWifiEnabled : null,
      strength: this.getSignalStrength(state),
    };

    this.currentStatus = newStatus;
    this.notifyListeners(newStatus);
  }

  private getSignalStrength(state: NetInfoState): number | null {
    // Get signal strength based on connection type
    if (state.type === NetInfoStateType.wifi && state.details) {
      return (state.details as any).strength || null;
    }

    if (state.type === NetInfoStateType.cellular && state.details) {
      return (state.details as any).cellularGeneration || null;
    }

    return null;
  }

  private notifyListeners(status: NetworkStatus): void {
    this.listeners.forEach(listener => {
      try {
        listener(status);
      } catch (error) {
        console.error('Network status listener error:', error);
      }
    });
  }

  public getStatus(): NetworkStatus {
    return { ...this.currentStatus };
  }

  public subscribe(listener: (status: NetworkStatus) => void): () => void {
    this.listeners.add(listener);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  public async checkConnection(): Promise<boolean> {
    try {
      const state = await NetInfo.fetch();
      return state.isConnected ?? false;
    } catch {
      return false;
    }
  }

  public isOnline(): boolean {
    return this.currentStatus.isConnected && 
           this.currentStatus.isInternetReachable !== false;
  }

  public isWifi(): boolean {
    return this.currentStatus.type === NetInfoStateType.wifi && 
           this.currentStatus.isWifiEnabled === true;
  }

  public isCellular(): boolean {
    return this.currentStatus.type === NetInfoStateType.cellular;
  }

  public getConnectionQuality(): 'excellent' | 'good' | 'poor' | 'offline' {
    if (!this.isOnline()) {
      return 'offline';
    }

    if (this.isWifi()) {
      const strength = this.currentStatus.strength;
      if (strength !== null) {
        if (strength > 70) return 'excellent';
        if (strength > 40) return 'good';
        return 'poor';
      }
      return 'good'; // Assume good for wifi without strength info
    }

    if (this.isCellular()) {
      const generation = this.currentStatus.strength;
      if (generation !== null) {
        if (generation >= 4) return 'excellent'; // 4G/5G
        if (generation >= 3) return 'good';      // 3G
        return 'poor';                           // 2G or lower
      }
    }

    return 'good'; // Default for unknown connection types
  }
}

// Singleton instance
export const networkStatusManager = new NetworkStatusManager();

// React hook for using network status
export function useNetworkStatus(): NetworkStatus & {
  quality: 'excellent' | 'good' | 'poor' | 'offline';
  isOnline: boolean;
  isWifi: boolean;
  isCellular: boolean;
} {
  const [status, setStatus] = useState<NetworkStatus>(networkStatusManager.getStatus());

  useEffect(() => {
    const unsubscribe = networkStatusManager.subscribe(setStatus);
    return unsubscribe;
  }, []);

  return {
    ...status,
    quality: networkStatusManager.getConnectionQuality(),
    isOnline: networkStatusManager.isOnline(),
    isWifi: networkStatusManager.isWifi(),
    isCellular: networkStatusManager.isCellular(),
  };
}

// Helper functions
export function waitForConnection(timeout: number = 30000): Promise<void> {
  return new Promise((resolve, reject) => {
    if (networkStatusManager.isOnline()) {
      resolve();
      return;
    }

    const timeoutId = setTimeout(() => {
      unsubscribe();
      reject(new Error('Connection timeout'));
    }, timeout);

    const unsubscribe = networkStatusManager.subscribe((status) => {
      if (status.isConnected && status.isInternetReachable !== false) {
        clearTimeout(timeoutId);
        unsubscribe();
        resolve();
      }
    });
  });
}

export async function executeWithConnection<T>(
  operation: () => Promise<T>,
  timeout: number = 30000
): Promise<T> {
  await waitForConnection(timeout);
  return operation();
}