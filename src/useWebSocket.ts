import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Device, AlertNotification, SecurityEvent, AlertRule, FiberLink, DeviceStatus } from './types.ts';

export interface WebSocketState {
  isConnected: boolean;
  transport: string;
  lastEventTime: string | null;
  lastEventDescription: string | null;
}

interface UseWebSocketProps {
  onDeviceStatusChanged?: (payload: {
    device: Device;
    previousStatus: DeviceStatus;
    reason?: string;
    timestamp: string;
  }) => void;
  onDeviceUpdated?: (device: Device) => void;
  onDeviceCreated?: (device: Device) => void;
  onDeviceDeleted?: (payload: { id: string }) => void;
  onTelemetryBatch?: (batch: Partial<Device>[]) => void;
  onAlertNew?: (alert: AlertNotification) => void;
  onSecurityEvent?: (event: SecurityEvent) => void;
  onAlertRulesUpdated?: (rules: AlertRule[]) => void;
  onFiberUpdated?: (link: FiberLink) => void;
}

export function useWebSocket(props: UseWebSocketProps) {
  const [socketStatus, setSocketStatus] = useState<WebSocketState>({
    isConnected: false,
    transport: 'none',
    lastEventTime: null,
    lastEventDescription: null,
  });

  const socketRef = useRef<Socket | null>(null);
  const propsRef = useRef(props);

  // Keep propsRef updated to avoid reconnecting socket on every callback change
  useEffect(() => {
    propsRef.current = props;
  }, [props]);

  useEffect(() => {
    // Connect to same origin host
    const socket = io({
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 15,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setSocketStatus({
        isConnected: true,
        transport: socket.io.engine?.transport?.name || 'websocket',
        lastEventTime: new Date().toLocaleTimeString(),
        lastEventDescription: 'Real-Time WebSocket Stream Connected',
      });
    });

    socket.on('disconnect', (reason) => {
      setSocketStatus((prev) => ({
        ...prev,
        isConnected: false,
        lastEventDescription: `Disconnected: ${reason}`,
      }));
    });

    socket.on('device:status_changed', (payload) => {
      setSocketStatus((prev) => ({
        ...prev,
        lastEventTime: new Date().toLocaleTimeString(),
        lastEventDescription: `Status Change: ${payload.device.name} -> ${payload.device.status.toUpperCase()}`,
      }));
      propsRef.current.onDeviceStatusChanged?.(payload);
    });

    socket.on('device:updated', (device: Device) => {
      propsRef.current.onDeviceUpdated?.(device);
    });

    socket.on('device:created', (device: Device) => {
      setSocketStatus((prev) => ({
        ...prev,
        lastEventTime: new Date().toLocaleTimeString(),
        lastEventDescription: `New Device Provisioned: ${device.name}`,
      }));
      propsRef.current.onDeviceCreated?.(device);
    });

    socket.on('device:deleted', (payload: { id: string }) => {
      propsRef.current.onDeviceDeleted?.(payload);
    });

    socket.on('telemetry:batch', (batch: Partial<Device>[]) => {
      propsRef.current.onTelemetryBatch?.(batch);
    });

    socket.on('alert:new', (alert: AlertNotification) => {
      setSocketStatus((prev) => ({
        ...prev,
        lastEventTime: new Date().toLocaleTimeString(),
        lastEventDescription: `Alert: ${alert.deviceName} (${alert.triggerReason})`,
      }));
      propsRef.current.onAlertNew?.(alert);
    });

    socket.on('security:event', (event: SecurityEvent) => {
      propsRef.current.onSecurityEvent?.(event);
    });

    socket.on('alert_rules:updated', (rules: AlertRule[]) => {
      propsRef.current.onAlertRulesUpdated?.(rules);
    });

    socket.on('fiber:updated', (link: FiberLink) => {
      propsRef.current.onFiberUpdated?.(link);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return {
    socketStatus,
    socket: socketRef.current,
  };
}
