import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  User, 
  signOut 
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { Device } from '../types.ts';

// Initialize Firebase App instance safely
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// Configure Google Provider with the approved Google Sheets and Google Drive scopes
export const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/spreadsheets.readonly',
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.readonly',
];

const provider = new GoogleAuthProvider();
SCOPES.forEach((scope) => {
  provider.addScope(scope);
});
provider.setCustomParameters({
  prompt: 'select_account',
});

// Strictly in-memory caching for OAuth Access Token (never localStorage or sessionStorage)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

/**
 * Initialize Auth listener. Notifies whenever auth state transitions.
 */
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // Need user interaction to retrieve a fresh access token with scopes
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

/**
 * Trigger client-side Google popup sign-in to obtain OAuth access token
 */
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to obtain Google OAuth access token.');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Sign-In Error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

/**
 * Retrieve the current in-memory cached access token
 */
export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

/**
 * Sign out and clear cached credentials
 */
export const logout = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};

/**
 * Helper to build standard inventory rows matching IUB schema
 */
export const formatDeviceRows = (devices: Device[]) => {
  const headers = [
    'Device Name',
    'Device Number',
    'Equipment Type',
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
    'Active Ports',
    'Total Ports',
    'Latency (ms)',
    'Packet Loss (%)',
    'CPU Usage (%)',
    'Memory Usage (%)',
    'Temp (°C)',
    'Bandwidth In (Mbps)',
    'Bandwidth Out (Mbps)',
    'Fiber Cores',
    'PRTG Sensor ID',
    'Zabbix Host ID',
    'Suricata Threat',
    'Uptime',
    'Last Seen (PKT)',
  ];

  const rows = devices.map((d) => [
    d.name,
    d.deviceNumber || 'N/A',
    d.type.toUpperCase(),
    d.campus,
    d.building,
    d.roomNo,
    d.deviceLocation || 'N/A',
    d.rackId,
    d.model,
    d.ipAddress,
    d.macAddress,
    d.status.toUpperCase(),
    d.switchLocation || 'N/A',
    d.switchBuilding || 'N/A',
    d.switchModel || 'N/A',
    d.switchPort || 'N/A',
    d.devicePort || 'N/A',
    d.portsActive,
    d.portsTotal,
    d.latencyMs,
    d.packetLoss,
    d.cpuUsage,
    d.memoryUsage,
    d.temperatureC,
    d.bandwidthInMbps,
    d.bandwidthOutMbps,
    d.fiberCores || 'N/A',
    d.prtgSensorId,
    d.zabbixHostId,
    d.suricataThreatLevel || 'safe',
    d.uptime,
    d.lastSeen,
  ]);

  return { headers, rows };
};

export interface CreatedSpreadsheet {
  id: string;
  url: string;
  title: string;
  createdTime: string;
  rowCount: number;
}

/**
 * Create a new Google Spreadsheet via the Google Sheets API and populate with IUB devices
 */
export const createInventorySpreadsheet = async (
  titleSuffix: string,
  devices: Device[]
): Promise<CreatedSpreadsheet> => {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Authentication required. Please sign in with Google first.');
  }

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const sheetTitle = `IUB Network Core Inventory (${dateStr} ${titleSuffix || ''})`.trim();

  // 1. Create Spreadsheet
  const createResp = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title: sheetTitle,
      },
      sheets: [
        {
          properties: {
            title: 'IUB Network Devices',
            gridProperties: {
              frozenRowCount: 1,
            },
          },
        },
      ],
    }),
  });

  if (!createResp.ok) {
    const err = await createResp.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to create spreadsheet: ${createResp.statusText}`);
  }

  const spreadsheet = await createResp.json();
  const spreadsheetId = spreadsheet.spreadsheetId;
  const sheetId = spreadsheet.sheets?.[0]?.properties?.sheetId || 0;

  // 2. Populate Headers & Device Rows
  const { headers, rows } = formatDeviceRows(devices);
  const values = [headers, ...rows];

  const updateResp = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'IUB Network Devices'!A1?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range: "'IUB Network Devices'!A1",
        majorDimension: 'ROWS',
        values,
      }),
    }
  );

  if (!updateResp.ok) {
    const err = await updateResp.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to write device rows: ${updateResp.statusText}`);
  }

  // 3. Format header row: IUB dark green #0B3D2E, white bold text, auto-resize columns
  try {
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          {
            repeatCell: {
              range: {
                sheetId,
                startRowIndex: 0,
                endRowIndex: 1,
                startColumnIndex: 0,
                endColumnIndex: headers.length,
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: {
                    red: 0.05,
                    green: 0.28,
                    blue: 0.18,
                  },
                  textFormat: {
                    bold: true,
                    foregroundColor: {
                      red: 1,
                      green: 1,
                      blue: 1,
                    },
                    fontSize: 10,
                  },
                  horizontalAlignment: 'CENTER',
                },
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)',
            },
          },
          {
            autoResizeDimensions: {
              dimensions: {
                sheetId,
                dimension: 'COLUMNS',
                startIndex: 0,
                endIndex: headers.length,
              },
            },
          },
        ],
      }),
    });
  } catch (formatErr) {
    console.warn('Formatting spreadsheet warning (data was written):', formatErr);
  }

  return {
    id: spreadsheetId,
    url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
    title: sheetTitle,
    createdTime: now.toISOString(),
    rowCount: devices.length,
  };
};

/**
 * Update an existing Google Spreadsheet with current devices
 */
export const updateExistingSpreadsheet = async (
  spreadsheetId: string,
  devices: Device[]
): Promise<{ updatedCells: number; updatedRows: number }> => {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Authentication required. Please sign in with Google first.');
  }

  const { headers, rows } = formatDeviceRows(devices);
  const values = [headers, ...rows];

  // Try updating the first sheet or named range
  const updateResp = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A1?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range: 'A1',
        majorDimension: 'ROWS',
        values,
      }),
    }
  );

  if (!updateResp.ok) {
    const err = await updateResp.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to update spreadsheet: ${updateResp.statusText}`);
  }

  const result = await updateResp.json();
  return {
    updatedCells: result.updatedCells || values.length * headers.length,
    updatedRows: result.updatedRows || values.length,
  };
};

export interface DriveSpreadsheetFile {
  id: string;
  name: string;
  modifiedTime: string;
  webViewLink?: string;
}

/**
 * List the user's spreadsheets from Google Drive
 */
export const listUserSpreadsheets = async (): Promise<DriveSpreadsheetFile[]> => {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Authentication required. Please sign in with Google first.');
  }

  const query = encodeURIComponent("mimeType='application/vnd.google-apps.spreadsheet' and trashed=false");
  const resp = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&orderBy=modifiedTime desc&pageSize=15&fields=files(id,name,modifiedTime,webViewLink)`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to fetch Google Drive sheets: ${resp.statusText}`);
  }

  const data = await resp.json();
  return data.files || [];
};

/**
 * Read rows from a spreadsheet
 */
export const readSpreadsheetData = async (
  spreadsheetId: string,
  range: string = 'A1:H15'
): Promise<string[][]> => {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Authentication required. Please sign in with Google first.');
  }

  const resp = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to read spreadsheet data: ${resp.statusText}`);
  }

  const data = await resp.json();
  return data.values || [];
};
