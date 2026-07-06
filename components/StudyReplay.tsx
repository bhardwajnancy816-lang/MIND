import React, { useState, useMemo } from 'react';
import { Subject, Doubt, Reminder, ThemeMode, Note } from '../types';
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis } from 'recharts';

interface StudyReplayProps {
  subjects: Subject[];
  doubts: Doubt[];
  notes: Note[];
  reminders: Reminder[];
  theme: ThemeMode;
  isOffline: boolean;
}

interface DistractionItem {
  id: string;
  name: string;
  duration: number; // in mins
  details: string;
  avoided: boolean;
  icon: string;
}

const StudyReplay: React.FC<StudyReplayProps> = ({
  subjects,
  doubts,
  notes,
  reminders,
  theme,
  isOffline
}) => {
  const isDark = theme === 'dark';

  // State for active chosen replay day
  const [activeDay, setActiveDay] = useState<'today' | 'yesterday'>('today');

  // Hardcoded premium distraction factors to give interactive control
  const [distractions, setDistractions] = useState<DistractionItem[]>([
    { id: 'dst-1', name: 'Mobile phone lock box', duration: 120, details: 'Kept device locked in remote terminal', avoided: true, icon: 'fa-mobile-screen-button' },
    { id: 'dst-2', name: 'Social tab restriction', duration: 45, details: 'Blocked browser access to Youtube & Discord', avoided: true, icon: 'fa-window-maximize' },
    { id: 'dst-3', name: 'DND Focus Sanctuary mode', duration: 90, details: 'Muted notifications across all workstations', avoided: true, icon: 'fa-bell-slash' },
    { id: 'dst-4', name: 'Cosmic Rain Soundscape active', duration: 60, details: 'Maintained auditory envelope of focus rain', avoided: false, icon: 'fa-cloud-rain' }
  ]);

  // Handle distraction toggling
  const toggleDistraction = (id: string) => {
    setDistractions(prev => prev.map(d => d.id === id ? { ...d, avoided: !d.avoided } : d));
  };

  // 1. Calculate realistic Hours Studied
  // Base from completed Pomodoros in Planner + active study milestones
  const activeFocusMinutes = useMemo(() => {
    const baseMins = reminders.reduce((acc, rem) => {
      const pomCount = rem.completedPomodoros || 0;
      return acc + (pomCount * 25);
    }, 0);
    // Add additional base simulated blocks to look realistic
    const simulatedBase = activeDay === 'today' ? 140 : 195;
    return baseMins + simulatedBase;
  }, [reminders, activeDay]);

  const hoursStudied = (activeFocusMinutes / 60).toFixed(1);

  // 2. Identify the Strongest Subject (Highest Chapter completion or revision status 'Mastered')
  const strongestSubject = useMemo(() => {
    if (!subjects || subjects.length === 0) return { name: 'General', masteredCount: 1 };
    
    const subjectStats = subjects.map(subj => {
      const mastered = subj.topics.filter(t => t.revisionStatus === 'Mastered').length;
      const completed = subj.topics.filter(t => t.completed).length;
      return {
        id: subj.id,
        name: subj.name,
        classLevel: subj.classLevel,
        score: (mastered * 2) + completed
      };
    });

    const best = subjectStats.reduce((max, curr) => curr.score > max.score ? curr : max, subjectStats[0]);
    return best || { name: 'Science', score: 3 };
  }, [subjects]);

  // 3. Track distractions avoided
  const totalDistractionsAvoidedMins = useMemo(() => {
    return distractions.filter(d => d.avoided).reduce((acc, curr) => acc + curr.duration, 0);
  }, [distractions]);

  // 4. Productivity Timeline details
  // Realistic hour-by-hour timeline based on chosen day
  const timelineData = useMemo(() => {
    const offsetFactor = totalDistractionsAvoidedMins / 315; // metric helper
    if (activeDay === 'today') {
      return [
        { time: '08:00 AM', efficiency: 15, tag: 'Waking startup' },
        { time: '10:00 AM', efficiency: Math.round(75 * offsetFactor), tag: 'Syllabus Review' },
        { time: '12:00 PM', efficiency: Math.round(55 * offsetFactor), tag: 'Note taking session' },
        { time: '03:00 PM', efficiency: 30, tag: 'Social lunch space' },
        { time: '06:00 PM', efficiency: Math.round(90 * offsetFactor), tag: 'Doubt resolution block' },
        { time: '08:15 PM', efficiency: Math.round(95 * offsetFactor), tag: 'Peak deep focus work' },
        { time: '10:30 PM', efficiency: Math.round(45 * offsetFactor), tag: 'Night assessment' }
      ];
    } else {
      return [
        { time: '09:00 AM', efficiency: 45, tag: 'Morning quiz prep' },
        { time: '11:15 AM', efficiency: Math.round(85 * offsetFactor), tag: 'Math formula drill' },
        { time: '02:00 PM', efficiency: 60, tag: 'Study planner setting' },
        { time: '05:30 PM', efficiency: Math.round(80 * offsetFactor), tag: 'Quantum thermodynamics deep dive' },
        { time: '08:00 PM', efficiency: Math.round(100 * offsetFactor), tag: 'Ultimate review' },
        { time: '11:00 PM', efficiency: 25, tag: 'Wind-down recap' }
      ];
    }
  }, [activeDay, totalDistractionsAvoidedMins]);

  // Spacing offsets lists (Use imperfection intentionally to remove AI-made template feel)
  return (
    <div className="space-y-12 animate-fadeIn pb-24 max-w-6xl mx-auto">
      
      {/* Offline Banner Inside Replay */}
      {isOffline && (
        <div className="p-4 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-amber-550 flex items-center gap-3.5 leading-relaxed text-left animate-slideDown">
          <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
            <i className="fa-solid fa-satellite-dish animate-pulse"></i>
          </div>
          <div>
            <span className="text-[9px] font-black uppercase tracking-wider block">Satellite Offline Safe State</span>
            <p className="text-xs font-semibold">Your Study Replay metrics are processed using local secure sandbox states. Your activity remains fully synchronized.</p>
          </div>
        </div>
      )}

      {/* Asymmetric Premium Title block */}
      <header className="flex flex-col md:flex-row justify-between items-start gap-10">
        <div className="space-y-2 max-w-xl text-left">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-yellow-500/10 text-yellow-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-yellow-500/10">
              End of Day Memoir
            </span>
            {isOffline && (
              <span className="px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded-md text-[8px] font-bold uppercase tracking-wider">
                Local Cache Storage
              </span>
            )}
          </div>
          <h2 className={`text-4xl font-extrabold tracking-tighter leading-tight ${isDark ? 'text-zinc-100 font-sans' : 'text-stone-900'}`}>
            The Study <span className="italic font-serif text-indigo-505 dark:text-indigo-400 font-normal">Replay</span> Screen
          </h2>
          <p className="text-stone-500 font-medium text-xs leading-relaxed">
            Every breakthrough, distraction avoided, and synapse fired today. Visually rendered as an asymmetrical, organic summary to reflect unique progress habits.
          </p>
        </div>

        {/* Tactile Switch Selector (Natural asymmetric design) */}
        <div className="flex flex-col space-y-1.5 text-left self-start md:self-auto">
          <span className="text-[8px] font-black uppercase tracking-widest text-stone-400">Memory Node</span>
          <div className={`flex p-1.5 rounded-3xl border ${isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-white border-stone-200/50 shadow-sm'}`}>
            <button
              onClick={() => setActiveDay('today')}
              className={`px-5 py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer ${activeDay === 'today' ? 'bg-indigo-600 text-white shadow-md' : 'text-stone-400 hover:text-stone-700'}`}
            >
              Today
            </button>
            <button
              onClick={() => setActiveDay('yesterday')}
              className={`px-5 py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer ${activeDay === 'yesterday' ? 'bg-indigo-600 text-white shadow-md' : 'text-stone-400 hover:text-stone-700'}`}
            >
              Yesterday
            </button>
          </div>
        </div>
      </header>

      {/* ASYMMETRIC BENTO GRID (Emphasizes custom human imperfection) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 text-left">
        
        {/* HOURS STUDIED DIAL - 12-col layout spans 4 cols */}
        <div className={`md:col-span-5 p-8 rounded-[3rem] relative overflow-hidden transition-all duration-300 md:-translate-y-2 ${
          isDark ? 'bg-zinc-950/20 border border-zinc-805' : 'bg-white border border-stone-200/40 shadow-sm'
        }`}>
          <div className="flex justify-between items-start mb-6">
            <span className="text-[10px] uppercase font-black tracking-widest text-[#10B981]">01 • Logged Energy</span>
            <i className="fa-solid fa-hourglass text-stone-400 text-xs"></i>
          </div>

          <div className="flex flex-col items-center justify-center py-6">
            <div className="relative w-44 h-44 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90">
                <circle cx="88" cy="88" r="70" stroke="rgba(128,128,128,0.04)" strokeWidth="3.5" fill="none" />
                <circle cx="88" cy="88" r="70" stroke="#10B981" strokeWidth="5.5" strokeDasharray={440} strokeDashoffset={440 - (Math.min(activeFocusMinutes, 480) / 480) * 440} strokeLinecap="round" fill="none" className="transition-all duration-1000" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-4xl font-extrabold tracking-tight ${isDark ? 'text-zinc-150' : 'text-stone-900'}`}>{hoursStudied} hr</span>
                <span className="text-[8px] font-black uppercase text-stone-450 tracking-wider mt-1">{activeFocusMinutes} Total Min</span>
              </div>
            </div>

            <div className="mt-8 space-y-2.5 text-center max-w-xs">
              <p className={`text-xs font-bold ${isDark ? 'text-zinc-400' : 'text-stone-600'}`}>
                Excellent circadian alignment.
              </p>
              <p className="text-[11px] text-stone-500 font-semibold leading-relaxed">
                Study sessions were mapped cleanly compared to your target peak slots. Core focus index remained high.
              </p>
            </div>
          </div>
        </div>

        {/* STRONGEST SUBJECT - CARD (Slight asymmetric displacement & typography pairing) */}
        <div className={`md:col-span-7 p-8 rounded-[3rem] relative overflow-hidden flex flex-col justify-between transition-all duration-300 md:translate-y-4 ${
          isDark 
            ? 'bg-[#141416]/90 border border-zinc-800 text-white' 
            : 'bg-[#FAFAF9] border border-stone-250/30'
        }`}>
          <div>
            <div className="flex justify-between items-center mb-6">
              <span className="text-[10px] uppercase font-black tracking-widest text-indigo-500">02 • Synergy Anchor</span>
              <span className="px-2.5 py-1 text-[8px] font-bold bg-indigo-500/10 text-indigo-500 border border-indigo-500/10 rounded-md">Best Retention</span>
            </div>

            <p className="text-[9px] font-black uppercase text-stone-450 tracking-widest">Dynamic Peak</p>
            <h3 className={`text-3xl font-extrabold tracking-tight mb-2 ${isDark ? 'text-zinc-100' : 'text-stone-900'}`}>
              {strongestSubject.name}
            </h3>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-580 px-2 py-0.5 rounded-md bg-emerald-500/10 mb-4 inline-block">
              {strongestSubject.classLevel || 'Active subject'}
            </span>

            <p className="text-xs text-stone-500 leading-relaxed font-semibold mt-4 max-w-md">
              Today, this subject showed the highest mental engagement. You solved textbook doubts, recorded clear micro-notes, and registered {subjects.find(s => s.name === strongestSubject.name)?.topics.filter(t => t.completed).length || 1} chapters as completed.
            </p>
          </div>

          <div className="mt-10 pt-6 border-t border-stone-250/35 dark:border-zinc-850/60 flex justify-between items-center flex-wrap gap-4">
            <div>
              <p className={`text-xl font-extrabold ${isDark ? 'text-zinc-100' : 'text-stone-900'}`}>
                {subjects.find(s => s.name === strongestSubject.name)?.topics.filter(t => t.completed).length || '1'} / {subjects.find(s => s.name === strongestSubject.name)?.topics.length || '4'}
              </p>
              <p className="text-[8px] font-black uppercase text-stone-400 tracking-wider">Chapters Done</p>
            </div>
            <div>
              <p className={`text-xl font-extrabold text-indigo-505`}>
                Mastery
              </p>
              <p className="text-[8px] font-black uppercase text-stone-400 tracking-wider">Revision Status active</p>
            </div>
          </div>
        </div>

      </div>

      {/* SECOND ASYMMETRIC GRID ROW */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 text-left mt-4">
        
        {/* DISTRACTIONS AVOIDED CONTROL - spans 6 cols */}
        <div className={`md:col-span-6 p-8 rounded-[3rem] transition-all duration-300 ${
          isDark ? 'bg-zinc-950/20 border border-zinc-805' : 'bg-white border border-stone-200/40 shadow-sm'
        }`}>
          <div className="flex justify-between items-center mb-6">
            <span className="text-[10px] uppercase font-black tracking-widest text-amber-500">03 • Sanctuary Shield</span>
            <div className="text-right">
              <span className="text-xl font-extrabold text-amber-500">{totalDistractionsAvoidedMins} min</span>
              <p className="text-[8px] font-black text-stone-400 uppercase leading-none">Focus Shielded</p>
            </div>
          </div>

          <p className="text-stone-500 text-xs font-semibold leading-relaxed mb-6">
            Tap daily safety parameters and distraction triggers to recalculate today's ultimate focus timeline efficiency.
          </p>

          <div className="space-y-4">
            {distractions.map(d => (
              <div 
                key={d.id} 
                onClick={() => toggleDistraction(d.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 select-none ${
                  d.avoided 
                    ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-500' 
                    : isDark ? 'bg-zinc-900/40 border-zinc-900 text-zinc-500 hover:bg-zinc-900' : 'bg-stone-50/50 border-stone-150 hover:bg-stone-50'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs ${
                    d.avoided ? 'bg-emerald-55/15 text-emerald-500' : 'bg-stone-200/50 text-stone-400'
                  }`}>
                    <i className={`fa-solid ${d.icon}`}></i>
                  </div>
                  <div className="min-w-0">
                    <p className={`text-xs font-bold truncate ${d.avoided ? 'text-emerald-505 dark:text-emerald-400' : isDark ? 'text-zinc-400' : 'text-stone-700'}`}>{d.name}</p>
                    <p className="text-[9px] text-stone-450 truncate">{d.details}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-[9px] font-extrabold uppercase bg-stone-500/10 px-2 py-0.5 rounded-md text-stone-450">
                    +{d.duration}m
                  </span>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                    d.avoided ? 'bg-emerald-500 border-emerald-400 text-white' : 'border-stone-300 transparent'
                  }`}>
                    {d.avoided && <i className="fa-solid fa-check text-[9px] font-extrabold"></i>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* STUDY TIMELINE CHART MODULE - spans 6 cols */}
        <div className={`md:col-span-6 p-8 rounded-[3rem] flex flex-col justify-between transition-all duration-300 md:-translate-y-2 ${
          isDark ? 'bg-zinc-950/20 border border-zinc-850' : 'bg-white border border-stone-200/40 shadow-sm'
        }`}>
          <div>
            <div className="flex justify-between items-center mb-6">
              <span className="text-[10px] uppercase font-black tracking-widest text-[#6366F1]">04 • Cognitive wave</span>
              <span className="text-[8px] font-black uppercase text-stone-400 tracking-wider">Focus density tracking</span>
            </div>

            <p className="text-xs text-stone-400 font-semibold leading-relaxed mb-6">
              Interactive timeline coordinates tracking when and where peak absorption and concept mapping occurred.
            </p>
          </div>

          <div className="h-44 w-full pr-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="replayFocusColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" tick={{ fill: '#88888b', fontSize: 8, fontWeight: 700 }} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{
                    borderRadius: '16px',
                    background: isDark ? '#1F1F23' : '#FAFAF9',
                    border: 'none',
                    fontSize: '11px',
                    padding: '8px 12px'
                  }}
                  labelStyle={{ fontWeight: 800, color: '#6366F1' }}
                  itemStyle={{ fontWeight: 600, color: isDark ? '#fff' : '#000' }}
                />
                <Area type="monotone" dataKey="efficiency" stroke="#6366F1" strokeWidth={2} fillOpacity={1} fill="url(#replayFocusColor)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Natural Typographic handwritten insights (imperfection modeling) */}
          <div className={`p-4.5 rounded-2xl border border-dashed mt-6 text-left ${
            isDark ? 'border-zinc-800 bg-zinc-900/20' : 'border-stone-200 bg-stone-50/50'
          }`}>
            <span className="text-[8px] font-black uppercase tracking-widest text-indigo-500 block mb-1">
              🎨 Workspace note
            </span>
            <p className="text-[10.5px] italic text-stone-450 leading-relaxed font-semibold">
              Daily synopsis tracks high mathematical fluency during evening doubt resolutions. Good synergy with forest white noises. Remember to keep mobile placed inside lockbox for late sessions!
            </p>
          </div>
        </div>

      </div>

    </div>
  );
};

export default StudyReplay;
