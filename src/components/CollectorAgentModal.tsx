import React, { useState, useEffect } from 'react';
import { 
  X, 
  Terminal, 
  Key, 
  Copy, 
  Check, 
  Plus, 
  Trash2, 
  Server, 
  Radio, 
  ShieldCheck, 
  FileCode, 
  AlertCircle 
} from 'lucide-react';
import { CollectorToken } from '../types.ts';
import { fetchCollectorTokens, createCollectorToken, revokeCollectorToken, fetchCollectorSnippets } from '../api.ts';

interface CollectorAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CollectorAgentModal: React.FC<CollectorAgentModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [tokens, setTokens] = useState<CollectorToken[]>([]);
  const [snippets, setSnippets] = useState<{ curl: string; python: string; bash: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'tokens' | 'curl' | 'python' | 'bash'>('tokens');
  const [newTokenName, setNewTokenName] = useState('');
  const [newCampus, setNewCampus] = useState('ALL');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [toks, snips] = await Promise.all([
        fetchCollectorTokens(),
        fetchCollectorSnippets(),
      ]);
      setTokens(toks);
      setSnippets(snips);
    } catch (err) {
      console.error('Failed to load collector data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTokenName.trim()) return;
    try {
      const created = await createCollectorToken(newTokenName, newCampus);
      setTokens((prev) => [...prev, created]);
      setNewTokenName('');
    } catch (err) {
      console.error('Failed to create token:', err);
    }
  };

  const handleRevoke = async (id: string) => {
    try {
      await revokeCollectorToken(id);
      setTokens((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      console.error('Failed to revoke token:', err);
    }
  };

  const copyToClipboard = (text: string, keyId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyId);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#111317] border border-[#2D3139] rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-scaleIn font-sans">
        
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-[#141820] to-[#1A202C] border-b border-[#2D3139] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-950/80 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <Server className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                <span>Network Collector & Agent Integration</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-700/50">
                  Active Watchdog (60s Timeout)
                </span>
              </h2>
              <p className="text-xs text-gray-400 font-mono mt-0.5">
                Ingest real CPU, RAM, Latency, Bandwidth and Uptime metrics from Linux servers & routers.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-[#1C2028] hover:bg-[#252A34] text-gray-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-4 py-2 bg-[#0D0F14] border-b border-[#222732] flex items-center space-x-2 text-xs">
          <button
            onClick={() => setActiveTab('tokens')}
            className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'tokens' ? 'bg-blue-600 text-white font-bold' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>Authorized Tokens ({tokens.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('curl')}
            className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'curl' ? 'bg-blue-600 text-white font-bold' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>cURL Payload</span>
          </button>
          <button
            onClick={() => setActiveTab('python')}
            className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'python' ? 'bg-blue-600 text-white font-bold' : 'text-gray-400 hover:text-white'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Python Daemon</span>
          </button>
          <button
            onClick={() => setActiveTab('bash')}
            className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'bash' ? 'bg-blue-600 text-white font-bold' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Bash Script</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-4 flex-1 overflow-y-auto space-y-4">
          {activeTab === 'tokens' && (
            <div className="space-y-4">
              {/* Create New Token Form */}
              <form onSubmit={handleCreateToken} className="p-3 bg-[#151922] border border-[#272D3B] rounded-xl flex flex-wrap gap-2 items-end">
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-[11px] text-gray-300 font-semibold mb-1">Agent / Server Name</label>
                  <input
                    type="text"
                    value={newTokenName}
                    onChange={(e) => setNewTokenName(e.target.value)}
                    placeholder="e.g. BJC-Faculty-Server-01"
                    className="w-full px-3 py-1.5 bg-[#0D0F14] border border-[#2D3139] rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="w-40">
                  <label className="block text-[11px] text-gray-300 font-semibold mb-1">Campus Scope</label>
                  <select
                    value={newCampus}
                    onChange={(e) => setNewCampus(e.target.value)}
                    className="w-full px-3 py-1.5 bg-[#0D0F14] border border-[#2D3139] rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="ALL">All Campuses</option>
                    <option value="BJC">BJC Main Campus</option>
                    <option value="OLD">Abbasia (Old)</option>
                    <option value="RAILWAY">Railway</option>
                    <option value="RYK">Rahim Yar Khan</option>
                    <option value="BWN">Bahawalnagar</option>
                    <option value="LQT">Liaquatpur</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={!newTokenName.trim()}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition cursor-pointer disabled:opacity-40 flex items-center gap-1 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Generate Token</span>
                </button>
              </form>

              {/* Tokens List */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wide">Active Collector Tokens</h3>
                {tokens.map((tok) => (
                  <div key={tok.id} className="p-3 bg-[#13161D] border border-[#232834] rounded-xl flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-white">{tok.name}</span>
                        <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-blue-950 text-blue-300 border border-blue-800/40">
                          {tok.campus}
                        </span>
                        <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" /> Valid
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 text-xs font-mono text-gray-400">
                        <span className="bg-[#0A0C10] px-2 py-1 rounded border border-[#222732] text-amber-300 select-all">
                          {tok.token}
                        </span>
                        <button
                          onClick={() => copyToClipboard(tok.token, tok.id)}
                          className="p-1 rounded hover:bg-[#1E232D] text-gray-400 hover:text-white transition cursor-pointer"
                          title="Copy Token"
                        >
                          {copiedKey === tok.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={() => handleRevoke(tok.id)}
                      className="p-2 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-400 hover:text-red-300 border border-red-800/30 text-xs transition cursor-pointer"
                      title="Revoke Token"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Watchdog Notice */}
              <div className="p-3 bg-[#141822] border border-blue-900/40 rounded-xl text-xs text-blue-200 flex items-start space-x-2.5">
                <AlertCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-white">Graceful Disconnection & Watchdog Handling:</p>
                  <p className="text-gray-300 leading-relaxed text-[11px]">
                    The IUB NOC Watchdog continuously tracks heartbeats. When an external collector agent sends metrics, its <code>lastSeen</code> is recorded. If a server stops reporting for more than <strong>60 seconds</strong>, the system gracefully marks it <strong>OFFLINE</strong> and dispatches an alert without crashing or dropping connection.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'curl' && snippets && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-300">Run from Terminal / Command Line:</span>
                <button
                  onClick={() => copyToClipboard(snippets.curl, 'curl')}
                  className="px-2.5 py-1 rounded bg-[#1C2028] hover:bg-[#252A34] text-xs text-gray-300 hover:text-white flex items-center gap-1"
                >
                  {copiedKey === 'curl' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>Copy cURL</span>
                </button>
              </div>
              <pre className="p-3 bg-[#0A0B0E] border border-[#222732] rounded-xl text-xs font-mono text-emerald-300 overflow-x-auto">
                {snippets.curl}
              </pre>
            </div>
          )}

          {activeTab === 'python' && snippets && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-300">Run as background service: <code>pip install psutil requests</code></span>
                <button
                  onClick={() => copyToClipboard(snippets.python, 'python')}
                  className="px-2.5 py-1 rounded bg-[#1C2028] hover:bg-[#252A34] text-xs text-gray-300 hover:text-white flex items-center gap-1"
                >
                  {copiedKey === 'python' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>Copy Python Agent</span>
                </button>
              </div>
              <pre className="p-3 bg-[#0A0B0E] border border-[#222732] rounded-xl text-xs font-mono text-cyan-300 overflow-x-auto max-h-80">
                {snippets.python}
              </pre>
            </div>
          )}

          {activeTab === 'bash' && snippets && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-300">Lightweight Bash Cron / Daemon:</span>
                <button
                  onClick={() => copyToClipboard(snippets.bash, 'bash')}
                  className="px-2.5 py-1 rounded bg-[#1C2028] hover:bg-[#252A34] text-xs text-gray-300 hover:text-white flex items-center gap-1"
                >
                  {copiedKey === 'bash' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>Copy Bash Script</span>
                </button>
              </div>
              <pre className="p-3 bg-[#0A0B0E] border border-[#222732] rounded-xl text-xs font-mono text-amber-300 overflow-x-auto">
                {snippets.bash}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#0A0B0E] border-t border-[#222732] flex items-center justify-between text-xs text-gray-400">
          <span className="font-mono text-[10px] text-gray-500">
            Endpoint: /api/collector/report &bull; Protocol: REST / JSON / Bearer Auth
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-white text-xs font-medium transition cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
