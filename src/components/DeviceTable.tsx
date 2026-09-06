import React, { useState } from 'react';
import { 
  Server, 
  Router, 
  Phone, 
  Wifi, 
  Video, 
  Cable, 
  Box, 
  Terminal, 
  Power, 
  Edit3, 
  Trash2, 
  ArrowUpDown, 
  Download, 
  Plus, 
  FileSpreadsheet,
  Network,
  Activity,
  Check
} from 'lucide-react';
import { Device, CampusId } from '../types.ts';

interface DeviceTableProps {
  devices: Device[];
  onOpenDiagnostics: (device: Device) => void;
  onTogglePower: (id: string) => void;
  onEdit: (device: Device) => void;
  onDelete: (id: string) => void;
  onOpenAddModal: () => void;
  onOpenSheetsModal: () => void;
  onViewHistory?: (device: Device) => void;
  onOpenCollectorModal?: () => void;
}

export const DeviceTable: React.FC<DeviceTableProps> = ({
  devices,
  onOpenDiagnostics,
  onTogglePower,
  onEdit,
  onDelete,
  onOpenAddModal,
  onOpenSheetsModal,
  onViewHistory,
  onOpenCollectorModal,
}) => {
  const [sortField, setSortField] = useState<keyof Device>('campus');
  const [sortAsc, setSortAsc] = useState(true);
  const [exported, setExported] = useState(false);

  const handleSort = (field: keyof Device) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const sortedDevices = [...devices].sort((a, b) => {
    const valA = a[sortField];
    const valB = b[sortField];
    if (valA === undefined) return 1;
    if (valB === undefined) return -1;
    if (valA < valB) return sortAsc ? -1 : 1;
    if (valA > valB) return sortAsc ? 1 : -1;
    return 0;
  });

  const handleExportToCSV = () => {
    if (!sortedDevices.length) return;

    const headers = [
      'Device Name',
      'Device Number',
      'Device Type',
      'Campus',
      'Building',
      'Room No',
      'Device Location',
      'Rack ID',
      'Model',
      'IP Address',
      'MAC Address',
      'Status',
      'Switch Location',
      'Switch Building',
      'Switch Model',
      'Switch Port',
      'Device Port',
      'Ports Total',
      'Ports Active',
      'Latency (ms)',
      'Packet Loss (%)',
      'CPU (%)',
      'Memory (%)',
      'Temperature (C)',
      'Ingress Bandwidth (Mbps)',
      'Egress Bandwidth (Mbps)',
      'Fiber Cores',
      'PRTG Sensor ID',
      'Zabbix Host ID',
      'Last Seen',
      'Uptime'
    ];

    const escapeCsv = (str: any) => {
      if (str === null || str === undefined) return '""';
      const val = String(str).replace(/"/g, '""');
      return `"${val}"`;
    };

    const rows = sortedDevices.map((d) => [
      escapeCsv(d.name),
      escapeCsv(d.deviceNumber || 'N/A'),
      escapeCsv(d.type),
      escapeCsv(d.campus),
      escapeCsv(d.building),
      escapeCsv(d.roomNo),
      escapeCsv(d.deviceLocation || 'N/A'),
      escapeCsv(d.rackId),
      escapeCsv(d.model),
      escapeCsv(d.ipAddress),
      escapeCsv(d.macAddress),
      escapeCsv(d.status),
      escapeCsv(d.switchLocation || 'N/A'),
      escapeCsv(d.switchBuilding || 'N/A'),
      escapeCsv(d.switchModel || 'N/A'),
      escapeCsv(d.switchPort || 'N/A'),
      escapeCsv(d.devicePort || 'N/A'),
      d.portsTotal,
      d.portsActive,
      d.latencyMs,
      d.packetLoss,
      d.cpuUsage,
      d.memoryUsage,
      d.temperatureC !== undefined ? d.temperatureC : 'N/A',
      d.bandwidthInMbps !== undefined ? d.bandwidthInMbps : 0,
      d.bandwidthOutMbps !== undefined ? d.bandwidthOutMbps : 0,
      escapeCsv(d.fiberCores || 'N/A'),
      escapeCsv(d.prtgSensorId || 'N/A'),
      escapeCsv(d.zabbixHostId || 'N/A'),
      escapeCsv(d.lastSeen || 'N/A'),
      escapeCsv(d.uptime || 'N/A')
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateStr = new Date().toISOString().slice(0, 10);
    link.setAttribute('download', `iub_device_inventory_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setExported(true);
    setTimeout(() => setExported(false), 2500);
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'router':
        return <Router className="w-4 h-4 text-indigo-400" />;
      case 'switch':
        return <Server className="w-4 h-4 text-blue-400" />;
      case 'ip_phone':
        return <Phone className="w-4 h-4 text-amber-400" />;
      case 'access_point':
        return <Wifi className="w-4 h-4 text-cyan-400" />;
      case 'camera':
        return <Video className="w-4 h-4 text-rose-400" />;
      case 'rack':
        return <Box className="w-4 h-4 text-purple-400" />;
      case 'fiber_cable':
        return <Cable className="w-4 h-4 text-blue-500" />;
      default:
        return <Network className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="card-elegant overflow-hidden shadow-2xl">
      {/* Table Action Bar */}
      <div className="px-6 py-4 border-b border-[#2D3139] flex flex-wrap items-center justify-between gap-4 bg-[#16181D]">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span>IUB Device Inventory & Active Equipment Master Table</span>
            <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded bg-blue-900/20 text-blue-400 border border-blue-800/40">
              {devices.length} Devices Total
            </span>
          </h2>
          <p className="text-xs text-[#9CA3AF] mt-0.5">
            Full enterprise database synchronization with campus locations, port maps, and fiber connections.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {onOpenCollectorModal && (
            <button
              onClick={onOpenCollectorModal}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#0A0B0E] hover:bg-[#1E2229] text-blue-400 text-xs font-medium border border-[#2D3139] transition cursor-pointer"
              title="Configure Network Collector Agent & API Tokens"
            >
              <Server className="w-3.5 h-3.5" />
              <span>Collector Agents</span>
            </button>
          )}

          <button
            onClick={onOpenSheetsModal}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#0A0B0E] hover:bg-[#1E2229] text-emerald-400 text-xs font-medium border border-[#2D3139] transition cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Connect Google Sheets</span>
          </button>

          <button
            id="export-to-csv-btn"
            onClick={handleExportToCSV}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#0A0B0E] hover:bg-[#1E2229] text-[#E5E7EB] text-xs font-medium border border-[#2D3139] transition cursor-pointer"
            title="Export Device Inventory to CSV for offline reporting"
          >
            {exported ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Download className="w-3.5 h-3.5 text-blue-400" />
            )}
            <span>{exported ? 'Exported to CSV!' : 'Export to CSV'}</span>
          </button>

          <button
            onClick={onOpenAddModal}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-950/40 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Equipment</span>
          </button>
        </div>
      </div>

      {/* Table View */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-[#E5E7EB] border-collapse">
          <thead className="bg-[#0A0B0E] text-[#9CA3AF] uppercase tracking-wider text-[11px] border-b border-[#2D3139]">
            <tr>
              <th className="py-3 px-4 cursor-pointer hover:text-white" onClick={() => handleSort('status')}>
                <div className="flex items-center space-x-1">
                  <span>Status</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-4 cursor-pointer hover:text-white" onClick={() => handleSort('name')}>
                <div className="flex items-center space-x-1">
                  <span>Device Name / Type</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-4 cursor-pointer hover:text-white" onClick={() => handleSort('campus')}>
                <div className="flex items-center space-x-1">
                  <span>Campus</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-4">Building & Room</th>
              <th className="py-3 px-4 cursor-pointer hover:text-white" onClick={() => handleSort('rackId')}>
                <div className="flex items-center space-x-1">
                  <span>Rack ID</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-4 cursor-pointer hover:text-white" onClick={() => handleSort('ipAddress')}>
                <div className="flex items-center space-x-1">
                  <span>IP & MAC</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-4">Port Load</th>
              <th className="py-3 px-4 cursor-pointer hover:text-white" onClick={() => handleSort('latencyMs')}>
                <div className="flex items-center space-x-1">
                  <span>Latency</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2D3139]">
            {sortedDevices.map((device) => {
              const isOffline = device.status === 'offline';
              const isWarning = device.status === 'warning';
              const portPercentage = device.portsTotal > 0 ? Math.round((device.portsActive / device.portsTotal) * 100) : 0;

              return (
                <tr
                  key={device.id}
                  id={`table-row-${device.id}`}
                  className={`hover:bg-[#1E2229] transition ${
                    isOffline ? 'bg-red-950/10' : isWarning ? 'bg-amber-950/10' : ''
                  }`}
                >
                  {/* Status Indicator */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="status-indicator flex items-center gap-2">
                      <div className={`dot ${isOffline ? 'offline' : isWarning ? 'warning' : 'online'}`}></div>
                      <div>
                        <span className="capitalize font-mono text-[11px] text-[#E5E7EB] block">{device.status}</span>
                        <span className="text-[9px] font-mono text-gray-400 block" title={device.lastSeen}>
                          {device.lastSeen ? new Date(device.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Never'}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Name & Type */}
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2.5">
                      <div className="p-1.5 rounded bg-[#0A0B0E] border border-[#2D3139]">
                        {getDeviceIcon(device.type)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-white tracking-tight">{device.name}</span>
                          {device.deviceNumber && (
                            <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-800/40 font-semibold" title={`Device Number: ${device.deviceNumber}`}>
                              #{device.deviceNumber}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-[#9CA3AF] truncate max-w-[200px]">{device.model}</div>
                      </div>
                    </div>
                  </td>

                  {/* Campus Tag */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="campus-tag">
                      {device.campus}
                    </span>
                  </td>

                  {/* Building & Room */}
                  <td className="py-3 px-4 font-sans">
                    <div className="font-medium text-[#E5E7EB]">{device.building}</div>
                    <div className="text-[11px] text-[#9CA3AF] flex items-center gap-2">
                      <span>Room: <strong className="text-amber-400 font-mono">{device.roomNo}</strong></span>
                      {device.deviceLocation && (
                        <span className="text-gray-400 truncate max-w-[140px]" title={`Device Location: ${device.deviceLocation}`}>
                          &bull; <span className="text-cyan-300">{device.deviceLocation}</span>
                        </span>
                      )}
                    </div>
                    {(device.switchPort || device.devicePort || device.switchModel) && (
                      <div className="text-[10px] font-mono text-blue-400 mt-1 flex items-center gap-1.5" title={`Switch: ${device.switchModel || 'Switch'} | SW Port: ${device.switchPort || 'N/A'} | Dev Port: ${device.devicePort || 'N/A'}`}>
                        <span className="text-gray-400">SW:</span>
                        <span className="text-emerald-400 font-semibold">{device.switchPort || 'N/A'}</span>
                        <span className="text-gray-500">➔</span>
                        <span className="text-gray-400">Dev:</span>
                        <span className="text-cyan-400 font-semibold">{device.devicePort || 'N/A'}</span>
                      </div>
                    )}
                  </td>

                  {/* Rack ID */}
                  <td className="py-3 px-4 whitespace-nowrap font-mono text-gray-300">
                    <span className="px-1.5 py-0.5 rounded bg-[#0A0B0E] border border-[#2D3139] text-[11px]">
                      {device.rackId}
                    </span>
                  </td>

                  {/* IP & MAC */}
                  <td className="py-3 px-4 whitespace-nowrap font-mono">
                    <div className="text-blue-400 font-semibold">{device.ipAddress}</div>
                    <div className="text-[10px] text-gray-500">{device.macAddress}</div>
                  </td>

                  {/* Port Load Progress Bar */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-[#2D3139] h-1.5 rounded-full overflow-hidden">
                        <div className="bg-blue-500 h-full" style={{ width: `${portPercentage}%` }}></div>
                      </div>
                      <span className="text-[11px] font-mono text-gray-400">
                        {device.portsActive}/{device.portsTotal}
                      </span>
                    </div>
                    {device.fiberCores && (
                      <span className="inline-block text-[10px] font-mono text-amber-400 mt-0.5">
                        {device.fiberCores}-Core Fiber
                      </span>
                    )}
                  </td>

                  {/* Latency */}
                  <td className="py-3 px-4 whitespace-nowrap font-mono">
                    <span className={isOffline ? 'text-red-400 font-bold' : 'text-emerald-400'}>
                      {isOffline ? 'TIMEOUT' : `${device.latencyMs}ms`}
                    </span>
                  </td>

                  {/* Action Buttons */}
                  <td className="py-3 px-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end space-x-1.5">
                      {onViewHistory && (
                        <button
                          onClick={() => onViewHistory(device)}
                          className="p-1.5 rounded bg-[#0A0B0E] hover:bg-emerald-950/60 text-emerald-400 border border-[#2D3139] transition cursor-pointer"
                          title="View Historical Time-Series Charts (Latency, Bandwidth, CPU, RAM)"
                        >
                          <Activity className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        onClick={() => onOpenDiagnostics(device)}
                        className="p-1.5 rounded bg-[#0A0B0E] hover:bg-[#1E2229] text-blue-400 border border-[#2D3139] transition cursor-pointer"
                        title="Run Ping & Diagnostics"
                      >
                        <Terminal className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => onTogglePower(device.id)}
                        className={`p-1.5 rounded border border-[#2D3139] transition cursor-pointer ${
                          isOffline
                            ? 'bg-[#0A0B0E] hover:bg-emerald-950 text-emerald-400'
                            : 'bg-[#0A0B0E] hover:bg-red-950 text-red-400'
                        }`}
                        title={isOffline ? 'Power On' : 'Simulate Power Fail (Triggers Alert)'}
                      >
                        <Power className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => onEdit(device)}
                        className="p-1.5 rounded bg-[#0A0B0E] hover:bg-[#1E2229] text-gray-300 border border-[#2D3139] transition cursor-pointer"
                        title="Edit Device"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => onDelete(device.id)}
                        className="p-1.5 rounded bg-[#0A0B0E] hover:bg-red-950 text-gray-400 hover:text-red-400 border border-[#2D3139] transition cursor-pointer"
                        title="Delete Device"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
