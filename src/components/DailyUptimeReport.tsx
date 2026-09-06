import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Send, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Calendar, 
  RefreshCw, 
  Server, 
  Activity, 
  ShieldCheck, 
  AlertTriangle, 
  Building2, 
  Copy, 
  Check, 
  Eye, 
  Sliders, 
  Cable,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { Device } from '../types.ts';
import { 
  fetchUptimeReportPreview, 
  sendDailyUptimeReport, 
  fetchUptimeReportSettings, 
  updateUptimeReportSettings 
} from '../api.ts';

interface DailyUptimeReportProps {
  devices: Device[];
  defaultEmail?: string;
}

export const DailyUptimeReport: React.FC<DailyUptimeReportProps> = ({
  devices,
  defaultEmail = 'zeejaved766@gmail.com',
}) => {
  const [recipientEmail, setRecipientEmail] = useState(defaultEmail);
  const [scheduleTime, setScheduleTime] = useState('08:00');
  const [isAutoEnabled, setIsAutoEnabled] = useState(true);
  const [lastSentAt, setLastSentAt] = useState<string | null>(null);
  const [lastSentStatus, setLastSentStatus] = useState<string | null>(null);

  // Report generation state
  const [isLoadingPreview, setIsLoadingPreview] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [htmlPreview, setHtmlPreview] = useState<string>('');
  const [activeViewMode, setActiveViewMode] = useState<'dashboard' | 'email-preview' | 'settings'>('dashboard');
  const [sendResult, setSendResult] = useState<any>(null);
  const [copiedText, setCopiedText] = useState(false);
  const [settingsSavedToast, setSettingsSavedToast] = useState(false);

  // Fetch initial report preview & schedule settings
  const loadData = async () => {
    setIsLoadingPreview(true);
    try {
      const [previewRes, settingsRes] = await Promise.all([
        fetchUptimeReportPreview(recipientEmail),
        fetchUptimeReportSettings().catch(() => null),
      ]);

      if (previewRes && previewRes.success) {
        setReportData(previewRes.reportData);
        setHtmlPreview(previewRes.htmlPreview);
      }

      if (settingsRes) {
        setIsAutoEnabled(settingsRes.enabled ?? true);
        setScheduleTime(settingsRes.scheduleTime || '08:00');
        if (settingsRes.recipientEmail) setRecipientEmail(settingsRes.recipientEmail);
        setLastSentAt(settingsRes.lastSentAt);
        setLastSentStatus(settingsRes.lastSentStatus);
      }
    } catch (err) {
      console.error('Failed to load uptime report preview:', err);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Save automated schedule settings
  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    try {
      const res = await updateUptimeReportSettings({
        enabled: isAutoEnabled,
        scheduleTime,
        recipientEmail: recipientEmail.trim(),
      });
      setSettingsSavedToast(true);
      setTimeout(() => setSettingsSavedToast(false), 3000);
      if (res && res.settings) {
        setIsAutoEnabled(res.settings.enabled);
        setScheduleTime(res.settings.scheduleTime);
        setRecipientEmail(res.settings.recipientEmail);
      }
    } catch (err: any) {
      alert(`Failed to save settings: ${err.message}`);
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Immediate dispatch of daily report to admin
  const handleSendReport = async () => {
    setIsSending(true);
    setSendResult(null);
    try {
      const res = await sendDailyUptimeReport(recipientEmail.trim());
      setSendResult(res);
      setLastSentAt(res.sentAt);
      setLastSentStatus('success');
      // Reload preview data to sync alert logs
      loadData();
    } catch (err: any) {
      setSendResult({ error: err.message || 'Failed to dispatch report' });
    } finally {
      setIsSending(false);
    }
  };

  const getPlainSummaryText = () => {
    if (!reportData) return '';
    return `📊 [IUB NOC DAILY NETWORK UPTIME REPORT]\n` +
      `🏛️ The Islamia University of Bahawalpur\n` +
      `📅 Date: ${reportData.reportDate} (${reportData.formattedTime} PKT)\n` +
      `👤 Administrator: ${recipientEmail}\n` +
      `-----------------------------------------\n` +
      `⚡ Enterprise Network Uptime: ${reportData.metrics.uptimePercent}%\n` +
      `✅ Active Nodes: ${reportData.metrics.onlineDevices} / ${reportData.metrics.totalDevices} Online\n` +
      `⚠️ Offline Outages: ${reportData.metrics.offlineDevicesCount}\n` +
      `🌐 Average Latency: ${reportData.metrics.avgLatencyMs}ms\n` +
      `📈 Core Bandwidth: ${reportData.metrics.totalBandwidthGbps} Gbps\n` +
      `-----------------------------------------\n` +
      `Campus Breakdown:\n` +
      (reportData.campusBreakdown || []).map((c: any) => ` • ${c.shortName} (${c.campusId}): ${c.uptimePercent}% uptime (${c.onlineDevices}/${c.totalDevices}) - ${c.fiberStatus}`).join('\n') +
      `\n-----------------------------------------\n` +
      `Lead Engineer: Mr. Zeeshan Javed (AI Lead Engineer)\n` +
      `IUB Autonomous NOC Monitoring Core`;
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(getPlainSummaryText());
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const totalDevs = devices.length;
  const onlineDevs = devices.filter((d) => d.status === 'online').length;
  const offlineDevs = devices.filter((d) => d.status === 'offline');
  const uptimePercent = totalDevs > 0 ? ((onlineDevs / totalDevs) * 100).toFixed(1) : '100';

  return (
    <div className="space-y-5">
      {/* Top Banner & Quick Controls */}
      <div className="bg-[#111318] border border-[#2D3139] rounded-xl p-5 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Mail className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Daily Automated Network Uptime Summary Report</span>
                  {isAutoEnabled ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Daily Automation Active
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      Automation Paused
                    </span>
                  )}
                </h3>
                <p className="text-xs text-[#9CA3AF] mt-0.5">
                  Generates an executive HTML audit report of all 6 IUB campuses, fiber backbone links, and active outages, delivered automatically to the network administrator.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={loadData}
              disabled={isLoadingPreview}
              className="flex items-center space-x-1.5 px-3 py-2 bg-[#16181D] hover:bg-[#1E2229] text-gray-300 border border-[#2D3139] rounded-lg text-xs font-semibold transition cursor-pointer disabled:opacity-50"
              title="Refresh live metrics"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingPreview ? 'animate-spin' : ''}`} />
              <span>Refresh Data</span>
            </button>

            <button
              onClick={handleCopyText}
              className="flex items-center space-x-1.5 px-3 py-2 bg-[#16181D] hover:bg-[#1E2229] text-gray-300 border border-[#2D3139] rounded-lg text-xs font-semibold transition cursor-pointer"
              title="Copy plain-text summary"
            >
              {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedText ? 'Copied Summary' : 'Copy Summary'}</span>
            </button>

            <button
              onClick={handleSendReport}
              disabled={isSending || isLoadingPreview}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg text-xs font-bold transition shadow-lg shadow-blue-950/40 cursor-pointer disabled:opacity-50"
            >
              {isSending ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Dispatching Email...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Generate & Email Report Now</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center space-x-1 mt-4 pt-4 border-t border-[#222630]">
          <button
            onClick={() => setActiveViewMode('dashboard')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeViewMode === 'dashboard'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-[#16181D] text-gray-400 hover:text-white border border-[#2D3139]'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>Executive Dashboard View</span>
          </button>

          <button
            onClick={() => setActiveViewMode('email-preview')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeViewMode === 'email-preview'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-[#16181D] text-gray-400 hover:text-white border border-[#2D3139]'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>HTML Email Live Preview</span>
          </button>

          <button
            onClick={() => setActiveViewMode('settings')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeViewMode === 'settings'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-[#16181D] text-gray-400 hover:text-white border border-[#2D3139]'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Automated Schedule Configuration</span>
          </button>
        </div>
      </div>

      {/* Result Notification Banner */}
      {sendResult && (
        <div className={`p-4 rounded-xl border ${
          sendResult.error 
            ? 'bg-red-500/10 border-red-500/30 text-red-300' 
            : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {sendResult.error ? (
                <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              )}
              <div>
                <p className="text-xs font-bold">
                  {sendResult.error ? 'Email Dispatch Failed' : 'Daily Network Uptime Report Dispatched Successfully!'}
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {sendResult.error 
                    ? sendResult.error 
                    : `Dispatched to ${sendResult.recipientEmail} &bull; ${sendResult.emailStatus} &bull; Alert ID: ${sendResult.alertId}`}
                </p>
              </div>
            </div>
            <button
              onClick={() => setSendResult(null)}
              className="text-gray-400 hover:text-white text-xs px-2 py-1 rounded bg-[#16181D] cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* VIEW MODE 1: EXECUTIVE DASHBOARD */}
      {activeViewMode === 'dashboard' && (
        <div className="space-y-5">
          {/* Key KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="card-elegant p-4 bg-[#111318]">
              <span className="label-tiny">ENTERPRISE UPTIME</span>
              <div className="mt-2 flex items-baseline justify-between">
                <span className={`text-2xl font-bold font-mono ${
                  Number(uptimePercent) >= 98 ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  {reportData ? reportData.metrics.uptimePercent : uptimePercent}%
                </span>
                <span className="text-[10px] text-gray-400">All 6 Campuses</span>
              </div>
              <div className="w-full bg-[#1E2229] h-1.5 rounded-full mt-2 overflow-hidden">
                <div 
                  className={`h-full rounded-full ${Number(uptimePercent) >= 98 ? 'bg-emerald-500' : 'bg-red-500'}`}
                  style={{ width: `${Math.min(100, Number(uptimePercent))}%` }}
                />
              </div>
            </div>

            <div className="card-elegant p-4 bg-[#111318]">
              <span className="label-tiny">EQUIPMENT STATUS</span>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl font-bold text-white font-mono">
                  {onlineDevs}/{totalDevs}
                </span>
                <span className={`text-xs font-bold ${offlineDevs.length > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {offlineDevs.length > 0 ? `${offlineDevs.length} Down` : '100% Up'}
                </span>
              </div>
              <p className="text-[10px] text-gray-400 mt-1">Routers, Switches & APs</p>
            </div>

            <div className="card-elegant p-4 bg-[#111318]">
              <span className="label-tiny">CAMPUS LATENCY & BANDWIDTH</span>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl font-bold text-sky-400 font-mono">
                  {reportData ? reportData.metrics.avgLatencyMs : 1.2}ms
                </span>
                <span className="text-xs font-bold text-indigo-400">
                  {reportData ? reportData.metrics.totalBandwidthGbps : 24.5}G
                </span>
              </div>
              <p className="text-[10px] text-gray-400 mt-1">Avg Ping & Aggregate Traffic</p>
            </div>

            <div className="card-elegant p-4 bg-[#111318]">
              <span className="label-tiny">AUTOMATED RECIPIENT</span>
              <div className="mt-2">
                <span className="text-xs font-bold font-mono text-blue-300 block truncate" title={recipientEmail}>
                  {recipientEmail}
                </span>
                <span className="text-[10px] text-emerald-400 font-semibold block mt-1">
                  Daily Delivery: {scheduleTime} PKT
                </span>
              </div>
            </div>
          </div>

          {/* Campus Availability Breakdown Table */}
          <div className="card-elegant p-5 bg-[#111318]">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-400" />
                <span>Multi-Campus Network Availability Breakdown</span>
              </h4>
              <span className="text-[11px] text-gray-400">
                Audited across Baghdad-ul-Jadeed, Abbasia, Railway, RYK, BWN & Liaquatpur
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#2D3139] text-[#9CA3AF]">
                    <th className="py-2.5 px-3 font-semibold uppercase text-[10px]">Campus</th>
                    <th className="py-2.5 px-3 font-semibold uppercase text-[10px]">Online Nodes</th>
                    <th className="py-2.5 px-3 font-semibold uppercase text-[10px]">Availability Rate</th>
                    <th className="py-2.5 px-3 font-semibold uppercase text-[10px]">Fiber Backbone Ring</th>
                    <th className="py-2.5 px-3 font-semibold uppercase text-[10px]">Campus NOC Lead</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1F242C]">
                  {reportData?.campusBreakdown ? (
                    reportData.campusBreakdown.map((c: any) => (
                      <tr key={c.campusId} className="hover:bg-[#16181D] transition">
                        <td className="py-2.5 px-3 font-medium text-white">
                          <div>
                            <span>{c.shortName}</span>
                            <span className="ml-1.5 text-[10px] text-gray-400 font-mono">({c.campusId})</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-gray-300 font-mono">
                          {c.onlineDevices} / {c.totalDevices}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold font-mono ${
                            Number(c.uptimePercent) >= 98 
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                              : 'bg-red-500/20 text-red-400 border border-red-500/30'
                          }`}>
                            {c.uptimePercent}%
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="inline-flex items-center gap-1 text-[11px] font-mono text-indigo-300">
                            <Cable className="w-3 h-3 text-indigo-400" />
                            <span>{c.fiberStatus} ({c.coreBandwidth})</span>
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-gray-400 text-[11px]">
                          {c.nocLead}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-4 text-center text-gray-500">
                        Loading campus statistics...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Active Outage Incidents */}
          <div className="card-elegant p-5 bg-[#111318]">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span>Current Outages & Downed Equipment ({offlineDevs.length})</span>
            </h4>

            {offlineDevs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {offlineDevs.map((d) => (
                  <div key={d.id} className="p-3 bg-[#16181D] border border-red-500/30 rounded-lg text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                        {d.name}
                      </span>
                      <span className="px-1.5 py-0.2 rounded bg-red-500/20 text-red-400 font-mono text-[10px] uppercase font-bold">
                        {d.type}
                      </span>
                    </div>
                    <div className="text-[#9CA3AF] text-[11px]">
                      IP: <span className="text-blue-400 font-mono">{d.ipAddress}</span> &bull; Campus {d.campus} ({d.building}, Room {d.roomNo})
                    </div>
                    <div className="text-[11px] text-gray-400 flex items-center justify-between pt-1 border-t border-[#222630]">
                      <span>Upstream: {d.switchModel || 'Core'} &bull; Port {d.switchPort || 'N/A'}</span>
                      <span className="text-red-400 font-mono">Ping: Timeout</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-center text-emerald-400 text-xs">
                <CheckCircle2 className="w-5 h-5 mx-auto mb-1 text-emerald-400" />
                <span className="font-bold">Zero Active Outages</span> &bull; All monitored campus core routers, distribution switches, and Wi-Fi access points are online.
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW MODE 2: HTML EMAIL LIVE PREVIEW */}
      {activeViewMode === 'email-preview' && (
        <div className="space-y-4">
          <div className="bg-[#111318] border border-[#2D3139] rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs text-gray-300">
              <Mail className="w-4 h-4 text-blue-400" />
              <span>
                <strong>Subject:</strong> 📊 [IUB NOC] Daily Network Uptime Summary ({reportData?.metrics.uptimePercent || uptimePercent}% Uptime) - {reportData?.reportDate}
              </span>
            </div>
            <div className="text-xs text-gray-400 font-mono">
              To: <strong className="text-blue-400">{recipientEmail}</strong>
            </div>
          </div>

          <div className="bg-[#0A0B0E] border border-[#2D3139] rounded-xl overflow-hidden shadow-2xl">
            <div className="p-3 bg-[#16181D] border-b border-[#2D3139] flex items-center justify-between text-xs text-gray-400">
              <span className="font-semibold text-white">Rendered Email Client Canvas</span>
              <span>Responsive HTML5 &bull; Inline Styles Enabled</span>
            </div>

            {htmlPreview ? (
              <iframe
                srcDoc={htmlPreview}
                title="Daily Uptime Email Preview"
                className="w-full h-[650px] border-none bg-[#0A0B0E]"
                sandbox="allow-same-origin"
              />
            ) : (
              <div className="p-12 text-center text-gray-500 text-xs">
                Generating email template preview...
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW MODE 3: AUTOMATED SCHEDULE CONFIGURATION */}
      {activeViewMode === 'settings' && (
        <div className="bg-[#111318] border border-[#2D3139] rounded-xl p-6 shadow-xl space-y-6 max-w-3xl">
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-blue-400" />
              <span>Automated Schedule Configuration</span>
            </h4>
            <p className="text-xs text-[#9CA3AF] mt-1">
              Configure the autonomous background watchdog to generate and send daily network uptime reports to the university administration.
            </p>
          </div>

          <div className="space-y-4">
            {/* Enable / Disable Toggle */}
            <div className="flex items-center justify-between p-4 bg-[#16181D] border border-[#2D3139] rounded-lg">
              <div>
                <span className="text-xs font-bold text-white block">Enable Autonomous Daily Dispatch</span>
                <span className="text-[11px] text-gray-400 block mt-0.5">
                  When active, the server watchdog checks every minute and dispatches the uptime report automatically at the scheduled time.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsAutoEnabled(!isAutoEnabled)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isAutoEnabled ? 'bg-blue-600' : 'bg-gray-700'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${
                    isAutoEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Recipient Email */}
            <div className="p-4 bg-[#16181D] border border-[#2D3139] rounded-lg space-y-1.5">
              <label className="block text-xs font-bold text-white">Admin Recipient Email Address</label>
              <p className="text-[11px] text-gray-400">Target mailbox for the executive daily summary report.</p>
              <input
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="zeejaved766@gmail.com"
                className="w-full px-3 py-2 bg-[#0E1015] border border-[#2D3139] rounded-lg text-xs font-mono text-blue-300 focus:outline-none focus:border-blue-500 mt-1"
              />
            </div>

            {/* Delivery Time Selector */}
            <div className="p-4 bg-[#16181D] border border-[#2D3139] rounded-lg space-y-1.5">
              <label className="block text-xs font-bold text-white flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                <span>Daily Scheduled Delivery Time (Pakistan Standard Time)</span>
              </label>
              <p className="text-[11px] text-gray-400">Select the time of day when the report should be generated and emailed.</p>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                {[
                  { time: '08:00', label: '08:00 AM (Morning Audit)' },
                  { time: '09:00', label: '09:00 AM (Office Hours)' },
                  { time: '14:00', label: '02:00 PM (Midday Check)' },
                  { time: '20:00', label: '08:00 PM (Evening Summary)' },
                ].map((slot) => (
                  <button
                    key={slot.time}
                    type="button"
                    onClick={() => setScheduleTime(slot.time)}
                    className={`p-2.5 rounded-lg text-xs font-mono transition text-left border cursor-pointer ${
                      scheduleTime === slot.time
                        ? 'bg-blue-600/20 border-blue-500 text-blue-300 font-bold'
                        : 'bg-[#0E1015] border-[#2D3139] text-gray-400 hover:text-white'
                    }`}
                  >
                    <span className="block text-xs font-bold">{slot.time} PKT</span>
                    <span className="block text-[10px] text-gray-500 mt-0.5">{slot.label}</span>
                  </button>
                ))}
              </div>

              <div className="pt-2 flex items-center gap-2">
                <span className="text-xs text-gray-400">Custom Time:</span>
                <input
                  type="time"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  className="px-2.5 py-1 bg-[#0E1015] border border-[#2D3139] rounded text-xs font-mono text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Last Execution Info */}
            <div className="p-4 bg-[#16181D] border border-[#2D3139] rounded-lg text-xs space-y-1 text-gray-400">
              <span className="font-bold text-white block">Execution Telemetry</span>
              <div>
                <strong>Last Sent:</strong>{' '}
                {lastSentAt ? new Date(lastSentAt).toLocaleString() : 'Not sent yet today'}
              </div>
              <div>
                <strong>Status:</strong>{' '}
                <span className={lastSentStatus === 'success' ? 'text-emerald-400 font-semibold' : 'text-gray-400'}>
                  {lastSentStatus || 'Ready for next trigger'}
                </span>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-between pt-4 border-t border-[#222630]">
            <span className="text-xs text-emerald-400 font-semibold">
              {settingsSavedToast && '✓ Schedule settings saved successfully!'}
            </span>
            <button
              onClick={handleSaveSettings}
              disabled={isSavingSettings}
              className="flex items-center space-x-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition shadow-sm cursor-pointer disabled:opacity-50"
            >
              {isSavingSettings ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Schedule Configuration</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
