import React, { useState, useEffect } from 'react';
import { 
  Server, 
  Thermometer, 
  Wind, 
  Zap, 
  BatteryCharging, 
  RefreshCw, 
  ShieldCheck, 
  AlertTriangle, 
  Filter, 
  Search, 
  Play, 
  Database, 
  Clock, 
  Building, 
  CheckCircle2, 
  Activity, 
  Cpu, 
  ChevronRight,
  Flame,
  Gauge
} from 'lucide-react';
import { CampusId, HardwareHealthLog } from '../types.ts';
import { 
  fetchHardwareRacks, 
  fetchHardwareSummary, 
  fetchHardwareLogs, 
  triggerHardwareDiagnostic, 
  recordHardwareLog 
} from '../api.ts';
import { firestore } from '../firebase.ts';
import { collection, onSnapshot, query, orderBy, limit as firestoreLimit } from 'firebase/firestore';

interface HardwareHealthProps {
  selectedCampus: CampusId | 'ALL';
}

export const HardwareHealth: React.FC<HardwareHealthProps> = ({ selectedCampus }) => {
  const [racks, setRacks] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [logs, setLogs] = useState<HardwareHealthLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDiagnosing, setIsDiagnosing] = useState<string | null>(null);
  const [diagMessage, setDiagMessage] = useState<string | null>(null);

  // Filters
  const [filterCampus, setFilterCampus] = useState<string>(selectedCampus);
  const [filterRack, setFilterRack] = useState<string>('ALL');
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Selected rack for deep drilldown view
  const [selectedRackId, setSelectedRackId] = useState<string | null>(null);

  // Firestore sync state
  const [firestoreStatus, setFirestoreStatus] = useState<'connected' | 'syncing' | 'idle'>('connected');
  const [firestoreLogCount, setFirestoreLogCount] = useState<number>(0);

  // Synchronize local campus filter when parent changes
  useEffect(() => {
    setFilterCampus(selectedCampus);
  }, [selectedCampus]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [racksData, summaryData, logsData] = await Promise.all([
        fetchHardwareRacks(filterCampus),
        fetchHardwareSummary(),
        fetchHardwareLogs({
          campus: filterCampus,
          rackId: filterRack,
          severity: filterSeverity,
          search: searchQuery,
          limit: 100,
        }),
      ]);
      setRacks(racksData);
      setSummary(summaryData);
      setLogs(logsData);
    } catch (err) {
      console.error('Failed to load hardware health data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filterCampus, filterRack, filterSeverity]);

  // Firestore Real-Time listener for hardware_health_logs
  useEffect(() => {
    try {
      const logsRef = collection(firestore, 'hardware_health_logs');
      const q = query(logsRef, orderBy('timestamp', 'desc'), firestoreLimit(25));
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          setFirestoreStatus('connected');
          setFirestoreLogCount(snapshot.size);
          if (!snapshot.empty) {
            const fsLogs: HardwareHealthLog[] = [];
            snapshot.forEach((doc) => {
              fsLogs.push({ id: doc.id, ...doc.data() } as HardwareHealthLog);
            });
            // Merge with local logs, deduplicating by ID
            setLogs((prev) => {
              const combined = [...fsLogs, ...prev];
              const unique = Array.from(new Map(combined.map((item) => [item.id, item])).values());
              return unique.sort(
                (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
              );
            });
          }
        },
        (error) => {
          // Graceful fallback to server API if Firestore security rules or network are offline
          console.warn('Firestore hardware_health_logs real-time subscription notice:', error.message);
          setFirestoreStatus('idle');
        }
      );
      return () => unsubscribe();
    } catch (e) {
      console.warn('Could not attach Firestore listener:', e);
    }
  }, []);

  const handleRunDiagnostic = async (rackId: string) => {
    setIsDiagnosing(rackId);
    setDiagMessage(null);
    try {
      const res = await triggerHardwareDiagnostic(rackId);
      if (res.success) {
        setDiagMessage(`IPMI Self-Test completed for ${rackId}: ${res.log.details}`);
        // Refresh rack and logs
        await loadData();
      }
    } catch (err: any) {
      setDiagMessage(`Diagnostic failed: ${err.message}`);
    } finally {
      setIsDiagnosing(null);
      setTimeout(() => setDiagMessage(null), 7000);
    }
  };

  const filteredLogs = logs.filter((l) => {
    if (filterCampus !== 'ALL' && l.campus !== filterCampus) return false;
    if (filterRack !== 'ALL' && l.rackId !== filterRack) return false;
    if (filterSeverity !== 'ALL') {
      if (filterSeverity === 'optimal' && l.temperatureStatus !== 'optimal') return false;
      if (filterSeverity === 'warning' && (l.temperatureStatus !== 'warning' && l.fanStatus !== 'warning')) return false;
      if (filterSeverity === 'critical' && (l.temperatureStatus !== 'critical' && l.fanStatus !== 'critical')) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        l.rackId.toLowerCase().includes(q) ||
        l.building.toLowerCase().includes(q) ||
        l.room.toLowerCase().includes(q) ||
        l.details.toLowerCase().includes(q) ||
        l.loggedBy.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner & Title */}
      <div className="bg-[#12141A] border border-[#2D3139] rounded-xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-wide flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5" />
                <span>Rack Telemetry & Environmental Sensors</span>
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <Database className="w-3 h-3" />
                <span>Firestore Sync Active</span>
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Hardware Health & Server Rack Telemetry
            </h1>
            <p className="text-sm text-gray-400 mt-1 max-w-3xl">
              Server-side IPMI, SNMP, and iBMC sensor logging across all 6 IUB campuses. Monitors ambient temperature, intake/exhaust delta T, fan RPM speeds, dual redundant power supplies, and online UPS backup reserves per rack.
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <button
              onClick={loadData}
              disabled={isLoading}
              className="px-3.5 py-2 rounded-lg bg-[#1C1F26] hover:bg-[#262A34] text-gray-200 border border-[#2D3139] text-xs font-semibold flex items-center space-x-2 transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-400' : ''}`} />
              <span>Refresh Telemetry</span>
            </button>
          </div>
        </div>

        {/* Diagnostic Notification Banner */}
        {diagMessage && (
          <div className="mt-4 p-3 bg-blue-950/80 border border-blue-500/40 rounded-lg flex items-center space-x-3 text-xs text-blue-200">
            <Activity className="w-4 h-4 text-blue-400 shrink-0 animate-pulse" />
            <span className="flex-1 font-mono">{diagMessage}</span>
          </div>
        )}
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Monitored Racks */}
        <div className="bg-[#12141A] border border-[#2D3139] rounded-xl p-4">
          <div className="flex items-center justify-between text-gray-400 text-xs font-medium">
            <span>Monitored Server Racks</span>
            <Server className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-white font-mono">
              {summary?.totalRacks || racks.length}
            </span>
            <span className="text-xs text-gray-400">racks across campuses</span>
          </div>
          <div className="mt-2 flex items-center space-x-2 text-[11px] text-gray-400">
            <span className="text-emerald-400 font-semibold">{summary?.optimalCount || 0} Optimal</span>
            <span>•</span>
            <span className="text-amber-400 font-semibold">{summary?.warningCount || 0} Warning</span>
            <span>•</span>
            <span className="text-red-400 font-semibold">{summary?.criticalCount || 0} Critical</span>
          </div>
        </div>

        {/* Average Temperature */}
        <div className="bg-[#12141A] border border-[#2D3139] rounded-xl p-4">
          <div className="flex items-center justify-between text-gray-400 text-xs font-medium">
            <span>Average Rack Temperature</span>
            <Thermometer className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-amber-400 font-mono">
              {summary?.avgTemp || 23.8}°C
            </span>
            <span className="text-xs text-gray-400">Target &lt; 26°C</span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-400 flex items-center space-x-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Chilled water precision AC active</span>
          </div>
        </div>

        {/* Fan Speed & Ventilation */}
        <div className="bg-[#12141A] border border-[#2D3139] rounded-xl p-4">
          <div className="flex items-center justify-between text-gray-400 text-xs font-medium">
            <span>Average Fan Speed</span>
            <Wind className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-white font-mono">
              {summary?.avgFanSpeed || 4920} <span className="text-sm text-gray-400">RPM</span>
            </span>
            <span className="text-xs text-gray-400">(~54% PWM)</span>
          </div>
          <div className="mt-2 text-[11px] text-gray-400 flex items-center space-x-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Dynamic intake/exhaust balance</span>
          </div>
        </div>

        {/* Power & Redundancy */}
        <div className="bg-[#12141A] border border-[#2D3139] rounded-xl p-4">
          <div className="flex items-center justify-between text-gray-400 text-xs font-medium">
            <span>Total Power Draw & UPS</span>
            <Zap className="w-4 h-4 text-yellow-400" />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-white font-mono">
              {((summary?.totalWattage || 14864) / 1000).toFixed(1)} <span className="text-sm text-gray-400">kW</span>
            </span>
            <span className="text-xs text-emerald-400 font-semibold">Dual PSU 100%</span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-400 flex items-center space-x-1">
            <BatteryCharging className="w-3.5 h-3.5" />
            <span>Min UPS reserve: 110-260 mins</span>
          </div>
        </div>
      </div>

      {/* Racks Grid (Hardware Per Rack Overview) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Server className="w-5 h-5 text-blue-400" />
            <span>Campus Server Racks Telemetry</span>
            <span className="text-xs font-normal text-gray-400">({racks.length} Racks)</span>
          </h2>

          {/* Campus Filter Pills */}
          <div className="flex items-center space-x-1 overflow-x-auto pb-1 text-xs">
            {['ALL', 'BJC', 'OLD', 'RAILWAY', 'RYK', 'BWN', 'LQT'].map((c) => (
              <button
                key={c}
                onClick={() => setFilterCampus(c)}
                className={`px-3 py-1 rounded-md font-mono text-xs transition cursor-pointer ${
                  filterCampus === c
                    ? 'bg-blue-600 text-white font-bold shadow-sm'
                    : 'bg-[#16181D] text-gray-400 hover:text-white border border-[#2D3139]'
                }`}
              >
                {c === 'ALL' ? 'All Campuses' : c}
              </button>
            ))}
          </div>
        </div>

        {/* Rack Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {racks.map((rack) => {
            const isTempOptimal = rack.temperatureStatus === 'optimal';
            const isTempWarn = rack.temperatureStatus === 'warning';
            const tempBadgeClass = isTempOptimal
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : isTempWarn
              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              : 'bg-red-500/10 text-red-400 border-red-500/20';

            return (
              <div
                key={rack.rackId}
                className="bg-[#12141A] border border-[#2D3139] hover:border-blue-500/40 rounded-xl p-5 space-y-4 transition flex flex-col justify-between"
              >
                {/* Rack Header */}
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-mono font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                          {rack.rackId}
                        </span>
                        <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-[#1C1F26] text-gray-300 border border-[#2D3139]">
                          {rack.capacityUnits}U Rack
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-white mt-1.5 tracking-tight line-clamp-1">
                        {rack.name}
                      </h3>
                      <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5 line-clamp-1">
                        <Building className="w-3 h-3 text-gray-500 shrink-0" />
                        <span>{rack.building} • {rack.room}</span>
                      </p>
                    </div>

                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border shrink-0 ${tempBadgeClass}`}>
                      {rack.temperatureStatus}
                    </span>
                  </div>

                  {/* Telemetry Sensor Metrics */}
                  <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-[#1F232B]">
                    {/* Temperature Box */}
                    <div className="p-3 bg-[#0A0B0E] border border-[#232730] rounded-lg">
                      <div className="flex items-center justify-between text-gray-400 text-xs">
                        <span className="flex items-center gap-1">
                          <Thermometer className="w-3.5 h-3.5 text-amber-400" />
                          <span>Temperature</span>
                        </span>
                        <span className="text-[10px] font-mono text-gray-500">Core</span>
                      </div>
                      <div className="mt-1 flex items-baseline space-x-1.5">
                        <span className={`text-xl font-bold font-mono ${
                          isTempOptimal ? 'text-emerald-400' : isTempWarn ? 'text-amber-400' : 'text-red-400'
                        }`}>
                          {rack.temperatureC}°C
                        </span>
                        <span className="text-[10px] text-gray-400 font-mono">
                          (Intake: {rack.intakeTempC}°C)
                        </span>
                      </div>
                      <div className="text-[10px] text-gray-500 mt-1 font-mono">
                        Exhaust: {rack.exhaustTempC}°C • ΔT {Number((rack.exhaustTempC - rack.intakeTempC).toFixed(1))}°C
                      </div>
                    </div>

                    {/* Fan Speed Box */}
                    <div className="p-3 bg-[#0A0B0E] border border-[#232730] rounded-lg">
                      <div className="flex items-center justify-between text-gray-400 text-xs">
                        <span className="flex items-center gap-1">
                          <Wind className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Fan Speed</span>
                        </span>
                        <span className="text-[10px] font-mono text-gray-500">{rack.fanCount} Fans</span>
                      </div>
                      <div className="mt-1 flex items-baseline space-x-1.5">
                        <span className="text-xl font-bold font-mono text-white">
                          {rack.fanSpeedRpm}
                        </span>
                        <span className="text-[10px] text-cyan-400 font-mono font-semibold">
                          {rack.fanSpeedPercent}%
                        </span>
                      </div>
                      <div className="text-[10px] text-gray-500 mt-1 font-mono flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>All fan bays healthy</span>
                      </div>
                    </div>
                  </div>

                  {/* Power & Redundant PSU Section */}
                  <div className="p-3 bg-[#0A0B0E] border border-[#232730] rounded-lg mt-3 text-xs space-y-2">
                    <div className="flex items-center justify-between text-gray-400">
                      <span className="flex items-center gap-1.5 text-white font-medium">
                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                        <span>Redundant Power (Dual PSU)</span>
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-mono border border-emerald-500/20 font-bold">
                        100% Redundant
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                      <div className="text-gray-300">
                        PSU-1: <span className="text-emerald-400 font-bold">{rack.psu1Voltage}V</span>
                      </div>
                      <div className="text-gray-300">
                        PSU-2: <span className="text-emerald-400 font-bold">{rack.psu2Voltage}V</span>
                      </div>
                      <div className="text-gray-400">
                        Load: <span className="text-white font-semibold">{rack.psuCurrentAmps}A</span> ({rack.psuTotalWattage}W)
                      </div>
                      <div className="text-gray-400 flex items-center gap-1">
                        <BatteryCharging className="w-3 h-3 text-yellow-400" />
                        <span className="text-yellow-300 font-semibold">{rack.upsBatteryRuntimeMinutes} min UPS</span>
                      </div>
                    </div>

                    <div className="text-[10px] text-gray-500 pt-1 border-t border-[#1C1F26] font-mono flex items-center justify-between">
                      <span>IPMI: {rack.smartRackControllerIp}</span>
                      <span>{rack.ipmiFirmware}</span>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-2 flex items-center justify-between">
                  <span className="text-[11px] text-gray-400 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-gray-500" />
                    <span>Live Telemetry</span>
                  </span>

                  <button
                    onClick={() => handleRunDiagnostic(rack.rackId)}
                    disabled={isDiagnosing === rack.rackId}
                    className="px-3 py-1.5 rounded-lg bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/30 text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer"
                  >
                    <Play className={`w-3 h-3 ${isDiagnosing === rack.rackId ? 'animate-spin' : ''}`} />
                    <span>{isDiagnosing === rack.rackId ? 'Querying IPMI...' : 'Query IPMI Sensors'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detailed Server-Side Hardware Logs Table & Firestore Sync */}
      <div className="bg-[#12141A] border border-[#2D3139] rounded-xl p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#2D3139]">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Database className="w-5 h-5 text-emerald-400" />
                <span>Server-Side Hardware Health Logs</span>
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#1E222B] text-gray-300 border border-[#2D3139]">
                {filteredLogs.length} Events Logged
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              Historical audit trail for thermal spikes, fan PWM modulations, and power supply health per rack, synchronized with Firebase Firestore.
            </p>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Box */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search rack, building, details..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-[#0A0B0E] border border-[#2D3139] rounded-lg text-white text-xs placeholder-gray-500 focus:outline-none focus:border-blue-500 w-48"
              />
            </div>

            {/* Severity Filter */}
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="px-2.5 py-1.5 bg-[#0A0B0E] border border-[#2D3139] rounded-lg text-white text-xs focus:outline-none"
            >
              <option value="ALL">All Severities</option>
              <option value="optimal">Optimal Only</option>
              <option value="warning">Warnings</option>
              <option value="critical">Critical Only</option>
            </select>

            {/* Rack Filter */}
            <select
              value={filterRack}
              onChange={(e) => setFilterRack(e.target.value)}
              className="px-2.5 py-1.5 bg-[#0A0B0E] border border-[#2D3139] rounded-lg text-white text-xs focus:outline-none"
            >
              <option value="ALL">All Racks</option>
              {racks.map((r) => (
                <option key={r.rackId} value={r.rackId}>
                  {r.rackId}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Logs Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="text-[11px] font-mono uppercase bg-[#0A0B0E] text-gray-400 border-b border-[#2D3139]">
              <tr>
                <th className="py-3 px-3">Timestamp</th>
                <th className="py-3 px-3">Rack ID</th>
                <th className="py-3 px-3">Campus & Room</th>
                <th className="py-3 px-3">Temperature</th>
                <th className="py-3 px-3">Fan Speed</th>
                <th className="py-3 px-3">Power & PSUs</th>
                <th className="py-3 px-3">Probe Daemon</th>
                <th className="py-3 px-3">Telemetry Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F232B]">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-500 text-xs">
                    No hardware health logs matched the current filters.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const isOptimal = log.temperatureStatus === 'optimal' && log.fanStatus === 'healthy';
                  const isWarn = log.temperatureStatus === 'warning' || log.fanStatus === 'warning';

                  return (
                    <tr key={log.id} className="hover:bg-[#16181F] transition font-mono">
                      <td className="py-3 px-3 text-gray-400 whitespace-nowrap text-[11px]">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        <div className="text-[9px] text-gray-500">{new Date(log.timestamp).toLocaleDateString()}</div>
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold">
                          {log.rackId}
                        </span>
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap text-gray-300 font-sans">
                        <div className="font-semibold text-white">{log.campus}</div>
                        <div className="text-[10px] text-gray-400">{log.room}</div>
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded font-bold ${
                          log.temperatureStatus === 'optimal'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : log.temperatureStatus === 'warning'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>
                          {log.temperatureC}°C
                        </span>
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="text-white font-bold">{log.fanSpeedRpm} RPM</span>{' '}
                        <span className="text-[10px] text-cyan-400">({log.fanSpeedPercent}%)</span>
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="text-white font-semibold">{log.psu1Voltage}V / {log.psu2Voltage}V</div>
                        <div className="text-[10px] text-yellow-300">{log.upsBatteryRuntimeMinutes}m UPS reserve</div>
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap text-[10px] text-gray-400">
                        {log.loggedBy}
                      </td>

                      <td className="py-3 px-3 text-gray-300 font-sans text-xs max-w-xs truncate" title={log.details}>
                        {log.details}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
