import React, { useState, useEffect } from 'react';
import { X, Terminal, RefreshCw, Copy, Check } from 'lucide-react';
import { Device } from '../types.ts';
import { runDiagnostics } from '../api.ts';

interface DiagnosticModalProps {
  device: Device | null;
  onClose: () => void;
}

export const DiagnosticModal: React.FC<DiagnosticModalProps> = ({
  device,
  onClose,
}) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const fetchProbe = async () => {
    if (!device) return;
    setLoading(true);
    try {
      const res = await runDiagnostics(device.id);
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (device) {
      fetchProbe();
    }
  }, [device]);

  if (!device) return null;

  const handleCopy = () => {
    if (!data) return;
    const text = JSON.stringify(data, null, 2);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-[#0A0B0E] border border-[#2D3139] rounded-xl shadow-2xl text-[#E5E7EB] overflow-hidden my-8 font-mono">
        
        {/* Terminal Header */}
        <div className="px-5 py-3 border-b border-[#2D3139] flex items-center justify-between bg-[#16181D] font-sans">
          <div className="flex items-center space-x-2.5">
            <div className="flex space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/80"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></span>
            </div>
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-blue-400" />
              <span>NOC Diagnostic Probe: {device.name} ({device.ipAddress})</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={fetchProbe}
              disabled={loading}
              className="p-1.5 rounded bg-[#0A0B0E] hover:bg-[#1E2229] text-[#E5E7EB] border border-[#2D3139] transition cursor-pointer text-xs flex items-center gap-1"
              title="Re-run Diagnostics"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-400' : ''}`} />
              <span className="hidden sm:inline">Re-Probe</span>
            </button>

            <button
              onClick={handleCopy}
              className="p-1.5 rounded bg-[#0A0B0E] hover:bg-[#1E2229] text-[#E5E7EB] border border-[#2D3139] transition cursor-pointer text-xs"
              title="Copy Output"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded text-[#9CA3AF] hover:text-white hover:bg-[#1E2229] transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Terminal Body */}
        <div className="p-5 max-h-[70vh] overflow-y-auto text-xs space-y-4 font-mono leading-relaxed bg-[#0A0B0E]">
          {loading ? (
            <div className="py-12 text-center text-[#9CA3AF] space-y-3 font-sans">
              <RefreshCw className="w-8 h-8 text-blue-400 animate-spin mx-auto" />
              <p>Executing ICMP Ping Probes, Campus Traceroute, and SNMP OID Walk...</p>
            </div>
          ) : data ? (
            <>
              {/* ICMP Section */}
              <div>
                <div className="text-emerald-400 font-bold border-b border-[#2D3139] pb-1 flex items-center justify-between">
                  <span>--- ICMP PING 5-PACKET TELEMETRY PROBE ---</span>
                  <span className={data.status === 'SUCCESS' ? 'text-emerald-400' : 'text-red-400'}>
                    [{data.status}]
                  </span>
                </div>
                <div className="mt-2 text-[#E5E7EB] space-y-1">
                  <div>
                    Target Host: <strong className="text-white">{data.hostName}</strong> [{data.ipAddress}]
                    {device.deviceNumber && <span className="ml-2 text-cyan-300 font-semibold">(Device #{device.deviceNumber})</span>}
                  </div>
                  <div className="text-gray-300">
                    Location: <span className="text-white font-medium">{device.building}</span> &bull; Room: <span className="text-amber-400 font-bold">{device.roomNo}</span>
                    {device.deviceLocation && <span> &bull; Spot: <span className="text-cyan-300">{device.deviceLocation}</span></span>}
                  </div>
                  <div>Transmitted: 5 packets &bull; Received: {data.packetsReceived} &bull; Packet Loss: <strong className={data.packetLossPercent > 0 ? 'text-red-400' : 'text-emerald-400'}>{data.packetLossPercent}%</strong></div>
                  <div>Round-Trip Time: min/avg/max/stddev = <strong className="text-cyan-300">{data.roundTripMinMs} / {data.roundTripAvgMs} / {data.roundTripMaxMs} / {data.jitterMs} ms</strong></div>
                  <div>Time-To-Live (TTL): {data.ttl} &bull; Interface: {device.devicePort || 'Eth0/1'} [Fiber/Copper]</div>
                  {(device.switchPort || device.switchModel || device.switchLocation) && (
                    <div className="text-blue-300">
                      Switch Link: <span className="text-emerald-400 font-semibold">{device.switchModel || 'Switch'} ({device.switchLocation || device.switchBuilding || 'MDF'})</span> &bull; SW Port: <span className="text-amber-300 font-bold">{device.switchPort || 'N/A'}</span> &bull; Dev Port: <span className="text-cyan-300 font-bold">{device.devicePort || 'Eth0'}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Traceroute Section */}
              <div className="pt-2">
                <div className="text-blue-400 font-bold border-b border-[#2D3139] pb-1">
                  --- CAMPUS WAN/LAN ROUTING HOPS (TRACEROUTE) ---
                </div>
                <div className="mt-2 space-y-1">
                  {data.tracerouteHops.map((hop: any) => (
                    <div key={hop.hop} className="flex items-center space-x-3 text-[#E5E7EB]">
                      <span className="text-gray-500 w-4 font-bold">{hop.hop}</span>
                      <span className="text-blue-400 font-mono w-28">{hop.ip}</span>
                      <span className="text-[#9CA3AF] truncate flex-1">{hop.hostname}</span>
                      <span className="text-cyan-300 font-bold">{hop.timeMs} ms</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* SNMP Telemetry OID Section */}
              <div className="pt-2">
                <div className="text-purple-400 font-bold border-b border-[#2D3139] pb-1">
                  --- SNMP v2c/v3 MIB-II TELEMETRY WALK ---
                </div>
                <div className="mt-2 space-y-1 text-[#E5E7EB]">
                  <div>RFC1213-MIB::sysDescr.0 = <span className="text-amber-300">STRING: "{data.snmpTelemetry.sysDescr}"</span></div>
                  <div>DISMAN-EVENT-MIB::sysUpTimeInstance = <span className="text-emerald-400">Timeticks: ({data.snmpTelemetry.sysUpTime})</span></div>
                  <div>IF-MIB::ifSpeed.1 = <span className="text-cyan-300">Gauge32: {data.snmpTelemetry.ifSpeed}</span></div>
                  <div>IF-MIB::ifOperStatus.1 = <span className="text-emerald-400">{data.snmpTelemetry.ifOperStatus}</span></div>
                  <div>HOST-RESOURCES-MIB::hrProcessorLoad = <span className="text-white font-bold">{data.snmpTelemetry.hrProcessorLoad}%</span></div>
                  <div>HOST-RESOURCES-MIB::hrStorageUsed = <span className="text-white font-bold">{data.snmpTelemetry.hrStorageUsedPercent}%</span></div>
                  {data.snmpTelemetry.opticalRxPowerDbm && (
                    <>
                      <div>CISCO-ENTITY-SENSOR-MIB::opticalRxPower = <span className="text-blue-400 font-bold">{data.snmpTelemetry.opticalRxPowerDbm} dBm</span></div>
                      <div>CISCO-ENTITY-SENSOR-MIB::opticalTxPower = <span className="text-blue-400 font-bold">{data.snmpTelemetry.opticalTxPowerDbm} dBm</span></div>
                    </>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="text-red-400">Probe execution failed.</div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#2D3139] bg-[#16181D] flex items-center justify-between text-[11px] font-sans text-[#9CA3AF]">
          <span>Lead: <strong className="text-white">Mr. Zeeshan Javed, AI Lead Engineer</strong></span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 bg-[#0A0B0E] hover:bg-[#1E2229] border border-[#2D3139] text-white rounded-md cursor-pointer transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
