import React, { useState } from 'react';
import { 
  X, 
  FileText, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  Building2, 
  ShieldCheck,
  Filter
} from 'lucide-react';
import { Device, CampusId, CampusInfo } from '../types.ts';
import { generateDevicesPdfReport } from '../utils/pdfGenerator.ts';

interface PdfExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  devices: Device[];
  campuses: CampusInfo[];
  defaultCampus?: CampusId | 'ALL';
}

export const PdfExportModal: React.FC<PdfExportModalProps> = ({
  isOpen,
  onClose,
  devices,
  campuses,
  defaultCampus = 'ALL',
}) => {
  const [selectedCampus, setSelectedCampus] = useState<CampusId | 'ALL'>(defaultCampus);
  const [filterStatus, setFilterStatus] = useState<'all' | 'offline' | 'online'>('all');
  const [reportTitle, setReportTitle] = useState('IUB Master Network Infrastructure Telemetry Report');
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  if (!isOpen) return null;

  const filteredDevices = devices.filter((d) => {
    if (selectedCampus !== 'ALL' && d.campus !== selectedCampus) return false;
    if (filterStatus === 'offline' && d.status !== 'offline') return false;
    if (filterStatus === 'online' && d.status !== 'online') return false;
    return true;
  });

  const handleExport = () => {
    setIsExporting(true);
    try {
      generateDevicesPdfReport(devices, {
        title: reportTitle,
        selectedCampus,
        filterStatus,
        engineerName: 'Mr. Zeeshan Javed (AI Lead Engineer)',
      });
      setExportSuccess(true);
      setTimeout(() => {
        setExportSuccess(false);
      }, 3000);
    } catch (err) {
      console.error('Failed to export PDF:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-[#12141A] border border-[#2D3139] rounded-xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-[#2D3139] flex items-center justify-between bg-[#16181D]">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>Export Official Network PDF Report</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30">
                  PDF Audit
                </span>
              </h3>
              <p className="text-xs text-gray-400">
                Generate formatted PDF report for IUB DIT management and audit teams.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#252830] transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Form */}
        <div className="p-5 space-y-4 text-xs">
          <div>
            <label className="block text-gray-300 font-semibold mb-1">
              Document Report Title
            </label>
            <input
              type="text"
              value={reportTitle}
              onChange={(e) => setReportTitle(e.target.value)}
              className="w-full px-3 py-2 bg-[#1A1D24] border border-[#2D3139] rounded-lg text-gray-200 text-xs focus:border-blue-500 focus:outline-none"
              placeholder="e.g. IUB Master Network Infrastructure Telemetry Report"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-300 font-semibold mb-1">
                Campus Scope
              </label>
              <select
                value={selectedCampus}
                onChange={(e) => setSelectedCampus(e.target.value as any)}
                className="w-full px-3 py-2 bg-[#1A1D24] border border-[#2D3139] rounded-lg text-gray-200 text-xs focus:border-blue-500 focus:outline-none cursor-pointer"
              >
                <option value="ALL">All 6 Campuses (IUB)</option>
                {campuses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.id})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-300 font-semibold mb-1">
                Device Status Filter
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="w-full px-3 py-2 bg-[#1A1D24] border border-[#2D3139] rounded-lg text-gray-200 text-xs focus:border-blue-500 focus:outline-none cursor-pointer"
              >
                <option value="all">All Statuses (Online & Offline)</option>
                <option value="offline">🔴 Offline Devices Only (Outages)</option>
                <option value="online">🟢 Online Devices Only</option>
              </select>
            </div>
          </div>

          {/* Report Preview Summary Banner */}
          <div className="p-3.5 bg-[#16181D] border border-[#2D3139] rounded-lg space-y-2">
            <div className="flex items-center justify-between text-xs text-gray-300 font-semibold">
              <span>Report Summary Overview:</span>
              <span className="text-emerald-400 font-mono">
                {filteredDevices.length} items to include
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-[11px]">
              <div className="p-2 rounded bg-[#1A1D24] border border-[#2D3139] text-center">
                <span className="text-gray-400 block text-[10px]">Total Devices</span>
                <span className="text-white font-bold text-sm">{filteredDevices.length}</span>
              </div>
              <div className="p-2 rounded bg-emerald-950/30 border border-emerald-500/20 text-center">
                <span className="text-emerald-400 block text-[10px]">Online</span>
                <span className="text-emerald-300 font-bold text-sm">
                  {filteredDevices.filter((d) => d.status === 'online').length}
                </span>
              </div>
              <div className="p-2 rounded bg-red-950/30 border border-red-500/20 text-center">
                <span className="text-red-400 block text-[10px]">Offline</span>
                <span className="text-red-300 font-bold text-sm">
                  {filteredDevices.filter((d) => d.status === 'offline').length}
                </span>
              </div>
            </div>
            <p className="text-[11px] text-gray-400 pt-1">
              Includes university banner, engineer authorization stamp (Mr. Zeeshan Javed), IP addresses, MAC addresses, room numbers, switch ports, and exact off-time stamps.
            </p>
          </div>

          {exportSuccess && (
            <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center space-x-2 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>PDF generated and downloaded successfully!</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#2D3139] bg-[#16181D] flex items-center justify-end space-x-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg border border-[#2D3139] text-gray-300 hover:bg-[#252830] text-xs font-medium transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting || filteredDevices.length === 0}
            className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 disabled:bg-gray-800 disabled:text-gray-500 text-white text-xs font-semibold shadow-sm transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExporting ? 'Generating PDF...' : 'Download PDF Report'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
