import { HardwareHealthLog, CampusId } from '../src/types.ts';

export interface RackHardwareStatus {
  rackId: string;
  name: string;
  campus: CampusId;
  campusName: string;
  building: string;
  room: string;
  capacityUnits: number; // e.g. 42U or 24U
  installedDevicesCount: number;
  temperatureC: number;
  temperatureStatus: 'optimal' | 'warning' | 'critical';
  ambientTempC: number;
  intakeTempC: number;
  exhaustTempC: number;
  fanSpeedRpm: number;
  fanSpeedPercent: number;
  fanStatus: 'healthy' | 'warning' | 'critical';
  fanCount: number;
  fanHealthMap: Array<{ fanId: string; rpm: number; status: 'ok' | 'fault' }>;
  powerSupplyHealth: 'redundant_optimal' | 'psu1_degraded' | 'psu2_failed' | 'ups_online';
  psu1Voltage: number;
  psu2Voltage: number;
  psuCurrentAmps: number;
  psuTotalWattage: number;
  upsModel: string;
  upsLoadPercent: number;
  upsBatteryRuntimeMinutes: number;
  upsInputFrequencyHz: number;
  lastProbeTime: string;
  ipmiFirmware: string;
  smartRackControllerIp: string;
}

// Initial Racks across all 6 IUB Campuses
const IUB_RACKS: RackHardwareStatus[] = [
  {
    rackId: 'RACK-42U-DATA-CENTER',
    name: 'BJC Central Core Server Rack 01',
    campus: 'BJC',
    campusName: 'Baghdad-ul-Jadeed Campus (Main Data Center)',
    building: 'Central Data Center Block',
    room: 'Core Server Room G-01',
    capacityUnits: 42,
    installedDevicesCount: 38,
    temperatureC: 22.4,
    temperatureStatus: 'optimal',
    ambientTempC: 20.8,
    intakeTempC: 19.5,
    exhaustTempC: 28.2,
    fanSpeedRpm: 4850,
    fanSpeedPercent: 52,
    fanStatus: 'healthy',
    fanCount: 6,
    fanHealthMap: [
      { fanId: 'FAN-1 (Intake-Top)', rpm: 4820, status: 'ok' },
      { fanId: 'FAN-2 (Intake-Mid)', rpm: 4890, status: 'ok' },
      { fanId: 'FAN-3 (Intake-Btm)', rpm: 4840, status: 'ok' },
      { fanId: 'FAN-4 (Exhaust-Top)', rpm: 5120, status: 'ok' },
      { fanId: 'FAN-5 (Exhaust-Mid)', rpm: 5080, status: 'ok' },
      { fanId: 'FAN-6 (Exhaust-Btm)', rpm: 5140, status: 'ok' },
    ],
    powerSupplyHealth: 'redundant_optimal',
    psu1Voltage: 231.4,
    psu2Voltage: 230.8,
    psuCurrentAmps: 14.2,
    psuTotalWattage: 3280,
    upsModel: 'APC Symmetra PX 40kVA Double-Conversion Online',
    upsLoadPercent: 44,
    upsBatteryRuntimeMinutes: 215,
    upsInputFrequencyHz: 50.02,
    lastProbeTime: new Date().toISOString(),
    ipmiFirmware: 'iLO 5 v2.82 / OpenBMC v3.1',
    smartRackControllerIp: '10.10.1.250',
  },
  {
    rackId: 'RACK-42U-CS-01',
    name: 'Faculty of Computing Server Rack',
    campus: 'BJC',
    campusName: 'Baghdad-ul-Jadeed Campus',
    building: 'Faculty of Computing / CS & IT',
    room: 'Server Room 104 (1st Floor)',
    capacityUnits: 42,
    installedDevicesCount: 32,
    temperatureC: 25.8,
    temperatureStatus: 'optimal',
    ambientTempC: 23.5,
    intakeTempC: 22.0,
    exhaustTempC: 31.4,
    fanSpeedRpm: 5400,
    fanSpeedPercent: 62,
    fanStatus: 'healthy',
    fanCount: 4,
    fanHealthMap: [
      { fanId: 'FAN-1 (Intake-A)', rpm: 5380, status: 'ok' },
      { fanId: 'FAN-2 (Intake-B)', rpm: 5420, status: 'ok' },
      { fanId: 'FAN-3 (Exhaust-A)', rpm: 5650, status: 'ok' },
      { fanId: 'FAN-4 (Exhaust-B)', rpm: 5610, status: 'ok' },
    ],
    powerSupplyHealth: 'redundant_optimal',
    psu1Voltage: 229.6,
    psu2Voltage: 229.1,
    psuCurrentAmps: 9.8,
    psuTotalWattage: 2248,
    upsModel: 'Eaton 9PX 11000RT 3:1 Online UPS',
    upsLoadPercent: 38,
    upsBatteryRuntimeMinutes: 180,
    upsInputFrequencyHz: 49.98,
    lastProbeTime: new Date().toISOString(),
    ipmiFirmware: 'Huawei iBMC v5.24',
    smartRackControllerIp: '10.10.10.250',
  },
  {
    rackId: 'RACK-42U-PERN-01',
    name: 'PERN 40G Multi-Homed Fiber Exchange Rack',
    campus: 'BJC',
    campusName: 'Baghdad-ul-Jadeed Campus',
    building: 'Central Data Center Block',
    room: 'Telecom & PERN Core Exchange Point',
    capacityUnits: 42,
    installedDevicesCount: 28,
    temperatureC: 21.2,
    temperatureStatus: 'optimal',
    ambientTempC: 19.8,
    intakeTempC: 18.9,
    exhaustTempC: 25.4,
    fanSpeedRpm: 4600,
    fanSpeedPercent: 48,
    fanStatus: 'healthy',
    fanCount: 6,
    fanHealthMap: [
      { fanId: 'FAN-1', rpm: 4580, status: 'ok' },
      { fanId: 'FAN-2', rpm: 4620, status: 'ok' },
      { fanId: 'FAN-3', rpm: 4590, status: 'ok' },
      { fanId: 'FAN-4', rpm: 4680, status: 'ok' },
      { fanId: 'FAN-5', rpm: 4650, status: 'ok' },
      { fanId: 'FAN-6', rpm: 4710, status: 'ok' },
    ],
    powerSupplyHealth: 'redundant_optimal',
    psu1Voltage: 232.1,
    psu2Voltage: 231.9,
    psuCurrentAmps: 11.5,
    psuTotalWattage: 2668,
    upsModel: 'Schneider Electric Galaxy 300 20kVA',
    upsLoadPercent: 35,
    upsBatteryRuntimeMinutes: 260,
    upsInputFrequencyHz: 50.01,
    lastProbeTime: new Date().toISOString(),
    ipmiFirmware: 'Cisco CIMC 4.2(3)',
    smartRackControllerIp: '10.10.1.252',
  },
  {
    rackId: 'RACK-24U-ADMIN-01',
    name: 'VC Secretariat Floor 1 IDF Rack',
    campus: 'BJC',
    campusName: 'Baghdad-ul-Jadeed Campus',
    building: 'Vice Chancellor Secretariat (Executive Block)',
    room: 'VC Secretariat Floor 1 Server Closet',
    capacityUnits: 24,
    installedDevicesCount: 14,
    temperatureC: 24.1,
    temperatureStatus: 'optimal',
    ambientTempC: 22.0,
    intakeTempC: 21.2,
    exhaustTempC: 29.0,
    fanSpeedRpm: 4200,
    fanSpeedPercent: 45,
    fanStatus: 'healthy',
    fanCount: 2,
    fanHealthMap: [
      { fanId: 'FAN-1', rpm: 4180, status: 'ok' },
      { fanId: 'FAN-2', rpm: 4220, status: 'ok' },
    ],
    powerSupplyHealth: 'redundant_optimal',
    psu1Voltage: 230.2,
    psu2Voltage: 229.8,
    psuCurrentAmps: 4.6,
    psuTotalWattage: 1058,
    upsModel: 'APC Smart-UPS RT 5000VA On-Line',
    upsLoadPercent: 28,
    upsBatteryRuntimeMinutes: 195,
    upsInputFrequencyHz: 50.00,
    lastProbeTime: new Date().toISOString(),
    ipmiFirmware: 'Dell iDRAC9 Enterprise v6.0',
    smartRackControllerIp: '10.10.5.250',
  },
  {
    rackId: 'RACK-24U-OLD-01',
    name: 'Abbasia Campus Core Rack',
    campus: 'OLD',
    campusName: 'Abbasia (Old Campus)',
    building: 'Sir Sadiq Academic Block',
    room: 'Server Closet G-05',
    capacityUnits: 24,
    installedDevicesCount: 18,
    temperatureC: 27.5,
    temperatureStatus: 'warning',
    ambientTempC: 26.2,
    intakeTempC: 25.0,
    exhaustTempC: 34.8,
    fanSpeedRpm: 6800,
    fanSpeedPercent: 78,
    fanStatus: 'warning',
    fanCount: 2,
    fanHealthMap: [
      { fanId: 'FAN-1', rpm: 6780, status: 'ok' },
      { fanId: 'FAN-2', rpm: 6820, status: 'ok' },
    ],
    powerSupplyHealth: 'redundant_optimal',
    psu1Voltage: 226.5,
    psu2Voltage: 225.8,
    psuCurrentAmps: 6.2,
    psuTotalWattage: 1400,
    upsModel: 'APC Smart-UPS RT 6000VA 230V',
    upsLoadPercent: 52,
    upsBatteryRuntimeMinutes: 110,
    upsInputFrequencyHz: 49.95,
    lastProbeTime: new Date().toISOString(),
    ipmiFirmware: 'Cisco CIMC 4.1',
    smartRackControllerIp: '10.11.1.250',
  },
  {
    rackId: 'RACK-24U-RW-01',
    name: 'Railway Campus Core Gateway Rack',
    campus: 'RAILWAY',
    campusName: 'Railway Campus',
    building: 'IT Department & Computer Center',
    room: 'Main IT Center Room 12',
    capacityUnits: 24,
    installedDevicesCount: 12,
    temperatureC: 24.8,
    temperatureStatus: 'optimal',
    ambientTempC: 23.0,
    intakeTempC: 22.4,
    exhaustTempC: 30.1,
    fanSpeedRpm: 4600,
    fanSpeedPercent: 50,
    fanStatus: 'healthy',
    fanCount: 2,
    fanHealthMap: [
      { fanId: 'FAN-1', rpm: 4590, status: 'ok' },
      { fanId: 'FAN-2', rpm: 4610, status: 'ok' },
    ],
    powerSupplyHealth: 'redundant_optimal',
    psu1Voltage: 228.4,
    psu2Voltage: 227.9,
    psuCurrentAmps: 3.8,
    psuTotalWattage: 866,
    upsModel: 'Eaton 5PX 3000VA RT2U',
    upsLoadPercent: 32,
    upsBatteryRuntimeMinutes: 165,
    upsInputFrequencyHz: 50.00,
    lastProbeTime: new Date().toISOString(),
    ipmiFirmware: 'OpenBMC v2.9',
    smartRackControllerIp: '10.12.1.250',
  },
  {
    rackId: 'RACK-42U-RYK-01',
    name: 'Rahim Yar Khan Sub-Campus Core Rack',
    campus: 'RYK',
    campusName: 'Rahim Yar Khan Sub-Campus',
    building: 'Academic & Admin Block A',
    room: 'NOC Room 01 (Ground Floor)',
    capacityUnits: 42,
    installedDevicesCount: 22,
    temperatureC: 26.2,
    temperatureStatus: 'optimal',
    ambientTempC: 24.8,
    intakeTempC: 23.5,
    exhaustTempC: 32.6,
    fanSpeedRpm: 5800,
    fanSpeedPercent: 66,
    fanStatus: 'healthy',
    fanCount: 4,
    fanHealthMap: [
      { fanId: 'FAN-1', rpm: 5780, status: 'ok' },
      { fanId: 'FAN-2', rpm: 5820, status: 'ok' },
      { fanId: 'FAN-3', rpm: 5850, status: 'ok' },
      { fanId: 'FAN-4', rpm: 5790, status: 'ok' },
    ],
    powerSupplyHealth: 'redundant_optimal',
    psu1Voltage: 227.0,
    psu2Voltage: 226.4,
    psuCurrentAmps: 7.4,
    psuTotalWattage: 1675,
    upsModel: 'Schneider Electric Easy UPS 10kVA',
    upsLoadPercent: 42,
    upsBatteryRuntimeMinutes: 145,
    upsInputFrequencyHz: 49.97,
    lastProbeTime: new Date().toISOString(),
    ipmiFirmware: 'Huawei iBMC v5.20',
    smartRackControllerIp: '10.13.1.250',
  },
  {
    rackId: 'RACK-24U-BWN-01',
    name: 'Bahawalnagar Sub-Campus Edge Rack',
    campus: 'BWN',
    campusName: 'Bahawalnagar Sub-Campus',
    building: 'Main Administrative Block',
    room: 'Server Closet Room 04',
    capacityUnits: 24,
    installedDevicesCount: 14,
    temperatureC: 25.1,
    temperatureStatus: 'optimal',
    ambientTempC: 23.6,
    intakeTempC: 22.8,
    exhaustTempC: 31.0,
    fanSpeedRpm: 4900,
    fanSpeedPercent: 54,
    fanStatus: 'healthy',
    fanCount: 2,
    fanHealthMap: [
      { fanId: 'FAN-1', rpm: 4880, status: 'ok' },
      { fanId: 'FAN-2', rpm: 4920, status: 'ok' },
    ],
    powerSupplyHealth: 'redundant_optimal',
    psu1Voltage: 228.1,
    psu2Voltage: 227.5,
    psuCurrentAmps: 4.1,
    psuTotalWattage: 934,
    upsModel: 'APC Smart-UPS 3000VA LCD',
    upsLoadPercent: 34,
    upsBatteryRuntimeMinutes: 155,
    upsInputFrequencyHz: 50.03,
    lastProbeTime: new Date().toISOString(),
    ipmiFirmware: 'Dell iDRAC9 v5.1',
    smartRackControllerIp: '10.14.1.250',
  },
  {
    rackId: 'RACK-24U-LQT-01',
    name: 'Liaquatpur Sub-Campus IT Rack',
    campus: 'LQT',
    campusName: 'Liaquatpur Sub-Campus',
    building: 'Main Academic Block',
    room: 'IT Center Room 02',
    capacityUnits: 24,
    installedDevicesCount: 10,
    temperatureC: 23.9,
    temperatureStatus: 'optimal',
    ambientTempC: 22.4,
    intakeTempC: 21.8,
    exhaustTempC: 29.5,
    fanSpeedRpm: 4300,
    fanSpeedPercent: 46,
    fanStatus: 'healthy',
    fanCount: 2,
    fanHealthMap: [
      { fanId: 'FAN-1', rpm: 4280, status: 'ok' },
      { fanId: 'FAN-2', rpm: 4320, status: 'ok' },
    ],
    powerSupplyHealth: 'redundant_optimal',
    psu1Voltage: 229.4,
    psu2Voltage: 228.8,
    psuCurrentAmps: 3.2,
    psuTotalWattage: 733,
    upsModel: 'APC Smart-UPS 2200VA On-Line',
    upsLoadPercent: 26,
    upsBatteryRuntimeMinutes: 175,
    upsInputFrequencyHz: 50.01,
    lastProbeTime: new Date().toISOString(),
    ipmiFirmware: 'OpenBMC v2.8',
    smartRackControllerIp: '10.15.1.250',
  },
];

// Initial Server-Side Hardware Health Event Logs
const INITIAL_HARDWARE_LOGS: HardwareHealthLog[] = [
  {
    id: 'HW-LOG-1001',
    rackId: 'RACK-42U-DATA-CENTER',
    campus: 'BJC',
    building: 'Central Data Center Block',
    room: 'Core Server Room G-01',
    temperatureC: 22.4,
    temperatureStatus: 'optimal',
    fanSpeedRpm: 4850,
    fanSpeedPercent: 52,
    fanStatus: 'healthy',
    powerSupplyHealth: 'redundant_optimal',
    psu1Voltage: 231.4,
    psu2Voltage: 230.8,
    psuCurrentAmps: 14.2,
    upsBatteryRuntimeMinutes: 215,
    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    loggedBy: 'IPMI-SmartRack-Daemon',
    details: 'Periodic thermal and power audit passed. Dual hot-swap redundant PSUs balanced at 50/50 load sharing.',
  },
  {
    id: 'HW-LOG-1002',
    rackId: 'RACK-24U-OLD-01',
    campus: 'OLD',
    building: 'Sir Sadiq Academic Block',
    room: 'Server Closet G-05',
    temperatureC: 27.5,
    temperatureStatus: 'warning',
    fanSpeedRpm: 6800,
    fanSpeedPercent: 78,
    fanStatus: 'warning',
    powerSupplyHealth: 'redundant_optimal',
    psu1Voltage: 226.5,
    psu2Voltage: 225.8,
    psuCurrentAmps: 6.2,
    upsBatteryRuntimeMinutes: 110,
    timestamp: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
    loggedBy: 'SNMP-Environmental-Probe',
    details: 'Ambient room temperature elevated to 26.2°C. Rack fan tray automatically boosted speed to 6800 RPM (78%) to maintain core delta T.',
  },
  {
    id: 'HW-LOG-1003',
    rackId: 'RACK-42U-PERN-01',
    campus: 'BJC',
    building: 'Central Data Center Block',
    room: 'Telecom & PERN Core Exchange Point',
    temperatureC: 21.2,
    temperatureStatus: 'optimal',
    fanSpeedRpm: 4600,
    fanSpeedPercent: 48,
    fanStatus: 'healthy',
    powerSupplyHealth: 'redundant_optimal',
    psu1Voltage: 232.1,
    psu2Voltage: 231.9,
    psuCurrentAmps: 11.5,
    upsBatteryRuntimeMinutes: 260,
    timestamp: new Date(Date.now() - 32 * 60 * 1000).toISOString(),
    loggedBy: 'Cisco-CIMC-Sensor',
    details: 'Optical transceiver thermal thresholds verified. Fiber DWDM mux/demux operating at optimal 21.2°C.',
  },
  {
    id: 'HW-LOG-1004',
    rackId: 'RACK-42U-CS-01',
    campus: 'BJC',
    building: 'Faculty of Computing / CS & IT',
    room: 'Server Room 104 (1st Floor)',
    temperatureC: 25.8,
    temperatureStatus: 'optimal',
    fanSpeedRpm: 5400,
    fanSpeedPercent: 62,
    fanStatus: 'healthy',
    powerSupplyHealth: 'redundant_optimal',
    psu1Voltage: 229.6,
    psu2Voltage: 229.1,
    psuCurrentAmps: 9.8,
    upsBatteryRuntimeMinutes: 180,
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    loggedBy: 'Huawei-iBMC-Collector',
    details: 'In-rack dual ventilation modules verified. AC input line frequency steady at 49.98 Hz.',
  },
  {
    id: 'HW-LOG-1005',
    rackId: 'RACK-42U-RYK-01',
    campus: 'RYK',
    building: 'Academic & Admin Block A',
    room: 'NOC Room 01 (Ground Floor)',
    temperatureC: 26.2,
    temperatureStatus: 'optimal',
    fanSpeedRpm: 5800,
    fanSpeedPercent: 66,
    fanStatus: 'healthy',
    powerSupplyHealth: 'redundant_optimal',
    psu1Voltage: 227.0,
    psu2Voltage: 226.4,
    psuCurrentAmps: 7.4,
    upsBatteryRuntimeMinutes: 145,
    timestamp: new Date(Date.now() - 70 * 60 * 1000).toISOString(),
    loggedBy: 'IPMI-SmartRack-Daemon',
    details: 'Sub-campus remote telemetry heartbeat logged. Redundant inverter circuit test completed successfully.',
  },
  {
    id: 'HW-LOG-1006',
    rackId: 'RACK-24U-ADMIN-01',
    campus: 'BJC',
    building: 'Vice Chancellor Secretariat (Executive Block)',
    room: 'VC Secretariat Floor 1 Server Closet',
    temperatureC: 24.1,
    temperatureStatus: 'optimal',
    fanSpeedRpm: 4200,
    fanSpeedPercent: 45,
    fanStatus: 'healthy',
    powerSupplyHealth: 'redundant_optimal',
    psu1Voltage: 230.2,
    psu2Voltage: 229.8,
    psuCurrentAmps: 4.6,
    upsBatteryRuntimeMinutes: 195,
    timestamp: new Date(Date.now() - 95 * 60 * 1000).toISOString(),
    loggedBy: 'Dell-iDRAC-Probe',
    details: 'PSU-1 and PSU-2 active PFC efficiency at 94.2%. Battery self-discharge diagnostic healthy.',
  },
  {
    id: 'HW-LOG-1007',
    rackId: 'RACK-24U-BWN-01',
    campus: 'BWN',
    building: 'Main Administrative Block',
    room: 'Server Closet Room 04',
    temperatureC: 25.1,
    temperatureStatus: 'optimal',
    fanSpeedRpm: 4900,
    fanSpeedPercent: 54,
    fanStatus: 'healthy',
    powerSupplyHealth: 'redundant_optimal',
    psu1Voltage: 228.1,
    psu2Voltage: 227.5,
    psuCurrentAmps: 4.1,
    upsBatteryRuntimeMinutes: 155,
    timestamp: new Date(Date.now() - 130 * 60 * 1000).toISOString(),
    loggedBy: 'SNMP-Environmental-Probe',
    details: 'Fan speed synchronized with rack exhaust plenum. Zero thermal throttling reported.',
  },
  {
    id: 'HW-LOG-1008',
    rackId: 'RACK-24U-LQT-01',
    campus: 'LQT',
    building: 'Main Academic Block',
    room: 'IT Center Room 02',
    temperatureC: 23.9,
    temperatureStatus: 'optimal',
    fanSpeedRpm: 4300,
    fanSpeedPercent: 46,
    fanStatus: 'healthy',
    powerSupplyHealth: 'redundant_optimal',
    psu1Voltage: 229.4,
    psu2Voltage: 228.8,
    psuCurrentAmps: 3.2,
    upsBatteryRuntimeMinutes: 175,
    timestamp: new Date(Date.now() - 160 * 60 * 1000).toISOString(),
    loggedBy: 'OpenBMC-Daemon',
    details: 'Rack grounding and surge suppression verified. Total rack load within safe 2.2kVA envelope.',
  },
];

class HardwareHealthService {
  private racks: RackHardwareStatus[] = [...IUB_RACKS];
  private logs: HardwareHealthLog[] = [...INITIAL_HARDWARE_LOGS];

  public getAllRacks(campus?: string): RackHardwareStatus[] {
    if (campus && campus !== 'ALL') {
      return this.racks.filter((r) => r.campus === campus);
    }
    return this.racks;
  }

  public getRackById(rackId: string): RackHardwareStatus | undefined {
    return this.racks.find((r) => r.rackId === rackId);
  }

  public getLogs(options?: {
    campus?: string;
    rackId?: string;
    severity?: string;
    search?: string;
    limit?: number;
  }): HardwareHealthLog[] {
    let result = [...this.logs];

    if (options?.campus && options.campus !== 'ALL') {
      result = result.filter((l) => l.campus === options.campus);
    }

    if (options?.rackId && options.rackId !== 'ALL') {
      result = result.filter((l) => l.rackId === options.rackId);
    }

    if (options?.severity && options.severity !== 'ALL') {
      result = result.filter(
        (l) => l.temperatureStatus === options.severity || l.fanStatus === options.severity
      );
    }

    if (options?.search) {
      const q = options.search.toLowerCase();
      result = result.filter(
        (l) =>
          l.rackId.toLowerCase().includes(q) ||
          l.building.toLowerCase().includes(q) ||
          l.room.toLowerCase().includes(q) ||
          l.details.toLowerCase().includes(q) ||
          l.loggedBy.toLowerCase().includes(q)
      );
    }

    // Sort latest first
    result.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    if (options?.limit && options.limit > 0) {
      return result.slice(0, options.limit);
    }

    return result;
  }

  public addLog(logData: Omit<HardwareHealthLog, 'id' | 'timestamp'>): HardwareHealthLog {
    const newLog: HardwareHealthLog = {
      ...logData,
      id: `HW-LOG-${Date.now().toString().slice(-6)}`,
      timestamp: new Date().toISOString(),
    };

    this.logs.unshift(newLog);

    // Keep memory bounded to 300 logs
    if (this.logs.length > 300) {
      this.logs = this.logs.slice(0, 300);
    }

    // Update corresponding rack in memory
    const rack = this.racks.find((r) => r.rackId === logData.rackId);
    if (rack) {
      rack.temperatureC = logData.temperatureC;
      rack.temperatureStatus = logData.temperatureStatus;
      rack.fanSpeedRpm = logData.fanSpeedRpm;
      rack.fanSpeedPercent = logData.fanSpeedPercent;
      rack.fanStatus = logData.fanStatus;
      rack.powerSupplyHealth = logData.powerSupplyHealth;
      rack.psu1Voltage = logData.psu1Voltage;
      rack.psu2Voltage = logData.psu2Voltage;
      rack.psuCurrentAmps = logData.psuCurrentAmps;
      rack.upsBatteryRuntimeMinutes = logData.upsBatteryRuntimeMinutes;
      rack.lastProbeTime = newLog.timestamp;
    }

    return newLog;
  }

  public triggerDiagnosticProbe(rackId: string): { success: boolean; log: HardwareHealthLog; rack: RackHardwareStatus } {
    const rack = this.racks.find((r) => r.rackId === rackId) || this.racks[0];
    
    // Simulate slight live variation
    const tempDelta = (Math.random() - 0.5) * 0.8;
    const newTemp = Number(Math.max(18, Math.min(38, rack.temperatureC + tempDelta)).toFixed(1));
    const newTempStatus = newTemp > 35 ? 'critical' : newTemp > 26 ? 'warning' : 'optimal';

    const rpmDelta = Math.round((Math.random() - 0.5) * 120);
    const newRpm = Math.max(3800, Math.min(8000, rack.fanSpeedRpm + rpmDelta));
    const newFanPercent = Math.round((newRpm / 8500) * 100);
    const newFanStatus = newRpm > 7200 ? 'warning' : 'healthy';

    const voltDelta = (Math.random() - 0.5) * 0.4;
    const newPsu1 = Number((rack.psu1Voltage + voltDelta).toFixed(1));
    const newPsu2 = Number((rack.psu2Voltage + voltDelta).toFixed(1));

    const log = this.addLog({
      rackId: rack.rackId,
      campus: rack.campus,
      building: rack.building,
      room: rack.room,
      temperatureC: newTemp,
      temperatureStatus: newTempStatus,
      fanSpeedRpm: newRpm,
      fanSpeedPercent: newFanPercent,
      fanStatus: newFanStatus,
      powerSupplyHealth: rack.powerSupplyHealth,
      psu1Voltage: newPsu1,
      psu2Voltage: newPsu2,
      psuCurrentAmps: rack.psuCurrentAmps,
      upsBatteryRuntimeMinutes: rack.upsBatteryRuntimeMinutes,
      loggedBy: 'IPMI-OnDemand-Diagnostic',
      details: `Ad-hoc IPMI hardware health probe requested by NOC engineer. Rack temperature: ${newTemp}°C, Fan speed: ${newRpm} RPM, PSU: ${newPsu1}V/${newPsu2}V.`,
    });

    return { success: true, log, rack };
  }

  public getMetricsSummary() {
    const totalRacks = this.racks.length;
    const optimalCount = this.racks.filter((r) => r.temperatureStatus === 'optimal').length;
    const warningCount = this.racks.filter((r) => r.temperatureStatus === 'warning').length;
    const criticalCount = this.racks.filter((r) => r.temperatureStatus === 'critical').length;
    const avgTemp = Number((this.racks.reduce((acc, r) => acc + r.temperatureC, 0) / totalRacks).toFixed(1));
    const avgFanSpeed = Math.round(this.racks.reduce((acc, r) => acc + r.fanSpeedRpm, 0) / totalRacks);
    const totalWattage = this.racks.reduce((acc, r) => acc + r.psuTotalWattage, 0);

    return {
      totalRacks,
      optimalCount,
      warningCount,
      criticalCount,
      avgTemp,
      avgFanSpeed,
      totalWattage,
      lastAuditTime: new Date().toISOString(),
    };
  }
}

export const hardwareHealthService = new HardwareHealthService();
