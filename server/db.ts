import fs from 'fs';
import path from 'path';
import { 
  Device, 
  DeviceType, 
  DeviceStatus, 
  CampusId, 
  FiberLink, 
  SecurityEvent, 
  AlertNotification, 
  AlertRule, 
  SystemEngineMetrics, 
  CampusInfo, 
  HistoricalMetricPoint,
  DashboardWidget,
  DEFAULT_DASHBOARD_WIDGETS
} from '../src/types.ts';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'iub_network_db.json');

export const campusesData: CampusInfo[] = [
  {
    id: 'BJC',
    name: 'Baghdad-ul-Jadeed Campus (BJC)',
    shortName: 'BJC Main Campus',
    city: 'Bahawalpur',
    totalDevices: 124,
    onlineDevices: 121,
    fiberStatus: 'Optimal',
    coreBandwidth: '40 Gbps',
    nocLead: 'Mr. Zeeshan Javed (AI Lead Engineer)',
  },
  {
    id: 'OLD',
    name: 'Abbasia (Old) Campus',
    shortName: 'Old Campus',
    city: 'Bahawalpur City',
    totalDevices: 48,
    onlineDevices: 47,
    fiberStatus: 'Optimal',
    coreBandwidth: '10 Gbps',
    nocLead: 'Engr. M. Tariq (Senior Network Admin)',
  },
  {
    id: 'RAILWAY',
    name: 'Railway Campus',
    shortName: 'Railway Campus',
    city: 'Bahawalpur Railway Road',
    totalDevices: 28,
    onlineDevices: 27,
    fiberStatus: 'Optimal',
    coreBandwidth: '5 Gbps',
    nocLead: 'Engr. Bilal Ahmad',
  },
  {
    id: 'RYK',
    name: 'Rahim Yar Khan Sub-Campus (RYK)',
    shortName: 'RYK Campus',
    city: 'Rahim Yar Khan',
    totalDevices: 36,
    onlineDevices: 35,
    fiberStatus: 'Optimal',
    coreBandwidth: '5 Gbps',
    nocLead: 'Engr. Farhan Ali',
  },
  {
    id: 'BWN',
    name: 'Bahawalnagar Sub-Campus',
    shortName: 'Bahawalnagar Campus',
    city: 'Bahawalnagar',
    totalDevices: 32,
    onlineDevices: 30,
    fiberStatus: 'Degraded',
    coreBandwidth: '2 Gbps',
    nocLead: 'Engr. Usman Qureshi',
  },
  {
    id: 'LQT',
    name: 'Liaquatpur Sub-Campus',
    shortName: 'Liaquatpur Campus',
    city: 'Liaquatpur',
    totalDevices: 16,
    onlineDevices: 16,
    fiberStatus: 'Optimal',
    coreBandwidth: '1 Gbps',
    nocLead: 'Engr. Kamran Raza',
  },
];

const initialDevices: Device[] = [
  {
    id: 'DEV-BJC-CORE-01',
    name: 'BJC-CORE-ROUTER-01',
    type: 'router',
    model: 'Cisco ASR 9010 100G Edge BGP Core',
    ipAddress: '10.10.0.1',
    macAddress: '00:45:53:7A:B1:01',
    campus: 'BJC',
    building: 'Central Data Center (NOC Block)',
    roomNo: 'Core Server Room G-01',
    rackId: 'RACK-42U-DC-A01',
    portsTotal: 48,
    portsActive: 42,
    status: 'online',
    lastSeen: new Date().toISOString(),
    uptime: '142d 18h 33m',
    latencyMs: 0.8,
    packetLoss: 0,
    cpuUsage: 28,
    memoryUsage: 44,
    temperatureC: 38,
    bandwidthInMbps: 8450,
    bandwidthOutMbps: 9120,
    snmpCommunity: 'iub_noc_v3_sec',
    snmpVersion: 'v3',
    fiberCores: 148,
    prtgSensorId: 'PRTG-SEN-1001',
    zabbixHostId: 'ZAB-HOST-101',
    suricataThreatLevel: 'safe',
    notes: 'Primary BGP Edge connecting to PERN (Pakistan Education & Research Network) 20Gbps Upstream link.',
    vlanId: 10,
  },
  {
    id: 'DEV-BJC-SW-148P',
    name: 'BJC-MAIN-CORE-SW-148P',
    type: 'switch',
    model: 'Cisco Catalyst 9600 Modular 148-Port 10G/40G',
    ipAddress: '10.10.0.2',
    macAddress: '00:45:53:7A:B1:02',
    campus: 'BJC',
    building: 'Central Data Center (NOC Block)',
    roomNo: 'Core Server Room G-01',
    rackId: 'RACK-42U-DC-A01',
    portsTotal: 148,
    portsActive: 139,
    status: 'online',
    lastSeen: new Date().toISOString(),
    uptime: '89d 12h 10m',
    latencyMs: 1.1,
    packetLoss: 0,
    cpuUsage: 35,
    memoryUsage: 52,
    temperatureC: 41,
    bandwidthInMbps: 14200,
    bandwidthOutMbps: 15600,
    snmpCommunity: 'iub_noc_v3_sec',
    snmpVersion: 'v3',
    fiberCores: 148,
    prtgSensorId: 'PRTG-SEN-1002',
    zabbixHostId: 'ZAB-HOST-102',
    suricataThreatLevel: 'safe',
    notes: 'Main Campus 148-Port Modular Core Switch terminating high-density fiber rings from all BJC faculties.',
    vlanId: 1,
  },
  {
    id: 'DEV-BJC-CS-SW-96P',
    name: 'BJC-CS-DIST-SW-96P',
    type: 'switch',
    model: 'Huawei CloudEngine S6730-H 96-Port 10GE',
    ipAddress: '10.10.12.1',
    macAddress: '70:79:90:3C:99:A1',
    campus: 'BJC',
    building: 'Faculty of Computing / CS & IT',
    roomNo: 'Server Room 104 (1st Floor)',
    rackId: 'RACK-42U-CS-01',
    portsTotal: 96,
    portsActive: 88,
    status: 'online',
    lastSeen: new Date().toISOString(),
    uptime: '45d 09h 15m',
    latencyMs: 1.4,
    packetLoss: 0,
    cpuUsage: 42,
    memoryUsage: 58,
    temperatureC: 39,
    bandwidthInMbps: 4800,
    bandwidthOutMbps: 5200,
    snmpCommunity: 'iub_noc_read',
    snmpVersion: 'v2c',
    fiberCores: 96,
    prtgSensorId: 'PRTG-SEN-1012',
    zabbixHostId: 'ZAB-HOST-112',
    suricataThreatLevel: 'low',
    notes: 'Distributes LAN and high-speed research clusters across CS Labs 1 to 8 and AI Research Center.',
    vlanId: 120,
    deviceNumber: 'IUB-SW-1012',
    deviceLocation: 'First Floor, Server Room 104, North Wall',
    switchLocation: 'Central Data Center (NOC Block), Core Server Room G-01',
    switchBuilding: 'Central Data Center (NOC Block)',
    switchModel: 'Cisco Catalyst 9600 Modular Core Switch',
    switchPort: 'TenGigabitEthernet1/1/4',
    devicePort: 'Uplink 1 (10G SFP+)',
  },
  {
    id: 'DEV-BJC-LIB-SW-48P',
    name: 'BJC-CENTRAL-LIB-SW-48P',
    type: 'switch',
    model: 'Aruba CX 6300M 48-Port PoE+ Gigabit',
    ipAddress: '10.10.15.1',
    macAddress: '38:20:56:4C:E8:22',
    campus: 'BJC',
    building: 'Khawaja Ghulam Fareed Central Library',
    roomNo: 'Digital Lab 02 Network Closet',
    rackId: 'RACK-24U-LIB-01',
    portsTotal: 48,
    portsActive: 44,
    status: 'online',
    lastSeen: new Date().toISOString(),
    uptime: '62d 04h 50m',
    latencyMs: 2.1,
    packetLoss: 0,
    cpuUsage: 25,
    memoryUsage: 38,
    temperatureC: 36,
    bandwidthInMbps: 1800,
    bandwidthOutMbps: 2100,
    snmpCommunity: 'iub_noc_read',
    snmpVersion: 'v2c',
    fiberCores: 48,
    prtgSensorId: 'PRTG-SEN-1015',
    zabbixHostId: 'ZAB-HOST-115',
    suricataThreatLevel: 'safe',
    notes: 'Powers Digital Library terminals, OPAC catalogs, and student reading hall access points.',
    vlanId: 150,
  },
  {
    id: 'DEV-BJC-AP-CS-AUD',
    name: 'BJC-CS-AUDITORIUM-AP01',
    type: 'access_point',
    model: 'Aruba AP-555 Wi-Fi 6 Ultra High-Density',
    ipAddress: '10.10.12.55',
    macAddress: 'B0:AA:77:81:45:90',
    campus: 'BJC',
    building: 'Faculty of Computing / CS & IT',
    roomNo: 'Main Auditorium Hall Ceil-01',
    rackId: 'RACK-42U-CS-01',
    portsTotal: 2,
    portsActive: 2,
    status: 'online',
    lastSeen: new Date().toISOString(),
    uptime: '30d 19h 42m',
    latencyMs: 2.8,
    packetLoss: 0,
    cpuUsage: 61,
    memoryUsage: 67,
    temperatureC: 43,
    bandwidthInMbps: 650,
    bandwidthOutMbps: 720,
    snmpCommunity: 'iub_wifi_mon',
    snmpVersion: 'v2c',
    prtgSensorId: 'PRTG-SEN-1033',
    zabbixHostId: 'ZAB-HOST-133',
    suricataThreatLevel: 'safe',
    notes: 'Handles 450+ concurrent student sessions during international conferences & AI symposiums.',
    vlanId: 200,
    deviceNumber: 'IUB-AP-2050',
    deviceLocation: 'Auditorium Ceiling Center Beam A2',
    switchLocation: 'Server Room 104 (1st Floor), Rack RACK-42U-CS-01',
    switchBuilding: 'Faculty of Computing / CS & IT',
    switchModel: 'Huawei CloudEngine S6730-H 96-Port 10GE',
    switchPort: 'GigabitEthernet0/0/14',
    devicePort: 'Eth0 (PoE+ In)',
  },
  {
    id: 'DEV-BJC-IP-PHONE-VC',
    name: 'BJC-VC-SUITE-IP-PHONE-01',
    type: 'ip_phone',
    model: 'Grandstream GXP2170 Enterprise HD VoIP',
    ipAddress: '10.10.5.10',
    macAddress: '00:0B:82:94:71:05',
    campus: 'BJC',
    building: 'Vice Chancellor Secretariat (Executive Block)',
    roomNo: 'VC Conference Office Suite 101',
    deviceNumber: 'EXT-1001',
    deviceLocation: 'VC Main Conference Desk',
    rackId: 'RACK-24U-ADMIN-01',
    portsTotal: 2,
    portsActive: 2,
    status: 'online',
    lastSeen: new Date().toISOString(),
    uptime: '112d 01h 05m',
    latencyMs: 1.2,
    packetLoss: 0,
    cpuUsage: 12,
    memoryUsage: 29,
    temperatureC: 31,
    bandwidthInMbps: 2.4,
    bandwidthOutMbps: 2.4,
    snmpCommunity: 'iub_voip_read',
    snmpVersion: 'v2c',
    prtgSensorId: 'PRTG-SEN-1050',
    zabbixHostId: 'ZAB-HOST-150',
    suricataThreatLevel: 'safe',
    notes: 'Direct priority SIP trunk line with Asterisk IP-PBX extension #1001.',
    vlanId: 50,
    switchLocation: 'VC Secretariat Floor 1 IDF Rack',
    switchBuilding: 'Vice Chancellor Secretariat (Executive Block)',
    switchModel: 'Cisco Catalyst 3850 24-Port PoE+',
    switchPort: 'FastEthernet0/8',
    devicePort: 'LAN / Network Port',
  },
  {
    id: 'DEV-BJC-CAM-GATE1',
    name: 'BJC-MAIN-GATE-PTZ-SECURITY-CAM',
    type: 'camera',
    model: 'Hikvision 4K DarkFighter 36x Optical PTZ',
    ipAddress: '10.10.88.10',
    macAddress: '44:19:B6:81:92:DF',
    campus: 'BJC',
    building: 'Main Security Entrance Gate #1',
    roomNo: 'Command Post Tower 01',
    rackId: 'RACK-GATE1-OUTDOOR',
    portsTotal: 1,
    portsActive: 1,
    status: 'online',
    lastSeen: new Date().toISOString(),
    uptime: '190d 05h 11m',
    latencyMs: 3.4,
    packetLoss: 0,
    cpuUsage: 48,
    memoryUsage: 54,
    temperatureC: 44,
    bandwidthInMbps: 18.5,
    bandwidthOutMbps: 24.2,
    snmpCommunity: 'iub_sec_cam',
    snmpVersion: 'v2c',
    prtgSensorId: 'PRTG-SEN-1088',
    zabbixHostId: 'ZAB-HOST-188',
    suricataThreatLevel: 'safe',
    notes: '24/7 ANPR license plate recognition & boundary surveillance feeding central IUB Security NVR.',
    vlanId: 88,
  },
  {
    id: 'DEV-BJC-RACK-DC',
    name: 'BJC-CORE-DATA-CENTER-RACK-42U',
    type: 'rack',
    model: 'APC NetShelter SX 42U + Smart Metered PDU',
    ipAddress: '10.10.0.99',
    macAddress: '7A:91:02:44:EE:10',
    campus: 'BJC',
    building: 'Central Data Center (NOC Block)',
    roomNo: 'Cold Aisle Row 1 - Unit A',
    rackId: 'RACK-42U-DC-A01',
    portsTotal: 42,
    portsActive: 38,
    status: 'online',
    lastSeen: new Date().toISOString(),
    uptime: '365d 00h 00m',
    latencyMs: 0.9,
    packetLoss: 0,
    cpuUsage: 18,
    memoryUsage: 25,
    temperatureC: 21,
    bandwidthInMbps: 0,
    bandwidthOutMbps: 0,
    snmpCommunity: 'iub_facility_snmp',
    snmpVersion: 'v3',
    prtgSensorId: 'PRTG-SEN-1099',
    zabbixHostId: 'ZAB-HOST-199',
    suricataThreatLevel: 'safe',
    notes: 'Houses Cisco 100G Core, 148-Port Modular switch, SAN storage, dual 16A PDU power feeds.',
    vlanId: 1,
  },
  {
    id: 'DEV-OLD-EDGE-01',
    name: 'OLD-CAMPUS-ABBASIA-GW-ROUTER',
    type: 'router',
    model: 'Cisco Catalyst 8300 Series 10G Modular Edge',
    ipAddress: '10.20.0.1',
    macAddress: '00:50:56:AB:44:01',
    campus: 'OLD',
    building: 'Abbasia Administrative Complex',
    roomNo: 'NOC Room 103 (Near VC Old Office)',
    rackId: 'RACK-42U-OLD-01',
    portsTotal: 24,
    portsActive: 21,
    status: 'online',
    lastSeen: new Date().toISOString(),
    uptime: '78d 14h 20m',
    latencyMs: 2.2,
    packetLoss: 0,
    cpuUsage: 33,
    memoryUsage: 48,
    temperatureC: 37,
    bandwidthInMbps: 2100,
    bandwidthOutMbps: 2350,
    snmpCommunity: 'iub_noc_v3_sec',
    snmpVersion: 'v3',
    fiberCores: 96,
    prtgSensorId: 'PRTG-SEN-2001',
    zabbixHostId: 'ZAB-HOST-201',
    suricataThreatLevel: 'safe',
    notes: 'Terminates 96-core metro fiber link from BJC and routes traffic for Abbasia faculty blocks.',
    vlanId: 20,
  },
  {
    id: 'DEV-OLD-SW-48P',
    name: 'OLD-ABBASIA-FACULTY-SW-48P',
    type: 'switch',
    model: 'Cisco Catalyst 9300 48-Port PoE+ Layer 3',
    ipAddress: '10.20.2.1',
    macAddress: '00:50:56:AB:44:15',
    campus: 'OLD',
    building: 'Sir Sadiq Academic Block',
    roomNo: 'Server Closet G-05',
    rackId: 'RACK-24U-OLD-02',
    portsTotal: 48,
    portsActive: 46,
    status: 'online',
    lastSeen: new Date().toISOString(),
    uptime: '51d 08h 03m',
    latencyMs: 2.4,
    packetLoss: 0,
    cpuUsage: 29,
    memoryUsage: 45,
    temperatureC: 38,
    bandwidthInMbps: 980,
    bandwidthOutMbps: 1120,
    snmpCommunity: 'iub_noc_read',
    snmpVersion: 'v2c',
    fiberCores: 48,
    prtgSensorId: 'PRTG-SEN-2002',
    zabbixHostId: 'ZAB-HOST-202',
    suricataThreatLevel: 'safe',
    notes: 'Powering departmental workstations, Wi-Fi 6 APs, and faculty administrative PCs.',
    vlanId: 22,
  },
  {
    id: 'DEV-RAILWAY-ROUTER',
    name: 'RAILWAY-CAMPUS-CORE-ROUTER',
    type: 'router',
    model: 'Cisco Catalyst 8200 Gigabit Edge Gateway',
    ipAddress: '10.30.0.1',
    macAddress: '00:26:08:92:44:90',
    campus: 'RAILWAY',
    building: 'Railway Campus Academic Building',
    roomNo: 'IT Department Room 12',
    rackId: 'RACK-24U-RW-01',
    portsTotal: 12,
    portsActive: 10,
    status: 'online',
    lastSeen: new Date().toISOString(),
    uptime: '40d 22h 19m',
    latencyMs: 3.1,
    packetLoss: 0,
    cpuUsage: 22,
    memoryUsage: 36,
    temperatureC: 35,
    bandwidthInMbps: 750,
    bandwidthOutMbps: 810,
    snmpCommunity: 'iub_noc_read',
    snmpVersion: 'v2c',
    fiberCores: 48,
    prtgSensorId: 'PRTG-SEN-3001',
    zabbixHostId: 'ZAB-HOST-301',
    suricataThreatLevel: 'safe',
    notes: 'Connected via 48-Core fiber to BJC; powers Commerce & Management academic computing.',
    vlanId: 30,
  },
  {
    id: 'DEV-RAILWAY-AP-01',
    name: 'RAILWAY-CS-LAB-AP01',
    type: 'access_point',
    model: 'Aruba AP-535 Wi-Fi 6 Ultra HD Campus AP',
    ipAddress: '10.30.2.20',
    macAddress: '00:26:08:92:44:95',
    campus: 'RAILWAY',
    building: 'Railway Campus Academic Building',
    roomNo: 'Computer Lab 01 Ceiling Mount',
    deviceNumber: 'IUB-RW-AP-05',
    deviceLocation: 'Lab 01 Center Ceiling Mount A-3',
    switchLocation: 'IT Dept Room 12 Rack RACK-24U-RW-01',
    switchBuilding: 'Railway Campus Academic Building',
    switchModel: 'Cisco Catalyst 3850 24-Port PoE+',
    switchPort: 'GigabitEthernet1/0/9',
    devicePort: 'Eth0 (PoE+ In)',
    rackId: 'RACK-24U-RW-01',
    portsTotal: 2,
    portsActive: 0,
    status: 'offline',
    lastSeen: new Date(Date.now() - 2460000).toISOString(),
    offTime: new Date(Date.now() - 2460000).toISOString(),
    downtimeDuration: '41 mins',
    uptime: 'Down since 09:20 AM PKT',
    latencyMs: 999,
    packetLoss: 100,
    cpuUsage: 0,
    memoryUsage: 0,
    temperatureC: 22,
    bandwidthInMbps: 0,
    bandwidthOutMbps: 0,
    snmpCommunity: 'iub_noc_read',
    snmpVersion: 'v2c',
    prtgSensorId: 'PRTG-SEN-3005',
    zabbixHostId: 'ZAB-HOST-305',
    suricataThreatLevel: 'medium',
    notes: 'No heartbeat response from access point; possible PoE injector failure or disconnected Cat6 patch lead.',
    vlanId: 32,
  },
  {
    id: 'DEV-RYK-WAN-ROUTER',
    name: 'RYK-SUB-CAMPUS-WAN-CORE',
    type: 'router',
    model: 'Huawei NetEngine AR6280 Modular Enterprise Router',
    ipAddress: '10.40.0.1',
    macAddress: '4C:1F:CC:89:12:33',
    campus: 'RYK',
    building: 'Administrative & Academic Complex RYK',
    roomNo: 'NOC Room 01 (Ground Floor)',
    rackId: 'RACK-42U-RYK-01',
    portsTotal: 24,
    portsActive: 22,
    status: 'online',
    lastSeen: new Date().toISOString(),
    uptime: '95d 11h 45m',
    latencyMs: 8.4,
    packetLoss: 0,
    cpuUsage: 38,
    memoryUsage: 50,
    temperatureC: 39,
    bandwidthInMbps: 1850,
    bandwidthOutMbps: 1980,
    snmpCommunity: 'iub_noc_v3_sec',
    snmpVersion: 'v3',
    fiberCores: 24,
    prtgSensorId: 'PRTG-SEN-4001',
    zabbixHostId: 'ZAB-HOST-401',
    suricataThreatLevel: 'safe',
    notes: 'Rahim Yar Khan sub-campus WAN hub connecting via dedicated PERN MPLS fiber link to BJC.',
    vlanId: 40,
  },
  {
    id: 'DEV-BWN-CORE-SW',
    name: 'BWN-CAMPUS-DIST-SW-48P',
    type: 'switch',
    model: 'Juniper Networks EX3400 48-Port Gigabit PoE+',
    ipAddress: '10.50.0.2',
    macAddress: '5C:5E:AB:78:21:49',
    campus: 'BWN',
    building: 'Bahawalnagar Main Academic Block',
    roomNo: 'Network Operation Room G-04',
    rackId: 'RACK-42U-BWN-01',
    portsTotal: 48,
    portsActive: 41,
    status: 'offline',
    lastSeen: new Date(Date.now() - 6360000).toISOString(),
    offTime: new Date(Date.now() - 6360000).toISOString(),
    downtimeDuration: '1h 46m',
    uptime: 'Down since 08:15 AM PKT',
    latencyMs: 999,
    packetLoss: 100,
    cpuUsage: 0,
    memoryUsage: 0,
    temperatureC: 24,
    bandwidthInMbps: 0,
    bandwidthOutMbps: 0,
    snmpCommunity: 'iub_noc_read',
    snmpVersion: 'v2c',
    fiberCores: 24,
    prtgSensorId: 'PRTG-SEN-5002',
    zabbixHostId: 'ZAB-HOST-502',
    suricataThreatLevel: 'high',
    notes: 'Critical alert: Power loss or optical fiber link cut on Bahawalnagar distribution trunk. All downstream sub-nets offline.',
    vlanId: 50,
  },
  {
    id: 'DEV-LQT-EDGE-ROUTER',
    name: 'LIAQUATPUR-CAMPUS-GW-ROUTER',
    type: 'router',
    model: 'Cisco ISR 4331 Security Gateway',
    ipAddress: '10.60.0.1',
    macAddress: 'F8:66:F2:70:91:88',
    campus: 'LQT',
    building: 'Liaquatpur Degree Academic Block',
    roomNo: 'IT Control Room 101',
    rackId: 'RACK-24U-LQT-01',
    portsTotal: 12,
    portsActive: 9,
    status: 'online',
    lastSeen: new Date().toISOString(),
    uptime: '67d 02h 40m',
    latencyMs: 6.9,
    packetLoss: 0,
    cpuUsage: 21,
    memoryUsage: 34,
    temperatureC: 34,
    bandwidthInMbps: 450,
    bandwidthOutMbps: 490,
    snmpCommunity: 'iub_noc_read',
    snmpVersion: 'v2c',
    fiberCores: 12,
    prtgSensorId: 'PRTG-SEN-6001',
    zabbixHostId: 'ZAB-HOST-601',
    suricataThreatLevel: 'safe',
    notes: 'Direct 12-core metro link connecting Liaquatpur sub-campus to IUB Core network backbone.',
    vlanId: 60,
  },
  {
    id: 'DEV-BJC-FIBER-RACK-148',
    name: 'BJC-FIBER-ODF-148-CORE-RACK',
    type: 'fiber_cable',
    model: 'Corning 148-Core High-Density Optical Distribution Frame (ODF)',
    ipAddress: '10.10.0.148',
    macAddress: 'CC:48:F1:14:80:01',
    campus: 'BJC',
    building: 'Central Data Center (NOC Block)',
    roomNo: 'Fiber Splice Enclosure Vault 01',
    rackId: 'RACK-42U-DC-A01',
    portsTotal: 148,
    portsActive: 134,
    status: 'online',
    lastSeen: new Date().toISOString(),
    uptime: '365d 00h 00m',
    latencyMs: 0.4,
    packetLoss: 0,
    cpuUsage: 10,
    memoryUsage: 15,
    temperatureC: 22,
    bandwidthInMbps: 35000,
    bandwidthOutMbps: 37500,
    snmpCommunity: 'iub_fiber_telemetry',
    snmpVersion: 'v3',
    fiberCores: 148,
    prtgSensorId: 'PRTG-SEN-1148',
    zabbixHostId: 'ZAB-HOST-148',
    suricataThreatLevel: 'safe',
    notes: 'Main 148-Core fiber hub connecting BJC Data Center with all University academic and residential blocks.',
    vlanId: 1,
  }
];

const standardColors = [
  { name: 'Blue', hex: '#2563EB' },
  { name: 'Orange', hex: '#F97316' },
  { name: 'Green', hex: '#16A34A' },
  { name: 'Brown', hex: '#854D0E' },
  { name: 'Slate', hex: '#64748B' },
  { name: 'White', hex: '#E2E8F0' },
  { name: 'Red', hex: '#DC2626' },
  { name: 'Black', hex: '#1E293B' },
  { name: 'Yellow', hex: '#EAB308' },
  { name: 'Violet', hex: '#8B5CF6' },
  { name: 'Rose', hex: '#F43F5E' },
  { name: 'Aqua', hex: '#06B6D4' },
];

function generateFiberCores(total: 148 | 96 | 48 | 24 | 12): FiberLink['cores'] {
  const cores: FiberLink['cores'] = [];
  const services = [
    '100G Core Backbone Ring 1',
    '100G Core Backbone Ring 2',
    'PERN Higher Education Uplink',
    'SAN Storage Replication Fabric',
    'CS & IT High Performance Cluster',
    'Executive VC Suite Private Trunk',
    'Central Library Digital Grid',
    'University 4K CCTV Security Ring',
    'VoIP Asterisk PBX SIP Trunk',
    'Aruba Wi-Fi 6 Controller Link',
    'Student Portal & LMS Cloud Uplink',
    'Examination Controller Secure VLAN',
    'Engineering & Tech Faculty Uplink',
    'Pharmacy & Medical College Grid',
    'Hostel & Residential Sector LAN',
    'Disaster Recovery Replication Link',
  ];

  for (let i = 1; i <= total; i++) {
    const colorIdx = (i - 1) % 12;
    const tubeNumber = Math.floor((i - 1) / 12) + 1;
    const color = standardColors[colorIdx];

    let status: 'active' | 'spare' | 'dark' | 'faulty' = 'active';
    let service = services[(i - 1) % services.length] + ` [Core #${i}]`;
    let attenuation = Number((0.18 + (i % 7) * 0.02).toFixed(2));

    if (i > total * 0.85) {
      status = 'dark';
      service = `Unlit Dark Fiber Reserve [Tube ${tubeNumber}]`;
      attenuation = 0.19;
    } else if (i > total * 0.75) {
      status = 'spare';
      service = `Live Hot-Standby Failover Core`;
      attenuation = 0.20;
    } else if (i === 7 && total === 24) {
      status = 'faulty';
      service = `Warning: High Splice Loss Detected`;
      attenuation = 0.85;
    }

    cores.push({
      coreNumber: i,
      tubeNumber,
      colorName: color.name,
      hexColor: color.hex,
      status,
      service,
      attenuationDb: attenuation,
      txPowerDbm: -3.2,
      rxPowerDbm: -3.2 - attenuation * 4,
    });
  }

  return cores;
}

const initialFiberLinks: FiberLink[] = [
  {
    id: 'FIB-BJC-148C',
    cableName: 'IUB-BJC-BACKBONE-148C-RING-A',
    totalCores: 148,
    sourceCampus: 'BJC',
    sourceBuilding: 'Central Data Center (NOC)',
    destCampus: 'BJC',
    destBuilding: 'CS, Engineering, Library & Admin Hub',
    distanceKm: 4.8,
    activeCoresCount: 118,
    darkCoresCount: 30,
    averageAttenuationDb: 0.22,
    status: 'healthy',
    cableType: 'Armored Single-Mode OS2',
    cores: generateFiberCores(148),
  },
  {
    id: 'FIB-BJC-OLD-96C',
    cableName: 'IUB-METRO-BJC-TO-ABBASIA-96C',
    totalCores: 96,
    sourceCampus: 'BJC',
    sourceBuilding: 'BJC Data Center NOC',
    destCampus: 'OLD',
    destBuilding: 'Abbasia Campus Sir Sadiq NOC',
    distanceKm: 12.4,
    activeCoresCount: 82,
    darkCoresCount: 14,
    averageAttenuationDb: 0.24,
    status: 'healthy',
    cableType: 'Direct Burial Multimode OM4',
    cores: generateFiberCores(96),
  },
  {
    id: 'FIB-BJC-RAILWAY-48C',
    cableName: 'IUB-RAILWAY-CAMPUS-LINK-48C',
    totalCores: 48,
    sourceCampus: 'BJC',
    sourceBuilding: 'BJC Data Center NOC',
    destCampus: 'RAILWAY',
    destBuilding: 'Railway Campus IT Center',
    distanceKm: 7.2,
    activeCoresCount: 38,
    darkCoresCount: 10,
    averageAttenuationDb: 0.23,
    status: 'healthy',
    cableType: 'Armored Single-Mode OS2',
    cores: generateFiberCores(48),
  },
  {
    id: 'FIB-RYK-24C',
    cableName: 'IUB-RYK-SUB-CAMPUS-TRUNK-24C',
    totalCores: 24,
    sourceCampus: 'RYK',
    sourceBuilding: 'RYK Admin NOC Room 01',
    destCampus: 'RYK',
    destBuilding: 'Academic & IT Lab Block',
    distanceKm: 2.1,
    activeCoresCount: 18,
    darkCoresCount: 6,
    averageAttenuationDb: 0.28,
    status: 'healthy',
    cableType: 'Armored Single-Mode OS2',
    cores: generateFiberCores(24),
  },
  {
    id: 'FIB-BWN-24C',
    cableName: 'IUB-BWN-REGIONAL-FIBER-24C',
    totalCores: 24,
    sourceCampus: 'BWN',
    sourceBuilding: 'BWN Network Operation Room',
    destCampus: 'BWN',
    destBuilding: 'Main Academic Block B',
    distanceKm: 3.6,
    activeCoresCount: 17,
    darkCoresCount: 6,
    averageAttenuationDb: 0.42,
    status: 'warning',
    cableType: 'Aerial Self-Supporting ADSS',
    cores: generateFiberCores(24),
  },
  {
    id: 'FIB-LQT-12C',
    cableName: 'IUB-LIAQUATPUR-METRO-12C',
    totalCores: 12,
    sourceCampus: 'LQT',
    sourceBuilding: 'Liaquatpur IT Control Room',
    destCampus: 'LQT',
    destBuilding: 'Academic Block 01',
    distanceKm: 1.5,
    activeCoresCount: 9,
    darkCoresCount: 3,
    averageAttenuationDb: 0.25,
    status: 'healthy',
    cableType: 'Armored Single-Mode OS2',
    cores: generateFiberCores(12),
  },
];

const initialSecurityEvents: SecurityEvent[] = [
  {
    id: 'SEC-1092',
    timestamp: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
    source: 'Suricata-IDS',
    severity: 'critical',
    eventType: 'DDoS SYN Flood Attack Detected',
    targetDevice: 'BJC-CORE-ROUTER-01',
    targetIp: '10.10.0.1',
    attackerIp: '185.220.101.45',
    actionTaken: 'Blocked by Suricata IPS (Automated Blackhole null0 route injected)',
    details: 'Rate exceeded 850,000 pps targeting port 80/443. Core router CPU stabilized.',
  },
  {
    id: 'SEC-1091',
    timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    source: 'Wazuh-SIEM',
    severity: 'high',
    eventType: 'Repeated SSH Brute Force Authentication Failure',
    targetDevice: 'BJC-CS-DIST-SW-96P',
    targetIp: '10.10.12.1',
    attackerIp: '10.10.12.89',
    actionTaken: 'Wazuh Active Response IP Ban (3600 seconds)',
    details: '42 consecutive invalid credentials attempts for root/admin within 60 seconds.',
  },
  {
    id: 'SEC-1090',
    timestamp: new Date(Date.now() - 1000 * 60 * 42).toISOString(),
    source: 'Suricata-IDS',
    severity: 'warning',
    eventType: 'Nmap Stealth Port Scan (SYN-ACK probe)',
    targetDevice: 'OLD-CAMPUS-ABBASIA-GW-ROUTER',
    targetIp: '10.20.0.1',
    attackerIp: '192.168.140.77',
    actionTaken: 'Flagged and Rate Limited',
    details: 'Sequential scan across ports 1-1024 detected from internal student hostel subnet.',
  },
  {
    id: 'SEC-1089',
    timestamp: new Date(Date.now() - 1000 * 60 * 95).toISOString(),
    source: 'Wazuh-SIEM',
    severity: 'info',
    eventType: 'Switch Configuration File Hash Check',
    targetDevice: 'BJC-MAIN-CORE-SW-148P',
    targetIp: '10.10.0.2',
    attackerIp: '10.10.0.99',
    actionTaken: 'Verified & Logged by NOC Engine',
    details: 'Running-config SHA-256 integrity hash matched authorized backup signature.',
  },
];

const initialAlerts: AlertNotification[] = [
  {
    id: 'ALT-501',
    timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    deviceId: 'DEV-BWN-CORE-SW',
    deviceName: 'BWN-CAMPUS-DIST-SW-48P',
    campus: 'BWN',
    building: 'Bahawalnagar Main Academic Block',
    roomNo: 'Network Operation Room G-04',
    channel: 'all',
    recipient: 'zeejaved766@gmail.com / +923001234567',
    status: 'delivered',
    message: '🚨 [IUB NOC ALERT] High Optical Attenuation on BWN-CAMPUS-DIST-SW-48P (0.42 dB/km). Packet loss 2.5%. Monitored by Mr. Zeeshan Javed AI Lead Engineer.',
    triggerReason: 'Packet loss > 2.0% & Optical Power warning threshold exceeded',
    resolved: false,
  },
  {
    id: 'ALT-500',
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    deviceId: 'DEV-BJC-CORE-01',
    deviceName: 'BJC-CORE-ROUTER-01',
    campus: 'BJC',
    building: 'Central Data Center (NOC Block)',
    roomNo: 'Core Server Room G-01',
    channel: 'whatsapp',
    recipient: '+923001234567',
    status: 'delivered',
    message: '🛡️ [IUB SOC ALERT] Suricata IPS successfully mitigated DDoS SYN Flood on BJC Core Router 10.10.0.1.',
    triggerReason: 'High Severity Security Event Trigger',
    resolved: true,
  },
];

const initialAlertRules: AlertRule[] = [
  {
    id: 'RULE-ROUTER-CORE',
    name: 'Core & Edge Routers Critical Outage Alert',
    enabled: true,
    deviceTypes: ['router'],
    campuses: ['ALL'],
    severity: 'critical',
    onlyCriticalDowntime: true,
    channels: ['whatsapp', 'email'],
    recipients: {
      email: 'zeejaved766@gmail.com',
      whatsappPhone: '+923001234567',
      contactPerson: 'Mr. Zeeshan Javed (AI Lead Engineer)',
    },
    customNote: 'Immediate priority: Alert NOC tier 1 and PERN BGP gateway operations.',
    createdAt: new Date().toISOString(),
    triggeredCount: 3,
    lastTriggered: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'RULE-BJC-SWITCHES',
    name: 'BJC Main Campus Core & Distribution Switches',
    enabled: true,
    deviceTypes: ['switch'],
    campuses: ['BJC'],
    severity: 'critical',
    onlyCriticalDowntime: true,
    channels: ['whatsapp', 'email'],
    recipients: {
      email: 'zeejaved766@gmail.com',
      whatsappPhone: '+923001234567',
      contactPerson: 'Engr. M. Tariq (Senior Network Admin)',
    },
    customNote: '148-port modular and distribution layer power/uplink drops.',
    createdAt: new Date().toISOString(),
    triggeredCount: 1,
    lastTriggered: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: 'RULE-SUBCAMPUS-WAN',
    name: 'Sub-Campuses (RYK, Bahawalnagar, Liaquatpur, Old) Link Outage',
    enabled: true,
    deviceTypes: ['router', 'switch', 'fiber_cable'],
    campuses: ['OLD', 'RAILWAY', 'RYK', 'BWN', 'LQT'],
    severity: 'critical',
    onlyCriticalDowntime: true,
    channels: ['whatsapp', 'email'],
    recipients: {
      email: 'zeejaved766@gmail.com',
      whatsappPhone: '+923001234567',
      contactPerson: 'Engr. Farhan Ali / Sub-Campus Leads',
    },
    customNote: 'Inter-district fiber cut or remote node unreachable.',
    createdAt: new Date().toISOString(),
    triggeredCount: 2,
    lastTriggered: new Date(Date.now() - 14400000).toISOString(),
  },
  {
    id: 'RULE-WIFI-VOIP-ACC',
    name: 'Departmental Wi-Fi APs & IP Phone Gateways',
    enabled: true,
    deviceTypes: ['access_point', 'ip_phone'],
    campuses: ['ALL'],
    severity: 'high',
    onlyCriticalDowntime: true,
    channels: ['email'],
    recipients: {
      email: 'zeejaved766@gmail.com',
      whatsappPhone: '+923001234567',
      contactPerson: 'Telecom & Access Network Support',
    },
    customNote: 'Non-backbone edge device failure notifications.',
    createdAt: new Date().toISOString(),
    triggeredCount: 0,
  },
  {
    id: 'RULE-BANDWIDTH-CONGESTION',
    name: 'High Bandwidth Utilization (>90% Capacity Alert)',
    enabled: true,
    deviceTypes: ['router', 'switch', 'fiber_cable'],
    campuses: ['ALL'],
    severity: 'critical',
    onlyCriticalDowntime: false,
    bandwidthThreshold: {
      enabled: true,
      thresholdType: 'percentage',
      thresholdValue: 90,
      interfaceDirection: 'aggregate',
      comparison: 'greater_equal',
    },
    channels: ['whatsapp', 'email'],
    recipients: {
      email: 'zeejaved766@gmail.com',
      whatsappPhone: '+923001234567',
      contactPerson: 'Mr. Zeeshan Javed (AI Lead Engineer)',
    },
    customNote: 'Automatic alert triggered when interface traffic exceeds 90% bandwidth capacity.',
    createdAt: new Date().toISOString(),
    triggeredCount: 4,
    lastTriggered: new Date(Date.now() - 1800000).toISOString(),
  },
];

export interface AdminUserAccount {
  id: string;
  fullName: string;
  email: string;
  passwordHash: string;
  role: 'Admin' | 'Manager' | 'User' | 'ai_lead' | 'super_admin' | 'noc_manager' | 'campus_engineer';
  roleTitle: string;
  department: string;
  campusAccess: CampusId | 'ALL';
  phoneNumber?: string;
  avatarUrl?: string;
  createdAt: string;
  lastLogin?: string;
  twoFactorVerified?: boolean;
}

const initialAdminUsers: AdminUserAccount[] = [
  {
    id: 'ADMIN-ZEESHAN-01',
    fullName: 'Mr. Zeeshan Javed',
    email: 'zeejaved766@gmail.com',
    passwordHash: 'Admin@IUB2026',
    role: 'Admin',
    roleTitle: 'AI Lead Engineer & NOC System Architect',
    department: 'Directorate of Information Technology (DIT)',
    campusAccess: 'ALL',
    phoneNumber: '+92 300 1234567',
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
    twoFactorVerified: true,
  },
  {
    id: 'ADMIN-IUB-02',
    fullName: 'IUB Network Administrator',
    email: 'admin@iub.edu.pk',
    passwordHash: 'IUBnetwork@123',
    role: 'Admin',
    roleTitle: 'Chief Network Operations Super Admin',
    department: 'DIT Network Infrastructure Wing',
    campusAccess: 'ALL',
    phoneNumber: '+92 62 9250235',
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
    twoFactorVerified: true,
  },
  {
    id: 'MGR-SARAH-03',
    fullName: 'Engr. Sarah Tariq',
    email: 'sarah.manager@iub.edu.pk',
    passwordHash: 'Manager@2026',
    role: 'Manager',
    roleTitle: 'NOC Operations Manager',
    department: 'DIT Network Operations Center',
    campusAccess: 'BJC',
    phoneNumber: '+92 301 9876543',
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
    twoFactorVerified: true,
  },
  {
    id: 'USR-ALI-04',
    fullName: 'Ali Raza',
    email: 'ali.user@iub.edu.pk',
    passwordHash: 'User@2026',
    role: 'User',
    roleTitle: 'Campus Network Viewer & Staff',
    department: 'Department of Computer Science & IT',
    campusAccess: 'ALL',
    phoneNumber: '+92 333 4567890',
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
    twoFactorVerified: true,
  }
];

interface DatabaseSchema {
  devices: Device[];
  fiberLinks: FiberLink[];
  securityEvents: SecurityEvent[];
  alerts: AlertNotification[];
  alertRules: AlertRule[];
  systemMetrics: SystemEngineMetrics;
  metricHistory?: Record<string, HistoricalMetricPoint[]>;
  users?: AdminUserAccount[];
  dashboardWidgets?: Record<string, DashboardWidget[]>;
}

class NetworkDatabase {
  private data: DatabaseSchema;

  constructor() {
    this.ensureDirectoryExists();
    this.data = this.loadDatabase();
  }

  private generateDeviceHistory(dev: Device): HistoricalMetricPoint[] {
    const points: HistoricalMetricPoint[] = [];
    const now = Date.now();
    const isOnline = dev.status === 'online';

    for (let i = 24; i >= 0; i--) {
      const time = new Date(now - i * 5 * 60 * 1000).toISOString();
      const jitter = (Math.random() - 0.5);
      points.push({
        deviceId: dev.id,
        timestamp: time,
        latencyMs: isOnline ? Math.max(0.4, Number((dev.latencyMs + jitter * 1.5).toFixed(2))) : 999,
        packetLoss: isOnline ? (Math.random() < 0.1 ? 0.5 : 0) : 100,
        bandwidthInMbps: Math.max(10, Math.round(dev.bandwidthInMbps + jitter * 40)),
        bandwidthOutMbps: Math.max(10, Math.round(dev.bandwidthOutMbps + jitter * 50)),
        cpuUsage: Math.min(98, Math.max(10, Math.round(dev.cpuUsage + jitter * 8))),
        memoryUsage: Math.min(95, Math.max(15, Math.round(dev.memoryUsage + jitter * 4))),
        status: dev.status,
      });
    }
    return points;
  }

  private generateInitialMetricHistory(devices: Device[]): Record<string, HistoricalMetricPoint[]> {
    const history: Record<string, HistoricalMetricPoint[]> = {};
    for (const dev of devices) {
      history[dev.id] = this.generateDeviceHistory(dev);
    }
    return history;
  }

  private ensureDirectoryExists() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private loadDatabase(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (!parsed.alertRules || !Array.isArray(parsed.alertRules) || parsed.alertRules.length === 0) {
          parsed.alertRules = initialAlertRules;
        }
        if (!parsed.metricHistory || typeof parsed.metricHistory !== 'object') {
          parsed.metricHistory = this.generateInitialMetricHistory(parsed.devices || initialDevices);
        }
        if (!parsed.users || !Array.isArray(parsed.users) || parsed.users.length === 0) {
          parsed.users = initialAdminUsers;
        }
        return parsed;
      }
    } catch (err) {
      console.error('Error reading DB_FILE, falling back to defaults:', err);
    }

    const defaultData: DatabaseSchema = {
      devices: initialDevices,
      fiberLinks: initialFiberLinks,
      securityEvents: initialSecurityEvents,
      alerts: initialAlerts,
      alertRules: initialAlertRules,
      systemMetrics: {
        prtgProbeStatus: 'active',
        zabbixAgentCount: 142,
        suricataRulesLoaded: 38450,
        wazuhActiveAgents: 184,
        totalPacketsAnalyzed: 14890200,
        snmpPollIntervalSec: 10,
        lastPollTimestamp: new Date().toISOString(),
        whatsappGatewayStatus: 'connected',
        smtpServerStatus: 'connected',
        googleSheetsSyncStatus: 'synced',
        lastSheetsSync: new Date().toISOString(),
      },
      metricHistory: this.generateInitialMetricHistory(initialDevices),
      users: initialAdminUsers,
    };

    this.saveDatabase(defaultData);
    return defaultData;
  }

  private saveDatabase(data: DatabaseSchema) {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error writing DB_FILE:', err);
    }
  }

  public getDevices(campus?: string, type?: string, search?: string): Device[] {
    let result = [...this.data.devices];
    if (campus && campus !== 'ALL') {
      result = result.filter((d) => d.campus === campus);
    }
    if (type && type !== 'ALL') {
      result = result.filter((d) => d.type === type);
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.ipAddress.toLowerCase().includes(q) ||
          d.building.toLowerCase().includes(q) ||
          d.roomNo.toLowerCase().includes(q) ||
          (d.deviceNumber && d.deviceNumber.toLowerCase().includes(q)) ||
          (d.deviceLocation && d.deviceLocation.toLowerCase().includes(q)) ||
          d.model.toLowerCase().includes(q) ||
          d.rackId.toLowerCase().includes(q)
      );
    }
    return result;
  }

  public getCampuses(): CampusInfo[] {
    return campusesData;
  }

  public getDeviceById(id: string): Device | undefined {
    return this.data.devices.find((d) => d.id === id);
  }

  public addDevice(newDev: Omit<Device, 'id' | 'lastSeen' | 'uptime'>): Device {
    const id = `DEV-${newDev.campus}-${Date.now().toString().slice(-4)}`;
    const device: Device = {
      ...newDev,
      id,
      lastSeen: new Date().toISOString(),
      uptime: '0d 00h 01m',
      latencyMs: newDev.latencyMs ?? 1.2,
      packetLoss: newDev.packetLoss ?? 0,
      cpuUsage: newDev.cpuUsage ?? 25,
      memoryUsage: newDev.memoryUsage ?? 35,
      temperatureC: newDev.temperatureC ?? 35,
      bandwidthInMbps: newDev.bandwidthInMbps ?? 100,
      bandwidthOutMbps: newDev.bandwidthOutMbps ?? 100,
      prtgSensorId: newDev.prtgSensorId || `PRTG-${Date.now().toString().slice(-4)}`,
      zabbixHostId: newDev.zabbixHostId || `ZAB-${Date.now().toString().slice(-4)}`,
      suricataThreatLevel: newDev.suricataThreatLevel || 'safe',
    };

    this.data.devices.unshift(device);
    this.saveDatabase(this.data);
    return device;
  }

  public addDevicesBulk(newDevs: Array<Partial<Device>>): Device[] {
    const addedDevices: Device[] = [];
    const nowIso = new Date().toISOString();

    for (const dev of newDevs) {
      if (!dev.name && !dev.ipAddress) continue;
      const campus = (dev.campus as CampusId) || 'BJC';
      const id = dev.id || `DEV-${campus}-${Math.floor(1000 + Math.random() * 9000)}`;
      const status: DeviceStatus = dev.status === 'offline' ? 'offline' : (dev.status || 'online');

      const newDevice: Device = {
        id,
        name: dev.name || `Equipment-${id}`,
        type: (dev.type as DeviceType) || 'switch',
        model: dev.model || 'Standard Enterprise Model',
        ipAddress: dev.ipAddress || `10.10.${Math.floor(Math.random() * 150)}.${Math.floor(Math.random() * 250 + 1)}`,
        macAddress: dev.macAddress || `52:54:00:${Math.random().toString(16).substring(2, 4).toUpperCase()}:${Math.random().toString(16).substring(2, 4).toUpperCase()}:${Math.random().toString(16).substring(2, 4).toUpperCase()}`,
        campus,
        building: dev.building || 'Main Campus Block',
        roomNo: dev.roomNo || 'Room 101',
        rackId: dev.rackId || 'RACK-01',
        portsTotal: dev.portsTotal || 24,
        portsActive: dev.portsActive || 12,
        status,
        lastSeen: nowIso,
        uptime: status === 'offline' ? '0d 00h 00m' : (dev.uptime || '12d 04h 20m'),
        latencyMs: status === 'offline' ? 999 : (dev.latencyMs ?? 1.2),
        packetLoss: status === 'offline' ? 100 : (dev.packetLoss ?? 0),
        cpuUsage: dev.cpuUsage ?? 22,
        memoryUsage: dev.memoryUsage ?? 34,
        temperatureC: dev.temperatureC ?? 32,
        bandwidthInMbps: dev.bandwidthInMbps ?? 120,
        bandwidthOutMbps: dev.bandwidthOutMbps ?? 150,
        snmpCommunity: dev.snmpCommunity || 'iub_public',
        snmpVersion: dev.snmpVersion || 'v2c',
        fiberCores: dev.fiberCores,
        prtgSensorId: dev.prtgSensorId || `PRTG-${Math.floor(1000 + Math.random() * 9000)}`,
        zabbixHostId: dev.zabbixHostId || `ZAB-${Math.floor(1000 + Math.random() * 9000)}`,
        suricataThreatLevel: dev.suricataThreatLevel || 'safe',
        notes: dev.notes || 'Imported via CSV/PDF Bulk Provisioning',
        vlanId: dev.vlanId || 10,
        deviceNumber: dev.deviceNumber || id,
        deviceLocation: dev.deviceLocation || `${dev.building || 'Campus Block'}, Room ${dev.roomNo || '101'}`,
        switchLocation: dev.switchLocation,
        switchBuilding: dev.switchBuilding,
        switchRoom: dev.switchRoom,
        switchModel: dev.switchModel,
        switchPort: dev.switchPort,
        devicePort: dev.devicePort,
        offTime: status === 'offline' ? (dev.offTime || nowIso) : undefined,
        downtimeDuration: status === 'offline' ? (dev.downtimeDuration || 'Active Downtime') : undefined,
      };

      const existingIdx = this.data.devices.findIndex((d) => d.id === newDevice.id);
      if (existingIdx >= 0) {
        this.data.devices[existingIdx] = newDevice;
      } else {
        this.data.devices.unshift(newDevice);
      }
      addedDevices.push(newDevice);
    }

    this.saveDatabase(this.data);
    return addedDevices;
  }

  public updateDevice(id: string, updates: Partial<Device>): Device | null {
    const index = this.data.devices.findIndex((d) => d.id === id);
    if (index === -1) return null;

    this.data.devices[index] = {
      ...this.data.devices[index],
      ...updates,
      lastSeen: new Date().toISOString(),
    };

    this.saveDatabase(this.data);
    return this.data.devices[index];
  }

  public deleteDevice(id: string): boolean {
    const prevLength = this.data.devices.length;
    this.data.devices = this.data.devices.filter((d) => d.id !== id);
    if (this.data.devices.length !== prevLength) {
      this.saveDatabase(this.data);
      return true;
    }
    return false;
  }

  public toggleDeviceStatus(id: string): Device | null {
    const dev = this.getDeviceById(id);
    if (!dev) return null;

    const newStatus = dev.status === 'online' ? 'offline' : 'online';
    const nowIso = new Date().toISOString();
    const updated = this.updateDevice(id, {
      status: newStatus,
      latencyMs: newStatus === 'offline' ? 999 : 1.2,
      packetLoss: newStatus === 'offline' ? 100 : 0,
      offTime: newStatus === 'offline' ? nowIso : undefined,
      downtimeDuration: newStatus === 'offline' ? 'Just now (< 1 min)' : undefined,
      lastSeen: nowIso,
    });

    if (newStatus === 'offline' && updated) {
      // Evaluate active advanced alerting filters
      const matchedRules = this.matchAlertRules(updated, {
        severity: 'critical',
        reason: 'ICMP Ping Fail / Critical Device Downtime',
        isDowntime: true,
      });

      if (matchedRules.length > 0) {
        for (const rule of matchedRules) {
          this.recordRuleTrigger(rule.id);
          const channel = rule.channels.length === 2 ? 'all' : (rule.channels[0] || 'all');
          const recStr = [
            rule.channels.includes('email') ? rule.recipients.email : '',
            rule.channels.includes('whatsapp') ? rule.recipients.whatsappPhone : '',
          ].filter(Boolean).join(' | ');

          this.createAlert({
            deviceId: updated.id,
            deviceName: updated.name,
            campus: updated.campus,
            building: updated.building,
            roomNo: updated.roomNo,
            channel: channel,
            recipient: recStr,
            status: 'delivered',
            message: `🚨 [IUB NOC CRITICAL DOWNTIME] ${updated.name} (${updated.type.toUpperCase()}) went OFFLINE at ${updated.building}, Room ${updated.roomNo}, Campus ${updated.campus}!\nTriggered by Alert Rule: "${rule.name}"\nTarget Contact: ${rule.recipients.contactPerson || 'NOC Admin'} (${recStr})`,
            triggerReason: `Critical Downtime Event (${updated.type.toUpperCase()} offline in ${updated.campus})`,
            resolved: false,
            ruleId: rule.id,
            ruleName: rule.name,
          });
        }
      } else {
        console.log(`[Alert Filter] Device ${updated.name} (${updated.type} on ${updated.campus}) went offline but filtered out by active alerting rules.`);
      }
    }

    return updated;
  }

  public getFiberLinks(): FiberLink[] {
    return this.data.fiberLinks;
  }

  public getFiberLinkById(id: string): FiberLink | undefined {
    return this.data.fiberLinks.find((f) => f.id === id);
  }

  public updateFiberCoreStatus(linkId: string, coreNumber: number, status: 'active' | 'spare' | 'dark' | 'faulty', service?: string): FiberLink | null {
    const link = this.getFiberLinkById(linkId);
    if (!link) return null;

    const core = link.cores.find((c) => c.coreNumber === coreNumber);
    if (core) {
      core.status = status;
      if (service) core.service = service;
      if (status === 'faulty') core.attenuationDb = 1.45;
      else if (status === 'active') core.attenuationDb = 0.21;
    }

    link.activeCoresCount = link.cores.filter((c) => c.status === 'active').length;
    link.darkCoresCount = link.cores.filter((c) => c.status === 'dark').length;

    this.saveDatabase(this.data);
    return link;
  }

  public getSecurityEvents(): SecurityEvent[] {
    return this.data.securityEvents;
  }

  public addSecurityEvent(event: Omit<SecurityEvent, 'id' | 'timestamp'>): SecurityEvent {
    const newEvent: SecurityEvent = {
      ...event,
      id: `SEC-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString(),
    };
    this.data.securityEvents.unshift(newEvent);
    if (this.data.securityEvents.length > 50) {
      this.data.securityEvents = this.data.securityEvents.slice(0, 50);
    }
    this.saveDatabase(this.data);
    return newEvent;
  }

  public getAlerts(): AlertNotification[] {
    return this.data.alerts;
  }

  public createAlert(alert: Omit<AlertNotification, 'id' | 'timestamp'>): AlertNotification {
    const newAlert: AlertNotification = {
      ...alert,
      id: `ALT-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString(),
    };
    this.data.alerts.unshift(newAlert);
    if (this.data.alerts.length > 50) {
      this.data.alerts = this.data.alerts.slice(0, 50);
    }
    this.saveDatabase(this.data);
    return newAlert;
  }

  public resolveAlert(id: string): boolean {
    const alert = this.data.alerts.find((a) => a.id === id);
    if (alert) {
      alert.resolved = true;
      this.saveDatabase(this.data);
      return true;
    }
    return false;
  }

  public getAlertRules(): AlertRule[] {
    return this.data.alertRules || [];
  }

  public getAlertRuleById(id: string): AlertRule | undefined {
    return this.data.alertRules.find((r) => r.id === id);
  }

  public createAlertRule(rule: Omit<AlertRule, 'id' | 'createdAt' | 'triggeredCount'>): AlertRule {
    const id = `RULE-${Date.now().toString().slice(-4)}`;
    const newRule: AlertRule = {
      ...rule,
      id,
      createdAt: new Date().toISOString(),
      triggeredCount: 0,
    };
    this.data.alertRules.unshift(newRule);
    this.saveDatabase(this.data);
    return newRule;
  }

  public updateAlertRule(id: string, updates: Partial<AlertRule>): AlertRule | null {
    const index = this.data.alertRules.findIndex((r) => r.id === id);
    if (index === -1) return null;
    this.data.alertRules[index] = {
      ...this.data.alertRules[index],
      ...updates,
    };
    this.saveDatabase(this.data);
    return this.data.alertRules[index];
  }

  public deleteAlertRule(id: string): boolean {
    const initialLen = this.data.alertRules.length;
    this.data.alertRules = this.data.alertRules.filter((r) => r.id !== id);
    if (this.data.alertRules.length !== initialLen) {
      this.saveDatabase(this.data);
      return true;
    }
    return false;
  }

  public toggleAlertRule(id: string): AlertRule | null {
    const rule = this.getAlertRuleById(id);
    if (!rule) return null;
    return this.updateAlertRule(id, { enabled: !rule.enabled });
  }

  public recordRuleTrigger(id: string): void {
    const rule = this.getAlertRuleById(id);
    if (rule) {
      rule.triggeredCount = (rule.triggeredCount || 0) + 1;
      rule.lastTriggered = new Date().toISOString();
      this.saveDatabase(this.data);
    }
  }

  public matchAlertRules(device: Device, event: { severity: 'critical' | 'high' | 'warning' | 'info'; reason: string; isDowntime: boolean }): AlertRule[] {
    const rules = this.getAlertRules().filter((r) => r.enabled);
    return rules.filter((rule) => {
      // 1. Ensure alerts are only sent for critical downtime events
      if (rule.onlyCriticalDowntime && !event.isDowntime) {
        return false;
      }
      // 2. Device Type matching
      if (!rule.deviceTypes.includes('ALL') && !rule.deviceTypes.includes(device.type)) {
        return false;
      }
      // 3. Campus location matching
      if (!rule.campuses.includes('ALL') && !rule.campuses.includes(device.campus)) {
        return false;
      }
      // 4. Severity matching
      if (rule.severity !== 'all') {
        if (rule.severity === 'critical' && event.severity !== 'critical') return false;
        if (rule.severity === 'high' && (event.severity === 'warning' || event.severity === 'info')) return false;
      }
      return true;
    });
  }

  public getSystemMetrics(): SystemEngineMetrics {
    return {
      ...this.data.systemMetrics,
      lastPollTimestamp: new Date().toISOString(),
    };
  }

  public updateSystemMetrics(updates: Partial<SystemEngineMetrics>) {
    this.data.systemMetrics = {
      ...this.data.systemMetrics,
      ...updates,
    };
    this.saveDatabase(this.data);
  }

  public addHistoricalMetric(metric: HistoricalMetricPoint) {
    if (!this.data.metricHistory) {
      this.data.metricHistory = {};
    }
    if (!this.data.metricHistory[metric.deviceId]) {
      this.data.metricHistory[metric.deviceId] = [];
    }
    this.data.metricHistory[metric.deviceId].push(metric);
    // Retain maximum 100 historical records per device
    if (this.data.metricHistory[metric.deviceId].length > 100) {
      this.data.metricHistory[metric.deviceId].shift();
    }
    this.saveDatabase(this.data);
  }

  public getHistoricalMetrics(deviceId: string, limitCount = 50): HistoricalMetricPoint[] {
    if (!this.data.metricHistory) {
      this.data.metricHistory = this.generateInitialMetricHistory(this.data.devices);
    }
    const history = this.data.metricHistory[deviceId];
    if (!history || history.length === 0) {
      const dev = this.getDeviceById(deviceId);
      if (dev) {
        this.data.metricHistory[deviceId] = this.generateDeviceHistory(dev);
        return this.data.metricHistory[deviceId].slice(-limitCount);
      }
      return [];
    }
    return history.slice(-limitCount);
  }

  public getUsers(): AdminUserAccount[] {
    if (!this.data.users) {
      this.data.users = [...initialAdminUsers];
    }
    return this.data.users;
  }

  public findUserByEmail(email: string): AdminUserAccount | undefined {
    return this.getUsers().find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  }

  public deleteUser(id: string): boolean {
    const users = this.getUsers();
    const initialLen = users.length;
    this.data.users = users.filter((u) => u.id !== id);
    if (this.data.users.length !== initialLen) {
      this.saveDatabase(this.data);
      return true;
    }
    return false;
  }

  public updateUserRole(id: string, role: string, roleTitle?: string): AdminUserAccount | null {
    const users = this.getUsers();
    const user = users.find((u) => u.id === id);
    if (!user) return null;

    user.role = role as any;
    if (roleTitle) {
      user.roleTitle = roleTitle;
    } else {
      if (role === 'Admin') user.roleTitle = 'Chief System & Network Administrator';
      else if (role === 'Manager') user.roleTitle = 'NOC Operations Manager';
      else if (role === 'User') user.roleTitle = 'Campus Staff & Network Viewer';
    }

    this.saveDatabase(this.data);
    return user;
  }

  // 2FA OTP Verification Storage & Lifecycle
  private pendingOtps: Map<string, {
    email: string;
    otp: string;
    purpose: 'login' | 'signup';
    userData?: any;
    createdAt: number;
    expiresAt: number;
  }> = new Map();

  public createOtp(email: string, purpose: 'login' | 'signup', userData?: any): { otp: string; expiresAt: number } {
    const cleanEmail = email.trim().toLowerCase();
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const now = Date.now();
    const expiresAt = now + 10 * 60 * 1000; // 10 minutes

    this.pendingOtps.set(cleanEmail, {
      email: cleanEmail,
      otp,
      purpose,
      userData,
      createdAt: now,
      expiresAt,
    });

    console.log(`\n======================================================`);
    console.log(`[IUB 2FA SECURITY] SIMULATED EMAIL TO: ${cleanEmail}`);
    console.log(`[IUB 2FA SECURITY] PURPOSE: ${purpose.toUpperCase()}`);
    console.log(`[IUB 2FA SECURITY] 6-DIGIT VERIFICATION CODE: >>> [ ${otp} ] <<<`);
    console.log(`[IUB 2FA SECURITY] EXPIRES IN 10 MINUTES`);
    console.log(`======================================================\n`);

    return { otp, expiresAt };
  }

  public verifyOtp(email: string, otpAttempt: string): { 
    valid: boolean; 
    error?: string; 
    record?: { email: string; otp: string; purpose: 'login' | 'signup'; userData?: any } 
  } {
    const cleanEmail = email.trim().toLowerCase();
    const record = this.pendingOtps.get(cleanEmail);
    if (!record) {
      return { valid: false, error: 'No active OTP verification session found. Please request a new code.' };
    }

    if (Date.now() > record.expiresAt) {
      this.pendingOtps.delete(cleanEmail);
      return { valid: false, error: 'Verification code has expired. Please click Resend Code to obtain a new OTP.' };
    }

    if (record.otp.trim() !== otpAttempt.trim()) {
      return { valid: false, error: 'Invalid 6-digit verification code. Please check your simulated email and try again.' };
    }

    this.pendingOtps.delete(cleanEmail);
    return { valid: true, record };
  }

  public getPendingOtp(email: string) {
    return this.pendingOtps.get(email.trim().toLowerCase());
  }

  public createUser(userData: {
    fullName: string;
    email: string;
    password: string;
    role?: 'Admin' | 'Manager' | 'User' | 'ai_lead' | 'super_admin' | 'noc_manager' | 'campus_engineer';
    roleTitle?: string;
    department?: string;
    campusAccess?: CampusId | 'ALL';
    phoneNumber?: string;
  }): AdminUserAccount {
    const existing = this.findUserByEmail(userData.email);
    if (existing) {
      throw new Error(`An account with email ${userData.email} already exists.`);
    }

    const role = userData.role || 'User';
    const roleTitles: Record<string, string> = {
      Admin: 'Chief System & Network Administrator',
      Manager: 'NOC Operations Manager',
      User: 'Campus Staff & Network Viewer',
      ai_lead: 'AI Lead Engineer & NOC System Architect',
      super_admin: 'Chief Network Operations Super Admin',
      noc_manager: 'NOC Operations Manager',
      campus_engineer: 'Campus Network Engineer & Field Specialist',
    };

    const newUser: AdminUserAccount = {
      id: `USER-${Date.now().toString().slice(-6)}`,
      fullName: userData.fullName.trim(),
      email: userData.email.trim().toLowerCase(),
      passwordHash: userData.password,
      role,
      roleTitle: userData.roleTitle || roleTitles[role] || (role === 'Admin' ? 'Admin' : role === 'Manager' ? 'Manager' : 'User'),
      department: userData.department || 'Directorate of Information Technology (DIT)',
      campusAccess: userData.campusAccess || 'ALL',
      phoneNumber: userData.phoneNumber,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      twoFactorVerified: true,
    };

    if (!this.data.users) {
      this.data.users = [...initialAdminUsers];
    }
    this.data.users.push(newUser);
    this.saveDatabase(this.data);
    return newUser;
  }

  public verifyUser(email: string, passwordAttempt: string): AdminUserAccount | null {
    const user = this.findUserByEmail(email);
    if (!user) return null;
    if (user.passwordHash === passwordAttempt) {
      user.lastLogin = new Date().toISOString();
      this.saveDatabase(this.data);
      return user;
    }
    return null;
  }

  public getDashboardWidgets(userId: string = 'default'): DashboardWidget[] {
    if (!this.data.dashboardWidgets) {
      this.data.dashboardWidgets = {};
    }
    if (!this.data.dashboardWidgets[userId] || this.data.dashboardWidgets[userId].length === 0) {
      this.data.dashboardWidgets[userId] = [...DEFAULT_DASHBOARD_WIDGETS];
    }
    return this.data.dashboardWidgets[userId];
  }

  public saveDashboardWidgets(widgets: DashboardWidget[], userId: string = 'default'): DashboardWidget[] {
    if (!this.data.dashboardWidgets) {
      this.data.dashboardWidgets = {};
    }
    this.data.dashboardWidgets[userId] = widgets;
    this.saveDatabase(this.data);
    return this.data.dashboardWidgets[userId];
  }

  public resetDashboardWidgets(userId: string = 'default'): DashboardWidget[] {
    if (!this.data.dashboardWidgets) {
      this.data.dashboardWidgets = {};
    }
    this.data.dashboardWidgets[userId] = [...DEFAULT_DASHBOARD_WIDGETS];
    this.saveDatabase(this.data);
    return this.data.dashboardWidgets[userId];
  }

  public resetToDefaults() {
    this.data = {
      devices: initialDevices,
      fiberLinks: initialFiberLinks,
      securityEvents: initialSecurityEvents,
      alerts: initialAlerts,
      alertRules: initialAlertRules,
      systemMetrics: {
        prtgProbeStatus: 'active',
        zabbixAgentCount: 142,
        suricataRulesLoaded: 38450,
        wazuhActiveAgents: 184,
        totalPacketsAnalyzed: 14890200,
        snmpPollIntervalSec: 10,
        lastPollTimestamp: new Date().toISOString(),
        whatsappGatewayStatus: 'connected',
        smtpServerStatus: 'connected',
        googleSheetsSyncStatus: 'synced',
        lastSheetsSync: new Date().toISOString(),
      },
    };
    this.saveDatabase(this.data);
  }
}

export const db = new NetworkDatabase();
