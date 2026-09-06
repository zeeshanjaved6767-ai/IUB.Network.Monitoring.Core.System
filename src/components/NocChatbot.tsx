import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  X, 
  Send, 
  Trash2, 
  Minimize2, 
  Maximize2, 
  Sparkles, 
  Terminal, 
  Copy, 
  Check, 
  AlertCircle,
  ExternalLink,
  ChevronDown,
  Globe, 
  MapPin, 
  Cpu, 
  Zap, 
  Layers, 
  Radio,
  Shield,
  Thermometer,
  Cable,
  Download,
  RotateCcw,
  ArrowDown
} from 'lucide-react';
import Markdown from 'react-markdown';
import { Device } from '../types.ts';

export type ChatbotRole = 'noc_lead' | 'security_analyst' | 'hardware_specialist' | 'fiber_engineer';
export type ModelChoice = 'auto' | 'gemini-3.5-flash' | 'gemini-3.1-flash-lite' | 'gemini-3.1-pro-preview';

interface GroundingSourceWeb {
  title: string;
  uri: string;
}

interface GroundingSourceMap {
  title: string;
  uri: string;
  snippet?: string;
}

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  modelUsed?: string;
  roleUsed?: ChatbotRole;
  groundingType?: 'search' | 'maps' | 'none';
  searchSources?: GroundingSourceWeb[];
  mapSources?: GroundingSourceMap[];
  timestamp: string;
}

interface NocChatbotProps {
  isOpen: boolean;
  onClose: () => void;
  devices: Device[];
  onOpenDevice?: (device: Device) => void;
  initialPrompt?: string;
}

const ROLE_INFO: Record<ChatbotRole, { title: string; short: string; icon: any; color: string; desc: string }> = {
  noc_lead: {
    title: 'Lead NOC Operations & Network Architect',
    short: 'NOC Lead',
    icon: Shield,
    color: 'emerald',
    desc: 'Multi-campus core routing, BGP/OSPF, device health & switch port mapping',
  },
  security_analyst: {
    title: 'Lead SOC Cyber Defense & Threat Analyst',
    short: 'SOC Security',
    icon: AlertCircle,
    color: 'red',
    desc: 'Suricata/Wazuh alerts, rogue AP/DHCP, firewall ACLs & CVE mitigation',
  },
  hardware_specialist: {
    title: 'Data Center Hardware & Thermal Specialist',
    short: 'Hardware & DC',
    icon: Thermometer,
    color: 'amber',
    desc: 'Rack temperatures (18-27°C), PWM fan RPM, dual PSUs & UPS runtimes',
  },
  fiber_engineer: {
    title: 'Optical Fiber Transport & Traffic Engineer',
    short: 'Fiber & Traffic',
    icon: Cable,
    color: 'blue',
    desc: '148-core fiber backbone, OTDR dBm attenuation & bandwidth threshold rules',
  },
};

const QUICK_PROMPTS = [
  {
    label: '🔴 Offline Devices & Off Time',
    text: 'please show who devices will off at this time',
    modelHint: 'gemini-3.5-flash' as ModelChoice,
  },
  {
    label: '⚡ Fast Check: Gateways Latency',
    text: 'Check current latency and online status of all 6 campus core gateways (BJC, Old, Railway, RYK, BWN, LQT).',
    modelHint: 'gemini-3.1-flash-lite' as ModelChoice,
  },
  {
    label: '🔍 Offline Devices & Switch Ports',
    text: 'Which network equipment are currently offline? Provide their exact switch model, switch port, and room location.',
    modelHint: 'gemini-3.5-flash' as ModelChoice,
  },
  {
    label: '🧠 Pro: Complex VLAN & Core Topology',
    text: 'Perform a comprehensive complex topology diagnostic of the BJC Main Campus Core network: evaluate VLAN segmentation, SFP+ 40G uplinks, and redundant gateway failover.',
    modelHint: 'gemini-3.1-pro-preview' as ModelChoice,
  },
  {
    label: '🔒 SOC: Recent Intrusion & CVE Audit',
    text: 'Analyze recent Suricata IDS/IPS and Wazuh SIEM security logs. Are there any rogue DHCP servers, ARP poisoning, or brute force SSH attacks on campus?',
    modelHint: 'gemini-3.5-flash' as ModelChoice,
    roleHint: 'security_analyst' as ChatbotRole,
  },
  {
    label: '🌡️ Hardware: Server Rack Thermals & Dual PSU',
    text: 'Check hardware health across all campus server rooms: are ambient temperatures within the 18°C-27°C safe zone and dual PSUs actively balanced?',
    modelHint: 'gemini-3.5-flash' as ModelChoice,
    roleHint: 'hardware_specialist' as ChatbotRole,
  },
  {
    label: '📍 Maps: Abbasia to Railway Distance & Fiber Route',
    text: 'Where is Abbasia (Old) Campus located in Bahawalpur on Google Maps, and what is the physical distance and fiber route to Railway Campus?',
    modelHint: 'gemini-3.5-flash' as ModelChoice,
  },
];

export const NocChatbot: React.FC<NocChatbotProps> = ({
  isOpen,
  onClose,
  devices,
  onOpenDevice,
  initialPrompt,
}) => {
  const [selectedRole, setSelectedRole] = useState<ChatbotRole>('noc_lead');
  const [selectedModel, setSelectedModel] = useState<ModelChoice>('gemini-3.5-flash');
  const [selectedTool, setSelectedTool] = useState<'auto' | 'search' | 'maps' | 'none'>('auto');
  const [selectedCampus, setSelectedCampus] = useState<'BJC' | 'OLD' | 'RAILWAY' | 'RYK' | 'BWN' | 'LQT'>('BJC');
  const [showConfig, setShowConfig] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const sentInitialPromptRef = useRef<string | null>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      text: `Assalam-o-Alaikum & Welcome to **IUB NOC Network Copilot**! 🏛️⚡\n\nI am your real-time AI assistant for **The Islamia University of Bahawalpur** network infrastructure, supervised by **Mr. Zeeshan Javed (AI Lead Engineer)**.\n\n### 🚀 Multi-Turn Gemini AI System Capabilities:\n- **Selected Role**: **${ROLE_INFO.noc_lead.title}**\n- **Live Multi-Campus Telemetry**: Connected to all **${devices.length} monitored devices** across **6 campuses**.\n- **Optimized Gemini Models**:\n  - \`gemini-3.5-flash\` for general monitoring & real-time grounding (Default)\n  - \`gemini-3.1-flash-lite\` for fast latency & instant status queries\n  - \`gemini-3.1-pro-preview\` for complex architectural diagnostics & calculations\n- **Grounding Tools**: Real-time **Google Search** (CVE advisories) & **Google Maps** (campus locations).\n\nAap mujh se **English, Urdu, ya Roman Urdu** mein koi bhi sawal pooch saktay hain!`,
      modelUsed: 'gemini-3.5-flash',
      roleUsed: 'noc_lead',
      groundingType: 'none',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
      inputRef.current?.focus();
    }
  }, [messages, isOpen, isMinimized]);

  useEffect(() => {
    if (isOpen && initialPrompt && sentInitialPromptRef.current !== initialPrompt) {
      sentInitialPromptRef.current = initialPrompt;
      handleSend(initialPrompt);
    }
  }, [isOpen, initialPrompt]);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const isUp = scrollHeight - scrollTop - clientHeight > 100;
    setShowScrollBottom(isUp);
  };

  if (!isOpen) return null;

  const handleSend = async (userText?: string, overrideModel?: ModelChoice, overrideRole?: ChatbotRole) => {
    const textToSend = userText || input.trim();
    if (!textToSend || isLoading) return;

    const activeModel = overrideModel || selectedModel;
    const activeRole = overrideRole || selectedRole;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Build conversation history excluding initial welcome
      const historyPayload = messages
        .filter((m) => m.id !== 'welcome')
        .map((m) => ({
          role: m.role,
          text: m.text,
        }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          history: historyPayload,
          modelPreference: activeModel === 'auto' ? undefined : activeModel,
          chatbotRole: activeRole,
          toolMode: selectedTool,
          selectedCampus,
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: Failed to communicate with IUB Copilot.`);
      }

      const data = await res.json();
      const botMessage: Message = {
        id: `model-${Date.now()}`,
        role: 'model',
        text: data.reply || 'No response returned from IUB AI Copilot.',
        modelUsed: data.modelUsed,
        roleUsed: data.roleUsed || activeRole,
        groundingType: data.groundingType,
        searchSources: data.searchSources,
        mapSources: data.mapSources,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err: any) {
      console.warn('Chat notice:', err);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'model',
        text: `⚠️ **Connection Notice**: ${err.message || 'Unable to contact server'}.\n\n*Real-time telemetry fallback is active.*`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = (role: ChatbotRole) => {
    setSelectedRole(role);
    const info = ROLE_INFO[role];
    const roleNotification: Message = {
      id: `role-switch-${Date.now()}`,
      role: 'model',
      text: `🔄 **Switched Role to ${info.title}**\n\n*${info.desc}*\n\nAsk me any role-specific question!`,
      modelUsed: selectedModel,
      roleUsed: role,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, roleNotification]);
  };

  const handleClearHistory = () => {
    if (window.confirm('Clear current multi-turn conversation thread?')) {
      const currentRoleInfo = ROLE_INFO[selectedRole];
      setMessages([
        {
          id: `welcome-${Date.now()}`,
          role: 'model',
          text: `Conversation thread refreshed.\n\nActive Role: **${currentRoleInfo.title}**\nModel: \`${selectedModel}\`\n\nHow can I assist you with IUB network operations?`,
          modelUsed: selectedModel,
          roleUsed: selectedRole,
          groundingType: 'none',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  };

  const handleExportTranscript = () => {
    const transcript = messages
      .map((m) => `[${m.timestamp}] ${m.role === 'user' ? 'USER' : `IUB AI (${m.roleUsed || 'NOC'} / ${m.modelUsed || 'Gemini'})`}:\n${m.text}\n`)
      .join('\n---\n\n');
    const blob = new Blob([transcript], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `iub-noc-chat-transcript-${new Date().toISOString().slice(0, 10)}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const activeRoleInfo = ROLE_INFO[selectedRole];

  return (
    <div 
      id="iub-noc-chatbot-container"
      className={`fixed bottom-5 right-5 z-50 transition-all duration-300 ${
        isMinimized ? 'w-80 h-14' : 'w-[95vw] sm:w-[540px] md:w-[600px] h-[700px] max-h-[90vh]'
      } flex flex-col bg-[#0A0B0E] border border-emerald-500/40 rounded-2xl shadow-2xl overflow-hidden font-sans backdrop-blur-md`}
    >
      {/* Copilot Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-[#11141A] to-[#161B22] border-b border-[#2D3139] flex items-center justify-between shrink-0 select-none">
        <div className="flex items-center space-x-2.5">
          <div className="relative">
            <div className="w-8 h-8 rounded-lg bg-emerald-950/80 border border-emerald-500/50 flex items-center justify-center text-emerald-400 shadow-md shadow-emerald-950">
              <Bot className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#0A0B0E] animate-pulse"></span>
          </div>

          <div>
            <div className="flex items-center space-x-1.5">
              <h3 className="text-xs font-bold text-white tracking-wide flex items-center gap-1.5">
                <span>IUB NOC AI Copilot</span>
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-700/40">
                  {selectedModel === 'gemini-3.1-pro-preview' ? '3.1 PRO' : selectedModel === 'gemini-3.1-flash-lite' ? '3.1 LITE' : selectedModel === 'auto' ? 'AUTO' : '3.5 FLASH'}
                </span>
              </h3>
            </div>
            <p className="text-[10px] text-gray-400 font-mono flex items-center gap-1">
              <span className="text-emerald-300 font-semibold">{activeRoleInfo.short}</span>
              <span className="text-gray-600">&bull;</span>
              <span className="text-gray-300">Zeeshan Javed AI Lead</span>
              <span className="text-gray-600">&bull;</span>
              <span className="text-emerald-400 flex items-center gap-0.5">
                <Radio className="w-2.5 h-2.5 animate-pulse" />
                <span>Live</span>
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1">
          {!isMinimized && (
            <>
              <button
                id="chatbot-config-toggle-btn"
                onClick={() => setShowConfig(!showConfig)}
                title="Model, Role & Grounding Settings"
                className={`p-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1 ${
                  showConfig ? 'bg-emerald-950 text-emerald-300 border border-emerald-600/40' : 'text-gray-400 hover:text-white hover:bg-[#1F242C]'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
              </button>

              <button
                id="chatbot-export-btn"
                onClick={handleExportTranscript}
                title="Export conversation transcript"
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#1F242C] transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
              </button>

              <button
                id="chatbot-clear-btn"
                onClick={handleClearHistory}
                title="Clear thread history"
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#1F242C] transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          <button
            id="chatbot-minimize-btn"
            onClick={() => setIsMinimized(!isMinimized)}
            title={isMinimized ? 'Expand' : 'Minimize'}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#1F242C] transition cursor-pointer"
          >
            {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
          </button>

          <button
            id="chatbot-close-btn"
            onClick={onClose}
            title="Close chatbot"
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#1F242C] transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {!isMinimized && (
        <>
          {/* Quick Role Selector Bar */}
          <div className="px-3 py-1.5 bg-[#0F1117] border-b border-[#222630] flex items-center justify-between gap-1 overflow-x-auto scrollbar-none text-[10px] shrink-0">
            <span className="text-gray-400 font-mono shrink-0 flex items-center gap-1 mr-1">
              <span>Role:</span>
            </span>
            <div className="flex items-center space-x-1 shrink-0">
              {(Object.keys(ROLE_INFO) as ChatbotRole[]).map((r) => {
                const info = ROLE_INFO[r];
                const Icon = info.icon;
                const isActive = selectedRole === r;
                return (
                  <button
                    key={r}
                    onClick={() => handleRoleChange(r)}
                    className={`px-2 py-0.5 rounded-full flex items-center space-x-1 transition cursor-pointer font-medium ${
                      isActive 
                        ? 'bg-emerald-600 text-white font-bold shadow-sm shadow-emerald-950' 
                        : 'bg-[#181B22] text-gray-400 hover:text-gray-200 hover:bg-[#20242E]'
                    }`}
                    title={info.desc}
                  >
                    <Icon className="w-2.5 h-2.5" />
                    <span>{info.short}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Configuration Drawer */}
          {showConfig && (
            <div className="p-3 bg-[#11141A] border-b border-[#2D3139] text-xs text-gray-300 space-y-2.5 animate-fadeIn shrink-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                <span className="font-semibold text-white flex items-center gap-1">
                  <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Gemini Model:</span>
                </span>
                <div className="flex flex-wrap items-center gap-1">
                  <button
                    onClick={() => setSelectedModel('gemini-3.5-flash')}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono transition cursor-pointer ${
                      selectedModel === 'gemini-3.5-flash'
                        ? 'bg-emerald-600 text-white font-bold'
                        : 'bg-[#1C2028] text-gray-400 hover:text-white'
                    }`}
                    title="gemini-3.5-flash for general tasks and live grounding"
                  >
                    3.5 Flash (General)
                  </button>
                  <button
                    onClick={() => setSelectedModel('gemini-3.1-flash-lite')}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono transition cursor-pointer ${
                      selectedModel === 'gemini-3.1-flash-lite'
                        ? 'bg-amber-600 text-white font-bold'
                        : 'bg-[#1C2028] text-gray-400 hover:text-white'
                    }`}
                    title="gemini-3.1-flash-lite for tasks that should happen fast"
                  >
                    3.1 Lite (Fast)
                  </button>
                  <button
                    onClick={() => setSelectedModel('gemini-3.1-pro-preview')}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono transition cursor-pointer ${
                      selectedModel === 'gemini-3.1-pro-preview'
                        ? 'bg-purple-600 text-white font-bold'
                        : 'bg-[#1C2028] text-gray-400 hover:text-white'
                    }`}
                    title="gemini-3.1-pro-preview for particularly complex tasks & deep diagnostics"
                  >
                    3.1 Pro (Complex)
                  </button>
                  <button
                    onClick={() => setSelectedModel('auto')}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono transition cursor-pointer ${
                      selectedModel === 'auto'
                        ? 'bg-blue-600 text-white font-bold'
                        : 'bg-[#1C2028] text-gray-400 hover:text-white'
                    }`}
                    title="Auto-select based on prompt complexity"
                  >
                    Auto
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-semibold text-white flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5 text-blue-400" />
                  <span>Grounding Tool:</span>
                </span>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => setSelectedTool('auto')}
                    className={`px-2 py-0.5 rounded text-[10px] transition cursor-pointer ${
                      selectedTool === 'auto'
                        ? 'bg-blue-600 text-white font-bold'
                        : 'bg-[#1C2028] text-gray-400 hover:text-white'
                    }`}
                  >
                    Auto Detect
                  </button>
                  <button
                    onClick={() => setSelectedTool('search')}
                    className={`px-2 py-0.5 rounded text-[10px] transition cursor-pointer ${
                      selectedTool === 'search'
                        ? 'bg-blue-600 text-white font-bold'
                        : 'bg-[#1C2028] text-gray-400 hover:text-white'
                    }`}
                  >
                    Google Search
                  </button>
                  <button
                    onClick={() => setSelectedTool('maps')}
                    className={`px-2 py-0.5 rounded text-[10px] transition cursor-pointer ${
                      selectedTool === 'maps'
                        ? 'bg-blue-600 text-white font-bold'
                        : 'bg-[#1C2028] text-gray-400 hover:text-white'
                    }`}
                  >
                    Google Maps
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-semibold text-white flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-red-400" />
                  <span>Campus Location:</span>
                </span>
                <select
                  value={selectedCampus}
                  onChange={(e) => setSelectedCampus(e.target.value as any)}
                  className="px-2 py-1 rounded bg-[#1C2028] border border-[#2D3139] text-[10px] text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="BJC">BJC: Baghdad-ul-Jadeed Campus (Main)</option>
                  <option value="OLD">OLD: Abbasia (Old) Campus</option>
                  <option value="RAILWAY">RAILWAY: Railway Campus</option>
                  <option value="RYK">RYK: Rahim Yar Khan Sub-Campus</option>
                  <option value="BWN">BWN: Bahawalnagar Sub-Campus</option>
                  <option value="LQT">LQT: Liaquatpur Sub-Campus</option>
                </select>
              </div>

              <div className="pt-1 text-[10px] text-gray-400 border-t border-[#222630] flex items-center justify-between">
                <span>Active Role: <strong className="text-white">{activeRoleInfo.title}</strong></span>
                <span className="text-emerald-400 font-mono">Telemetry: Live</span>
              </div>
            </div>
          )}

          {/* Messages Scroll Area */}
          <div 
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto p-4 space-y-4 text-xs bg-[#0A0B0E] relative"
          >
            {messages.map((m) => {
              const isUser = m.role === 'user';
              const roleTag = m.roleUsed ? ROLE_INFO[m.roleUsed]?.short : activeRoleInfo.short;

              return (
                <div
                  key={m.id}
                  className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  {!isUser && (
                    <div className="w-7 h-7 rounded-lg bg-[#16181D] border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5 shadow-sm">
                      <Bot className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                  )}

                  <div className={`group relative max-w-[88%] rounded-xl px-3.5 py-2.5 leading-relaxed ${
                    isUser 
                      ? 'bg-emerald-600 text-white font-medium rounded-tr-none shadow-md shadow-emerald-950/50' 
                      : 'bg-[#14161C] text-gray-200 border border-[#2D3139] rounded-tl-none shadow-sm'
                  }`}>
                    {/* Role Header & Tags */}
                    <div className="flex items-center justify-between gap-4 mb-1.5 text-[10px] text-gray-400">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-semibold text-gray-300">
                          {isUser ? 'You' : `IUB AI (${roleTag})`}
                        </span>
                        {!isUser && m.modelUsed && (
                          <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-black/40 text-emerald-400 border border-emerald-800/30">
                            {m.modelUsed}
                          </span>
                        )}
                        {!isUser && m.groundingType === 'search' && (
                          <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-blue-950/70 text-blue-300 border border-blue-800/40 flex items-center gap-0.5">
                            <Globe className="w-2.5 h-2.5" /> Search
                          </span>
                        )}
                        {!isUser && m.groundingType === 'maps' && (
                          <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-red-950/70 text-red-300 border border-red-800/40 flex items-center gap-0.5">
                            <MapPin className="w-2.5 h-2.5" /> Maps
                          </span>
                        )}
                      </div>
                      <span className="text-[9px] text-gray-500 font-mono">{m.timestamp}</span>
                    </div>

                    {/* Content */}
                    <div className="markdown-body space-y-1.5 break-words">
                      <Markdown>{m.text}</Markdown>
                    </div>

                    {/* Google Search Grounding Sources */}
                    {!isUser && m.searchSources && m.searchSources.length > 0 && (
                      <div className="mt-3 pt-2 border-t border-[#252A34] text-[10px]">
                        <p className="font-semibold text-gray-400 flex items-center gap-1 mb-1.5">
                          <Globe className="w-3 h-3 text-blue-400" />
                          <span>Google Search Sources:</span>
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {m.searchSources.map((source, sIdx) => (
                            <a
                              key={sIdx}
                              href={source.uri}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 px-2 py-1 rounded bg-[#1A1E26] hover:bg-[#252C38] text-blue-300 hover:text-blue-200 border border-blue-900/40 transition"
                            >
                              <span className="truncate max-w-[200px]">{source.title}</span>
                              <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Google Maps Grounding Sources */}
                    {!isUser && m.mapSources && m.mapSources.length > 0 && (
                      <div className="mt-3 pt-2 border-t border-[#252A34] text-[10px]">
                        <p className="font-semibold text-gray-400 flex items-center gap-1 mb-1.5">
                          <MapPin className="w-3 h-3 text-red-400" />
                          <span>Google Maps Grounded Locations:</span>
                        </p>
                        <div className="space-y-1.5">
                          {m.mapSources.map((mapItem, mIdx) => (
                            <a
                              key={mIdx}
                              href={mapItem.uri}
                              target="_blank"
                              rel="noreferrer"
                              className="block p-2 rounded-lg bg-[#1A1E26] hover:bg-[#252C38] border border-red-900/30 text-gray-200 hover:text-white transition group/map"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-red-300 group-hover/map:underline flex items-center gap-1">
                                  <span>{mapItem.title}</span>
                                </span>
                                <ExternalLink className="w-3 h-3 text-gray-400 group-hover/map:text-white shrink-0" />
                              </div>
                              {mapItem.snippet && (
                                <p className="text-[10px] text-gray-400 mt-1 line-clamp-2">
                                  {mapItem.snippet}
                                </p>
                              )}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Copy Button */}
                    {!isUser && (
                      <button
                        onClick={() => handleCopy(m.id, m.text)}
                        className="opacity-0 group-hover:opacity-100 transition absolute top-2 right-2 p-1 rounded bg-[#1F242C] text-gray-400 hover:text-white"
                        title="Copy message"
                      >
                        {copiedId === m.id ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#16181D] border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-sm animate-pulse">
                  <Bot className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div className="bg-[#14161C] border border-[#2D3139] rounded-xl rounded-tl-none px-4 py-3 flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce"></span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.4s]"></span>
                  <span className="text-[11px] text-gray-400 font-mono ml-2">
                    Querying live telemetry & {selectedModel === 'auto' ? 'Gemini 3.5' : selectedModel}...
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />

            {/* Scroll to Bottom Button */}
            {showScrollBottom && (
              <button
                onClick={() => scrollToBottom('smooth')}
                className="absolute bottom-3 right-5 z-20 p-2 rounded-full bg-emerald-600 text-white shadow-lg hover:bg-emerald-500 transition cursor-pointer"
                title="Scroll to latest message"
              >
                <ArrowDown className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Prompts Carousel */}
          <div className="px-3 py-2 bg-[#111317] border-t border-[#222630] overflow-x-auto scrollbar-none flex items-center space-x-2 shrink-0">
            {QUICK_PROMPTS.map((item, i) => (
              <button
                key={i}
                onClick={() => handleSend(item.text, item.modelHint, item.roleHint)}
                disabled={isLoading}
                className="whitespace-nowrap px-2.5 py-1 rounded-full bg-[#1A1D24] hover:bg-[#252A34] text-gray-300 hover:text-emerald-400 border border-[#2D3139] text-[10px] font-medium transition cursor-pointer shrink-0 disabled:opacity-50 flex items-center space-x-1"
              >
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          {/* Input Box */}
          <div className="p-3 bg-[#14161C] border-t border-[#2D3139] shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={`Ask ${activeRoleInfo.short}: Offline devices, BJC core routing, hardware thermals...`}
                disabled={isLoading}
                className="flex-1 px-3.5 py-2 bg-[#0A0B0E] border border-[#2D3139] rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 font-medium transition"
              />

              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-emerald-950/60 shrink-0"
                title="Send Message (Enter)"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

            <div className="flex items-center justify-between text-[9px] text-gray-500 mt-1.5 px-1 font-mono">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Role: {activeRoleInfo.short} | Multiturn History Active</span>
              </span>
              <span>Models: gemini-3.5-flash &bull; 3.1-flash-lite &bull; 3.1-pro-preview</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
