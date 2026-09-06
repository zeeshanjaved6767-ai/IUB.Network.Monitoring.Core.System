import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Activity, 
  Wifi, 
  Server, 
  Bell, 
  FileSpreadsheet, 
  Download, 
  Plus, 
  RefreshCw, 
  Radio, 
  CheckCircle2, 
  AlertTriangle,
  Bot,
  Sparkles,
  Users,
  Palette
} from 'lucide-react';
import { SystemEngineMetrics, ThemeConfig } from '../types.ts';

interface HeaderProps {
  metrics?: SystemEngineMetrics | null;
  webSocketStatus?: { isConnected: boolean; transport: string; lastEventTime: string | null };
  onOpenAddModal: () => void;
  onOpenSheetsModal: () => void;
  onOpenChatbot?: () => void;
  onOpenWhatsAppGroupModal?: () => void;
  offlineCount?: number;
  onRefresh: () => void;
  isRefreshing: boolean;
  unresolvedAlertsCount: number;
  onSelectAlertTab: () => void;
  theme?: ThemeConfig;
  onOpenThemeModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  metrics,
  webSocketStatus,
  onOpenAddModal,
  onOpenSheetsModal,
  onOpenChatbot,
  onOpenWhatsAppGroupModal,
  offlineCount = 0,
  onRefresh,
  isRefreshing,
  unresolvedAlertsCount,
  onSelectAlertTab,
  theme,
  onOpenThemeModal,
}) => {
  const [time, setTime] = useState(new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Karachi' }));

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Karachi' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header 
      className="border-b text-[#E5E7EB] shadow-2xl sticky top-0 z-40 transition-colors duration-300"
      style={{ 
        backgroundColor: theme?.headerBg || '#16181D',
        borderColor: theme?.borderColor || '#2D3139'
      }}
    >
      {/* Top University Brand Bar */}
      <div 
        className="border-b px-4 py-1.5 flex flex-wrap items-center justify-between text-xs text-gray-400 transition-colors duration-300"
        style={{ 
          backgroundColor: theme?.headerTopBarBg || '#0A0B0E',
          borderColor: theme?.borderColor || '#2D3139'
        }}
      >
        <div className="flex items-center space-x-2 font-medium">
          <div className="dot online"></div>
          <span className="tracking-wide text-gray-300">GOVERNMENT OF THE PUNJAB &bull; HIGHER EDUCATION DEPARTMENT</span>
          <span className="text-[#2D3139]">|</span>
          <span className="text-blue-400 font-semibold">THE ISLAMIA UNIVERSITY OF BAHAWALPUR (EST. 1925)</span>
        </div>
        <div className="flex items-center space-x-4 text-gray-400">
          <span className="flex items-center space-x-1.5">
            <Radio className="w-3.5 h-3.5 text-blue-400" />
            <span>NOC Time (PKT): <strong className="text-white font-mono">{time}</strong></span>
          </span>
          <span className="text-[#2D3139]">|</span>
          <span className="text-amber-400 font-mono text-[11px]">PERN 40G Multi-Homed Fiber Backbone</span>
        </div>
      </div>

      {/* Main Header Content */}
      <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          
          {/* Brand & Author Identity */}
          <div className="flex items-center space-x-3.5">
            {/* Left Logo: Authentic IUB Crest Logo with standard white background & fixed size */}
            <div className="relative group cursor-pointer" title="The Islamia University of Bahawalpur - Official University Crest">
              <div className="w-12 h-12 min-w-[48px] min-h-[48px] rounded-xl bg-white flex items-center justify-center p-1.5 shadow-md border border-gray-200 group-hover:border-blue-500 transition">
                <img src="/iub-crest.svg" alt="IUB Official Crest" className="w-full h-full object-contain" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center" title="NOC Core Operational"></span>
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  <span>IUB <span className="text-blue-500">Network Monitoring</span> Core</span>
                  <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-blue-900/30 text-blue-400 border border-blue-800/50">
                    V2.0 ENTERPRISE
                  </span>
                </h1>
              </div>
              <div className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider flex items-center gap-1.5 flex-wrap">
                <span>Project Lead:</span>
                <span className="font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.2 rounded border border-amber-400/30">
                  Mr. Zeeshan Javed &bull; AI Lead Engineer
                </span>
                <span className="text-gray-600">&bull;</span>
                <span className="text-gray-400">Autonomous Monitoring & Security Architecture</span>
              </div>
            </div>
          </div>

          {/* Quick Action Controls */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
            {onOpenThemeModal && (
              <button
                id="header-theme-modal-btn"
                onClick={onOpenThemeModal}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-purple-950/70 hover:bg-purple-900/90 text-purple-300 hover:text-white text-xs font-semibold border border-purple-600/50 shadow-sm transition cursor-pointer"
                title="Change Website Themes & Colors (Header, Body, Footer)"
              >
                <Palette className="w-3.5 h-3.5 text-purple-400" />
                <span>Themes</span>
                <span className="w-2 h-2 rounded-full ring-1 ring-purple-300" style={{ backgroundColor: theme?.accentColor || '#3B82F6' }}></span>
              </button>
            )}

            <button
              id="header-refresh-btn"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#0A0B0E] hover:bg-[#1E2229] text-gray-300 text-xs font-medium border border-[#2D3139] transition cursor-pointer disabled:opacity-50"
              title="Refresh Network Status"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-400' : 'text-gray-400'}`} />
              <span>{isRefreshing ? 'Syncing...' : 'Poll Live'}</span>
            </button>

            <a
              id="header-export-csv-btn"
              href="/api/export/csv"
              download="iub_network_inventory.csv"
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#0A0B0E] hover:bg-[#1E2229] text-gray-300 text-xs font-medium border border-[#2D3139] transition cursor-pointer"
              title="Export Full Inventory as CSV for Excel / Sheets"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              <span>Export CSV</span>
            </a>

            <button
              id="header-google-sheets-btn"
              onClick={onOpenSheetsModal}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#0A0B0E] hover:bg-[#1E2229] text-emerald-400 text-xs font-medium border border-[#2D3139] transition cursor-pointer"
              title="Google Sheets Live Sync"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>G-Sheets</span>
            </button>

            <button
              id="header-chatbot-btn"
              onClick={onOpenChatbot}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/70 hover:bg-emerald-900/90 text-emerald-300 text-xs font-medium border border-emerald-500/50 shadow-sm transition cursor-pointer"
              title="Open IUB NOC AI Copilot Chatbot"
            >
              <Bot className="w-3.5 h-3.5 text-emerald-400" />
              <span>AI Copilot</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            </button>

            <button
              id="header-alerts-btn"
              onClick={onSelectAlertTab}
              className="relative inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#0A0B0E] hover:bg-[#1E2229] text-gray-300 text-xs font-medium border border-[#2D3139] transition cursor-pointer"
            >
              <Bell className="w-3.5 h-3.5 text-amber-400" />
              <span>Alerts</span>
              {unresolvedAlertsCount > 0 && (
                <span className="inline-flex items-center justify-center px-1.5 py-0.2 bg-red-500 text-white rounded-full text-[10px] font-bold">
                  {unresolvedAlertsCount}
                </span>
              )}
            </button>

            {onOpenWhatsAppGroupModal && (
              <button
                id="header-whatsapp-group-btn"
                onClick={onOpenWhatsAppGroupModal}
                className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition cursor-pointer ${
                  offlineCount > 0
                    ? 'bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border-emerald-500/60 shadow-md shadow-emerald-950/40'
                    : 'bg-[#0A0B0E] hover:bg-[#1E2229] text-gray-300 border-[#2D3139]'
                }`}
                title="Broadcast all offline devices to WhatsApp Group"
              >
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                <span>WhatsApp Group</span>
                {offlineCount > 0 && (
                  <span className="inline-flex items-center justify-center px-1.5 py-0.2 bg-red-500 text-white rounded-full text-[10px] font-bold animate-pulse">
                    {offlineCount}
                  </span>
                )}
              </button>
            )}

            <button
              id="header-add-device-btn"
              onClick={onOpenAddModal}
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-900/30 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Device</span>
            </button>

            {/* Right Logo: 100 Years Jamia Abbasia Centenary Logo with standard white background & fixed size */}
            <div className="flex items-center pl-2 sm:pl-3 border-l border-white/15 cursor-pointer group" title="100 Years of Academic Excellence (1925-2025) - Jamia Abbasia, The Islamia University of Bahawalpur">
              <div className="w-12 h-12 min-w-[48px] min-h-[48px] rounded-xl bg-white flex items-center justify-center p-1 shadow-md border border-gray-200 group-hover:border-amber-500 transition-all transform group-hover:scale-105">
                <img src="/iub-centenary.svg" alt="Jamia Abbasia 100 Years Centenary" className="w-full h-full object-contain" />
              </div>
            </div>
          </div>
        </div>

        {/* Engine Status Chips */}
        <div 
          className="mt-3 pt-2.5 border-t flex flex-wrap items-center justify-between gap-2 text-[11px] text-gray-400 transition-colors"
          style={{ borderColor: theme?.borderColor || '#2D3139' }}
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="label-tiny">INTEGRATIONS:</span>
            
            <span className={`badge-tool flex items-center gap-1.5 ${webSocketStatus?.isConnected ? 'border-emerald-500/50 text-emerald-400' : 'border-red-500/50 text-red-400'}`}>
              <Radio className={`w-3.5 h-3.5 ${webSocketStatus?.isConnected ? 'text-emerald-400 animate-pulse' : 'text-red-400'}`} />
              <span className="font-semibold">WEBSOCKET PUSH:</span>
              <span className="font-mono font-bold">{webSocketStatus?.isConnected ? 'LIVE' : 'OFFLINE'}</span>
            </span>

            <span className="badge-tool flex items-center gap-1.5">
              <span>PRTG API:</span>
              <div className="dot online"></div>
            </span>

            <span className="badge-tool flex items-center gap-1.5">
              <span>ZABBIX 6.4:</span>
              <strong className="text-emerald-400 font-mono">SYNCED ({metrics?.zabbixAgentCount || 142})</strong>
            </span>

            <span className="badge-tool flex items-center gap-1.5">
              <span className="text-cyan-400 font-semibold">SURICATA IDS:</span>
              <div className="dot online"></div>
              <span className="text-gray-300 font-mono">({metrics?.suricataRulesLoaded ? `${Math.round(metrics.suricataRulesLoaded / 1000)}k` : '38k'})</span>
            </span>

            <span className="badge-tool flex items-center gap-1.5">
              <span className="text-purple-400 font-semibold">WAZUH SIEM:</span>
              <div className="dot online"></div>
              <span className="text-gray-300 font-mono">({metrics?.wazuhActiveAgents || 184} Agents)</span>
            </span>

            <span className="badge-tool flex items-center gap-1.5">
              <span className="text-green-400">WHATSAPP BOT:</span>
              <span className="text-white font-mono">ACTIVE</span>
            </span>

            <span className="badge-tool flex items-center gap-1.5">
              <span>DB:</span>
              <span className="text-blue-400 font-mono">POSTGRES</span>
            </span>

            <button
              onClick={onOpenSheetsModal}
              className="badge-tool flex items-center gap-1.5 hover:border-emerald-500/60 cursor-pointer transition text-emerald-400"
              title="Open Google Sheets Live Sync"
            >
              <FileSpreadsheet className="w-3 h-3 text-emerald-400" />
              <span className="font-semibold">GOOGLE SHEETS:</span>
              <span className="text-white font-mono">WORKSPACE SYNC</span>
            </button>
          </div>

          <div className="text-gray-500 text-[10px] font-mono uppercase tracking-wider">
            Lead: <strong className="text-gray-300">Mr. Zeeshan Javed</strong> &bull; IUB Directorate of IT
          </div>
        </div>
      </div>
    </header>
  );
};
