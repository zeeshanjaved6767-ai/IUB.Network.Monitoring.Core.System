import { Device, HistoricalMetricPoint, CollectorReportPayload, CollectorToken } from '../src/types.ts';
import { db } from './db.ts';
import { 
  broadcastDeviceStatusChanged, 
  broadcastDeviceUpdated, 
  broadcastDeviceCreated, 
  broadcastAlertNew, 
  broadcastTelemetryBatch 
} from './websocket.ts';
import crypto from 'crypto';

// In-memory collector tokens store (with default admin tokens)
const DEFAULT_TOKENS: CollectorToken[] = [
  {
    id: 'tok-iub-core-master',
    name: 'IUB Master NOC Collector Agent',
    token: 'iub-collector-sec-9a8f4c1e7b2',
    campus: 'ALL',
    createdAt: new Date().toISOString(),
    active: true,
  },
  {
    id: 'tok-bjc-datacenter',
    name: 'BJC Data Center Linux Probe',
    token: 'iub-probe-bjc-44318c',
    campus: 'BJC',
    createdAt: new Date().toISOString(),
    active: true,
  },
];

let collectorTokens: CollectorToken[] = [...DEFAULT_TOKENS];

// Watchdog tracking last heartbeat timestamps
const deviceHeartbeats = new Map<string, number>();

export function getCollectorTokens(): CollectorToken[] {
  return collectorTokens;
}

export function createCollectorToken(name: string, campus: any): CollectorToken {
  const tokenString = 'iub-col-' + crypto.randomBytes(12).toString('hex');
  const newToken: CollectorToken = {
    id: 'tok-' + Date.now(),
    name: name || 'Remote Server Collector',
    token: tokenString,
    campus: campus || 'ALL',
    createdAt: new Date().toISOString(),
    active: true,
  };
  collectorTokens.push(newToken);
  return newToken;
}

export function revokeCollectorToken(id: string): boolean {
  const initialLen = collectorTokens.length;
  collectorTokens = collectorTokens.filter((t) => t.id !== id);
  return collectorTokens.length < initialLen;
}

export function validateCollectorToken(tokenProvided?: string): boolean {
  if (!tokenProvided) return false;
  const clean = tokenProvided.replace('Bearer ', '').trim();
  return collectorTokens.some((t) => t.active && t.token === clean);
}

// Ingestion Handler for metrics received from external devices/servers
export function ingestDeviceMetrics(payload: CollectorReportPayload): {
  success: boolean;
  device: Device;
  historyPoint: HistoricalMetricPoint;
} {
  const now = new Date();
  const timestampIso = now.toISOString();

  // Find existing device or auto-register
  let device = db.getDeviceById(payload.deviceId);

  if (!device) {
    // Auto-register device if hostname or IP is supplied
    device = db.addDevice({
      name: payload.hostname || payload.deviceId,
      type: 'router',
      model: 'Linux/Server Managed Node',
      ipAddress: payload.ipAddress || '10.10.99.1',
      macAddress: payload.macAddress || '52:54:00:' + crypto.randomBytes(3).toString('hex'),
      campus: payload.campus || 'BJC',
      building: 'Data Center Node',
      roomNo: 'Rack Tier-1',
      rackId: 'RACK-AGENT',
      portsTotal: 2,
      portsActive: 1,
      status: payload.status || 'online',
      latencyMs: payload.latencyMs ?? 1.2,
      packetLoss: payload.packetLoss ?? 0,
      cpuUsage: payload.cpuUsage ?? 25,
      memoryUsage: payload.memoryUsage ?? 40,
      temperatureC: 36,
      bandwidthInMbps: payload.bandwidthInMbps ?? 150,
      bandwidthOutMbps: payload.bandwidthOutMbps ?? 120,
      snmpCommunity: 'public',
      snmpVersion: 'v2c',
      prtgSensorId: 'PRTG-COL-' + Date.now().toString().slice(-4),
      zabbixHostId: 'ZAB-COL-' + Date.now().toString().slice(-4),
      suricataThreatLevel: 'safe',
    });
    broadcastDeviceCreated(device);
  }

  const prevStatus = device.status;
  const newStatus = payload.status || 'online';

  // Update device fields
  const updated = db.updateDevice(device.id, {
    status: newStatus,
    lastSeen: timestampIso,
    uptime: payload.uptime || device.uptime,
    latencyMs: payload.latencyMs ?? device.latencyMs,
    packetLoss: payload.packetLoss ?? device.packetLoss,
    cpuUsage: payload.cpuUsage ?? device.cpuUsage,
    memoryUsage: payload.memoryUsage ?? device.memoryUsage,
    bandwidthInMbps: payload.bandwidthInMbps ?? device.bandwidthInMbps,
    bandwidthOutMbps: payload.bandwidthOutMbps ?? device.bandwidthOutMbps,
  });

  const finalDevice = updated || device;

  // Record historical datapoint
  const historyPoint: HistoricalMetricPoint = {
    deviceId: finalDevice.id,
    timestamp: timestampIso,
    latencyMs: finalDevice.latencyMs,
    packetLoss: finalDevice.packetLoss,
    bandwidthInMbps: finalDevice.bandwidthInMbps,
    bandwidthOutMbps: finalDevice.bandwidthOutMbps,
    cpuUsage: finalDevice.cpuUsage,
    memoryUsage: finalDevice.memoryUsage,
    status: finalDevice.status,
  };

  db.addHistoricalMetric(historyPoint);

  // Update heartbeat map
  deviceHeartbeats.set(finalDevice.id, now.getTime());

  // Check if status changed
  if (prevStatus !== newStatus) {
    broadcastDeviceStatusChanged({
      device: finalDevice,
      previousStatus: prevStatus,
      reason: `Collector agent reported status transition to ${newStatus.toUpperCase()}`,
      timestamp: timestampIso,
    });
  } else {
    broadcastDeviceUpdated(finalDevice);
  }

  return {
    success: true,
    device: finalDevice,
    historyPoint,
  };
}

// Watchdog that periodically inspects device heartbeats and marks timed out devices as offline
export function initCollectorWatchdog(intervalMs = 15000, timeoutThresholdMs = 60000) {
  setInterval(() => {
    try {
      const now = Date.now();
      const devices = db.getDevices();

      for (const dev of devices) {
        const lastHeartbeat = deviceHeartbeats.get(dev.id);
        if (lastHeartbeat && dev.status === 'online') {
          const elapsed = now - lastHeartbeat;
          if (elapsed > timeoutThresholdMs) {
            // Heartbeat missed! Mark device as offline
            const prevStatus = dev.status;
            const updated = db.updateDevice(dev.id, {
              status: 'offline',
              packetLoss: 100,
              latencyMs: 999,
            });

            if (updated) {
              console.log(`[Collector Watchdog] Device ${dev.name} missed heartbeat (${Math.round(elapsed / 1000)}s ago). Marking OFFLINE.`);
              
              broadcastDeviceStatusChanged({
                device: updated,
                previousStatus: prevStatus,
                reason: `Heartbeat timeout: No metric report received for ${Math.round(elapsed / 1000)} seconds.`,
                timestamp: new Date().toISOString(),
              });

              // Also create alert notification
              const alert = db.createAlert({
                deviceId: updated.id,
                deviceName: updated.name,
                campus: updated.campus,
                building: updated.building,
                roomNo: updated.roomNo,
                channel: 'whatsapp',
                recipient: 'NOC Incident Response',
                status: 'delivered',
                message: `CRITICAL ALERT: Device ${updated.name} at ${updated.campus} (${updated.building}) missed collector heartbeat and has dropped OFFLINE.`,
                triggerReason: 'Collector Heartbeat Lost',
                resolved: false,
              });
              broadcastAlertNew(alert);
            }
          }
        }
      }
    } catch (err) {
      console.error('[Collector Watchdog] Error in monitoring cycle:', err);
    }
  }, intervalMs);

  console.log(`[Collector Watchdog] Started with ${intervalMs / 1000}s check interval and ${timeoutThresholdMs / 1000}s timeout threshold.`);
}

// Generate ready-to-use collector agent code snippets
export function generateCollectorSnippets(token: string, hostUrl: string) {
  const curlSnippet = `curl -X POST "${hostUrl}/api/collector/report" \\
  -H "Authorization: Bearer ${token}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "deviceId": "SRV-LINUX-01",
    "hostname": "iub-web-edge-01",
    "campus": "BJC",
    "status": "online",
    "latencyMs": 2.4,
    "packetLoss": 0,
    "bandwidthInMbps": 450,
    "bandwidthOutMbps": 380,
    "cpuUsage": 32,
    "memoryUsage": 58,
    "uptime": "84d 12h 10m"
  }'`;

  const pythonSnippet = `#!/usr/bin/env python3
import time
import psutil
import requests

COLLECTOR_URL = "${hostUrl}/api/collector/report"
API_TOKEN = "${token}"
DEVICE_ID = "SRV-EDGE-NODE-01"
CAMPUS = "BJC"

def send_metrics():
    cpu = psutil.cpu_percent(interval=1)
    ram = psutil.virtual_memory().percent
    net = psutil.net_io_counters()
    
    payload = {
        "deviceId": DEVICE_ID,
        "campus": CAMPUS,
        "status": "online",
        "cpuUsage": cpu,
        "memoryUsage": ram,
        "latencyMs": 1.5,
        "packetLoss": 0,
        "bandwidthInMbps": round(net.bytes_recv / (1024 * 1024), 2),
        "bandwidthOutMbps": round(net.bytes_sent / (1024 * 1024), 2),
    }
    
    headers = {
        "Authorization": f"Bearer {API_TOKEN}",
        "Content-Type": "application/json"
    }
    
    try:
        r = requests.post(COLLECTOR_URL, json=payload, headers=headers, timeout=5)
        print(f"[{time.strftime('%X')}] Metrics Sent: HTTP {r.status_code}")
    except Exception as e:
        print(f"Error sending metrics: {e}")

if __name__ == "__main__":
    print("Starting IUB Network Collector Agent...")
    while True:
        send_metrics()
        time.sleep(10)
`;

  const bashSnippet = `#!/usr/bin/env bash
COLLECTOR_URL="${hostUrl}/api/collector/report"
API_TOKEN="${token}"
DEVICE_ID="SRV-BASH-AGENT"

while true; do
  CPU=$(top -bn1 | grep "Cpu(s)" | awk '{print $2 + $4}')
  RAM=$(free | awk '/Mem:/ {printf("%.1f"), $3/$2 * 100}')
  
  curl -s -X POST "$COLLECTOR_URL" \\
    -H "Authorization: Bearer $API_TOKEN" \\
    -H "Content-Type: application/json" \\
    -d "{\\"deviceId\\":\\"$DEVICE_ID\\",\\"status\\":\\"online\\",\\"cpuUsage\\":$CPU,\\"memoryUsage\\":$RAM,\\"latencyMs\\":1.8,\\"packetLoss\\":0}"
    
  echo "[$(date +%T)] Telemetry reported to IUB NOC"
  sleep 10
done
`;

  return {
    curl: curlSnippet,
    python: pythonSnippet,
    bash: bashSnippet,
  };
}
