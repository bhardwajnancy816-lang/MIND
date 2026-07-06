import React, { useState, useEffect, useRef } from 'react';
import { ThemeMode } from '../types';

interface FocusRoomsProps {
  theme: ThemeMode;
}

interface RoomPeer {
  id: string;
  name: string;
  avatar: string;
  status: string;
  focusMinutes: number;
}

interface RoomMessage {
  sender: string;
  text: string;
  time: string;
}

interface StudyRoom {
  id: string;
  name: string;
  description: string;
  onlineCount: number;
  icon: string;
  bgGradient: string;
  suggestedGoal: string;
  subjectStream: string;
}

const COMMON_ROOM: StudyRoom = {
  id: 'common-orbit-sanctum',
  name: 'MindOrbit Shared Study Sanctum',
  description: 'The unified silent workspace for deep academic discipline. Studied by aspirants across the world with ultimate quiet and pure, unhindered flow.',
  onlineCount: 3942,
  icon: 'fa-globe-americas',
  bgGradient: 'from-indigo-655/25 to-violet-650/15',
  suggestedGoal: 'Study silently, draft textbook revisions, solve critical weak topics, or complete study planners.',
  subjectStream: 'Global Co-Working'
};

const PEERS_POOL: Omit<RoomPeer, 'id' | 'focusMinutes'>[] = [
  { name: 'Rohan Sharma', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=120&q=80', status: '✍️ Solving Maths PYQs' },
  { name: 'Simran Jolly', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80', status: '📖 Summarizing Organic Rxns' },
  { name: 'Ayaan Malik', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80', status: '🧬 Reviewing Plant Anat' },
  { name: 'Diana Penty', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=120&q=80', status: '✍️ Current Affairs Essay' },
  { name: 'Kabir Batra', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80', status: '📐 Circle Theory practice' },
  { name: 'Elena Gilbert', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80', status: '⏱️ Pomodoro short break' },
  { name: 'Tenzing Norgay', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&q=80', status: '✍️ Drafted 5 History dates' }
];

const SILENT_MESSAGES_POOL = [
  "Bhai third integration PYQ solved, let's keep cooking!",
  "Pomodoro 2 complete. Staying fully silent, keep focusing everyone.",
  "Just read an amazing concept summary on the tutor, highly recommended.",
  "Going into 45-minute deep block. Phone is locked in the drawer.",
  "Streak unlocked! Unified study room is extremely focused today.",
  "Just checked off endocrine system biology questions on the checklist.",
  "Silent accountability is magic. I used to procrastinate so much before.",
  "Formula logs revised. Taking a 2 min water break then back to thermodynamics."
];

const FocusRooms: React.FC<FocusRoomsProps> = ({ theme }) => {
  const isDark = theme === 'dark';
  const [selectedRoom, setSelectedRoom] = useState<StudyRoom | null>(null);
  const [isJoined, setIsJoined] = useState(false);
  const [myGoal, setMyGoal] = useState('');
  const [mySavedGoal, setMySavedGoal] = useState('');
  const [timePassed, setTimePassed] = useState(0); // in seconds
  const [activePeers, setActivePeers] = useState<RoomPeer[]>([]);
  const [chatLog, setChatLog] = useState<RoomMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [soundscape, setSoundscape] = useState<'None' | 'Lofi' | 'Rain' | 'Forest'>('None');
  const [lockDurationMinutes, setLockDurationMinutes] = useState<number>(25);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const chatSimRef = useRef<NodeJS.Timeout | null>(null);
  const peersRef = useRef<NodeJS.Timeout | null>(null);

  // sound player simulation
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<any | null>(null);

  const playSuccessChime = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.8);
    } catch {}
  };

  const lockDurationSeconds = lockDurationMinutes * 60;
  const isTimeComplete = timePassed >= lockDurationSeconds;

  // Sync Timer finish chime plus update System message
  useEffect(() => {
    if (isJoined && timePassed === lockDurationSeconds && lockDurationSeconds > 0) {
      playSuccessChime();
      setChatLog(prev => [
        ...prev,
        { sender: 'System Orbit', text: '🏆 Incredible! You fully completed your pledged Lock-In concentration blocks. The exit console is now unlocked! Feel free to checkout or continue studying.', time: 'Now' }
      ]);
    }
  }, [timePassed, isJoined, lockDurationSeconds]);

  // Handle soundscapes (ambient synthesis in-app!)
  useEffect(() => {
    if (soundscape !== 'None') {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextClass) return;
        const ctx = new AudioContextClass();
        audioContextRef.current = ctx;

        // Custom organic ambient noise synthesis
        if (soundscape === 'Rain') {
          const bufferSize = 2 * ctx.sampleRate;
          const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
          const output = noiseBuffer.getChannelData(0);
          let lastOut = 0.0;
          for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            output[i] = (lastOut * 0.99 + white * 0.01);
            lastOut = output[i];
          }
          const whiteNoise = ctx.createBufferSource();
          whiteNoise.buffer = noiseBuffer;
          whiteNoise.loop = true;

          const filter = ctx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.value = 650;

          whiteNoise.connect(filter);
          filter.connect(ctx.destination);
          whiteNoise.start();
          (audioSourceRef.current as any) = whiteNoise;
        } else if (soundscape === 'Lofi') {
          const osc1 = ctx.createOscillator();
          const gainNode = ctx.createGain();
          osc1.type = 'sine';
          osc1.frequency.value = 110; // A2 note
          gainNode.gain.setValueAtTime(0.06, ctx.currentTime);
          
          osc1.connect(gainNode);
          gainNode.connect(ctx.destination);
          osc1.start();
          (audioSourceRef.current as any) = osc1;
        } else if (soundscape === 'Forest') {
          const bufferSize = 2 * ctx.sampleRate;
          const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
          const output = noiseBuffer.getChannelData(0);
          for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
          }
          const source = ctx.createBufferSource();
          source.buffer = noiseBuffer;
          source.loop = true;

          const filter = ctx.createBiquadFilter();
          filter.type = 'bandpass';
          filter.frequency.value = 400;
          filter.Q.value = 0.4;

          source.connect(filter);
          filter.connect(ctx.destination);
          source.start();
          (audioSourceRef.current as any) = source;
        }
      } catch (err) {
        console.warn("Calming synthesizer had trouble launching in browser sandbox", err);
      }
    }

    return () => {
      if (audioSourceRef.current) {
        try {
          (audioSourceRef.current as any).stop();
        } catch {}
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, [soundscape]);

  const bootstrapSimulatedPeers = () => {
    const numPeers = 5 + Math.floor(Math.random() * 4);
    const shuffledPool = [...PEERS_POOL].sort(() => 0.5 - Math.random());
    const initialPeers: RoomPeer[] = Array.from({ length: numPeers }).map((_, i) => ({
      id: `peer-${i}`,
      name: shuffledPool[i]?.name || 'Fellow Orbit',
      avatar: shuffledPool[i]?.avatar || '',
      status: shuffledPool[i]?.status || '✍️ Studying silently in Shared Room',
      focusMinutes: 10 + Math.floor(Math.random() * 60)
    }));
    setActivePeers(initialPeers);

    setChatLog([
      { sender: 'System Orbit', text: `You entered the Shared Sanctum. Complete silent lock-in study accountability engaged.`, time: 'Now' },
      { sender: initialPeers[0].name, text: "Bhai log, lets keep this room absolutely quiet! High-focussing block.", time: '4m ago' },
      { sender: initialPeers[1].name, text: "Locking in for my session now. Mobile phone placed in other room.", time: '2m ago' }
    ]);

    // Simulation intervals: peers update focus session or send periodic silent chat updates
    chatSimRef.current = setInterval(() => {
      const randomPeer = initialPeers[Math.floor(Math.random() * initialPeers.length)];
      const randomMsgText = SILENT_MESSAGES_POOL[Math.floor(Math.random() * SILENT_MESSAGES_POOL.length)];
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      setChatLog(prev => [
        ...prev,
        { sender: randomPeer.name, text: randomMsgText, time: timeStr }
      ]);
    }, 15050);

    // Increment Peer minutes periodically
    peersRef.current = setInterval(() => {
      setActivePeers(prev => prev.map(p => {
        if (Math.random() > 0.65) {
          return { ...p, focusMinutes: p.focusMinutes + 1 };
        }
        return p;
      }));
    }, 45000);
  };

  // Check persistent lock-in state on mount
  useEffect(() => {
    const lockUntilText = localStorage.getItem('mindorbit_focus_lock_until');
    const startTimeText = localStorage.getItem('mindorbit_focus_start_time');
    const savedGoal = localStorage.getItem('mindorbit_focus_goal');
    const savedDurationMins = localStorage.getItem('mindorbit_focus_duration_mins');
    
    if (lockUntilText && startTimeText) {
      const lockUntil = Number(lockUntilText);
      const startTime = Number(startTimeText);
      const durationMins = savedDurationMins ? Number(savedDurationMins) : 25;
      
      if (lockUntil > Date.now()) {
        setSelectedRoom(COMMON_ROOM);
        setMySavedGoal(savedGoal || COMMON_ROOM.suggestedGoal);
        setLockDurationMinutes(durationMins);
        setIsJoined(true);
        
        const elapsed = Math.max(0, Math.floor((Date.now() - startTime) / 1000));
        setTimePassed(elapsed);
        
        bootstrapSimulatedPeers();
        
        // Timer Interval
        timerRef.current = setInterval(() => {
          setTimePassed(prev => prev + 1);
        }, 1000);
      } else {
        // clear expired lock
        localStorage.removeItem('mindorbit_focus_lock_until');
        localStorage.removeItem('mindorbit_focus_start_time');
        localStorage.removeItem('mindorbit_focus_goal');
        localStorage.removeItem('mindorbit_focus_duration_mins');
      }
    }
  }, []);

  const handleJoinRoom = () => {
    if (lockDurationMinutes <= 0 || isNaN(lockDurationMinutes)) {
      alert("Please enter a valid target focus duration in minutes.");
      return;
    }

    const goalValue = myGoal.trim() || COMMON_ROOM.suggestedGoal;
    setMySavedGoal(goalValue);
    setSelectedRoom(COMMON_ROOM);
    setIsJoined(true);
    setTimePassed(0);

    const startTime = Date.now();
    const lockUntil = startTime + lockDurationMinutes * 60 * 1050; // a little padding
    
    localStorage.setItem('mindorbit_focus_lock_until', String(lockUntil));
    localStorage.setItem('mindorbit_focus_start_time', String(startTime));
    localStorage.setItem('mindorbit_focus_goal', goalValue);
    localStorage.setItem('mindorbit_focus_duration_mins', String(lockDurationMinutes));

    bootstrapSimulatedPeers();

    timerRef.current = setInterval(() => {
      setTimePassed(prev => prev + 1);
    }, 1000);
  };

  const handleLeaveRoom = () => {
    const lockUntilText = localStorage.getItem('mindorbit_focus_lock_until');
    if (lockUntilText) {
      const lockUntil = Number(lockUntilText);
      if (lockUntil > Date.now()) {
        const remaining = Math.max(0, Math.ceil((lockUntil - Date.now()) / 1000));
        const mins = Math.floor(remaining / 60);
        const secs = remaining % 60;
        alert(`🔒 LOCK-IN ACTIVE: You pledged to study with ultimate focus and cannot leave the Study Room until your countdown is done!\n\nTime Remaining: ${mins}m ${secs}s.\nLet's respect our pledge!`);
        return;
      }
    }

    if (timerRef.current) clearInterval(timerRef.current);
    if (chatSimRef.current) clearInterval(chatSimRef.current);
    if (peersRef.current) clearInterval(peersRef.current);
    
    localStorage.removeItem('mindorbit_focus_lock_until');
    localStorage.removeItem('mindorbit_focus_start_time');
    localStorage.removeItem('mindorbit_focus_goal');
    localStorage.removeItem('mindorbit_focus_duration_mins');

    setIsJoined(false);
    setSelectedRoom(null);
    setMyGoal('');
    setMySavedGoal('');
    setTimePassed(0);
    setSoundscape('None');
  };

  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setChatLog(prev => [
      ...prev,
      { sender: 'You (Pledged Anchor)', text: chatInput, time: timeStr }
    ]);
    setChatInput('');
  };

  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return [
      hrs > 0 ? String(hrs).padStart(2, '0') : null,
      String(mins).padStart(2, '0'),
      String(secs).padStart(2, '0')
    ].filter(Boolean).join(':');
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (chatSimRef.current) clearInterval(chatSimRef.current);
      if (peersRef.current) clearInterval(peersRef.current);
    };
  }, []);

  const progressPercent = Math.min(100, Math.floor((timePassed / lockDurationSeconds) * 100));
  const timeRemainingSeconds = Math.max(0, lockDurationSeconds - timePassed);
  const remainingMinutes = Math.floor(timeRemainingSeconds / 60);
  const remainingSeconds = timeRemainingSeconds % 60;

  return (
    <div className="space-y-10 animate-fadeIn pb-24 max-w-6xl mx-auto">
      
      {/* Upper header summary visual style guidelines */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-stone-200/20 pb-8">
        <div>
          <span className="px-3.5 py-1 text-[8px] font-black uppercase tracking-widest text-[#6366F1] bg-[#6366F1]/10 rounded-full border border-[#6366F1]/15">
            Academic Locker Grid
          </span>
          <h2 className={`text-4xl font-extrabold tracking-tight mt-2 ${isDark ? 'text-zinc-100' : 'text-stone-900'}`}>
            Focus <span className="bg-gradient-to-r from-red-500 via-amber-500 to-indigo-500 bg-clip-text text-transparent animate-pulse">Study Sanctum</span>
          </h2>
          <p className="text-stone-500 font-medium text-sm mt-1">
            Silence is the ultimate weapon of elite students. Study inside our unified lock-in space rules with peer accountability.
          </p>
        </div>

        {isJoined && selectedRoom && (
          <button
            id="leave-focus-room-btn"
            onClick={handleLeaveRoom}
            disabled={!isTimeComplete}
            className={`px-6 py-4 rounded-xl font-bold text-[10px] uppercase tracking-wider shadow-md transition-all border shrink-0 ${
              !isTimeComplete
                ? 'bg-zinc-800 border-zinc-700/60 text-stone-500 cursor-not-allowed select-none opacity-80'
                : 'bg-emerald-600 hover:bg-emerald-700 border-emerald-500 text-white cursor-pointer active:scale-95'
            }`}
          >
            {!isTimeComplete ? (
              <span className="flex items-center gap-2">
                <i className="fa-solid fa-lock text-rose-500"></i> Locked Inside study block ({remainingMinutes}m {remainingSeconds}s)
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <i className="fa-solid fa-lock-open text-emerald-400"></i> Leave Sanctum (Goal Cleared)
              </span>
            )}
          </button>
        )}
      </header>

      {/* VIEW 1: ENTER THE UNIFIED ROOM & CONFIGURE PLEDGE */}
      {!isJoined ? (
        <div className="max-w-3xl mx-auto space-y-8 animate-fadeIn">
          
          <div className={`p-8 rounded-[2.5rem] border ${
            isDark 
              ? 'bg-gradient-to-br from-zinc-950/40 to-zinc-900/15 border-zinc-850' 
              : 'bg-white border-stone-200 shadow-xl'
          } relative overflow-hidden`}>
            
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-indigo-650/15 text-indigo-505 bg-indigo-500 rounded-2xl flex items-center justify-center text-xl shrink-0 border border-indigo-500/10">
                <i className="fa-solid fa-globe"></i>
              </div>
              <div>
                <h3 className={`text-xl font-black tracking-tight ${isDark ? 'text-white' : 'text-stone-900'}`}>
                  Shared Room Accountability
                </h3>
                <p className="text-[10px] uppercase tracking-wider font-extrabold text-[#6366F1] mt-0.5 animate-pulse">
                  1 Master space • {COMMON_ROOM.onlineCount} Students online studying
                </p>
              </div>
            </div>

            <p className="text-xs text-stone-550 dark:text-zinc-400 leading-relaxed font-semibold">
              Instead of scattering across separate stream environments, all MindOrbit users collaborate together in the <span className="text-[#6366F1] font-bold">Shared Study Sanctum</span>. High-performance peer pressure helps block critical distraction fields in the brain.
            </p>

            <div className="mt-8 space-y-6">
              
              {/* Option A: Study Goal Input */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-stone-400 tracking-wider block">1. Declare Your Study Goal</label>
                <input
                  id="session-goal-input"
                  type="text"
                  placeholder="e.g. Solve physics thermodynamics PYQs or draft boards essay layout"
                  value={myGoal}
                  onChange={e => setMyGoal(e.target.value)}
                  className={`w-full py-3.5 px-5 rounded-xl text-xs font-semibold outline-none border transition-all ${
                    isDark 
                      ? 'bg-zinc-950/50 border-zinc-800 text-white focus:border-indigo-500' 
                      : 'bg-stone-50 border-stone-200 text-stone-900 focus:border-stone-400 focus:bg-white'
                  }`}
                />
              </div>

              {/* Option B: Lock-In Duration Presets */}
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-stone-400 tracking-wider block">2. Pledge Lock-In Duration (Minutes)</label>
                
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {([5, 15, 25, 45, 60, 90] as const).map(mins => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setLockDurationMinutes(mins)}
                      className={`py-3.5 rounded-xl border text-[11px] font-black tracking-tight transition-all cursor-pointer ${
                        lockDurationMinutes === mins
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-650/15'
                          : isDark
                            ? 'bg-zinc-950/30 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                            : 'bg-stone-50 border-stone-200 text-stone-500 hover:bg-stone-100'
                      }`}
                    >
                      {mins} Min
                    </button>
                  ))}
                </div>

                {/* Custom minutes setter */}
                <div className="flex items-center gap-3 bg-indigo-500/[0.02] p-3 rounded-xl border border-indigo-500/5 mt-2">
                  <span className="text-[10px] font-bold text-stone-400 uppercase shrink-0">Or enter custom minutes:</span>
                  <input
                    type="number"
                    min="1"
                    max="360"
                    value={lockDurationMinutes}
                    onChange={e => setLockDurationMinutes(Math.max(1, parseInt(e.target.value, 10) || 0))}
                    className={`w-20 py-2 px-3 rounded-lg text-xs font-bold font-mono outline-none border text-center transition-all ${
                      isDark 
                        ? 'bg-zinc-950/80 border-zinc-800 text-indigo-400' 
                        : 'bg-white border-stone-250 text-indigo-650'
                    }`}
                  />
                </div>
              </div>

              {/* Strict Lock Banner Alert */}
              <div className={`p-5 rounded-2xl border ${
                isDark 
                  ? 'bg-red-950/10 border-red-900/30 text-rose-400' 
                  : 'bg-rose-50 border-rose-150 text-rose-800 shadow-sm'
              } flex gap-4`}>
                <div className="text-xl text-red-500 shrink-0 mt-0.5">
                  <i className="fa-solid fa-triangle-exclamation"></i>
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider">Academic Honor Constraint Rule</h4>
                  <p className="text-[11px] leading-relaxed mt-1 font-semibold opacity-90">
                    Once you click <span className="underline font-bold">Pledge & Enter Sanctum</span> below, your exit console holds. You will NOT be permitted to leave this study space or navigate away to other sidebar options until your selected <span className="font-extrabold">{lockDurationMinutes}m focus countdown</span> reaches zero.
                  </p>
                </div>
              </div>

              {/* Pledge and Enter trigger */}
              <button
                id="enter-common-sanctum-btn"
                onClick={handleJoinRoom}
                className="w-full py-4 bg-gradient-to-r from-red-650 via-[#6366F1] to-indigo-600 text-white rounded-xl font-bold uppercase tracking-widest text-[11px] shadow-lg shadow-indigo-600/15 cursor-pointer hover:scale-[1.01] active:scale-98 transition-all"
              >
                Pledge Focus & Enter Sanctum <i className="fa-solid fa-lock mr-1.5 ml-2"></i>
              </button>

            </div>

          </div>

        </div>
      ) : (
        /* VIEW 2: ACTIVE UNIFIED ROOM FOCUS SPACE */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fadeIn">
          
          {/* Main Focus Clock & Sound Control Box */}
          <div className="lg:col-span-2 space-y-8">
            <div className={`p-8 rounded-[2.5rem] border relative overflow-hidden ${isDark ? 'bg-zinc-950/30 border-zinc-850' : 'bg-white border-stone-200/50 shadow-xl'}`}>
              
              <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 relative z-10">
                <div className="space-y-1">
                  <span className="text-[8px] font-black uppercase tracking-widest text-rose-500 bg-rose-550/10 p-1 px-3.5 rounded-full border border-rose-500/10 flex items-center gap-1.5 w-fit">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span> Lock-in constraint active
                  </span>
                  <p className="text-[10px] uppercase font-bold text-stone-450 tracking-wider mt-2">ACCOUNTABILITY HARBOUR:</p>
                  <h3 className={`text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-stone-900'}`}>{selectedRoom?.name}</h3>
                </div>

                <div className="text-right">
                  <p className="text-[9px] font-black uppercase text-stone-400 tracking-wider">Session Stopwatch</p>
                  <p className="font-mono text-3xl font-extrabold text-[#6366F1] mt-1 tracking-tight">{formatTime(timePassed)}</p>
                </div>
              </div>

              {/* Progress Lock details */}
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-6 relative z-10">
                
                {/* Progress bar container */}
                <div className={`sm:col-span-2 p-5 rounded-[2rem] border ${isDark ? 'bg-zinc-90 w-full bg-zinc-900/40 border-zinc-800' : 'bg-stone-50 border-stone-150'} flex flex-col justify-center`}>
                  <div className="flex justify-between items-center mb-2.5">
                    <span className="text-[8px] font-black uppercase text-stone-400 tracking-wider">Locked Session Progress:</span>
                    <span className="text-xs font-mono font-black text-[#6366F1]">{progressPercent}% Clear</span>
                  </div>
                  
                  {/* Real dynamic progress sliding track */}
                  <div className="w-full h-3.5 bg-zinc-800 border border-zinc-700/35 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-red-500 via-amber-500 to-emerald-500 rounded-full transition-all duration-1000"
                      style={{ width: `${progressPercent}%` }}
                    ></div>
                  </div>

                  <p className="text-[9px] text-stone-400 font-bold mt-2.5 flex items-center gap-1.5">
                    {isTimeComplete ? (
                      <span className="text-emerald-500 flex items-center gap-1"><i className="fa-solid fa-circle-check"></i> Target time elapsed! Lock-In Cleared.</span>
                    ) : (
                      <span>Time remaining before unlock permission: <b className="font-mono text-[#6366F1]">{remainingMinutes}m {remainingSeconds}s</b></span>
                    )}
                  </p>
                </div>

                {/* Lock Status Visualizer Card */}
                <div className={`p-5 rounded-[2rem] border ${
                  isTimeComplete 
                    ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-500' 
                    : 'bg-red-500/5 border-red-500/20 text-rose-500'
                } flex flex-col items-center justify-center text-center`}>
                  
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg mb-2 ${
                    isTimeComplete ? 'bg-emerald-500/20 text-emerald-455 animate-bounce' : 'bg-red-500/25 text-red-500'
                  }`}>
                    <i className={`fa-solid ${isTimeComplete ? 'fa-lock-open' : 'fa-lock'}`}></i>
                  </div>
                  <span className="text-[8px] font-black uppercase tracking-wider block">Lock State</span>
                  <p className="text-[11px] font-black tracking-tight uppercase tracking-wider mt-0.5">
                    {isTimeComplete ? "UNLOCKED SEAT" : "LOCKED FOCUS ACTIVE"}
                  </p>
                </div>

              </div>

              {/* Goal Anchor status details */}
              <div className={`p-4 rounded-xl border mt-6 text-[11px] font-semibold ${isDark ? 'bg-zinc-900/30 border-zinc-850 text-zinc-350' : 'bg-stone-50 border-stone-150 text-stone-700'}`}>
                <span className="font-extrabold uppercase text-[7.5px] text-stone-400 tracking-wider block mb-1">Pledged Study Objective:</span>
                " {mySavedGoal} "
              </div>

              {/* Tactical soundscape sliders */}
              <div className="mt-8 border-t border-stone-100 dark:border-zinc-850 pt-6">
                <h5 className={`text-xs font-black uppercase tracking-widest mb-4 flex items-center gap-1.5 ${isDark ? 'text-zinc-300' : 'text-stone-850'}`}>
                  <i className="fa-solid fa-music text-indigo-500"></i> Local Calming Ambient Synthesizer (Concentration Loops)
                </h5>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {(['None', 'Lofi', 'Rain', 'Forest'] as const).map(sound => (
                    <button
                      key={sound}
                      onClick={() => setSoundscape(sound)}
                      className={`py-3.5 px-4 rounded-xl border text-[9.5px] font-black uppercase tracking-wider transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                        soundscape === sound
                          ? 'bg-indigo-650 border-indigo-650 text-white shadow-lg'
                          : isDark
                            ? 'bg-zinc-90 w-full hover:border-[#6366F1]/30 hover:text-white border-zinc-800 text-zinc-400'
                            : 'bg-stone-50 border-stone-200 text-stone-500 hover:bg-stone-100'
                      }`}
                    >
                      <i className={`fa-solid ${
                        sound === 'None' ? 'fa-volume-mute' : 
                        sound === 'Lofi' ? 'fa-guitar' :
                        sound === 'Rain' ? 'fa-cloud-showers-heavy' : 'fa-tree'
                      }`}></i>
                      <span>{sound}</span>
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Silent Goal Posting Chat Box */}
            <div className={`p-8 rounded-[2.5rem] border ${isDark ? 'bg-zinc-950/30 border-zinc-850' : 'bg-white border-stone-200/50 shadow-xl'} space-y-6`}>
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 bg-indigo-500/15 text-indigo-500 rounded-xl flex items-center justify-center shrink-0 border border-indigo-500/10">
                  <i className="fa-solid fa-comments"></i>
                </div>
                <div>
                  <h4 className={`text-sm font-black tracking-tight ${isDark ? 'text-white' : 'text-stone-900'}`}>Shared Room Chat Logs (Silent Accountability)</h4>
                  <p className="text-xs text-stone-500 mt-1 leading-normal font-semibold">Post progress updates, celebrate focused targets, or motivate peers also locked inside the study floor.</p>
                </div>
              </div>

              {/* Chat Stream container */}
              <div className={`h-[280px] overflow-y-auto p-4 rounded-2xl border flex flex-col space-y-4 custom-scrollbar ${isDark ? 'bg-zinc-950/60 border-zinc-850/80 text-zinc-200' : 'bg-[#FAFAF9] border-stone-150 text-stone-800'}`}>
                {chatLog.map((chat, index) => {
                  const isSystem = chat.sender === 'System Orbit';
                  const isMe = chat.sender.startsWith('You');
                  return (
                    <div key={index} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <div className={`text-[9px] font-black uppercase tracking-wider mb-0.5 ${
                        isSystem ? 'text-[#6366F1]' : isMe ? 'text-indigo-400' : 'text-stone-450'
                      }`}>
                        {chat.sender} • {chat.time}
                      </div>
                      <div className={`text-xs px-4 py-2.5 rounded-2xl font-semibold max-w-[85%] ${
                        isSystem 
                          ? 'bg-indigo-500/5 text-slate-400 border border-indigo-500/10 italic text-[11px]' 
                          : isMe 
                            ? 'bg-indigo-650 text-white rounded-tr-none' 
                            : `${isDark ? 'bg-zinc-900 text-zinc-300 border border-zinc-800' : 'bg-white text-stone-700 border border-stone-200 shadow-sm'} rounded-tl-none`
                      }`}>
                        {chat.text}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Send controls */}
              <div className="flex gap-2.5">
                <input
                  id="chat-field-input"
                  type="text"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSendChat()}
                  placeholder="Post silent update (e.g. Cleared wave optics theory, keeping locked in!...)"
                  className={`flex-1 py-3 px-4 rounded-xl text-xs font-semibold outline-none border transition-all ${
                    isDark 
                      ? 'bg-zinc-950/40 border-zinc-850 text-white focus:border-indigo-500' 
                      : 'bg-white border-stone-250 text-stone-900 focus:border-stone-300'
                  }`}
                />
                <button
                  id="send-chat-button"
                  onClick={handleSendChat}
                  className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold uppercase tracking-wider text-[9px] hover:scale-102 transition-all cursor-pointer shadow-md active:scale-95"
                >
                  Post Progress
                </button>
              </div>
            </div>

          </div>

          {/* Sidebar Area: Live Peer Roster list */}
          <div className="space-y-8">
            <div className={`p-8 rounded-[2.5rem] border ${isDark ? 'bg-zinc-950/30 border-zinc-850' : 'bg-white border-stone-200/50 shadow-xl'}`}>
              <h4 className={`text-sm font-black uppercase tracking-wider border-b pb-4 flex items-center justify-between ${isDark ? 'border-zinc-850 text-zinc-300' : 'border-stone-150 text-stone-950'}`}>
                <span>Accountability Peers ({activePeers.length + 1})</span>
                <span className="text-[10px] font-black text-emerald-500 tracking-tight flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping"></span> Live Floor
                </span>
              </h4>

              <div className="space-y-5.5 mt-6">
                
                {/* Active Personal Peer Line */}
                <div className="flex items-center gap-3 bg-indigo-500/[0.03] p-3 rounded-2xl border border-indigo-500/10">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-xl bg-indigo-650 font-extrabold flex items-center justify-center text-[10px] shadow-md uppercase text-white">
                      YOU
                    </div>
                    <span className="absolute bottom-[-1.5px] right-[-1.5px] w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white dark:border-zinc-950"></span>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className={`text-xs font-black truncate ${isDark ? 'text-zinc-150' : 'text-stone-950'}`}>My Seat active</p>
                    <p className="text-[10px] text-indigo-505 bg-indigo-500/5 px-2 py-0.5 rounded-lg text-indigo-500 truncate font-semibold">🎯 Goal: {mySavedGoal}</p>
                  </div>
                </div>

                {/* Fellow study buddies list */}
                {activePeers.map(peer => (
                  <div
                    key={peer.id}
                    className="flex items-center gap-3 group transition-transform duration-350"
                  >
                    <div className="relative">
                      {peer.avatar ? (
                        <img
                          src={peer.avatar}
                          alt={peer.name}
                          className="w-10 h-10 rounded-xl object-cover border border-stone-200 dark:border-zinc-800"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-550 border border-purple-500/10 font-bold flex items-center justify-center text-sm-semibold">
                          {peer.name.charAt(0)}
                        </div>
                      )}
                      <span className="absolute bottom-[-1.5px] right-[-1.5px] w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white dark:border-zinc-950"></span>
                    </div>

                    <div className="flex-1 overflow-hidden">
                      <div className="flex justify-between items-center gap-2">
                        <p className={`text-xs font-black leading-none truncate ${isDark ? 'text-zinc-150' : 'text-stone-900'}`}>{peer.name}</p>
                        <span className="text-[8px] font-mono font-bold text-stone-450 shrink-0">{peer.focusMinutes}m lock</span>
                      </div>
                      <p className="text-[10px] text-stone-500 leading-normal truncate font-bold mt-0.5">{peer.status}</p>
                    </div>
                  </div>
                ))}

              </div>
              
            </div>
          </div>

        </div>
      )}

    </div>
  );
};

export default FocusRooms;
