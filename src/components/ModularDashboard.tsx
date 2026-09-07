import React, { useState, useMemo } from 'react';
import { 
  GripVertical, 
  Pin, 
  X, 
  Maximize2, 
  Minimize2, 
  Terminal, 
  Power, 
  Activity, 
  ShieldCheck, 
  Cpu, 
  Wifi, 
  Server, 
  Router, 
  Sparkles, 
  Bot, 
  Copy, 
  Check, 
  ArrowLeft, 
  ArrowRight, 
  Plus, 
  RotateCcw, 
  Sliders, 
  Radio, 
  ExternalLink,
  ChevronDown,
  Layers,
  Flame,
  Info,
  Network
} from 'lucide-react';
import { 
  DashboardWidget, 
  Device, 
  CampusInfo, 
  SecurityEvent, 
  AdminUser, 
  WidgetWidth,
  WidgetType
} from '../types.ts';

interface ModularDashboardProps {
  widgets: DashboardWidget[];
  devices: Device[];
  campuses: CampusInfo[];
  securityEvents: SecurityEvent[];
  onReorderWidgets: (newWidgets: DashboardWidget[]) => void;
  onUnpinWidget: (widgetId: string) => void;
  onUpdateWidget: (widget: DashboardWidget) => void;
  onOpenPinModal: (type?: WidgetType, deviceId?: string) => void;
  onOpenDiagnostics: (device: Device) => void;
  onTogglePower: (deviceId: string) => void;
  onOpenChatWithQuery?: (query: string) => void;
  currentUser: AdminUser | null;
  onResetWidgets: () => void;
}

export const ModularDashboard: React.FC<ModularDashboardProps> = ({
  widgets,
  devices,
  campuses,
  securityEvents,
  onReorderWidgets,
  onUnpinWidget,
  onUpdateWidget,
  onOpenPinModal,
  onOpenDiagnostics,
  onTogglePower,
  onOpenChatWithQuery,
  currentUser,
  onResetWidgets,
}) => {
  // Drag & drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [copiedIp, setCopiedIp] = useState<string | null>(null);
  const [activePreset, setActivePreset] = useState<string>('custom');

  // Quick copy helper
  const handleCopyIp = (ip: string) => {
    navigator.clipboard.writeText(ip);
    setCopiedIp(ip);
    setTimeout(() => setCopiedIp(null), 2000);
  };

  // Reordering handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const updated = [...widgets];
    const [movedItem] = updated.splice(draggedIndex, 1);
    updated.splice(targetIndex, 0, movedItem);

    onReorderWidgets(updated);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const moveWidget = (fromIndex: number, direction: 'left' | 'right') => {
    const targetIndex = direction === 'left' ? fromIndex - 1 : fromIndex + 1;
    if (targetIndex < 0 || targetIndex >= widgets.length) return;

    const updated = [...widgets];
    const [movedItem] = updated.splice(fromIndex, 1);
    updated.splice(targetIndex, 0, movedItem);
    onReorderWidgets(updated);
  };

  // Toggle widget width
  const handleCycleWidth = (widget: DashboardWidget) => {
    const widths: WidgetWidth[] = ['1', '2', 'full'];
    const currentIdx = widths.indexOf(widget.width);
    const nextWidth = widths[(currentIdx + 1) % widths.length];
    onUpdateWidget({ ...widget, width: nextWidth });
  };

  // Preset layouts
  const handleApplyPreset = (presetName: string) => {
    setActivePreset(presetName);
    if (presetName === 'default') {
      onResetWidgets();
    } else if (presetName === 'soc') {
      // SOC Security layout
      const socWidgets: DashboardWidget[] = [
        {
          id: `widget-sec-radar-${Date.now()}`,
          type: 'security_radar',
          title: 'Campus Threat Defense Radar',
          subtitle: 'Autonomous BGP Blackholing & IPS Dropped Packets',
          width: 'full',
          colorTheme: 'purple',
          pinnedAt: new Date().toISOString(),
        },
        {
          id: `widget-sec-stream-${Date.now()}`,
          type: 'security_log',
          title: 'SOC Real-Time Threat Stream (Suricata & Wazuh)',
          subtitle: 'Live DPI Intrusion Prevention Stream',
          securityFilter: 'critical',
          width: '2',
          colorTheme: 'rose',
          pinnedAt: new Date().toISOString(),
        },
        {
          id: `widget-sec-bjc-${Date.now()}`,
          type: 'device_metric',
          title: 'BJC Core Router 01 — Attack Vector',
          subtitle: 'Target of recent DDoS SYN flood probes',
          deviceId: 'DEV-BJC-R01',
          metricCategory: 'latency',
          width: '1',
          colorTheme: 'blue',
          pinnedAt: new Date().toISOString(),
        },
      ];
      onReorderWidgets(socWidgets);
    } else if (presetName === 'performance') {
      // Core infrastructure latency & bandwidth layout
      const perfWidgets: DashboardWidget[] = [
        {
          id: `widget-latency-mat-${Date.now()}`,
          type: 'network_latency',
          title: 'Multi-Campus Backbone Latency Matrix',
          subtitle: 'Real-time ICMP ping times across all 6 campus sites',
          width: 'full',
          colorTheme: 'amber',
          pinnedAt: new Date().toISOString(),
        },
        {
          id: `widget-bjc-core-${Date.now()}`,
          type: 'device_metric',
          title: 'BJC Core Router 01 — Full Telemetry',
          subtitle: 'Baghdad Backbone Gateway',
          deviceId: 'DEV-BJC-R01',
          metricCategory: 'all',
          width: '2',
          colorTheme: 'blue',
          pinnedAt: new Date().toISOString(),
        },
        {
          id: `widget-bjc-sw-${Date.now()}`,
          type: 'device_metric',
          title: 'Baghdad Data Center Switch',
          subtitle: 'HPE FlexFabric High Density Aggregation',
          deviceId: 'DEV-BJC-SW01',
          metricCategory: 'bandwidth',
          width: '1',
          colorTheme: 'emerald',
          pinnedAt: new Date().toISOString(),
        },
      ];
      onReorderWidgets(perfWidgets);
    }
  };

  // Helper for width CSS classes
  const getColSpanClass = (width: WidgetWidth) => {
    switch (width) {
      case 'full':
        return 'col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-3';
      case '3':
        return 'col-span-1 md:col-span-2 lg:col-span-3';
      case '2':
        return 'col-span-1 md:col-span-2 lg:col-span-2';
      case '1':
      default:
        return 'col-span-1';
    }
  };

  const getThemeBorderClass = (theme?: string) => {
    switch (theme) {
      case 'emerald':
        return 'border-emerald-500/40 hover:border-emerald-500/70';
      case 'purple':
        return 'border-purple-500/40 hover:border-purple-500/70';
      case 'amber':
        return 'border-amber-500/40 hover:border-amber-500/70';
      case 'rose':
        return 'border-rose-500/40 hover:border-rose-500/70';
      case 'cyan':
        return 'border-cyan-500/40 hover:border-cyan-500/70';
      case 'blue':
      default:
        return 'border-blue-500/40 hover:border-blue-500/70';
    }
  };

  const getThemeHeaderBadge = (theme?: string) => {
    switch (theme) {
      case 'emerald':
        return 'bg-emerald-950/60 text-emerald-400 border-emerald-800/40';
      case 'purple':
        return 'bg-purple-950/60 text-purple-400 border-purple-800/40';
      case 'amber':
        return 'bg-amber-950/60 text-amber-400 border-amber-800/40';
      case 'rose':
        return 'bg-rose-950/60 text-rose-400 border-rose-800/40';
      case 'cyan':
        return 'bg-cyan-950/60 text-cyan-400 border-cyan-800/40';
      case 'blue':
      default:
        return 'bg-blue-950/60 text-blue-400 border-blue-800/40';
    }
  };

  return (
    <div className="space-y-4" id="modular-dashboard-container">
      
      {/* Top Banner Toolbar: Personalized Admin Header */}
      <div className="p-4 rounded-xl bg-[#12141A] border border-[#2D3139] shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Personalized Modular Dashboard
                </h2>
                <span className="badge-tool text-emerald-400 font-mono text-[10px] flex items-center gap-1">
                  <Radio className="w-2.5 h-2.5 animate-pulse text-emerald-400" />
                  <span>{widgets.length} Pinned Widgets</span>
                </span>
                <span className="hidden sm:inline-block badge-tool text-cyan-300 font-mono text-[10px]">
                  Drag & Drop Enabled
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Curated by <strong className="text-white">{currentUser?.fullName || 'NOC Administrator'}</strong> &bull; Grab the <span className="font-mono text-cyan-300">&#8942;&#8942; handle</span> to reorder widgets &bull; Changes persist automatically.
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls: Pin New, Presets, Reset */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Presets */}
          <div className="flex items-center space-x-1 bg-[#0A0B0E] p-1 rounded-lg border border-[#2D3139]">
            <span className="text-[10px] text-gray-400 font-semibold px-2 uppercase tracking-wider">Presets:</span>
            <button
              onClick={() => handleApplyPreset('default')}
              className={`px-2.5 py-1 rounded text-[11px] font-semibold transition cursor-pointer ${
                activePreset === 'default'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-[#1E2229]'
              }`}
            >
              Default
            </button>
            <button
              onClick={() => handleApplyPreset('soc')}
              className={`px-2.5 py-1 rounded text-[11px] font-semibold transition cursor-pointer ${
                activePreset === 'soc'
                  ? 'bg-rose-600 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-[#1E2229]'
              }`}
            >
              SOC Defense
            </button>
            <button
              onClick={() => handleApplyPreset('performance')}
              className={`px-2.5 py-1 rounded text-[11px] font-semibold transition cursor-pointer ${
                activePreset === 'performance'
                  ? 'bg-amber-600 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-[#1E2229]'
              }`}
            >
              Backbone Core
            </button>
          </div>

          <button
            id="btn-pin-modular-widget"
            onClick={() => onOpenPinModal()}
            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Pin Widget</span>
          </button>

          <button
            onClick={onResetWidgets}
            className="p-2 rounded-lg bg-[#0A0B0E] hover:bg-[#1E2229] text-gray-400 hover:text-white border border-[#2D3139] transition cursor-pointer"
            title="Reset to default pinned widgets"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Grid of Modular Pinned Widgets */}
      {widgets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
          {widgets.map((widget, index) => {
            const isDragging = draggedIndex === index;
            const isDragOver = dragOverIndex === index;
            const targetDevice = widget.deviceId ? devices.find((d) => d.id === widget.deviceId) : undefined;
            const targetCampus = widget.campusId ? campuses.find((c) => c.id === widget.campusId) : undefined;

            return (
              <div
                key={widget.id}
                draggable={true}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={() => {
                  setDraggedIndex(null);
                  setDragOverIndex(null);
                }}
                className={`${getColSpanClass(widget.width)} transition-all duration-200 ${
                  isDragging ? 'opacity-40 scale-[0.98]' : 'opacity-100'
                } ${
                  isDragOver ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-[#0A0B0E]' : ''
                }`}
              >
                <div className={`card-elegant p-4 rounded-xl border ${getThemeBorderClass(widget.colorTheme)} flex flex-col justify-between h-full bg-[#12141A] shadow-md relative group hover:shadow-xl`}>
                  
                  {/* Top Bar: Drag Handle, Title, Controls */}
                  <div>
                    <div className="flex items-start justify-between gap-2 pb-3 border-b border-[#2D3139]">
                      <div className="flex items-center space-x-2 truncate">
                        {/* Drag Handle */}
                        <div 
                          className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-[#1E2229] text-gray-400 hover:text-cyan-300 transition shrink-0"
                          title="Click and drag to reorder this widget on your dashboard"
                        >
                          <GripVertical className="w-4 h-4" />
                        </div>

                        <div className="truncate">
                          <div className="flex items-center gap-1.5">
                            <h3 className="text-xs font-bold text-white truncate" title={widget.title}>
                              {widget.title}
                            </h3>
                            <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border uppercase font-bold shrink-0 ${getThemeHeaderBadge(widget.colorTheme)}`}>
                              {widget.type === 'device_metric' ? 'Device Metric' : widget.type === 'security_log' ? 'SOC Log' : widget.type === 'security_radar' ? 'Threat Radar' : widget.type === 'campus_telemetry' ? 'Campus' : 'Latency'}
                            </span>
                          </div>
                          {widget.subtitle && (
                            <p className="text-[10px] text-gray-400 truncate mt-0.5">
                              {widget.subtitle}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Widget Controls: Move, Width, Unpin */}
                      <div className="flex items-center space-x-1 shrink-0">
                        {/* Move Buttons for Keyboard / Touch accessibility */}
                        <button
                          onClick={() => moveWidget(index, 'left')}
                          disabled={index === 0}
                          className="p-1 rounded bg-[#0A0B0E] hover:bg-[#1E2229] text-gray-400 hover:text-white border border-[#2D3139] disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                          title="Move Left / Up"
                        >
                          <ArrowLeft className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => moveWidget(index, 'right')}
                          disabled={index === widgets.length - 1}
                          className="p-1 rounded bg-[#0A0B0E] hover:bg-[#1E2229] text-gray-400 hover:text-white border border-[#2D3139] disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                          title="Move Right / Down"
                        >
                          <ArrowRight className="w-3 h-3" />
                        </button>

                        {/* Width toggle */}
                        <button
                          onClick={() => handleCycleWidth(widget)}
                          className="p-1 rounded bg-[#0A0B0E] hover:bg-[#1E2229] text-gray-400 hover:text-white border border-[#2D3139] transition cursor-pointer"
                          title={`Current size: ${widget.width === 'full' ? 'Full Width' : widget.width + ' Col'}. Click to cycle size.`}
                        >
                          {widget.width === 'full' ? (
                            <Minimize2 className="w-3 h-3 text-cyan-400" />
                          ) : (
                            <Maximize2 className="w-3 h-3" />
                          )}
                        </button>

                        {/* Unpin */}
                        <button
                          onClick={() => onUnpinWidget(widget.id)}
                          className="p-1 rounded bg-[#0A0B0E] hover:bg-red-950/60 text-gray-400 hover:text-red-400 border border-[#2D3139] transition cursor-pointer"
                          title="Unpin widget from landing page"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* WIDGET CONTENT BODY */}
                    <div className="pt-3">
                      
                      {/* TYPE 1: SPECIFIC DEVICE METRICS */}
                      {widget.type === 'device_metric' && (
                        <div>
                          {targetDevice ? (
                            <div className="space-y-3">
                              {/* Device status banner */}
                              <div className="flex items-center justify-between bg-[#0A0B0E] p-2 rounded-lg border border-[#2D3139]">
                                <div className="flex items-center space-x-2">
                                  <div className={`dot ${targetDevice.status === 'online' ? 'online' : targetDevice.status === 'warning' ? 'warning' : 'offline'}`} />
                                  <span className="font-mono text-xs text-white font-bold">{targetDevice.ipAddress}</span>
                                  <span className="text-[10px] text-gray-400 font-mono">({targetDevice.model})</span>
                                </div>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                                  targetDevice.status === 'online' ? 'text-emerald-400 bg-emerald-950/50' : 'text-red-400 bg-red-950/50'
                                }`}>
                                  {targetDevice.status}
                                </span>
                              </div>

                              {/* Live Metrics Grid */}
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                                {/* Latency */}
                                <div className="p-2 rounded bg-[#0A0B0E] border border-[#2D3139]">
                                  <span className="text-[10px] text-gray-400 uppercase tracking-wider block">ICMP Ping</span>
                                  <div className="flex items-baseline space-x-1 mt-0.5">
                                    <span className="text-sm font-bold font-mono text-emerald-400">{targetDevice.latencyMs}</span>
                                    <span className="text-[10px] text-gray-400 font-mono">ms</span>
                                  </div>
                                  <div className="text-[9px] text-gray-500 font-mono mt-0.5">Loss: {targetDevice.packetLoss}%</div>
                                </div>

                                {/* CPU Load */}
                                <div className="p-2 rounded bg-[#0A0B0E] border border-[#2D3139]">
                                  <span className="text-[10px] text-gray-400 uppercase tracking-wider block">CPU Load</span>
                                  <div className="flex items-baseline space-x-1 mt-0.5">
                                    <span className={`text-sm font-bold font-mono ${targetDevice.cpuUsage > 80 ? 'text-red-400' : targetDevice.cpuUsage > 60 ? 'text-amber-400' : 'text-cyan-400'}`}>
                                      {targetDevice.cpuUsage}%
                                    </span>
                                  </div>
                                  <div className="w-full bg-[#16181D] rounded-full h-1 mt-1 overflow-hidden">
                                    <div 
                                      className={`h-full ${targetDevice.cpuUsage > 80 ? 'bg-red-500' : targetDevice.cpuUsage > 60 ? 'bg-amber-500' : 'bg-cyan-500'}`} 
                                      style={{ width: `${targetDevice.cpuUsage}%` }}
                                    />
                                  </div>
                                </div>

                                {/* RAM Memory */}
                                <div className="p-2 rounded bg-[#0A0B0E] border border-[#2D3139]">
                                  <span className="text-[10px] text-gray-400 uppercase tracking-wider block">RAM Used</span>
                                  <div className="flex items-baseline space-x-1 mt-0.5">
                                    <span className="text-sm font-bold font-mono text-purple-400">{targetDevice.memoryUsage}%</span>
                                  </div>
                                  <div className="w-full bg-[#16181D] rounded-full h-1 mt-1 overflow-hidden">
                                    <div className="h-full bg-purple-500" style={{ width: `${targetDevice.memoryUsage}%` }} />
                                  </div>
                                </div>

                                {/* Bandwidth */}
                                <div className="p-2 rounded bg-[#0A0B0E] border border-[#2D3139]">
                                  <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Bandwidth</span>
                                  <div className="flex items-baseline space-x-1 mt-0.5">
                                    <span className="text-xs font-bold font-mono text-blue-400">{targetDevice.bandwidthInMbps}</span>
                                    <span className="text-[9px] text-gray-400">/</span>
                                    <span className="text-xs font-bold font-mono text-blue-300">{targetDevice.bandwidthOutMbps}</span>
                                  </div>
                                  <span className="text-[9px] text-gray-500 font-mono block">In / Out Mbps</span>
                                </div>
                              </div>

                              {/* Ports and Physical Placement info */}
                              <div className="flex flex-wrap items-center justify-between text-[11px] text-gray-400 px-1">
                                <span>Location: <strong className="text-gray-200">{targetDevice.building}</strong> (Room {targetDevice.roomNo})</span>
                                <span>Rack: <strong className="text-amber-400 font-mono">{targetDevice.rackId}</strong></span>
                                <span>Active Ports: <strong className="text-emerald-400 font-mono">{targetDevice.portsActive}/{targetDevice.portsTotal}</strong></span>
                              </div>
                            </div>
                          ) : (
                            <div className="p-4 bg-[#0A0B0E] rounded-lg border border-[#2D3139] text-center text-gray-400 text-xs">
                              Device record ({widget.deviceId}) not found or unprovisioned.
                            </div>
                          )}
                        </div>
                      )}

                      {/* TYPE 2: SECURITY LOG / SOC INCIDENT STREAM */}
                      {widget.type === 'security_log' && (
                        <div className="space-y-2.5">
                          {securityEvents.slice(0, widget.width === 'full' ? 4 : 2).map((evt) => (
                            <div key={evt.id} className="p-2.5 rounded-lg bg-[#0A0B0E] border border-[#2D3139] space-y-1.5 text-xs">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <span className="badge-tool font-semibold text-rose-400 text-[10px]">
                                    {evt.source}
                                  </span>
                                  <span className="font-bold text-white text-[11px] truncate max-w-[180px]">
                                    {evt.eventType}
                                  </span>
                                </div>
                                <span className={`text-[9px] font-bold font-mono uppercase px-1.5 py-0.5 rounded border ${
                                  evt.severity === 'critical' ? 'text-red-400 bg-red-950/60 border-red-800/40' : 'text-amber-400 bg-amber-950/60 border-amber-800/40'
                                }`}>
                                  {evt.severity}
                                </span>
                              </div>

                              <div className="grid grid-cols-2 gap-2 text-[11px]">
                                <div className="flex items-center space-x-1.5">
                                  <span className="text-gray-400">Attacker IP:</span>
                                  <button
                                    onClick={() => handleCopyIp(evt.attackerIp)}
                                    className="font-mono text-red-400 font-bold hover:underline cursor-pointer flex items-center gap-1"
                                    title="Click to copy IP"
                                  >
                                    <span>{evt.attackerIp}</span>
                                    {copiedIp === evt.attackerIp ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5 text-gray-500" />}
                                  </button>
                                </div>
                                <div className="text-right truncate">
                                  <span className="text-gray-400">Target: </span>
                                  <span className="font-mono text-blue-400 font-medium">{evt.targetDevice}</span>
                                </div>
                              </div>

                              <div className="flex items-center justify-between text-[10px] text-gray-400 pt-1 border-t border-[#2D3139]/60">
                                <span>Action: <strong className="text-emerald-400">{evt.actionTaken}</strong></span>
                                <span className="font-mono text-gray-500">{new Date(evt.timestamp).toLocaleTimeString()}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* TYPE 3: SECURITY RADAR & KPI GAUGE */}
                      {widget.type === 'security_radar' && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                          <div className="p-2.5 bg-[#0A0B0E] rounded-lg border border-[#2D3139]">
                            <span className="text-[10px] text-gray-400 uppercase tracking-wider block">DPI Rules</span>
                            <span className="text-sm font-bold font-mono text-white mt-1 block">38,450</span>
                            <span className="text-[10px] text-emerald-400">Suricata IPS Loaded</span>
                          </div>

                          <div className="p-2.5 bg-[#0A0B0E] rounded-lg border border-[#2D3139]">
                            <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Wazuh SIEM</span>
                            <span className="text-sm font-bold font-mono text-purple-400 mt-1 block">184 Agents</span>
                            <span className="text-[10px] text-purple-300">All Hosts Healthy</span>
                          </div>

                          <div className="p-2.5 bg-[#0A0B0E] rounded-lg border border-[#2D3139]">
                            <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Packets DPI</span>
                            <span className="text-sm font-bold font-mono text-blue-400 mt-1 block">14.89M</span>
                            <span className="text-[10px] text-blue-300">Zero Infiltration</span>
                          </div>

                          <div className="p-2.5 bg-[#0A0B0E] rounded-lg border border-[#2D3139]">
                            <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Auto Mitigation</span>
                            <span className="text-sm font-bold font-mono text-emerald-400 mt-1 block">99.98%</span>
                            <span className="text-[10px] text-emerald-300">BGP Blackhole / Drop</span>
                          </div>
                        </div>
                      )}

                      {/* TYPE 4: CAMPUS TELEMETRY */}
                      {widget.type === 'campus_telemetry' && (
                        <div>
                          {targetCampus ? (
                            <div className="space-y-2 text-xs">
                              <div className="grid grid-cols-3 gap-2">
                                <div className="p-2 rounded bg-[#0A0B0E] border border-[#2D3139] text-center">
                                  <span className="text-[10px] text-gray-400 uppercase block">Total Equipment</span>
                                  <span className="text-sm font-bold font-mono text-white mt-0.5 block">{targetCampus.totalDevices}</span>
                                </div>
                                <div className="p-2 rounded bg-[#0A0B0E] border border-[#2D3139] text-center">
                                  <span className="text-[10px] text-gray-400 uppercase block">Online</span>
                                  <span className="text-sm font-bold font-mono text-emerald-400 mt-0.5 block">{targetCampus.onlineDevices}</span>
                                </div>
                                <div className="p-2 rounded bg-[#0A0B0E] border border-[#2D3139] text-center">
                                  <span className="text-[10px] text-gray-400 uppercase block">Core Fiber</span>
                                  <span className="text-sm font-bold font-mono text-cyan-400 mt-0.5 block">{targetCampus.fiberStatus}</span>
                                </div>
                              </div>
                              <div className="flex items-center justify-between text-[11px] text-gray-400 px-1 pt-1">
                                <span>Bandwidth: <strong className="text-white">{targetCampus.coreBandwidth}</strong></span>
                                <span>NOC Lead: <strong className="text-gray-300">{targetCampus.nocLead}</strong></span>
                              </div>
                            </div>
                          ) : (
                            <div className="p-4 bg-[#0A0B0E] rounded-lg text-center text-gray-400 text-xs">
                              Campus data unavailable
                            </div>
                          )}
                        </div>
                      )}

                      {/* TYPE 5: NETWORK LATENCY MATRIX */}
                      {widget.type === 'network_latency' && (
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-xs">
                          {[
                            { name: 'BJC', ms: '1.2ms', status: 'optimal' },
                            { name: 'OLD', ms: '2.1ms', status: 'optimal' },
                            { name: 'RAILWAY', ms: '3.4ms', status: 'optimal' },
                            { name: 'RYK', ms: '14.8ms', status: 'optimal' },
                            { name: 'BWN', ms: '22.4ms', status: 'warning' },
                            { name: 'LQT', ms: '18.1ms', status: 'optimal' },
                          ].map((site) => (
                            <div key={site.name} className="p-2 rounded bg-[#0A0B0E] border border-[#2D3139]">
                              <span className="font-bold text-[10px] text-gray-300 block">{site.name}</span>
                              <span className={`text-xs font-mono font-bold mt-0.5 block ${site.status === 'optimal' ? 'text-emerald-400' : 'text-amber-400'}`}>
                                {site.ms}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                    </div>
                  </div>

                  {/* Widget Bottom Action Bar */}
                  <div className="pt-3 mt-3 border-t border-[#2D3139] flex items-center justify-between gap-2 text-xs">
                    {/* Device actions */}
                    {widget.type === 'device_metric' && targetDevice && (
                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={() => onOpenDiagnostics(targetDevice)}
                          className="flex items-center space-x-1 px-2 py-1 rounded bg-[#0A0B0E] hover:bg-[#1E2229] text-blue-400 border border-[#2D3139] transition cursor-pointer text-[10px]"
                          title="Run ICMP Ping & SNMP Walk"
                        >
                          <Terminal className="w-3 h-3" />
                          <span>Diagnostics</span>
                        </button>

                        <button
                          onClick={() => onTogglePower(targetDevice.id)}
                          className={`flex items-center space-x-1 px-2 py-1 rounded border transition cursor-pointer text-[10px] ${
                            targetDevice.status === 'online'
                              ? 'bg-[#0A0B0E] hover:bg-red-950/40 text-red-400 border-[#2D3139]'
                              : 'bg-[#0A0B0E] hover:bg-emerald-950/40 text-emerald-400 border-[#2D3139]'
                          }`}
                          title="Simulate Power State Change"
                        >
                          <Power className="w-3 h-3" />
                          <span>{targetDevice.status === 'online' ? 'Simulate Off' : 'Power On'}</span>
                        </button>
                      </div>
                    )}

                    {/* Security log actions */}
                    {widget.type === 'security_log' && onOpenChatWithQuery && (
                      <button
                        onClick={() => onOpenChatWithQuery('Analyze recent Suricata & Wazuh SOC threat alerts for malicious attacker IPs and propose autonomous firewall block rules.')}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-[#0A0B0E] hover:bg-rose-950/40 text-rose-400 border border-[#2D3139] transition cursor-pointer text-[10px] font-semibold"
                      >
                        <Bot className="w-3 h-3" />
                        <span>Investigate with AI Lead</span>
                      </button>
                    )}

                    {widget.type === 'security_radar' && onOpenChatWithQuery && (
                      <button
                        onClick={() => onOpenChatWithQuery('Generate a comprehensive Campus Threat Defense posture report for Mr. Zeeshan Javed (AI Lead Engineer).')}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-[#0A0B0E] hover:bg-purple-950/40 text-purple-400 border border-[#2D3139] transition cursor-pointer text-[10px] font-semibold"
                      >
                        <Bot className="w-3 h-3" />
                        <span>AI Posture Audit</span>
                      </button>
                    )}

                    {(widget.type === 'campus_telemetry' || widget.type === 'network_latency') && (
                      <div className="flex items-center space-x-1 text-[10px] text-emerald-400">
                        <Radio className="w-3 h-3 animate-pulse" />
                        <span>Syncing every 10s via SNMP</span>
                      </div>
                    )}

                    <div className="text-[10px] text-gray-500 font-mono ml-auto">
                      Pinned: {new Date(widget.pinnedAt).toLocaleDateString()}
                    </div>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="card-elegant p-8 text-center rounded-xl border border-dashed border-[#2D3139] bg-[#0A0B0E]/50 space-y-3">
          <div className="w-12 h-12 rounded-full bg-blue-600/10 text-blue-400 border border-blue-500/20 flex items-center justify-center mx-auto">
            <Pin className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-white">No Modular Widgets Pinned Yet</h3>
          <p className="text-xs text-gray-400 max-w-md mx-auto">
            Pin specific equipment telemetry (CPU, RAM, Latency, Bandwidth) or live Suricata/Wazuh security logs to build your personalized admin NOC view.
          </p>
          <div className="pt-2 flex items-center justify-center gap-2">
            <button
              onClick={() => onOpenPinModal()}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Pin Your First Widget</span>
            </button>
            <button
              onClick={onResetWidgets}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-[#16181D] hover:bg-[#1E2229] text-gray-300 text-xs font-semibold border border-[#2D3139] transition cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Load Recommended Widgets</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
