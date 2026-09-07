export type CampusId = 'BJC' | 'OLD' | 'RAILWAY' | 'RYK' | 'BWN' | 'LQT';

export interface CampusInfo {
  id: CampusId;
  name: string;
  shortName: string;
  city: string;
  totalDevices: number;
  onlineDevices: number;
  fiberStatus: 'Optimal' | 'Degraded' | 'Fault';
  coreBandwidth: string;
  nocLead: string;
}

export type DeviceType = 
  | 'router'
  | 'switch'
  | 'access_point'
  | 'ip_phone'
  | 'rack'
  | 'fiber_cable'
  | 'camera';

export type DeviceStatus = 'online' | 'offline' | 'warning' | 'maintenance';

export interface Device {
  id: string;
  name: string;
  type: DeviceType;
  model: string;
  ipAddress: string;
  macAddress: string;
  campus: CampusId;
  building: string;
  roomNo: string;
  rackId: string;
  portsTotal: number;
  portsActive: number;
  status: DeviceStatus;
  lastSeen: string;
  uptime: string;
  latencyMs: number;
  packetLoss: number;
  cpuUsage: number;
  memoryUsage: number;
  temperatureC: number;
  bandwidthInMbps: number;
  bandwidthOutMbps: number;
  snmpCommunity: string;
  snmpVersion: 'v2c' | 'v3';
  fiberCores?: 148 | 96 | 48 | 24 | 12 | number;
  prtgSensorId: string;
  zabbixHostId: string;
  suricataThreatLevel: 'safe' | 'low' | 'medium' | 'high' | 'blocked';
  notes?: string;
  vlanId?: number;
  deviceNumber?: string;
  deviceLocation?: string;
  switchLocation?: string;
  switchBuilding?: string;
  switchRoom?: string;
  switchModel?: string;
  switchPort?: string;
  devicePort?: string;
  offTime?: string;
  downtimeDuration?: string;
}

export interface FiberCore {
  coreNumber: number;
  tubeNumber: number;
  colorName: string;
  hexColor: string;
  status: 'active' | 'spare' | 'dark' | 'faulty';
  service: string;
  attenuationDb: number;
  txPowerDbm?: number;
  rxPowerDbm?: number;
}

export interface FiberLink {
  id: string;
  cableName: string;
  totalCores: 148 | 96 | 48 | 24 | 12;
  sourceCampus: CampusId;
  sourceBuilding: string;
  destCampus: CampusId;
  destBuilding: string;
  distanceKm: number;
  activeCoresCount: number;
  darkCoresCount: number;
  averageAttenuationDb: number;
  status: 'healthy' | 'warning' | 'cut';
  cableType: 'Armored Single-Mode OS2' | 'Direct Burial Multimode OM4' | 'Aerial Self-Supporting ADSS';
  cores: FiberCore[];
}

export interface SecurityEvent {
  id: string;
  timestamp: string;
  source: 'Suricata-IDS' | 'Wazuh-SIEM' | 'PRTG-Probe' | 'Zabbix-Agent';
  severity: 'critical' | 'high' | 'warning' | 'info';
  eventType: string;
  targetDevice: string;
  targetIp: string;
  attackerIp: string;
  actionTaken: string;
  details: string;
}

export interface AlertNotification {
  id: string;
  timestamp: string;
  deviceId: string;
  deviceName: string;
  campus: CampusId;
  building: string;
  roomNo: string;
  channel: 'whatsapp' | 'email' | 'all';
  recipient: string;
  status: 'delivered' | 'sent' | 'pending' | 'failed';
  message: string;
  triggerReason: string;
  resolved: boolean;
  ruleId?: string;
  ruleName?: string;
}

export interface BandwidthThresholdConfig {
  enabled: boolean;
  thresholdType: 'percentage' | 'absolute_mbps';
  thresholdValue: number; // e.g. 90 for 90% utilization or 900 for 900 Mbps
  interfaceDirection: 'in' | 'out' | 'aggregate';
  comparison: 'greater_than' | 'greater_equal';
}

export interface AlertRule {
  id: string;
  name: string;
  enabled: boolean;
  deviceTypes: (DeviceType | 'ALL')[];
  campuses: (CampusId | 'ALL')[];
  severity: 'critical' | 'high' | 'warning' | 'all';
  onlyCriticalDowntime: boolean; // Ensures alerts are only sent for critical downtime events
  bandwidthThreshold?: BandwidthThresholdConfig; // Bandwidth interface traffic thresholds
  channels: ('whatsapp' | 'email')[];
  recipients: {
    email: string;
    whatsappPhone: string;
    contactPerson?: string;
  };
  customNote?: string;
  createdAt: string;
  triggeredCount: number;
  lastTriggered?: string;
}

export interface HardwareHealthLog {
  id: string;
  rackId: string;
  campus: CampusId;
  building: string;
  room: string;
  temperatureC: number;
  temperatureStatus: 'optimal' | 'warning' | 'critical';
  fanSpeedRpm: number;
  fanSpeedPercent: number;
  fanStatus: 'healthy' | 'warning' | 'critical';
  powerSupplyHealth: 'redundant_optimal' | 'psu1_degraded' | 'psu2_failed' | 'ups_online';
  psu1Voltage: number;
  psu2Voltage: number;
  psuCurrentAmps: number;
  upsBatteryRuntimeMinutes: number;
  timestamp: string;
  loggedBy: string;
  details: string;
}

export interface SystemEngineMetrics {
  prtgProbeStatus: 'active' | 'syncing' | 'offline';
  zabbixAgentCount: number;
  suricataRulesLoaded: number;
  wazuhActiveAgents: number;
  totalPacketsAnalyzed: number;
  snmpPollIntervalSec: number;
  lastPollTimestamp: string;
  whatsappGatewayStatus: 'connected' | 'standby';
  smtpServerStatus: 'connected' | 'standby';
  googleSheetsSyncStatus: 'synced' | 'pending' | 'ready';
  lastSheetsSync: string;
}

export interface HistoricalMetricPoint {
  id?: string;
  deviceId: string;
  timestamp: string;
  latencyMs: number;
  packetLoss: number;
  bandwidthInMbps: number;
  bandwidthOutMbps: number;
  cpuUsage: number;
  memoryUsage: number;
  status: DeviceStatus;
}

export interface NetworkInterfaceMetric {
  name: string;
  status: 'up' | 'down';
  speedMbps?: number;
  bytesInSec?: number;
  bytesOutSec?: number;
  errors?: number;
}

export interface CollectorReportPayload {
  deviceId: string;
  apiKey?: string;
  hostname?: string;
  ipAddress?: string;
  macAddress?: string;
  campus?: CampusId;
  status: DeviceStatus;
  latencyMs?: number;
  packetLoss?: number;
  bandwidthInMbps?: number;
  bandwidthOutMbps?: number;
  cpuUsage?: number;
  memoryUsage?: number;
  uptime?: string;
  interfaces?: NetworkInterfaceMetric[];
}

export interface CollectorToken {
  id: string;
  name: string;
  token: string;
  campus: CampusId | 'ALL';
  createdAt: string;
  lastUsedAt?: string;
  active: boolean;
}

export interface ThemeConfig {
  id: string;
  name: string;
  headerBg: string;
  headerTopBarBg: string;
  bodyBg: string;
  footerBg: string;
  surfaceBg?: string;
  borderColor?: string;
  accentColor?: string;
  textColor?: string;
  isLightMode?: boolean;
}

export type UserRole = 'Admin' | 'Manager' | 'User';
export type AdminRole = 'Admin' | 'Manager' | 'User' | 'ai_lead' | 'super_admin' | 'noc_manager' | 'campus_engineer';

export interface AdminUser {
  id: string;
  fullName: string;
  email: string;
  role: AdminRole;
  roleTitle: string;
  department: string;
  campusAccess: CampusId | 'ALL';
  phoneNumber?: string;
  avatarUrl?: string;
  createdAt: string;
  lastLogin?: string;
  twoFactorVerified?: boolean;
}

export function getUserRoleCategory(role?: string): 'Admin' | 'Manager' | 'User' {
  if (!role) return 'User';
  const r = role.toLowerCase();
  if (r.includes('admin') || r.includes('lead')) return 'Admin';
  if (r.includes('manager')) return 'Manager';
  return 'User';
}

export interface CsvParsedRow {
  rowNumber: number;
  raw: Record<string, string>;
  device: Partial<Device>;
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export type WidgetType = 
  | 'device_metric'       // Specific device metrics (CPU, RAM, Latency, Bandwidth, Ports, Uptime)
  | 'security_log'        // Specific security event / live threat stream
  | 'security_radar'      // High-severity Suricata/Wazuh alert counter & threat posture
  | 'campus_telemetry'    // Specific campus health & latency gauge
  | 'network_latency'     // Multi-campus latency comparison & jitter sparkline
  | 'power_status'        // Critical core switches & UPS/power state
  | 'soc_attacker_map';   // Blocked attacker IP feed & autonomous mitigation

export type WidgetWidth = '1' | '2' | '3' | 'full';

export interface DashboardWidget {
  id: string;
  type: WidgetType;
  title: string;
  subtitle?: string;
  deviceId?: string;          // Target device if widget is device_metric or power_status
  metricCategory?: 'all' | 'cpu_ram' | 'latency' | 'bandwidth' | 'ports' | 'power';
  securityFilter?: 'all' | 'critical' | 'suricata' | 'wazuh';
  campusId?: CampusId | 'ALL';
  width: WidgetWidth;         // 1: 1 col, 2: 2 cols, 3: 3 cols, full: full width
  pinnedAt: string;
  colorTheme?: 'emerald' | 'blue' | 'purple' | 'amber' | 'rose' | 'cyan';
  customNotes?: string;
  refreshIntervalSec?: number;
}

export const DEFAULT_DASHBOARD_WIDGETS: DashboardWidget[] = [
  {
    id: 'widget-bjc-core-01',
    type: 'device_metric',
    title: 'BJC Core Router 01 — Live Telemetry',
    subtitle: 'Baghdad-ul-Jadeed Backbone Cisco ASR-9006',
    deviceId: 'DEV-BJC-R01',
    metricCategory: 'all',
    width: '2',
    pinnedAt: new Date().toISOString(),
    colorTheme: 'blue',
  },
  {
    id: 'widget-soc-threat-stream',
    type: 'security_log',
    title: 'SOC Live Threat Stream (Suricata & Wazuh)',
    subtitle: 'Real-time DPI Intrusion Prevention & Autonomous Mitigations',
    securityFilter: 'all',
    width: '2',
    pinnedAt: new Date().toISOString(),
    colorTheme: 'rose',
  },
  {
    id: 'widget-bjc-datacenter-sw',
    type: 'device_metric',
    title: 'Baghdad Data Center Core Switch',
    subtitle: 'HPE FlexFabric 5900 (High-Density Aggregation)',
    deviceId: 'DEV-BJC-SW01',
    metricCategory: 'latency',
    width: '1',
    pinnedAt: new Date().toISOString(),
    colorTheme: 'emerald',
  },
  {
    id: 'widget-threat-radar',
    type: 'security_radar',
    title: 'Campus Threat Defense Radar',
    subtitle: 'Autonomous BGP Blackholing & IPS Dropped Packets',
    width: '1',
    pinnedAt: new Date().toISOString(),
    colorTheme: 'purple',
  },
  {
    id: 'widget-ryk-gateway',
    type: 'device_metric',
    title: 'RYK Sub-Campus Border Gateway',
    subtitle: 'MikroTik CCR1036 Cloud Core Gateway',
    deviceId: 'DEV-RYK-R01',
    metricCategory: 'bandwidth',
    width: '1',
    pinnedAt: new Date().toISOString(),
    colorTheme: 'cyan',
  },
  {
    id: 'widget-latency-matrix',
    type: 'network_latency',
    title: 'Multi-Campus Backbone Latency Matrix',
    subtitle: 'Real-time ICMP ping times across all 6 campus sites',
    width: '1',
    pinnedAt: new Date().toISOString(),
    colorTheme: 'amber',
  },
];

