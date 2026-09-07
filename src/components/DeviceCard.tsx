import React from 'react';
import { 
  Router, 
  Server, 
  Phone, 
  Wifi, 
  Video, 
  Box, 
  Cable, 
  Power, 
  Terminal, 
  Edit3, 
  Trash2, 
  MapPin, 
  Network,
  Activity,
  Pin
} from 'lucide-react';
import { Device } from '../types.ts';

interface DeviceCardProps {
  device: Device;
  onOpenDiagnostics: (device: Device) => void;
  onTogglePower: (id: string) => void;
  onEdit: (device: Device) => void;
  onDelete: (id: string) => void;
  onViewHistory?: (device: Device) => void;
  onPin?: (device: Device) => void;
  isPinned?: boolean;
}

export const DeviceCard: React.FC<DeviceCardProps> = ({
  device,
  onOpenDiagnostics,
  onTogglePower,
  onEdit,
  onDelete,
  onViewHistory,
  onPin,
  isPinned,
}) => {
  const getDeviceIcon = () => {
    switch (device.type) {
      case 'router':
        return <Router className="w-5 h-5 text-indigo-400" />;
      case 'switch':
        return <Server className="w-5 h-5 text-blue-400" />;
      case 'ip_phone':
        return <Phone className="w-5 h-5 text-amber-400" />;
      case 'access_point':
        return <Wifi className="w-5 h-5 text-cyan-400" />;
      case 'camera':
        return <Video className="w-5 h-5 text-rose-400" />;
      case 'rack':
        return <Box className="w-5 h-5 text-purple-400" />;
      case 'fiber_cable':
        return <Cable className="w-5 h-5 text-blue-500" />;
      default:
        return <Network className="w-5 h-5 text-gray-400" />;
    }
  };

  const isOffline = device.status === 'offline';
  const isWarning = device.status === 'warning';

  const portPercentage = device.portsTotal > 0 ? Math.round((device.portsActive / device.portsTotal) * 100) : 0;

  return (
    <div
      id={`device-card-${device.id}`}
      className={`card-elegant p-4 transition-all duration-200 hover:shadow-xl flex flex-col justify-between ${
        isOffline ? 'border-red-500/50 bg-[#16181D]' : ''
      }`}
    >
      {/* Top Bar: Icon, Name, Type, Status */}
      <div>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#0A0B0E] border border-[#2D3139] flex items-center justify-center">
              {getDeviceIcon()}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-bold text-white tracking-tight truncate max-w-[150px]" title={device.name}>
                  {device.name}
                </h3>
                {device.deviceNumber && (
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-800/40 font-semibold" title={`Device Number: ${device.deviceNumber}`}>
                    #{device.deviceNumber}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-gray-400 font-mono">{device.ipAddress}</p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-1.5">
              {onPin && (
                <button
                  onClick={() => onPin(device)}
                  className={`p-1 rounded border transition cursor-pointer ${
                    isPinned
                      ? 'bg-blue-600/30 border-blue-500 text-blue-400'
                      : 'bg-[#0A0B0E] border-[#2D3139] text-gray-400 hover:text-white hover:border-blue-500/50'
                  }`}
                  title={isPinned ? 'Metric is pinned to Landing Page (Click to manage)' : 'Pin Live Metrics to Landing Page'}
                >
                  <Pin className="w-3 h-3" />
                </button>
              )}
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#0A0B0E] border border-[#2D3139]">
                <div className={`dot ${isOffline ? 'offline' : isWarning ? 'warning' : 'online'}`}></div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-300">
                  {device.status}
                </span>
              </div>
            </div>
            <span className="campus-tag">
              {device.campus}
            </span>
          </div>
        </div>

        {/* Model and Location Specs */}
        <div className="mt-3 bg-[#0A0B0E] rounded-lg p-2.5 border border-[#2D3139] space-y-1.5 text-xs">
          <div className="flex items-center justify-between text-gray-300">
            <span className="text-gray-400">Model:</span>
            <span className="font-medium text-white truncate max-w-[180px]" title={device.model}>
              {device.model}
            </span>
          </div>

          <div className="flex items-start justify-between text-gray-300">
            <span className="text-gray-400 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-gray-400" />
              <span>Location:</span>
            </span>
            <span className="text-right text-white font-medium truncate max-w-[180px]" title={`${device.building} - ${device.roomNo}`}>
              {device.building}
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px] text-gray-400">
            <span>Room: <strong className="text-gray-200">{device.roomNo}</strong></span>
            <span>Rack: <strong className="text-amber-400 font-mono">{device.rackId}</strong></span>
          </div>

          {device.deviceLocation && (
            <div className="text-[11px] text-gray-400 truncate" title={`Device Location: ${device.deviceLocation}`}>
              Spot: <span className="text-cyan-300 font-medium">{device.deviceLocation}</span>
            </div>
          )}

          {/* Upstream Switch & Port Mapping */}
          {(device.switchPort || device.switchModel || device.devicePort || device.switchLocation) && (
            <div className="pt-1.5 border-t border-[#2D3139] text-[11px] space-y-1">
              <div className="flex items-center justify-between text-gray-300">
                <span className="text-gray-400 flex items-center gap-1">
                  <Network className="w-3 h-3 text-blue-400" />
                  <span>Switch:</span>
                </span>
                <span className="font-mono text-[10px] text-blue-300 truncate max-w-[160px]" title={`${device.switchModel || 'Switch'} (${device.switchBuilding || device.switchLocation || ''})`}>
                  {device.switchModel || device.switchBuilding || 'Upstream Switch'}
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className="text-gray-400">SW Port: <strong className="text-emerald-400">{device.switchPort || 'N/A'}</strong></span>
                <span className="text-gray-400">Dev Port: <strong className="text-cyan-400">{device.devicePort || 'N/A'}</strong></span>
              </div>
              {device.switchLocation && (
                <div className="text-[10px] text-gray-400 truncate" title={`Switch Location: ${device.switchLocation}`}>
                  Loc: <span className="text-gray-300">{device.switchLocation}</span>
                </div>
              )}
            </div>
          )}

          {/* Port Load Progress Bar */}
          <div className="pt-1.5 border-t border-[#2D3139]">
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="text-gray-400">Port Load:</span>
              <span className="font-mono text-blue-400">{device.portsActive}/{device.portsTotal} ({portPercentage}%)</span>
            </div>
            <div className="w-full bg-[#2D3139] h-1.5 rounded-full overflow-hidden">
              <div className="bg-blue-500 h-full" style={{ width: `${portPercentage}%` }}></div>
            </div>
          </div>
        </div>

        {/* Live Metrics Grid */}
        <div className="mt-3 grid grid-cols-4 gap-1.5 text-center text-[10px]">
          <div className="bg-[#0A0B0E] rounded p-1 border border-[#2D3139]">
            <span className="text-gray-400 block">Latency</span>
            <span className={`font-mono font-bold ${isOffline ? 'text-red-400' : 'text-emerald-400'}`}>
              {isOffline ? 'TIMEOUT' : `${device.latencyMs}ms`}
            </span>
          </div>

          <div className="bg-[#0A0B0E] rounded p-1 border border-[#2D3139]">
            <span className="text-gray-400 block">Loss</span>
            <span className={`font-mono font-bold ${device.packetLoss > 0 ? 'text-amber-400' : 'text-gray-200'}`}>
              {device.packetLoss}%
            </span>
          </div>

          <div className="bg-[#0A0B0E] rounded p-1 border border-[#2D3139]">
            <span className="text-gray-400 block">CPU</span>
            <span className={`font-mono font-bold ${device.cpuUsage > 75 ? 'text-rose-400' : 'text-gray-200'}`}>
              {isOffline ? '0%' : `${device.cpuUsage}%`}
            </span>
          </div>

          <div className="bg-[#0A0B0E] rounded p-1 border border-[#2D3139]">
            <span className="text-gray-400 block">Bandwidth</span>
            <span className="font-mono font-bold text-cyan-400">
              {isOffline ? '0M' : `${device.bandwidthInMbps}M`}
            </span>
          </div>
        </div>
      </div>

      {/* Action Footer Bar */}
      <div className="mt-3.5 pt-2.5 border-t border-[#2D3139] flex items-center justify-between gap-1 text-xs">
        <div className="flex items-center space-x-1">
          {onViewHistory && (
            <button
              id={`history-btn-${device.id}`}
              onClick={() => onViewHistory(device)}
              className="flex items-center space-x-1 px-2.5 py-1 rounded bg-[#0A0B0E] hover:bg-emerald-950/50 text-emerald-400 border border-[#2D3139] transition cursor-pointer text-[11px]"
              title="View Historical Bandwidth, Latency & CPU/RAM Charts"
            >
              <Activity className="w-3 h-3" />
              <span>History</span>
            </button>
          )}

          <button
            id={`diag-btn-${device.id}`}
            onClick={() => onOpenDiagnostics(device)}
            className="flex items-center space-x-1 px-2.5 py-1 rounded bg-[#0A0B0E] hover:bg-[#1E2229] text-blue-400 border border-[#2D3139] transition cursor-pointer text-[11px]"
            title="Run Live ICMP Ping & SNMP Walk Diagnostics"
          >
            <Terminal className="w-3 h-3" />
            <span>Diagnostics</span>
          </button>

          <button
            id={`power-btn-${device.id}`}
            onClick={() => onTogglePower(device.id)}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded border transition cursor-pointer text-[11px] ${
              device.status === 'online'
                ? 'bg-[#0A0B0E] hover:bg-red-950/40 text-red-400 border-[#2D3139]'
                : 'bg-[#0A0B0E] hover:bg-emerald-950/40 text-emerald-400 border-[#2D3139]'
            }`}
            title={device.status === 'online' ? 'Simulate Power Failure' : 'Power On'}
          >
            <Power className="w-3 h-3" />
            <span>{device.status === 'online' ? 'Simulate Off' : 'Power On'}</span>
          </button>
        </div>

        <div className="flex items-center space-x-1">
          {onPin && (
            <button
              id={`pin-btn-${device.id}`}
              onClick={() => onPin(device)}
              className={`p-1.5 rounded border transition cursor-pointer ${
                isPinned
                  ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                  : 'bg-[#0A0B0E] border-[#2D3139] text-gray-400 hover:text-cyan-300 hover:bg-[#1E2229]'
              }`}
              title={isPinned ? 'Widget is pinned to Landing Page' : 'Pin to Modular Dashboard'}
            >
              <Pin className="w-3 h-3" />
            </button>
          )}

          <button
            id={`edit-btn-${device.id}`}
            onClick={() => onEdit(device)}
            className="p-1.5 rounded bg-[#0A0B0E] hover:bg-[#1E2229] text-gray-300 hover:text-white border border-[#2D3139] transition cursor-pointer"
            title="Edit Device"
          >
            <Edit3 className="w-3 h-3" />
          </button>

          <button
            id={`delete-btn-${device.id}`}
            onClick={() => onDelete(device.id)}
            className="p-1.5 rounded bg-[#0A0B0E] hover:bg-red-950 text-gray-400 hover:text-red-300 border border-[#2D3139] transition cursor-pointer"
            title="Delete Device"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
