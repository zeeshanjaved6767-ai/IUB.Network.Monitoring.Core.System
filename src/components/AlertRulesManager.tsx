import React, { useState } from 'react';
import { 
  Filter, 
  Plus, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  AlertOctagon, 
  MessageSquare, 
  Mail, 
  Power, 
  Play, 
  ShieldAlert, 
  Check, 
  X, 
  Info,
  Server,
  MapPin,
  Clock,
  Zap,
  Activity,
  Gauge
} from 'lucide-react';
import { AlertRule, DeviceType, CampusId, BandwidthThresholdConfig } from '../types.ts';

interface AlertRulesManagerProps {
  rules: AlertRule[];
  onCreateRule: (data: Omit<AlertRule, 'id' | 'createdAt' | 'triggeredCount'>) => Promise<void>;
  onUpdateRule: (id: string, data: Partial<AlertRule>) => Promise<void>;
  onDeleteRule: (id: string) => Promise<void>;
  onToggleRule: (id: string) => Promise<void>;
}

const ALL_DEVICE_TYPES: { id: DeviceType; label: string }[] = [
  { id: 'router', label: 'Core / Edge Router' },
  { id: 'switch', label: 'Core / Access Switch' },
  { id: 'access_point', label: 'Wi-Fi Access Point' },
  { id: 'ip_phone', label: 'IP Phone / VoIP Gateway' },
  { id: 'camera', label: 'Surveillance IP Camera' },
  { id: 'rack', label: '42U Server Rack' },
  { id: 'fiber_cable', label: 'Backbone Fiber Link' },
];

const ALL_CAMPUSES: { id: CampusId; name: string }[] = [
  { id: 'BJC', name: 'Baghdad-ul-Jadeed (BJC)' },
  { id: 'OLD', name: 'Abbasia (Old Campus)' },
  { id: 'RAILWAY', name: 'Railway Campus' },
  { id: 'RYK', name: 'Rahim Yar Khan (RYK)' },
  { id: 'BWN', name: 'Bahawalnagar Campus' },
  { id: 'LQT', name: 'Liaquatpur Campus' },
];

export const AlertRulesManager: React.FC<AlertRulesManagerProps> = ({
  rules,
  onCreateRule,
  onUpdateRule,
  onDeleteRule,
  onToggleRule,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [ruleToEdit, setRuleToEdit] = useState<AlertRule | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formDeviceTypes, setFormDeviceTypes] = useState<(DeviceType | 'ALL')[]>(['router']);
  const [formCampuses, setFormCampuses] = useState<(CampusId | 'ALL')[]>(['ALL']);
  const [formSeverity, setFormSeverity] = useState<'critical' | 'high' | 'warning' | 'all'>('critical');
  const [formOnlyCriticalDowntime, setFormOnlyCriticalDowntime] = useState(true);
  const [formChannels, setFormChannels] = useState<('whatsapp' | 'email')[]>(['whatsapp', 'email']);
  const [formEmail, setFormEmail] = useState('zeejaved766@gmail.com');
  const [formPhone, setFormPhone] = useState('+923001234567');
  const [formContactPerson, setFormContactPerson] = useState('Mr. Zeeshan Javed (AI Lead Engineer)');
  const [formCustomNote, setFormCustomNote] = useState('');

  // Bandwidth Threshold Configuration State
  const [formEnableBandwidthThreshold, setFormEnableBandwidthThreshold] = useState(false);
  const [formBandwidthType, setFormBandwidthType] = useState<'percentage' | 'absolute_mbps'>('percentage');
  const [formBandwidthValue, setFormBandwidthValue] = useState<number>(90);
  const [formBandwidthDirection, setFormBandwidthDirection] = useState<'in' | 'out' | 'aggregate'>('aggregate');
  const [formBandwidthComparison, setFormBandwidthComparison] = useState<'greater_than' | 'greater_equal'>('greater_equal');

  // Interactive Filter Simulator State
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [simDeviceType, setSimDeviceType] = useState<DeviceType>('router');
  const [simCampus, setSimCampus] = useState<CampusId>('BJC');
  const [simIsDowntime, setSimIsDowntime] = useState(true);
  const [simSeverity, setSimSeverity] = useState<'critical' | 'high' | 'warning'>('critical');
  const [simulationResult, setSimulationResult] = useState<any>(null);

  const openCreateModal = () => {
    setRuleToEdit(null);
    setFormName('');
    setFormDeviceTypes(['router']);
    setFormCampuses(['ALL']);
    setFormSeverity('critical');
    setFormOnlyCriticalDowntime(true);
    setFormChannels(['whatsapp', 'email']);
    setFormEmail('zeejaved766@gmail.com');
    setFormPhone('+923001234567');
    setFormContactPerson('Mr. Zeeshan Javed (AI Lead Engineer)');
    setFormCustomNote('');
    setFormEnableBandwidthThreshold(false);
    setFormBandwidthType('percentage');
    setFormBandwidthValue(90);
    setFormBandwidthDirection('aggregate');
    setFormBandwidthComparison('greater_equal');
    setIsModalOpen(true);
  };

  const openEditModal = (rule: AlertRule) => {
    setRuleToEdit(rule);
    setFormName(rule.name);
    setFormDeviceTypes(rule.deviceTypes);
    setFormCampuses(rule.campuses);
    setFormSeverity(rule.severity);
    setFormOnlyCriticalDowntime(rule.onlyCriticalDowntime);
    setFormChannels(rule.channels);
    setFormEmail(rule.recipients.email);
    setFormPhone(rule.recipients.whatsappPhone);
    setFormContactPerson(rule.recipients.contactPerson || '');
    setFormCustomNote(rule.customNote || '');

    if (rule.bandwidthThreshold && rule.bandwidthThreshold.enabled) {
      setFormEnableBandwidthThreshold(true);
      setFormBandwidthType(rule.bandwidthThreshold.thresholdType);
      setFormBandwidthValue(rule.bandwidthThreshold.thresholdValue);
      setFormBandwidthDirection(rule.bandwidthThreshold.interfaceDirection || 'aggregate');
      setFormBandwidthComparison(rule.bandwidthThreshold.comparison || 'greater_equal');
    } else {
      setFormEnableBandwidthThreshold(false);
      setFormBandwidthType('percentage');
      setFormBandwidthValue(90);
      setFormBandwidthDirection('aggregate');
      setFormBandwidthComparison('greater_equal');
    }

    setIsModalOpen(true);
  };

  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const payload: Omit<AlertRule, 'id' | 'createdAt' | 'triggeredCount'> = {
      name: formName.trim(),
      enabled: true,
      deviceTypes: (formDeviceTypes.length > 0 ? formDeviceTypes : ['ALL']) as (DeviceType | 'ALL')[],
      campuses: (formCampuses.length > 0 ? formCampuses : ['ALL']) as (CampusId | 'ALL')[],
      severity: formSeverity,
      onlyCriticalDowntime: formOnlyCriticalDowntime,
      channels: (formChannels.length > 0 ? formChannels.filter(c => c === 'whatsapp' || c === 'email') : ['whatsapp', 'email']) as ('whatsapp' | 'email')[],
      recipients: {
        email: formEmail.trim(),
        whatsappPhone: formPhone.trim(),
        contactPerson: formContactPerson.trim(),
      },
      customNote: formCustomNote.trim(),
      bandwidthThreshold: formEnableBandwidthThreshold ? {
        enabled: true,
        thresholdType: formBandwidthType,
        thresholdValue: Number(formBandwidthValue) || 90,
        interfaceDirection: formBandwidthDirection,
        comparison: formBandwidthComparison,
      } : undefined,
    };

    if (ruleToEdit) {
      await onUpdateRule(ruleToEdit.id, payload);
    } else {
      await onCreateRule(payload);
    }

    setIsModalOpen(false);
  };

  const handleRunSimulation = async () => {
    try {
      const res = await fetch('/api/alert-rules/test-evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceType: simDeviceType,
          campus: simCampus,
          isDowntime: simIsDowntime,
          severity: simSeverity,
        }),
      });
      const data = await res.json();
      setSimulationResult(data);
    } catch (err: any) {
      console.error('Simulation failed:', err);
    }
  };

  const toggleDeviceType = (type: DeviceType | 'ALL') => {
    if (type === 'ALL') {
      setFormDeviceTypes(['ALL']);
      return;
    }
    const withoutAll = formDeviceTypes.filter((t) => t !== 'ALL');
    if (withoutAll.includes(type)) {
      const filtered = withoutAll.filter((t) => t !== type);
      setFormDeviceTypes(filtered.length === 0 ? ['ALL'] : filtered);
    } else {
      setFormDeviceTypes([...withoutAll, type]);
    }
  };

  const toggleCampus = (campus: CampusId | 'ALL') => {
    if (campus === 'ALL') {
      setFormCampuses(['ALL']);
      return;
    }
    const withoutAll = formCampuses.filter((c) => c !== 'ALL');
    if (withoutAll.includes(campus)) {
      const filtered = withoutAll.filter((c) => c !== campus);
      setFormCampuses(filtered.length === 0 ? ['ALL'] : filtered);
    } else {
      setFormCampuses([...withoutAll, campus]);
    }
  };

  const toggleChannel = (channel: 'whatsapp' | 'email') => {
    if (formChannels.includes(channel)) {
      if (formChannels.length > 1) {
        setFormChannels(formChannels.filter((c) => c !== channel));
      }
    } else {
      setFormChannels([...formChannels, channel]);
    }
  };

  const activeRulesCount = rules.filter((r) => r.enabled).length;
  const criticalDowntimeOnlyCount = rules.filter((r) => r.onlyCriticalDowntime).length;

  return (
    <div className="space-y-6">
      
      {/* Alerting Rules Banner & Controls */}
      <div className="card-elegant p-6 shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#2D3139]">
          <div>
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-lg bg-[#0A0B0E] border border-[#2D3139] text-blue-400">
                <Filter className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Advanced Alerting Filters & Notification Routing Rules
              </h2>
            </div>
            <p className="text-xs text-[#9CA3AF] mt-1">
              Define granular rules to filter alerts by device type (e.g. only router failures), campus location, and severity. Route targeted alerts directly to WhatsApp and Email only during critical downtime events.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsSimulatorOpen(!isSimulatorOpen)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#0A0B0E] hover:bg-[#1E2229] border border-[#2D3139] text-xs font-semibold text-gray-300 hover:text-white transition cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 text-amber-400" />
              <span>{isSimulatorOpen ? 'Hide Simulator' : 'Test Filter Simulator'}</span>
            </button>

            <button
              onClick={openCreateModal}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition cursor-pointer shadow-md shadow-blue-900/30"
            >
              <Plus className="w-4 h-4" />
              <span>Define Alert Rule</span>
            </button>
          </div>
        </div>

        {/* Quick Rule Stats Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          <div className="p-3 bg-[#0A0B0E] border border-[#2D3139] rounded-lg">
            <div className="text-[10px] uppercase font-bold text-[#9CA3AF]">Configured Rules</div>
            <div className="text-xl font-mono font-bold text-white mt-0.5">{rules.length}</div>
            <div className="text-[10px] text-gray-500 mt-0.5">{activeRulesCount} Active / In-Effect</div>
          </div>

          <div className="p-3 bg-[#0A0B0E] border border-[#2D3139] rounded-lg">
            <div className="text-[10px] uppercase font-bold text-[#9CA3AF]">Downtime Enforced</div>
            <div className="text-xl font-mono font-bold text-emerald-400 mt-0.5">{criticalDowntimeOnlyCount}</div>
            <div className="text-[10px] text-gray-500 mt-0.5">Critical Outages Only</div>
          </div>

          <div className="p-3 bg-[#0A0B0E] border border-[#2D3139] rounded-lg">
            <div className="text-[10px] uppercase font-bold text-[#9CA3AF]">WhatsApp Enabled</div>
            <div className="text-xl font-mono font-bold text-emerald-400 mt-0.5">
              {rules.filter((r) => r.channels.includes('whatsapp') && r.enabled).length}
            </div>
            <div className="text-[10px] text-gray-500 mt-0.5">Instant Mobile Alerting</div>
          </div>

          <div className="p-3 bg-[#0A0B0E] border border-[#2D3139] rounded-lg">
            <div className="text-[10px] uppercase font-bold text-[#9CA3AF]">Email Dispatches</div>
            <div className="text-xl font-mono font-bold text-blue-400 mt-0.5">
              {rules.filter((r) => r.channels.includes('email') && r.enabled).length}
            </div>
            <div className="text-[10px] text-gray-500 mt-0.5">NOC Mail Relay Ready</div>
          </div>
        </div>

        {/* Interactive Filter Evaluation Simulator */}
        {isSimulatorOpen && (
          <div className="mt-5 p-4 bg-[#0A0B0E] border border-amber-500/40 rounded-lg space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#2D3139]">
              <div className="flex items-center space-x-2">
                <Play className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Dry-Run Alert Filter Engine Test Console
                </h3>
              </div>
              <span className="text-[11px] text-[#9CA3AF]">
                Simulate an equipment state without triggering real notifications
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block text-[#9CA3AF] mb-1 font-medium">Device Type</label>
                <select
                  value={simDeviceType}
                  onChange={(e) => setSimDeviceType(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 bg-[#16181D] border border-[#2D3139] rounded-lg text-white"
                >
                  {ALL_DEVICE_TYPES.map((d) => (
                    <option key={d.id} value={d.id}>{d.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[#9CA3AF] mb-1 font-medium">Campus</label>
                <select
                  value={simCampus}
                  onChange={(e) => setSimCampus(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 bg-[#16181D] border border-[#2D3139] rounded-lg text-white"
                >
                  {ALL_CAMPUSES.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[#9CA3AF] mb-1 font-medium">Event Condition</label>
                <select
                  value={simIsDowntime ? 'offline' : 'online'}
                  onChange={(e) => setSimIsDowntime(e.target.value === 'offline')}
                  className="w-full px-2.5 py-1.5 bg-[#16181D] border border-[#2D3139] rounded-lg text-white"
                >
                  <option value="offline">🔴 CRITICAL DOWNTIME (Device Goes Offline)</option>
                  <option value="online">🟢 Normal Operation / Latency Fluctuation</option>
                </select>
              </div>

              <div>
                <label className="block text-[#9CA3AF] mb-1 font-medium">Incident Severity</label>
                <select
                  value={simSeverity}
                  onChange={(e) => setSimSeverity(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 bg-[#16181D] border border-[#2D3139] rounded-lg text-white"
                >
                  <option value="critical">Critical (Tier 1 Outage)</option>
                  <option value="high">High (Department Degradation)</option>
                  <option value="warning">Warning (Telemetry Threshold)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={handleRunSimulation}
                className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-lg text-xs transition cursor-pointer shadow-md"
              >
                Evaluate Rules Engine
              </button>

              {simulationResult && (
                <div className="text-xs">
                  {simulationResult.wouldDispatchAlert ? (
                    <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      Alert Would Dispatch: Matched {simulationResult.matchedRulesCount} Rule(s)
                    </span>
                  ) : (
                    <span className="text-amber-400 font-semibold flex items-center gap-1.5">
                      <AlertOctagon className="w-4 h-4" />
                      Alert Blocked: No active rules matched criteria (or non-downtime event filtered)
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Simulation Detail Result */}
            {simulationResult && simulationResult.matchedRules && simulationResult.matchedRules.length > 0 && (
              <div className="mt-2 p-3 bg-[#16181D] border border-[#2D3139] rounded-lg space-y-2">
                <div className="text-xs font-bold text-white">Matching Alert Rules & Configured Recipients:</div>
                {simulationResult.matchedRules.map((mr: AlertRule) => (
                  <div key={mr.id} className="text-xs text-[#9CA3AF] flex flex-wrap items-center justify-between gap-2 border-b border-[#2D3139]/60 pb-1.5">
                    <div>
                      <strong className="text-white">{mr.name}</strong> ({mr.recipients.contactPerson || 'NOC Admin'})
                    </div>
                    <div className="flex items-center space-x-3 text-[11px] font-mono">
                      {mr.channels.includes('whatsapp') && (
                        <span className="text-emerald-400">WA: {mr.recipients.whatsappPhone}</span>
                      )}
                      {mr.channels.includes('email') && (
                        <span className="text-blue-400">Email: {mr.recipients.email}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Rules List Table */}
      <div className="card-elegant p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#2D3139]">
          <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
            <span>Configured Advanced Alert Rules</span>
            <span className="badge-tool text-blue-400 font-mono">
              {rules.length} Rules Defined
            </span>
          </h3>
          <span className="text-xs text-[#9CA3AF]">
            Real-time automated evaluation on ICMP ping failure, power cut, or fiber disconnect
          </span>
        </div>

        <div className="space-y-3">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className={`p-4 rounded-lg border transition ${
                rule.enabled
                  ? 'bg-[#0A0B0E] border-[#2D3139] hover:border-blue-500/50'
                  : 'bg-[#0A0B0E]/60 border-[#2D3139]/50 opacity-60'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[#2D3139]">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => onToggleRule(rule.id)}
                    className={`p-1.5 rounded-lg border transition cursor-pointer ${
                      rule.enabled
                        ? 'bg-emerald-950 text-emerald-400 border-emerald-800 hover:bg-emerald-900'
                        : 'bg-[#16181D] text-gray-500 border-[#2D3139] hover:text-gray-300'
                    }`}
                    title={rule.enabled ? 'Click to Disable Rule' : 'Click to Enable Rule'}
                  >
                    <Power className="w-4 h-4" />
                  </button>

                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-bold text-white">{rule.name}</h4>
                      <span
                        className={`text-[10px] font-mono uppercase px-2 py-0.2 rounded font-bold border ${
                          rule.enabled
                            ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800'
                            : 'bg-[#16181D] text-gray-500 border-[#2D3139]'
                        }`}
                      >
                        {rule.enabled ? 'Active' : 'Disabled'}
                      </span>
                      {rule.onlyCriticalDowntime && (
                        <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-red-950/60 text-red-400 border border-red-800">
                          Critical Downtime Only
                        </span>
                      )}
                    </div>
                    {rule.customNote && (
                      <p className="text-xs text-[#9CA3AF] mt-0.5">{rule.customNote}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-[11px] font-mono text-gray-400 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-gray-500" />
                    <span>Fired: <strong className="text-white">{rule.triggeredCount || 0}x</strong></span>
                  </span>

                  <button
                    onClick={() => openEditModal(rule)}
                    className="p-1.5 bg-[#16181D] hover:bg-[#1E2229] text-blue-400 border border-[#2D3139] rounded-lg transition cursor-pointer"
                    title="Edit Rule Settings"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => {
                      if (window.confirm(`Delete alert rule "${rule.name}"?`)) {
                        onDeleteRule(rule.id);
                      }
                    }}
                    className="p-1.5 bg-[#16181D] hover:bg-red-950 text-red-400 border border-[#2D3139] hover:border-red-800 rounded-lg transition cursor-pointer"
                    title="Delete Rule"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Filter Criteria & Recipient Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3 text-xs">
                
                {/* Device Types Filter */}
                <div className="p-2.5 bg-[#16181D] rounded-lg border border-[#2D3139]">
                  <div className="text-[10px] uppercase font-bold text-[#9CA3AF] mb-1.5 flex items-center gap-1">
                    <Server className="w-3 h-3 text-blue-400" />
                    <span>Target Device Types</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {rule.deviceTypes.includes('ALL') ? (
                      <span className="px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 font-semibold text-[11px]">
                        All Network Equipment
                      </span>
                    ) : (
                      rule.deviceTypes.map((dt) => (
                        <span key={dt} className="px-2 py-0.5 rounded bg-[#0A0B0E] text-white border border-[#2D3139] font-mono text-[10px] uppercase">
                          {dt.replace('_', ' ')}
                        </span>
                      ))
                    )}
                  </div>
                </div>

                {/* Campus Filter */}
                <div className="p-2.5 bg-[#16181D] rounded-lg border border-[#2D3139]">
                  <div className="text-[10px] uppercase font-bold text-[#9CA3AF] mb-1.5 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-emerald-400" />
                    <span>Target Campus Locations</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {rule.campuses.includes('ALL') ? (
                      <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-semibold text-[11px]">
                        All 6 IUB Campuses
                      </span>
                    ) : (
                      rule.campuses.map((camp) => (
                        <span key={camp} className="px-2 py-0.5 rounded bg-[#0A0B0E] text-emerald-400 border border-[#2D3139] font-mono text-[10px] font-bold">
                          {camp}
                        </span>
                      ))
                    )}
                  </div>
                </div>

                {/* Configured Recipients */}
                <div className="p-2.5 bg-[#16181D] rounded-lg border border-[#2D3139]">
                  <div className="text-[10px] uppercase font-bold text-[#9CA3AF] mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-3 h-3 text-emerald-400" />
                      <span>Recipients ({rule.recipients.contactPerson || 'NOC'})</span>
                    </span>
                    <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-[#0A0B0E] text-amber-400 border border-[#2D3139]">
                      {rule.severity} severity
                    </span>
                  </div>
                  <div className="space-y-1 text-[11px] font-mono">
                    {rule.channels.includes('whatsapp') && (
                      <div className="text-emerald-400 flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        <span>{rule.recipients.whatsappPhone}</span>
                      </div>
                    )}
                    {rule.channels.includes('email') && (
                      <div className="text-blue-300 flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        <span>{rule.recipients.email}</span>
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* Bandwidth Threshold Badge / Summary */}
              {rule.bandwidthThreshold && rule.bandwidthThreshold.enabled && (
                <div className="mt-3 p-2.5 bg-blue-950/40 border border-blue-500/40 rounded-lg flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center space-x-2 text-blue-300">
                    <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>
                      <strong className="text-white">Bandwidth Congestion Threshold:</strong> Triggers alert if interface traffic is{' '}
                      <span className="font-mono text-amber-300 font-bold">
                        {rule.bandwidthThreshold.comparison === 'greater_than' ? '>' : '≥'} {rule.bandwidthThreshold.thresholdValue}
                        {rule.bandwidthThreshold.thresholdType === 'percentage' ? '%' : ' Mbps'}
                      </span>
                      {' '}({rule.bandwidthThreshold.interfaceDirection} traffic)
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-blue-900/60 text-blue-300 border border-blue-700/50 font-mono text-[10px] font-semibold uppercase">
                    Active Link Threshold
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Define / Edit Rule Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#16181D] border border-[#2D3139] rounded-xl max-w-2xl w-full p-6 shadow-2xl text-[#E5E7EB] space-y-4 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-3 border-b border-[#2D3139]">
              <div className="flex items-center space-x-2">
                <Filter className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-bold text-white">
                  {ruleToEdit ? 'Edit Alert Filter Rule' : 'Define Advanced Alerting Filter Rule'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-gray-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRule} className="space-y-4 text-xs">
              
              {/* Rule Name */}
              <div>
                <label className="block text-gray-300 font-semibold mb-1">
                  Rule Name & Identifier <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g., Core Router Critical Downtime (BJC & Sub-Campuses)"
                  className="w-full px-3 py-2 bg-[#0A0B0E] border border-[#2D3139] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 text-xs"
                />
              </div>

              {/* Device Type Filters */}
              <div>
                <label className="block text-gray-300 font-semibold mb-1">
                  Filter by Device Type (e.g. only alert on router failures)
                </label>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  <button
                    type="button"
                    onClick={() => toggleDeviceType('ALL')}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition ${
                      formDeviceTypes.includes('ALL')
                        ? 'bg-blue-600 text-white border-blue-500'
                        : 'bg-[#0A0B0E] text-gray-400 border-[#2D3139] hover:text-white'
                    }`}
                  >
                    All Device Types
                  </button>
                  {ALL_DEVICE_TYPES.map((dt) => {
                    const isSelected = !formDeviceTypes.includes('ALL') && formDeviceTypes.includes(dt.id);
                    return (
                      <button
                        key={dt.id}
                        type="button"
                        onClick={() => toggleDeviceType(dt.id)}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-500'
                            : 'bg-[#0A0B0E] text-gray-400 border-[#2D3139] hover:text-white'
                        }`}
                      >
                        {dt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Campus Location Filter */}
              <div>
                <label className="block text-gray-300 font-semibold mb-1">
                  Filter by Campus Location
                </label>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  <button
                    type="button"
                    onClick={() => toggleCampus('ALL')}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition ${
                      formCampuses.includes('ALL')
                        ? 'bg-emerald-600 text-white border-emerald-500'
                        : 'bg-[#0A0B0E] text-gray-400 border-[#2D3139] hover:text-white'
                    }`}
                  >
                    All 6 Campuses
                  </button>
                  {ALL_CAMPUSES.map((c) => {
                    const isSelected = !formCampuses.includes('ALL') && formCampuses.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => toggleCampus(c.id)}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition ${
                          isSelected
                            ? 'bg-emerald-600 text-white border-emerald-500'
                            : 'bg-[#0A0B0E] text-gray-400 border-[#2D3139] hover:text-white'
                        }`}
                      >
                        {c.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Severity & Critical Downtime Requirement */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Alert Severity Filter</label>
                  <select
                    value={formSeverity}
                    onChange={(e) => setFormSeverity(e.target.value as any)}
                    className="w-full px-3 py-2 bg-[#0A0B0E] border border-[#2D3139] rounded-lg text-white"
                  >
                    <option value="critical">Critical Severity Only</option>
                    <option value="high">High & Critical Severity</option>
                    <option value="warning">Warning, High & Critical</option>
                    <option value="all">All Severity Levels</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Critical Downtime Guard</label>
                  <label className="flex items-center space-x-2.5 mt-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formOnlyCriticalDowntime}
                      onChange={(e) => setFormOnlyCriticalDowntime(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600 bg-[#0A0B0E] border-[#2D3139] focus:ring-0 cursor-pointer"
                    />
                    <span className="text-white text-xs font-medium">
                      Ensure alerts are ONLY sent for critical downtime events (device offline / link drop)
                    </span>
                  </label>
                </div>
              </div>

              {/* Bandwidth Threshold Configuration Section */}
              <div className="p-3.5 bg-[#0A0B0E] border border-blue-500/30 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>Bandwidth & Traffic Utilization Threshold</span>
                  </div>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formEnableBandwidthThreshold}
                      onChange={(e) => setFormEnableBandwidthThreshold(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-500 bg-[#16181D] border-[#2D3139]"
                    />
                    <span className="text-xs font-semibold text-blue-400">
                      {formEnableBandwidthThreshold ? 'Enabled' : 'Disabled'}
                    </span>
                  </label>
                </div>

                {formEnableBandwidthThreshold && (
                  <div className="space-y-3 pt-2 border-t border-[#2D3139]">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-gray-400 font-medium mb-1">Threshold Type</label>
                        <select
                          value={formBandwidthType}
                          onChange={(e) => setFormBandwidthType(e.target.value as any)}
                          className="w-full px-2.5 py-1.5 bg-[#16181D] border border-[#2D3139] rounded text-white text-xs"
                        >
                          <option value="percentage">Percentage-based (%)</option>
                          <option value="absolute_mbps">Absolute Throughput (Mbps)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-gray-400 font-medium mb-1">
                          Threshold Value {formBandwidthType === 'percentage' ? '(%)' : '(Mbps)'}
                        </label>
                        <div className="flex items-center space-x-1.5">
                          <input
                            type="number"
                            min="1"
                            max={formBandwidthType === 'percentage' ? 100 : 100000}
                            value={formBandwidthValue}
                            onChange={(e) => setFormBandwidthValue(Number(e.target.value))}
                            className="w-full px-2.5 py-1.5 bg-[#16181D] border border-[#2D3139] rounded text-amber-400 font-mono text-xs font-bold"
                          />
                          <span className="text-gray-400 font-mono text-xs">
                            {formBandwidthType === 'percentage' ? '%' : 'Mbps'}
                          </span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-gray-400 font-medium mb-1">Traffic Direction</label>
                        <select
                          value={formBandwidthDirection}
                          onChange={(e) => setFormBandwidthDirection(e.target.value as any)}
                          className="w-full px-2.5 py-1.5 bg-[#16181D] border border-[#2D3139] rounded text-white text-xs"
                        >
                          <option value="aggregate">Aggregate (In + Out)</option>
                          <option value="in">Inbound / Ingress</option>
                          <option value="out">Outbound / Egress</option>
                        </select>
                      </div>
                    </div>

                    {/* Quick Presets */}
                    <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                      <span className="text-gray-400">Quick Presets:</span>
                      <button
                        type="button"
                        onClick={() => {
                          setFormBandwidthType('percentage');
                          setFormBandwidthValue(90);
                        }}
                        className="px-2 py-0.5 rounded bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 border border-amber-800 text-[10px] font-mono cursor-pointer"
                      >
                        90% Utilization (Recommended)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFormBandwidthType('percentage');
                          setFormBandwidthValue(80);
                        }}
                        className="px-2 py-0.5 rounded bg-[#16181D] hover:bg-[#20242C] text-gray-300 border border-[#2D3139] text-[10px] font-mono cursor-pointer"
                      >
                        80% Warning
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFormBandwidthType('percentage');
                          setFormBandwidthValue(95);
                        }}
                        className="px-2 py-0.5 rounded bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-800 text-[10px] font-mono cursor-pointer"
                      >
                        95% Critical Saturation
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFormBandwidthType('absolute_mbps');
                          setFormBandwidthValue(1000);
                        }}
                        className="px-2 py-0.5 rounded bg-blue-950/60 hover:bg-blue-900/80 text-blue-300 border border-blue-800 text-[10px] font-mono cursor-pointer"
                      >
                        1000 Mbps (1G Link)
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Recipient Configuration */}
              <div className="p-3.5 bg-[#0A0B0E] border border-[#2D3139] rounded-lg space-y-3">
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Configure Alert Notification Recipients (WhatsApp & Email)</span>
                </div>

                {/* Channel Checkboxes */}
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={formChannels.includes('whatsapp')}
                      onChange={() => toggleChannel('whatsapp')}
                      className="w-4 h-4 rounded text-emerald-500 bg-[#16181D] border-[#2D3139]"
                    />
                    <span className="text-white">WhatsApp Direct Broadcast</span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={formChannels.includes('email')}
                      onChange={() => toggleChannel('email')}
                      className="w-4 h-4 rounded text-blue-500 bg-[#16181D] border-[#2D3139]"
                    />
                    <span className="text-white">Email Notification (SMTP)</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#9CA3AF] mb-1 font-medium">Recipient WhatsApp Number</label>
                    <input
                      type="text"
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      placeholder="+923001234567"
                      className="w-full px-3 py-1.5 bg-[#16181D] border border-[#2D3139] rounded text-emerald-400 font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[#9CA3AF] mb-1 font-medium">Recipient Email Address</label>
                    <input
                      type="email"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      placeholder="zeejaved766@gmail.com"
                      className="w-full px-3 py-1.5 bg-[#16181D] border border-[#2D3139] rounded text-blue-300 font-mono text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[#9CA3AF] mb-1 font-medium">Contact Person / NOC Role</label>
                  <input
                    type="text"
                    value={formContactPerson}
                    onChange={(e) => setFormContactPerson(e.target.value)}
                    placeholder="Mr. Zeeshan Javed (AI Lead Engineer)"
                    className="w-full px-3 py-1.5 bg-[#16181D] border border-[#2D3139] rounded text-white text-xs"
                  />
                </div>
              </div>

              {/* Custom Note */}
              <div>
                <label className="block text-gray-300 font-semibold mb-1">
                  Departmental Notes / Action Instructions (Optional)
                </label>
                <input
                  type="text"
                  value={formCustomNote}
                  onChange={(e) => setFormCustomNote(e.target.value)}
                  placeholder="e.g. Inspect PERN fiber patch cord or restart dual-redundant power supply."
                  className="w-full px-3 py-2 bg-[#0A0B0E] border border-[#2D3139] rounded-lg text-white placeholder-gray-500 text-xs"
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-[#2D3139]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-[#0A0B0E] hover:bg-[#1E2229] border border-[#2D3139] text-gray-300 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-900/30 cursor-pointer"
                >
                  {ruleToEdit ? 'Update Rule' : 'Save Rule'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
