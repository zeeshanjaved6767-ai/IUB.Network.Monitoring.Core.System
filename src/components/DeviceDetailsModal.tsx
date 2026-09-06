import React, { useState } from 'react';
import { 
  X, 
  Power, 
  Activity, 
  MapPin, 
  Server, 
  Router as RouterIcon, 
  Wifi, 
  Phone, 
  Video, 
  Box, 
  Cable, 
  Network, 
  Copy, 
  Check, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  HardDrive, 
  Cpu, 
  Thermometer, 
  ShieldCheck, 
  Zap,
  Building,
  DoorClosed,
  Radio,
  ExternalLink
} from 'lucide-react';
import { Device, CampusInfo } from '../types.ts';

interface DeviceDetailsModalProps {
  device: Device | null;
  isOpen: boolean;
  onClose: () => void;
  onTogglePower: (id: string) => void;
  onOpenDiagnostics?: (device: Device) => void;
  campuses?: CampusInfo[];
}

export const DeviceDetailsModal: React.FC<DeviceDetailsModalProps> = ({
  device,
  isOpen,
  onClose,
  onTogglePower,
  onOpenDiagnostics,
  campuses = [],
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isToggling, setIsToggling] = useState(false);

  if (!isOpen || !device) return null;

  const isOffline = device.status === 'offline';
  const isWarning = device.status === 'warning';

  const campusObj = campuses.find((c) => c.id === device.campus);
  const campusFullName = campusObj ? campusObj.name : `${device.campus} Campus`;

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleToggle = async () => {
    setIsToggling(true);
    try {
      await onTogglePower(device.id);
    } finally {
      setIsToggling(false);
    }
  };

  const getDeviceIcon = () => {
    switch (device.type) {
      case 'router':
        return <RouterIcon className="w-6 h-6 text-indigo-400" />;
      case 'switch':
        return <Server className="w-6 h-6 text-blue-400" />;
      case 'ip_phone':
        return <Phone className="w-6 h-6 text-amber-400" />;
      case 'access_point':
        return <Wifi className="w-6 h-6 text-cyan-400" />;
      case 'camera':
        return <Video className="w-6 h-6 text-rose-400" />;
      case 'rack':
        return <Box className="w-6 h-6 text-purple-400" />;
      case 'fiber_cable':
        return <Cable className="w-6 h-6 text-blue-500" />;
      default:
        return <Network className="w-6 h-6 text-gray-400" />;
    }
  };

  const formatOffTime = (iso?: string) => {
    if (!iso) return 'N/A';
    try {
      const d = new Date(iso);
      return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return iso;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div 
        className={`relative w-full max-w-3xl rounded-2xl border bg-[#0F1115] shadow-2xl overflow-hidden transition-all duration-300 my-8 ${
          isOffline 
            ? 'border-red-500/60 shadow-[0_0_40px_rgba(239,68,68,0.25)]' 
            : 'border-emerald-500/50 shadow-[0_0_40px_rgba(16,185,129,0.2)]'
        }`}
      >
        {/* Top Status Accent Bar */}
        <div 
          className={`h-2 w-full ${
            isOffline 
              ? 'bg-gradient-to-r from-red-600 via-rose-500 to-amber-600 animate-pulse' 
              : isWarning 
              ? 'bg-gradient-to-r from-amber-500 to-orange-500' 
              : 'bg-gradient-to-r from-emerald-500 via-teal-400 to-blue-500'
          }`} 
        />

        {/* Header */}
        <div className="p-6 border-b border-[#1E2229] flex items-start justify-between gap-4 bg-[#14171E]">
          <div className="flex items-start space-x-4">
            {/* Circular Device Icon Badge (Gole Shape) */}
            <div 
              className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 border-2 transition-all shadow-lg ${
                isOffline 
                  ? 'border-red-500 bg-red-950/80 shadow-[0_0_20px_rgba(239,68,68,0.5)] animate-pulse' 
                  : 'border-emerald-500 bg-emerald-950/80 shadow-[0_0_20px_rgba(16,185,129,0.4)]'
              }`}
            >
              {getDeviceIcon()}
            </div>

            <div>
              <div className="flex items-center flex-wrap gap-2 mb-1">
                <h2 className="text-xl font-bold text-white tracking-tight">
                  {device.name}
                </h2>
                {device.deviceNumber && (
                  <span className="px-2 py-0.5 text-xs font-mono rounded bg-[#1E2229] text-gray-300 border border-[#2D3139]">
                    {device.deviceNumber}
                  </span>
                )}
                {/* Online / Offline Status Badge */}
                {isOffline ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/40 shadow-sm animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    <span>🔴 OFFLINE (OFF)</span>
                  </span>
                ) : isWarning ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span>🟡 WARNING</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>🟢 ONLINE (ACTIVE)</span>
                  </span>
                )}
              </div>

              <p className="text-xs text-gray-400 flex items-center gap-1.5">
                <span className="font-semibold text-blue-400 uppercase">{device.type}</span>
                <span>&bull;</span>
                <span className="text-gray-300">{device.model}</span>
                <span>&bull;</span>
                <span className="text-gray-400">Campus: <strong className="text-white">{device.campus}</strong></span>
              </p>
            </div>
          </div>

          {/* Close button */}
          <button 
            onClick={onClose}
            className="p-2 rounded-lg bg-[#1E2229] hover:bg-[#2D3139] text-gray-400 hover:text-white transition cursor-pointer"
            title="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">

          {/* CRITICAL ALERT CALLOUT (When Device is OFF) */}
          {isOffline && (
            <div className="p-4 rounded-xl border border-red-500/40 bg-red-950/30 text-red-200 flex items-start gap-3.5 shadow-lg animate-fade-in">
              <AlertTriangle className="w-6 h-6 text-red-400 shrink-0 mt-0.5 animate-bounce" />
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-bold text-red-400 uppercase tracking-wide">
                    Equipment Offline / Power Down Detected
                  </h4>
                  <span className="text-xs bg-red-900/60 px-2 py-0.5 rounded border border-red-700/50 text-red-300 font-mono">
                    ICMP Timeout (999ms)
                  </span>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed">
                  This device stopped responding to ICMP & SNMP heartbeat probes. The automated NOC Watchdog has recorded this outage and triggered notification alerts.
                </p>
                <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-mono text-red-300">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-red-400" />
                    <strong>Off Time:</strong> {formatOffTime(device.offTime || device.lastSeen)}
                  </span>
                  {device.downtimeDuration && (
                    <span className="flex items-center gap-1.5 bg-red-900/40 px-2.5 py-0.5 rounded text-red-200">
                      <strong>Downtime Duration:</strong> {device.downtimeDuration}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* SECTION 1: PRIMARY NETWORK IDENTIFIERS & ADDRESSING */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* IP Address Card */}
            <div className="p-3.5 rounded-xl bg-[#14171E] border border-[#232730] flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider flex items-center justify-between">
                <span>IP Address</span>
                <button 
                  onClick={() => copyToClipboard(device.ipAddress, 'ip')}
                  className="text-gray-400 hover:text-blue-400 transition"
                  title="Copy IP"
                >
                  {copiedField === 'ip' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </span>
              <p className="text-base font-mono font-bold text-blue-400 mt-1">
                {device.ipAddress}
              </p>
              <span className="text-[10px] text-gray-500 mt-0.5">Static RFC1918 Address</span>
            </div>

            {/* MAC Address Card */}
            <div className="p-3.5 rounded-xl bg-[#14171E] border border-[#232730] flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider flex items-center justify-between">
                <span>MAC Address</span>
                <button 
                  onClick={() => copyToClipboard(device.macAddress, 'mac')}
                  className="text-gray-400 hover:text-blue-400 transition"
                  title="Copy MAC"
                >
                  {copiedField === 'mac' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </span>
              <p className="text-base font-mono font-bold text-purple-400 mt-1">
                {device.macAddress}
              </p>
              <span className="text-[10px] text-gray-500 mt-0.5">Physical Layer 2 Hardware ID</span>
            </div>

            {/* VLAN & Subnet */}
            <div className="p-3.5 rounded-xl bg-[#14171E] border border-[#232730] flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                VLAN Segmentation
              </span>
              <p className="text-base font-mono font-bold text-amber-400 mt-1">
                VLAN {device.vlanId || 10}
              </p>
              <span className="text-[10px] text-gray-500 mt-0.5">IEEE 802.1Q Tagged Subnet</span>
            </div>
          </div>

          {/* SECTION 2: EXACT PHYSICAL LOCATION & CAMPUS DETAILS */}
          <div className="p-4 rounded-xl bg-[#14171E] border border-[#232730] space-y-3">
            <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
              <MapPin className="w-4 h-4 text-rose-400" />
              <span>Campus & Physical Installation Location</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-2">
                <div className="flex items-center justify-between py-1.5 border-b border-[#1E2229]">
                  <span className="text-gray-400 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-blue-400" />
                    <strong>Campus:</strong>
                  </span>
                  <span className="font-semibold text-white">
                    {campusFullName} ({device.campus})
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-[#1E2229]">
                  <span className="text-gray-400 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-teal-400" />
                    <strong>Building Name:</strong>
                  </span>
                  <span className="font-semibold text-white text-right max-w-[200px] truncate" title={device.building}>
                    {device.building}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-[#1E2229]">
                  <span className="text-gray-400 flex items-center gap-1.5">
                    <DoorClosed className="w-3.5 h-3.5 text-amber-400" />
                    <strong>Room Number:</strong>
                  </span>
                  <span className="font-mono font-bold text-amber-300">
                    {device.roomNo}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between py-1.5 border-b border-[#1E2229]">
                  <span className="text-gray-400 flex items-center gap-1.5">
                    <Box className="w-3.5 h-3.5 text-purple-400" />
                    <strong>Server Rack ID:</strong>
                  </span>
                  <span className="font-mono font-semibold text-purple-300">
                    {device.rackId || 'Standard Wall Mount IDF'}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-[#1E2229]">
                  <span className="text-gray-400">
                    <strong>Specific Device Spot:</strong>
                  </span>
                  <span className="font-semibold text-gray-300 text-right max-w-[200px] truncate" title={device.deviceLocation}>
                    {device.deviceLocation || 'Desk / Wall Mounted'}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-[#1E2229]">
                  <span className="text-gray-400">
                    <strong>Campus NOC Lead:</strong>
                  </span>
                  <span className="font-semibold text-blue-400">
                    {campusObj?.nocLead || 'Mr. Zeeshan Javed (Lead)'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: PHYSICAL SWITCH & UPLINK TOPOLOGY */}
          <div className="p-4 rounded-xl bg-[#14171E] border border-[#232730] space-y-3">
            <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
              <Cable className="w-4 h-4 text-emerald-400" />
              <span>Upstream Switch & Port Linkage</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-[#0D0F13] border border-[#1E2229]">
                <span className="text-[11px] text-gray-400 block mb-1">Upstream Network Switch</span>
                <p className="font-semibold text-white">
                  {device.switchModel || 'Cisco Catalyst Modular Core Switch'}
                </p>
                <p className="text-[11px] text-gray-400 mt-1">
                  Location: {device.switchLocation || `${device.building} Closet`}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-[#0D0F13] border border-[#1E2229]">
                <span className="text-[11px] text-gray-400 block mb-1">Connected Switch Port</span>
                <p className="font-mono font-bold text-emerald-400">
                  Switch Port: {device.switchPort || 'GigabitEthernet1/0/1'}
                </p>
                <p className="font-mono text-[11px] text-blue-400 mt-1">
                  Device Port: {device.devicePort || 'Eth0 (PoE+ In)'}
                </p>
              </div>
            </div>
          </div>

          {/* SECTION 4: REAL-TIME TELEMETRY & METRICS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3 rounded-xl bg-[#14171E] border border-[#232730]">
              <span className="text-[11px] text-gray-400 block">ICMP Latency</span>
              <p className={`text-base font-bold mt-1 ${isOffline ? 'text-red-400' : 'text-emerald-400'}`}>
                {isOffline ? '999 ms' : `${device.latencyMs} ms`}
              </p>
              <span className="text-[10px] text-gray-500">RTT ping</span>
            </div>

            <div className="p-3 rounded-xl bg-[#14171E] border border-[#232730]">
              <span className="text-[11px] text-gray-400 block">Packet Loss</span>
              <p className={`text-base font-bold mt-1 ${isOffline ? 'text-red-400' : device.packetLoss > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {isOffline ? '100%' : `${device.packetLoss}%`}
              </p>
              <span className="text-[10px] text-gray-500">Backbone dropped</span>
            </div>

            <div className="p-3 rounded-xl bg-[#14171E] border border-[#232730]">
              <span className="text-[11px] text-gray-400 block">Physical Ports</span>
              <p className="text-base font-bold text-white mt-1">
                {device.portsActive} / {device.portsTotal}
              </p>
              <span className="text-[10px] text-gray-500">Active / Total</span>
            </div>

            <div className="p-3 rounded-xl bg-[#14171E] border border-[#232730]">
              <span className="text-[11px] text-gray-400 block">Uptime Status</span>
              <p className="text-sm font-semibold text-gray-200 mt-1 truncate" title={isOffline ? (device.downtimeDuration || 'Offline') : device.uptime}>
                {isOffline ? `Down (${device.downtimeDuration || 'Active'})` : device.uptime}
              </p>
              <span className="text-[10px] text-gray-500">Since last reboot</span>
            </div>
          </div>

          {/* Notes */}
          {device.notes && (
            <div className="p-3 rounded-xl bg-[#14171E] border border-[#232730] text-xs">
              <span className="text-gray-400 font-semibold block mb-1">NOC Operational Notes:</span>
              <p className="text-gray-300 leading-relaxed italic">{device.notes}</p>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#1E2229] bg-[#14171E] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span>Last Heartbeat: <strong>{new Date(device.lastSeen).toLocaleTimeString()}</strong></span>
          </div>

          <div className="flex items-center space-x-2.5 w-full sm:w-auto">
            {/* Toggle Power Button (Simulate ON / OFF) */}
            <button
              onClick={handleToggle}
              disabled={isToggling}
              className={`inline-flex items-center justify-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer ${
                isOffline 
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30' 
                  : 'bg-red-600/90 hover:bg-red-600 text-white shadow-red-900/30'
              }`}
              title={isOffline ? 'Turn device ON (Green)' : 'Turn device OFF (Red)'}
            >
              <Power className={`w-3.5 h-3.5 ${isToggling ? 'animate-spin' : ''}`} />
              <span>{isOffline ? '⚡ Turn Device ON (Restore)' : '🔴 Power Down (Turn OFF)'}</span>
            </button>

            {/* Live Diagnostics */}
            {onOpenDiagnostics && (
              <button
                onClick={() => {
                  onClose();
                  onOpenDiagnostics(device);
                }}
                className="inline-flex items-center justify-center space-x-1.5 px-4 py-2 rounded-xl bg-[#1E2229] hover:bg-[#2D3139] border border-[#2D3139] text-blue-400 hover:text-blue-300 text-xs font-semibold transition cursor-pointer"
              >
                <Activity className="w-3.5 h-3.5 text-blue-400" />
                <span>ICMP Diagnostics</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#1E2229] hover:bg-[#2D3139] text-gray-300 text-xs font-semibold transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
