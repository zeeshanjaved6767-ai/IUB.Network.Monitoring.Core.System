import React, { useState } from 'react';
import { 
  Cable, 
  CheckCircle2, 
  Save, 
  Info,
  Sliders
} from 'lucide-react';
import { FiberLink, FiberCore } from '../types.ts';

interface FiberManagerProps {
  fiberLinks: FiberLink[];
  onUpdateCore: (linkId: string, coreNumber: number, status: string, service?: string) => Promise<void>;
}

export const FiberManager: React.FC<FiberManagerProps> = ({
  fiberLinks,
  onUpdateCore,
}) => {
  const [selectedLinkId, setSelectedLinkId] = useState<string>(fiberLinks[0]?.id || '');
  const [selectedCore, setSelectedCore] = useState<FiberCore | null>(null);
  const [editStatus, setEditStatus] = useState<'active' | 'spare' | 'dark' | 'faulty'>('active');
  const [editService, setEditService] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const activeLink = fiberLinks.find((l) => l.id === selectedLinkId) || fiberLinks[0];

  const handleSelectCore = (core: FiberCore) => {
    setSelectedCore(core);
    setEditStatus(core.status);
    setEditService(core.service);
    setSuccessMsg('');
  };

  const handleSaveCore = async () => {
    if (!activeLink || !selectedCore) return;
    setIsUpdating(true);
    try {
      await onUpdateCore(activeLink.id, selectedCore.coreNumber, editStatus, editService);
      setSuccessMsg(`Core #${selectedCore.coreNumber} updated to ${editStatus.toUpperCase()}`);
      setSelectedCore({
        ...selectedCore,
        status: editStatus,
        service: editService,
        attenuationDb: editStatus === 'faulty' ? 1.45 : 0.21,
      });
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpdating(false);
    }
  };

  if (!activeLink) {
    return (
      <div className="p-8 text-center text-[#9CA3AF] card-elegant">
        No Fiber Links found in database.
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#0A0B0E] border border-[#2D3139]">
            <div className="dot online"></div>
            <span className="text-[10px] font-bold font-mono text-emerald-400">ACTIVE (LIT)</span>
          </div>
        );
      case 'spare':
        return (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#0A0B0E] border border-[#2D3139]">
            <div className="dot warning"></div>
            <span className="text-[10px] font-bold font-mono text-amber-400">HOT SPARE</span>
          </div>
        );
      case 'dark':
        return (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#0A0B0E] border border-[#2D3139]">
            <span className="w-2 h-2 rounded-full bg-gray-600"></span>
            <span className="text-[10px] font-bold font-mono text-gray-400">UNLIT (DARK)</span>
          </div>
        );
      case 'faulty':
        return (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#0A0B0E] border border-red-500/40">
            <div className="dot offline"></div>
            <span className="text-[10px] font-bold font-mono text-red-400">FAULTY</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Selector & Overview */}
      <div className="card-elegant p-6 shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-[#2D3139]">
          <div>
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-lg bg-[#0A0B0E] border border-[#2D3139] text-blue-400">
                <Cable className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                IUB High-Density Fiber Optic Core & Backbone Matrix
              </h2>
            </div>
            <p className="text-xs text-[#9CA3AF] mt-1">
              Multi-core optical distribution management across University Campuses: 148, 96, 48, 24, and 12-core cables.
            </p>
          </div>

          {/* Cable selector pills */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-1">
            {fiberLinks.map((link) => (
              <button
                key={link.id}
                id={`fiber-link-tab-${link.id}`}
                onClick={() => {
                  setSelectedLinkId(link.id);
                  setSelectedCore(null);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer border ${
                  activeLink.id === link.id
                    ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-950/40'
                    : 'bg-[#0A0B0E] text-[#9CA3AF] border-[#2D3139] hover:bg-[#1E2229] hover:text-white'
                }`}
              >
                <span>{link.totalCores}-Core: {link.sourceCampus} &rarr; {link.destCampus}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Selected Link Metadata Banner */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-[#0A0B0E] rounded-lg p-3 border border-[#2D3139]">
            <span className="label-tiny block">DESIGNATION</span>
            <span className="font-bold text-white text-xs truncate block mt-1" title={activeLink.cableName}>
              {activeLink.cableName}
            </span>
          </div>

          <div className="bg-[#0A0B0E] rounded-lg p-3 border border-[#2D3139]">
            <span className="label-tiny block">CAPACITY</span>
            <span className="font-bold font-mono text-blue-400 text-sm block mt-1">
              {activeLink.totalCores} Cores Total
            </span>
          </div>

          <div className="bg-[#0A0B0E] rounded-lg p-3 border border-[#2D3139]">
            <span className="label-tiny block">LIT CORES</span>
            <span className="font-bold font-mono text-emerald-400 text-sm block mt-1">
              {activeLink.activeCoresCount} Active Cores
            </span>
          </div>

          <div className="bg-[#0A0B0E] rounded-lg p-3 border border-[#2D3139]">
            <span className="label-tiny block">DARK / RESERVE</span>
            <span className="font-bold font-mono text-[#9CA3AF] text-sm block mt-1">
              {activeLink.darkCoresCount} Dark Cores
            </span>
          </div>

          <div className="bg-[#0A0B0E] rounded-lg p-3 border border-[#2D3139]">
            <span className="label-tiny block">ATTENUATION</span>
            <span className={`font-bold font-mono text-sm block mt-1 ${activeLink.averageAttenuationDb > 0.35 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {activeLink.averageAttenuationDb} dB/km
            </span>
          </div>

          <div className="bg-[#0A0B0E] rounded-lg p-3 border border-[#2D3139]">
            <span className="label-tiny block">DISTANCE</span>
            <span className="font-bold font-mono text-amber-300 text-sm block mt-1">
              {activeLink.distanceKm} km
            </span>
          </div>
        </div>

        {/* Route Details */}
        <div className="mt-3 text-xs text-[#E5E7EB] flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-lg bg-[#0A0B0E] border border-[#2D3139]">
          <div>
            <strong className="text-white">Origin:</strong> {activeLink.sourceCampus} ({activeLink.sourceBuilding}) &rarr; <strong className="text-white">Terminus:</strong> {activeLink.destCampus} ({activeLink.destBuilding})
          </div>
          <div>
            <strong className="text-[#9CA3AF]">Spec:</strong> <span className="text-blue-400 font-mono">{activeLink.cableType}</span> (Compliant with ITU-T G.652.D / TIA-598-C)
          </div>
        </div>
      </div>

      {/* Main Interactive Grid & Detail Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Core Matrix Grid */}
        <div className="lg:col-span-2 card-elegant p-6 shadow-2xl">
          <div className="flex items-center justify-between pb-3 border-b border-[#2D3139] mb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Optical Distribution Matrix ({activeLink.totalCores} Cores)</span>
                <span className="text-[11px] font-normal text-[#9CA3AF]">
                  Click any core cell to view/edit telemetry
                </span>
              </h3>
            </div>
            
            {/* Color Legend */}
            <div className="flex items-center space-x-3 text-[10px] text-[#9CA3AF]">
              <span className="flex items-center gap-1.5">
                <div className="dot online"></div>
                <span>Active</span>
              </span>
              <span className="flex items-center gap-1.5">
                <div className="dot warning"></div>
                <span>Spare</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-gray-600"></span>
                <span>Dark</span>
              </span>
              <span className="flex items-center gap-1.5">
                <div className="dot offline"></div>
                <span>Faulty</span>
              </span>
            </div>
          </div>

          {/* Core Cells Grid */}
          <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 gap-2 max-h-[520px] overflow-y-auto p-1">
            {activeLink.cores.map((core) => {
              const isSelected = selectedCore?.coreNumber === core.coreNumber;
              
              let dotType = 'online';
              if (core.status === 'spare') dotType = 'warning';
              if (core.status === 'dark') dotType = 'dark';
              if (core.status === 'faulty') dotType = 'offline';

              return (
                <button
                  key={core.coreNumber}
                  id={`core-cell-${core.coreNumber}`}
                  onClick={() => handleSelectCore(core)}
                  className={`p-2 rounded-lg text-center transition cursor-pointer border flex flex-col items-center justify-between gap-1 relative ${
                    isSelected
                      ? 'bg-blue-900/30 border-blue-500 ring-1 ring-blue-500 shadow-lg'
                      : 'bg-[#0A0B0E] hover:bg-[#1E2229] border-[#2D3139]'
                  }`}
                  title={`Core #${core.coreNumber} (${core.colorName} / Tube ${core.tubeNumber}) - ${core.status}: ${core.service}`}
                >
                  <div className="flex items-center justify-between w-full text-[10px] text-[#9CA3AF] font-mono">
                    <span>#{core.coreNumber}</span>
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: core.hexColor }}
                      title={`Buffer Color: ${core.colorName}`}
                    />
                  </div>

                  {/* Status Indicator Dot */}
                  <div className="my-0.5">
                    {dotType === 'dark' ? (
                      <span className="w-2.5 h-2.5 rounded-full inline-block bg-gray-600"></span>
                    ) : (
                      <div className={`dot ${dotType}`}></div>
                    )}
                  </div>

                  <span className="text-[9px] font-mono text-[#9CA3AF] truncate w-full">
                    {core.attenuationDb}dB
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-4 pt-3 border-t border-[#2D3139] text-[11px] text-[#9CA3AF] flex items-center justify-between">
            <span>Buffer Tube Spec: Standard 12-fiber color code (TIA-598-C)</span>
            <span>OTDR Test: <strong className="text-[#E5E7EB] font-mono">1310nm / 1550nm Single-Mode</strong></span>
          </div>
        </div>

        {/* Selected Core Telemetry & Configuration Panel */}
        <div className="card-elegant p-6 shadow-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#2D3139]">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-400" />
                <span>
                  {selectedCore ? `Fiber Core #${selectedCore.coreNumber} Telemetry` : 'Select a Core'}
                </span>
              </h3>
              {selectedCore && getStatusBadge(selectedCore.status)}
            </div>

            {selectedCore ? (
              <div className="mt-4 space-y-4 text-xs">
                
                {/* Physical Specs */}
                <div className="bg-[#0A0B0E] p-3 rounded-lg border border-[#2D3139] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[#9CA3AF]">Color Code (TIA-598):</span>
                    <div className="flex items-center space-x-1.5 font-medium text-white">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: selectedCore.hexColor }}
                      ></span>
                      <span>{selectedCore.colorName}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[#9CA3AF]">Buffer Tube Group:</span>
                    <span className="font-medium text-[#E5E7EB]">Tube #{selectedCore.tubeNumber}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[#9CA3AF]">Optical Attenuation:</span>
                    <span className={`font-mono font-bold ${selectedCore.attenuationDb > 0.4 ? 'text-red-400' : 'text-emerald-400'}`}>
                      {selectedCore.attenuationDb} dB (Loss: {Number((selectedCore.attenuationDb * activeLink.distanceKm).toFixed(2))} dB)
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[#9CA3AF]">Tx / Rx Power:</span>
                    <span className="font-mono text-cyan-300">
                      Tx: {selectedCore.txPowerDbm} dBm / Rx: {selectedCore.rxPowerDbm ? selectedCore.rxPowerDbm.toFixed(2) : '-12.0'} dBm
                    </span>
                  </div>
                </div>

                {/* Edit Status Form */}
                <div className="space-y-3 pt-2">
                  <div>
                    <label className="block text-[#E5E7EB] font-semibold mb-1">Assigned Network Service</label>
                    <input
                      type="text"
                      value={editService}
                      onChange={(e) => setEditService(e.target.value)}
                      placeholder="e.g. 100G Backbone Ring / CCTV NVR Trunk"
                      className="w-full px-3 py-2 bg-[#0A0B0E] border border-[#2D3139] rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[#E5E7EB] font-semibold mb-1">Core Operational Status</label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as any)}
                      className="w-full px-3 py-2 bg-[#0A0B0E] border border-[#2D3139] rounded-lg text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                      <option value="active">Active (Carrying Live Traffic)</option>
                      <option value="spare">Hot Spare (Standby Protection Path)</option>
                      <option value="dark">Dark Fiber (Unlit Reserve)</option>
                      <option value="faulty">Faulty (High Attenuation / Splicing Issue)</option>
                    </select>
                  </div>

                  {successMsg && (
                    <div className="p-2.5 rounded bg-[#0A0B0E] border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{successMsg}</span>
                    </div>
                  )}

                  <button
                    onClick={handleSaveCore}
                    disabled={isUpdating}
                    className="w-full mt-2 flex items-center justify-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-xs transition cursor-pointer shadow-md shadow-blue-950/40 disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isUpdating ? 'Saving Core...' : 'Update Core Configuration'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-16 text-center text-[#9CA3AF] space-y-2">
                <Info className="w-8 h-8 text-[#2D3139] mx-auto" />
                <p>Click on any of the {activeLink.totalCores} fiber cores in the matrix to view optical power and modify traffic assignment.</p>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-[#2D3139] text-[11px] text-[#9CA3AF]">
            Engineered by <strong className="text-white">Mr. Zeeshan Javed, AI Lead Engineer</strong> for IUB Fiber ODF Backbone.
          </div>
        </div>
      </div>

    </div>
  );
};
