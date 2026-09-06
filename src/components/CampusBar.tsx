import React from 'react';
import { 
  Building2, 
  Layers, 
  Search, 
  Filter, 
  Server, 
  Router, 
  Phone, 
  Wifi, 
  Video, 
  Cable, 
  Box, 
  ShieldCheck, 
  BellRing, 
  Terminal, 
  HardDrive,
  Network,
  Cpu
} from 'lucide-react';
import { CampusId, CampusInfo, DeviceType, DeviceStatus } from '../types.ts';

interface CampusBarProps {
  campuses: CampusInfo[];
  selectedCampus: CampusId | 'ALL';
  onSelectCampus: (campus: CampusId | 'ALL') => void;
  selectedType: DeviceType | 'ALL';
  onSelectType: (type: DeviceType | 'ALL') => void;
  selectedStatus: DeviceStatus | 'ALL';
  onSelectStatus: (status: DeviceStatus | 'ALL') => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  activeTab: 'dashboard' | 'circular' | 'topology' | 'inventory' | 'fiber' | 'racks' | 'hardware' | 'security' | 'alerts' | 'diagnostics';
  onTabChange: (tab: 'dashboard' | 'circular' | 'topology' | 'inventory' | 'fiber' | 'racks' | 'hardware' | 'security' | 'alerts' | 'diagnostics') => void;
}

export const CampusBar: React.FC<CampusBarProps> = ({
  campuses,
  selectedCampus,
  onSelectCampus,
  selectedType,
  onSelectType,
  selectedStatus,
  onSelectStatus,
  searchQuery,
  onSearchChange,
  activeTab,
  onTabChange,
}) => {
  const campusTabs = [
    { id: 'ALL', label: 'All Campuses (IUB)', count: campuses.reduce((acc, c) => acc + c.totalDevices, 0) },
    { id: 'BJC', label: 'BJC Main Campus', sub: 'Baghdad-ul-Jadeed' },
    { id: 'OLD', label: 'Abbasia (Old)', sub: 'City Campus' },
    { id: 'RAILWAY', label: 'Railway Campus', sub: 'Commerce Block' },
    { id: 'RYK', label: 'RYK Sub-Campus', sub: 'Rahim Yar Khan' },
    { id: 'BWN', label: 'Bahawalnagar', sub: 'Sub-Campus' },
    { id: 'LQT', label: 'Liaquatpur', sub: 'Sub-Campus' },
  ];

  const deviceTypes: Array<{ id: DeviceType | 'ALL'; label: string; icon: any }> = [
    { id: 'ALL', label: 'All Devices', icon: Layers },
    { id: 'router', label: 'Routers', icon: Router },
    { id: 'switch', label: 'Modular Switches', icon: Server },
    { id: 'ip_phone', label: 'IP Phones (VoIP)', icon: Phone },
    { id: 'access_point', label: 'Wi-Fi 6 APs', icon: Wifi },
    { id: 'rack', label: 'Server Racks', icon: Box },
    { id: 'fiber_cable', label: 'Fiber Backbones', icon: Cable },
    { id: 'camera', label: 'CCTV Cameras', icon: Video },
  ];

  const navigationTabs = [
    { id: 'dashboard', label: 'NOC Dashboard', icon: Server },
    { id: 'circular', label: '⭕ Campus Devices (Gole Shape)', icon: Network },
    { id: 'topology', label: 'Network Topology (D3.js)', icon: Network },
    { id: 'inventory', label: 'Device Inventory & CRUD', icon: Layers },
    { id: 'fiber', label: '148-Core Fiber Backbone', icon: Cable },
    { id: 'racks', label: '42U Rack Explorer', icon: HardDrive },
    { id: 'hardware', label: 'Hardware Health', icon: Cpu },
    { id: 'security', label: 'Suricata & Wazuh SOC', icon: ShieldCheck },
    { id: 'alerts', label: 'WhatsApp & Email Alerts', icon: BellRing },
    { id: 'diagnostics', label: 'Live Diagnostics & Ping', icon: Terminal },
  ] as const;

  return (
    <div className="bg-[#16181D] border-b border-[#2D3139] text-[#E5E7EB]">
      {/* Primary Module Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-2">
        <div className="flex items-center space-x-1 overflow-x-auto pb-2 scrollbar-thin">
          {navigationTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`nav-tab-${tab.id}`}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-t-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer border-b-2 ${
                  isActive
                    ? 'bg-[#0A0B0E] text-blue-400 border-blue-500 shadow-sm'
                    : 'text-[#9CA3AF] hover:text-[#E5E7EB] hover:bg-[#1E2229] border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-[#9CA3AF]'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Campus Selector Bar */}
      <div className="bg-[#0A0B0E] border-t border-[#2D3139] py-2.5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center space-x-1.5 text-xs font-medium text-[#9CA3AF]">
              <Building2 className="w-4 h-4 text-blue-400" />
              <span className="label-tiny">CAMPUS FILTER:</span>
            </div>

            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 flex-1">
              {campusTabs.map((c) => {
                const isSelected = selectedCampus === c.id;
                return (
                  <button
                    key={c.id}
                    id={`campus-btn-${c.id}`}
                    onClick={() => onSelectCampus(c.id as CampusId | 'ALL')}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition cursor-pointer border ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-500 shadow-sm shadow-blue-950/40'
                        : 'bg-[#16181D] text-[#9CA3AF] border-[#2D3139] hover:bg-[#1E2229] hover:text-white'
                    }`}
                  >
                    <span>{c.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Secondary Filter & Search Row (shown on dashboard & inventory) */}
          {(activeTab === 'dashboard' || activeTab === 'inventory') && (
            <div className="mt-2.5 pt-2.5 border-t border-[#2D3139] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              
              {/* Device Type Filter Pills */}
              <div className="flex items-center space-x-1 overflow-x-auto pb-1 text-xs">
                {deviceTypes.map((t) => {
                  const Icon = t.icon;
                  const isSelected = selectedType === t.id;
                  return (
                    <button
                      key={t.id}
                      id={`type-filter-${t.id}`}
                      onClick={() => onSelectType(t.id)}
                      className={`flex items-center space-x-1.5 px-2.5 py-1 rounded text-xs transition cursor-pointer border ${
                        isSelected
                          ? 'bg-blue-900/30 text-blue-400 border-blue-800/60 font-semibold'
                          : 'text-[#9CA3AF] border-[#2D3139] hover:bg-[#16181D] hover:text-[#E5E7EB]'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Status and Search Box */}
              <div className="flex items-center space-x-2">
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-3.5 h-3.5 text-[#9CA3AF] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="search-device-input"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder="Search device, IP, room, rack..."
                    className="w-full pl-8 pr-3 py-1 bg-[#16181D] border border-[#2D3139] rounded-md text-xs text-[#E5E7EB] placeholder-[#9CA3AF] focus:outline-none focus:border-blue-500"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => onSearchChange('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-white text-xs cursor-pointer"
                    >
                      &times;
                    </button>
                  )}
                </div>

                <select
                  id="status-filter-select"
                  value={selectedStatus}
                  onChange={(e) => onSelectStatus(e.target.value as DeviceStatus | 'ALL')}
                  className="bg-[#16181D] border border-[#2D3139] rounded-md px-2 py-1 text-xs text-[#E5E7EB] focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="ALL">All Status</option>
                  <option value="online">Online</option>
                  <option value="offline">Offline</option>
                  <option value="warning">Warning</option>
                </select>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
};
