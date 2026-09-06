import React, { useState } from 'react';
import { Box, Thermometer, Zap, Shield, CheckCircle2 } from 'lucide-react';
import { Device } from '../types.ts';

interface RackViewerProps {
  devices: Device[];
  onSelectDevice?: (device: Device) => void;
}

export const RackViewer: React.FC<RackViewerProps> = ({ devices }) => {
  const [selectedRack, setSelectedRack] = useState<string>('RACK-42U-DC-A01');

  const rackOptions = [
    { id: 'RACK-42U-DC-A01', name: 'BJC Data Center NOC (Rack A01)', campus: 'BJC', building: 'Data Center G-01' },
    { id: 'RACK-42U-CS-01', name: 'Faculty of Computing (CS Rack 01)', campus: 'BJC', building: 'CS & IT Room 104' },
    { id: 'RACK-42U-OLD-01', name: 'Abbasia Campus NOC (Rack 01)', campus: 'OLD', building: 'Abbasia NOC Room 103' },
    { id: 'RACK-42U-RYK-01', name: 'RYK Sub-Campus NOC (Rack 01)', campus: 'RYK', building: 'NOC Room 01' },
  ];

  // 42 Units elevation definition for BJC Core NOC Rack
  const rackUnits = [
    { u: 'U41-U42', name: 'Corning 148-Core High Density ODF Fiber Splice Enclosure', type: 'fiber', height: '2U', status: 'optimal', power: '0 W' },
    { u: 'U38-U40', name: 'Cisco ASR 9010 100G Edge BGP Core Router (PERN Uplink)', type: 'router', height: '3U', status: 'optimal', power: '850 W' },
    { u: 'U34-U37', name: 'Cisco Catalyst 9600 Modular 148-Port 10G/40G Core Switch', type: 'switch', height: '4U', status: 'optimal', power: '1200 W' },
    { u: 'U31-U33', name: 'Huawei CloudEngine S6730-H 96-Port 10GE Distribution Switch', type: 'switch', height: '3U', status: 'optimal', power: '650 W' },
    { u: 'U28-U30', name: 'Cat6A High-Density Patch Panels (1-48 Ports)', type: 'patch', height: '3U', status: 'optimal', power: '0 W' },
    { u: 'U24-U27', name: 'Suricata IDS/IPS & Wazuh SIEM Hardware Defense Appliance', type: 'security', height: '4U', status: 'optimal', power: '550 W' },
    { u: 'U20-U23', name: 'IUB AI Deep Learning Compute Node (Lead: Mr. Zeeshan Javed)', type: 'server', height: '4U', status: 'optimal', power: '1400 W' },
    { u: 'U16-U19', name: 'Dell EMC SAN Storage Array (Student LMS & Research DB)', type: 'storage', height: '4U', status: 'optimal', power: '780 W' },
    { u: 'U13-U15', name: 'Grandstream IP-PBX Asterisk SIP VoIP Gateway Server', type: 'voip', height: '3U', status: 'optimal', power: '320 W' },
    { u: 'U10-U12', name: 'Aruba Wi-Fi 6 Central Mobility Controller Cluster', type: 'wifi', height: '3U', status: 'optimal', power: '400 W' },
    { u: 'U7-U9', name: 'Hikvision 128-Channel 4K Enterprise NVR Video Vault', type: 'cctv', height: '3U', status: 'optimal', power: '450 W' },
    { u: 'U4-U6', name: 'Cable Management Organizer & Airflow Ducting', type: 'cable', height: '3U', status: 'optimal', power: '0 W' },
    { u: 'U1-U3', name: 'APC Smart-UPS 10kVA Dual Redundant Battery & Smart PDU', type: 'pdu', height: '3U', status: 'optimal', power: 'Online AC' },
  ];

  const getTypeStyle = (type: string) => {
    switch (type) {
      case 'fiber':
        return 'bg-[#0A0B0E] border-blue-500/40 text-blue-300';
      case 'router':
        return 'bg-[#0A0B0E] border-indigo-500/40 text-indigo-300';
      case 'switch':
        return 'bg-[#0A0B0E] border-emerald-500/40 text-emerald-300';
      case 'security':
        return 'bg-[#0A0B0E] border-purple-500/40 text-purple-300';
      case 'server':
        return 'bg-[#0A0B0E] border-amber-500/40 text-amber-300';
      case 'storage':
        return 'bg-[#0A0B0E] border-teal-500/40 text-teal-300';
      case 'cctv':
        return 'bg-[#0A0B0E] border-rose-500/40 text-rose-300';
      case 'pdu':
        return 'bg-[#0A0B0E] border-[#2D3139] text-gray-300';
      default:
        return 'bg-[#0A0B0E] border-[#2D3139] text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Rack Selector Header */}
      <div className="card-elegant p-6 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#2D3139]">
          <div>
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-lg bg-[#0A0B0E] border border-[#2D3139] text-blue-400">
                <Box className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                IUB Data Center & Campus 42U Server Rack Explorer
              </h2>
            </div>
            <p className="text-xs text-[#9CA3AF] mt-1">
              Physical equipment elevation mapping, smart PDU power dissipation, and cold-aisle thermal telemetry.
            </p>
          </div>

          <div className="flex items-center space-x-2 overflow-x-auto pb-1">
            {rackOptions.map((r) => (
              <button
                key={r.id}
                onClick={() => setSelectedRack(r.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer border ${
                  selectedRack === r.id
                    ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-950/40'
                    : 'bg-[#0A0B0E] text-[#9CA3AF] border-[#2D3139] hover:bg-[#1E2229] hover:text-white'
                }`}
              >
                {r.name}
              </button>
            ))}
          </div>
        </div>

        {/* Environmental & PDU Sensors Banner */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-[#0A0B0E] p-3 rounded-lg border border-[#2D3139] flex items-center space-x-3">
            <Thermometer className="w-6 h-6 text-cyan-400 shrink-0" />
            <div>
              <span className="label-tiny block">COLD AISLE TEMP</span>
              <span className="font-bold font-mono text-cyan-300 text-sm">21.4 &deg;C (Target: 20-22&deg;C)</span>
            </div>
          </div>

          <div className="bg-[#0A0B0E] p-3 rounded-lg border border-[#2D3139] flex items-center space-x-3">
            <Zap className="w-6 h-6 text-amber-400 shrink-0" />
            <div>
              <span className="label-tiny block">PDU POWER LOAD</span>
              <span className="font-bold font-mono text-amber-300 text-sm">6.65 kW / 16A Dual</span>
            </div>
          </div>

          <div className="bg-[#0A0B0E] p-3 rounded-lg border border-[#2D3139] flex items-center space-x-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
            <div>
              <span className="label-tiny block">INROW COOLING</span>
              <span className="font-bold text-emerald-400 text-sm">Optimal Airflow</span>
            </div>
          </div>

          <div className="bg-[#0A0B0E] p-3 rounded-lg border border-[#2D3139] flex items-center space-x-3">
            <Shield className="w-6 h-6 text-purple-400 shrink-0" />
            <div>
              <span className="label-tiny block">RFID SMART LOCK</span>
              <span className="font-bold text-purple-300 text-sm">Engaged (Logged)</span>
            </div>
          </div>
        </div>
      </div>

      {/* 42U Visual Chassis Container */}
      <div className="card-elegant p-6 shadow-2xl">
        <div className="max-w-4xl mx-auto">
          
          {/* Rack Exterior Frame */}
          <div className="border-2 border-[#2D3139] bg-[#0A0B0E] rounded-xl p-3.5 shadow-2xl relative">
            
            {/* Rack Header */}
            <div className="bg-[#16181D] text-center py-2 rounded text-xs font-mono font-bold text-gray-300 border border-[#2D3139] mb-3 flex items-center justify-between px-4">
              <span>RACK ID: <strong className="text-blue-400">{selectedRack}</strong></span>
              <span>42U STANDARD 19-INCH SERVER CABINET</span>
              <span className="text-amber-400">BAGHDAD-UL-JADEED CAMPUS NOC</span>
            </div>

            {/* Units Stack */}
            <div className="space-y-1.5">
              {rackUnits.map((item, idx) => (
                <div
                  key={idx}
                  className={`border rounded-md p-2 flex items-center justify-between text-xs transition hover:border-[#3B424E] ${getTypeStyle(
                    item.type
                  )}`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="font-mono font-bold text-[#9CA3AF] bg-[#16181D] px-2 py-0.5 rounded border border-[#2D3139] text-[11px]">
                      {item.u}
                    </span>
                    <span className="font-semibold text-white tracking-tight">{item.name}</span>
                  </div>

                  <div className="flex items-center space-x-3 text-[11px]">
                    <span className="font-mono text-gray-400">{item.power}</span>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#16181D] border border-[#2D3139]">
                      <div className="dot online"></div>
                      <span className="text-[10px] font-bold font-mono text-emerald-400 uppercase">
                        {item.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Rack Base Plinth */}
            <div className="mt-3 pt-2.5 border-t border-[#2D3139] text-center text-[10px] text-gray-500 font-mono">
              [GROUNDING BUSBAR CONNECTED &bull; EARTH RESISTANCE: 0.8 OHMS &bull; SEISMIC BRACED]
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};
