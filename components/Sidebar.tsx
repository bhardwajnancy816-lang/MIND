import React from 'react';
import { APP_MODES } from '../constants';
import { ThemeMode } from '../types';

interface SidebarProps {
  activeMode: string;
  setActiveMode: (mode: string) => void;
  theme: ThemeMode;
  toggleTheme: () => void;
  onLogout: () => void;
  isOffline: boolean;
  setIsOffline: React.Dispatch<React.SetStateAction<boolean>>;
}

const Sidebar: React.FC<SidebarProps> = ({
  activeMode,
  setActiveMode,
  theme,
  toggleTheme,
  onLogout,
  isOffline,
  setIsOffline
}) => {
  const isDark = theme === 'dark';

  const menuItems = [
    { id: APP_MODES.DASHBOARD, label: 'Dashboard', icon: 'fa-table-columns' },
    { id: APP_MODES.CHAT, label: 'AI Co-pilot', icon: 'fa-brain' },
    { id: APP_MODES.NOTES, label: 'Library', icon: 'fa-folder-open' },
    { id: APP_MODES.PLANNER, label: 'Study Planner', icon: 'fa-calendar-check' },
    { id: APP_MODES.DOUBTS, label: 'Doubt Solver', icon: 'fa-lightbulb' },
    { id: APP_MODES.MOCK_TEST, label: 'Mock Arena', icon: 'fa-graduation-cap' },
    { id: APP_MODES.FOCUS_ROOMS, label: 'Focus Rooms', icon: 'fa-clock' },
  ];

  return (
    <>
      {/* MOBILE FLOATING GLASS BOTTOM NAVIGATION */}
      <div className="lg:hidden fixed bottom-5 left-4 right-4 z-50 glass rounded-2xl border border-white/20 dark:border-zinc-800/60 shadow-xl shadow-stone-900/10 dark:shadow-black/30 p-2.5 flex items-center justify-around">
        {menuItems.map((item) => {
          const isActive = activeMode === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveMode(item.id)}
              className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all ${
                isActive
                  ? 'text-indigo-600 dark:text-indigo-400 scale-110 font-bold'
                  : 'text-stone-400 dark:text-zinc-500 hover:text-stone-600 dark:hover:text-zinc-300'
              }`}
            >
              <i className={`fa-solid ${item.icon} text-lg`}></i>
              <span className="text-[9px] mt-1 font-semibold tracking-tight">{item.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </div>

      {/* DESKTOP SIDEBAR */}
      <div className={`hidden lg:flex w-72 h-screen flex-col fixed left-0 top-0 z-40 border-r transition-all duration-300 ${
        isDark 
          ? 'bg-[#121214] border-zinc-850/80' 
          : 'bg-white border-stone-100 shadow-sm'
      }`}>
        {/* Brand Header */}
        <div className="p-8 flex items-center gap-3.5">
          <div className="w-10 h-10 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/15 cursor-pointer hover:rotate-12 transition-all duration-300">
            <i className="fa-solid fa-compass text-white text-lg"></i>
          </div>
          <div className="text-left">
            <h1 className={`text-xl font-extrabold tracking-tight ${isDark ? 'text-zinc-100' : 'text-stone-900'}`}>MindOrbit</h1>
            <p className="text-[8px] font-black uppercase tracking-[0.22em] text-indigo-500">Premium Study Workspace</p>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = activeMode === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveMode(item.id)}
                className={`w-full flex items-center gap-4 px-4.5 py-3 rounded-xl transition-all duration-300 group ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/10 font-bold'
                    : isDark 
                      ? 'text-zinc-400 hover:bg-zinc-850 hover:text-indigo-400' 
                      : 'text-stone-500 hover:bg-stone-50 hover:text-indigo-650'
                }`}
              >
                <i className={`fa-solid ${item.icon} text-base transition-transform group-hover:scale-105 duration-300`}></i>
                <span className="font-semibold text-sm tracking-tight">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Control Center & Profile widget */}
        <div className="p-5 border-t border-stone-100 dark:border-zinc-850/60 space-y-3.5">
          {/* Telemetry Indicator Link */}
          <button 
            onClick={() => {
              const next = !isOffline;
              setIsOffline(next);
              localStorage.setItem('mindorbit_offline_forced', next ? 'true' : 'false');
            }}
            className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left ${
              isOffline 
                ? 'border-amber-500/20 bg-amber-500/5 text-amber-500' 
                : isDark
                  ? 'border-zinc-800/40 bg-zinc-900/30 text-zinc-400 hover:border-indigo-500/20 hover:text-indigo-400'
                  : 'border-stone-200 bg-stone-50/50 text-stone-500 hover:border-indigo-200 hover:text-indigo-600'
            }`}
            title="Toggle Emergency Offline Mode"
          >
            <div className="text-left">
              <p className="text-[7.5px] font-black uppercase tracking-widest text-stone-400">Connection State</p>
              <p className="text-[10px] font-black mt-0.5 tracking-tight">
                {isOffline ? 'Offline Standby' : 'Satellite Active'}
              </p>
            </div>
            <div className="relative flex items-center justify-center w-5 h-5">
              <span className={`absolute inline-flex h-2.5 w-2.5 rounded-full ${isOffline ? 'bg-amber-400' : 'bg-emerald-400 animate-ping'}`}></span>
              <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${isOffline ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
            </div>
          </button>

          {/* Theme & Sign Out Row */}
          <div className="flex gap-2">
            <button 
              onClick={toggleTheme}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border font-bold text-[9px] uppercase tracking-widest transition-all ${
                isDark 
                  ? 'border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:text-indigo-400 hover:border-zinc-700' 
                  : 'border-stone-100 bg-stone-50 text-stone-450 hover:text-indigo-600 hover:border-stone-200'
              }`}
            >
              <i className={`fa-solid ${isDark ? 'fa-moon text-indigo-400' : 'fa-sun text-amber-500'}`}></i>
              <span>{isDark ? 'Dark' : 'Light'}</span>
            </button>

            <button 
              onClick={onLogout}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-red-500/10 text-red-500/80 hover:bg-red-500/5 font-bold text-[9px] uppercase tracking-widest transition-all`}
            >
              <i className="fa-solid fa-right-from-bracket"></i>
              <span>Exit</span>
            </button>
          </div>

          {/* User Profile Footer Card */}
          <div className={`p-3 rounded-xl flex items-center gap-3 text-left border ${
            isDark ? 'bg-zinc-900/20 border-zinc-850' : 'bg-stone-50/50 border-stone-100'
          }`}>
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-[11px] font-black uppercase">
              NB
            </div>
            <div className="overflow-hidden">
              <p className={`text-xs font-bold truncate ${isDark ? 'text-zinc-200' : 'text-stone-800'}`}>Nancy Bhardwaj</p>
              <p className="text-[9px] text-stone-400 truncate">nancybhardwaj0907@gmail.com</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
