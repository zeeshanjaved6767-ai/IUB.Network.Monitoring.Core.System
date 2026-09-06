import { Device } from '../src/types.ts';

export interface PingResult {
  ipAddress: string;
  hostName: string;
  packetsTransmitted: number;
  packetsReceived: number;
  packetLossPercent: number;
  roundTripMinMs: number;
  roundTripAvgMs: number;
  roundTripMaxMs: number;
  jitterMs: number;
  ttl: number;
  status: 'SUCCESS' | 'WARNING' | 'FAILED';
  tracerouteHops: Array<{ hop: number; ip: string; hostname: string; timeMs: number }>;
  snmpTelemetry: {
    sysDescr: string;
    sysUpTime: string;
    ifSpeed: string;
    ifOperStatus: string;
    hrProcessorLoad: number;
    hrStorageUsedPercent: number;
    opticalRxPowerDbm?: number;
    opticalTxPowerDbm?: number;
  };
  timestamp: string;
}

export function runDeviceDiagnostics(device: Device): PingResult {
  const isOnline = device.status !== 'offline';
  const baseLatency = device.latencyMs || 1.2;
  const jitter = Number((Math.random() * 0.8 + 0.1).toFixed(2));
  const minMs = Math.max(0.2, Number((baseLatency - 0.4).toFixed(2)));
  const maxMs = Number((baseLatency + 1.2).toFixed(2));

  // Generate realistic campus traceroute hops based on Campus
  const hops = [
    { hop: 1, ip: '10.10.0.1', hostname: 'bjc-noc-core-gw.iub.edu.pk', timeMs: 0.5 },
    { hop: 2, ip: '10.10.0.148', hostname: 'bjc-odf-fiber-148c.iub.edu.pk', timeMs: 0.8 },
  ];

  if (device.campus === 'OLD') {
    hops.push({ hop: 3, ip: '10.20.0.1', hostname: 'old-campus-gw.iub.edu.pk', timeMs: 2.1 });
  } else if (device.campus === 'RAILWAY') {
    hops.push({ hop: 3, ip: '10.30.0.1', hostname: 'railway-gw.iub.edu.pk', timeMs: 2.9 });
  } else if (device.campus === 'RYK') {
    hops.push({ hop: 3, ip: '172.16.100.1', hostname: 'pern-mpls-transit-ryk.iub.edu.pk', timeMs: 6.2 });
    hops.push({ hop: 4, ip: '10.40.0.1', hostname: 'ryk-subcampus-core.iub.edu.pk', timeMs: 8.1 });
  } else if (device.campus === 'BWN') {
    hops.push({ hop: 3, ip: '172.16.101.1', hostname: 'pern-fiber-bwn.iub.edu.pk', timeMs: 11.4 });
    hops.push({ hop: 4, ip: '10.50.0.2', hostname: 'bwn-academic-core.iub.edu.pk', timeMs: 14.2 });
  } else if (device.campus === 'LQT') {
    hops.push({ hop: 3, ip: '10.60.0.1', hostname: 'liaquatpur-gw.iub.edu.pk', timeMs: 6.5 });
  }

  hops.push({
    hop: hops.length + 1,
    ip: device.ipAddress,
    hostname: `${device.name.toLowerCase()}.iub.internal`,
    timeMs: isOnline ? Number((baseLatency + Math.random() * 0.4).toFixed(2)) : 999,
  });

  return {
    ipAddress: device.ipAddress,
    hostName: device.name,
    packetsTransmitted: 5,
    packetsReceived: isOnline ? 5 : 0,
    packetLossPercent: isOnline ? (device.packetLoss || 0) : 100,
    roundTripMinMs: isOnline ? minMs : 0,
    roundTripAvgMs: isOnline ? baseLatency : 0,
    roundTripMaxMs: isOnline ? maxMs : 0,
    jitterMs: isOnline ? jitter : 0,
    ttl: isOnline ? 64 : 0,
    status: isOnline ? (device.status === 'warning' ? 'WARNING' : 'SUCCESS') : 'FAILED',
    tracerouteHops: hops,
    snmpTelemetry: {
      sysDescr: `${device.model} Software Version 17.06.04b / Cisco-IOS-XE / Enterprise IUB NOC Build`,
      sysUpTime: device.uptime,
      ifSpeed: device.portsTotal >= 96 ? '100 Gbps Aggregate' : device.portsTotal >= 48 ? '40 Gbps Fiber' : '10 Gbps SFP+',
      ifOperStatus: isOnline ? 'up(1)' : 'down(2)',
      hrProcessorLoad: isOnline ? device.cpuUsage : 0,
      hrStorageUsedPercent: isOnline ? device.memoryUsage : 0,
      opticalRxPowerDbm: device.fiberCores ? Number((-3.2 - (device.fiberCores / 148) * 2.1).toFixed(2)) : undefined,
      opticalTxPowerDbm: device.fiberCores ? -3.2 : undefined,
    },
    timestamp: new Date().toISOString(),
  };
}
