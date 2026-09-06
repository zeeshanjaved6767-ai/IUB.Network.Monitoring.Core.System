import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Flame, 
  Terminal, 
  Lock, 
  Zap
} from 'lucide-react';
import { SecurityEvent } from '../types.ts';

interface SecurityCenterProps {
  events: SecurityEvent[];
  onTriggerSimulatedAttack: (type: string) => Promise<void>;
}

export const SecurityCenter: React.FC<SecurityCenterProps> = ({
  events,
  onTriggerSimulatedAttack,
}) => {
  const [isSimulating, setIsSimulating] = useState(false);
  const [filterSource, setFilterSource] = useState<'ALL' | 'Suricata-IDS' | 'Wazuh-SIEM'>('ALL');

  const handleSimulate = async (type: string) => {
    setIsSimulating(true);
    try {
      await onTriggerSimulatedAttack(type);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSimulating(false);
    }
  };

  const filteredEvents = events.filter((e) => {
    if (filterSource !== 'ALL' && e.source !== filterSource) return false;
    return true;
  });

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#0A0B0E] border border-red-500/40">
            <div className="dot offline"></div>
            <span className="text-[10px] font-bold font-mono text-red-400 uppercase">CRITICAL</span>
          </div>
        );
      case 'high':
        return (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#0A0B0E] border border-rose-500/40">
            <div className="dot offline"></div>
            <span className="text-[10px] font-bold font-mono text-rose-400 uppercase">HIGH</span>
          </div>
        );
      case 'warning':
        return (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#0A0B0E] border border-amber-500/40">
            <div className="dot warning"></div>
            <span className="text-[10px] font-bold font-mono text-amber-400 uppercase">ANOMALY</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#0A0B0E] border border-[#2D3139]">
            <div className="dot online"></div>
            <span className="text-[10px] font-bold font-mono text-emerald-400 uppercase">VERIFIED</span>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner: Dual Engine Overview */}
      <div className="card-elegant p-6 shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#2D3139]">
          <div>
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-lg bg-[#0A0B0E] border border-[#2D3139] text-cyan-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                IUB Campus Cyber Defense & SOC (Suricata IPS & Wazuh SIEM)
              </h2>
            </div>
            <p className="text-xs text-[#9CA3AF] mt-1">
              Autonomous Deep Packet Inspection (DPI), Intrusion Prevention System, and Host Endpoint Security.
            </p>
          </div>

          {/* Simulate attack buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleSimulate('DDoS SYN Flood')}
              disabled={isSimulating}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#0A0B0E] hover:bg-[#1E2229] text-red-400 text-xs font-semibold border border-[#2D3139] transition cursor-pointer disabled:opacity-50"
              title="Test Suricata IPS Autonomous Blocking"
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Simulate SYN Flood</span>
            </button>

            <button
              onClick={() => handleSimulate('SSH Brute Force')}
              disabled={isSimulating}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#0A0B0E] hover:bg-[#1E2229] text-purple-400 text-xs font-semibold border border-[#2D3139] transition cursor-pointer disabled:opacity-50"
              title="Test Wazuh Active Response IP Ban"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Simulate SSH Brute Force</span>
            </button>
          </div>
        </div>

        {/* Security Posture Status */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-[#0A0B0E] p-3 rounded-lg border border-[#2D3139]">
            <div className="flex items-center justify-between">
              <span className="label-tiny">SURICATA IPS</span>
              <div className="dot online"></div>
            </div>
            <span className="font-bold font-mono text-emerald-400 text-sm block mt-1.5">ARMED & BLOCKING</span>
            <span className="text-[10px] text-[#9CA3AF]">38,450 Rules (ET-Pro & Emerging Threats)</span>
          </div>

          <div className="bg-[#0A0B0E] p-3 rounded-lg border border-[#2D3139]">
            <div className="flex items-center justify-between">
              <span className="label-tiny">WAZUH SIEM</span>
              <div className="dot online"></div>
            </div>
            <span className="font-bold font-mono text-purple-300 text-sm block mt-1.5">184 AGENTS ACTIVE</span>
            <span className="text-[10px] text-[#9CA3AF]">FIM, CIS Benchmarks, Active Response</span>
          </div>

          <div className="bg-[#0A0B0E] p-3 rounded-lg border border-[#2D3139]">
            <div className="flex items-center justify-between">
              <span className="label-tiny">SECURITY SCORE</span>
              <div className="dot online"></div>
            </div>
            <span className="font-bold font-mono text-cyan-300 text-sm block mt-1.5">98.4% (Grade A+)</span>
            <span className="text-[10px] text-[#9CA3AF]">0 Active Breaches &bull; Zero Day Protected</span>
          </div>

          <div className="bg-[#0A0B0E] p-3 rounded-lg border border-[#2D3139]">
            <div className="flex items-center justify-between">
              <span className="label-tiny">LEAD ARCHITECT</span>
              <Lock className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <span className="font-bold text-amber-400 text-sm block mt-1.5">Mr. Zeeshan Javed</span>
            <span className="text-[10px] text-[#9CA3AF]">AI Lead Engineer & Cyber Operations</span>
          </div>
        </div>
      </div>

      {/* Real-Time Security Incident Stream */}
      <div className="card-elegant p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-[#2D3139] mb-4">
          <div className="flex items-center space-x-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white tracking-tight">Live Threat Intelligence & Incident Stream</h3>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <button
              onClick={() => setFilterSource('ALL')}
              className={`px-3 py-1 rounded text-xs transition cursor-pointer border ${
                filterSource === 'ALL'
                  ? 'bg-blue-600 text-white border-blue-500 font-semibold'
                  : 'text-[#9CA3AF] border-[#2D3139] hover:bg-[#1E2229] hover:text-white'
              }`}
            >
              All Engines
            </button>
            <button
              onClick={() => setFilterSource('Suricata-IDS')}
              className={`px-3 py-1 rounded text-xs transition cursor-pointer border ${
                filterSource === 'Suricata-IDS'
                  ? 'bg-blue-600 text-white border-blue-500 font-semibold'
                  : 'text-[#9CA3AF] border-[#2D3139] hover:bg-[#1E2229] hover:text-white'
              }`}
            >
              Suricata IPS Only
            </button>
            <button
              onClick={() => setFilterSource('Wazuh-SIEM')}
              className={`px-3 py-1 rounded text-xs transition cursor-pointer border ${
                filterSource === 'Wazuh-SIEM'
                  ? 'bg-blue-600 text-white border-blue-500 font-semibold'
                  : 'text-[#9CA3AF] border-[#2D3139] hover:bg-[#1E2229] hover:text-white'
              }`}
            >
              Wazuh SIEM Only
            </button>
          </div>
        </div>

        {/* Incidents List */}
        <div className="space-y-3">
          {filteredEvents.map((evt) => (
            <div
              key={evt.id}
              className="bg-[#0A0B0E] rounded-lg p-4 border border-[#2D3139] hover:border-[#3B424E] transition"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-[#2D3139]">
                <div className="flex items-center space-x-2">
                  <span className="badge-tool font-semibold text-blue-400">
                    {evt.source}
                  </span>
                  <span className="font-bold text-white text-xs">{evt.eventType}</span>
                </div>

                <div className="flex items-center space-x-2">
                  {getSeverityBadge(evt.severity)}
                  <span className="text-[11px] font-mono text-[#9CA3AF]">
                    {new Date(evt.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                <div className="bg-[#16181D] p-2 rounded border border-[#2D3139]">
                  <span className="label-tiny block">TARGET ASSET</span>
                  <span className="font-semibold text-white mt-0.5 block">{evt.targetDevice}</span>
                  <span className="font-mono text-blue-400 block text-[11px]">{evt.targetIp}</span>
                </div>

                <div className="bg-[#16181D] p-2 rounded border border-[#2D3139]">
                  <span className="label-tiny block">ORIGIN / ATTACKER IP</span>
                  <span className="font-mono font-bold text-red-400 mt-0.5 block">{evt.attackerIp}</span>
                  <span className="text-[10px] text-[#9CA3AF] block">External Geo-IP Checked</span>
                </div>

                <div className="bg-[#16181D] p-2 rounded border border-[#2D3139]">
                  <span className="label-tiny block">AUTONOMOUS MITIGATION</span>
                  <span className="font-semibold text-emerald-400 mt-0.5 block">{evt.actionTaken}</span>
                </div>
              </div>

              <div className="mt-2.5 text-xs text-[#E5E7EB] bg-[#16181D] p-2.5 rounded border border-[#2D3139]">
                <strong className="text-[#9CA3AF]">Telemetry Analysis:</strong> {evt.details}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
