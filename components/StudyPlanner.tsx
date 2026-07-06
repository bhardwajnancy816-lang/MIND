import React, { useState, useEffect, useRef } from 'react';
import { Reminder, ThemeMode } from '../types';

interface StudyPlannerProps {
  reminders: Reminder[];
  onAddReminder: (
    task: string, 
    time: string, 
    type: Reminder['type'],
    priority: Reminder['priority'],
    estimatedPomodoros: number
  ) => void;
  onToggleReminder: (id: string) => void;
  onDeleteReminder: (id: string) => void;
  onIncrementTaskPomodoro: (id: string) => void;
  theme: ThemeMode;
  isOffline?: boolean;
}

const StudyPlanner: React.FC<StudyPlannerProps> = ({ 
  reminders, 
  onAddReminder, 
  onToggleReminder, 
  onDeleteReminder, 
  onIncrementTaskPomodoro, 
  theme,
  isOffline
}) => {
  const isDark = theme === 'dark';
  
  // Custom Session Timings (Pomodoro)
  const [workDuration, setWorkDuration] = useState(25);
  const [breakDuration, setBreakDuration] = useState(5);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'Work' | 'Break'>('Work');
  
  // Audio Controls & Ambient Channels
  const [activeSoundscape, setActiveSoundscape] = useState<string>('Off');
  const [selectedAlarmSound, setSelectedAlarmSound] = useState<string>('Classic tech');

  // Form/UI States
  const [showAddForm, setShowAddForm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // New Task inputs
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskTime, setNewTaskTime] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<Reminder['priority']>('Medium');
  const [newTaskPomodoros, setNewTaskPomodoros] = useState<number>(2);

  // Filters
  const [taskFilter, setTaskFilter] = useState<'All' | 'High' | 'Medium' | 'Low'>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Completed'>('All');
  
  // Audio Refs
  const sessionAudioRef = useRef<HTMLAudioElement | null>(null);
  const taskBellRef = useRef<HTMLAudioElement | null>(null);
  const completionChimeRef = useRef<HTMLAudioElement | null>(null);
  const ambientAudioRef = useRef<HTMLAudioElement | null>(null);

  // Alarm States
  const [taskAlarm, setTaskAlarm] = useState<Reminder | null>(null);
  const [triggeredIds, setTriggeredIds] = useState<Set<string>>(new Set());
  const [notifying, setNotifying] = useState(false);

  // Soundscape URLs mapping
  const SOUNDSCAPE_URLS: { [key: string]: string } = {
    'Lo-fi Beats': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', 
    'Cosmic white noise': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    'Forest Rain Ambient': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3'
  };

  // Initialize Audio Sources
  useEffect(() => {
    // Pomodoro session end (Smooth)
    sessionAudioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    // Task Due Time Alarm 
    taskBellRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/1070/1070-preview.mp3');
    taskBellRef.current.loop = true;
    // Manual Task Completion (Satisfying)
    completionChimeRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/1110/1110-preview.mp3');

    return () => {
      if (ambientAudioRef.current) ambientAudioRef.current.pause();
      if (taskBellRef.current) taskBellRef.current.pause();
    };
  }, []);

  // Sync ambient soundtrack
  useEffect(() => {
    if (activeSoundscape === 'Off') {
      if (ambientAudioRef.current) ambientAudioRef.current.pause();
    } else {
      const url = SOUNDSCAPE_URLS[activeSoundscape];
      if (url) {
        if (ambientAudioRef.current) ambientAudioRef.current.pause();
        ambientAudioRef.current = new Audio(url);
        ambientAudioRef.current.loop = true;
        ambientAudioRef.current.volume = 0.35;
        ambientAudioRef.current.play().catch(e => console.log('Autoplay blocked initially', e));
      }
    }
  }, [activeSoundscape]);

  // Handle ambient plays on interaction
  useEffect(() => {
    if (isActive && activeSoundscape !== 'Off' && ambientAudioRef.current) {
      ambientAudioRef.current.play().catch(() => {});
    }
  }, [isActive, activeSoundscape]);

  // Pomodoro clock loop
  useEffect(() => {
    let interval: any = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && isActive) {
      handleSessionComplete();
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  // Task Deadline Monitor Core
  useEffect(() => {
    const monitor = setInterval(() => {
      const now = new Date();
      const nowH = now.getHours();
      const nowM = now.getMinutes();

      reminders.forEach(rem => {
        if (rem.completed || triggeredIds.has(rem.id)) return;

        const raw = rem.time.toUpperCase().trim();
        let targetH = -1, targetM = -1;

        try {
          const isPM = raw.includes('PM');
          const isAM = raw.includes('AM');
          const timeParts = raw.replace('AM', '').replace('PM', '').trim().split(':');
          
          let h = parseInt(timeParts[0]);
          let m = parseInt(timeParts[1] || '0');

          if (isPM && h < 12) h += 12;
          if (isAM && h === 12) h = 0;

          targetH = h;
          targetM = m;

          if (nowH === targetH && nowM === targetM) {
            triggerTaskAlarm(rem);
          }
        } catch (e) { }
      });
    }, 5000);

    return () => clearInterval(monitor);
  }, [reminders, triggeredIds]);

  const triggerTaskAlarm = (rem: Reminder) => {
    setTaskAlarm(rem);
    setTriggeredIds(prev => new Set(prev).add(rem.id));
    if (taskBellRef.current) {
      taskBellRef.current.play().catch(console.error);
    }
  };

  const handleToggleTask = (id: string) => {
    const task = reminders.find(r => r.id === id);
    if (task && !task.completed) {
      if (completionChimeRef.current) {
        completionChimeRef.current.currentTime = 0;
        completionChimeRef.current.play().catch(console.error);
      }
    }
    onToggleReminder(id);
  };

  const dismissAlarm = (markComplete: boolean) => {
    if (taskAlarm && markComplete) {
      handleToggleTask(taskAlarm.id);
    }
    if (taskBellRef.current) {
      taskBellRef.current.pause();
      taskBellRef.current.currentTime = 0;
    }
    setTaskAlarm(null);
  };

  const handleSessionComplete = () => {
    setIsActive(false);
    setNotifying(true);
    if (sessionAudioRef.current) {
      sessionAudioRef.current.currentTime = 0;
      sessionAudioRef.current.play().catch(console.error);
    }
    setTimeout(() => {
      setNotifying(false);
      const nextMode = mode === 'Work' ? 'Break' : 'Work';
      const nextTime = nextMode === 'Work' ? workDuration : breakDuration;
      setMode(nextMode);
      setTimeLeft(nextTime * 60);
    }, 3000);
  };

  const applyPreset = (work: number, breakTime: number) => {
    setIsActive(false);
    setWorkDuration(work);
    setBreakDuration(breakTime);
    setTimeLeft((mode === 'Work' ? work : breakTime) * 60);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const updateWorkDuration = (val: number) => {
    setWorkDuration(val);
    if (!isActive && mode === 'Work') setTimeLeft(val * 60);
  };

  const updateBreakDuration = (val: number) => {
    setBreakDuration(val);
    if (!isActive && mode === 'Break') setTimeLeft(val * 60);
  };

  // Filters
  const filteredReminders = reminders.filter(r => {
    const matchesPriority = taskFilter === 'All' || r.priority === taskFilter;
    const matchesStatus = statusFilter === 'All' || 
                         (statusFilter === 'Active' && !r.completed) || 
                         (statusFilter === 'Completed' && r.completed);
    return matchesPriority && matchesStatus;
  });

  // Circle timer geometry calculations
  const radius = 105;
  const circ = 2 * Math.PI * radius;
  const totalSec = mode === 'Work' ? workDuration * 60 : breakDuration * 60;
  const progress = (timeLeft / totalSec) * circ;

  return (
    <div className="space-y-12 animate-fadeIn pb-20 relative">
      
      {/* REALISTIC COZY ALARM OVERLAY */}
      {taskAlarm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-2xl bg-zinc-950/70 animate-fadeIn">
          <div className="card-premium max-w-md w-full p-10 rounded-[2.5rem] text-center border border-indigo-500/10">
            <div className="w-24 h-24 bg-gradient-to-tr from-indigo-500 to-purple-500 text-white rounded-full flex items-center justify-center text-3xl mx-auto mb-8 animate-bounce shadow-xl shadow-indigo-500/10">
              <i className="fa-solid fa-bell animate-swing"></i>
            </div>
            <p className="text-indigo-500 font-bold uppercase tracking-wider text-[10px] mb-2">Milestone Scheduled Time</p>
            <h3 className={`text-2xl font-extrabold mb-2 tracking-tight ${isDark ? 'text-zinc-100' : 'text-stone-900'}`}>{taskAlarm.task}</h3>
            <p className="text-stone-500 text-sm font-medium mb-8">Set for {taskAlarm.time}</p>
            
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => dismissAlarm(true)}
                className="py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold uppercase text-[10px] tracking-widest shadow-md hover:scale-101 cursor-pointer transition-all"
              >
                Done • Dismiss Ringing
              </button>
              <button 
                onClick={() => dismissAlarm(false)}
                className="py-4 bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-zinc-400 rounded-xl font-bold uppercase text-[10px] tracking-widest hover:bg-stone-200 dark:hover:bg-zinc-750 cursor-pointer transition-all"
              >
                Skip alert
              </button>
            </div>
          </div>
        </div>
      )}      {/* Header with Spatial elements */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h2 className={`text-4xl font-extrabold tracking-tight ${isDark ? 'text-zinc-100' : 'text-stone-900'}`}>
            Focus <span className="bg-gradient-to-r from-indigo-505 to-purple-500 bg-clip-text text-transparent">Sanctuary</span>
          </h2>
          <p className="text-stone-500 font-medium text-sm mt-1">Calm study timers, responsive soundscapes, and goal tracking.</p>
        </div>
        <button 
          onClick={() => setShowSettings(!showSettings)}
          className={`px-5 py-3.5 rounded-xl border font-bold text-[10px] uppercase tracking-wider transition-all cursor-pointer ${showSettings ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/10' : 'bg-stone-55 border-stone-250/20 text-stone-500 dark:text-zinc-400 dark:border-zinc-800'}`}
        >
          <i className={`fa-solid ${showSettings ? 'fa-xmark mr-1.5' : 'fa-sliders mr-1.5'} text-[10px]`}></i>
          <span>{showSettings ? 'Close Config' : 'Configure Ring'}</span>
        </button>
      </header>

      {/* OFFLINE EMERGENCY NOTICE BAR */}
      {isOffline && (
        <div className="p-5 rounded-[2rem] bg-amber-500/[0.04] border border-amber-500/20 text-amber-500 flex items-center justify-between flex-wrap gap-4 text-left animate-slideDown">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-sm animate-pulse">
              <i className="fa-solid fa-satellite-dish"></i>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider leading-none">Emergency Offline Engine Active</p>
              <p className="text-xs font-semibold mt-1 text-stone-500/80 dark:text-zinc-400/80">Local sandbox synced. Ring alarms, soundscape caches, and millisecond counters are guaranteed to operate fully offline.</p>
            </div>
          </div>
          <span className="px-3.5 py-1.5 bg-amber-550/10 text-[8.5px] font-black uppercase tracking-widest rounded-xl border border-amber-500/10">
             Local engine sync
          </span>
        </div>
      )}

      {/* Grid containing Timer Ring & Task Planner */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* The Pomodoro Ring Element */}
        <div className={`lg:col-span-5 p-8 rounded-[2.5rem] relative overflow-hidden flex flex-col items-center justify-between min-h-[580px] transition-all duration-500 ${isDark ? 'bg-zinc-950/20 border border-zinc-800/80 shadow-2xl' : 'bg-white border border-stone-100 shadow-xl shadow-stone-200/20'}`}>
          <div className={`absolute w-full h-full blur-[140px] opacity-10 transition-all duration-1000 ${notifying ? 'bg-red-500' : mode === 'Work' ? 'bg-indigo-500' : 'bg-emerald-500'} ${isActive ? 'animate-pulse' : ''}`}></div>

          {/* Quick timing settings drawer/panel inside card */}
          {showSettings && (
            <div className="absolute inset-4 rounded-[2rem] z-20 backdrop-blur-3xl bg-[#161619] border border-zinc-800/40 p-8 flex flex-col items-center justify-center animate-fadeIn text-white">
              <h3 className="font-bold uppercase tracking-widest text-[10px] mb-8 text-indigo-400">Timing Parameters</h3>
              <div className="w-full space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between text-[10px] font-bold uppercase text-zinc-400 tracking-wider px-1">
                    <span>Work Interval</span>
                    <span className="text-indigo-400 font-bold">{workDuration} Mins</span>
                  </div>
                  <input type="range" min="1" max="120" value={workDuration} onChange={e => updateWorkDuration(parseInt(e.target.value))} className="w-full h-1 bg-zinc-800 accent-indigo-500 rounded-lg appearance-none cursor-pointer" />
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-[10px] font-bold uppercase text-zinc-400 tracking-wider px-1">
                    <span>Break Interval</span>
                    <span className="text-emerald-500 font-bold">{breakDuration} Mins</span>
                  </div>
                  <input type="range" min="1" max="60" value={breakDuration} onChange={e => updateBreakDuration(parseInt(e.target.value))} className="w-full h-1 bg-zinc-800 accent-emerald-500 rounded-lg appearance-none cursor-pointer" />
                </div>

                <div className="space-y-3 pt-4 border-t border-zinc-800/50">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 block">Session Complete Alarm</span>
                  <select 
                    value={selectedAlarmSound}
                    onChange={e => setSelectedAlarmSound(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 text-[10px] font-bold text-zinc-300 rounded-lg p-3 outline-none"
                  >
                    <option value="Classic tech">Classic Chime Pulse</option>
                    <option value="High resonance">High Resonance Bell</option>
                  </select>
                </div>
              </div>
              <button onClick={() => setShowSettings(false)} className="mt-8 px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold uppercase text-[9px] tracking-widest hover:scale-103 cursor-pointer transition-all">Save Changes</button>
            </div>
          )}

          {/* Timing presets */}
          <div className="w-full flex justify-between gap-2 z-10">
            {[
              { label: 'Pomodoro', work: 25, brk: 5, activeClass: 'hover:border-indigo-500' },
              { label: 'Deep Study', work: 50, brk: 10, activeClass: 'hover:border-purple-500' },
              { label: 'Quick Cycle', work: 15, brk: 3, activeClass: 'hover:border-emerald-500' },
            ].map(preset => (
              <button
                key={preset.label}
                onClick={() => applyPreset(preset.work, preset.brk)}
                className={`flex-1 py-2 px-3 rounded-xl border text-[9px] font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                  isDark 
                    ? 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:bg-zinc-850' 
                    : 'bg-stone-50 border-stone-100 text-stone-600 hover:bg-stone-100'
                } ${preset.activeClass}`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className="z-10 px-4 py-2 rounded-full text-[9px] font-semibold uppercase tracking-wider bg-indigo-55/10 dark:bg-indigo-500/5 border border-indigo-500/10 text-indigo-505 dark:text-indigo-400 mt-4 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
            <span>{mode} Loop</span>
          </div>

          {/* Aesthetic Ring SVG Clock */}
          <div className="relative w-64 h-64 flex items-center justify-center my-6">
            <svg className="absolute w-full h-full -rotate-90">
              <circle cx="128" cy="128" r={radius} stroke="rgba(128,128,128,0.04)" strokeWidth="2.5" fill="none" />
              <circle cx="128" cy="128" r={radius} stroke={mode === 'Work' ? '#6366F1' : '#10B981'} strokeWidth="4.5" fill="none" strokeDasharray={circ} strokeDashoffset={circ - progress} className="transition-all duration-1000 ease-linear" strokeLinecap="round" />
            </svg>
            <div className={`relative w-48 h-48 rounded-full flex flex-col items-center justify-center shadow-md ${
              isDark ? 'bg-zinc-900 border border-zinc-850/80' : 'bg-white border border-stone-100'
            }`}>
              <span className="text-[10px] font-bold uppercase tracking-widest mb-1 text-stone-400">{isActive ? 'Flowing' : 'Standby'}</span>
              <p className={`text-4xl font-extrabold tracking-tight ${isDark ? 'text-zinc-100' : 'text-stone-900'}`}>{formatTime(timeLeft)}</p>
            </div>
          </div>

          {/* Ambient soundtrack controls */}
          <div className="w-full mt-2 z-10 text-center">
            <p className="text-[9px] font-bold uppercase tracking-wider text-stone-400/80 mb-2">Study Ambient sounds</p>
            <div className="grid grid-cols-4 gap-2">
              {['Off', 'Lo-fi Beats', 'Cosmic noise', 'Forest Rain'].map(track => {
                const isSelected = track === 'Off' ? activeSoundscape === 'Off' : activeSoundscape.startsWith(track.substring(0, 5));
                return (
                  <button
                    key={track}
                    onClick={() => {
                      if (track === 'Off') {
                        setActiveSoundscape('Off');
                      } else if (track === 'Lo-fi Beats') {
                        setActiveSoundscape('Lo-fi Beats');
                      } else if (track === 'Cosmic noise') {
                        setActiveSoundscape('Cosmic white noise');
                      } else {
                        setActiveSoundscape('Forest Rain Ambient');
                      }
                    }}
                    className={`p-2.5 rounded-xl border text-[8px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      isSelected 
                        ? 'bg-indigo-650 text-white border-indigo-600 shadow-sm shadow-indigo-600/10' 
                        : isDark ? 'bg-zinc-900/60 border-zinc-805 text-zinc-500 hover:text-zinc-300' : 'bg-stone-50 border-stone-100 text-stone-400 hover:text-stone-605'
                    }`}
                  >
                    {track.replace(' Beats', '').replace(' noise', '')}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Control Panel button row */}
          <div className="mt-6 flex items-center gap-6 z-10">
            <button onClick={() => {setIsActive(false); setTimeLeft(mode === 'Work' ? workDuration * 60 : breakDuration * 60);}} className="w-12 h-12 rounded-full bg-stone-100 hover:bg-stone-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-stone-405 dark:text-zinc-500 hover:text-stone-600 dark:hover:text-zinc-300 transition-all text-sm flex items-center justify-center cursor-pointer border border-transparent dark:border-zinc-800/40" title="Reset current block"><i className="fa-solid fa-rotate-right"></i></button>
            
            <button onClick={() => setIsActive(!isActive)} className={`w-16 h-16 rounded-full flex items-center justify-center text-lg shadow-md transition-all cursor-pointer ${mode === 'Work' ? 'bg-indigo-600 text-white shadow-indigo-600/10 hover:bg-indigo-700' : 'bg-emerald-600 text-white shadow-emerald-600/10 hover:bg-emerald-700'}`}>
              <i className={`fa-solid ${isActive ? 'fa-pause' : 'fa-play'}`}></i>
            </button>
            
            <button onClick={() => {const nm = mode === 'Work' ? 'Break' : 'Work'; setMode(nm); setTimeLeft((nm === 'Work' ? workDuration : breakDuration) * 60); setIsActive(false);}} className="w-12 h-12 rounded-full bg-stone-100 hover:bg-stone-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-stone-405 dark:text-zinc-500 hover:text-stone-600 dark:hover:text-zinc-300 transition-all text-sm flex items-center justify-center cursor-pointer border border-transparent dark:border-zinc-800/40" title="Skip to next block"><i className="fa-solid fa-forward-step"></i></button>
          </div>
        </div>

        {/* Tactile Study Reminders */}
        <div className="lg:col-span-7 card-premium p-8 rounded-[2.5rem] relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
              <div>
                <h3 className={`text-xl font-extrabold tracking-tight ${isDark ? 'text-zinc-100' : 'text-stone-800'}`}>Study Milestones</h3>
                <p className="text-stone-400 text-xs font-semibold mt-0.5">High-priority tasks flagged for today's sessions.</p>
              </div>
              <button 
                onClick={() => setShowAddForm(!showAddForm)} 
                className="px-5 py-3 bg-indigo-55/15 dark:bg-indigo-500/10 hover:bg-indigo-500/15 text-indigo-500 rounded-xl text-[9px] font-bold uppercase tracking-wider border border-indigo-500/10 self-start sm:self-auto transition-all cursor-pointer"
              >
                {showAddForm ? 'Cancel Form' : '+ Add Milestone'}
              </button>
            </div>

            {showAddForm && (
              <form 
                onSubmit={e => {
                  e.preventDefault(); 
                  if(newTaskName && newTaskTime) {
                    onAddReminder(newTaskName, newTaskTime, 'Study', newTaskPriority, newTaskPomodoros); 
                    setNewTaskName(''); 
                    setNewTaskTime(''); 
                    setShowAddForm(false);
                  }
                }} 
                className={`p-6 rounded-[2rem] ${isDark ? 'bg-zinc-900/60 border border-zinc-800' : 'bg-stone-50 border border-stone-200/40'} mb-8 animate-slideDown`}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-1.5">
                    <span className="text-[8px] font-bold uppercase text-stone-500 tracking-wider">Milestone goal</span>
                    <input className="w-full bg-stone-100 dark:bg-zinc-950/40 border border-stone-200 dark:border-zinc-800 p-3.5 rounded-lg text-xs font-bold text-stone-700 dark:text-zinc-300 placeholder-stone-400 dark:placeholder-zinc-650 outline-none focus:border-indigo-500" placeholder="e.g. Solve Ray Optics chapter questions" value={newTaskName} onChange={e => setNewTaskName(e.target.value)} required />
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-[8px] font-bold uppercase text-stone-500 tracking-wider">Notify Target Time (e.g. 5:30 PM)</span>
                    <input className="w-full bg-stone-100 dark:bg-zinc-950/40 border border-stone-200 dark:border-zinc-800 p-3.5 rounded-lg text-xs font-bold text-stone-700 dark:text-zinc-300 placeholder-stone-400 dark:placeholder-zinc-650 outline-none focus:border-indigo-500" placeholder="e.g. 10:15 PM" value={newTaskTime} onChange={e => setNewTaskTime(e.target.value)} required />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
                  <div className="space-y-2">
                    <span className="text-[8px] font-bold uppercase text-stone-500 tracking-wider">Priority Level</span>
                    <div className="flex gap-2">
                      {(['Low', 'Medium', 'High'] as const).map(prio => (
                        <button
                          type="button"
                          key={prio}
                          onClick={() => setNewTaskPriority(prio)}
                          className={`flex-1 py-2 rounded-lg text-[9px] font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                            newTaskPriority === prio 
                              ? prio === 'High' 
                                ? 'bg-red-500/10 text-red-500 border-red-500/30' 
                                : prio === 'Medium' 
                                  ? 'bg-amber-500/10 text-amber-500 border-amber-500/30' 
                                  : 'bg-stone-500/10 text-stone-500 border-stone-500/20 dark:text-zinc-400 dark:border-zinc-700'
                              : 'bg-transparent border-stone-200 dark:border-zinc-800 text-stone-400 dark:text-zinc-600'
                          }`}
                        >
                          {prio}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[8px] font-bold uppercase text-stone-500 tracking-wider">Allocated Pomodoros ({newTaskPomodoros})</span>
                    <div className="flex gap-1.5">
                      {[1, 2, 3, 4, 5].map(num => (
                        <button
                          type="button"
                          key={num}
                          onClick={() => setNewTaskPomodoros(num)}
                          className={`w-9 h-9 rounded-lg font-bold text-[9px] flex items-center justify-center border transition-all cursor-pointer ${
                            newTaskPomodoros === num 
                              ? 'bg-indigo-500/15 text-indigo-500 border-indigo-500/30' 
                              : 'bg-transparent border-stone-200 dark:border-zinc-800 text-stone-405 dark:text-zinc-550'
                          }`}
                        >
                          {num}🍅
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <button type="submit" className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold uppercase text-[10px] tracking-widest shadow-md hover:scale-[1.01] transition-all cursor-pointer">Commit Study Milestone</button>
              </form>
            )}

            {/* List Filtration tags */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-3 rounded-2xl border border-stone-200/40 dark:border-zinc-800/60 mb-6 bg-stone-50/50 dark:bg-zinc-900/10">
              <div className="flex items-center gap-2">
                <span className="text-[8px] font-bold uppercase tracking-wider text-stone-400">Prio:</span>
                <div className="flex gap-1">
                  {(['All', 'High', 'Medium', 'Low'] as const).map(pFilter => (
                    <button
                      key={pFilter}
                      onClick={() => setTaskFilter(pFilter)}
                      className={`px-3 py-1 rounded-md text-[8px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                        taskFilter === pFilter 
                          ? 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/15' 
                          : 'text-stone-400 hover:text-stone-605'
                      }`}
                    >
                      {pFilter}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[8px] font-bold uppercase tracking-wider text-stone-400">State:</span>
                <div className="flex gap-1">
                  {(['All', 'Active', 'Completed'] as const).map(sFilter => (
                    <button
                      key={sFilter}
                      onClick={() => setStatusFilter(sFilter)}
                      className={`px-3 py-1 rounded-md text-[8px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                        statusFilter === sFilter 
                          ? 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/15' 
                          : 'text-stone-400 hover:text-stone-605'
                      }`}
                    >
                      {sFilter}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Task list mapping */}
            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar">
              {filteredReminders.map(rem => {
                const isHigh = rem.priority === 'High';
                const isMed = rem.priority === 'Medium';
                const estimatedArray = Array.from({ length: rem.estimatedPomodoros || 1 }, (_, i) => i + 1);

                return (
                  <div key={rem.id} className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all group ${isDark ? 'bg-zinc-900/30 border-zinc-800' : 'bg-white border-stone-200/50 shadow-sm'}`}>
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      {/* Custom styled checkbox indicator */}
                      <button 
                        onClick={() => handleToggleTask(rem.id)} 
                        className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 transition-all mt-0.5 cursor-pointer ${
                          rem.completed 
                            ? 'bg-emerald-500 border-emerald-500 text-white' 
                            : 'border-stone-250 dark:border-zinc-700 hover:border-indigo-500 text-transparent'
                        }`}
                      >
                        <i className="fa-solid fa-check text-xs"></i>
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className={`text-base font-bold block truncate ${rem.completed ? 'line-through opacity-30 text-stone-500' : isDark ? 'text-zinc-100' : 'text-stone-900'}`}>{rem.task}</p>
                          
                          <span className={`text-[8px] font-bold uppercase px-2 py-0.5 rounded-md border tracking-wider ${
                            isHigh 
                              ? 'bg-red-500/10 text-red-500 border-red-500/10' 
                              : isMed 
                                ? 'bg-amber-500/10 text-amber-500 border-amber-500/10' 
                                : 'bg-stone-500/10 text-stone-400 border-stone-500/10'
                          }`}>
                            {rem.priority || 'Medium'}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 mt-2 flex-wrap">
                          <span className={`text-[9px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${triggeredIds.has(rem.id) && !rem.completed ? 'text-red-500 animate-pulse' : 'text-stone-400'}`}>
                            <i className={`fa-solid ${triggeredIds.has(rem.id) && !rem.completed ? 'fa-bell animate-swing' : 'fa-clock text-indigo-500'}`}></i> {rem.time}
                          </span>
                          
                          {/* Tomato Checkable Slots */}
                          {!rem.completed && (
                            <div className="flex items-center gap-1">
                              <span className="text-[8px] text-stone-450 uppercase font-bold tracking-wider mr-1">Tuning Slices:</span>
                              {estimatedArray.map(sliceNum => {
                                const activePomStatus = sliceNum <= (rem.completedPomodoros || 0);
                                return (
                                  <button
                                    key={sliceNum}
                                    onClick={() => onIncrementTaskPomodoro(rem.id)}
                                    className={`w-5 h-5 rounded border text-[8px] flex items-center justify-center transition-all cursor-pointer ${
                                      activePomStatus 
                                        ? 'bg-indigo-600 border-indigo-600 text-white font-bold' 
                                        : 'bg-transparent border-stone-200 dark:border-zinc-800 text-stone-400 hover:border-indigo-500'
                                    }`}
                                    title={`Complete slice ${sliceNum}`}
                                  >
                                    {activePomStatus ? '✓' : '🍅'}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button 
                        onClick={() => onDeleteReminder(rem.id)} 
                        className="w-8 h-8 bg-red-400/5 text-red-400 border border-red-500/10 hover:bg-red-450/15 rounded-lg sm:opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center cursor-pointer"
                        title="Delete Goal"
                      >
                        <i className="fa-solid fa-trash text-[10px]"></i>
                      </button>
                    </div>
                  </div>
                );
              })}
              
              {/* Natural organic Empty State */}
              {filteredReminders.length === 0 && (
                <div className="py-20 text-center opacity-60 flex flex-col items-center justify-center text-stone-400">
                  <div className="w-12 h-12 rounded-full border border-dashed border-stone-300 dark:border-zinc-800 flex items-center justify-center mb-4 text-indigo-500">
                    <i className="fa-solid fa-circle-check text-xl"></i>
                  </div>
                  <p className="text-sm font-bold tracking-tight">No milestones recorded.</p>
                  <p className="text-[10px] uppercase tracking-widest text-[#10B981] font-bold mt-1">Clean space • Rest, recover, and grow.</p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default StudyPlanner;
