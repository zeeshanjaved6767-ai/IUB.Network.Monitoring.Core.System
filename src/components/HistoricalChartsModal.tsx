import React, { useState, useEffect } from 'react';
import { 
  X, 
  Activity, 
  Clock, 
  TrendingUp, 
  Cpu, 
  HardDrive, 
  RefreshCw, 
  Wifi, 
  ArrowDown, 
  ArrowUp,
  AlertTriangle,
  Layers
} from 'lucide-react';
import { Device, HistoricalMetricPoint } from '../types.ts';
import { fetchDeviceHistory } from '../api.ts';

interface HistoricalChartsModalProps {
  device: Device | null;
  isOpen: boolean;
  onClose: () => void;
}

export const HistoricalChartsModal: React.FC<HistoricalChartsModalProps> = ({
  device,
  isOpen,
  onClose,
}) => {
  const [history, setHistory] = useState<HistoricalMetricPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'latency' | 'bandwidth' | 'system'>('all');
  const [timeRange, setTimeRange] = useState<number>(30); // number of points

  useEffect(() => {
    if (device && isOpen) {
      loadHistory();
    }
  }, [device, isOpen, timeRange]);

  const loadHistory = async () => {
    if (!device) return;
    setLoading(true);
    try {
      const data = await fetchDeviceHistory(device.id, timeRange);
      setHistory(data);
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !device) return null;

  // Calculate statistics
  const latencies = history.map((h) => h.latencyMs).filter((v) => v < 900);
  const avgLatency = latencies.length ? (latencies.reduce((a, b) => a + b, 0) / latencies.length).toFixed(1) : '0';
  const minLatency = latencies.length ? Math.min(...latencies).toFixed(1) : '0';
  const maxLatency = latencies.length ? Math.max(...latencies).toFixed(1) : '0';

  const cpus = history.map((h) => h.cpuUsage);
  const avgCpu = cpus.length ? Math.round(cpus.reduce((a, b) => a + b, 0) / cpus.length) : 0;
  const maxCpu = cpus.length ? Math.max(...cpus) : 0;

  const bwsIn = history.map((h) => h.bandwidthInMbps);
  const bwsOut = history.map((h) => h.bandwidthOutMbps);
  const peakBwIn = bwsIn.length ? Math.max(...bwsIn) : 0;
  const peakBwOut = bwsOut.length ? Math.max(...bwsOut) : 0;

  // SVG Chart rendering helpers
  const chartHeight = 140;
  const chartWidth = 640;

  const renderLineChart = (
    data1: number[],
    color1: string,
    label1: string,
    data2?: number[],
    color2?: string,
    label2?: string,
    maxValOverride?: number,
    unit = ''
  ) => {
    if (!history.length) {
      return (
        <div className="h-36 flex items-center justify-center text-xs text-gray-500 font-mono">
          No historical telemetry points available for this device.
        </div>
      );
    }

    const maxVal1 = Math.max(...data1, 1);
    const maxVal2 = data2 ? Math.max(...data2, 1) : 0;
    const maxVal = maxValOverride || Math.max(maxVal1, maxVal2, 10);

    const stepX = chartWidth / Math.max(1, history.length - 1);

    const points1 = data1.map((val, idx) => {
      const x = idx * stepX;
      const y = chartHeight - (val / maxVal) * (chartHeight - 20) - 10;
      return `${x},${y}`;
    }).join(' ');

    const points2 = data2 ? data2.map((val, idx) => {
      const x = idx * stepX;
      const y = chartHeight - (val / maxVal) * (chartHeight - 20) - 10;
      return `${x},${y}`;
    }).join(' ') : null;

    return (
      <div className="relative bg-[#0D0F14] border border-[#222732] rounded-xl p-3">
        <div className="flex items-center justify-between text-xs mb-2">
          <div className="flex items-center space-x-3">
            <span className="flex items-center gap-1.5 font-semibold text-gray-200">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color1 }} />
              {label1}
            </span>
            {data2 && color2 && label2 && (
              <span className="flex items-center gap-1.5 font-semibold text-gray-200">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color2 }} />
                {label2}
              </span>
            )}
          </div>
          <span className="text-[10px] text-gray-400 font-mono">
            Max Scale: {Math.round(maxVal)} {unit}
          </span>
        </div>

        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-36 overflow-visible"
        >
          {/* Grid lines */}
          <line x1="0" y1={chartHeight - 10} x2={chartWidth} y2={chartHeight - 10} stroke="#222732" strokeDasharray="3 3" />
          <line x1="0" y1={chartHeight / 2} x2={chartWidth} y2={chartHeight / 2} stroke="#1A1E26" strokeDasharray="3 3" />
          <line x1="0" y1="10" x2={chartWidth} y2="10" stroke="#1A1E26" strokeDasharray="3 3" />

          {/* Polyline 1 */}
          <polyline
            fill="none"
            stroke={color1}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points1}
          />

          {/* Polyline 2 */}
          {points2 && color2 && (
            <polyline
              fill="none"
              stroke={color2}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={points2}
            />
          )}

          {/* Circles for points */}
          {data1.map((val, idx) => {
            const x = idx * stepX;
            const y = chartHeight - (val / maxVal) * (chartHeight - 20) - 10;
            return (
              <circle
                key={`p1-${idx}`}
                cx={x}
                cy={y}
                r="2.5"
                fill={color1}
                className="hover:r-4 transition-all cursor-pointer"
              >
                <title>{`${label1}: ${val}${unit} at ${new Date(history[idx].timestamp).toLocaleTimeString()}`}</title>
              </circle>
            );
          })}
        </svg>

        {/* Timestamps on X-Axis */}
        <div className="flex justify-between text-[9px] text-gray-500 font-mono mt-1.5 px-1">
          <span>{history[0] ? new Date(history[0].timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
          <span>{history[Math.floor(history.length / 2)] ? new Date(history[Math.floor(history.length / 2)].timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
          <span>{history[history.length - 1] ? new Date(history[history.length - 1].timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#111317] border border-[#2D3139] rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-scaleIn">
        
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-[#141820] to-[#1A202C] border-b border-[#2D3139] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Activity className="w-5 h-5 text-emerald-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-white tracking-wide">{device.name}</h2>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold border ${
                  device.status === 'online'
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-700/50'
                    : device.status === 'warning'
                    ? 'bg-amber-950 text-amber-300 border-amber-700/50'
                    : 'bg-red-950 text-red-300 border-red-700/50'
                }`}>
                  {device.status}
                </span>
                <span className="text-xs text-gray-400 font-mono">({device.ipAddress})</span>
              </div>
              <p className="text-xs text-gray-400 font-mono mt-0.5 flex items-center gap-2">
                <span>{device.campus} &bull; {device.building}</span>
                <span>&bull;</span>
                <span className="text-gray-300">Model: {device.model}</span>
                <span>&bull;</span>
                <span className="text-emerald-400">Last Seen: {new Date(device.lastSeen).toLocaleTimeString()}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={loadHistory}
              disabled={loading}
              title="Refresh Historical Data"
              className="p-2 rounded-lg bg-[#1C2028] hover:bg-[#252A34] text-gray-300 hover:text-white border border-[#2D3139] text-xs transition cursor-pointer flex items-center gap-1"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-[#1C2028] hover:bg-[#252A34] text-gray-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Statistical Summary Cards */}
        <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#0D0F14] border-b border-[#222732]">
          <div className="p-2.5 rounded-xl bg-[#14171E] border border-[#262B36]">
            <p className="text-[10px] text-gray-400 uppercase font-mono flex items-center gap-1">
              <Wifi className="w-3 h-3 text-cyan-400" /> Ping Latency
            </p>
            <p className="text-lg font-bold text-white font-mono mt-0.5">{avgLatency} <span className="text-xs font-normal text-gray-400">ms avg</span></p>
            <p className="text-[10px] text-gray-500 font-mono">Min: {minLatency}ms &bull; Max: {maxLatency}ms</p>
          </div>

          <div className="p-2.5 rounded-xl bg-[#14171E] border border-[#262B36]">
            <p className="text-[10px] text-gray-400 uppercase font-mono flex items-center gap-1">
              <Cpu className="w-3 h-3 text-emerald-400" /> CPU Load
            </p>
            <p className="text-lg font-bold text-white font-mono mt-0.5">{avgCpu}% <span className="text-xs font-normal text-gray-400">avg</span></p>
            <p className="text-[10px] text-gray-500 font-mono">Peak: {maxCpu}% &bull; Current: {device.cpuUsage}%</p>
          </div>

          <div className="p-2.5 rounded-xl bg-[#14171E] border border-[#262B36]">
            <p className="text-[10px] text-gray-400 uppercase font-mono flex items-center gap-1">
              <ArrowDown className="w-3 h-3 text-blue-400" /> Peak Ingress
            </p>
            <p className="text-lg font-bold text-white font-mono mt-0.5">{peakBwIn} <span className="text-xs font-normal text-gray-400">Mbps</span></p>
            <p className="text-[10px] text-gray-500 font-mono">Current: {device.bandwidthInMbps} Mbps</p>
          </div>

          <div className="p-2.5 rounded-xl bg-[#14171E] border border-[#262B36]">
            <p className="text-[10px] text-gray-400 uppercase font-mono flex items-center gap-1">
              <ArrowUp className="w-3 h-3 text-purple-400" /> Peak Egress
            </p>
            <p className="text-lg font-bold text-white font-mono mt-0.5">{peakBwOut} <span className="text-xs font-normal text-gray-400">Mbps</span></p>
            <p className="text-[10px] text-gray-500 font-mono">Current: {device.bandwidthOutMbps} Mbps</p>
          </div>
        </div>

        {/* Filter and Range Controls */}
        <div className="px-4 py-2 bg-[#12141A] border-b border-[#222732] flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                activeTab === 'all' ? 'bg-emerald-600 text-white font-bold' : 'text-gray-400 hover:text-white'
              }`}
            >
              All Metrics
            </button>
            <button
              onClick={() => setActiveTab('latency')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                activeTab === 'latency' ? 'bg-emerald-600 text-white font-bold' : 'text-gray-400 hover:text-white'
              }`}
            >
              Latency & Loss
            </button>
            <button
              onClick={() => setActiveTab('bandwidth')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                activeTab === 'bandwidth' ? 'bg-emerald-600 text-white font-bold' : 'text-gray-400 hover:text-white'
              }`}
            >
              Bandwidth
            </button>
            <button
              onClick={() => setActiveTab('system')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                activeTab === 'system' ? 'bg-emerald-600 text-white font-bold' : 'text-gray-400 hover:text-white'
              }`}
            >
              CPU & RAM
            </button>
          </div>

          <div className="flex items-center space-x-1 text-xs">
            <span className="text-gray-400 font-mono mr-1">Points:</span>
            {[15, 30, 50].map((count) => (
              <button
                key={count}
                onClick={() => setTimeRange(count)}
                className={`px-2 py-0.5 rounded text-[11px] font-mono transition cursor-pointer ${
                  timeRange === count ? 'bg-blue-600 text-white font-bold' : 'bg-[#1C2028] text-gray-400 hover:text-white'
                }`}
              >
                {count}
              </button>
            ))}
          </div>
        </div>

        {/* Charts Scroll Area */}
        <div className="p-4 flex-1 overflow-y-auto space-y-4">
          {/* Latency and Packet Loss Chart */}
          {(activeTab === 'all' || activeTab === 'latency') && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <h4 className="text-xs font-bold text-gray-200 uppercase tracking-wide flex items-center gap-1.5">
                  <Wifi className="w-3.5 h-3.5 text-cyan-400" />
                  <span>ICMP Ping Latency (ms) & Packet Loss (%)</span>
                </h4>
              </div>
              {renderLineChart(
                history.map((h) => (h.status === 'offline' ? 50 : h.latencyMs)),
                '#06B6D4',
                'Latency (ms)',
                history.map((h) => h.packetLoss),
                '#EF4444',
                'Packet Loss (%)',
                undefined,
                'ms'
              )}
            </div>
          )}

          {/* Bandwidth Traffic Chart */}
          {(activeTab === 'all' || activeTab === 'bandwidth') && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <h4 className="text-xs font-bold text-gray-200 uppercase tracking-wide flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
                  <span>Network Traffic Throughput (Mbps)</span>
                </h4>
              </div>
              {renderLineChart(
                history.map((h) => h.bandwidthInMbps),
                '#3B82F6',
                'Ingress (Download)',
                history.map((h) => h.bandwidthOutMbps),
                '#A855F7',
                'Egress (Upload)',
                undefined,
                'Mbps'
              )}
            </div>
          )}

          {/* System Load Chart (CPU and RAM) */}
          {(activeTab === 'all' || activeTab === 'system') && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <h4 className="text-xs font-bold text-gray-200 uppercase tracking-wide flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Compute Resource Utilization (CPU & RAM %)</span>
                </h4>
              </div>
              {renderLineChart(
                history.map((h) => h.cpuUsage),
                '#10B981',
                'CPU Usage (%)',
                history.map((h) => h.memoryUsage),
                '#F59E0B',
                'RAM Usage (%)',
                100,
                '%'
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#0A0B0E] border-t border-[#222732] flex items-center justify-between text-xs text-gray-400">
          <span className="flex items-center gap-1.5 font-mono text-[10px]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Real-Time Stream Active &bull; Firebase Firestore Sync Ready</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-white text-xs font-medium transition cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
