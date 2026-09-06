import { Server as SocketIOServer, Socket } from 'socket.io';
import type { Server as HttpServer } from 'http';
import { Device, DeviceStatus, AlertNotification, SecurityEvent, AlertRule, FiberLink } from '../src/types.ts';

let io: SocketIOServer | null = null;
let connectedClients = 0;

export function initWebSocket(httpServer: HttpServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
  });

  io.on('connection', (socket: Socket) => {
    connectedClients++;
    console.log(`[WebSocket] Client connected: ${socket.id} (Total: ${connectedClients})`);

    // Acknowledge connection to client with current state
    socket.emit('connection:ack', {
      status: 'connected',
      clientId: socket.id,
      timestamp: new Date().toISOString(),
      server: 'IUB Network Monitoring Core',
    });

    socket.on('disconnect', () => {
      connectedClients = Math.max(0, connectedClients - 1);
      console.log(`[WebSocket] Client disconnected: ${socket.id} (Remaining: ${connectedClients})`);
    });
  });

  return io;
}

export function getConnectedClientsCount(): number {
  return connectedClients;
}

export function broadcastDeviceStatusChanged(payload: {
  device: Device;
  previousStatus: DeviceStatus;
  reason?: string;
  timestamp: string;
}) {
  if (!io) return;
  console.log(`[WebSocket Broadcast] device:status_changed -> ${payload.device.name} is now ${payload.device.status.toUpperCase()}`);
  io.emit('device:status_changed', payload);
  io.emit('device:updated', payload.device);
}

export function broadcastDeviceUpdated(device: Device) {
  if (!io) return;
  io.emit('device:updated', device);
}

export function broadcastDeviceCreated(device: Device) {
  if (!io) return;
  console.log(`[WebSocket Broadcast] device:created -> ${device.name}`);
  io.emit('device:created', device);
}

export function broadcastDeviceDeleted(deviceId: string) {
  if (!io) return;
  console.log(`[WebSocket Broadcast] device:deleted -> ${deviceId}`);
  io.emit('device:deleted', { id: deviceId });
}

export function broadcastTelemetryBatch(devices: Partial<Device>[]) {
  if (!io) return;
  io.emit('telemetry:batch', devices);
}

export function broadcastAlertNew(alert: AlertNotification) {
  if (!io) return;
  console.log(`[WebSocket Broadcast] alert:new -> ${alert.deviceName} (${alert.triggerReason})`);
  io.emit('alert:new', alert);
}

export function broadcastSecurityEvent(event: SecurityEvent) {
  if (!io) return;
  console.log(`[WebSocket Broadcast] security:event -> ${event.eventType} on ${event.targetDevice}`);
  io.emit('security:event', event);
}

export function broadcastAlertRulesUpdated(rules: AlertRule[]) {
  if (!io) return;
  console.log(`[WebSocket Broadcast] alert_rules:updated -> ${rules.length} active rules`);
  io.emit('alert_rules:updated', rules);
}

export function broadcastFiberLinkUpdated(link: FiberLink) {
  if (!io) return;
  io.emit('fiber:updated', link);
}
