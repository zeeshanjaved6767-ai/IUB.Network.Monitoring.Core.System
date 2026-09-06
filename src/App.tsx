import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header.tsx';
import { CampusBar } from './components/CampusBar.tsx';
import { NocSummary } from './components/NocSummary.tsx';
import { DeviceCard } from './components/DeviceCard.tsx';
import { DeviceTable } from './components/DeviceTable.tsx';
import { DeviceModal } from './components/DeviceModal.tsx';
import { FiberManager } from './components/FiberManager.tsx';
import { RackViewer } from './components/RackViewer.tsx';
import { SecurityCenter } from './components/SecurityCenter.tsx';
import { AlertCenter } from './components/AlertCenter.tsx';
import { DiagnosticModal } from './components/DiagnosticModal.tsx';
import { GoogleSheetsModal } from './components/GoogleSheetsModal.tsx';
import { NocChatbot } from './components/NocChatbot.tsx';
import { HistoricalChartsModal } from './components/HistoricalChartsModal.tsx';
import { CollectorAgentModal } from './components/CollectorAgentModal.tsx';
import { WhatsAppGroupModal } from './components/WhatsAppGroupModal.tsx';
import { NetworkTopology } from './components/NetworkTopology.tsx';
import { HardwareHealth } from './components/HardwareHealth.tsx';
import { CampusCircularGraphic } from './components/CampusCircularGraphic.tsx';
import { ThemeModal } from './components/ThemeModal.tsx';
import { useWebSocket } from './useWebSocket.ts';

import { 
  CampusId, 
  CampusInfo, 
  Device, 
  DeviceType, 
  DeviceStatus, 
  FiberLink, 
  SecurityEvent, 
  AlertNotification, 
  AlertRule,
  SystemEngineMetrics,
  ThemeConfig 
} from './types.ts';
import { DEFAULT_THEME, applyThemeToDocument } from './themes.ts';

import { 
  fetchCampuses, 
  fetchDevices, 
  createDevice, 
  updateDevice, 
  deleteDevice, 
  toggleDevicePower, 
  fetchFiberLinks, 
  updateFiberCore, 
  fetchSecurityEvents, 
  fetchAlerts, 
  dispatchAlert, 
  resolveAlert, 
  fetchAlertRules,
  createAlertRule,
  updateAlertRule,
  deleteAlertRule,
  toggleAlertRule,
  fetchSystemMetrics,
  resetDatabase
} from './api.ts';

import { CheckCircle2, RotateCcw, Plus, Terminal, Radio, AlertTriangle, Bot, Sparkles, Server, Activity, Download, Users, Network, Palette } from 'lucide-react';

export default function App() {
  const [campuses, setCampuses] = useState<CampusInfo[]>(() => {
    try {
      const cached = localStorage.getItem('iub_cached_campuses');
      if (cached) return JSON.parse(cached);
    } catch {}
    return [];
  });
  const [devices, setDevices] = useState<Device[]>(() => {
    try {
      const cached = localStorage.getItem('iub_cached_devices');
      if (cached) return JSON.parse(cached);
    } catch {}
    return [];
  });
  const [fiberLinks, setFiberLinks] = useState<FiberLink[]>([]);
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [alerts, setAlerts] = useState<AlertNotification[]>([]);
  const [alertRules, setAlertRules] = useState<AlertRule[]>([]);
  const [metrics, setMetrics] = useState<SystemEngineMetrics | null>(null);

  // Navigation & Filtering
  const [activeTab, setActiveTab] = useState<'dashboard' | 'circular' | 'topology' | 'inventory' | 'fiber' | 'racks' | 'hardware' | 'security' | 'alerts' | 'diagnostics'>('dashboard');
  const [selectedCampus, setSelectedCampus] = useState<CampusId | 'ALL'>('ALL');
  const [selectedType, setSelectedType] = useState<DeviceType | 'ALL'>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<DeviceStatus | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deviceToEdit, setDeviceToEdit] = useState<Device | null>(null);
  const [diagnosticDevice, setDiagnosticDevice] = useState<Device | null>(null);
  const [historyDevice, setHistoryDevice] = useState<Device | null>(null);
  const [isCollectorModalOpen, setIsCollectorModalOpen] = useState(false);
  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState(false);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [chatbotInitialPrompt, setChatbotInitialPrompt] = useState<string | undefined>(undefined);
  const [isWhatsAppGroupModalOpen, setIsWhatsAppGroupModalOpen] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);

  const handleOpenChatWithQuery = (prompt: string) => {
    setChatbotInitialPrompt(prompt);
    setIsChatbotOpen(true);
  };

  // Dynamic Theme state with persistent localStorage
  const [theme, setTheme] = useState<ThemeConfig>(() => {
    try {
      const saved = localStorage.getItem('iub_noc_theme');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse saved theme', e);
    }
    return DEFAULT_THEME;
  });

  useEffect(() => {
    applyThemeToDocument(theme);
    try {
      localStorage.setItem('iub_noc_theme', JSON.stringify(theme));
    } catch (e) {
      console.error('Failed to save theme', e);
    }
  }, [theme]);

  // UI state
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [notificationToast, setNotificationToast] = useState<{ message: string; type?: 'info' | 'critical' | 'success' } | null>(null);

  const showToast = (message: string, type: 'info' | 'critical' | 'success' = 'info') => {
    setNotificationToast({ message, type });
    setTimeout(() => setNotificationToast(null), 5000);
  };

  const loadAllData = useCallback(async (silent = false) => {
    if (!silent) setIsRefreshing(true);
    try {
      const [
        campusesRes,
        devicesRes,
        fiberRes,
        secRes,
        alertsRes,
        rulesRes,
        metricsRes,
      ] = await Promise.allSettled([
        fetchCampuses(),
        fetchDevices(),
        fetchFiberLinks(),
        fetchSecurityEvents(),
        fetchAlerts(),
        fetchAlertRules(),
        fetchSystemMetrics(),
      ]);

      if (campusesRes.status === 'fulfilled' && Array.isArray(campusesRes.value) && campusesRes.value.length > 0) {
        setCampuses(campusesRes.value);
        try {
          localStorage.setItem('iub_cached_campuses', JSON.stringify(campusesRes.value));
        } catch {}
      }

      if (devicesRes.status === 'fulfilled' && Array.isArray(devicesRes.value) && devicesRes.value.length > 0) {
        setDevices(devicesRes.value);
        try {
          localStorage.setItem('iub_cached_devices', JSON.stringify(devicesRes.value));
        } catch {}
      }

      if (fiberRes.status === 'fulfilled' && Array.isArray(fiberRes.value)) {
        setFiberLinks(fiberRes.value);
      }
      if (secRes.status === 'fulfilled' && Array.isArray(secRes.value)) {
        setSecurityEvents(secRes.value);
      }
      if (alertsRes.status === 'fulfilled' && Array.isArray(alertsRes.value)) {
        setAlerts(alertsRes.value);
      }
      if (rulesRes.status === 'fulfilled' && Array.isArray(rulesRes.value)) {
        setAlertRules(rulesRes.value);
      }
      if (metricsRes.status === 'fulfilled' && metricsRes.value) {
        setMetrics(metricsRes.value);
      }
    } catch (err) {
      console.warn('Network sync notice:', err);
    } finally {
      if (!silent) setIsRefreshing(false);
    }
  }, []);

  // Initialize Real-Time WebSocket Listener (Socket.IO)
  const { socketStatus } = useWebSocket({
    onDeviceStatusChanged: (payload) => {
      // Instantly reflect state without page refresh!
      setDevices((prev) =>
        prev.map((d) => (d.id === payload.device.id ? { ...d, ...payload.device } : d))
      );

      // Instantly update campus counters
      setCampuses((prev) =>
        prev.map((c) => {
          if (c.id === payload.device.campus) {
            const delta = payload.device.status === 'online' ? 1 : -1;
            return {
              ...c,
              onlineDevices: Math.max(0, Math.min(c.totalDevices, c.onlineDevices + delta)),
            };
          }
          return c;
        })
      );

      if (payload.device.status === 'offline') {
        showToast(`🚨 [LIVE WEBSOCKET PUSH] ${payload.device.name} (${payload.device.type.toUpperCase()}) went OFFLINE at ${payload.device.building}, Room ${payload.device.roomNo}!`, 'critical');
      } else {
        showToast(`🟢 [LIVE WEBSOCKET PUSH] ${payload.device.name} is now ONLINE.`, 'success');
      }
    },
    onDeviceUpdated: (device) => {
      setDevices((prev) => prev.map((d) => (d.id === device.id ? device : d)));
    },
    onDeviceCreated: (device) => {
      setDevices((prev) => [device, ...prev.filter((d) => d.id !== device.id)]);
      showToast(`📡 [LIVE PUSH] New equipment provisioned: ${device.name}`, 'success');
    },
    onDeviceDeleted: ({ id }) => {
      setDevices((prev) => prev.filter((d) => d.id !== id));
      showToast(`🗑️ [LIVE PUSH] Equipment ${id} deleted from database.`);
    },
    onTelemetryBatch: (batch) => {
      setDevices((prev) => {
        const batchMap = new Map(batch.map((b) => [b.id, b]));
        return prev.map((d) => {
          const item = batchMap.get(d.id);
          return item ? { ...d, ...item } : d;
        });
      });
    },
    onAlertNew: (alert) => {
      setAlerts((prev) => [alert, ...prev.filter((a) => a.id !== alert.id)]);
      showToast(`🚨 [CRITICAL ALERT] ${alert.deviceName} went offline: Dispatched to WhatsApp & Email!`, 'critical');
    },
    onSecurityEvent: (secEvent) => {
      setSecurityEvents((prev) => [secEvent, ...prev.filter((s) => s.id !== secEvent.id)]);
    },
    onAlertRulesUpdated: (rules) => {
      setAlertRules(rules);
    },
    onFiberUpdated: (link) => {
      setFiberLinks((prev) => prev.map((l) => (l.id === link.id ? link : l)));
    },
  });

  useEffect(() => {
    loadAllData();

    // Fast follow-up sync after 1.5s to ensure cold-start backend data is fully caught
    const quickSyncTimer = setTimeout(() => {
      loadAllData(true);
    }, 1500);

    // Fallback polling every 20 seconds to keep telemetry strictly synced
    const interval = setInterval(() => {
      loadAllData(true);
    }, 20000);

    return () => {
      clearTimeout(quickSyncTimer);
      clearInterval(interval);
    };
  }, [loadAllData]);

  // Filtered devices list
  const filteredDevices = devices.filter((d) => {
    if (selectedCampus !== 'ALL' && d.campus !== selectedCampus) return false;
    if (selectedType !== 'ALL' && d.type !== selectedType) return false;
    if (selectedStatus !== 'ALL' && d.status !== selectedStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        d.name.toLowerCase().includes(q) ||
        d.ipAddress.toLowerCase().includes(q) ||
        d.building.toLowerCase().includes(q) ||
        d.roomNo.toLowerCase().includes(q) ||
        d.model.toLowerCase().includes(q) ||
        d.rackId.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Device Actions
  const handleSaveDevice = async (data: any) => {
    if (deviceToEdit) {
      await updateDevice(deviceToEdit.id, data);
      showToast(`Device ${data.name} updated successfully.`, 'success');
    } else {
      await createDevice(data);
      showToast(`Device ${data.name} provisioned in IUB database.`, 'success');
    }
  };

  const handleDeleteDevice = async (id: string) => {
    const dev = devices.find((d) => d.id === id);
    if (!window.confirm(`Are you sure you want to delete ${dev?.name || 'this device'} from IUB database?`)) {
      return;
    }
    await deleteDevice(id);
    showToast(`Device ${dev?.name || id} deleted from database.`, 'info');
  };

  const handleTogglePower = async (id: string) => {
    const updated = await toggleDevicePower(id);
    if (updated.status === 'offline') {
      showToast(`🚨 Simulated Power Down: ${updated.name} went OFFLINE. Real-time alert filter evaluated!`, 'critical');
    } else {
      showToast(`Power restored: ${updated.name} is now ONLINE.`, 'success');
    }
  };

  const handleUpdateFiberCore = async (linkId: string, coreNumber: number, status: string, service?: string) => {
    await updateFiberCore(linkId, coreNumber, status, service);
    loadAllData(true);
  };

  const handleTriggerSimulatedAttack = async (type: string) => {
    const randomDev = devices.find((d) => d.campus === 'BJC' && d.status === 'online') || devices[0];
    await fetch('/api/security-events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source: type.includes('SYN') ? 'Suricata-IDS' : 'Wazuh-SIEM',
        severity: 'critical',
        eventType: `${type} Simulated Test`,
        targetDevice: randomDev.name,
        targetIp: randomDev.ipAddress,
        attackerIp: '198.51.100.77',
        actionTaken: type.includes('SYN') ? 'Mitigated by Suricata IPS (Null0)' : 'Active Response Ban (3600s)',
        details: `Simulated attack validation by Mr. Zeeshan Javed AI Lead Engineer against ${randomDev.name} in ${randomDev.building}.`,
      }),
    }).then((r) => r.json());

    showToast(`🛡️ Security Engine: ${type} neutralized on ${randomDev.name}!`, 'info');
  };

  const handleResolveAlert = async (id: string) => {
    await resolveAlert(id);
    showToast('Alert marked as resolved.', 'success');
    loadAllData(true);
  };

  const handleDispatchAlert = async (payload: any) => {
    const res = await dispatchAlert(payload);
    showToast(`Alert dispatched to WhatsApp & Email queues.`, 'success');
    loadAllData(true);
    return res;
  };

  // Alert Rules Management Actions
  const handleCreateRule = async (data: Omit<AlertRule, 'id' | 'createdAt' | 'triggeredCount'>) => {
    await createAlertRule(data);
    showToast(`Alert Rule "${data.name}" created successfully.`, 'success');
    const updatedRules = await fetchAlertRules();
    setAlertRules(updatedRules);
  };

  const handleUpdateRule = async (id: string, data: Partial<AlertRule>) => {
    await updateAlertRule(id, data);
    showToast(`Alert Rule updated.`, 'success');
    const updatedRules = await fetchAlertRules();
    setAlertRules(updatedRules);
  };

  const handleDeleteRule = async (id: string) => {
    await deleteAlertRule(id);
    showToast(`Alert Rule deleted.`, 'info');
    const updatedRules = await fetchAlertRules();
    setAlertRules(updatedRules);
  };

  const handleToggleRule = async (id: string) => {
    const updated = await toggleAlertRule(id);
    showToast(`Rule "${updated.name}" is now ${updated.enabled ? 'ACTIVE' : 'DISABLED'}.`, 'info');
    const updatedRules = await fetchAlertRules();
    setAlertRules(updatedRules);
  };

  const handleResetDatabase = async () => {
    if (window.confirm('Reset IUB Network Database to original multi-campus architecture?')) {
      await resetDatabase();
      showToast('Database reset to default IUB multi-campus topology.', 'info');
      loadAllData();
    }
  };

  const unresolvedAlertsCount = alerts.filter((a) => !a.resolved).length;
  const offlineDevicesCount = devices.filter((d) => d.status === 'offline').length;

  return (
    <div 
      className="min-h-screen flex flex-col font-sans selection:bg-blue-600 selection:text-white transition-colors duration-300"
      style={{ 
        backgroundColor: theme.bodyBg,
        color: theme.textColor || '#E5E7EB'
      }}
    >
      
      {/* Universal Header with WebSocket Status and Dynamic Theme */}
      <Header
        metrics={metrics}
        webSocketStatus={socketStatus}
        onOpenAddModal={() => {
          setDeviceToEdit(null);
          setIsAddModalOpen(true);
        }}
        onOpenSheetsModal={() => setIsSheetsModalOpen(true)}
        onOpenChatbot={() => setIsChatbotOpen((prev) => !prev)}
        onOpenWhatsAppGroupModal={() => setIsWhatsAppGroupModalOpen(true)}
        offlineCount={offlineDevicesCount}
        onRefresh={() => loadAllData()}
        isRefreshing={isRefreshing}
        unresolvedAlertsCount={unresolvedAlertsCount}
        onSelectAlertTab={() => setActiveTab('alerts')}
        theme={theme}
        onOpenThemeModal={() => setIsThemeModalOpen(true)}
      />

      {/* Global Navigation and Campus Selector */}
      <CampusBar
        campuses={campuses}
        selectedCampus={selectedCampus}
        onSelectCampus={setSelectedCampus}
        selectedType={selectedType}
        onSelectType={setSelectedType}
        selectedStatus={selectedStatus}
        onSelectStatus={setSelectedStatus}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        
        {/* Real-Time WebSocket Toast Banner */}
        {notificationToast && (
          <div
            className={`fixed bottom-5 right-5 z-50 p-4 rounded-xl shadow-2xl text-xs font-semibold flex items-center space-x-3 transition-all duration-300 max-w-md border ${
              notificationToast.type === 'critical'
                ? 'bg-red-950/95 border-red-500 text-white shadow-red-950/50'
                : notificationToast.type === 'success'
                ? 'bg-emerald-950/95 border-emerald-500 text-white shadow-emerald-950/50'
                : 'bg-[#16181D]/95 border-blue-500 text-white shadow-blue-950/50'
            }`}
          >
            {notificationToast.type === 'critical' ? (
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 animate-bounce" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            )}
            <div>
              <div className="text-[10px] uppercase font-mono tracking-wider opacity-80">
                {notificationToast.type === 'critical' ? 'CRITICAL OUTAGE EVENT' : 'SYSTEM NOTIFICATION'}
              </div>
              <div>{notificationToast.message}</div>
            </div>
          </div>
        )}

        {/* Real-Time Status Notification Banner (if any devices offline) */}
        {offlineDevicesCount > 0 && activeTab !== 'alerts' && (
          <div className="p-3.5 bg-red-950/30 border border-red-500/50 rounded-lg flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center space-x-2 text-red-300">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 animate-pulse" />
              <span>
                <strong>{offlineDevicesCount} Equipment Currently Offline!</strong> Real-time alerts routed via active filter rules to designated WhatsApp & Email contacts.
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                id="offline-banner-whatsapp-btn"
                onClick={() => setIsWhatsAppGroupModalOpen(true)}
                className="inline-flex items-center space-x-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-bold transition cursor-pointer shadow-md"
                title="Send offline devices outage report to your WhatsApp group"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Send to WhatsApp Group &rarr;</span>
              </button>
              <button
                onClick={() => setActiveTab('alerts')}
                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[11px] font-bold transition cursor-pointer"
              >
                View Alert Filters & Incident Logs &rarr;
              </button>
            </div>
          </div>
        )}

        {/* TAB 1: NOC DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            
            {/* KPI Summary & Campus Health Matrix */}
            <NocSummary
              campuses={campuses}
              devices={devices}
              onSelectCampus={(campId) => {
                setSelectedCampus(campId);
                window.scrollTo({ top: 400, behavior: 'smooth' });
              }}
            />

            {/* Device Grid Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-4">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Live Equipment Telemetry & Monitoring Stream</span>
                  <span className="badge-tool font-semibold text-blue-400">
                    Showing {filteredDevices.length} of {devices.length} Devices
                  </span>
                  <span className="badge-tool text-emerald-400 flex items-center gap-1">
                    <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
                    <span>Live WebSocket Sync</span>
                  </span>
                </h2>
                <p className="text-xs text-[#9CA3AF] mt-0.5">
                  Real-time ICMP ping, SNMP v2c/v3 telemetry, and physical port links across university facilities. Status changes update instantaneously without manual refresh.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setActiveTab('circular')}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#16181D] hover:bg-[#1E2229] border border-blue-500/40 text-blue-300 hover:text-white text-xs font-semibold shadow-sm transition cursor-pointer"
                  title="View Campus Circular Equipment Graphic (Gole Shape)"
                >
                  <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                  <span>⭕ Campus Graphic (Gole Shape) &rarr;</span>
                </button>
                <button
                  onClick={() => setActiveTab('topology')}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#16181D] hover:bg-[#1E2229] border border-[#2D3139] text-blue-400 hover:text-blue-300 text-xs font-semibold shadow-sm transition cursor-pointer"
                  title="View D3.js Network Topology Diagram"
                >
                  <Network className="w-3.5 h-3.5" />
                  <span>Interactive D3 Topology &rarr;</span>
                </button>
                <button
                  onClick={() => {
                    setDeviceToEdit(null);
                    setIsAddModalOpen(true);
                  }}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Provision Equipment</span>
                </button>
              </div>
            </div>

            {/* Device Cards Grid */}
            {filteredDevices.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredDevices.map((device) => (
                  <DeviceCard
                    key={device.id}
                    device={device}
                    onTogglePower={handleTogglePower}
                    onEdit={(d) => {
                      setDeviceToEdit(d);
                      setIsAddModalOpen(true);
                    }}
                    onDelete={handleDeleteDevice}
                    onOpenDiagnostics={(d) => setDiagnosticDevice(d)}
                    onViewHistory={(d) => setHistoryDevice(d)}
                  />
                ))}
              </div>
            ) : (
              <div className="card-elegant p-12 text-center">
                <p className="text-gray-400 text-sm">
                  No devices matched the selected campus or equipment filter.
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB: CAMPUS CIRCULAR EQUIPMENT GRAPHIC (GOLE SHAPE) */}
        {activeTab === 'circular' && (
          <CampusCircularGraphic
            devices={devices}
            campuses={campuses}
            onTogglePower={handleTogglePower}
            onOpenDiagnostics={(d) => setDiagnosticDevice(d)}
            onOpenChatWithQuery={handleOpenChatWithQuery}
          />
        )}

        {/* TAB 2: INTERACTIVE D3.JS NETWORK TOPOLOGY DIAGRAM */}
        {activeTab === 'topology' && (
          <NetworkTopology
            devices={devices}
            campuses={campuses}
            onOpenDeviceDiagnostics={(d) => setDiagnosticDevice(d)}
            onToggleDevicePower={handleTogglePower}
            onSelectCampus={(campId) => setSelectedCampus(campId)}
          />
        )}

        {/* TAB 2: INVENTORY SPREADSHEET TABLE */}
        {activeTab === 'inventory' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-white tracking-tight">
                  University Master Device Inventory
                </h2>
                <p className="text-xs text-[#9CA3AF] mt-0.5">
                  Complete listing of routers, switches, access points, IP phones, surveillance cameras, racks, and fiber backbones across all 6 campuses.
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsCollectorModalOpen(true)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#16181D] hover:bg-[#1E2229] text-blue-400 border border-[#2D3139] text-xs font-semibold transition cursor-pointer"
                  title="Configure Network Collector Agent & API Tokens"
                >
                  <Server className="w-3.5 h-3.5" />
                  <span>Collector Agents</span>
                </button>
                <button
                  onClick={() => setIsSheetsModalOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-[#16181D] hover:bg-[#1E2229] text-emerald-400 border border-[#2D3139] text-xs font-semibold transition cursor-pointer"
                >
                  Google Sheets Integration
                </button>
                <a
                  href="/api/export/csv"
                  download="iub_network_inventory.csv"
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#16181D] hover:bg-[#1E2229] text-gray-300 hover:text-white border border-[#2D3139] text-xs font-semibold transition cursor-pointer"
                  title="Export complete device inventory to CSV"
                >
                  <Download className="w-3.5 h-3.5 text-blue-400" />
                  <span>Export to CSV</span>
                </a>
                <button
                  onClick={() => {
                    setDeviceToEdit(null);
                    setIsAddModalOpen(true);
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition cursor-pointer"
                >
                  Add Equipment
                </button>
              </div>
            </div>

            <DeviceTable
              devices={filteredDevices}
              onTogglePower={handleTogglePower}
              onEdit={(d) => {
                setDeviceToEdit(d);
                setIsAddModalOpen(true);
              }}
              onDelete={handleDeleteDevice}
              onOpenDiagnostics={(d) => setDiagnosticDevice(d)}
              onOpenAddModal={() => {
                setDeviceToEdit(null);
                setIsAddModalOpen(true);
              }}
              onOpenSheetsModal={() => setIsSheetsModalOpen(true)}
              onViewHistory={(d) => setHistoryDevice(d)}
              onOpenCollectorModal={() => setIsCollectorModalOpen(true)}
            />
          </div>
        )}

        {/* TAB 3: FIBER OPTIC BACKBONE */}
        {activeTab === 'fiber' && (
          <FiberManager
            fiberLinks={fiberLinks}
            onUpdateCore={handleUpdateFiberCore}
          />
        )}

        {/* TAB 4: 42U DATA CENTER RACKS */}
        {activeTab === 'racks' && (
          <RackViewer
            devices={devices}
            onSelectDevice={(d) => setDiagnosticDevice(d)}
          />
        )}

        {/* TAB 5: HARDWARE HEALTH & SERVER RACK TELEMETRY */}
        {activeTab === 'hardware' && (
          <HardwareHealth
            selectedCampus={selectedCampus}
          />
        )}

        {/* TAB 6: SURICATA & WAZUH SECURITY CENTER */}
        {activeTab === 'security' && (
          <SecurityCenter
            events={securityEvents}
            onTriggerSimulatedAttack={handleTriggerSimulatedAttack}
          />
        )}

        {/* TAB 6: ADVANCED ALERTING FILTERS & EMERGENCY DISPATCH */}
        {activeTab === 'alerts' && (
          <AlertCenter
            alerts={alerts}
            rules={alertRules}
            devices={devices}
            onResolveAlert={handleResolveAlert}
            onDispatchManualAlert={handleDispatchAlert}
            onCreateRule={handleCreateRule}
            onUpdateRule={handleUpdateRule}
            onDeleteRule={handleDeleteRule}
            onToggleRule={handleToggleRule}
            onToggleDevicePower={handleTogglePower}
          />
        )}

        {/* TAB 7: LIVE DIAGNOSTICS & PING PROBE */}
        {activeTab === 'diagnostics' && (
          <div className="space-y-6">
            <div className="card-elegant p-6 shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-[#2D3139]">
                <div className="flex items-center space-x-2">
                  <div className="p-2 rounded-lg bg-[#0A0B0E] border border-[#2D3139] text-blue-400">
                    <Terminal className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white tracking-tight">
                      Live Campus Diagnostic Console & SNMP Telemetry Engine
                    </h2>
                    <p className="text-xs text-[#9CA3AF] mt-0.5">
                      Select any equipment below to trigger real ICMP Ping round-trip calculations, WAN hops traceroute, and MIB-II SNMP telemetry walk.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {devices.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setDiagnosticDevice(d)}
                    className="p-3 bg-[#0A0B0E] hover:bg-[#1E2229] border border-[#2D3139] hover:border-[#3B424E] rounded-lg text-left transition cursor-pointer flex items-center justify-between group"
                  >
                    <div>
                      <div className="font-bold text-white text-xs group-hover:text-blue-400 transition">{d.name}</div>
                      <div className="text-[11px] font-mono text-blue-400">{d.ipAddress}</div>
                      <div className="text-[10px] text-[#9CA3AF]">{d.building} ({d.campus})</div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-white">{d.latencyMs}ms</span>
                      <span className="block text-[10px] text-blue-400 uppercase font-semibold">Test Probe &rarr;</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer 
        className="mt-12 border-t py-6 text-xs transition-colors duration-300"
        style={{ 
          backgroundColor: theme.footerBg,
          borderColor: theme.borderColor || '#2D3139',
          color: theme.isLightMode ? '#475569' : '#9CA3AF'
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            {/* Footer Left Logo: Official Crest with standard white background & fixed size */}
            <div className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-lg bg-white flex items-center justify-center p-1 shadow-md border border-gray-200" title="The Islamia University of Bahawalpur - Official Crest">
              <img src="/iub-crest.svg" alt="IUB Official Crest" className="w-full h-full object-contain" />
            </div>

            <div>
              <p className="font-semibold text-white flex items-center gap-2">
                <span>The Islamia University of Bahawalpur</span>
                <span className="text-[10px] text-blue-400 font-mono font-medium px-1.5 py-0.2 rounded bg-blue-900/30 border border-blue-800/40">
                  NOC / SOC Directorate
                </span>
              </p>
              <p className="text-[#9CA3AF] text-[11px] mt-0.5">
                Autonomous Monitoring & Security Architecture &bull; System Design and Developed by <strong className="text-amber-400">Mr. Zeeshan Javed, AI Lead Engineer</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4 text-[11px]">
            <span className="hidden lg:inline text-gray-400">Baghdad-ul-Jadeed &bull; Abbasia &bull; Railway &bull; RYK &bull; Bahawalnagar &bull; Liaquatpur</span>
            
            <button
              onClick={() => setIsThemeModalOpen(true)}
              className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-[#16181D] hover:bg-[#1E2229] text-purple-300 hover:text-white border border-purple-800/40 transition cursor-pointer"
              title="Customize Themes (Header, Body, Footer)"
            >
              <Palette className="w-3 h-3 text-purple-400" />
              <span>Theme Studio</span>
            </button>

            <button
              onClick={handleResetDatabase}
              className="flex items-center space-x-1 text-[#9CA3AF] hover:text-white transition cursor-pointer"
              title="Reset Sample Data"
            >
              <RotateCcw className="w-3 h-3 text-[#9CA3AF]" />
              <span>Reset Database</span>
            </button>

            {/* Footer Right Logo: 100 Years Centenary with standard white background & fixed size */}
            <div className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-lg bg-white flex items-center justify-center p-0.5 shadow-md border border-gray-200" title="100 Years of Academic Excellence (1925-2025) - Jamia Abbasia">
              <img src="/iub-centenary.svg" alt="Jamia Abbasia 100 Years Centenary" className="w-full h-full object-contain" />
            </div>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <ThemeModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
        currentTheme={theme}
        onApplyTheme={(newTheme) => setTheme(newTheme)}
        onResetTheme={() => setTheme(DEFAULT_THEME)}
      />

      <DeviceModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setDeviceToEdit(null);
        }}
        onSave={handleSaveDevice}
        deviceToEdit={deviceToEdit}
      />

      <DiagnosticModal
        device={diagnosticDevice}
        onClose={() => setDiagnosticDevice(null)}
      />

      <GoogleSheetsModal
        isOpen={isSheetsModalOpen}
        onClose={() => setIsSheetsModalOpen(false)}
        devices={devices}
      />

      <HistoricalChartsModal
        device={historyDevice}
        isOpen={!!historyDevice}
        onClose={() => setHistoryDevice(null)}
      />

      <CollectorAgentModal
        isOpen={isCollectorModalOpen}
        onClose={() => setIsCollectorModalOpen(false)}
      />

      {/* Floating Chatbot Launcher Button */}
      {!isChatbotOpen && (
        <button
          id="floating-chatbot-btn"
          onClick={() => setIsChatbotOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center space-x-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-emerald-950 via-[#0B3D2E] to-emerald-800 text-white font-semibold text-xs border border-emerald-400/50 shadow-2xl shadow-emerald-950/80 hover:shadow-emerald-500/30 hover:scale-105 active:scale-95 transition-all cursor-pointer group"
          title="Open IUB NOC AI Copilot Chatbot"
        >
          <div className="relative">
            <Bot className="w-5 h-5 text-emerald-300 group-hover:rotate-12 transition-transform" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#0A0B0E] animate-ping"></span>
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#0A0B0E]"></span>
          </div>
          <span className="font-bold tracking-wide">AI NOC Copilot</span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/50 text-emerald-300 border border-emerald-500/30">
            GEMINI
          </span>
        </button>
      )}

      {/* IUB NOC AI Copilot Chatbot Modal/Drawer */}
      <NocChatbot
        isOpen={isChatbotOpen}
        onClose={() => {
          setIsChatbotOpen(false);
          setChatbotInitialPrompt(undefined);
        }}
        devices={devices}
        onOpenDevice={(dev) => setDiagnosticDevice(dev)}
        initialPrompt={chatbotInitialPrompt}
      />

      {/* WhatsApp Group Outage Broadcast Modal */}
      <WhatsAppGroupModal
        isOpen={isWhatsAppGroupModalOpen}
        onClose={() => setIsWhatsAppGroupModalOpen(false)}
        devices={devices}
        onToggleDevicePower={handleTogglePower}
        onAlertDispatched={() => loadAllData(true)}
      />

    </div>
  );
}
