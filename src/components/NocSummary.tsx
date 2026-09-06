import React from 'react';
import { 
  Server, 
  Activity, 
  Wifi, 
  ShieldCheck, 
  Cable, 
  Building2, 
  TrendingUp, 
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { CampusInfo, CampusId, Device } from '../types.ts';

interface NocSummaryProps {
  campuses: CampusInfo[];
  devices: Device[];
  onSelectCampus: (campus: CampusId) => void;
}

export const NocSummary: React.FC<NocSummaryProps> = ({
  campuses,
  devices,
  onSelectCampus,
}) => {
  const totalDevs = devices.length;
  const onlineDevs = devices.filter((d) => d.status === 'online').length;
  const offlineDevs = devices.filter((d) => d.status === 'offline').length;
  const warningDevs = devices.filter((d) => d.status === 'warning').length;
  const onlinePercent = totalDevs > 0 ? ((onlineDevs / totalDevs) * 100).toFixed(1) : '100';

  const avgLatency = (
    devices.reduce((acc, d) => acc + (d.status === 'online' ? d.latencyMs : 0), 0) /
    (onlineDevs || 1)
  ).toFixed(1);

  const totalBandwidthGbps = (
    devices.reduce((acc, d) => acc + d.bandwidthInMbps + d.bandwidthOutMbps, 0) / 1000
  ).toFixed(1);

  return (
    <div className="space-y-6">
      
      {/* High-Level Metric Tiles (Elegant Dark Stat Grid) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        
        {/* Total Devices */}
        <div className="card-elegant p-4 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#9CA3AF]">
            <span className="label-tiny">TOTAL ASSETS</span>
            <Server className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-white font-mono tracking-tight">{totalDevs}</span>
            <span className="text-[10px] text-[#9CA3AF] block mt-0.5">Across 6 Campuses</span>
          </div>
        </div>

        {/* Online Percentage */}
        <div className="card-elegant p-4 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#9CA3AF]">
            <span className="label-tiny">NETWORK HEALTH</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-emerald-400 font-mono tracking-tight">{onlinePercent}%</span>
              <span className="text-[10px] text-emerald-500 font-medium">+0.2%</span>
            </div>
            <div className="w-full bg-[#2D3139] h-1.5 mt-2 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full" style={{ width: `${onlinePercent}%` }}></div>
            </div>
            <span className="text-[10px] text-[#9CA3AF] block mt-1.5">
              {onlineDevs} Online &bull; {offlineDevs} Down
            </span>
          </div>
        </div>

        {/* Latency */}
        <div className="card-elegant p-4 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#9CA3AF]">
            <span className="label-tiny">MEAN LATENCY</span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-cyan-300 font-mono tracking-tight">{avgLatency} ms</span>
            <span className="text-[10px] text-[#9CA3AF] block mt-0.5">Core Interconnects</span>
          </div>
        </div>

        {/* Bandwidth Aggregate */}
        <div className="card-elegant p-4 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#9CA3AF]">
            <span className="label-tiny">THROUGHPUT</span>
            <TrendingUp className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-blue-400 font-mono tracking-tight">{totalBandwidthGbps} <span className="text-sm font-normal text-[#9CA3AF]">Gbps</span></span>
            <span className="text-[10px] text-[#9CA3AF] block mt-0.5">PERN 40G Multi-Homed</span>
          </div>
        </div>

        {/* Optical Fiber Backbones */}
        <div className="card-elegant p-4 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#9CA3AF]">
            <span className="label-tiny">FIBER CORE</span>
            <Cable className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-amber-300 font-mono tracking-tight">148 Core</span>
            <span className="text-[10px] text-[#9CA3AF] block mt-0.5">Corning ODF Rings</span>
          </div>
        </div>

        {/* Security Posture */}
        <div className="card-elegant p-4 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#9CA3AF]">
            <span className="label-tiny">SOC DEFENSE</span>
            <ShieldCheck className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-purple-300 font-mono tracking-tight">100% OK</span>
            <span className="text-[10px] text-[#9CA3AF] block mt-0.5">Suricata & Wazuh Active</span>
          </div>
        </div>

      </div>

      {/* Multi-Campus Network Health Matrix */}
      <div className="card-elegant p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-[#2D3139] mb-4">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-400" />
              <span>The Islamia University of Bahawalpur &bull; Multi-Campus Operations Matrix</span>
            </h2>
            <p className="text-xs text-[#9CA3AF] mt-0.5">
              Live fiber link status and device telemetry across all six university campuses.
            </p>
          </div>
          <span className="text-xs font-medium text-[#9CA3AF]">
            Lead: <strong className="text-white">Mr. Zeeshan Javed</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {campuses.map((campus) => {
            const campusDevs = devices.filter((d) => d.campus === campus.id);
            const onlineCount = campusDevs.filter((d) => d.status === 'online').length;
            const offlineCount = campusDevs.filter((d) => d.status === 'offline').length;

            return (
              <div
                key={campus.id}
                id={`campus-matrix-card-${campus.id}`}
                className="bg-[#0A0B0E] rounded-lg p-4 border border-[#2D3139] hover:border-[#3B424E] transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="campus-tag">
                        {campus.id}
                      </span>
                      <h3 className="font-bold text-white text-sm mt-2">{campus.name}</h3>
                      <p className="text-xs text-[#9CA3AF]">{campus.city}</p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <div className={`dot ${campus.fiberStatus === 'Optimal' ? 'online' : 'warning'}`}></div>
                      <span className="text-[11px] font-mono text-[#9CA3AF]">{campus.fiberStatus}</span>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-[#16181D] p-2 rounded border border-[#2D3139]">
                      <span className="label-tiny block">EQUIPMENT</span>
                      <span className="font-bold font-mono text-white">
                        {onlineCount}/{campusDevs.length} Online
                      </span>
                    </div>

                    <div className="bg-[#16181D] p-2 rounded border border-[#2D3139]">
                      <span className="label-tiny block">BACKBONE</span>
                      <span className="font-bold font-mono text-blue-400">{campus.coreBandwidth}</span>
                    </div>
                  </div>

                  <div className="mt-2.5 text-[11px] text-[#9CA3AF]">
                    <span>NOC Lead: <strong className="text-[#E5E7EB]">{campus.nocLead}</strong></span>
                  </div>
                </div>

                <button
                  onClick={() => onSelectCampus(campus.id)}
                  className="mt-3.5 w-full py-1.5 px-3 rounded bg-[#16181D] hover:bg-[#1E2229] text-[#E5E7EB] text-xs font-medium flex items-center justify-center space-x-1.5 transition cursor-pointer border border-[#2D3139]"
                >
                  <span>Inspect {campus.shortName} Assets</span>
                  <ArrowRight className="w-3.5 h-3.5 text-blue-400" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
