import React, { useState, useEffect } from 'react';
import { 
  X, 
  FileSpreadsheet, 
  Download, 
  Copy, 
  Check, 
  RefreshCw, 
  CheckCircle2, 
  ExternalLink, 
  LogIn, 
  LogOut, 
  AlertTriangle, 
  FolderSync, 
  PlusCircle, 
  Eye, 
  Table, 
  Search,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { User } from 'firebase/auth';
import { Device } from '../types.ts';
import { 
  initAuth, 
  googleSignIn, 
  logout, 
  createInventorySpreadsheet, 
  updateExistingSpreadsheet, 
  listUserSpreadsheets, 
  readSpreadsheetData, 
  CreatedSpreadsheet, 
  DriveSpreadsheetFile 
} from '../lib/googleSheets.ts';

interface GoogleSheetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  devices: Device[];
}

export const GoogleSheetsModal: React.FC<GoogleSheetsModalProps> = ({
  isOpen,
  onClose,
  devices,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'create' | 'existing' | 'preview' | 'formula'>('create');

  // Sheet Creation State
  const [sheetSuffix, setSheetSuffix] = useState('NOC Core');
  const [isCreating, setIsCreating] = useState(false);
  const [createdSheet, setCreatedSheet] = useState<CreatedSpreadsheet | null>(null);

  // Existing Sheet Sync State
  const [driveSheets, setDriveSheets] = useState<DriveSpreadsheetFile[]>([]);
  const [isLoadingDrive, setIsLoadingDrive] = useState(false);
  const [selectedSheetId, setSelectedSheetId] = useState('');
  const [customSheetInput, setCustomSheetInput] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateResult, setUpdateResult] = useState<{ updatedRows: number } | null>(null);

  // Confirmation Modal for Destructive Workspace Operation
  const [confirmUpdateSheet, setConfirmUpdateSheet] = useState<{ id: string; name: string } | null>(null);

  // Preview State
  const [previewRows, setPreviewRows] = useState<string[][] | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);

  // Formula State
  const [copiedFormula, setCopiedFormula] = useState(false);

  // Initialize auth listener
  useEffect(() => {
    if (!isOpen) return;
    const unsubscribe = initAuth(
      (currentUser, currentToken) => {
        setUser(currentUser);
        setToken(currentToken);
        setAuthError(null);
      },
      () => {
        setUser(null);
        setToken(null);
      }
    );
    return () => unsubscribe();
  }, [isOpen]);

  // Load drive spreadsheets when authenticated
  useEffect(() => {
    if (token && (activeTab === 'existing' || activeTab === 'preview')) {
      loadDriveFiles();
    }
  }, [token, activeTab]);

  const loadDriveFiles = async () => {
    setIsLoadingDrive(true);
    try {
      const files = await listUserSpreadsheets();
      setDriveSheets(files);
      if (files.length > 0 && !selectedSheetId) {
        setSelectedSheetId(files[0].id);
      }
    } catch (err: any) {
      console.warn('Drive fetch error:', err);
    } finally {
      setIsLoadingDrive(false);
    }
  };

  const handleSignIn = async () => {
    setIsAuthenticating(true);
    setAuthError(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setToken(res.accessToken);
      }
    } catch (err: any) {
      setAuthError(err.message || 'Google Sign-In failed. Please verify popup blockers.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await logout();
      setUser(null);
      setToken(null);
      setCreatedSheet(null);
      setPreviewRows(null);
      setDriveSheets([]);
    } catch (err: any) {
      console.error('Logout error:', err);
    }
  };

  const handleCreateSheet = async () => {
    if (!token) {
      handleSignIn();
      return;
    }

    setIsCreating(true);
    setAuthError(null);
    try {
      const result = await createInventorySpreadsheet(sheetSuffix, devices);
      setCreatedSheet(result);
      // Also refresh drive list
      loadDriveFiles();
    } catch (err: any) {
      setAuthError(err.message || 'Failed to create Google Sheet.');
    } finally {
      setIsCreating(false);
    }
  };

  // Extract ID from URL if pasted
  const parseSpreadsheetId = (input: string) => {
    const trimmed = input.trim();
    const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) return match[1];
    return trimmed;
  };

  // Trigger confirmation dialog for updating existing sheet
  const handleRequestUpdate = (sheetId: string, sheetName: string) => {
    const finalId = parseSpreadsheetId(sheetId);
    if (!finalId) {
      setAuthError('Please select or enter a valid Google Spreadsheet ID or URL.');
      return;
    }
    setConfirmUpdateSheet({ id: finalId, name: sheetName || finalId });
  };

  // Execute update after user confirmation
  const handleConfirmUpdate = async () => {
    if (!confirmUpdateSheet) return;
    const { id } = confirmUpdateSheet;
    setConfirmUpdateSheet(null);
    setIsUpdating(true);
    setUpdateResult(null);
    setAuthError(null);

    try {
      const result = await updateExistingSpreadsheet(id, devices);
      setUpdateResult(result);
    } catch (err: any) {
      setAuthError(err.message || 'Failed to update Google Sheet.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePreviewSheet = async (sheetId: string) => {
    const finalId = parseSpreadsheetId(sheetId);
    if (!finalId) return;
    setIsPreviewing(true);
    try {
      const rows = await readSpreadsheetData(finalId, 'A1:H10');
      setPreviewRows(rows);
    } catch (err: any) {
      setAuthError(err.message || 'Failed to preview sheet rows.');
    } finally {
      setIsPreviewing(false);
    }
  };

  if (!isOpen) return null;

  const currentHost = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const csvUrl = `${currentHost}/api/export/csv`;
  const sheetsFormula = `=IMPORTDATA("${csvUrl}")`;

  const handleCopyFormula = () => {
    navigator.clipboard.writeText(sheetsFormula);
    setCopiedFormula(true);
    setTimeout(() => setCopiedFormula(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-[#0A0B0E] border border-[#2D3139] rounded-xl shadow-2xl text-[#E5E7EB] overflow-hidden my-6">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#2D3139] flex items-center justify-between bg-[#16181D]">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-lg bg-[#0A0B0E] border border-emerald-500/30 text-emerald-400">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Google Sheets Network Inventory Integration
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                  WORKSPACE API v4
                </span>
              </div>
              <p className="text-xs text-[#9CA3AF] mt-0.5">
                Direct read/write synchronization with Google Drive & Google Sheets
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#9CA3AF] hover:text-white hover:bg-[#1E2229] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Account & Authentication Banner */}
        <div className="px-6 py-3 bg-[#111317] border-b border-[#2D3139] flex flex-wrap items-center justify-between gap-3">
          {user ? (
            <div className="flex items-center space-x-3">
              {user.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt={user.displayName || 'User'} 
                  className="w-8 h-8 rounded-full border border-emerald-500/40"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-emerald-900/60 border border-emerald-500/40 text-emerald-300 font-bold flex items-center justify-center text-xs">
                  {user.email?.[0].toUpperCase() || 'U'}
                </div>
              )}
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-semibold text-white">{user.displayName || 'Google Account'}</span>
                  <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-medium px-1.5 py-0.2 rounded bg-emerald-950/50 border border-emerald-800/30">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    Authorized
                  </span>
                </div>
                <div className="text-[11px] text-gray-400 font-mono">{user.email}</div>
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-2 text-xs text-gray-300">
              <span className="dot offline"></span>
              <span>Not signed in with Google Workspace. Sign in to create or update your Google Sheets:</span>
            </div>
          )}

          <div>
            {user ? (
              <button
                onClick={handleSignOut}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-[#1E2229] hover:bg-[#2A303C] text-gray-300 hover:text-white rounded-lg text-xs font-medium border border-[#2D3139] transition cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5 text-gray-400" />
                <span>Sign Out</span>
              </button>
            ) : (
              <button 
                onClick={handleSignIn}
                disabled={isAuthenticating}
                className="gsi-material-button"
                id="google-signin-btn"
              >
                <div className="gsi-material-button-state"></div>
                <div className="gsi-material-button-content-wrapper">
                  <div className="gsi-material-button-icon">
                    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ display: 'block' }}>
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                      <path fill="none" d="M0 0h48v48H0z"></path>
                    </svg>
                  </div>
                  <span className="gsi-material-button-contents">
                    {isAuthenticating ? 'Connecting...' : 'Sign in with Google'}
                  </span>
                </div>
              </button>
            )}
          </div>
        </div>

        {/* Error Notification */}
        {authError && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-red-950/40 border border-red-500/50 text-red-300 text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold">Notice: </span>
              {authError}
            </div>
            <button onClick={() => setAuthError(null)} className="text-red-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="px-6 pt-4 border-b border-[#2D3139] flex space-x-6 text-xs font-medium">
          <button
            onClick={() => setActiveTab('create')}
            className={`pb-2.5 border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'create'
                ? 'border-emerald-500 text-emerald-400 font-semibold'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create New Spreadsheet</span>
          </button>

          <button
            onClick={() => setActiveTab('existing')}
            className={`pb-2.5 border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'existing'
                ? 'border-emerald-500 text-emerald-400 font-semibold'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <FolderSync className="w-4 h-4" />
            <span>Update Existing Sheet</span>
          </button>

          <button
            onClick={() => setActiveTab('preview')}
            className={`pb-2.5 border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'preview'
                ? 'border-emerald-500 text-emerald-400 font-semibold'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Table className="w-4 h-4" />
            <span>Live Sheet Preview</span>
          </button>

          <button
            onClick={() => setActiveTab('formula')}
            className={`pb-2.5 border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'formula'
                ? 'border-emerald-500 text-emerald-400 font-semibold'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Copy className="w-4 h-4" />
            <span>Import Formula & CSV</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 text-xs space-y-4 max-h-[60vh] overflow-y-auto">
          
          {/* TAB 1: CREATE NEW SPREADSHEET */}
          {activeTab === 'create' && (
            <div className="space-y-4">
              <div className="bg-[#16181D] p-4 rounded-lg border border-[#2D3139] space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>1-Click Google Sheets Export</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-900/30 text-blue-400 border border-blue-800/40">
                        {devices.length} Devices Ready
                      </span>
                    </h4>
                    <p className="text-gray-400 text-xs mt-1 leading-relaxed">
                      Creates a brand new Google Spreadsheet in your personal Google Drive with IUB Green styling, frozen header rows, auto-resized columns, and all current hardware metadata including:
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  <div className="p-2 rounded bg-[#0A0B0E] border border-[#2D3139]">
                    <span className="text-gray-400 text-[10px] block">Location Info</span>
                    <strong className="text-white">Campus & Building</strong>
                  </div>
                  <div className="p-2 rounded bg-[#0A0B0E] border border-[#2D3139]">
                    <span className="text-gray-400 text-[10px] block">New Fields</span>
                    <strong className="text-emerald-400">Room & Spot Location</strong>
                  </div>
                  <div className="p-2 rounded bg-[#0A0B0E] border border-[#2D3139]">
                    <span className="text-gray-400 text-[10px] block">Hardware ID</span>
                    <strong className="text-cyan-300">Device Number / Model</strong>
                  </div>
                  <div className="p-2 rounded bg-[#0A0B0E] border border-[#2D3139]">
                    <span className="text-gray-400 text-[10px] block">Switch Patching</span>
                    <strong className="text-amber-400">Switch & Device Port</strong>
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                  <div className="flex-1 w-full">
                    <label className="block text-[11px] text-gray-400 mb-1">Spreadsheet Title Suffix</label>
                    <input
                      type="text"
                      value={sheetSuffix}
                      onChange={(e) => setSheetSuffix(e.target.value)}
                      placeholder="e.g. NOC Core, BJC Campus, Audit 2026"
                      className="w-full px-3 py-2 bg-[#0A0B0E] border border-[#2D3139] rounded-lg text-white text-xs focus:outline-none focus:border-emerald-500 font-medium"
                    />
                  </div>
                  <div className="pt-5 w-full sm:w-auto">
                    <button
                      onClick={handleCreateSheet}
                      disabled={isCreating}
                      className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition cursor-pointer disabled:opacity-50 shadow-lg shadow-emerald-950/40"
                    >
                      <RefreshCw className={`w-4 h-4 ${isCreating ? 'animate-spin' : ''}`} />
                      <span>{isCreating ? 'Writing to Google Sheets...' : 'Generate New Google Sheet'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Created Sheet Success Banner */}
              {createdSheet && (
                <div className="p-4 rounded-lg bg-emerald-950/30 border border-emerald-500/50 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-emerald-300 font-bold text-sm">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      <span>Spreadsheet Created Successfully!</span>
                    </div>
                    <span className="text-[10px] font-mono text-gray-400">
                      ID: {createdSheet.id.slice(0, 16)}...
                    </span>
                  </div>
                  <p className="text-gray-300 text-xs">
                    Title: <strong className="text-white">{createdSheet.title}</strong> &bull; Total Devices Written: <strong className="text-emerald-400">{createdSheet.rowCount}</strong>
                  </p>
                  <div className="pt-1 flex items-center space-x-3">
                    <a
                      href={createdSheet.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg transition text-xs shadow-md"
                    >
                      <span>Open in Google Sheets</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <button
                      onClick={() => {
                        setSelectedSheetId(createdSheet.id);
                        setActiveTab('preview');
                        handlePreviewSheet(createdSheet.id);
                      }}
                      className="inline-flex items-center space-x-1.5 px-3 py-2 bg-[#16181D] hover:bg-[#1E2229] text-gray-300 rounded-lg border border-[#2D3139] text-xs font-medium"
                    >
                      <Eye className="w-3.5 h-3.5 text-blue-400" />
                      <span>Preview Rows Here</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: UPDATE EXISTING SPREADSHEET */}
          {activeTab === 'existing' && (
            <div className="space-y-4">
              <div className="bg-[#16181D] p-4 rounded-lg border border-[#2D3139] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>Sync to Existing Google Sheet</span>
                    </h4>
                    <p className="text-gray-400 text-xs mt-0.5">
                      Select a spreadsheet from your Google Drive or provide a Google Spreadsheet link to overwrite with the latest state of all {devices.length} devices.
                    </p>
                  </div>
                  <button
                    onClick={loadDriveFiles}
                    disabled={isLoadingDrive}
                    className="p-1.5 rounded bg-[#0A0B0E] border border-[#2D3139] text-gray-400 hover:text-white transition"
                    title="Refresh Drive List"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingDrive ? 'animate-spin text-emerald-400' : ''}`} />
                  </button>
                </div>

                {driveSheets.length > 0 && (
                  <div>
                    <label className="block text-[11px] text-gray-400 mb-1">Select from your Google Drive</label>
                    <select
                      value={selectedSheetId}
                      onChange={(e) => setSelectedSheetId(e.target.value)}
                      className="w-full px-3 py-2 bg-[#0A0B0E] border border-[#2D3139] rounded-lg text-white text-xs focus:outline-none focus:border-emerald-500 font-medium"
                    >
                      {driveSheets.map((file) => (
                        <option key={file.id} value={file.id}>
                          {file.name} (Modified: {new Date(file.modifiedTime).toLocaleDateString()})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] text-gray-400 mb-1">Or Paste Google Spreadsheet URL / ID</label>
                  <input
                    type="text"
                    value={customSheetInput}
                    onChange={(e) => setCustomSheetInput(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit"
                    className="w-full px-3 py-2 bg-[#0A0B0E] border border-[#2D3139] rounded-lg text-white text-xs focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div className="pt-2 flex items-center space-x-3">
                  <button
                    onClick={() => {
                      const targetId = customSheetInput || selectedSheetId;
                      const selectedObj = driveSheets.find((f) => f.id === targetId);
                      handleRequestUpdate(targetId, selectedObj?.name || 'Selected Spreadsheet');
                    }}
                    disabled={isUpdating || (!selectedSheetId && !customSheetInput)}
                    className="inline-flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition cursor-pointer disabled:opacity-50 shadow-md"
                  >
                    <FolderSync className={`w-4 h-4 ${isUpdating ? 'animate-spin' : ''}`} />
                    <span>{isUpdating ? 'Syncing...' : 'Sync Inventory to this Sheet'}</span>
                  </button>

                  <button
                    onClick={() => {
                      const targetId = customSheetInput || selectedSheetId;
                      handlePreviewSheet(targetId);
                      setActiveTab('preview');
                    }}
                    disabled={!selectedSheetId && !customSheetInput}
                    className="inline-flex items-center space-x-1.5 px-3 py-2 bg-[#0A0B0E] hover:bg-[#1E2229] text-gray-300 rounded-lg border border-[#2D3139] text-xs font-medium"
                  >
                    <Eye className="w-3.5 h-3.5 text-blue-400" />
                    <span>Inspect Sheet First</span>
                  </button>
                </div>
              </div>

              {updateResult && (
                <div className="p-3.5 rounded-lg bg-emerald-950/30 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    Successfully synchronized <strong>{updateResult.updatedRows} rows</strong> into the Google Spreadsheet.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: LIVE SHEET PREVIEW */}
          {activeTab === 'preview' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">Direct Spreadsheet Row Inspector</h4>
                  <p className="text-gray-400 text-xs mt-0.5">Read cells live from your linked Google Sheet</p>
                </div>
                {(selectedSheetId || customSheetInput) && (
                  <button
                    onClick={() => handlePreviewSheet(customSheetInput || selectedSheetId)}
                    disabled={isPreviewing}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-[#16181D] hover:bg-[#1E2229] border border-[#2D3139] rounded-lg text-xs text-white"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isPreviewing ? 'animate-spin text-emerald-400' : ''}`} />
                    <span>Refresh Data</span>
                  </button>
                )}
              </div>

              {isPreviewing ? (
                <div className="py-12 text-center text-gray-400 space-y-2">
                  <RefreshCw className="w-6 h-6 text-emerald-400 animate-spin mx-auto" />
                  <p>Fetching cells from Google Sheets API...</p>
                </div>
              ) : previewRows && previewRows.length > 0 ? (
                <div className="border border-[#2D3139] rounded-lg overflow-x-auto bg-[#0A0B0E]">
                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead>
                      <tr className="bg-[#16181D] border-b border-[#2D3139] text-gray-300">
                        {previewRows[0].map((cell, idx) => (
                          <th key={idx} className="p-2 font-semibold border-r border-[#2D3139] last:border-r-0 truncate max-w-[150px]">
                            {cell}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewRows.slice(1).map((row, rowIdx) => (
                        <tr key={rowIdx} className="border-b border-[#2D3139] hover:bg-[#16181D]/50 text-gray-400">
                          {row.map((cell, cellIdx) => (
                            <td key={cellIdx} className="p-2 border-r border-[#2D3139] last:border-r-0 truncate max-w-[150px] font-mono">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-10 text-center text-gray-500 border border-dashed border-[#2D3139] rounded-lg">
                  <FileSpreadsheet className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                  <p>No preview loaded yet. Create a sheet or select one from the "Update Existing Sheet" tab to inspect it.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: IMPORTDATA FORMULA & CSV DOWNLOAD */}
          {activeTab === 'formula' && (
            <div className="space-y-4">
              {/* Method 1: Live Dynamic Formula */}
              <div className="bg-[#16181D] p-4 rounded-lg border border-[#2D3139] space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white flex items-center gap-2">
                    <span>Live Auto-Sync via IMPORTDATA Formula</span>
                    <span className="px-2 py-0.5 bg-blue-900/30 text-blue-400 rounded text-[10px] font-mono border border-blue-800/40">
                      NO AUTH REQUIRED
                    </span>
                  </h4>
                </div>
                <p className="text-[#9CA3AF]">
                  You can also paste this formula into cell <strong className="text-white font-mono">A1</strong> of any existing Google Sheet. Google will automatically pull live inventory periodically:
                </p>

                <div className="flex items-center space-x-2 mt-2">
                  <input
                    type="text"
                    readOnly
                    value={sheetsFormula}
                    className="flex-1 px-3 py-2 bg-[#0A0B0E] border border-[#2D3139] rounded-lg font-mono text-emerald-400 text-xs focus:outline-none select-all"
                  />
                  <button
                    onClick={handleCopyFormula}
                    className="flex items-center space-x-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition cursor-pointer"
                  >
                    {copiedFormula ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedFormula ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* Method 2: Direct CSV Download */}
              <div className="bg-[#16181D] p-4 rounded-lg border border-[#2D3139] flex items-center justify-between gap-4">
                <div>
                  <h4 className="font-bold text-white">Direct CSV Export for Excel or Sheets</h4>
                  <p className="text-[#9CA3AF] text-xs mt-0.5">
                    Download full inventory CSV file including Device Number, Device Location, and Switch Ports.
                  </p>
                </div>

                <a
                  href="/api/export/csv"
                  download="iub_network_inventory.csv"
                  className="flex items-center space-x-1.5 px-4 py-2 bg-[#0A0B0E] hover:bg-[#1E2229] text-white rounded-lg font-semibold transition cursor-pointer border border-[#2D3139] shrink-0"
                >
                  <Download className="w-4 h-4 text-blue-400" />
                  <span>Download CSV</span>
                </a>
              </div>
            </div>
          )}

        </div>

        {/* Mandatory Confirmation Modal for Workspace Data Overwrite */}
        {confirmUpdateSheet && (
          <div className="absolute inset-0 z-50 bg-black/90 flex items-center justify-center p-6">
            <div className="bg-[#16181D] border border-[#2D3139] rounded-xl p-5 max-w-md w-full shadow-2xl space-y-4">
              <div className="flex items-center space-x-3 text-amber-400">
                <AlertTriangle className="w-6 h-6 shrink-0" />
                <h4 className="text-sm font-bold text-white">Confirm Google Sheet Update</h4>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed">
                Are you sure you want to update Google Spreadsheet <strong className="text-white">"{confirmUpdateSheet.name}"</strong> with the latest network topology?
              </p>
              <div className="p-3 bg-[#0A0B0E] rounded border border-[#2D3139] text-[11px] text-gray-400 space-y-1">
                <div>&bull; Spreadsheet ID: <span className="font-mono text-cyan-300">{confirmUpdateSheet.id}</span></div>
                <div>&bull; Total Devices to Synchronize: <strong className="text-emerald-400">{devices.length} Devices</strong></div>
                <div>&bull; Action: <span className="text-amber-400">Cell range A1 will be overwritten with latest device data</span></div>
              </div>
              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  onClick={() => setConfirmUpdateSheet(null)}
                  className="px-3.5 py-1.5 rounded-lg bg-[#0A0B0E] hover:bg-[#1E2229] border border-[#2D3139] text-gray-300 text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmUpdate}
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer shadow-md shadow-emerald-950/50"
                >
                  Confirm & Overwrite Sheet
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#2D3139] bg-[#16181D] flex items-center justify-between text-xs text-[#9CA3AF]">
          <span>Lead Engineer: <strong className="text-white">Mr. Zeeshan Javed (AI Lead Engineer)</strong></span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#0A0B0E] hover:bg-[#1E2229] border border-[#2D3139] text-white transition cursor-pointer"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
