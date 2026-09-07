import express from 'express';
import http from 'http';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db, campusesData } from './server/db.ts';
import { alertDispatcher } from './server/alert-dispatcher.ts';
import { runDeviceDiagnostics } from './server/ping-service.ts';
import { processChatQuery } from './server/geminiChat.ts';
import { 
  ingestDeviceMetrics, 
  validateCollectorToken, 
  getCollectorTokens, 
  createCollectorToken, 
  revokeCollectorToken, 
  initCollectorWatchdog, 
  generateCollectorSnippets 
} from './server/collector.ts';
import { 
  initWebSocket, 
  broadcastDeviceStatusChanged, 
  broadcastDeviceUpdated, 
  broadcastDeviceCreated, 
  broadcastDeviceDeleted, 
  broadcastTelemetryBatch, 
  broadcastAlertNew, 
  broadcastSecurityEvent, 
  broadcastAlertRulesUpdated, 
  broadcastFiberLinkUpdated,
  getConnectedClientsCount
} from './server/websocket.ts';
import { hardwareHealthService } from './server/hardwareHealth.ts';

const PORT = 3000;

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);

  // Initialize Real-Time WebSocket Engine (Socket.IO)
  initWebSocket(httpServer);

  // Initialize Network Collector Watchdog (checks heartbeats every 15s, 60s timeout)
  initCollectorWatchdog(15000, 60000);

  // Enable CORS & Preflight headers for cross-origin iframe requests
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-collector-token');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // Increase body parser limit to 50mb for bulk equipment CSV/PDF imports
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Graceful body-parser error handler for oversized payloads
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err && (err.type === 'entity.too.large' || err.status === 413)) {
      return res.status(413).json({
        error: 'Payload too large: The uploaded file or device batch exceeds the allowed size limit.',
      });
    }
    next(err);
  });

  // Background Telemetry Simulator: periodically updates slight bandwidth and ping variations
  setInterval(() => {
    try {
      const devices = db.getDevices();
      const updatedBatch: Partial<typeof devices[0]>[] = [];

      // Randomly update 2-3 devices' live bandwidth and CPU to simulate active campus traffic
      for (let i = 0; i < Math.min(3, devices.length); i++) {
        const randIdx = Math.floor(Math.random() * devices.length);
        const dev = devices[randIdx];
        if (dev && dev.status === 'online') {
          const deltaBw = (Math.random() - 0.5) * 40;
          const newBwIn = Math.max(10, Math.round(dev.bandwidthInMbps + deltaBw));
          const newBwOut = Math.max(10, Math.round(dev.bandwidthOutMbps + deltaBw * 1.1));
          const newCpu = Math.min(95, Math.max(10, Math.round(dev.cpuUsage + (Math.random() - 0.5) * 6)));
          const updated = db.updateDevice(dev.id, {
            bandwidthInMbps: newBwIn,
            bandwidthOutMbps: newBwOut,
            cpuUsage: newCpu,
          });
          if (updated) {
            updatedBatch.push(updated);
          }
        }
      }

      if (updatedBatch.length > 0) {
        broadcastTelemetryBatch(updatedBatch);
      }
    } catch (e) {
      // ignore
    }
  }, 10000);

  // --- API Routes ---

  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      system: 'The Islamia University of Bahawalpur - IUB Network Monitoring Core',
      leadEngineer: 'Mr. Zeeshan Javed (AI Lead Engineer)',
      campusesMonitored: campusesData.length,
      realTimeClientsConnected: getConnectedClientsCount(),
      timestamp: new Date().toISOString(),
    });
  });

  // Campus summary
  app.get('/api/campuses', (req, res) => {
    const devices = db.getDevices();
    const updatedCampuses = campusesData.map((c) => {
      const campusDevs = devices.filter((d) => d.campus === c.id);
      const onlineCount = campusDevs.filter((d) => d.status === 'online').length;
      return {
        ...c,
        totalDevices: campusDevs.length,
        onlineDevices: onlineCount,
      };
    });
    res.json(updatedCampuses);
  });

  // Devices CRUD
  app.get('/api/devices', (req, res) => {
    const { campus, type, search } = req.query;
    const devices = db.getDevices(
      campus ? String(campus) : undefined,
      type ? String(type) : undefined,
      search ? String(search) : undefined
    );
    res.json(devices);
  });

  app.get('/api/devices/:id', (req, res) => {
    const device = db.getDeviceById(req.params.id);
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }
    res.json(device);
  });

  // Historical time-series metrics endpoint (for latency, packet loss, bandwidth, CPU, RAM)
  app.get('/api/devices/:id/history', (req, res) => {
    const limit = req.query.limit ? Number(req.query.limit) : 50;
    const history = db.getHistoricalMetrics(req.params.id, limit);
    res.json(history);
  });

  // --- Network Collector Ingestion & Registration Layer ---

  // Report metrics from external devices/servers/agents
  app.post('/api/collector/report', (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader || req.body.apiKey;

      // Validate token (must match a valid registered collector token)
      if (!validateCollectorToken(token)) {
        return res.status(401).json({
          error: 'Unauthorized: Invalid or missing collector bearer token. Please provide a valid token from IUB NOC Settings.',
        });
      }

      const { deviceId, status } = req.body;
      if (!deviceId) {
        return res.status(400).json({ error: 'deviceId is required in metric report.' });
      }

      const result = ingestDeviceMetrics(req.body);
      res.status(200).json({
        success: true,
        message: 'Metrics ingested into IUB monitoring core',
        deviceId: result.device.id,
        status: result.device.status,
        timestamp: result.historyPoint.timestamp,
      });
    } catch (err: any) {
      console.error('Collector ingestion error:', err);
      res.status(500).json({ error: err.message || 'Failed to ingest metrics' });
    }
  });

  // Register a new external agent / server to monitor
  app.post('/api/collector/register', (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader || req.body.apiKey;

      if (!validateCollectorToken(token)) {
        return res.status(401).json({ error: 'Unauthorized: Invalid collector registration token' });
      }

      const { name, campus, ipAddress, model, type } = req.body;
      if (!name || !campus) {
        return res.status(400).json({ error: 'Device name and campus are required for registration.' });
      }

      const device = db.addDevice({
        name,
        type: type || 'router',
        model: model || 'Remote Linux Agent Server',
        ipAddress: ipAddress || '10.10.99.' + Math.floor(Math.random() * 250 + 1),
        macAddress: '52:54:00:' + Math.random().toString(16).substring(2, 8).toUpperCase(),
        campus,
        building: req.body.building || 'External Server Node',
        roomNo: req.body.roomNo || 'Compute Rack',
        rackId: req.body.rackId || 'RACK-EXTERNAL',
        portsTotal: 4,
        portsActive: 2,
        status: 'online',
        latencyMs: 1.5,
        packetLoss: 0,
        cpuUsage: 22,
        memoryUsage: 35,
        temperatureC: 38,
        bandwidthInMbps: 250,
        bandwidthOutMbps: 210,
        snmpCommunity: 'public',
        snmpVersion: 'v2c',
        prtgSensorId: 'PRTG-COL-' + Date.now().toString().slice(-4),
        zabbixHostId: 'ZAB-COL-' + Date.now().toString().slice(-4),
        suricataThreatLevel: 'safe',
      });

      broadcastDeviceCreated(device);
      res.status(201).json({
        success: true,
        message: 'External agent successfully registered in IUB NOC',
        device,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to register collector device' });
    }
  });

  // Manage Collector Tokens
  app.get('/api/collector/tokens', (req, res) => {
    res.json(getCollectorTokens());
  });

  app.post('/api/collector/tokens', (req, res) => {
    const { name, campus } = req.body;
    const token = createCollectorToken(name, campus);
    res.status(201).json(token);
  });

  app.delete('/api/collector/tokens/:id', (req, res) => {
    const success = revokeCollectorToken(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Token not found or cannot be revoked' });
    }
    res.json({ success: true, message: 'Collector token revoked' });
  });

  // Collector agent script generator
  app.get('/api/collector/snippets', (req, res) => {
    const tokens = getCollectorTokens();
    const token = tokens[0]?.token || 'iub-collector-sec-9a8f4c1e7b2';
    const host = `${req.protocol}://${req.get('host')}`;
    res.json(generateCollectorSnippets(token, host));
  });

  app.post('/api/devices', (req, res) => {
    try {
      const device = db.addDevice(req.body);
      broadcastDeviceCreated(device);
      res.status(201).json(device);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to add device' });
    }
  });

  // Bulk Device Provisioning (CSV/PDF Import)
  app.post('/api/devices/bulk', (req, res) => {
    try {
      const rawDevices = req.body.devices;
      if (!Array.isArray(rawDevices) || rawDevices.length === 0) {
        return res.status(400).json({ error: 'devices array is required and cannot be empty' });
      }

      const addedDevices = db.addDevicesBulk(rawDevices);
      // Broadcast bulk additions to all connected WebSocket clients
      for (const dev of addedDevices) {
        broadcastDeviceCreated(dev);
      }

      res.status(201).json({
        success: true,
        message: `Successfully provisioned and registered ${addedDevices.length} equipment in IUB database.`,
        count: addedDevices.length,
        devices: addedDevices,
      });
    } catch (err: any) {
      console.error('Error in bulk device provisioning:', err);
      res.status(500).json({ error: err.message || 'Failed to bulk provision devices' });
    }
  });

  // --- 2FA Authentication, OTP Lifecycle & Session Management ---

  // Request 6-digit OTP for either Login or Sign-up
  app.post('/api/auth/request-otp', (req, res) => {
    try {
      const { purpose, email, password, fullName, role, department, campusAccess, phoneNumber } = req.body;
      if (!email || !purpose) {
        return res.status(400).json({ error: 'Email and purpose (login or signup) are required.' });
      }

      const cleanEmail = String(email).trim().toLowerCase();

      if (purpose === 'login') {
        if (!password) {
          return res.status(400).json({ error: 'Password is required to request login OTP.' });
        }
        const user = db.verifyUser(cleanEmail, password);
        if (!user) {
          return res.status(401).json({ error: 'Invalid email or password. Please verify your credentials.' });
        }
        const { otp, expiresAt } = db.createOtp(cleanEmail, 'login');
        return res.json({
          success: true,
          message: `6-digit 2FA verification code dispatched to ${cleanEmail}.`,
          email: cleanEmail,
          purpose: 'login',
          simulatedOtp: otp,
          expiresAt,
        });
      } else if (purpose === 'signup') {
        if (!fullName || !password) {
          return res.status(400).json({ error: 'Full Name and Password are required.' });
        }
        if (password.length < 6) {
          return res.status(400).json({ error: 'Password must be at least 6 characters.' });
        }
        const existing = db.findUserByEmail(cleanEmail);
        if (existing) {
          return res.status(400).json({ error: `An account with email ${cleanEmail} already exists. Please log in.` });
        }

        const { otp, expiresAt } = db.createOtp(cleanEmail, 'signup', {
          fullName,
          email: cleanEmail,
          password,
          role: role || 'User',
          department,
          campusAccess,
          phoneNumber,
        });

        return res.json({
          success: true,
          message: `6-digit 2FA verification code dispatched to ${cleanEmail}.`,
          email: cleanEmail,
          purpose: 'signup',
          simulatedOtp: otp,
          expiresAt,
        });
      } else {
        return res.status(400).json({ error: 'Invalid purpose specified.' });
      }
    } catch (err: any) {
      console.error('Error in request-otp:', err);
      res.status(500).json({ error: err.message || 'Failed to process 2FA OTP request' });
    }
  });

  // Verify 6-digit OTP code and complete Login or Sign-up
  app.post('/api/auth/verify-otp', (req, res) => {
    try {
      const { email, otp } = req.body;
      if (!email || !otp) {
        return res.status(400).json({ error: 'Email and 6-digit OTP are required.' });
      }

      const cleanEmail = String(email).trim().toLowerCase();
      const verification = db.verifyOtp(cleanEmail, String(otp).trim());

      if (!verification.valid || !verification.record) {
        return res.status(400).json({ error: verification.error || 'Invalid verification code.' });
      }

      const { purpose, userData } = verification.record;

      if (purpose === 'signup') {
        if (!userData) {
          return res.status(400).json({ error: 'Missing registration details in OTP session.' });
        }
        const newUser = db.createUser(userData);
        const { passwordHash, ...sanitized } = newUser;
        return res.status(201).json({
          success: true,
          message: `Identity verified! Welcome to IUB Core NOC, ${sanitized.fullName}.`,
          user: sanitized,
          token: `iub-auth-${sanitized.id}-${Date.now()}`,
        });
      } else {
        // Login flow
        const user = db.findUserByEmail(cleanEmail);
        if (!user) {
          return res.status(404).json({ error: 'User account not found.' });
        }
        user.lastLogin = new Date().toISOString();
        const { passwordHash, ...sanitized } = user;
        return res.json({
          success: true,
          message: `Identity verified! Welcome back, ${sanitized.fullName}.`,
          user: sanitized,
          token: `iub-auth-${sanitized.id}-${Date.now()}`,
        });
      }
    } catch (err: any) {
      console.error('Error in verify-otp:', err);
      res.status(500).json({ error: err.message || 'OTP verification failed' });
    }
  });

  // Resend 6-digit OTP
  app.post('/api/auth/resend-otp', (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ error: 'Email is required to resend OTP.' });
      }
      const cleanEmail = String(email).trim().toLowerCase();
      const existingRecord = db.getPendingOtp(cleanEmail);
      
      const purpose = existingRecord?.purpose || 'login';
      const userData = existingRecord?.userData;

      const { otp, expiresAt } = db.createOtp(cleanEmail, purpose, userData);
      return res.json({
        success: true,
        message: `A fresh 6-digit verification code has been dispatched to ${cleanEmail}.`,
        email: cleanEmail,
        simulatedOtp: otp,
        expiresAt,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to resend verification code' });
    }
  });

  // Direct login (fallback if 2FA skipped or verified)
  app.post('/api/auth/login', (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      const user = db.verifyUser(email, password);
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials. Please verify your email and password.' });
      }

      const { passwordHash, ...sanitized } = user;
      res.json({
        success: true,
        message: `Welcome back, ${sanitized.fullName}! Authenticated as ${sanitized.roleTitle}.`,
        user: sanitized,
        token: `iub-auth-${sanitized.id}-${Date.now()}`,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Authentication failed' });
    }
  });

  // Direct signup (fallback)
  app.post('/api/auth/signup', (req, res) => {
    try {
      const { fullName, email, password, role, department, campusAccess, phoneNumber } = req.body;
      if (!fullName || !email || !password) {
        return res.status(400).json({ error: 'Full Name, Email, and Password are required.' });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
      }

      const newUser = db.createUser({
        fullName,
        email,
        password,
        role,
        department,
        campusAccess,
        phoneNumber,
      });

      const { passwordHash, ...sanitized } = newUser;
      res.status(201).json({
        success: true,
        message: `Account registered successfully for ${sanitized.fullName}.`,
        user: sanitized,
        token: `iub-auth-${sanitized.id}-${Date.now()}`,
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Sign up failed' });
    }
  });

  app.get('/api/auth/me', (req, res) => {
    const users = db.getUsers();
    // Return primary AI Lead Engineer account as default session state
    const primary = users[0] || {
      id: 'ADMIN-ZEESHAN-01',
      fullName: 'Mr. Zeeshan Javed',
      email: 'zeejaved766@gmail.com',
      role: 'Admin',
      roleTitle: 'AI Lead Engineer & NOC System Architect',
      department: 'Directorate of Information Technology (DIT)',
      campusAccess: 'ALL',
      phoneNumber: '+92 300 1234567',
      createdAt: new Date().toISOString(),
      twoFactorVerified: true,
    };
    const { passwordHash, ...sanitized } = primary as any;
    res.json(sanitized);
  });

  // Get user list for Admin panel
  app.get('/api/auth/users', (req, res) => {
    const users = db.getUsers().map((u) => {
      const { passwordHash, ...sanitized } = u;
      return sanitized;
    });
    res.json(users);
  });

  // Update user role (Admin Panel action)
  app.patch('/api/auth/users/:id/role', (req, res) => {
    try {
      const { role, roleTitle } = req.body;
      if (!role) {
        return res.status(400).json({ error: 'role is required' });
      }
      const updated = db.updateUserRole(req.params.id, role, roleTitle);
      if (!updated) {
        return res.status(404).json({ error: 'User not found' });
      }
      const { passwordHash, ...sanitized } = updated;
      res.json({ success: true, message: `User role updated to ${role}`, user: sanitized });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to update user role' });
    }
  });

  // Delete user (Admin Panel action)
  app.delete('/api/auth/users/:id', (req, res) => {
    try {
      const success = db.deleteUser(req.params.id);
      if (!success) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json({ success: true, message: 'User account removed successfully' });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to delete user' });
    }
  });

  app.put('/api/devices/:id', (req, res) => {
    const prevDev = db.getDeviceById(req.params.id);
    const updated = db.updateDevice(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Device not found' });
    }
    if (prevDev && prevDev.status !== updated.status) {
      broadcastDeviceStatusChanged({
        device: updated,
        previousStatus: prevDev.status,
        timestamp: new Date().toISOString(),
      });
    } else {
      broadcastDeviceUpdated(updated);
    }
    res.json(updated);
  });

  app.delete('/api/devices/:id', (req, res) => {
    const success = db.deleteDevice(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Device not found' });
    }
    broadcastDeviceDeleted(req.params.id);
    res.json({ success: true, message: 'Device deleted from IUB database' });
  });

  // Toggle power / simulate failure and alert with real-time push
  app.post('/api/devices/:id/toggle-status', (req, res) => {
    const prevDev = db.getDeviceById(req.params.id);
    const previousStatus = prevDev ? prevDev.status : 'online';
    const alertsBefore = db.getAlerts().length;

    const updated = db.toggleDeviceStatus(req.params.id);
    if (!updated) {
      return res.status(404).json({ error: 'Device not found' });
    }

    // 1. Immediately push real-time status change over WebSocket to all connected browser clients
    broadcastDeviceStatusChanged({
      device: updated,
      previousStatus,
      reason: updated.status === 'offline' ? 'Manual Power Down / Simulated Outage' : 'Power Restored',
      timestamp: new Date().toISOString(),
    });

    // 2. If new alert(s) were generated by matching alert filters, push them via WebSocket
    const alertsAfter = db.getAlerts();
    if (alertsAfter.length > alertsBefore) {
      const newAlert = alertsAfter[0];
      broadcastAlertNew(newAlert);
    }

    res.json(updated);
  });

  // Diagnostics (Ping, Traceroute, SNMP telemetry)
  app.get('/api/devices/:id/diagnostics', (req, res) => {
    const device = db.getDeviceById(req.params.id);
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }
    const result = runDeviceDiagnostics(device);
    res.json(result);
  });

  // Fiber Links (148, 96, 48, 24, 12 Core)
  app.get('/api/fiber-links', (req, res) => {
    res.json(db.getFiberLinks());
  });

  app.get('/api/fiber-links/:id', (req, res) => {
    const link = db.getFiberLinkById(req.params.id);
    if (!link) {
      return res.status(404).json({ error: 'Fiber link not found' });
    }
    res.json(link);
  });

  app.put('/api/fiber-links/:id/core', (req, res) => {
    const { coreNumber, status, service } = req.body;
    const updated = db.updateFiberCoreStatus(req.params.id, Number(coreNumber), status, service);
    if (!updated) {
      return res.status(404).json({ error: 'Failed to update fiber core' });
    }
    broadcastFiberLinkUpdated(updated);
    res.json(updated);
  });

  // Security Events (Suricata & Wazuh)
  app.get('/api/security-events', (req, res) => {
    res.json(db.getSecurityEvents());
  });

  app.post('/api/security-events', (req, res) => {
    const newEvent = db.addSecurityEvent(req.body);
    broadcastSecurityEvent(newEvent);
    res.status(201).json(newEvent);
  });

  // Alerts & Notifications (WhatsApp & Email)
  app.get('/api/alerts', (req, res) => {
    res.json(db.getAlerts());
  });

  app.post('/api/alerts/dispatch', async (req, res) => {
    try {
      const result = await alertDispatcher.dispatchAlert(req.body);
      const alerts = db.getAlerts();
      if (alerts.length > 0) {
        broadcastAlertNew(alerts[0]);
      }
      res.json({ success: true, ...result });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Alert dispatch failed' });
    }
  });

  // WhatsApp Group Outage Alert Broadcast endpoint
  app.post('/api/alerts/dispatch-group', (req, res) => {
    try {
      const { groupName, customNote, offlineDeviceIds } = req.body;
      const result = alertDispatcher.dispatchGroupOfflineAlert({
        groupName,
        customNote,
        offlineDeviceIds,
      });

      const alerts = db.getAlerts();
      if (alerts.length > 0) {
        broadcastAlertNew(alerts[0]);
      }

      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'WhatsApp group dispatch failed' });
    }
  });

  app.put('/api/alerts/:id/resolve', (req, res) => {
    const success = db.resolveAlert(req.params.id);
    res.json({ success });
  });

  app.get('/api/alerts/settings', (req, res) => {
    res.json(alertDispatcher.getSettings());
  });

  app.put('/api/alerts/settings', (req, res) => {
    alertDispatcher.updateSettings(req.body);
    res.json({ success: true, settings: alertDispatcher.getSettings() });
  });

  // --- Daily Automated Network Uptime Summary Report API ---
  app.get('/api/alerts/uptime-report/preview', (req, res) => {
    try {
      const email = req.query.email as string | undefined;
      const reportData = alertDispatcher.generateDailyUptimeReportData(email);
      const htmlPreview = alertDispatcher.buildDailyUptimeEmailHtml(reportData);
      res.json({ success: true, reportData, htmlPreview });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to generate report preview' });
    }
  });

  app.post('/api/alerts/uptime-report/send', async (req, res) => {
    try {
      const { recipientEmail, manualTrigger } = req.body;
      const result = await alertDispatcher.sendDailyUptimeReport({
        recipientEmail,
        manualTrigger: manualTrigger ?? true,
      });

      const alerts = db.getAlerts();
      if (alerts.length > 0) {
        broadcastAlertNew(alerts[0]);
      }

      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to dispatch daily uptime report' });
    }
  });

  app.get('/api/alerts/uptime-report/settings', (req, res) => {
    res.json(alertDispatcher.getUptimeReportSettings());
  });

  app.put('/api/alerts/uptime-report/settings', (req, res) => {
    try {
      const updated = alertDispatcher.updateUptimeReportSettings(req.body);
      res.json({ success: true, settings: updated });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to update settings' });
    }
  });

  // --- Advanced Alerting Rules & Filters API ---

  app.get('/api/alert-rules', (req, res) => {
    res.json(db.getAlertRules());
  });

  app.post('/api/alert-rules', (req, res) => {
    try {
      const created = db.createAlertRule(req.body);
      broadcastAlertRulesUpdated(db.getAlertRules());
      res.status(201).json(created);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to create alert rule' });
    }
  });

  app.put('/api/alert-rules/:id', (req, res) => {
    const updated = db.updateAlertRule(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Alert rule not found' });
    }
    broadcastAlertRulesUpdated(db.getAlertRules());
    res.json(updated);
  });

  app.delete('/api/alert-rules/:id', (req, res) => {
    const success = db.deleteAlertRule(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Alert rule not found' });
    }
    broadcastAlertRulesUpdated(db.getAlertRules());
    res.json({ success: true });
  });

  app.post('/api/alert-rules/:id/toggle', (req, res) => {
    const updated = db.toggleAlertRule(req.params.id);
    if (!updated) {
      return res.status(404).json({ error: 'Alert rule not found' });
    }
    broadcastAlertRulesUpdated(db.getAlertRules());
    res.json(updated);
  });

  // Dry-run evaluate an incident against current alert filters
  app.post('/api/alert-rules/test-evaluate', (req, res) => {
    const { deviceId, deviceType, campus, isDowntime, severity } = req.body;
    let targetDev = deviceId ? db.getDeviceById(deviceId) : null;
    if (!targetDev) {
      targetDev = {
        id: 'TEST-DEV',
        name: 'Test Network Equipment',
        type: deviceType || 'router',
        campus: campus || 'BJC',
        model: 'Test Chassis',
        building: 'NOC Block',
        roomNo: 'Lab 1',
        status: isDowntime ? 'offline' : 'online',
        ipAddress: '10.10.99.99',
        macAddress: '00:00:00:00:00:00',
        rackId: 'RACK-01',
        portsTotal: 48,
        portsActive: 24,
        latencyMs: 1.2,
        packetLoss: 0,
        cpuUsage: 30,
        memoryUsage: 40,
        temperatureC: 32,
        bandwidthInMbps: 100,
        bandwidthOutMbps: 100,
        snmpCommunity: 'public',
        snmpVersion: 'v2c',
        prtgSensorId: 'PRTG-999',
        zabbixHostId: 'ZAB-999',
        suricataThreatLevel: 'safe',
        lastSeen: new Date().toISOString(),
        uptime: '1d',
      };
    }

    const matched = db.matchAlertRules(targetDev, {
      severity: severity || 'critical',
      reason: 'Rule Evaluation Test Simulation',
      isDowntime: isDowntime !== undefined ? Boolean(isDowntime) : true,
    });

    res.json({
      deviceEvaluated: targetDev,
      matchedRulesCount: matched.length,
      matchedRules: matched,
      wouldDispatchAlert: matched.length > 0,
    });
  });

  // System Engine Metrics (PRTG, Zabbix, Suricata, Wazuh)
  app.get('/api/metrics', (req, res) => {
    res.json(db.getSystemMetrics());
  });

  // Google Sheets Export: CSV format for instant download or import
  app.get('/api/export/csv', (req, res) => {
    const devices = db.getDevices();
    const headers = [
      'Device Name',
      'Device Number',
      'Device Type',
      'Campus',
      'Building',
      'Room No',
      'Device Location',
      'Rack ID',
      'Model',
      'IP Address',
      'MAC Address',
      'Status',
      'Switch Location',
      'Switch Building',
      'Switch Model',
      'Switch Port',
      'Device Port',
      'Ports Total',
      'Ports Active',
      'Latency (ms)',
      'Packet Loss (%)',
      'CPU (%)',
      'Memory (%)',
      'Fiber Cores',
      'PRTG Sensor ID',
      'Zabbix Host ID',
      'Last Seen',
    ];

    const rows = devices.map((d) => [
      `"${d.name.replace(/"/g, '""')}"`,
      `"${(d.deviceNumber || 'N/A').replace(/"/g, '""')}"`,
      `"${d.type}"`,
      `"${d.campus}"`,
      `"${d.building.replace(/"/g, '""')}"`,
      `"${d.roomNo.replace(/"/g, '""')}"`,
      `"${(d.deviceLocation || 'N/A').replace(/"/g, '""')}"`,
      `"${d.rackId}"`,
      `"${d.model.replace(/"/g, '""')}"`,
      `"${d.ipAddress}"`,
      `"${d.macAddress}"`,
      `"${d.status}"`,
      `"${(d.switchLocation || 'N/A').replace(/"/g, '""')}"`,
      `"${(d.switchBuilding || 'N/A').replace(/"/g, '""')}"`,
      `"${(d.switchModel || 'N/A').replace(/"/g, '""')}"`,
      `"${(d.switchPort || 'N/A').replace(/"/g, '""')}"`,
      `"${(d.devicePort || 'N/A').replace(/"/g, '""')}"`,
      d.portsTotal,
      d.portsActive,
      d.latencyMs,
      d.packetLoss,
      d.cpuUsage,
      d.memoryUsage,
      d.fiberCores || 'N/A',
      `"${d.prtgSensorId}"`,
      `"${d.zabbixHostId}"`,
      `"${d.lastSeen}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="iub_network_inventory.csv"');
    res.send(csvContent);
  });

  // Google Sheets API formatted JSON
  app.get('/api/export/google-sheet-data', (req, res) => {
    const devices = db.getDevices();
    res.json({
      title: 'IUB Network Monitoring Core Inventory',
      leadEngineer: 'Mr. Zeeshan Javed (AI Lead Engineer)',
      exportTimestamp: new Date().toISOString(),
      rowCount: devices.length,
      columns: ['Name', 'Device Number', 'Type', 'Campus', 'Building', 'Room', 'Device Location', 'IP', 'Status', 'Ports', 'Switch Location', 'Switch Port', 'Device Port', 'Switch Model', 'LatencyMs', 'Uptime'],
      data: devices.map((d) => [
        d.name,
        d.deviceNumber || 'N/A',
        d.type,
        d.campus,
        d.building,
        d.roomNo,
        d.deviceLocation || 'N/A',
        d.ipAddress,
        d.status,
        `${d.portsActive}/${d.portsTotal}`,
        d.switchLocation || 'N/A',
        d.switchPort || 'N/A',
        d.devicePort || 'N/A',
        d.switchModel || 'N/A',
        `${d.latencyMs}ms`,
        d.uptime,
      ]),
    });
  });

  // IUB NOC AI Copilot Chatbot Endpoint (Gemini 3.8 Flash / 3.1 Flash-Lite + Search & Maps Grounding)
  app.post('/api/chat', async (req, res) => {
    try {
      const { message, history, modelPreference, toolMode, selectedCampus, userLatLng, chatbotRole } = req.body;
      if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'Valid message string is required.' });
      }

      const devices = db.getDevices();
      const metrics = db.getSystemMetrics();
      const alerts = db.getAlerts();

      const result = await processChatQuery(
        message,
        Array.isArray(history) ? history : [],
        devices,
        metrics,
        alerts,
        {
          modelPreference,
          toolMode,
          selectedCampus,
          userLatLng,
          chatbotRole,
        }
      );

      res.json(result);
    } catch (error: any) {
      console.warn('Chat endpoint notice:', error?.message);
      res.status(500).json({
        error: error?.message || 'Failed to process AI chat query.',
      });
    }
  });

  // Hardware Health & Rack Telemetry Endpoints (Temperature, Fan Speed, PSU, UPS)
  app.get('/api/hardware-health/racks', (req, res) => {
    const { campus } = req.query;
    const racks = hardwareHealthService.getAllRacks(campus as string);
    res.json(racks);
  });

  app.get('/api/hardware-health/summary', (req, res) => {
    const summary = hardwareHealthService.getMetricsSummary();
    res.json(summary);
  });

  app.get('/api/hardware-health/logs', (req, res) => {
    const { campus, rackId, severity, search, limit } = req.query;
    const logs = hardwareHealthService.getLogs({
      campus: campus as string,
      rackId: rackId as string,
      severity: severity as string,
      search: search as string,
      limit: limit ? Number(limit) : 50,
    });
    res.json(logs);
  });

  app.post('/api/hardware-health/diagnose', (req, res) => {
    const { rackId } = req.body;
    if (!rackId) {
      return res.status(400).json({ error: 'rackId is required for diagnostic probe.' });
    }
    const result = hardwareHealthService.triggerDiagnosticProbe(rackId);
    res.json(result);
  });

  app.post('/api/hardware-health/log', (req, res) => {
    try {
      const log = hardwareHealthService.addLog(req.body);
      res.status(201).json(log);
    } catch (err: any) {
      res.status(400).json({ error: err?.message || 'Failed to record hardware log.' });
    }
  });

  // Reset database to official IUB state
  app.post('/api/reset-database', (req, res) => {
    db.resetToDefaults();
    res.json({ success: true, message: 'Database reset to default IUB multi-campus topology.' });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`IUB Network Monitoring Core Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
