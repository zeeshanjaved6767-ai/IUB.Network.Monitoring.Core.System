import React, { useState, useEffect } from 'react';
import { 
  X, 
  MessageSquare, 
  Send, 
  Copy, 
  Check, 
  ExternalLink, 
  AlertTriangle, 
  CheckCircle2, 
  Users, 
  Radio, 
  Server,
  Sparkles
} from 'lucide-react';
import { Device } from '../types.ts';
import { dispatchWhatsAppGroupOfflineAlert } from '../api.ts';

interface WhatsAppGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  devices: Device[];
  onToggleDevicePower?: (deviceId: string) => Promise<void>;
  onAlertDispatched?: () => void;
}

export const WhatsAppGroupModal: React.FC<WhatsAppGroupModalProps> = ({
  isOpen,
  onClose,
  devices,
  onToggleDevicePower,
  onAlertDispatched,
}) => {
  // Load saved group name from localStorage or default to IUB NOC Engineers Group
  const [groupName, setGroupName] = useState<string>(() => {
    return localStorage.getItem('iub_whatsapp_group_name') || 'IUB NOC Engineers Group';
  });
  const [customNote, setCustomNote] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [dispatchResult, setDispatchResult] = useState<{
    success: boolean;
    alertId?: string;
    message?: string;
    whatsappUrl?: string;
    error?: string;
  } | null>(null);

  // Save group name to localStorage whenever user edits it
  const handleGroupNameChange = (val: string) => {
    setGroupName(val);
    localStorage.setItem('iub_whatsapp_group_name', val);
  };

  // Extract all currently offline devices
  const offlineDevices = devices.filter((d) => d.status === 'offline');

  // Build the compiled message text for the group
  const generateMessageText = () => {
    const targetGroup = groupName.trim() || 'IUB NOC Engineers Group';
    const now = new Date().toLocaleString();

    if (offlineDevices.length === 0) {
      return `🟢 *[IUB NOC - ALL SYSTEMS OPERATIONAL]*\n` +
        `🏛️ *The Islamia University of Bahawalpur*\n` +
        `👥 *Target WhatsApp Group:* ${targetGroup}\n` +
        `-----------------------------------------\n` +
        `✅ *Status:* All ${devices.length} monitored equipment across 6 campuses are currently ONLINE.\n` +
        (customNote ? `📝 *Note:* ${customNote}\n` : '') +
        `🕒 *Timestamp:* ${now}\n` +
        `👤 *Lead Engineer:* Mr. Zeeshan Javed (AI Lead Engineer)\n` +
        `🌐 *IUB Autonomous NOC Monitoring Core*`;
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
      (customNote ? `📝 *Incident Note:* ${customNote}\n` : '') +
      `🕒 *Timestamp:* ${now}\n` +
      `👤 *Lead Engineer:* Mr. Zeeshan Javed (AI Lead Engineer)\n` +
      `⚡ *Action Required:* On-duty NOC engineers please verify switch ports, PoE supply, and patch cables immediately.`;
  };

  const messageText = generateMessageText();

  // Copy to clipboard handler
  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(messageText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  // Send to WhatsApp Group
  const handleSendToGroup = async () => {
    if (!groupName.trim()) {
      alert('Please enter your WhatsApp Group Name');
      return;
    }

    setIsSending(true);
    setDispatchResult(null);

    try {
      // 1. Dispatch through server to record in DB audit log & push over WebSocket
      const res = await dispatchWhatsAppGroupOfflineAlert({
        groupName: groupName.trim(),
        customNote: customNote.trim() || undefined,
        offlineDeviceIds: offlineDevices.map((d) => d.id),
      });

      setDispatchResult({
        success: true,
        alertId: res.alertId,
        message: res.message,
        whatsappUrl: res.whatsappUrl,
      });

      if (onAlertDispatched) {
        onAlertDispatched();
      }

      // 2. Open WhatsApp share web intent in new tab/window
      const waUrl = res.whatsappUrl || `https://api.whatsapp.com/send?text=${encodeURIComponent(messageText)}`;
      window.open(waUrl, '_blank', 'noopener,noreferrer');
    } catch (err: any) {
      setDispatchResult({
        success: false,
        error: err.message || 'Failed to dispatch group alert',
      });
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#16181D] border border-[#2D3139] rounded-xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col my-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-[#0A0B0E] p-4 sm:p-5 border-b border-[#2D3139] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-md">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>WhatsApp Group Outage Broadcaster</span>
                <span className="px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono border border-emerald-500/30">
                  ONE-CLICK DISPATCH
                </span>
              </h2>
              <p className="text-xs text-gray-400">
                Type your WhatsApp Group Name and instantly dispatch all offline equipment details
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#16181D] hover:bg-[#1E2229] text-gray-400 hover:text-white border border-[#2D3139] transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto max-h-[72vh]">
          
          {/* Offline Devices Status Banner */}
          <div className={`p-3.5 rounded-lg border flex flex-wrap items-center justify-between gap-3 text-xs ${
            offlineDevices.length > 0 
              ? 'bg-red-950/40 border-red-500/50 text-red-200' 
              : 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
          }`}>
            <div className="flex items-center space-x-2.5">
              {offlineDevices.length > 0 ? (
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 animate-pulse" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              )}
              <div>
                <strong className="text-white text-sm">
                  {offlineDevices.length > 0
                    ? `${offlineDevices.length} Equipment Currently OFFLINE`
                    : 'All Monitored Equipment Online'}
                </strong>
                <div className="text-[11px] opacity-80 mt-0.5">
                  {offlineDevices.length > 0
                    ? 'These devices will be automatically compiled into your WhatsApp group outage report.'
                    : `All ${devices.length} nodes across 6 campuses are healthy. You can still broadcast an all-systems-operational report.`}
                </div>
              </div>
            </div>

            {offlineDevices.length === 0 && onToggleDevicePower && (
              <button
                onClick={() => {
                  const targetDev = devices.find((d) => d.status === 'online');
                  if (targetDev) onToggleDevicePower(targetDev.id);
                }}
                className="px-2.5 py-1 rounded bg-[#16181D] hover:bg-[#1E2229] text-amber-300 border border-amber-500/40 text-[11px] font-semibold transition cursor-pointer"
                title="Toggle a device offline to test outage dispatch"
              >
                Test: Simulate 1 Offline Device
              </button>
            )}
          </div>

          {/* Input: WhatsApp Group Name */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                <span>WhatsApp Group Name (Just Write Group Name):</span>
              </span>
              <span className="text-[11px] font-normal text-gray-500">Auto-saved for future alerts</span>
            </label>
            <div className="relative">
              <input
                id="whatsapp-group-name-input"
                type="text"
                value={groupName}
                onChange={(e) => handleGroupNameChange(e.target.value)}
                placeholder="e.g. IUB NOC Engineers Group, Network Outages, IT Core Staff"
                className="w-full px-3.5 py-2.5 bg-[#0A0B0E] border border-[#2D3139] rounded-lg text-sm text-white placeholder-gray-500 font-semibold focus:outline-none focus:border-emerald-500 transition"
              />
              <div className="absolute right-3 top-2.5 text-[11px] font-mono text-emerald-400">
                ✓ Active Group
              </div>
            </div>
            <p className="text-[11px] text-gray-500">
              When you click send, WhatsApp will open with this message ready to share directly to <strong>{groupName || 'your group'}</strong>.
            </p>
          </div>

          {/* Input: Optional Incident Note */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-400">
              Optional Incident Note / Cause:
            </label>
            <input
              type="text"
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              placeholder="e.g. Fiber splice work in progress, Main power failure at CS Block, Heavy rain"
              className="w-full px-3 py-2 bg-[#0A0B0E] border border-[#2D3139] rounded-lg text-xs text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Live Compiled Message Preview */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-gray-400 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                <span>WhatsApp Message Preview:</span>
              </span>
              <button
                onClick={handleCopyMessage}
                className="flex items-center space-x-1 text-[11px] text-emerald-400 hover:text-emerald-300 transition cursor-pointer font-medium"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied to Clipboard!' : 'Copy Text'}</span>
              </button>
            </div>

            <div className="bg-[#0A0B0E] border border-[#2D3139] rounded-lg p-3.5 text-xs font-mono text-gray-300 max-h-56 overflow-y-auto whitespace-pre-wrap leading-relaxed shadow-inner">
              {messageText}
            </div>
          </div>

          {/* Dispatch Feedback Banner */}
          {dispatchResult && (
            <div className={`p-3 rounded-lg border text-xs space-y-1 ${
              dispatchResult.success
                ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                : 'bg-red-950/40 border-red-500/50 text-red-300'
            }`}>
              {dispatchResult.success ? (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    <strong>Dispatched!</strong> Logged in NOC Audit Feed with ID: <code className="bg-black/40 px-1 rounded">{dispatchResult.alertId}</code>. WhatsApp tab launched!
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{dispatchResult.error}</span>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="bg-[#0A0B0E] px-5 py-3.5 border-t border-[#2D3139] flex flex-wrap items-center justify-between gap-3">
          <div className="text-[11px] text-gray-500 flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>Target: <strong className="text-gray-300">{groupName || 'NOC Group'}</strong></span>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              onClick={handleCopyMessage}
              className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-[#16181D] hover:bg-[#1E2229] text-gray-300 text-xs font-medium border border-[#2D3139] transition cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Message'}</span>
            </button>

            <button
              id="send-whatsapp-group-btn"
              onClick={handleSendToGroup}
              disabled={isSending || !groupName.trim()}
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/50 transition cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSending ? 'Launching WhatsApp...' : 'Send to WhatsApp Group'}</span>
              <ExternalLink className="w-3 h-3 opacity-70" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
