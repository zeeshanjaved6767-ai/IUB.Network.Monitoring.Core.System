import React, { useState } from 'react';
import { 
  X, 
  Palette, 
  Check, 
  RotateCcw, 
  Sparkles, 
  Sliders, 
  Eye, 
  Sun, 
  Moon,
  Laptop,
  CheckCircle2
} from 'lucide-react';
import { ThemeConfig } from '../types.ts';
import { THEME_PRESETS, DEFAULT_THEME, COLOR_SWATCHES } from '../themes.ts';

interface ThemeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: ThemeConfig;
  onApplyTheme: (theme: ThemeConfig) => void;
  onResetTheme: () => void;
}

export const ThemeModal: React.FC<ThemeModalProps> = ({
  isOpen,
  onClose,
  currentTheme,
  onApplyTheme,
  onResetTheme,
}) => {
  const [activeTab, setActiveTab] = useState<'presets' | 'custom'>('presets');
  const [tempTheme, setTempTheme] = useState<ThemeConfig>(currentTheme);
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);

  // Sync tempTheme when modal opens or currentTheme changes
  React.useEffect(() => {
    setTempTheme(currentTheme);
  }, [currentTheme, isOpen]);

  if (!isOpen) return null;

  const handlePresetSelect = (preset: ThemeConfig) => {
    setTempTheme(preset);
    onApplyTheme(preset);
  };

  const handleCustomColorChange = (key: keyof ThemeConfig, value: string) => {
    const updated: ThemeConfig = {
      ...tempTheme,
      id: 'custom-theme',
      name: 'Custom Tailored Theme',
      [key]: value,
    };

    // Auto-derive top bar if header background changes
    if (key === 'headerBg' && !tempTheme.headerTopBarBg) {
      updated.headerTopBarBg = value;
    }

    setTempTheme(updated);
    onApplyTheme(updated);
  };

  const handleSaveAndClose = () => {
    onApplyTheme(tempTheme);
    onClose();
  };

  const handleResetToDefault = () => {
    setTempTheme(DEFAULT_THEME);
    onResetTheme();
    setCopiedNotification('Default IUB Midnight Dark theme restored!');
    setTimeout(() => setCopiedNotification(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div 
        className="relative w-full max-w-4xl bg-[#16181D] border border-[#2D3139] rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2D3139] bg-[#0A0B0E]/80">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-purple-950/80 border border-purple-600/40 flex items-center justify-center shadow-inner">
              <Palette className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>Theme & Color Studio</span>
                <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-purple-900/30 text-purple-300 border border-purple-700/40">
                  LIVE CUSTOMIZER
                </span>
              </h2>
              <p className="text-xs text-gray-400">
                Customize Header Color, Body Canvas, and Footer Color with instant live preview.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-[#1E2229] transition cursor-pointer"
            title="Close theme customizer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector & Reset Action */}
        <div className="flex flex-wrap items-center justify-between px-5 py-2.5 bg-[#0F1115] border-b border-[#2D3139] gap-2">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('presets')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === 'presets'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-900/40'
                  : 'bg-[#16181D] text-gray-400 hover:text-white border border-[#2D3139]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Theme Presets ({THEME_PRESETS.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('custom')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === 'custom'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-900/40'
                  : 'bg-[#16181D] text-gray-400 hover:text-white border border-[#2D3139]'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Custom Colors (Header, Body, Footer)</span>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleResetToDefault}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#16181D] hover:bg-[#1E2229] text-gray-300 text-xs font-medium border border-[#2D3139] transition cursor-pointer"
              title="Reset all colors to default IUB Midnight Dark"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span>Reset Default</span>
            </button>
          </div>
        </div>

        {/* Toast alert if any */}
        {copiedNotification && (
          <div className="mx-5 mt-3 p-2.5 rounded-lg bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{copiedNotification}</span>
          </div>
        )}

        {/* Body content with scrolling */}
        <div className="p-5 overflow-y-auto space-y-6 flex-1">
          
          {/* TAB 1: CURATED THEME PRESETS */}
          {activeTab === 'presets' && (
            <div>
              <div className="mb-3">
                <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                  Select a Curated Enterprise Theme
                </h3>
                <p className="text-[11px] text-gray-400">
                  Click any theme to instantly apply harmonious Header, Body, and Footer palettes across the entire portal.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {THEME_PRESETS.map((preset) => {
                  const isSelected = tempTheme.id === preset.id;
                  return (
                    <div
                      key={preset.id}
                      onClick={() => handlePresetSelect(preset)}
                      className={`relative p-3.5 rounded-xl border transition-all cursor-pointer group flex flex-col justify-between ${
                        isSelected
                          ? 'border-purple-500 bg-purple-950/20 ring-2 ring-purple-500/30 shadow-lg shadow-purple-950/30'
                          : 'border-[#2D3139] bg-[#0F1115] hover:border-gray-500 hover:bg-[#16181D]'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-white group-hover:text-purple-300 transition">
                            {preset.name}
                          </span>
                          {isSelected && (
                            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-purple-600 text-white shadow">
                              <Check className="w-3 h-3" />
                            </span>
                          )}
                        </div>

                        {/* Visual Palette Preview Bars */}
                        <div className="space-y-1.5 my-3 p-2 rounded-lg bg-[#0A0B0E]/60 border border-[#23272F]">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-gray-400">Header:</span>
                            <div className="flex items-center space-x-1.5">
                              <span className="w-3.5 h-3.5 rounded border border-white/20 shadow-sm" style={{ backgroundColor: preset.headerBg }}></span>
                              <span className="font-mono text-gray-300 text-[10px]">{preset.headerBg}</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-gray-400">Body Canvas:</span>
                            <div className="flex items-center space-x-1.5">
                              <span className="w-3.5 h-3.5 rounded border border-white/20 shadow-sm" style={{ backgroundColor: preset.bodyBg }}></span>
                              <span className="font-mono text-gray-300 text-[10px]">{preset.bodyBg}</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-gray-400">Footer:</span>
                            <div className="flex items-center space-x-1.5">
                              <span className="w-3.5 h-3.5 rounded border border-white/20 shadow-sm" style={{ backgroundColor: preset.footerBg }}></span>
                              <span className="font-mono text-gray-300 text-[10px]">{preset.footerBg}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Mini Preview bar showing gradient or segments */}
                      <div className="h-2 rounded-full overflow-hidden flex border border-white/10 mt-1">
                        <div className="flex-1" style={{ backgroundColor: preset.headerBg }} title="Header Color"></div>
                        <div className="flex-2" style={{ backgroundColor: preset.bodyBg }} title="Body Canvas Color"></div>
                        <div className="flex-1" style={{ backgroundColor: preset.footerBg }} title="Footer Color"></div>
                        <div className="w-3" style={{ backgroundColor: preset.accentColor }} title="Accent Color"></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: CUSTOM COLOR MIXER */}
          {activeTab === 'custom' && (
            <div className="space-y-6">
              <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-800/30 text-xs text-purple-200">
                💡 <strong>Fine-Grained Color Controls</strong>: Change specific colors below. Changes apply in real-time to your screen and are automatically saved to your browser preferences.
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                
                {/* 1. Header Color Controls */}
                <div className="p-4 rounded-xl bg-[#0F1115] border border-[#2D3139] space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full border border-white/30" style={{ backgroundColor: tempTheme.headerBg }}></span>
                      <span>Header Color</span>
                    </label>
                    <span className="text-[10px] font-mono text-gray-400">{tempTheme.headerBg}</span>
                  </div>
                  <p className="text-[11px] text-gray-400">
                    Controls the main navigation bar background where IUB logos and metrics reside.
                  </p>

                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={tempTheme.headerBg.length === 7 ? tempTheme.headerBg : '#16181D'}
                      onChange={(e) => handleCustomColorChange('headerBg', e.target.value)}
                      className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                      title="Click to open color picker"
                    />
                    <input
                      type="text"
                      value={tempTheme.headerBg}
                      onChange={(e) => handleCustomColorChange('headerBg', e.target.value)}
                      className="flex-1 px-2.5 py-1.5 rounded-lg bg-[#16181D] border border-[#2D3139] text-xs font-mono text-white focus:outline-none focus:border-purple-500"
                      placeholder="#16181D"
                    />
                  </div>

                  {/* Header Color Swatches */}
                  <div>
                    <span className="text-[10px] text-gray-400 block mb-1.5 font-semibold">Recommended Swatches:</span>
                    <div className="grid grid-cols-6 gap-1.5">
                      {COLOR_SWATCHES.header.map((hex) => (
                        <button
                          key={hex}
                          onClick={() => handleCustomColorChange('headerBg', hex)}
                          className={`h-6 rounded border transition cursor-pointer hover:scale-110 ${
                            tempTheme.headerBg.toLowerCase() === hex.toLowerCase()
                              ? 'border-purple-400 ring-2 ring-purple-400/50'
                              : 'border-white/20'
                          }`}
                          style={{ backgroundColor: hex }}
                          title={hex}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Top-Bar Sub-Color */}
                  <div className="pt-2 border-t border-[#23272F] space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-gray-300">Top Brand Strip:</span>
                      <span className="font-mono text-gray-400 text-[10px]">{tempTheme.headerTopBarBg}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={tempTheme.headerTopBarBg?.length === 7 ? tempTheme.headerTopBarBg : '#0A0B0E'}
                        onChange={(e) => handleCustomColorChange('headerTopBarBg', e.target.value)}
                        className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                        title="Top strip background color"
                      />
                      <input
                        type="text"
                        value={tempTheme.headerTopBarBg || '#0A0B0E'}
                        onChange={(e) => handleCustomColorChange('headerTopBarBg', e.target.value)}
                        className="flex-1 px-2 py-1 rounded bg-[#16181D] border border-[#2D3139] text-xs font-mono text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Body Canvas Controls */}
                <div className="p-4 rounded-xl bg-[#0F1115] border border-[#2D3139] space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full border border-white/30" style={{ backgroundColor: tempTheme.bodyBg }}></span>
                      <span>Body / Canvas Color</span>
                    </label>
                    <span className="text-[10px] font-mono text-gray-400">{tempTheme.bodyBg}</span>
                  </div>
                  <p className="text-[11px] text-gray-400">
                    Controls the primary background color for tables, topology maps, and metrics.
                  </p>

                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={tempTheme.bodyBg.length === 7 ? tempTheme.bodyBg : '#0A0B0E'}
                      onChange={(e) => handleCustomColorChange('bodyBg', e.target.value)}
                      className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                      title="Click to open color picker"
                    />
                    <input
                      type="text"
                      value={tempTheme.bodyBg}
                      onChange={(e) => handleCustomColorChange('bodyBg', e.target.value)}
                      className="flex-1 px-2.5 py-1.5 rounded-lg bg-[#16181D] border border-[#2D3139] text-xs font-mono text-white focus:outline-none focus:border-purple-500"
                      placeholder="#0A0B0E"
                    />
                  </div>

                  {/* Body Color Swatches */}
                  <div>
                    <span className="text-[10px] text-gray-400 block mb-1.5 font-semibold">Recommended Swatches:</span>
                    <div className="grid grid-cols-6 gap-1.5">
                      {COLOR_SWATCHES.body.map((hex) => (
                        <button
                          key={hex}
                          onClick={() => handleCustomColorChange('bodyBg', hex)}
                          className={`h-6 rounded border transition cursor-pointer hover:scale-110 ${
                            tempTheme.bodyBg.toLowerCase() === hex.toLowerCase()
                              ? 'border-purple-400 ring-2 ring-purple-400/50'
                              : 'border-white/20'
                          }`}
                          style={{ backgroundColor: hex }}
                          title={hex}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Card Background Hint */}
                  <div className="pt-2 border-t border-[#23272F] text-[11px] text-gray-400 flex items-center justify-between">
                    <span>Card Surface Contrast:</span>
                    <button
                      onClick={() => {
                        const newSurface = tempTheme.bodyBg === '#000000' ? '#111115' : '#16181D';
                        handleCustomColorChange('surfaceBg', newSurface);
                      }}
                      className="px-2 py-0.5 rounded text-[10px] bg-[#16181D] text-gray-300 hover:text-white border border-[#2D3139]"
                    >
                      Auto-Adjust
                    </button>
                  </div>
                </div>

                {/* 3. Footer Color Controls */}
                <div className="p-4 rounded-xl bg-[#0F1115] border border-[#2D3139] space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full border border-white/30" style={{ backgroundColor: tempTheme.footerBg }}></span>
                      <span>Footer Color</span>
                    </label>
                    <span className="text-[10px] font-mono text-gray-400">{tempTheme.footerBg}</span>
                  </div>
                  <p className="text-[11px] text-gray-400">
                    Controls the bottom footer background containing author details & reset actions.
                  </p>

                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={tempTheme.footerBg.length === 7 ? tempTheme.footerBg : '#0A0B0E'}
                      onChange={(e) => handleCustomColorChange('footerBg', e.target.value)}
                      className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                      title="Click to open color picker"
                    />
                    <input
                      type="text"
                      value={tempTheme.footerBg}
                      onChange={(e) => handleCustomColorChange('footerBg', e.target.value)}
                      className="flex-1 px-2.5 py-1.5 rounded-lg bg-[#16181D] border border-[#2D3139] text-xs font-mono text-white focus:outline-none focus:border-purple-500"
                      placeholder="#0A0B0E"
                    />
                  </div>

                  {/* Footer Color Swatches */}
                  <div>
                    <span className="text-[10px] text-gray-400 block mb-1.5 font-semibold">Recommended Swatches:</span>
                    <div className="grid grid-cols-6 gap-1.5">
                      {COLOR_SWATCHES.footer.map((hex) => (
                        <button
                          key={hex}
                          onClick={() => handleCustomColorChange('footerBg', hex)}
                          className={`h-6 rounded border transition cursor-pointer hover:scale-110 ${
                            tempTheme.footerBg.toLowerCase() === hex.toLowerCase()
                              ? 'border-purple-400 ring-2 ring-purple-400/50'
                              : 'border-white/20'
                          }`}
                          style={{ backgroundColor: hex }}
                          title={hex}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Accent Highlight Color */}
                  <div className="pt-2 border-t border-[#23272F] space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-gray-300">Accent Highlight:</span>
                      <span className="font-mono text-gray-400 text-[10px]">{tempTheme.accentColor || '#3B82F6'}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      {COLOR_SWATCHES.accent.map((hex) => (
                        <button
                          key={hex}
                          onClick={() => handleCustomColorChange('accentColor', hex)}
                          className={`w-6 h-6 rounded-full border transition cursor-pointer hover:scale-110 ${
                            (tempTheme.accentColor || '#3B82F6').toLowerCase() === hex.toLowerCase()
                              ? 'border-white ring-2 ring-white/50'
                              : 'border-transparent'
                          }`}
                          style={{ backgroundColor: hex }}
                          title={hex}
                        />
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* SECTION 3: LIVE INTERACTIVE MINI PREVIEW */}
          <div className="p-4 rounded-xl bg-[#0A0B0E] border border-[#2D3139] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-300 flex items-center gap-1.5 uppercase tracking-wide">
                <Eye className="w-4 h-4 text-purple-400" />
                <span>Live Interactive Layout Simulation</span>
              </span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/40">
                ACTIVE THEME: {tempTheme.name}
              </span>
            </div>

            {/* Simulated Miniature Portal */}
            <div className="rounded-xl overflow-hidden border border-[#2D3139] shadow-2xl text-[11px]">
              
              {/* Simulated Header Top Bar */}
              <div 
                className="px-3 py-1 flex items-center justify-between text-[9px] border-b border-white/10 transition-colors"
                style={{ backgroundColor: tempTheme.headerTopBarBg || '#0A0B0E' }}
              >
                <div className="flex items-center space-x-1 text-gray-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="font-semibold">IUB NOC CORE (EST. 1925)</span>
                </div>
                <div className="text-amber-400 font-mono">
                  PERN 40G FIBER
                </div>
              </div>

              {/* Simulated Main Header */}
              <div 
                className="px-3 py-2 flex items-center justify-between border-b border-white/10 transition-colors"
                style={{ backgroundColor: tempTheme.headerBg }}
              >
                <div className="flex items-center space-x-2">
                  {/* Standard White Background Logo */}
                  <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center p-0.5 shadow-sm border border-gray-200">
                    <img src="/iub-crest.svg" alt="IUB Crest" className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-white leading-tight">
                      IUB Network Monitoring Core
                    </div>
                    <div className="text-[8px] text-amber-400 font-medium">
                      Lead: Mr. Zeeshan Javed
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-1.5">
                  <span className="px-1.5 py-0.5 rounded text-[8px] font-bold text-white" style={{ backgroundColor: tempTheme.accentColor || '#3B82F6' }}>
                    + Device
                  </span>
                  {/* Right Centenary Logo with white background */}
                  <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center p-0.5 shadow-sm border border-gray-200">
                    <img src="/iub-centenary.svg" alt="Centenary" className="w-full h-full object-contain" />
                  </div>
                </div>
              </div>

              {/* Simulated Body Canvas */}
              <div 
                className="p-3 space-y-2 transition-colors min-h-[90px]"
                style={{ backgroundColor: tempTheme.bodyBg }}
              >
                <div className="flex items-center justify-between text-[10px] text-gray-400">
                  <span>Simulated Body Canvas ({tempTheme.bodyBg})</span>
                  <span className="text-emerald-400 font-mono">Ping: 2.4ms | Loss: 0.0%</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 rounded-lg bg-[#16181D]/80 border border-white/10 text-white flex items-center justify-between">
                    <div>
                      <div className="text-[9px] text-gray-400">BJC Core Router</div>
                      <div className="text-[10px] font-mono font-bold text-emerald-400">10.10.1.1</div>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  </div>

                  <div className="p-2 rounded-lg bg-[#16181D]/80 border border-white/10 text-white flex items-center justify-between">
                    <div>
                      <div className="text-[9px] text-gray-400">148-Core Fiber Ring</div>
                      <div className="text-[10px] font-mono font-bold text-cyan-400">40 Gbps Core</div>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                  </div>
                </div>
              </div>

              {/* Simulated Footer */}
              <div 
                className="px-3 py-1.5 border-t border-white/10 flex items-center justify-between text-[9px] transition-colors"
                style={{ backgroundColor: tempTheme.footerBg }}
              >
                <span className="text-gray-400">
                  The Islamia University of Bahawalpur &bull; Directorate of IT
                </span>
                <span className="text-amber-400 font-medium">
                  Designed by Mr. Zeeshan Javed
                </span>
              </div>

            </div>
          </div>

        </div>

        {/* Modal Footer Controls */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-[#2D3139] bg-[#0A0B0E]">
          <div className="text-[11px] text-gray-400 hidden sm:block">
            Settings automatically persist in <code className="text-purple-300 font-mono">localStorage</code>.
          </div>

          <div className="flex items-center space-x-2.5 w-full sm:w-auto justify-end">
            <button
              onClick={handleResetToDefault}
              className="px-3.5 py-1.5 rounded-lg bg-[#16181D] hover:bg-[#1E2229] text-gray-300 text-xs font-semibold border border-[#2D3139] transition cursor-pointer"
            >
              Reset Default
            </button>
            <button
              onClick={handleSaveAndClose}
              className="px-5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-900/30 transition cursor-pointer flex items-center space-x-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Apply & Save Theme</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
