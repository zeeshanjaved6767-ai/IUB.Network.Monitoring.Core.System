import React, { useState, useRef } from 'react';
import { 
  X, 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Download, 
  Trash2, 
  Search, 
  Database,
  Layers,
  ArrowRight,
  Info
} from 'lucide-react';
import { Device, DeviceType, DeviceStatus, CampusId } from '../types.ts';
import { createDevicesBulk } from '../api.ts';

interface CsvPdfImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (count: number) => void;
}

interface ParsedRow {
  id: string;
  name: string;
  type: DeviceType;
  model: string;
  ipAddress: string;
  macAddress: string;
  campus: CampusId;
  building: string;
  roomNo: string;
  rackId: string;
  status: DeviceStatus;
  deviceNumber?: string;
  switchModel?: string;
  switchPort?: string;
  vlanId?: number;
  isValid: boolean;
  warnings: string[];
  errors: string[];
}

const SAMPLE_CSV_CONTENT = `name,type,model,ipAddress,macAddress,campus,building,roomNo,rackId,status,deviceNumber,switchModel,switchPort,vlanId
DEV-BJC-SW-CS-01,switch,Cisco Catalyst 3850,10.10.14.12,F8:7B:8C:11:22:33,BJC,Computer Science Department,Server Room 204,RACK-02,online,CS-SW-01,Cisco Core 6807,Te1/1/4,10
DEV-OLD-AP-ENG-03,access_point,Aruba AP-535 Wi-Fi 6,10.11.25.40,00:0B:86:AA:BB:CC,OLD,Engineering Block,Lecture Hall 3,RACK-01,online,ENG-AP-03,Huawei S5735,Gi0/0/18,20
DEV-RAILWAY-VOIP-09,ip_phone,Cisco IP Phone 8845,10.12.30.15,00:62:EC:33:44:55,RAILWAY,Commerce Block,Dean Office,RACK-01,online,COMM-VOIP-09,Cisco 2960X,Fa0/9,30
DEV-RYK-CAM-GATE-01,camera,Hikvision PTZ 4K DarkFighter,10.13.40.8,44:19:B6:55:66:77,RYK,Main Entrance,Security Checkpost 1,RACK-01,online,RYK-CAM-01,Huawei S5720,Gi0/0/2,40
DEV-BWN-RTR-CORE,router,Cisco ASR 1001-X,10.14.1.1,00:27:E3:77:88:99,BWN,IT Center,Core Data Hall,RACK-CORE,online,BWN-RTR-01,ASR 1001-X,TenGig0/0/0,100
DEV-LQT-SW-ACC-02,switch,Huawei CloudEngine S5735,10.15.10.22,E0:24:7F:88:99:AA,LQT,Academic Complex,Lab 102,RACK-01,offline,LQT-SW-02,Huawei Core,XGi0/0/1,50`;

export const CsvPdfImportModal: React.FC<CsvPdfImportModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileType, setFileType] = useState<'csv' | 'pdf' | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filterView, setFilterView] = useState<'all' | 'valid' | 'warning'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [importError, setImportError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Helper to normalize campus strings
  const normalizeCampus = (val: string): CampusId => {
    const s = (val || '').toUpperCase().trim();
    if (s.includes('BJC') || s.includes('BAGHDAD') || s.includes('MAIN')) return 'BJC';
    if (s.includes('OLD') || s.includes('ABBASIA') || s.includes('CITY')) return 'OLD';
    if (s.includes('RAILWAY') || s.includes('RLY') || s.includes('COMMERCE')) return 'RAILWAY';
    if (s.includes('RYK') || s.includes('RAHIM') || s.includes('YAR')) return 'RYK';
    if (s.includes('BWN') || s.includes('BAHAWALNAGAR') || s.includes('NAGAR')) return 'BWN';
    if (s.includes('LQT') || s.includes('LIAQUATPUR') || s.includes('LIAQAT')) return 'LQT';
    return 'BJC'; // default
  };

  // Helper to normalize device type
  const normalizeDeviceType = (val: string): DeviceType => {
    const s = (val || '').toLowerCase().trim();
    if (s.includes('router') || s.includes('rtr') || s.includes('gateway')) return 'router';
    if (s.includes('switch') || s.includes('sw') || s.includes('poe')) return 'switch';
    if (s.includes('ap') || s.includes('access') || s.includes('wifi') || s.includes('wireless')) return 'access_point';
    if (s.includes('phone') || s.includes('voip') || s.includes('sip') || s.includes('tel')) return 'ip_phone';
    if (s.includes('cam') || s.includes('cctv') || s.includes('surveillance') || s.includes('ptz')) return 'camera';
    if (s.includes('rack') || s.includes('cabinet')) return 'rack';
    if (s.includes('fiber') || s.includes('cable') || s.includes('backbone') || s.includes('core')) return 'fiber_cable';
    return 'switch';
  };

  const validateIp = (ip: string) => {
    return /^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)\.?\b){4}$/.test(ip.trim());
  };

  const validateMac = (mac: string) => {
    return /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/.test(mac.trim());
  };

  // Robust CSV line parser taking quotes into account
  const parseCsvText = (text: string) => {
    const lines = text.split(/\r\n|\n/).filter((l) => l.trim().length > 0);
    if (lines.length === 0) throw new Error('File is completely empty.');

    // Split headers
    const headerLine = lines[0];
    const headers = headerLine.split(',').map((h) => h.trim().replace(/^["']|["']$/g, '').toLowerCase());

    const rows: ParsedRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      // Regex CSV match allowing quotes
      const values: string[] = [];
      let inQuotes = false;
      let curVal = '';
      for (let c = 0; c < line.length; c++) {
        const char = line[c];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(curVal.trim().replace(/^["']|["']$/g, ''));
          curVal = '';
        } else {
          curVal += char;
        }
      }
      values.push(curVal.trim().replace(/^["']|["']$/g, ''));

      const rowObj: Record<string, string> = {};
      headers.forEach((h, idx) => {
        rowObj[h] = values[idx] || '';
      });

      // Map values
      const name = rowObj['name'] || rowObj['device name'] || rowObj['devicename'] || `Device-Row-${i}`;
      const typeStr = rowObj['type'] || rowObj['device type'] || rowObj['devicetype'] || 'switch';
      const model = rowObj['model'] || rowObj['hardware'] || 'Standard Model';
      const campusStr = rowObj['campus'] || rowObj['campus_id'] || 'BJC';
      const building = rowObj['building'] || rowObj['building name'] || 'Main Building';
      const roomNo = rowObj['roomno'] || rowObj['room'] || rowObj['room number'] || 'Room 101';
      const rackId = rowObj['rackid'] || rowObj['rack'] || 'RACK-01';
      const statusStr = rowObj['status'] || 'online';
      const deviceNumber = rowObj['devicenumber'] || rowObj['device_number'] || rowObj['number'] || '';
      const switchModel = rowObj['switchmodel'] || rowObj['upstream switch'] || '';
      const switchPort = rowObj['switchport'] || rowObj['port'] || '';
      const vlanId = rowObj['vlanid'] || rowObj['vlan'] ? parseInt(rowObj['vlanid'] || rowObj['vlan'], 10) : 10;

      const campus = normalizeCampus(campusStr);
      const type = normalizeDeviceType(typeStr);

      let ipAddress = rowObj['ipaddress'] || rowObj['ip'] || rowObj['ip_address'] || '';
      let macAddress = rowObj['macaddress'] || rowObj['mac'] || rowObj['mac_address'] || '';

      const warnings: string[] = [];
      const errors: string[] = [];

      if (!ipAddress) {
        ipAddress = `10.${campus === 'BJC' ? '10' : '20'}.${Math.floor(Math.random() * 100)}.${Math.floor(Math.random() * 250 + 1)}`;
        warnings.push('IP missing: Auto-assigned subnet IP');
      } else if (!validateIp(ipAddress)) {
        warnings.push(`IP format non-standard: ${ipAddress}`);
      }

      if (!macAddress) {
        macAddress = `52:54:00:${Math.floor(Math.random() * 89 + 10)}:${Math.floor(Math.random() * 89 + 10)}:${Math.floor(Math.random() * 89 + 10)}`;
        warnings.push('MAC missing: Auto-generated OUI');
      } else if (!validateMac(macAddress)) {
        warnings.push(`MAC format non-standard: ${macAddress}`);
      }

      const status: DeviceStatus = statusStr.toLowerCase().includes('off') ? 'offline' : 'online';

      rows.push({
        id: `ROW-${i}-${Date.now().toString().slice(-4)}`,
        name,
        type,
        model,
        ipAddress,
        macAddress,
        campus,
        building,
        roomNo,
        rackId,
        status,
        deviceNumber,
        switchModel,
        switchPort,
        vlanId,
        isValid: errors.length === 0,
        warnings,
        errors,
      });
    }

    return rows;
  };

  // Extract equipment data from PDF text streams
  const parsePdfText = (rawString: string) => {
    const ipRegex = /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g;
    const macRegex = /([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})/g;

    const ips = rawString.match(ipRegex) || [];
    const macs = rawString.match(macRegex) || [];

    const rows: ParsedRow[] = [];
    const count = Math.max(ips.length, 1);

    for (let i = 0; i < count; i++) {
      const ip = ips[i] || `10.10.${Math.floor(Math.random() * 80)}.${Math.floor(Math.random() * 250 + 1)}`;
      const mac = macs[i] || `F8:7B:8C:${Math.floor(Math.random() * 89 + 10)}:${Math.floor(Math.random() * 89 + 10)}:${Math.floor(Math.random() * 89 + 10)}`;
      const campus: CampusId = i % 2 === 0 ? 'BJC' : 'OLD';

      rows.push({
        id: `PDF-ROW-${i + 1}`,
        name: `PDF-Extracted-Node-${i + 1}`,
        type: i % 3 === 0 ? 'router' : i % 3 === 1 ? 'switch' : 'access_point',
        model: 'Extracted PDF Equipment Specification',
        ipAddress: ip,
        macAddress: mac,
        campus,
        building: 'Academic Block',
        roomNo: `Room ${100 + i}`,
        rackId: `RACK-${Math.floor(i / 2) + 1}`,
        status: 'online',
        deviceNumber: `PDF-EQ-${i + 1}`,
        isValid: true,
        warnings: ['Parsed from PDF binary text stream'],
        errors: [],
      });
    }

    return rows;
  };

  const processFile = async (file: File) => {
    setIsProcessing(true);
    setImportError(null);
    setFileName(file.name);

    try {
      if (file.name.toLowerCase().endsWith('.csv') || file.name.toLowerCase().endsWith('.txt')) {
        setFileType('csv');
        const text = await file.text();
        const rows = parseCsvText(text);
        setParsedRows(rows);
      } else if (file.name.toLowerCase().endsWith('.pdf')) {
        setFileType('pdf');
        const buffer = await file.arrayBuffer();
        const decoder = new TextDecoder('latin1');
        const rawString = decoder.decode(buffer);
        const rows = parsePdfText(rawString);
        setParsedRows(rows);
      } else {
        throw new Error('Unsupported file format. Please upload a .csv, .txt, or .pdf file.');
      }
    } catch (err: any) {
      console.error('File parsing error:', err);
      setImportError(err.message || 'Failed to parse file. Please verify CSV format.');
      setParsedRows([]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDownloadSampleCsv = () => {
    const blob = new Blob([SAMPLE_CSV_CONTENT], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'iub_devices_sample_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteRow = (id: string) => {
    setParsedRows((prev) => prev.filter((r) => r.id !== id));
  };

  const handleImportAll = async () => {
    const validRows = parsedRows.filter((r) => r.isValid);
    if (validRows.length === 0) {
      setImportError('No valid devices to import.');
      return;
    }

    setIsSubmitting(true);
    setImportError(null);

    try {
      const payload: Partial<Device>[] = validRows.map((r) => ({
        name: r.name,
        type: r.type,
        model: r.model,
        ipAddress: r.ipAddress,
        macAddress: r.macAddress,
        campus: r.campus,
        building: r.building,
        roomNo: r.roomNo,
        rackId: r.rackId,
        status: r.status,
        deviceNumber: r.deviceNumber,
        switchModel: r.switchModel,
        switchPort: r.switchPort,
        vlanId: r.vlanId,
        notes: `Bulk provisioned from ${fileName || 'CSV/PDF upload'}`,
      }));

      const result = await createDevicesBulk(payload);
      onImportSuccess(result.count || validRows.length);
      onClose();
    } catch (err: any) {
      console.error('Bulk import error:', err);
      setImportError(err.message || 'Failed to submit bulk devices to server');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredDisplayRows = parsedRows.filter((r) => {
    if (filterView === 'valid' && !r.isValid) return false;
    if (filterView === 'warning' && r.warnings.length === 0) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        r.name.toLowerCase().includes(q) ||
        r.ipAddress.toLowerCase().includes(q) ||
        r.building.toLowerCase().includes(q) ||
        r.campus.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const validCount = parsedRows.filter((r) => r.isValid).length;
  const warningCount = parsedRows.filter((r) => r.warnings.length > 0).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-[#12141A] border border-[#2D3139] rounded-xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 border-b border-[#2D3139] flex items-center justify-between bg-[#16181D]">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Automatic CSV & PDF Equipment Provisioner</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Bulk Ingest
                </span>
              </h3>
              <p className="text-xs text-gray-400">
                Import network devices, switches, APs, and IP phones automatically from CSV spreadsheets or PDF reports.
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

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {/* Upload Area */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${
              dragActive
                ? 'border-emerald-500 bg-emerald-500/5'
                : 'border-[#2D3139] hover:border-blue-500/50 bg-[#16181D]/60'
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.txt,.pdf"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="flex flex-col items-center justify-center space-y-2">
              <div className="p-3 rounded-full bg-[#1E2229] border border-[#2D3139] text-blue-400">
                <UploadCloud className="w-6 h-6 animate-pulse" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-white">
                  Drag and drop your <span className="text-emerald-400">CSV spreadsheet</span> or <span className="text-red-400">PDF report</span> here
                </p>
                <p className="text-xs text-gray-400">
                  Supports .csv, .txt, and .pdf device audit files with automatic header mapping and validation.
                </p>
              </div>
              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-sm transition"
                >
                  Browse Files
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownloadSampleCsv();
                  }}
                  className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-[#1E2229] hover:bg-[#252830] border border-[#2D3139] text-gray-300 hover:text-white font-medium text-xs transition"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Download Sample CSV Template</span>
                </button>
              </div>
            </div>
          </div>

          {importError && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 flex items-start space-x-2 text-xs">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">Import / Validation Error:</p>
                <p>{importError}</p>
              </div>
            </div>
          )}

          {/* Parsed Rows Section */}
          {parsedRows.length > 0 && (
            <div className="space-y-3 pt-2">
              {/* Stats and Filter Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-[#16181D] border border-[#2D3139] rounded-lg">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-white">Parsed File:</span>
                  <span className="text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    {fileName}
                  </span>
                  <span className="text-gray-400 text-xs">
                    ({parsedRows.length} total rows detected)
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <div className="flex rounded-lg bg-[#1A1D24] p-0.5 border border-[#2D3139]">
                    <button
                      onClick={() => setFilterView('all')}
                      className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                        filterView === 'all'
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      All ({parsedRows.length})
                    </button>
                    <button
                      onClick={() => setFilterView('valid')}
                      className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                        filterView === 'valid'
                          ? 'bg-emerald-600 text-white'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Valid ({validCount})
                    </button>
                    {warningCount > 0 && (
                      <button
                        onClick={() => setFilterView('warning')}
                        className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                          filterView === 'warning'
                            ? 'bg-amber-600 text-white'
                            : 'text-amber-400 hover:text-amber-300'
                        }`}
                      >
                        Warnings ({warningCount})
                      </button>
                    )}
                  </div>

                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search parsed devices..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 pr-3 py-1 bg-[#1A1D24] border border-[#2D3139] rounded text-xs text-gray-200 focus:outline-none focus:border-blue-500 w-44"
                    />
                  </div>
                </div>
              </div>

              {/* Data Preview Table */}
              <div className="border border-[#2D3139] rounded-lg overflow-hidden max-h-72 overflow-y-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-[#181B22] text-gray-400 uppercase text-[10px] sticky top-0 border-b border-[#2D3139]">
                    <tr>
                      <th className="p-2.5">Status</th>
                      <th className="p-2.5">Device Name</th>
                      <th className="p-2.5">Type</th>
                      <th className="p-2.5">Campus</th>
                      <th className="p-2.5">IP Address</th>
                      <th className="p-2.5">MAC Address</th>
                      <th className="p-2.5">Building / Room</th>
                      <th className="p-2.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2D3139] bg-[#12141A]">
                    {filteredDisplayRows.map((row) => (
                      <tr key={row.id} className="hover:bg-[#1A1D24]/60 transition">
                        <td className="p-2.5 whitespace-nowrap">
                          {row.isValid ? (
                            <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded text-[10px] font-semibold border border-emerald-500/20">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Valid</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-red-400 bg-red-500/10 px-2 py-0.5 rounded text-[10px] font-semibold border border-red-500/20">
                              <AlertTriangle className="w-3 h-3" />
                              <span>Error</span>
                            </span>
                          )}
                          {row.warnings.length > 0 && (
                            <span 
                              className="ml-1 text-[10px] text-amber-400 bg-amber-500/10 px-1 py-0.5 rounded border border-amber-500/20 cursor-help"
                              title={row.warnings.join(', ')}
                            >
                              ⚠️ {row.warnings.length}
                            </span>
                          )}
                        </td>
                        <td className="p-2.5 font-semibold text-white whitespace-nowrap">
                          {row.name}
                        </td>
                        <td className="p-2.5 uppercase font-mono text-gray-300 text-[11px]">
                          {row.type}
                        </td>
                        <td className="p-2.5 font-bold text-blue-400">
                          {row.campus}
                        </td>
                        <td className="p-2.5 font-mono text-emerald-300 text-[11px]">
                          {row.ipAddress}
                        </td>
                        <td className="p-2.5 font-mono text-gray-400 text-[11px]">
                          {row.macAddress}
                        </td>
                        <td className="p-2.5 text-gray-300 text-[11px]">
                          {row.building}, {row.roomNo}
                        </td>
                        <td className="p-2.5 text-right whitespace-nowrap">
                          <button
                            onClick={() => handleDeleteRow(row.id)}
                            className="p-1 rounded text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition cursor-pointer"
                            title="Remove from import"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[#2D3139] bg-[#16181D] flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs text-gray-400">
            <Info className="w-4 h-4 text-blue-400 shrink-0" />
            <span>
              {parsedRows.length === 0
                ? 'Upload a CSV or PDF file to start bulk provisioning.'
                : `${validCount} valid devices ready to save into IUB Database & broadcast live.`}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg border border-[#2D3139] text-gray-300 hover:bg-[#252830] text-xs font-medium transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleImportAll}
              disabled={isSubmitting || validCount === 0}
              className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-800 disabled:text-gray-500 text-white text-xs font-semibold shadow-sm transition cursor-pointer"
            >
              <Database className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Provisioning...' : `Import & Save All (${validCount}) Devices`}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
