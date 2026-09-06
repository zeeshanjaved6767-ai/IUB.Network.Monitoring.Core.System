import React, { useState, useEffect } from 'react';
import { X, Save, Server, Network } from 'lucide-react';
import { Device, CampusId, DeviceType, DeviceStatus } from '../types.ts';

interface DeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  deviceToEdit?: Device | null;
}

export const DeviceModal: React.FC<DeviceModalProps> = ({
  isOpen,
  onClose,
  onSave,
  deviceToEdit,
}) => {
  const [name, setName] = useState('');
  const [deviceNumber, setDeviceNumber] = useState('');
  const [deviceLocation, setDeviceLocation] = useState('');
  const [type, setType] = useState<DeviceType>('switch');
  const [model, setModel] = useState('');
  const [campus, setCampus] = useState<CampusId>('BJC');
  const [building, setBuilding] = useState('');
  const [roomNo, setRoomNo] = useState('');
  const [rackId, setRackId] = useState('');
  const [ipAddress, setIpAddress] = useState('');
  const [macAddress, setMacAddress] = useState('');
  const [portsTotal, setPortsTotal] = useState(48);
  const [portsActive, setPortsActive] = useState(40);
  const [status, setStatus] = useState<DeviceStatus>('online');
  const [fiberCores, setFiberCores] = useState<number | undefined>(48);
  const [snmpCommunity, setSnmpCommunity] = useState('iub_noc_read');
  const [snmpVersion, setSnmpVersion] = useState<'v2c' | 'v3'>('v2c');
  const [notes, setNotes] = useState('');
  const [switchLocation, setSwitchLocation] = useState('');
  const [switchBuilding, setSwitchBuilding] = useState('');
  const [switchModel, setSwitchModel] = useState('');
  const [switchPort, setSwitchPort] = useState('');
  const [devicePort, setDevicePort] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (deviceToEdit) {
      setName(deviceToEdit.name);
      setDeviceNumber(deviceToEdit.deviceNumber || '');
      setDeviceLocation(deviceToEdit.deviceLocation || '');
      setType(deviceToEdit.type);
      setModel(deviceToEdit.model);
      setCampus(deviceToEdit.campus);
      setBuilding(deviceToEdit.building);
      setRoomNo(deviceToEdit.roomNo);
      setRackId(deviceToEdit.rackId);
      setIpAddress(deviceToEdit.ipAddress);
      setMacAddress(deviceToEdit.macAddress);
      setPortsTotal(deviceToEdit.portsTotal);
      setPortsActive(deviceToEdit.portsActive);
      setStatus(deviceToEdit.status);
      setFiberCores(deviceToEdit.fiberCores);
      setSnmpCommunity(deviceToEdit.snmpCommunity);
      setSnmpVersion(deviceToEdit.snmpVersion);
      setNotes(deviceToEdit.notes || '');
      setSwitchLocation(deviceToEdit.switchLocation || '');
      setSwitchBuilding(deviceToEdit.switchBuilding || '');
      setSwitchModel(deviceToEdit.switchModel || '');
      setSwitchPort(deviceToEdit.switchPort || '');
      setDevicePort(deviceToEdit.devicePort || '');
    } else {
      // Default new device template
      setName('');
      setDeviceNumber(`DEV-IUB-${Math.floor(1000 + Math.random() * 9000)}`);
      setDeviceLocation('Ground Floor, Main Lab / Corridor');
      setType('switch');
      setModel('Cisco Catalyst 9300 Modular Switch');
      setCampus('BJC');
      setBuilding('Faculty of Computing / CS & IT');
      setRoomNo('Server Room 102');
      setRackId('RACK-42U-CS-01');
      setIpAddress('10.10.12.25');
      setMacAddress('00:50:56:B2:77:88');
      setPortsTotal(48);
      setPortsActive(42);
      setStatus('online');
      setFiberCores(48);
      setSnmpCommunity('iub_noc_read');
      setSnmpVersion('v2c');
      setNotes('');
      setSwitchLocation('MDF Server Room 102, Rack A01');
      setSwitchBuilding('Faculty of Computing / CS & IT');
      setSwitchModel('Cisco Catalyst 9300 48-Port Modular Switch');
      setSwitchPort('GigabitEthernet1/0/24');
      setDevicePort('Uplink Port 1 / Eth0');
    }
    setError('');
  }, [deviceToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !ipAddress.trim() || !building.trim() || !roomNo.trim()) {
      setError('Please fill in all mandatory fields (Name, IP, Building, Room).');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await onSave({
        name: name.trim(),
        deviceNumber: deviceNumber.trim(),
        deviceLocation: deviceLocation.trim(),
        type,
        model: model.trim(),
        campus,
        building: building.trim(),
        roomNo: roomNo.trim(),
        rackId: rackId.trim() || 'RACK-GEN-01',
        ipAddress: ipAddress.trim(),
        macAddress: macAddress.trim() || '00:00:00:00:00:00',
        portsTotal: Number(portsTotal),
        portsActive: Number(portsActive),
        status,
        fiberCores: fiberCores ? Number(fiberCores) : undefined,
        snmpCommunity,
        snmpVersion,
        notes: notes.trim(),
        switchLocation: switchLocation.trim(),
        switchBuilding: switchBuilding.trim(),
        switchModel: switchModel.trim(),
        switchPort: switchPort.trim(),
        devicePort: devicePort.trim(),
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save device');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-[#0A0B0E] border border-[#2D3139] rounded-xl shadow-2xl text-[#E5E7EB] overflow-hidden my-8">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#2D3139] flex items-center justify-between bg-[#16181D]">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-[#0A0B0E] border border-[#2D3139] text-blue-400">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                {deviceToEdit ? `Edit Equipment: ${deviceToEdit.name}` : 'Provision New Network Equipment'}
              </h3>
              <p className="text-xs text-[#9CA3AF] mt-0.5">
                IUB Network Operations Center &bull; Database & Google Sheets Synchronizer
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#9CA3AF] hover:text-white hover:bg-[#1E2229] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto bg-[#0A0B0E]">
          {error && (
            <div className="p-3 bg-red-950/40 border border-red-500/40 rounded-lg text-xs text-red-400">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Device Name */}
            <div>
              <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">Device Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. BJC-CS-SW-48P"
                required
                className="w-full px-3 py-2 bg-[#16181D] border border-[#2D3139] rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Device Number */}
            <div>
              <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">Device Number (Device ID / Asset #)</label>
              <input
                type="text"
                value={deviceNumber}
                onChange={(e) => setDeviceNumber(e.target.value)}
                placeholder="e.g. DEV-BJC-1042 / IUB-ASSET-09"
                className="w-full px-3 py-2 bg-[#16181D] border border-[#2D3139] rounded-lg text-xs font-mono text-cyan-400 placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Device Type */}
            <div>
              <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">Equipment Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as DeviceType)}
                className="w-full px-3 py-2 bg-[#16181D] border border-[#2D3139] rounded-lg text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="switch">Modular Switch</option>
                <option value="router">Router / Gateway</option>
                <option value="access_point">Access Point (Wi-Fi 6)</option>
                <option value="ip_phone">IP Phone (VoIP PBX)</option>
                <option value="rack">Server / Network Rack (42U/24U)</option>
                <option value="fiber_cable">Fiber Backbone ODF</option>
                <option value="camera">CCTV Security Camera</option>
              </select>
            </div>

            {/* Hardware Model */}
            <div>
              <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">Hardware Model</label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="e.g. Cisco Catalyst 9600 Modular Switch"
                className="w-full px-3 py-2 bg-[#16181D] border border-[#2D3139] rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Campus Selection */}
            <div>
              <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">IUB Campus *</label>
              <select
                value={campus}
                onChange={(e) => setCampus(e.target.value as CampusId)}
                className="w-full px-3 py-2 bg-[#16181D] border border-[#2D3139] rounded-lg text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer font-medium"
              >
                <option value="BJC">Baghdad-ul-Jadeed Campus (BJC Main)</option>
                <option value="OLD">Abbasia (Old) Campus</option>
                <option value="RAILWAY">Railway Campus</option>
                <option value="RYK">Rahim Yar Khan Sub-Campus (RYK)</option>
                <option value="BWN">Bahawalnagar Sub-Campus</option>
                <option value="LQT">Liaquatpur Sub-Campus</option>
              </select>
            </div>

            {/* Building Name */}
            <div>
              <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">Building Name *</label>
              <input
                type="text"
                value={building}
                onChange={(e) => setBuilding(e.target.value)}
                placeholder="e.g. Computer Science & IT"
                required
                className="w-full px-3 py-2 bg-[#16181D] border border-[#2D3139] rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Room Number */}
            <div>
              <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">Room Number *</label>
              <input
                type="text"
                value={roomNo}
                onChange={(e) => setRoomNo(e.target.value)}
                placeholder="e.g. Room 102 / NOC Closet"
                required
                className="w-full px-3 py-2 bg-[#16181D] border border-[#2D3139] rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Device Location */}
            <div>
              <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">Device Location (Physical Spot / Desk / Lab)</label>
              <input
                type="text"
                value={deviceLocation}
                onChange={(e) => setDeviceLocation(e.target.value)}
                placeholder="e.g. 1st Floor, CS Lab 3, Corner Table"
                className="w-full px-3 py-2 bg-[#16181D] border border-[#2D3139] rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Rack ID */}
            <div>
              <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">Rack ID</label>
              <input
                type="text"
                value={rackId}
                onChange={(e) => setRackId(e.target.value)}
                placeholder="e.g. RACK-42U-CS-01"
                className="w-full px-3 py-2 bg-[#16181D] border border-[#2D3139] rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* IP Address */}
            <div>
              <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">IPv4 Management IP *</label>
              <input
                type="text"
                value={ipAddress}
                onChange={(e) => setIpAddress(e.target.value)}
                placeholder="e.g. 10.10.12.1"
                required
                className="w-full px-3 py-2 bg-[#16181D] border border-[#2D3139] rounded-lg text-xs font-mono text-emerald-400 placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* MAC Address */}
            <div>
              <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">MAC Address</label>
              <input
                type="text"
                value={macAddress}
                onChange={(e) => setMacAddress(e.target.value)}
                placeholder="e.g. 00:45:53:7A:B1:01"
                className="w-full px-3 py-2 bg-[#16181D] border border-[#2D3139] rounded-lg text-xs font-mono text-[#E5E7EB] placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Total Ports */}
            <div>
              <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">Total Ports / Capacity</label>
              <select
                value={portsTotal}
                onChange={(e) => setPortsTotal(Number(e.target.value))}
                className="w-full px-3 py-2 bg-[#16181D] border border-[#2D3139] rounded-lg text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value={148}>148 Ports (Modular High-Density Core)</option>
                <option value={96}>96 Ports (Distribution Layer)</option>
                <option value={48}>48 Ports (Access / PoE+)</option>
                <option value={24}>24 Ports (Sub-Campus Switch)</option>
                <option value={12}>12 Ports (Gateway / Compact)</option>
                <option value={42}>42U (Full Height Server Rack)</option>
                <option value={2}>2 Ports (IP Phone / AP Uplink)</option>
                <option value={1}>1 Port (CCTV Camera)</option>
              </select>
            </div>

            {/* Fiber Cores */}
            <div>
              <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">Fiber Core Capacity (Backbone)</label>
              <select
                value={fiberCores || 0}
                onChange={(e) => setFiberCores(Number(e.target.value) || undefined)}
                className="w-full px-3 py-2 bg-[#16181D] border border-[#2D3139] rounded-lg text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value={0}>None (Standard Copper)</option>
                <option value={148}>148 Cores (Corning Core Backbone)</option>
                <option value={96}>96 Cores (Metro Inter-Campus Link)</option>
                <option value={48}>48 Cores (Campus Ring Loop)</option>
                <option value={24}>24 Cores (Departmental Trunk)</option>
                <option value={12}>12 Cores (Branch Uplink)</option>
              </select>
            </div>

            {/* SNMP Community */}
            <div>
              <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">SNMP Community / String</label>
              <input
                type="text"
                value={snmpCommunity}
                onChange={(e) => setSnmpCommunity(e.target.value)}
                className="w-full px-3 py-2 bg-[#16181D] border border-[#2D3139] rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Upstream Switch & Port Connection Mapping */}
            <div className="md:col-span-2 pt-3 mt-1 border-t border-[#2D3139]">
              <div className="flex items-center space-x-2 mb-3">
                <div className="p-1.5 rounded-lg bg-[#16181D] border border-[#2D3139] text-blue-400">
                  <Network className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white tracking-wide uppercase">
                    Connected Switch & Port Uplink Mapping
                  </h4>
                  <p className="text-[11px] text-[#9CA3AF]">
                    Specify the upstream switch physical location, switch building name, hardware model, switch port, and device port.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 bg-[#16181D]/60 p-3.5 rounded-lg border border-[#2D3139]">
                {/* Switch Location */}
                <div>
                  <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">
                    Switch Location
                  </label>
                  <input
                    type="text"
                    value={switchLocation}
                    onChange={(e) => setSwitchLocation(e.target.value)}
                    placeholder="e.g. Server Room 102, MDF Rack A01"
                    className="w-full px-3 py-2 bg-[#0A0B0E] border border-[#2D3139] rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Switch Building Name */}
                <div>
                  <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">
                    Switch Building Name
                  </label>
                  <input
                    type="text"
                    value={switchBuilding}
                    onChange={(e) => setSwitchBuilding(e.target.value)}
                    placeholder="e.g. Faculty of Computing / CS & IT"
                    className="w-full px-3 py-2 bg-[#0A0B0E] border border-[#2D3139] rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Switch Model */}
                <div>
                  <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">
                    Switch Model
                  </label>
                  <input
                    type="text"
                    value={switchModel}
                    onChange={(e) => setSwitchModel(e.target.value)}
                    placeholder="e.g. Cisco Catalyst 9300-48P"
                    className="w-full px-3 py-2 bg-[#0A0B0E] border border-[#2D3139] rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Switch Port */}
                <div>
                  <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">
                    Switch Port
                  </label>
                  <input
                    type="text"
                    value={switchPort}
                    onChange={(e) => setSwitchPort(e.target.value)}
                    placeholder="e.g. GigabitEthernet1/0/24 or Port 14"
                    className="w-full px-3 py-2 bg-[#0A0B0E] border border-[#2D3139] rounded-lg text-xs font-mono text-emerald-400 placeholder-gray-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Device Port */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">
                    Device Port (Device Interface / Uplink)
                  </label>
                  <input
                    type="text"
                    value={devicePort}
                    onChange={(e) => setDevicePort(e.target.value)}
                    placeholder="e.g. Eth0 / Uplink Port 1 / LAN1"
                    className="w-full px-3 py-2 bg-[#0A0B0E] border border-[#2D3139] rounded-lg text-xs font-mono text-cyan-400 placeholder-gray-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">Operational Notes / VLAN Info</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="e.g. Connected to PERN Upstream, feeds AI research labs 1 to 4..."
              className="w-full px-3 py-2 bg-[#16181D] border border-[#2D3139] rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-[#2D3139] flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-[#16181D] hover:bg-[#1E2229] border border-[#2D3139] text-[#9CA3AF] text-xs font-medium transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-950/40 transition cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Saving...' : deviceToEdit ? 'Save Changes' : 'Provision Equipment'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
