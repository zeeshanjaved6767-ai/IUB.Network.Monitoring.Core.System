import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  ShieldCheck, 
  Lock, 
  Mail, 
  User, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Zap,
  KeyRound,
  ArrowLeft,
  RefreshCw,
  Copy,
  Check,
  Users,
  ShieldAlert,
  Trash2,
  LogOut
} from 'lucide-react';
import { AdminUser, UserRole, CampusId } from '../types.ts';
import { 
  request2FaOtp, 
  verify2FaOtp, 
  resend2FaOtp, 
  fetchAdminUsers, 
  updateUserRole, 
  deleteAdminUser 
} from '../api.ts';

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AdminUser | null;
  onLoginSuccess: (user: AdminUser) => void;
}

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLoginSuccess,
}) => {
  // Step in the 2FA flow: 'auth' (Sign-in / Sign-up), 'otp' (6-digit OTP verification), 'dashboard' (Role-based Dashboard & Admin Panel)
  const [step, setStep] = useState<'auth' | 'otp' | 'dashboard'>(currentUser ? 'dashboard' : 'auth');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState('zeejaved766@gmail.com');
  const [loginPassword, setLoginPassword] = useState('Admin@IUB2026');
  const [showPassword, setShowPassword] = useState(false);

  // Sign up form state
  const [signupFullName, setSignupFullName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [signupRole, setSignupRole] = useState<UserRole>('User');
  const [signupDepartment, setSignupDepartment] = useState('Directorate of Information Technology (DIT)');
  const [signupCampusAccess, setSignupCampusAccess] = useState<CampusId | 'ALL'>('ALL');
  const [signupPhone, setSignupPhone] = useState('');

  // 2FA OTP state
  const [otpValues, setOtpValues] = useState<string[]>(['', '', '', '', '', '']);
  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const [otpEmailTarget, setOtpEmailTarget] = useState<string>('');
  const [simulatedOtpCode, setSimulatedOtpCode] = useState<string>('');
  const [resendCountdown, setResendCountdown] = useState<number>(30);
  const [isCopied, setIsCopied] = useState(false);

  // Status & Feedback
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Admin Panel (Users Directory)
  const [allUsers, setAllUsers] = useState<AdminUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [adminUserSearch, setAdminUserSearch] = useState('');
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  // Reset or initialize on open
  useEffect(() => {
    if (isOpen) {
      if (currentUser) {
        setStep('dashboard');
        loadUsersDirectory();
      } else {
        setStep('auth');
      }
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [isOpen, currentUser]);

  // Resend Timer Countdown
  useEffect(() => {
    let timer: any;
    if (step === 'otp' && resendCountdown > 0) {
      timer = setInterval(() => {
        setResendCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, resendCountdown]);

  // Load registered users directory for Admin Panel
  const loadUsersDirectory = async () => {
    setIsLoadingUsers(true);
    try {
      const users = await fetchAdminUsers();
      setAllUsers(users);
    } catch (e) {
      console.error('Failed to load user list', e);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  if (!isOpen) return null;

  // 1-Click Quick Credentials for Testing
  const handleDemoFill = (role: 'Admin' | 'Manager' | 'User') => {
    if (role === 'Admin') {
      setLoginEmail('zeejaved766@gmail.com');
      setLoginPassword('Admin@IUB2026');
    } else if (role === 'Manager') {
      setLoginEmail('sarah.manager@iub.edu.pk');
      setLoginPassword('Manager@2026');
    } else {
      setLoginEmail('ali.user@iub.edu.pk');
      setLoginPassword('User@2026');
    }
    setErrorMsg(null);
  };

  // STEP 1: Submit Login Form & Request 2FA OTP
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await request2FaOtp({
        purpose: 'login',
        email: loginEmail,
        password: loginPassword,
      });

      setOtpEmailTarget(res.email);
      setSimulatedOtpCode(res.simulatedOtp);
      setOtpValues(['', '', '', '', '', '']);
      setResendCountdown(30);
      setStep('otp');
      setSuccessMsg(`Simulated OTP email dispatched! Check verification code below.`);
      
      setTimeout(() => {
        otpInputsRef.current[0]?.focus();
      }, 100);
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid credentials. Please verify your email and password.');
    } finally {
      setIsLoading(false);
    }
  };

  // STEP 1: Submit Sign-up Form & Request 2FA OTP
  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    if (signupPassword !== signupConfirmPassword) {
      setErrorMsg('Passwords do not match. Please verify.');
      setIsLoading(false);
      return;
    }

    try {
      const res = await request2FaOtp({
        purpose: 'signup',
        fullName: signupFullName,
        email: signupEmail,
        password: signupPassword,
        role: signupRole,
        department: signupDepartment,
        campusAccess: signupCampusAccess,
        phoneNumber: signupPhone,
      });

      setOtpEmailTarget(res.email);
      setSimulatedOtpCode(res.simulatedOtp);
      setOtpValues(['', '', '', '', '', '']);
      setResendCountdown(30);
      setStep('otp');
      setSuccessMsg(`Registration 2FA code sent! Check simulated email below.`);

      setTimeout(() => {
        otpInputsRef.current[0]?.focus();
      }, 100);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to initiate sign up.');
    } finally {
      setIsLoading(false);
    }
  };

  // STEP 2: OTP Auto-advance, Paste & Keydown Logic
  const handleOtpChange = (index: number, val: string) => {
    const cleanVal = val.replace(/\D/g, '');
    if (!cleanVal) {
      const next = [...otpValues];
      next[index] = '';
      setOtpValues(next);
      return;
    }

    const digit = cleanVal.slice(-1);
    const next = [...otpValues];
    next[index] = digit;
    setOtpValues(next);

    // Auto-advance to next input field
    if (index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const next = ['', '', '', '', '', ''];
    for (let i = 0; i < pasted.length; i++) {
      next[i] = pasted[i];
    }
    setOtpValues(next);

    const targetIdx = Math.min(pasted.length, 5);
    otpInputsRef.current[targetIdx]?.focus();
  };

  // One-click Auto-fill of the Simulated OTP
  const handleAutoFillOtp = () => {
    if (!simulatedOtpCode || simulatedOtpCode.length !== 6) return;
    const digits = simulatedOtpCode.split('');
    setOtpValues(digits);
    otpInputsRef.current[5]?.focus();
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // STEP 2: Submit 6-digit OTP for Verification
  const handleVerifyOtpSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const fullOtp = otpValues.join('');
    if (fullOtp.length !== 6) {
      setErrorMsg('Please enter all 6 digits of your verification code.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await verify2FaOtp({
        email: otpEmailTarget,
        otp: fullOtp,
      });

      setSuccessMsg(res.message || 'Two-factor authentication successful!');
      onLoginSuccess(res.user);
      setStep('dashboard');
      loadUsersDirectory();
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid or expired 2FA code. Please retry.');
    } finally {
      setIsLoading(false);
    }
  };

  // Resend 2FA Code
  const handleResendOtp = async () => {
    if (resendCountdown > 0 || !otpEmailTarget) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await resend2FaOtp(otpEmailTarget);
      setSimulatedOtpCode(res.simulatedOtp);
      setResendCountdown(30);
      setSuccessMsg(`Fresh 6-digit code dispatched to ${otpEmailTarget}.`);
      setOtpValues(['', '', '', '', '', '']);
      otpInputsRef.current[0]?.focus();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to resend verification code.');
    } finally {
      setIsLoading(false);
    }
  };

  // Admin Panel: Change User Role
  const handleUpdateRole = async (userId: string, newRole: string) => {
    setUpdatingUserId(userId);
    try {
      const res = await updateUserRole(userId, newRole);
      setAllUsers((prev) => prev.map((u) => (u.id === userId ? res.user : u)));
      setSuccessMsg(`Role for ${res.user.fullName} updated to ${newRole}`);
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update role');
    } finally {
      setUpdatingUserId(null);
    }
  };

  // Admin Panel: Delete User
  const handleDeleteUser = async (userId: string, name: string) => {
    if (!confirm(`Are you sure you want to remove user account: ${name}?`)) return;
    setUpdatingUserId(userId);
    try {
      await deleteAdminUser(userId);
      setAllUsers((prev) => prev.filter((u) => u.id !== userId));
      setSuccessMsg(`Account for ${name} deleted successfully.`);
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete user');
    } finally {
      setUpdatingUserId(null);
    }
  };

  // Helper to determine role badge visual style
  const getRoleVisual = (role?: string) => {
    const r = (role || '').toLowerCase();
    if (r === 'admin' || r === 'ai_lead' || r === 'super_admin') {
      return {
        name: 'Admin',
        badge: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50',
        dot: 'bg-emerald-400',
        desc: 'Full NOC Super Admin Control & User Management Privileges',
        level: 3
      };
    }
    if (r === 'manager' || r === 'noc_manager') {
      return {
        name: 'Manager',
        badge: 'bg-blue-950/80 text-blue-300 border-blue-500/50',
        dot: 'bg-blue-400',
        desc: 'Operational NOC Manager: Diagnostics, Alarms, Telemetry Control',
        level: 2
      };
    }
    return {
      name: 'User',
      badge: 'bg-amber-950/80 text-amber-300 border-amber-500/50',
      dot: 'bg-amber-400',
      desc: 'Campus Staff & Viewer: Real-time Multi-Campus Telemetry Monitoring',
      level: 1
    };
  };

  const userRoleMeta = getRoleVisual(currentUser?.role);
  const isAdminUser = userRoleMeta.name === 'Admin';

  const filteredUsers = allUsers.filter((u) => 
    u.fullName.toLowerCase().includes(adminUserSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(adminUserSearch.toLowerCase()) ||
    (u.department && u.department.toLowerCase().includes(adminUserSearch.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div 
        className={`bg-[#12141A] border border-[#2D3139] rounded-2xl w-full ${
          step === 'dashboard' && isAdminUser ? 'max-w-3xl' : 'max-w-md'
        } shadow-2xl overflow-hidden flex flex-col transition-all duration-300 max-h-[92vh]`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="px-5 py-4 border-b border-[#2D3139] flex items-center justify-between bg-[#16181D]">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500/20 to-blue-500/10 border border-emerald-500/30 text-emerald-400 shadow-inner">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-tight">
                  IUB 2FA Authentication & Access Control
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold">
                  2FA Active
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                {step === 'auth' && 'Sign in or register to trigger your simulated 2FA verification email'}
                {step === 'otp' && 'Enter the 6-digit verification code sent to your email'}
                {step === 'dashboard' && 'Authenticated Role-Based Dashboard & Privileged NOC Portal'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-[#252830] transition cursor-pointer"
            title="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Global Alert Messages */}
        {errorMsg && (
          <div className="mx-5 mt-4 p-3 rounded-lg bg-red-500/15 border border-red-500/40 text-red-300 flex items-start space-x-2 text-xs">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mx-5 mt-4 p-3 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 flex items-center space-x-2 text-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 1: AUTHENTICATION (SIGN IN & SIGN UP)                                */}
        {/* ========================================================================= */}
        {step === 'auth' && (
          <div className="flex-1 overflow-y-auto">
            {/* Tab Switcher */}
            <div className="flex border-b border-[#2D3139] bg-[#16181D]">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className={`flex-1 py-3 text-xs font-bold text-center border-b-2 transition cursor-pointer ${
                  authMode === 'login'
                    ? 'border-emerald-500 text-emerald-400 bg-[#1A1D24]'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                Sign In (Existing Account)
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signup');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className={`flex-1 py-3 text-xs font-bold text-center border-b-2 transition cursor-pointer ${
                  authMode === 'signup'
                    ? 'border-blue-500 text-blue-400 bg-[#1A1D24]'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                Sign Up (New Staff)
              </button>
            </div>

            {/* TAB: LOGIN FORM */}
            {authMode === 'login' && (
              <form onSubmit={handleLoginSubmit} className="p-5 space-y-4 text-xs">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">
                    Official Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="e.g. zeejaved766@gmail.com"
                      className="w-full pl-9 pr-3 py-2.5 bg-[#1A1D24] border border-[#2D3139] rounded-xl text-gray-200 focus:border-emerald-500 focus:outline-none transition"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-gray-300 font-semibold">
                      Password
                    </label>
                    <span className="text-[11px] text-gray-500 font-mono">Min 6 characters</span>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-9 pr-10 py-2.5 bg-[#1A1D24] border border-[#2D3139] rounded-xl text-gray-200 focus:border-emerald-500 focus:outline-none transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* 1-Click Role Fill Buttons for convenient testing */}
                <div className="p-3 rounded-xl bg-[#16181D] border border-[#2D3139] space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-gray-400 font-medium">
                    <span className="flex items-center gap-1.5 text-amber-300 font-semibold">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      <span>1-Click Test Credentials by Role:</span>
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => handleDemoFill('Admin')}
                      className="p-2 rounded-lg bg-[#1E2229] hover:bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold text-left transition cursor-pointer flex flex-col"
                    >
                      <span>🛡️ Admin</span>
                      <span className="text-[9px] text-gray-400 font-normal">Mr. Zeeshan</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDemoFill('Manager')}
                      className="p-2 rounded-lg bg-[#1E2229] hover:bg-blue-950/40 border border-blue-500/30 text-blue-400 text-[11px] font-bold text-left transition cursor-pointer flex flex-col"
                    >
                      <span>⚡ Manager</span>
                      <span className="text-[9px] text-gray-400 font-normal">Sarah Tariq</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDemoFill('User')}
                      className="p-2 rounded-lg bg-[#1E2229] hover:bg-amber-950/40 border border-amber-500/30 text-amber-400 text-[11px] font-bold text-left transition cursor-pointer flex flex-col"
                    >
                      <span>👤 User</span>
                      <span className="text-[9px] text-gray-400 font-normal">Ali Raza</span>
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-900/40 transition cursor-pointer flex items-center justify-center space-x-2"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>{isLoading ? 'Sending 2FA OTP...' : 'Send 2FA Verification Code &rarr;'}</span>
                </button>
              </form>
            )}

            {/* TAB: SIGN UP FORM */}
            {authMode === 'signup' && (
              <form onSubmit={handleSignupSubmit} className="p-5 space-y-3.5 text-xs">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">
                    Full Name & Title
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={signupFullName}
                      onChange={(e) => setSignupFullName(e.target.value)}
                      placeholder="e.g. Engr. Hamza Malik"
                      className="w-full pl-9 pr-3 py-2.5 bg-[#1A1D24] border border-[#2D3139] rounded-xl text-gray-200 focus:border-blue-500 focus:outline-none transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-300 font-semibold mb-1">
                    Official Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      placeholder="e.g. hamza.malik@iub.edu.pk"
                      className="w-full pl-9 pr-3 py-2.5 bg-[#1A1D24] border border-[#2D3139] rounded-xl text-gray-200 focus:border-blue-500 focus:outline-none transition"
                    />
                  </div>
                </div>

                {/* Role Selection (User, Manager, or Admin) */}
                <div>
                  <label className="block text-gray-300 font-semibold mb-1.5">
                    Select Assigned Role
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setSignupRole('User')}
                      className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                        signupRole === 'User'
                          ? 'bg-amber-950/50 border-amber-500 text-amber-300 ring-1 ring-amber-500/50'
                          : 'bg-[#1A1D24] border-[#2D3139] text-gray-400 hover:text-white'
                      }`}
                    >
                      <div className="font-bold text-xs">👤 User</div>
                      <div className="text-[10px] opacity-80 mt-0.5">Read-Only Telemetry</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSignupRole('Manager')}
                      className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                        signupRole === 'Manager'
                          ? 'bg-blue-950/50 border-blue-500 text-blue-300 ring-1 ring-blue-500/50'
                          : 'bg-[#1A1D24] border-[#2D3139] text-gray-400 hover:text-white'
                      }`}
                    >
                      <div className="font-bold text-xs">⚡ Manager</div>
                      <div className="text-[10px] opacity-80 mt-0.5">NOC Operations</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSignupRole('Admin')}
                      className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                        signupRole === 'Admin'
                          ? 'bg-emerald-950/50 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500/50'
                          : 'bg-[#1A1D24] border-[#2D3139] text-gray-400 hover:text-white'
                      }`}
                    >
                      <div className="font-bold text-xs">🛡️ Admin</div>
                      <div className="text-[10px] opacity-80 mt-0.5">Full Super Admin</div>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-gray-300 font-semibold mb-1">
                      Password
                    </label>
                    <input
                      type="password"
                      required
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 bg-[#1A1D24] border border-[#2D3139] rounded-xl text-gray-200 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 font-semibold mb-1">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      required
                      value={signupConfirmPassword}
                      onChange={(e) => setSignupConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 bg-[#1A1D24] border border-[#2D3139] rounded-xl text-gray-200 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-300 font-semibold mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    value={signupDepartment}
                    onChange={(e) => setSignupDepartment(e.target.value)}
                    placeholder="e.g. Directorate of Information Technology (DIT)"
                    className="w-full px-3 py-2 bg-[#1A1D24] border border-[#2D3139] rounded-xl text-gray-200 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 mt-1 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-900/40 transition cursor-pointer flex items-center justify-center space-x-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{isLoading ? 'Creating Account...' : 'Continue to 2FA Email Verification &rarr;'}</span>
                </button>
              </form>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 2: 6-DIGIT OTP VERIFICATION WITH AUTO-ADVANCE, PASTE, RESEND TIMER   */}
        {/* ========================================================================= */}
        {step === 'otp' && (
          <div className="p-6 space-y-5 text-xs flex-1 overflow-y-auto">
            <div className="text-center space-y-1">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mb-2">
                <KeyRound className="w-6 h-6 animate-pulse" />
              </div>
              <h4 className="text-base font-bold text-white tracking-tight">
                Two-Factor Email Verification (2FA)
              </h4>
              <p className="text-xs text-gray-400">
                A 6-digit security code has been dispatched to:
              </p>
              <div className="font-mono text-emerald-400 font-semibold text-xs bg-[#16181D] py-1 px-3 rounded-lg border border-[#2D3139] inline-block">
                {otpEmailTarget}
              </div>
            </div>

            {/* Simulated Email Notification Banner */}
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-950/70 via-[#12241C] to-[#121E28] border border-emerald-500/50 shadow-md space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-emerald-300 font-bold text-xs">
                  <Mail className="w-4 h-4 text-emerald-400" />
                  <span>📧 [Simulated 2FA Email Delivery]</span>
                </span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30">
                  Inbox Sync
                </span>
              </div>
              <p className="text-[11px] text-gray-300 leading-relaxed">
                Subject: <strong>Your IUB NOC 2FA Verification Code</strong>
                <br />
                Your single-use 6-digit access code is: <strong className="font-mono text-emerald-300 text-sm">{simulatedOtpCode}</strong>
              </p>
              <button
                type="button"
                onClick={handleAutoFillOtp}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/90 hover:bg-emerald-500 text-white text-[11px] font-bold shadow transition cursor-pointer"
              >
                {isCopied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{isCopied ? 'Code Auto-filled!' : '1-Click Auto-Fill Code'}</span>
              </button>
            </div>

            {/* 6-Digit Auto-advancing Input Boxes */}
            <form onSubmit={handleVerifyOtpSubmit} className="space-y-4">
              <div>
                <label className="block text-center text-gray-300 font-semibold mb-2">
                  Enter 6-Digit Verification Code
                </label>
                <div className="flex items-center justify-center gap-2 sm:gap-3" onPaste={handleOtpPaste}>
                  {otpValues.map((val, idx) => (
                    <input
                      key={idx}
                      ref={(el) => {
                        otpInputsRef.current[idx] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={val}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-mono font-bold rounded-xl border bg-[#1A1D24] transition-all focus:outline-none ${
                        val 
                          ? 'border-emerald-500 text-emerald-300 bg-emerald-950/20 ring-1 ring-emerald-500/50' 
                          : 'border-[#2D3139] text-white focus:border-emerald-500'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Resend Timer & Controls */}
              <div className="flex items-center justify-between text-xs text-gray-400 pt-1">
                <button
                  type="button"
                  onClick={() => setStep('auth')}
                  className="inline-flex items-center space-x-1 text-gray-400 hover:text-white transition cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>

                <div>
                  {resendCountdown > 0 ? (
                    <span className="font-mono text-gray-500">
                      Resend code in <strong className="text-gray-300">00:{resendCountdown.toString().padStart(2, '0')}</strong>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={isLoading}
                      className="inline-flex items-center space-x-1 text-emerald-400 hover:text-emerald-300 font-semibold transition cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                      <span>Resend Verification Code</span>
                    </button>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || otpValues.join('').length !== 6}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs shadow-lg shadow-emerald-900/40 transition cursor-pointer flex items-center justify-center space-x-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isLoading ? 'Verifying Identity...' : 'Verify Code & Access Dashboard'}</span>
              </button>
            </form>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 3: ROLE-BASED DASHBOARD & PRIVILEGED ADMIN PANEL                      */}
        {/* ========================================================================= */}
        {step === 'dashboard' && (
          <div className="p-5 sm:p-6 space-y-5 text-xs flex-1 overflow-y-auto">
            
            {/* User Profile Card with Highlighted Role */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-[#16181D] via-[#1A1D24] to-[#14161C] border border-[#2D3139] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-3.5">
                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 text-lg font-bold">
                    {currentUser?.fullName ? currentUser.fullName.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-400 ring-2 ring-[#12141A]"></span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-white tracking-tight">
                      {currentUser?.fullName || 'IUB Network Engineer'}
                    </h4>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${userRoleMeta.badge}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${userRoleMeta.dot}`}></span>
                      <span>{userRoleMeta.name}</span>
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{currentUser?.email}</p>
                  <p className="text-[11px] text-gray-500 font-mono mt-0.5">
                    {currentUser?.department} &bull; Campus: {currentUser?.campusAccess || 'ALL'}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2 self-end sm:self-center">
                <div className="px-3 py-1.5 rounded-xl bg-[#0A0B0E] border border-[#2D3139] text-right">
                  <div className="text-[10px] text-gray-400">2FA Security Status</div>
                  <div className="text-emerald-400 font-mono font-bold text-xs flex items-center gap-1 justify-end">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>VERIFIED</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setStep('auth');
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className="px-3 py-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-500/40 text-red-300 text-xs font-semibold transition cursor-pointer flex items-center space-x-1.5"
                  title="Sign out or switch account"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>

            {/* Role Capabilities Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className={`p-3 rounded-xl border ${userRoleMeta.level >= 1 ? 'bg-[#16181D] border-emerald-500/30 text-emerald-300' : 'bg-[#12141A] border-[#2D3139] text-gray-500 opacity-60'}`}>
                <div className="font-bold flex items-center justify-between">
                  <span>1. Telemetry Viewer</span>
                  {userRoleMeta.level >= 1 && <Check className="w-4 h-4 text-emerald-400" />}
                </div>
                <p className="text-[11px] text-gray-400 mt-1">
                  Access live campus topologies, ping diagnostic console, and device cards.
                </p>
              </div>

              <div className={`p-3 rounded-xl border ${userRoleMeta.level >= 2 ? 'bg-[#16181D] border-blue-500/30 text-blue-300' : 'bg-[#12141A] border-[#2D3139] text-gray-500 opacity-60'}`}>
                <div className="font-bold flex items-center justify-between">
                  <span>2. NOC Operations</span>
                  {userRoleMeta.level >= 2 && <Check className="w-4 h-4 text-blue-400" />}
                </div>
                <p className="text-[11px] text-gray-400 mt-1">
                  Trigger power resets, acknowledge alerts, edit fiber cores, and send WhatsApp alerts.
                </p>
              </div>

              <div className={`p-3 rounded-xl border ${userRoleMeta.level >= 3 ? 'bg-[#16181D] border-emerald-500/40 text-emerald-300' : 'bg-[#12141A] border-[#2D3139] text-gray-500 opacity-60'}`}>
                <div className="font-bold flex items-center justify-between">
                  <span>3. Admin Panel</span>
                  {userRoleMeta.level >= 3 ? <Check className="w-4 h-4 text-emerald-400" /> : <ShieldAlert className="w-3.5 h-3.5 text-gray-500" />}
                </div>
                <p className="text-[11px] text-gray-400 mt-1">
                  Manage user directory, promote/demote roles, delete accounts, full system control.
                </p>
              </div>
            </div>

            {/* ===================================================================== */}
            {/* PRIVILEGED ADMIN PANEL: UNLOCKED ONLY FOR ADMIN ROLE                  */}
            {/* ===================================================================== */}
            {isAdminUser ? (
              <div className="border border-[#2D3139] rounded-2xl bg-[#16181D] overflow-hidden space-y-3">
                <div className="p-4 border-b border-[#2D3139] flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#1A1D24]">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-emerald-400" />
                    <h5 className="font-bold text-white text-xs tracking-wide">
                      Privileged Admin Panel &bull; User Directory & Role-Based Access Control
                    </h5>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={adminUserSearch}
                      onChange={(e) => setAdminUserSearch(e.target.value)}
                      placeholder="Filter users by name or email..."
                      className="px-2.5 py-1 bg-[#12141A] border border-[#2D3139] rounded-lg text-gray-200 text-[11px] focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={loadUsersDirectory}
                      disabled={isLoadingUsers}
                      className="p-1.5 rounded-lg bg-[#12141A] hover:bg-[#252830] border border-[#2D3139] text-gray-300 transition cursor-pointer"
                      title="Refresh users"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isLoadingUsers ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Users Table */}
                <div className="overflow-x-auto max-h-60 overflow-y-auto px-4 pb-4">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-[#2D3139] text-[11px] text-gray-400 uppercase tracking-wider font-mono">
                        <th className="py-2 px-2">User Details</th>
                        <th className="py-2 px-2">Assigned Role</th>
                        <th className="py-2 px-2">Department</th>
                        <th className="py-2 px-2">Role Action</th>
                        <th className="py-2 px-2 text-right">Delete</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#252830]">
                      {filteredUsers.map((u) => {
                        const rMeta = getRoleVisual(u.role);
                        const isSelf = u.id === currentUser?.id;
                        return (
                          <tr key={u.id} className="hover:bg-[#1A1D24] transition">
                            <td className="py-2.5 px-2">
                              <div className="font-semibold text-white flex items-center gap-1.5">
                                <span>{u.fullName}</span>
                                {isSelf && (
                                  <span className="text-[9px] font-mono px-1.5 py-0.2 bg-blue-500/20 text-blue-300 rounded border border-blue-500/30">
                                    You
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-gray-400 font-mono">{u.email}</div>
                            </td>

                            <td className="py-2.5 px-2">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${rMeta.badge}`}>
                                <span>{rMeta.name}</span>
                              </span>
                            </td>

                            <td className="py-2.5 px-2 text-gray-300 text-[11px]">
                              {u.department || 'DIT Wing'}
                            </td>

                            <td className="py-2.5 px-2">
                              <select
                                value={rMeta.name}
                                onChange={(e) => handleUpdateRole(u.id, e.target.value)}
                                disabled={updatingUserId === u.id || isSelf}
                                className="px-2 py-1 bg-[#12141A] border border-[#2D3139] rounded text-[11px] text-gray-200 focus:outline-none focus:border-emerald-500 cursor-pointer disabled:opacity-50"
                              >
                                <option value="User">User (Viewer)</option>
                                <option value="Manager">Manager</option>
                                <option value="Admin">Admin (Super)</option>
                              </select>
                            </td>

                            <td className="py-2.5 px-2 text-right">
                              <button
                                type="button"
                                onClick={() => handleDeleteUser(u.id, u.fullName)}
                                disabled={isSelf || updatingUserId === u.id}
                                className="p-1 rounded text-red-400 hover:text-red-300 hover:bg-red-950/40 transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                title={isSelf ? 'Cannot delete your own account' : 'Delete user'}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              /* If logged in user is NOT an Admin */
              <div className="p-4 rounded-2xl bg-[#16181D] border border-dashed border-[#2D3139] text-center space-y-2">
                <div className="inline-flex p-2.5 rounded-full bg-amber-500/10 text-amber-400">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <h5 className="font-bold text-white text-xs">
                  Privileged Admin Panel Locked
                </h5>
                <p className="text-[11px] text-gray-400 max-w-md mx-auto">
                  Your current account role is <strong className="text-amber-300">{userRoleMeta.name}</strong>. The privileged User Directory & Role-Based Access Control panel requires the <strong>Admin</strong> role.
                </p>
              </div>
            )}

            <div className="pt-2 flex items-center justify-between border-t border-[#2D3139]">
              <div className="text-[11px] text-gray-400">
                Active Session: <strong className="text-white">{currentUser?.fullName}</strong> ({userRoleMeta.name})
              </div>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow transition cursor-pointer"
              >
                Done & Return to NOC
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
