import React, { useState, useMemo } from 'react';
import { 
  Device, 
  CampusId, 
  CampusInfo, 
  DeviceType, 
  DeviceStatus 
} from '../types.ts';
import { 
  Router as RouterIcon, 
  Server, 
  Wifi, 
  Phone, 
  Video, 
  Box, 
  Cable, 
  Network, 
  Radio, 
  Power, 
  Clock, 
  MapPin, 
  Building, 
  DoorClosed, 
  Filter, 
  Search, 
  RefreshCw, 
  Bot, 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  Eye,
  Info,
  Maximize2
} from 'lucide-react';
import { DeviceDetailsModal } from './DeviceDetailsModal.tsx';

interface CampusCircularGraphicProps {
  devices: Device[];
  campuses: CampusInfo[];
  onTogglePower: (id: string) => Promise<void> | void;
  onOpenDiagnostics?: (device: Device) => void;
  onOpenChatWithQuery?: (prompt: string) => void;
}

export const CampusCircularGraphic: React.FC<CampusCircularGraphicProps> = ({
  devices,
  campuses,
  onTogglePower,
  onOpenDiagnostics,
  onOpenChatWithQuery,
}) => {
  const [selectedCampus, setSelectedCampus] = useState<CampusId | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'online' | 'offline'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'orbit' | 'cards'>('orbit');
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [activeHoverNode, setActiveHoverNode] = useState<Device | null>(null);

  // Filter devices by Campus, Status, and Search Query
  const filteredDevices = useMemo(() => {
    return devices.filter((dev) => {
      if (selectedCampus !== 'ALL' && dev.campus !== selectedCampus) {
        return false;
      }
      if (statusFilter === 'online' && dev.status !== 'online') {
        return false;
      }
      if (statusFilter === 'offline' && dev.status !== 'offline') {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = dev.name.toLowerCase().includes(q);
        const matchIp = dev.ipAddress.toLowerCase().includes(q);
        const matchMac = dev.macAddress.toLowerCase().includes(q);
        const matchBuilding = dev.building.toLowerCase().includes(q);
        const matchRoom = dev.roomNo.toLowerCase().includes(q);
        if (!matchName && !matchIp && !matchMac && !matchBuilding && !matchRoom) {
          return false;
        }
      }
      return true;
    });
  }, [devices, selectedCampus, statusFilter, searchQuery]);

  // Offline and Online counts
  const totalCount = filteredDevices.length;
  const onlineCount = filteredDevices.filter((d) => d.status === 'online').length;
  const offlineCount = filteredDevices.filter((d) => d.status === 'offline').length;

  const handleDeviceClick = (device: Device) => {
    setSelectedDevice(device);
    setIsDetailsOpen(true);
  };

  const getDeviceIcon = (type: DeviceType, className = "w-5 h-5") => {
    switch (type) {
      case 'router':
        return <RouterIcon className={className} />;
      case 'switch':
        return <Server className={className} />;
      case 'access_point':
        return <Wifi className={className} />;
      case 'ip_phone':
        return <Phone className={className} />;
      case 'camera':
        return <Video className={className} />;
      case 'rack':
        return <Box className={className} />;
      case 'fiber_cable':
        return <Cable className={className} />;
      default:
        return <Network className={className} />;
    }
  };

  const formatOffTime = (iso?: string) => {
    if (!iso) return 'Recent';
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return iso;
    }
  };

  // Selected campus information
  const activeCampusInfo = campuses.find((c) => c.id === selectedCampus);

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER & METRICS BAR */}
      <div className="card-elegant p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <span>Campus Circular Equipment Visualizer</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-mono font-normal bg-blue-900/40 text-blue-300 border border-blue-700/50">
                  Gole Shape Topology & Node Status
                </span>
              </h2>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Visual circular ring display showing live campus nodes. <span className="text-emerald-400 font-semibold">Green circles</span> represent Active/Online devices, and <span className="text-red-400 font-semibold">Red circles</span> represent Offline/Down devices. Click any device node to inspect complete details.
            </p>
          </div>

          {/* Quick Action Prompt to Gemini */}
          <div className="flex items-center gap-2.5 shrink-0">
            {onOpenChatWithQuery && (
              <button
                onClick={() => onOpenChatWithQuery("please show who devices will off at this time")}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-red-900/60 via-red-800/50 to-purple-900/60 hover:from-red-800 hover:to-purple-800 border border-red-500/40 text-white text-xs font-semibold shadow-md transition cursor-pointer"
                title="Prompt Gemini for all offline devices"
              >
                <Bot className="w-4 h-4 text-red-400 animate-pulse" />
                <span>Ask Gemini: "Show Devices Off at this Time"</span>
              </button>
            )}

            {/* View Switcher: Radial Orbit vs Cards Matrix */}
            <div className="inline-flex rounded-xl bg-[#14171E] p-1 border border-[#232730]">
              <button
                onClick={() => setViewMode('orbit')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'orbit'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
                title="Circular Orbit Ring View"
              >
                <Radio className="w-3.5 h-3.5" />
                <span>Orbit Ring (Gole)</span>
              </button>

              <button
                onClick={() => setViewMode('cards')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'cards'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
                title="Circular Node Cards View"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Node Matrix</span>
              </button>
            </div>
          </div>
        </div>

        {/* CAMPUS SELECTION TABS */}
        <div className="mt-5 pt-4 border-t border-[#1E2229] flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
          {/* ALL Campuses Tab */}
          <button
            onClick={() => setSelectedCampus('ALL')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-2 cursor-pointer ${
              selectedCampus === 'ALL'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30'
                : 'bg-[#14171E] hover:bg-[#1E2229] text-gray-300 border border-[#232730]'
            }`}
          >
            <span>All University Campuses</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-black/40 text-blue-200">
              {devices.length}
            </span>
          </button>

          {/* Individual Campus Tabs */}
          {campuses.map((c) => {
            const cDevices = devices.filter((d) => d.campus === c.id);
            const cOnline = cDevices.filter((d) => d.status === 'online').length;
            const cOffline = cDevices.filter((d) => d.status === 'offline').length;

            return (
              <button
                key={c.id}
                onClick={() => setSelectedCampus(c.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-2 cursor-pointer ${
                  selectedCampus === c.id
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30'
                    : 'bg-[#14171E] hover:bg-[#1E2229] text-gray-300 border border-[#232730]'
                }`}
              >
                <span>{c.shortName || c.name}</span>
                <div className="flex items-center gap-1 font-mono text-[10px]">
                  <span className="text-emerald-400 bg-emerald-950/60 px-1 rounded" title="Online">
                    🟢{cOnline}
                  </span>
                  {cOffline > 0 && (
                    <span className="text-red-400 bg-red-950/80 px-1 rounded animate-pulse" title="Offline">
                      🔴{cOffline}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* STATUS COUNTERS & SEARCH FILTER */}
        <div className="mt-4 pt-3 border-t border-[#1E2229]/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          {/* Status Quick Filters */}
          <div className="flex items-center gap-2">
            <span className="text-gray-400 font-semibold">Status:</span>
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                statusFilter === 'ALL'
                  ? 'bg-[#232730] text-white border border-gray-600'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              All ({totalCount})
            </button>
            <button
              onClick={() => setStatusFilter('online')}
              className={`px-2.5 py-1 rounded-lg font-medium transition flex items-center gap-1 cursor-pointer ${
                statusFilter === 'online'
                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/50'
                  : 'text-emerald-400 hover:bg-emerald-950/40'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Online Green ({onlineCount})</span>
            </button>
            <button
              onClick={() => setStatusFilter('offline')}
              className={`px-2.5 py-1 rounded-lg font-medium transition flex items-center gap-1 cursor-pointer ${
                statusFilter === 'offline'
                  ? 'bg-red-950/90 text-red-300 border border-red-500/60'
                  : 'text-red-400 hover:bg-red-950/40'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span>Offline Red ({offlineCount})</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search IP, MAC, Building, Room..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#0F1115] border border-[#232730] text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* 2. CIRCULAR ORBIT GRAPHIC ("GOLE SHAP GRAPHIC") */}
      {viewMode === 'orbit' ? (
        <div className="card-elegant p-6 overflow-hidden relative min-h-[640px] flex flex-col items-center justify-center bg-gradient-to-b from-[#0A0B0E] via-[#0F1117] to-[#0A0B0E]">
          
          {/* Radial Ambient Glow */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-[580px] h-[580px] rounded-full bg-blue-600/5 blur-[120px]" />
          </div>

          {/* Graphic Controls Header in Stage */}
          <div className="w-full flex items-center justify-between z-10 mb-4 px-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span>Active Campus: <strong>{activeCampusInfo ? activeCampusInfo.name : 'All 6 University Campuses'}</strong></span>
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs text-gray-400">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-500 border border-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.7)]" />
                <strong className="text-emerald-300 font-mono">Green = ON ({onlineCount})</strong>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-500 border border-red-300 shadow-[0_0_10px_rgba(239,68,68,0.8)] animate-pulse" />
                <strong className="text-red-300 font-mono">Red = OFF ({offlineCount})</strong>
              </span>
            </div>
          </div>

          {/* Interactive SVG Circular Radar / Solar Orbit Stage */}
          <div className="relative w-full max-w-[840px] aspect-square flex items-center justify-center select-none">
            
            {/* SVG Background Concentric Rings (Gole Shapes) */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 800 800">
              {/* Outer Orbit Circle */}
              <circle cx="400" cy="400" r="340" fill="none" stroke="#1E2229" strokeWidth="1.5" strokeDasharray="6 6" />
              {/* Secondary Mid Orbit Circle */}
              <circle cx="400" cy="400" r="230" fill="none" stroke="#232730" strokeWidth="1" strokeDasharray="3 3" />
              {/* Core Inner Circle */}
              <circle cx="400" cy="400" r="130" fill="none" stroke="#2D3139" strokeWidth="1.5" />

              {/* Connecting Fiber Ray Beams from Core to each Device Node */}
              {filteredDevices.map((dev, idx) => {
                const total = filteredDevices.length || 1;
                const angle = (idx / total) * 2 * Math.PI - Math.PI / 2;
                const radius = 340;
                const x = 400 + radius * Math.cos(angle);
                const y = 400 + radius * Math.sin(angle);
                const isOff = dev.status === 'offline';

                return (
                  <line
                    key={`line-${dev.id}`}
                    x1="400"
                    y1="400"
                    x2={x}
                    y2={y}
                    stroke={isOff ? 'rgba(239, 68, 68, 0.45)' : 'rgba(16, 185, 129, 0.25)'}
                    strokeWidth={isOff ? '2' : '1'}
                    strokeDasharray={isOff ? '4 4' : undefined}
                  />
                );
              })}
            </svg>

            {/* CENTRAL CAMPUS CORE HUB (Gole Center) */}
            <div 
              className="absolute z-20 w-32 h-32 rounded-full border-2 border-blue-500/80 bg-[#10141D]/90 shadow-[0_0_35px_rgba(59,130,246,0.35)] flex flex-col items-center justify-center text-center p-2 backdrop-blur-md cursor-default"
            >
              <div className="w-10 h-10 rounded-full bg-blue-600/20 border border-blue-400 flex items-center justify-center mb-1">
                <Network className="w-5 h-5 text-blue-400 animate-pulse" />
              </div>
              <span className="text-[11px] font-bold text-white tracking-tight uppercase leading-tight line-clamp-1">
                {activeCampusInfo ? activeCampusInfo.shortName : 'IUB CORE'}
              </span>
              <span className="text-[9px] font-mono text-blue-300 mt-0.5">
                {activeCampusInfo ? activeCampusInfo.coreBandwidth : '40G Backbone'}
              </span>
              <span className="text-[9px] text-gray-400">
                {totalCount} Monitored
              </span>
            </div>

            {/* CIRCULAR NODES DISTRIBUTED ALONG THE ORBIT (Gole Shape Nodes) */}
            {filteredDevices.map((dev, idx) => {
              const total = filteredDevices.length || 1;
              const angle = (idx / total) * 2 * Math.PI - Math.PI / 2;
              const radius = 42.5; // percentage from center (0% center, 50% outer edge)
              const topPct = 50 + radius * Math.sin(angle);
              const leftPct = 50 + radius * Math.cos(angle);
              const isOff = dev.status === 'offline';

              return (
                <div
                  key={dev.id}
                  style={{ top: `${topPct}%`, left: `${leftPct}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 z-30 group cursor-pointer"
                  onClick={() => handleDeviceClick(dev)}
                  onMouseEnter={() => setActiveHoverNode(dev)}
                  onMouseLeave={() => setActiveHoverNode(null)}
                >
                  {/* Circular Node Body (Gole Shape) */}
                  <div 
                    className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-full flex flex-col items-center justify-center border-2 transition-all duration-300 transform group-hover:scale-115 ${
                      isOff 
                        ? 'border-red-500 bg-[#240608]/90 shadow-[0_0_25px_rgba(239,68,68,0.7)] ring-4 ring-red-500/30 animate-pulse' 
                        : 'border-emerald-400 bg-[#041E14]/90 shadow-[0_0_20px_rgba(16,185,129,0.45)] ring-2 ring-emerald-500/20 group-hover:shadow-[0_0_30px_rgba(16,185,129,0.7)]'
                    }`}
                  >
                    {/* Device Icon */}
                    <div className={isOff ? 'text-red-400' : 'text-emerald-300'}>
                      {getDeviceIcon(dev.type, "w-6 h-6")}
                    </div>

                    {/* Short Status Label */}
                    <span 
                      className={`text-[9px] font-mono font-bold mt-0.5 px-1.5 py-0.2 rounded-full ${
                        isOff 
                          ? 'bg-red-600 text-white shadow-sm' 
                          : 'bg-emerald-600/80 text-white'
                      }`}
                    >
                      {isOff ? 'OFF' : 'ON'}
                    </span>

                    {/* Small Status Glow Dot */}
                    <span 
                      className={`absolute top-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-[#0A0B0E] ${
                        isOff ? 'bg-red-500 animate-ping' : 'bg-emerald-400'
                      }`} 
                    />
                  </div>

                  {/* Sub-label Under Node: Device Name, IP, MAC & Location */}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 w-32 sm:w-40 text-center pointer-events-none transition-all">
                    <p className="text-[11px] font-bold text-white tracking-tight truncate" title={dev.name}>
                      {dev.name}
                    </p>
                    <p className="text-[10px] font-mono text-blue-400 font-semibold truncate">
                      {dev.ipAddress}
                    </p>
                    <p className="text-[9px] font-mono text-gray-400 truncate">
                      {dev.macAddress}
                    </p>
                    <p className="text-[9px] text-gray-300 truncate" title={`${dev.building}, ${dev.roomNo}`}>
                      {dev.building} &bull; {dev.roomNo}
                    </p>
                    {isOff && (
                      <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded bg-red-950 text-red-300 border border-red-700/60 text-[9px] font-mono font-semibold">
                        Off: {formatOffTime(dev.offTime)}
                      </span>
                    )}
                  </div>

                  {/* Hover Floating Detailed Preview Card */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-64 p-3.5 rounded-xl bg-[#14171E] border border-[#2D3139] shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 z-50 text-left">
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <span className="font-bold text-xs text-white truncate">{dev.name}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isOff ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-emerald-500/20 text-emerald-400'}`}>
                        {isOff ? '🔴 OFFLINE' : '🟢 ONLINE'}
                      </span>
                    </div>

                    <div className="space-y-1 text-[11px] text-gray-300 font-mono">
                      <div><strong className="text-gray-400">IP:</strong> <span className="text-blue-400 font-bold">{dev.ipAddress}</span></div>
                      <div><strong className="text-gray-400">MAC:</strong> <span className="text-purple-300">{dev.macAddress}</span></div>
                      <div><strong className="text-gray-400">Campus:</strong> {dev.campus}</div>
                      <div className="truncate"><strong className="text-gray-400">Location:</strong> {dev.building}</div>
                      <div><strong className="text-gray-400">Room:</strong> {dev.roomNo}</div>
                      {isOff && (
                        <div className="text-red-400 font-bold pt-1 border-t border-red-900/50">
                          ⏱️ Off Time: {formatOffTime(dev.offTime)} ({dev.downtimeDuration || 'Active'})
                        </div>
                      )}
                    </div>

                    <p className="mt-2 text-[10px] text-blue-400 font-sans italic border-t border-[#1E2229] pt-1 text-center">
                      Click to inspect all hardware & port details &rarr;
                    </p>
                  </div>
                </div>
              );
            })}

          </div>

          {/* Bottom Hint */}
          <div className="mt-6 text-center z-10">
            <p className="text-xs text-gray-400 flex items-center justify-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-blue-400" />
              <span>Click on any circular device node to open the <strong>Detailed Specs & Off Time Modal</strong>.</span>
            </p>
          </div>

        </div>
      ) : (
        /* 3. CIRCULAR NODE CARDS MATRIX (GOLE BADGE GRID) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDevices.map((dev) => {
            const isOff = dev.status === 'offline';
            const isWarn = dev.status === 'warning';

            return (
              <div
                key={dev.id}
                onClick={() => handleDeviceClick(dev)}
                className={`card-elegant p-4 transition-all duration-200 hover:shadow-xl flex flex-col justify-between cursor-pointer group ${
                  isOff 
                    ? 'border-red-500/60 bg-[#161214] shadow-[0_0_20px_rgba(239,68,68,0.15)] hover:border-red-500' 
                    : 'hover:border-emerald-500/50'
                }`}
              >
                <div>
                  {/* Top Bar with Prominent Gole Shape Circular Badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center space-x-3">
                      {/* Prominent Gole Shape Ring */}
                      <div 
                        className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all shrink-0 ${
                          isOff 
                            ? 'border-red-500 bg-red-950/80 shadow-[0_0_15px_rgba(239,68,68,0.6)] animate-pulse' 
                            : 'border-emerald-400 bg-emerald-950/80 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                        }`}
                      >
                        <div className={isOff ? 'text-red-400' : 'text-emerald-300'}>
                          {getDeviceIcon(dev.type, "w-6 h-6")}
                        </div>
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-white tracking-tight truncate max-w-[160px]" title={dev.name}>
                            {dev.name}
                          </h3>
                        </div>

                        {/* Status Pill */}
                        {isOff ? (
                          <span className="inline-flex items-center gap-1 mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                            <span>🔴 OFFLINE (OFF)</span>
                          </span>
                        ) : isWarn ? (
                          <span className="inline-flex items-center gap-1 mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                            <span>🟡 WARNING</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            <span>🟢 ONLINE (ACTIVE)</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1A1D24] text-gray-300 border border-[#2D3139]">
                      {dev.campus}
                    </span>
                  </div>

                  {/* Offline Warning Box (When Off) */}
                  {isOff && (
                    <div className="mt-3 p-2 rounded-lg bg-red-950/40 border border-red-800/40 text-[11px] text-red-300 flex items-center justify-between font-mono">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-red-400" />
                        <span>Off Time: {formatOffTime(dev.offTime)}</span>
                      </span>
                      <span className="text-red-200 font-bold">
                        {dev.downtimeDuration || 'Active Down'}
                      </span>
                    </div>
                  )}

                  {/* Network Identifiers: IP & MAC */}
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="p-2 rounded-lg bg-[#0F1115] border border-[#232730]">
                      <span className="text-[10px] text-gray-500 block uppercase">IP Address</span>
                      <span className="font-bold text-blue-400 truncate block" title={dev.ipAddress}>
                        {dev.ipAddress}
                      </span>
                    </div>

                    <div className="p-2 rounded-lg bg-[#0F1115] border border-[#232730]">
                      <span className="text-[10px] text-gray-500 block uppercase">MAC Address</span>
                      <span className="font-semibold text-purple-400 truncate block" title={dev.macAddress}>
                        {dev.macAddress}
                      </span>
                    </div>
                  </div>

                  {/* Location Information */}
                  <div className="mt-2.5 p-2 rounded-lg bg-[#0F1115] border border-[#232730] text-xs space-y-1">
                    <div className="flex items-center gap-1.5 text-gray-300 truncate">
                      <Building className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                      <span className="truncate" title={dev.building}>{dev.building}</span>
                    </div>
                    <div className="flex items-center justify-between text-gray-400 text-[11px]">
                      <span className="flex items-center gap-1.5">
                        <DoorClosed className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>Room: <strong className="text-amber-300 font-mono">{dev.roomNo}</strong></span>
                      </span>
                      <span className="font-mono text-gray-500">{dev.rackId || 'IDF'}</span>
                    </div>
                  </div>
                </div>

                {/* Card Footer: Toggle Power & View Details button */}
                <div className="mt-3 pt-3 border-t border-[#1E2229] flex items-center justify-between gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onTogglePower(dev.id);
                    }}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                      isOff 
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white' 
                        : 'bg-red-900/40 hover:bg-red-800/60 text-red-300 border border-red-700/50'
                    }`}
                    title={isOff ? 'Turn ON' : 'Turn OFF'}
                  >
                    <Power className="w-3 h-3" />
                    <span>{isOff ? 'Turn ON' : 'Power Down'}</span>
                  </button>

                  <span className="text-xs text-blue-400 font-semibold group-hover:text-blue-300 flex items-center gap-1">
                    <span>View All Details &rarr;</span>
                  </span>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* 4. MODAL FOR ALL DEVICE DETAILS (DeviceDetailsModal) */}
      <DeviceDetailsModal
        device={selectedDevice}
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedDevice(null);
        }}
        onTogglePower={async (id) => {
          await onTogglePower(id);
          // Refresh selected device state
          const updated = devices.find((d) => d.id === id);
          if (updated) setSelectedDevice(updated);
        }}
        onOpenDiagnostics={onOpenDiagnostics}
        campuses={campuses}
      />
    </div>
  );
};
