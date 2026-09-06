import { Device, FiberLink, SecurityEvent, AlertNotification, AlertRule, SystemEngineMetrics, CampusInfo, HistoricalMetricPoint, CollectorToken } from './types.ts';

/**
 * Resilient JSON fetcher with automatic exponential backoff retry
 * Prevents "Failed to fetch" errors during container startup, hot reload or network hiccups.
 */
async function fetchJsonWithRetry<T>(url: string, options?: RequestInit, retries = 3, delayMs = 500): Promise<T> {
  let lastError: any;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, options);
      if (!res.ok) {
        let errMsg = `Request to ${url} failed with status ${res.status}`;
        try {
          const errData = await res.json();
          if (errData?.error) errMsg = errData.error;
        } catch {
          // fallback
        }
        throw new Error(errMsg);
      }
      return await res.json();
    } catch (err: any) {
      lastError = err;
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, delayMs * Math.pow(1.5, attempt)));
      }
    }
  }
  throw lastError;
}

export async function fetchCampuses(): Promise<CampusInfo[]> {
  return fetchJsonWithRetry<CampusInfo[]>('/api/campuses');
}

export async function fetchDevices(params?: { campus?: string; type?: string; search?: string }): Promise<Device[]> {
  const query = new URLSearchParams();
  if (params?.campus && params.campus !== 'ALL') query.append('campus', params.campus);
  if (params?.type && params.type !== 'ALL') query.append('type', params.type);
  if (params?.search) query.append('search', params.search);

  const qs = query.toString() ? `?${query.toString()}` : '';
  return fetchJsonWithRetry<Device[]>(`/api/devices${qs}`);
}

export async function createDevice(data: Omit<Device, 'id' | 'lastSeen' | 'uptime'>): Promise<Device> {
  const res = await fetch('/api/devices', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to create device');
  }
  return res.json();
}

export async function updateDevice(id: string, data: Partial<Device>): Promise<Device> {
  const res = await fetch(`/api/devices/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update device');
  return res.json();
}

export async function deleteDevice(id: string): Promise<void> {
  const res = await fetch(`/api/devices/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete device');
}

export async function toggleDevicePower(id: string): Promise<Device> {
  const res = await fetch(`/api/devices/${id}/toggle-status`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to toggle device power');
  return res.json();
}

export async function runDiagnostics(deviceId: string) {
  const res = await fetch(`/api/devices/${deviceId}/diagnostics`);
  if (!res.ok) throw new Error('Failed to run diagnostics');
  return res.json();
}

export async function fetchFiberLinks(): Promise<FiberLink[]> {
  return fetchJsonWithRetry<FiberLink[]>('/api/fiber-links');
}

export async function updateFiberCore(linkId: string, coreNumber: number, status: string, service?: string): Promise<FiberLink> {
  const res = await fetch(`/api/fiber-links/${linkId}/core`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ coreNumber, status, service }),
  });
  if (!res.ok) throw new Error('Failed to update fiber core');
  return res.json();
}

export async function fetchSecurityEvents(): Promise<SecurityEvent[]> {
  return fetchJsonWithRetry<SecurityEvent[]>('/api/security-events');
}

export async function fetchAlerts(): Promise<AlertNotification[]> {
  return fetchJsonWithRetry<AlertNotification[]>('/api/alerts');
}

export async function dispatchAlert(payload: any) {
  const res = await fetch('/api/alerts/dispatch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to dispatch alert');
  return res.json();
}

export async function dispatchWhatsAppGroupOfflineAlert(payload: {
  groupName: string;
  customNote?: string;
  offlineDeviceIds?: string[];
}) {
  const res = await fetch('/api/alerts/dispatch-group', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to dispatch WhatsApp group alert');
  }
  return res.json();
}

export async function resolveAlert(id: string) {
  const res = await fetch(`/api/alerts/${id}/resolve`, { method: 'PUT' });
  if (!res.ok) throw new Error('Failed to resolve alert');
  return res.json();
}

export async function fetchSystemMetrics(): Promise<SystemEngineMetrics> {
  return fetchJsonWithRetry<SystemEngineMetrics>('/api/metrics');
}

export async function resetDatabase() {
  const res = await fetch('/api/reset-database', { method: 'POST' });
  if (!res.ok) throw new Error('Failed to reset database');
  return res.json();
}

export async function fetchAlertRules(): Promise<AlertRule[]> {
  return fetchJsonWithRetry<AlertRule[]>('/api/alert-rules');
}

export async function createAlertRule(data: Omit<AlertRule, 'id' | 'createdAt' | 'triggeredCount'>): Promise<AlertRule> {
  const res = await fetch('/api/alert-rules', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to create alert rule');
  }
  return res.json();
}

export async function updateAlertRule(id: string, data: Partial<AlertRule>): Promise<AlertRule> {
  const res = await fetch(`/api/alert-rules/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update alert rule');
  return res.json();
}

export async function deleteAlertRule(id: string): Promise<void> {
  const res = await fetch(`/api/alert-rules/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete alert rule');
}

export async function toggleAlertRule(id: string): Promise<AlertRule> {
  const res = await fetch(`/api/alert-rules/${id}/toggle`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to toggle alert rule');
  return res.json();
}

export async function testEvaluateAlertRules(payload: {
  deviceId?: string;
  deviceType?: string;
  campus?: string;
  isDowntime?: boolean;
  severity?: string;
}) {
  const res = await fetch('/api/alert-rules/test-evaluate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to evaluate alert rules');
  return res.json();
}

export async function fetchDeviceHistory(deviceId: string, limit = 50): Promise<HistoricalMetricPoint[]> {
  const res = await fetch(`/api/devices/${deviceId}/history?limit=${limit}`);
  if (!res.ok) throw new Error('Failed to fetch historical metrics');
  return res.json();
}

export async function fetchCollectorTokens(): Promise<CollectorToken[]> {
  const res = await fetch('/api/collector/tokens');
  if (!res.ok) throw new Error('Failed to fetch collector tokens');
  return res.json();
}

export async function createCollectorToken(name: string, campus: string): Promise<CollectorToken> {
  const res = await fetch('/api/collector/tokens', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, campus }),
  });
  if (!res.ok) throw new Error('Failed to create collector token');
  return res.json();
}

export async function revokeCollectorToken(id: string): Promise<void> {
  const res = await fetch(`/api/collector/tokens/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to revoke collector token');
}

export async function fetchCollectorSnippets(): Promise<{ curl: string; python: string; bash: string }> {
  const res = await fetch('/api/collector/snippets');
  if (!res.ok) throw new Error('Failed to fetch collector snippets');
  return res.json();
}

export async function sendCollectorReport(payload: any, token: string): Promise<any> {
  const res = await fetch('/api/collector/report', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to send metrics');
  }
  return res.json();
}

// Daily Automated Network Uptime Summary Report
export async function fetchUptimeReportPreview(email?: string): Promise<{
  success: boolean;
  reportData: any;
  htmlPreview: string;
}> {
  const query = email ? `?email=${encodeURIComponent(email)}` : '';
  const res = await fetch(`/api/alerts/uptime-report/preview${query}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to load report preview');
  }
  return res.json();
}

export async function sendDailyUptimeReport(recipientEmail?: string): Promise<{
  success: boolean;
  alertId: string;
  recipientEmail: string;
  emailStatus: string;
  reportData: any;
  htmlPreview: string;
  sentAt: string;
}> {
  const res = await fetch('/api/alerts/uptime-report/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ recipientEmail, manualTrigger: true }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to dispatch uptime report');
  }
  return res.json();
}

export async function fetchUptimeReportSettings(): Promise<any> {
  const res = await fetch('/api/alerts/uptime-report/settings');
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to load report settings');
  }
  return res.json();
}

export async function updateUptimeReportSettings(settings: any): Promise<any> {
  const res = await fetch('/api/alerts/uptime-report/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to update report settings');
  }
  return res.json();
}

// Hardware Health & Rack Telemetry
export async function fetchHardwareRacks(campus?: string): Promise<any[]> {
  const query = campus && campus !== 'ALL' ? `?campus=${encodeURIComponent(campus)}` : '';
  const res = await fetch(`/api/hardware-health/racks${query}`);
  if (!res.ok) throw new Error('Failed to fetch hardware rack statuses');
  return res.json();
}

export async function fetchHardwareSummary(): Promise<any> {
  const res = await fetch('/api/hardware-health/summary');
  if (!res.ok) throw new Error('Failed to fetch hardware summary');
  return res.json();
}

export async function fetchHardwareLogs(options?: {
  campus?: string;
  rackId?: string;
  severity?: string;
  search?: string;
  limit?: number;
}): Promise<any[]> {
  const params = new URLSearchParams();
  if (options?.campus && options.campus !== 'ALL') params.append('campus', options.campus);
  if (options?.rackId && options.rackId !== 'ALL') params.append('rackId', options.rackId);
  if (options?.severity && options.severity !== 'ALL') params.append('severity', options.severity);
  if (options?.search) params.append('search', options.search);
  if (options?.limit) params.append('limit', String(options.limit));

  const query = params.toString() ? `?${params.toString()}` : '';
  const res = await fetch(`/api/hardware-health/logs${query}`);
  if (!res.ok) throw new Error('Failed to fetch hardware telemetry logs');
  return res.json();
}

export async function triggerHardwareDiagnostic(rackId: string): Promise<any> {
  const res = await fetch('/api/hardware-health/diagnose', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rackId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Diagnostic query failed');
  }
  return res.json();
}

export async function recordHardwareLog(log: any): Promise<any> {
  const res = await fetch('/api/hardware-health/log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(log),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to record hardware log');
  }
  return res.json();
}

