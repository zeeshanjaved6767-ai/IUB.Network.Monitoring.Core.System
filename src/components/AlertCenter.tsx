import React, { useState } from 'react';
import { 
  BellRing, 
  MessageSquare, 
  Mail, 
  Send, 
  CheckCircle2, 
  XCircle, 
  ExternalLink, 
  Clock, 
  Check,
  Filter,
  Layers,
  History,
  Users,
  Copy,
  AlertTriangle
} from 'lucide-react';
import { AlertNotification, Device, AlertRule } from '../types.ts';
import { AlertRulesManager } from './AlertRulesManager.tsx';
import { DailyUptimeReport } from './DailyUptimeReport.tsx';
import { dispatchWhatsAppGroupOfflineAlert } from '../api.ts';

interface AlertCenterProps {
  alerts: AlertNotification[];
  rules: AlertRule[];
  devices: Device[];
  onResolveAlert: (id: string) => Promise<void>;
  onDispatchManualAlert: (payload: any) => Promise<any>;
  onCreateRule: (data: Omit<AlertRule, 'id' | 'createdAt' | 'triggeredCount'>) => Promise<void>;
  onUpdateRule: (id: string, data: Partial<AlertRule>) => Promise<void>;
  onDeleteRule: (id: string) => Promise<void>;
  onToggleRule: (id: string) => Promise<void>;
  onToggleDevicePower?: (deviceId: string) => Promise<void>;
}

export const AlertCenter: React.FC<AlertCenterProps> = ({
  alerts,
  rules,
  devices,
  onResolveAlert,
  onDispatchManualAlert,
  onCreateRule,
  onUpdateRule,
  onDeleteRule,
  onToggleRule,
  onToggleDevicePower,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'rules' | 'history' | 'dispatch' | 'whatsapp-group' | 'uptime-report'>('uptime-report');
  const [recipientPhone, setRecipientPhone] = useState('+923001234567');
  const [recipientEmail, setRecipientEmail] = useState('zeejaved766@gmail.com');
  const [selectedDeviceId, setSelectedDeviceId] = useState(devices[0]?.id || '');
  const [customReason, setCustomReason] = useState('Critical Core Router Failure / ICMP Ping Timeout');
  const [channel, setChannel] = useState<'whatsapp' | 'email' | 'all'>('all');
  const [isSending, setIsSending] = useState(false);
  const [dispatchResult, setDispatchResult] = useState<any>(null);

  // WhatsApp Group State
  const [groupName, setGroupName] = useState<string>(() => {
    return localStorage.getItem('iub_whatsapp_group_name') || 'IUB NOC Engineers Group';
  });
  const [groupCustomNote, setGroupCustomNote] = useState('');
  const [isSendingGroup, setIsSendingGroup] = useState(false);
  const [groupCopied, setGroupCopied] = useState(false);
  const [groupResult, setGroupResult] = useState<any>(null);

  const handleGroupNameChange = (val: string) => {
    setGroupName(val);
    localStorage.setItem('iub_whatsapp_group_name', val);
  };

  const offlineDevices = devices.filter((d) => d.status === 'offline');

  const generateGroupMessage = () => {
    const targetGroup = groupName.trim() || 'IUB NOC Engineers Group';
    const now = new Date().toLocaleString();

    if (offlineDevices.length === 0) {
      return `🟢 *[IUB NOC - ALL SYSTEMS OPERATIONAL]*\n` +
        `🏛️ *The Islamia University of Bahawalpur*\n` +
        `👥 *Target WhatsApp Group:* ${targetGroup}\n` +
        `-----------------------------------------\n` +
        `✅ *Status:* All ${devices.length} monitored equipment across 6 campuses are currently ONLINE.\n` +
        (groupCustomNote ? `📝 *Note:* ${groupCustomNote}\n` : '') +
        `🕒 *Timestamp:* ${now}\n` +
        `👤 *Lead Engineer:* Mr. Zeeshan Javed (AI Lead Engineer)\n` +
        `⚡ Autonomous NOC Telemetry Core`;
    }

    return `🚨 *[IUB NOC CRITICAL ALERT - OFFLINE DEVICES]*\n` +
      `🏛️ *The Islamia University of Bahawalpur*\n` +
      `👥 *Target WhatsApp Group:* ${targetGroup}\n` +
      `⚠️ *Offline Count:* ${offlineDevices.length} Equipment Down\n` +
      `-----------------------------------------\n` +
      offlineDevices.map((d, index) => {
        return `${index + 1}️⃣ *${d.name}* [${d.type.toUpperCase()}]\n` +
          `   • *IP / MAC:* \`${d.ipAddress}\` | \`${d.macAddress}\`\n` +
          `   • *Location:* Campus ${d.campus} &bull; ${d.building}, Room ${d.roomNo}\n` +
          `   • *Upstream Switch:* ${d.switchModel || 'Core Switch'} (Port: ${d.switchPort || 'N/A'})\n` +
          `   • *Device Port:* ${d.devicePort || 'N/A'} (Rack: ${d.rackId})\n` +
          `   • *Diagnostics:* Ping: ${d.latencyMs}ms | Loss: ${d.packetLoss}% | CPU: ${d.cpuUsage}%`;
      }).join('\n\n') +
      `\n-----------------------------------------\n` +
      (groupCustomNote ? `📝 *Incident Note:* ${groupCustomNote}\n` : '') +
      `🕒 *Timestamp:* ${now}\n` +
      `👤 *Lead Engineer:* Mr. Zeeshan Javed (AI Lead Engineer)\n` +
      `⚡ *Action Required:* On-duty NOC engineers please verify switch ports, PoE supply, and patch cables immediately.`;
  };

  const groupMessageText = generateGroupMessage();

  const handleCopyGroupMessage = async () => {
    try {
      await navigator.clipboard.writeText(groupMessageText);
      setGroupCopied(true);
      setTimeout(() => setGroupCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleSendGroupAlert = async () => {
    if (!groupName.trim()) {
      alert('Please enter your WhatsApp Group Name');
      return;
    }

    setIsSendingGroup(true);
    setGroupResult(null);

    try {
      const res = await dispatchWhatsAppGroupOfflineAlert({
        groupName: groupName.trim(),
        customNote: groupCustomNote.trim() || undefined,
        offlineDeviceIds: offlineDevices.map((d) => d.id),
      });

      setGroupResult(res);

      // Open WhatsApp share intent
      const waUrl = res.whatsappUrl || `https://api.whatsapp.com/send?text=${encodeURIComponent(groupMessageText)}`;
      window.open(waUrl, '_blank', 'noopener,noreferrer');
    } catch (e: any) {
      setGroupResult({ error: e.message || 'Dispatch failed' });
    } finally {
      setIsSendingGroup(false);
    }
  };

  const selectedDev = devices.find((d) => d.id === selectedDeviceId) || devices[0];
  const unresolvedCount = alerts.filter((a) => !a.resolved).length;

  const handleSendAlert = async () => {
    if (!selectedDev) return;
    setIsSending(true);
    setDispatchResult(null);

    try {
      const res = await onDispatchManualAlert({
        deviceId: selectedDev.id,
        deviceName: selectedDev.name,
        campus: selectedDev.campus,
        building: selectedDev.building,
        roomNo: selectedDev.roomNo,
        ipAddress: selectedDev.ipAddress,
        status: 'offline',
        reason: customReason,
        channel,
        recipientEmail,
        recipientPhone,
      });
      setDispatchResult(res);
    } catch (e: any) {
      setDispatchResult({ error: e.message || 'Dispatch failed' });
    } finally {
      setIsSending(false);
    }
  };

  const generateWhatsAppLink = () => {
    if (!selectedDev) return '#';
    const text = `🚨 *[IUB NOC CRITICAL ALERT]*%0A-----------------------------------------%0A*Device:* ${selectedDev.name}%0A*IP Address:* ${selectedDev.ipAddress}%0A*Status:* OFFLINE%0A*Location:* Campus ${selectedDev.campus} | ${selectedDev.building}, Room ${selectedDev.roomNo}%0A*Issue:* ${customReason}%0A*System:* IUB Network Monitoring Core%0A*Lead:* Mr. Zeeshan Javed (AI Lead Engineer)%0APlease inspect immediately.`;
    const cleanPhone = recipientPhone.replace(/[^0-9]/g, '');
    return `https://wa.me/${cleanPhone}?text=${text}`;
  };

  return (
    <div className="space-y-6">
      
      {/* Sub-Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#2D3139] pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveSubTab('whatsapp-group')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeSubTab === 'whatsapp-group'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/40'
                : 'bg-[#16181D] hover:bg-[#1E2229] text-gray-300 border border-[#2D3139]'
            }`}
          >
            <Users className="w-4 h-4 text-emerald-400" />
            <span>WhatsApp Group Broadcast</span>
            {offlineDevices.length > 0 ? (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-red-500 text-white text-[10px] font-mono font-bold animate-pulse">
                {offlineDevices.length} Down
              </span>
            ) : (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-emerald-500/30 text-emerald-400 text-[10px] font-mono">
                All Online
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('uptime-report')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeSubTab === 'uptime-report'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                : 'bg-[#16181D] hover:bg-[#1E2229] text-gray-300 border border-[#2D3139]'
            }`}
          >
            <Mail className="w-4 h-4 text-sky-400" />
            <span>Daily Uptime Report</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-mono">
              Auto-Email
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('rules')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeSubTab === 'rules'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                : 'bg-[#16181D] hover:bg-[#1E2229] text-gray-300 border border-[#2D3139]'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>Alert Filtering Rules</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full bg-black/40 text-[10px] font-mono">
              {rules.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('history')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeSubTab === 'history'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                : 'bg-[#16181D] hover:bg-[#1E2229] text-gray-300 border border-[#2D3139]'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Incident Logs & Feed</span>
            {unresolvedCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-red-500 text-white text-[10px] font-mono font-bold">
                {unresolvedCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('dispatch')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeSubTab === 'dispatch'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                : 'bg-[#16181D] hover:bg-[#1E2229] text-gray-300 border border-[#2D3139]'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>Manual Dispatch Console</span>
          </button>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#0A0B0E] text-emerald-400 border border-[#2D3139]">
            <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
            <span>WhatsApp Bot: <strong className="text-white font-mono">ACTIVE</strong></span>
          </div>

          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#0A0B0E] text-blue-400 border border-[#2D3139]">
            <Mail className="w-3.5 h-3.5 text-blue-400" />
            <span>SMTP Relay: <strong className="text-white font-mono">ONLINE</strong></span>
          </div>
        </div>
      </div>

      {/* Tab 0: WhatsApp Group Outage Broadcast */}
      {activeSubTab === 'whatsapp-group' && (
        <div className="card-elegant p-6 shadow-2xl space-y-5 border border-emerald-900/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#2D3139]">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-md">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                  <span>WhatsApp Group Outage Dispatcher</span>
                  <span className="px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono border border-emerald-500/30">
                    ONE-CLICK BROADCAST
                  </span>
                </h3>
                <p className="text-xs text-[#9CA3AF]">
                  Write your WhatsApp group name below. All currently offline devices will be compiled automatically and dispatched into WhatsApp.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-400">
                Auto-saved in browser
              </span>
            </div>
          </div>

          {/* Offline Equipment Status Overview */}
          <div className={`p-4 rounded-lg border flex flex-wrap items-center justify-between gap-3 text-xs ${
            offlineDevices.length > 0 
              ? 'bg-red-950/40 border-red-500/50 text-red-200' 
              : 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
          }`}>
            <div className="flex items-center space-x-3">
              {offlineDevices.length > 0 ? (
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 animate-pulse" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              )}
              <div>
                <strong className="text-white text-sm">
                  {offlineDevices.length > 0
                    ? `⚠️ ${offlineDevices.length} Equipment Currently OFFLINE`
                    : '✅ All University Equipment Online (0 Outages)'}
                </strong>
                <p className="text-[11px] opacity-80 mt-0.5">
                  {offlineDevices.length > 0
                    ? `Offline nodes detected across university network. These are pre-formatted for group broadcast.`
                    : `Zero downtime across all 6 IUB campuses. You can still dispatch an all-clear operational report or simulate an outage to test.`}
                </p>
              </div>
            </div>

            {offlineDevices.length === 0 && onToggleDevicePower && (
              <button
                onClick={() => {
                  const targetDev = devices.find((d) => d.status === 'online');
                  if (targetDev) onToggleDevicePower(targetDev.id);
                }}
                className="px-3 py-1.5 rounded-lg bg-[#16181D] hover:bg-[#1E2229] text-amber-300 border border-amber-500/40 text-xs font-semibold transition cursor-pointer"
                title="Toggle 1 device offline to test outage report"
              >
                Test: Simulate 1 Offline Device
              </button>
            )}
          </div>

          {/* Group Configuration Form */}
          <div className="bg-[#0A0B0E] p-5 rounded-lg border border-[#2D3139] space-y-4">
            
            {/* Input: Group Name */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-200 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-emerald-400" />
                  <span>WhatsApp Group Name (Enter Group Name Here):</span>
                </span>
                <span className="text-[11px] font-normal text-emerald-400">● Live Connected</span>
              </label>
              <input
                id="alert-center-whatsapp-group-name"
                type="text"
                value={groupName}
                onChange={(e) => handleGroupNameChange(e.target.value)}
                placeholder="e.g. IUB NOC Alert Group, Network Core Team, IT Support Bahawalpur"
                className="w-full px-4 py-2.5 bg-[#16181D] border border-[#2D3139] rounded-lg text-sm text-white font-semibold placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition shadow-inner"
              />
              <p className="text-[11px] text-gray-400">
                You just write the group name once (e.g. <strong>{groupName || 'IUB NOC Engineers Group'}</strong>). The message with all offline devices is generated automatically.
              </p>
            </div>

            {/* Input: Optional Note */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-gray-400">
                Optional Custom Note / Cause (Included in Group Message):
              </label>
              <input
                type="text"
                value={groupCustomNote}
                onChange={(e) => setGroupCustomNote(e.target.value)}
                placeholder="e.g. Power tripping in Baghdad-ul-Jadeed CS Block, or Fiber optic maintenance"
                className="w-full px-3.5 py-2 bg-[#16181D] border border-[#2D3139] rounded-lg text-xs text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Formatted Message Preview */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-gray-300 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                  <span>WhatsApp Group Message Preview (With All Offline Devices):</span>
                </span>
                <button
                  onClick={handleCopyGroupMessage}
                  className="flex items-center space-x-1 text-[11px] text-emerald-400 hover:text-emerald-300 transition cursor-pointer font-medium"
                >
                  {groupCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{groupCopied ? 'Copied to Clipboard!' : 'Copy Preview'}</span>
                </button>
              </div>

              <div className="bg-[#16181D] border border-[#2D3139] rounded-lg p-3.5 text-xs font-mono text-gray-300 max-h-60 overflow-y-auto whitespace-pre-wrap leading-relaxed shadow-inner">
                {groupMessageText}
              </div>
            </div>

            {/* Buttons Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-[#2D3139]">
              <div className="text-xs text-gray-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Ready to dispatch to: <strong className="text-white">{groupName || 'WhatsApp Group'}</strong></span>
              </div>

              <div className="flex items-center space-x-2.5">
                <button
                  onClick={handleCopyGroupMessage}
                  className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-[#16181D] hover:bg-[#1E2229] text-gray-300 text-xs font-medium border border-[#2D3139] transition cursor-pointer"
                >
                  {groupCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{groupCopied ? 'Copied' : 'Copy Message'}</span>
                </button>

                <button
                  id="alert-center-send-whatsapp-group-btn"
                  onClick={handleSendGroupAlert}
                  disabled={isSendingGroup || !groupName.trim()}
                  className="inline-flex items-center space-x-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition cursor-pointer shadow-lg shadow-emerald-950/40 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSendingGroup ? 'Launching WhatsApp...' : 'Send Outage Alert to WhatsApp Group'}</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                </button>
              </div>
            </div>

            {/* Result Feedback Banner */}
            {groupResult && (
              <div className={`mt-3 p-3.5 rounded-lg border text-xs space-y-1.5 ${
                groupResult.error
                  ? 'bg-red-950/40 border-red-500/50 text-red-300'
                  : 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
              }`}>
                {groupResult.error ? (
                  <div className="flex items-center gap-2 font-semibold">
                    <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <span>{groupResult.error}</span>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2 font-bold text-white">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>WhatsApp Group Outage Alert Dispatched! (Audit ID: {groupResult.alertId})</span>
                    </div>
                    <div className="text-gray-300">
                      Dispatched to WhatsApp Group: <strong>{groupResult.groupName}</strong> ({groupResult.offlineCount} offline devices recorded).
                    </div>
                    <div className="text-[11px] text-gray-400">
                      Recorded in system Incident Feed and published live via WebSocket.
                    </div>
                  </>
                )}
              </div>
            )}

          </div>
        </div>
      )}

      {/* Tab 1: Advanced Alerting Filters & Rules Manager */}
      {activeSubTab === 'rules' && (
        <AlertRulesManager
          rules={rules}
          onCreateRule={onCreateRule}
          onUpdateRule={onUpdateRule}
          onDeleteRule={onDeleteRule}
          onToggleRule={onToggleRule}
        />
      )}

      {/* Tab 2: Incident Feed & Audit Logs */}
      {activeSubTab === 'history' && (
        <div className="card-elegant p-6 shadow-2xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#2D3139]">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white tracking-tight">
                Emergency Broadcast & Notification Audit Log
              </h3>
            </div>
            <span className="text-xs text-[#9CA3AF]">
              {unresolvedCount} Unresolved Outage Incidents
            </span>
          </div>

          {alerts.length === 0 ? (
            <div className="p-8 text-center bg-[#0A0B0E] border border-[#2D3139] rounded-lg text-gray-500 text-xs">
              No alert notifications recorded yet. Alerts trigger automatically when devices go offline or when test dispatches are sent.
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-4 rounded-lg border transition ${
                    alert.resolved
                      ? 'bg-[#0A0B0E] border-[#2D3139] opacity-75'
                      : 'bg-[#0A0B0E] border-red-500/40 shadow-lg'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-[#2D3139]">
                    <div className="flex items-center space-x-2.5">
                      <span
                        className={`font-mono text-[10px] px-2 py-0.5 rounded font-bold border ${
                          alert.resolved
                            ? 'bg-[#16181D] text-gray-400 border-[#2D3139]'
                            : 'bg-red-950 text-red-300 border-red-800'
                        }`}
                      >
                        {alert.id}
                      </span>

                      <span className="font-bold text-white text-xs">
                        {alert.deviceName} ({alert.campus})
                      </span>

                      <span className="text-[#9CA3AF] text-xs">
                        &bull; {alert.building} ({alert.roomNo})
                      </span>

                      {alert.ruleName && (
                        <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-blue-950/80 text-blue-300 border border-blue-800">
                          Rule: {alert.ruleName}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="text-[11px] font-mono text-[#9CA3AF]">
                        {new Date(alert.timestamp).toLocaleString()}
                      </span>

                      {!alert.resolved && (
                        <button
                          onClick={() => onResolveAlert(alert.id)}
                          className="flex items-center space-x-1 px-2.5 py-1 rounded bg-[#16181D] hover:bg-[#1E2229] text-emerald-400 border border-[#2D3139] text-[11px] font-semibold transition cursor-pointer"
                        >
                          <Check className="w-3 h-3" />
                          <span>Mark Resolved</span>
                        </button>
                      )}

                      {alert.resolved && (
                        <span className="flex items-center space-x-1 text-emerald-400 text-[11px] font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Resolved</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 text-xs space-y-1.5">
                    <div className="text-[#E5E7EB] font-mono bg-[#16181D] p-2.5 rounded border border-[#2D3139] whitespace-pre-wrap">
                      {alert.message}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#9CA3AF] pt-1">
                      <span>
                        Channels: <strong className="text-emerald-400 uppercase">{alert.channel}</strong> &bull; Recipient: <span className="text-white font-mono">{alert.recipient}</span>
                      </span>
                      <span>
                        Trigger: <span className="text-amber-400">{alert.triggerReason}</span>
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Daily Automated Network Uptime Summary Report */}
      {activeSubTab === 'uptime-report' && (
        <DailyUptimeReport devices={devices} defaultEmail={recipientEmail} />
      )}

      {/* Tab 3: Manual Dispatch Console */}
      {activeSubTab === 'dispatch' && (
        <div className="card-elegant p-6 shadow-2xl space-y-5">
          <div>
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-lg bg-[#0A0B0E] border border-[#2D3139] text-blue-400">
                <Send className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Emergency Alert Manual Dispatch Console
              </h3>
            </div>
            <p className="text-xs text-[#9CA3AF] mt-1">
              Broadcast an immediate custom alert to designated engineers via WhatsApp and Email.
            </p>
          </div>

          <div className="bg-[#0A0B0E] p-4 rounded-lg border border-[#2D3139] space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
              
              {/* Target Device */}
              <div>
                <label className="block text-[#9CA3AF] font-medium mb-1">Target Device</label>
                <select
                  value={selectedDeviceId}
                  onChange={(e) => setSelectedDeviceId(e.target.value)}
                  className="w-full px-3 py-2 bg-[#16181D] border border-[#2D3139] rounded-lg text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  {devices.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.campus} - {d.ipAddress})
                    </option>
                  ))}
                </select>
              </div>

              {/* Alert Channel */}
              <div>
                <label className="block text-[#9CA3AF] font-medium mb-1">Alert Channel</label>
                <select
                  value={channel}
                  onChange={(e) => setChannel(e.target.value as any)}
                  className="w-full px-3 py-2 bg-[#16181D] border border-[#2D3139] rounded-lg text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="all">WhatsApp + Email (All Channels)</option>
                  <option value="whatsapp">WhatsApp Only</option>
                  <option value="email">Email Only</option>
                </select>
              </div>

              {/* WhatsApp Recipient */}
              <div>
                <label className="block text-[#9CA3AF] font-medium mb-1">WhatsApp Phone Number</label>
                <input
                  type="text"
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                  placeholder="+923001234567"
                  className="w-full px-3 py-2 bg-[#16181D] border border-[#2D3139] rounded-lg text-xs font-mono text-emerald-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Email Recipient */}
              <div>
                <label className="block text-[#9CA3AF] font-medium mb-1">Alert Email Address</label>
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="zeejaved766@gmail.com"
                  className="w-full px-3 py-2 bg-[#16181D] border border-[#2D3139] rounded-lg text-xs font-mono text-blue-300 focus:outline-none focus:border-blue-500"
                />
              </div>

            </div>

            {/* Trigger Reason & Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-[#2D3139]">
              <div className="flex-1">
                <input
                  type="text"
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Failure reason (e.g. Critical Core Router Failure / ICMP Ping Timeout)"
                  className="w-full px-3 py-2 bg-[#16181D] border border-[#2D3139] rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center space-x-2">
                <a
                  href={generateWhatsAppLink()}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center space-x-1.5 px-3 py-2 bg-[#16181D] hover:bg-[#1E2229] text-emerald-400 border border-[#2D3139] rounded-lg text-xs font-semibold transition cursor-pointer"
                  title="Direct launch in WhatsApp Web / App"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open WhatsApp Web</span>
                </a>

                <button
                  onClick={handleSendAlert}
                  disabled={isSending}
                  className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition cursor-pointer shadow-md shadow-blue-950/40 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSending ? 'Dispatching...' : 'Dispatch Alert Now'}</span>
                </button>
              </div>
            </div>

            {/* Result Banner */}
            {dispatchResult && (
              <div className="mt-3 p-3 bg-[#16181D] border border-[#2D3139] rounded-lg text-xs space-y-1">
                {dispatchResult.error ? (
                  <div className="text-red-400 font-semibold flex items-center gap-1.5">
                    <XCircle className="w-4 h-4" />
                    <span>{dispatchResult.error}</span>
                  </div>
                ) : (
                  <>
                    <div className="text-emerald-400 font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Alert Dispatched Successfully! (ID: {dispatchResult.alertId})</span>
                    </div>
                    <div className="text-[#E5E7EB]">
                      <strong>WhatsApp:</strong> {dispatchResult.whatsapp}
                    </div>
                    <div className="text-[#E5E7EB]">
                      <strong>Email:</strong> {dispatchResult.email}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
