import React, { useState, useMemo } from 'react';
import { 
  X, 
  Pin, 
  Router, 
  Server, 
  ShieldCheck, 
  Activity, 
  Gauge, 
  Zap, 
  Terminal, 
  Radio, 
  MapPin, 
  Search, 
  Check, 
  Sliders, 
  Palette,
  Columns,
  Cpu,
  ArrowRight
} from 'lucide-react';
import { 
  Device, 
  CampusInfo, 
  CampusId, 
  SecurityEvent, 
  DashboardWidget, 
  WidgetType, 
  WidgetWidth 
} from '../types.ts';

interface PinWidgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  devices: Device[];
  campuses: CampusInfo[];
  securityEvents: SecurityEvent[];
  onPinWidget: (widget: DashboardWidget) => void;
  initialDeviceId?: string;
  initialWidgetType?: WidgetType;
}

export const PinWidgetModal: React.FC<PinWidgetModalProps> = ({
  isOpen,
  onClose,
  devices,
  campuses,
  securityEvents,
  onPinWidget,
  initialDeviceId,
  initialWidgetType = 'device_metric',
}) => {
  const [activeTab, setActiveTab] = useState<'device' | 'security' | 'campus' | 'network'>(() => {
    if (initialWidgetType === 'security_log' || initialWidgetType === 'security_radar') return 'security';
    if (initialWidgetType === 'campus_telemetry') return 'campus';
    if (initialWidgetType === 'network_latency') return 'network';
    return 'device';
  });

  // Device selection state
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>(
    initialDeviceId || devices[0]?.id || 'DEV-BJC-R01'
  );
  const [deviceSearch, setDeviceSearch] = useState('');
  const [deviceCampusFilter, setDeviceCampusFilter] = useState<CampusId | 'ALL'>('ALL');
  const [metricCategory, setMetricCategory] = useState<'all' | 'cpu_ram' | 'latency' | 'bandwidth' | 'ports' | 'power'>('all');

  // Security selection state
  const [securityFilter, setSecurityFilter] = useState<'all' | 'critical' | 'suricata' | 'wazuh'>('all');
  const [securityWidgetType, setSecurityWidgetType] = useState<'security_log' | 'security_radar'>('security_log');

  // Campus selection state
  const [selectedCampusId, setSelectedCampusId] = useState<CampusId>('BJC');

  // Appearance configuration
  const [widgetWidth, setWidgetWidth] = useState<WidgetWidth>('2');
  const [colorTheme, setColorTheme] = useState<'blue' | 'emerald' | 'purple' | 'amber' | 'rose' | 'cyan'>('blue');
  const [customTitle, setCustomTitle] = useState('');
  const [customNotes, setCustomNotes] = useState('');

  // Filter devices
  const filteredDevices = useMemo(() => {
    return devices.filter((d) => {
      if (deviceCampusFilter !== 'ALL' && d.campus !== deviceCampusFilter) return false;
      if (deviceSearch) {
        const q = deviceSearch.toLowerCase();
        return (
          d.name.toLowerCase().includes(q) ||
          d.ipAddress.toLowerCase().includes(q) ||
          d.model.toLowerCase().includes(q) ||
          d.building.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [devices, deviceCampusFilter, deviceSearch]);

  const selectedDevice = useMemo(() => {
    return devices.find((d) => d.id === selectedDeviceId) || devices[0];
  }, [devices, selectedDeviceId]);

  if (!isOpen) return null;

  const handlePin = () => {
    let newWidget: DashboardWidget;
    const now = new Date().toISOString();

    if (activeTab === 'device') {
      if (!selectedDevice) return;
      newWidget = {
        id: `widget-dev-${selectedDevice.id}-${Date.now()}`,
        type: 'device_metric',
        title: customTitle.trim() || `${selectedDevice.name} — Telemetry`,
        subtitle: `${selectedDevice.model} &bull; ${selectedDevice.building} (${selectedDevice.campus})`,
        deviceId: selectedDevice.id,
        metricCategory,
        width: widgetWidth,
        colorTheme,
        pinnedAt: now,
        customNotes: customNotes.trim() || undefined,
      };
    } else if (activeTab === 'security') {
      const isRadar = securityWidgetType === 'security_radar';
      newWidget = {
        id: `widget-sec-${Date.now()}`,
        type: isRadar ? 'security_radar' : 'security_log',
        title: customTitle.trim() || (isRadar ? 'Campus Threat Defense Radar' : 'SOC Real-Time Threat Stream'),
        subtitle: isRadar 
          ? 'Autonomous BGP Blackholing & IPS Dropped Packets' 
          : `Live Suricata DPI & Wazuh SIEM Stream (${securityFilter.toUpperCase()})`,
        securityFilter,
        width: widgetWidth,
        colorTheme: colorTheme === 'blue' ? 'rose' : colorTheme,
        pinnedAt: now,
        customNotes: customNotes.trim() || undefined,
      };
    } else if (activeTab === 'campus') {
      const camp = campuses.find((c) => c.id === selectedCampusId);
      newWidget = {
        id: `widget-camp-${selectedCampusId}-${Date.now()}`,
        type: 'campus_telemetry',
        title: customTitle.trim() || `${camp?.name || selectedCampusId} Health Overview`,
        subtitle: `Core Bandwidth: ${camp?.coreBandwidth || '10 Gbps'} &bull; Fiber: ${camp?.fiberStatus || 'Optimal'}`,
        campusId: selectedCampusId,
        width: widgetWidth,
        colorTheme: colorTheme === 'blue' ? 'emerald' : colorTheme,
        pinnedAt: now,
        customNotes: customNotes.trim() || undefined,
      };
    } else {
      newWidget = {
        id: `widget-latency-${Date.now()}`,
        type: 'network_latency',
        title: customTitle.trim() || 'Multi-Campus Backbone Latency Matrix',
        subtitle: 'Real-time ICMP ping times across all 6 campus sites',
        width: widgetWidth,
        colorTheme: colorTheme === 'blue' ? 'amber' : colorTheme,
        pinnedAt: now,
        customNotes: customNotes.trim() || undefined,
      };
    }

    onPinWidget(newWidget);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#12141A] border border-[#2D3139] rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2D3139] bg-[#0A0B0E]">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Pin className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <span>Pin Modular Widget to Landing Page</span>
                <span className="badge-tool text-cyan-300 font-mono text-[10px]">Drag & Drop Compatible</span>
              </h2>
              <p className="text-xs text-gray-400">
                Pin live equipment metrics, SOC security logs, or campus telemetry to your personalized dashboard view.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#1E2229] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center px-6 pt-3 border-b border-[#2D3139] bg-[#0E1015] gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('device')}
            className={`flex items-center space-x-2 px-3.5 py-2.5 text-xs font-semibold rounded-t-lg transition border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'device'
                ? 'border-blue-500 text-blue-400 bg-[#16181D]'
                : 'border-transparent text-gray-400 hover:text-white hover:bg-[#16181D]/50'
            }`}
          >
            <Server className="w-4 h-4" />
            <span>Specific Device Metrics</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`flex items-center space-x-2 px-3.5 py-2.5 text-xs font-semibold rounded-t-lg transition border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'security'
                ? 'border-rose-500 text-rose-400 bg-[#16181D]'
                : 'border-transparent text-gray-400 hover:text-white hover:bg-[#16181D]/50'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Security Logs & SOC Stream</span>
          </button>

          <button
            onClick={() => setActiveTab('campus')}
            className={`flex items-center space-x-2 px-3.5 py-2.5 text-xs font-semibold rounded-t-lg transition border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'campus'
                ? 'border-emerald-500 text-emerald-400 bg-[#16181D]'
                : 'border-transparent text-gray-400 hover:text-white hover:bg-[#16181D]/50'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Campus Telemetry</span>
          </button>

          <button
            onClick={() => setActiveTab('network')}
            className={`flex items-center space-x-2 px-3.5 py-2.5 text-xs font-semibold rounded-t-lg transition border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'network'
                ? 'border-amber-500 text-amber-400 bg-[#16181D]'
                : 'border-transparent text-gray-400 hover:text-white hover:bg-[#16181D]/50'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Backbone Latency Matrix</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          
          {/* TAB 1: DEVICE METRICS */}
          {activeTab === 'device' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <span className="font-bold text-white text-xs uppercase tracking-wider">
                  1. Select Equipment to Monitor
                </span>
                
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search device name, IP..."
                      value={deviceSearch}
                      onChange={(e) => setDeviceSearch(e.target.value)}
                      className="pl-8 pr-2.5 py-1 bg-[#0A0B0E] border border-[#2D3139] rounded-lg text-white text-xs placeholder-gray-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  
                  <select
                    value={deviceCampusFilter}
                    onChange={(e) => setDeviceCampusFilter(e.target.value as any)}
                    className="bg-[#0A0B0E] border border-[#2D3139] rounded-lg px-2.5 py-1 text-white text-xs focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="ALL">All Campuses</option>
                    {campuses.map((c) => (
                      <option key={c.id} value={c.id}>{c.shortName}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Device Selector List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1 border border-[#2D3139] rounded-xl bg-[#0A0B0E]">
                {filteredDevices.map((dev) => (
                  <button
                    key={dev.id}
                    onClick={() => setSelectedDeviceId(dev.id)}
                    className={`flex items-start justify-between p-2.5 rounded-lg text-left transition cursor-pointer border ${
                      selectedDeviceId === dev.id
                        ? 'bg-blue-600/20 border-blue-500 text-white shadow-sm'
                        : 'bg-[#12141A] border-transparent hover:border-[#2D3139] text-gray-300'
                    }`}
                  >
                    <div className="truncate pr-2">
                      <div className="font-bold text-white text-xs truncate">{dev.name}</div>
                      <div className="text-[11px] font-mono text-gray-400">{dev.ipAddress} &bull; {dev.campus}</div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase font-mono ${
                        dev.status === 'online' ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40' : 'bg-red-950/60 text-red-400 border border-red-800/40'
                      }`}>
                        {dev.status}
                      </span>
                      <span className="text-[10px] text-gray-400 font-mono">{dev.latencyMs}ms</span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Metric Focus */}
              <div>
                <span className="font-bold text-white text-xs uppercase tracking-wider block mb-2">
                  2. Focus Telemetry Dimension
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'all', label: 'All-in-One Health', desc: 'CPU, RAM, Latency & Ports' },
                    { id: 'cpu_ram', label: 'CPU & Memory Load', desc: 'Hardware Utilization' },
                    { id: 'latency', label: 'ICMP Latency & Jitter', desc: 'Network Packet Transit' },
                    { id: 'bandwidth', label: 'Bandwidth RX / TX', desc: 'Real-Time Interface I/O' },
                    { id: 'ports', label: 'Physical Port Density', desc: 'Active Uplinks & SFP+' },
                    { id: 'power', label: 'Power & Status', desc: 'Uptime & Operational State' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setMetricCategory(m.id as any)}
                      className={`p-2.5 rounded-lg text-left transition cursor-pointer border ${
                        metricCategory === m.id
                          ? 'bg-blue-600/20 border-blue-500 text-white'
                          : 'bg-[#0A0B0E] border-[#2D3139] hover:bg-[#16181D] text-gray-400'
                      }`}
                    >
                      <div className="font-bold text-xs text-white">{m.label}</div>
                      <div className="text-[10px] text-gray-400 mt-0.5">{m.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SECURITY LOGS & SOC */}
          {activeTab === 'security' && (
            <div className="space-y-4">
              <div>
                <span className="font-bold text-white text-xs uppercase tracking-wider block mb-2">
                  1. Select Security Display Mode
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={() => setSecurityWidgetType('security_log')}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      securityWidgetType === 'security_log'
                        ? 'bg-rose-600/20 border-rose-500 text-white'
                        : 'bg-[#0A0B0E] border-[#2D3139] hover:bg-[#16181D] text-gray-400'
                    }`}
                  >
                    <div className="flex items-center space-x-2 font-bold text-xs text-white">
                      <Terminal className="w-4 h-4 text-rose-400" />
                      <span>Live Incident Log Stream</span>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1">
                      Stream of live IDS alerts, attacker IPs, DPI signatures, and autonomous actions.
                    </p>
                  </button>

                  <button
                    onClick={() => setSecurityWidgetType('security_radar')}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      securityWidgetType === 'security_radar'
                        ? 'bg-purple-600/20 border-purple-500 text-white'
                        : 'bg-[#0A0B0E] border-[#2D3139] hover:bg-[#16181D] text-gray-400'
                    }`}
                  >
                    <div className="flex items-center space-x-2 font-bold text-xs text-white">
                      <ShieldCheck className="w-4 h-4 text-purple-400" />
                      <span>Campus Threat Radar & KPI Gauge</span>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1">
                      Summary counters of critical threats, blocked IPs, DPI rules, and Wazuh SIEM agents.
                    </p>
                  </button>
                </div>
              </div>

              {securityWidgetType === 'security_log' && (
                <div>
                  <span className="font-bold text-white text-xs uppercase tracking-wider block mb-2">
                    2. Filter Incident Severity & Source
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'all', label: 'All Incidents', desc: 'Suricata + Wazuh' },
                      { id: 'critical', label: 'Critical & High Only', desc: 'Priority attacks' },
                      { id: 'suricata', label: 'Suricata IPS Only', desc: 'DPI Packet Stream' },
                      { id: 'wazuh', label: 'Wazuh SIEM Only', desc: 'Host & Endpoint logs' },
                    ].map((sf) => (
                      <button
                        key={sf.id}
                        onClick={() => setSecurityFilter(sf.id as any)}
                        className={`p-2.5 rounded-lg border text-left transition cursor-pointer ${
                          securityFilter === sf.id
                            ? 'bg-rose-600/20 border-rose-500 text-white'
                            : 'bg-[#0A0B0E] border-[#2D3139] hover:bg-[#16181D] text-gray-400'
                        }`}
                      >
                        <div className="font-bold text-xs text-white">{sf.label}</div>
                        <div className="text-[10px] text-gray-400 mt-0.5">{sf.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CAMPUS TELEMETRY */}
          {activeTab === 'campus' && (
            <div className="space-y-4">
              <span className="font-bold text-white text-xs uppercase tracking-wider block mb-2">
                Select Campus Location to Pin
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {campuses.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCampusId(c.id)}
                    className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
                      selectedCampusId === c.id
                        ? 'bg-emerald-600/20 border-emerald-500 text-white'
                        : 'bg-[#0A0B0E] border-[#2D3139] hover:bg-[#16181D] text-gray-400'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-white">{c.name}</span>
                      <span className="badge-tool text-emerald-400 font-mono text-[10px]">{c.id}</span>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-1 text-[11px] text-gray-400">
                      <div>Devices: <strong className="text-white">{c.totalDevices}</strong></div>
                      <div>Bandwidth: <strong className="text-cyan-400">{c.coreBandwidth}</strong></div>
                      <div>Fiber Link: <strong className="text-emerald-400">{c.fiberStatus}</strong></div>
                      <div>Lead: <span className="truncate block text-gray-300">{c.nocLead.split(' ')[0]}</span></div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: NETWORK BACKBONE LATENCY */}
          {activeTab === 'network' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#0A0B0E] border border-[#2D3139] space-y-2">
                <div className="flex items-center space-x-2 text-amber-400">
                  <Activity className="w-5 h-5" />
                  <span className="font-bold text-sm text-white">Multi-Campus Backbone Latency Matrix</span>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed">
                  Pinning this widget provides a live comparative latency ticker across all six university campuses: Baghdad-ul-Jadeed (BJC), Abbasia Old Campus, Railway Campus, Rahim Yar Khan (RYK), Bahawalnagar (BWN), and Liaquatpur (LQT).
                </p>
                <div className="grid grid-cols-3 gap-2 pt-2 text-[11px] font-mono">
                  <div className="p-2 bg-[#16181D] rounded border border-[#2D3139] text-gray-300">BJC: <strong className="text-emerald-400">1.2ms</strong></div>
                  <div className="p-2 bg-[#16181D] rounded border border-[#2D3139] text-gray-300">OLD: <strong className="text-emerald-400">2.1ms</strong></div>
                  <div className="p-2 bg-[#16181D] rounded border border-[#2D3139] text-gray-300">RYK: <strong className="text-emerald-400">14.8ms</strong></div>
                </div>
              </div>
            </div>
          )}

          {/* COMMON WIDGET CUSTOMIZATION: Width, Color Theme & Title */}
          <div className="pt-4 border-t border-[#2D3139] space-y-4">
            <span className="font-bold text-white text-xs uppercase tracking-wider block">
              Customize Widget Layout & Styling
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Width */}
              <div>
                <label className="text-[11px] text-gray-400 font-medium block mb-1.5 flex items-center gap-1.5">
                  <Columns className="w-3.5 h-3.5 text-blue-400" />
                  <span>Widget Size / Column Span:</span>
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { val: '1', label: '1 Col (1x)' },
                    { val: '2', label: '2 Col (2x)' },
                    { val: '3', label: '3 Col (3x)' },
                    { val: 'full', label: 'Full Width' },
                  ].map((w) => (
                    <button
                      key={w.val}
                      onClick={() => setWidgetWidth(w.val as any)}
                      className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition cursor-pointer border text-center ${
                        widgetWidth === w.val
                          ? 'bg-blue-600 text-white border-blue-500'
                          : 'bg-[#0A0B0E] border-[#2D3139] text-gray-400 hover:text-white'
                      }`}
                    >
                      {w.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Theme */}
              <div>
                <label className="text-[11px] text-gray-400 font-medium block mb-1.5 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-purple-400" />
                  <span>Accent Color Theme:</span>
                </label>
                <div className="flex items-center gap-2">
                  {[
                    { id: 'blue', color: 'bg-blue-500', ring: 'ring-blue-500' },
                    { id: 'emerald', color: 'bg-emerald-500', ring: 'ring-emerald-500' },
                    { id: 'purple', color: 'bg-purple-500', ring: 'ring-purple-500' },
                    { id: 'amber', color: 'bg-amber-500', ring: 'ring-amber-500' },
                    { id: 'rose', color: 'bg-rose-500', ring: 'ring-rose-500' },
                    { id: 'cyan', color: 'bg-cyan-500', ring: 'ring-cyan-500' },
                  ].map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setColorTheme(c.id as any)}
                      className={`w-6 h-6 rounded-full ${c.color} transition cursor-pointer flex items-center justify-center ${
                        colorTheme === c.id ? `ring-2 ring-offset-2 ring-offset-[#12141A] ${c.ring}` : 'opacity-70 hover:opacity-100'
                      }`}
                    >
                      {colorTheme === c.id && <Check className="w-3 h-3 text-white" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Custom Title Override */}
            <div>
              <label className="text-[11px] text-gray-400 font-medium block mb-1">
                Custom Widget Title (Optional Override):
              </label>
              <input
                type="text"
                placeholder="Leave blank for automatic descriptive title..."
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                className="w-full px-3 py-1.5 bg-[#0A0B0E] border border-[#2D3139] rounded-lg text-white text-xs placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#2D3139] bg-[#0A0B0E]">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-[#16181D] hover:bg-[#1E2229] text-gray-300 text-xs font-semibold border border-[#2D3139] transition cursor-pointer"
          >
            Cancel
          </button>

          <button
            onClick={handlePin}
            className="inline-flex items-center space-x-2 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/20 transition cursor-pointer"
          >
            <Pin className="w-4 h-4" />
            <span>Pin Widget to Landing Page</span>
          </button>
        </div>

      </div>
    </div>
  );
};
