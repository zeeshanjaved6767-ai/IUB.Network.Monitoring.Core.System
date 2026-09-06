import { ThemeConfig } from './types.ts';

export const DEFAULT_THEME: ThemeConfig = {
  id: 'iub-midnight-dark',
  name: 'IUB Midnight Dark (Default)',
  headerBg: '#16181D',
  headerTopBarBg: '#0A0B0E',
  bodyBg: '#0A0B0E',
  footerBg: '#0A0B0E',
  surfaceBg: '#16181D',
  borderColor: '#2D3139',
  accentColor: '#3B82F6',
  textColor: '#E5E7EB',
  isLightMode: false,
};

export const THEME_PRESETS: ThemeConfig[] = [
  {
    id: 'iub-midnight-dark',
    name: 'IUB Midnight Dark',
    headerBg: '#16181D',
    headerTopBarBg: '#0A0B0E',
    bodyBg: '#0A0B0E',
    footerBg: '#0A0B0E',
    surfaceBg: '#16181D',
    borderColor: '#2D3139',
    accentColor: '#3B82F6',
    textColor: '#E5E7EB',
    isLightMode: false,
  },
  {
    id: 'deep-cyber-navy',
    name: 'Deep Cyber Navy',
    headerBg: '#0f172a',
    headerTopBarBg: '#080d19',
    bodyBg: '#090e1a',
    footerBg: '#080d19',
    surfaceBg: '#111c34',
    borderColor: '#1e293b',
    accentColor: '#38bdf8',
    textColor: '#e2e8f0',
    isLightMode: false,
  },
  {
    id: 'emerald-noc-datacenter',
    name: 'Emerald NOC Data Center',
    headerBg: '#06261d',
    headerTopBarBg: '#03140f',
    bodyBg: '#041712',
    footerBg: '#03140f',
    surfaceBg: '#0a3327',
    borderColor: '#114a38',
    accentColor: '#10b981',
    textColor: '#e6fcf5',
    isLightMode: false,
  },
  {
    id: 'obsidian-oled-black',
    name: 'Obsidian OLED (Pure Black)',
    headerBg: '#000000',
    headerTopBarBg: '#050505',
    bodyBg: '#000000',
    footerBg: '#000000',
    surfaceBg: '#0f0f12',
    borderColor: '#222228',
    accentColor: '#60a5fa',
    textColor: '#f3f4f6',
    isLightMode: false,
  },
  {
    id: 'royal-purple-soc',
    name: 'Royal Purple SOC Defense',
    headerBg: '#1e1035',
    headerTopBarBg: '#0f071c',
    bodyBg: '#120822',
    footerBg: '#0d0519',
    surfaceBg: '#271545',
    borderColor: '#3e226e',
    accentColor: '#a855f7',
    textColor: '#f3e8ff',
    isLightMode: false,
  },
  {
    id: 'executive-slate-pro',
    name: 'Executive Slate Pro',
    headerBg: '#1e293b',
    headerTopBarBg: '#0f172a',
    bodyBg: '#0f172a',
    footerBg: '#0f172a',
    surfaceBg: '#1e293b',
    borderColor: '#334155',
    accentColor: '#38bdf8',
    textColor: '#e2e8f0',
    isLightMode: false,
  },
  {
    id: 'crimson-high-alert',
    name: 'Crimson Critical Alert',
    headerBg: '#2d0c13',
    headerTopBarBg: '#190509',
    bodyBg: '#1a060a',
    footerBg: '#140407',
    surfaceBg: '#3d101a',
    borderColor: '#5c1926',
    accentColor: '#f43f5e',
    textColor: '#ffe4e6',
    isLightMode: false,
  },
  {
    id: 'oceanic-teal-telecom',
    name: 'Oceanic Teal Telecom',
    headerBg: '#082f49',
    headerTopBarBg: '#041724',
    bodyBg: '#061c2d',
    footerBg: '#041724',
    surfaceBg: '#0e3b5c',
    borderColor: '#155e75',
    accentColor: '#06b6d4',
    textColor: '#ecfeff',
    isLightMode: false,
  },
  {
    id: 'iub-light-executive',
    name: 'IUB Light Executive (Dual-Tone)',
    headerBg: '#1e3a8a',
    headerTopBarBg: '#172554',
    bodyBg: '#f8fafc',
    footerBg: '#0f172a',
    surfaceBg: '#ffffff',
    borderColor: '#e2e8f0',
    accentColor: '#2563eb',
    textColor: '#0f172a',
    isLightMode: true,
  },
];

export const COLOR_SWATCHES = {
  header: [
    '#16181D', '#0f172a', '#06261d', '#000000', 
    '#1e1035', '#1e293b', '#2d0c13', '#082f49', 
    '#1e3a8a', '#14532d', '#701a75', '#312e81'
  ],
  body: [
    '#0A0B0E', '#090e1a', '#041712', '#000000', 
    '#120822', '#0f172a', '#1a060a', '#061c2d', 
    '#111827', '#18181b', '#f8fafc', '#f1f5f9'
  ],
  footer: [
    '#0A0B0E', '#080d19', '#03140f', '#000000', 
    '#0d0519', '#0f172a', '#140407', '#041724', 
    '#1e293b', '#172554', '#1f2937', '#020617'
  ],
  accent: [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', 
    '#A855F7', '#EC4899', '#06B6D4', '#6366F1'
  ],
};

export function applyThemeToDocument(theme: ThemeConfig) {
  if (typeof document === 'undefined') return;
  
  const root = document.documentElement;
  root.style.setProperty('--bg', theme.bodyBg);
  root.style.setProperty('--surface', theme.surfaceBg || '#16181D');
  root.style.setProperty('--border', theme.borderColor || '#2D3139');
  if (theme.accentColor) {
    root.style.setProperty('--accent', theme.accentColor);
  }
  
  // Set body element background
  document.body.style.backgroundColor = theme.bodyBg;
  
  // Adjust light/dark text mode class if needed
  if (theme.isLightMode) {
    root.classList.add('theme-light');
    root.classList.remove('theme-dark');
  } else {
    root.classList.add('theme-dark');
    root.classList.remove('theme-light');
  }
}
