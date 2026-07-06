import React, { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, AreaChart, Area } from 'recharts';
import { Subject, Note, Doubt, ThemeMode, Badge, Reminder, UserProfile } from '../types';

interface DashboardProps {
  subjects: Subject[];
  notes: Note[];
  doubts: Doubt[];
  theme: ThemeMode;
  badges: Badge[];
  studyStreak: number;
  onSetStudyStreak: React.Dispatch<React.SetStateAction<number>>;
  onUnlockBadge: (id: string) => void;
  isOffline?: boolean;
  onNavigate?: (mode: string) => void;
  reminders?: Reminder[];
  userProfile?: UserProfile | null;
  onSwitchStudyMode?: (toIndividual: boolean, newProfile?: UserProfile) => void;
}

type DashboardAtmosphere = 'Ordinary' | 'Exams' | 'Holidays' | 'Low Productivity';

interface DistractionItem {
  id: string;
  name: string;
  duration: number; // in mins
  details: string;
  avoided: boolean;
  icon: string;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  subjects, 
  notes, 
  doubts, 
  theme, 
  badges, 
  studyStreak, 
  onSetStudyStreak,
  onUnlockBadge,
  isOffline,
  onNavigate,
  reminders = [],
  userProfile = null,
  onSwitchStudyMode
}) => {
  const isDark = theme === 'dark';
  const [activeTab, setActiveTab] = useState<'overview' | 'replay'>('overview');
  const [atmosphere, setAtmosphere] = useState<DashboardAtmosphere>('Ordinary');
  const [userMood, setUserMood] = useState<'ordinary' | 'tired' | 'energetic' | 'anxious'>('ordinary');
  const [activeDay, setActiveDay] = useState<'today' | 'yesterday'>('today');

  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [editClassLevel, setEditClassLevel] = useState(userProfile?.classLevel || 'Class 10');
  const [editCourse, setEditCourse] = useState(userProfile?.course || 'General');
  const [editBoard, setEditBoard] = useState(userProfile?.boardOrUniversity || 'CBSE');
  const [editSemester, setEditSemester] = useState(userProfile?.semester || 'N/A');

  // Hardcoded distraction factors for Study Replay tab
  const [distractions, setDistractions] = useState<DistractionItem[]>([
    { id: 'dst-1', name: 'Mobile phone lock box', duration: 120, details: 'Kept device locked in remote terminal', avoided: true, icon: 'fa-mobile-screen-button' },
    { id: 'dst-2', name: 'Social tab restriction', duration: 45, details: 'Blocked browser access to Youtube & Discord', avoided: true, icon: 'fa-window-maximize' },
    { id: 'dst-3', name: 'DND Focus Sanctuary mode', duration: 90, details: 'Muted notifications across all workstations', avoided: true, icon: 'fa-bell-slash' },
    { id: 'dst-4', name: 'Cosmic Rain Soundscape active', duration: 60, details: 'Maintained auditory envelope of focus rain', avoided: false, icon: 'fa-cloud-rain' }
  ]);

  const toggleDistraction = (id: string) => {
    setDistractions(prev => prev.map(d => d.id === id ? { ...d, avoided: !d.avoided } : d));
  };

  // Syllabus completed counts
  const totalTopics = subjects.reduce((acc, s) => acc + s.topics.length, 0);
  const completedTopics = subjects.reduce((acc, s) => acc + s.topics.filter(t => t.completed).length, 0);
  const completionPercentage = Math.round((completedTopics / (totalTopics || 1)) * 100) || 0;

  // Resolved doubts count
  const resolvedCount = doubts.filter(d => d.resolved).length;

  // Study Replay computations
  const activeFocusMinutes = useMemo(() => {
    const baseMins = reminders.reduce((acc, rem) => {
      const pomCount = rem.completedPomodoros || 0;
      return acc + (pomCount * 25);
    }, 0);
    const simulatedBase = activeDay === 'today' ? 145 : 210;
    return baseMins + simulatedBase;
  }, [reminders, activeDay]);

  const hoursStudied = (activeFocusMinutes / 60).toFixed(1);

  const strongestSubject = useMemo(() => {
    if (!subjects || subjects.length === 0) return { name: 'General Science', masteredCount: 1, classLevel: 'Grade 12' };
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
    return best || { name: 'General Science', score: 3, classLevel: 'Grade 12' };
  }, [subjects]);

  const totalDistractionsAvoidedMins = useMemo(() => {
    return distractions.filter(d => d.avoided).reduce((acc, curr) => acc + curr.duration, 0);
  }, [distractions]);

  const timelineData = useMemo(() => {
    const offsetFactor = Math.max(0.5, totalDistractionsAvoidedMins / 315);
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
        { time: '05:30 PM', efficiency: Math.round(80 * offsetFactor), tag: 'Quantum thermodynamics' },
        { time: '08:00 PM', efficiency: Math.round(100 * offsetFactor), tag: 'Ultimate review' },
        { time: '11:00 PM', efficiency: 25, tag: 'Wind-down recap' }
      ];
    }
  }, [activeDay, totalDistractionsAvoidedMins]);

  // Chart Waveforms for Overview Dashboard
  const ordinaryActivity = [
    { day: 'Mon', Focus: 65, Intensity: 40 },
    { day: 'Tue', Focus: 85, Intensity: 70 },
    { day: 'Wed', Focus: 70, Intensity: 55 },
    { day: 'Thu', Focus: 90, Intensity: 82 },
    { day: 'Fri', Focus: 80, Intensity: 60 },
    { day: 'Sat', Focus: 50, Intensity: 35 },
    { day: 'Sun', Focus: 58, Intensity: 45 },
  ];

  const examActivity = [
    { day: 'Mon', Focus: 95, Intensity: 85 },
    { day: 'Tue', Focus: 98, Intensity: 92 },
    { day: 'Wed', Focus: 90, Intensity: 88 },
    { day: 'Thu', Focus: 100, Intensity: 95 },
    { day: 'Fri', Focus: 92, Intensity: 90 },
    { day: 'Sat', Focus: 85, Intensity: 80 },
    { day: 'Sun', Focus: 88, Intensity: 85 },
  ];

  const holidayActivity = [
    { day: 'Mon', Focus: 20, Intensity: 15 },
    { day: 'Tue', Focus: 35, Intensity: 25 },
    { day: 'Wed', Focus: 30, Intensity: 20 },
    { day: 'Thu', Focus: 45, Intensity: 35 },
    { day: 'Fri', Focus: 40, Intensity: 30 },
    { day: 'Sat', Focus: 15, Intensity: 10 },
    { day: 'Sun', Focus: 22, Intensity: 18 },
  ];

  const lowProductivityActivity = [
    { day: 'Mon', Focus: 40, Intensity: 30 },
    { day: 'Tue', Focus: 45, Intensity: 32 },
    { day: 'Wed', Focus: 38, Intensity: 28 },
    { day: 'Thu', Focus: 50, Intensity: 35 },
    { day: 'Fri', Focus: 46, Intensity: 34 },
    { day: 'Sat', Focus: 30, Intensity: 20 },
    { day: 'Sun', Focus: 34, Intensity: 25 },
  ];

  const getActivityData = () => {
    switch(atmosphere) {
      case 'Exams': return examActivity;
      case 'Holidays': return holidayActivity;
      case 'Low Productivity': return lowProductivityActivity;
      default: return ordinaryActivity;
    }
  };

  const getAtmosphereTitle = () => {
    switch(atmosphere) {
      case 'Exams': return { prefix: "Warp Speed", title: "Boards Season", desc: "Priority focus locks, high-intensity flashcards, and diagnostic mocks." };
      case 'Holidays': return { prefix: "Zen Lounge", title: "Cozy Holiday Mode", desc: "No stress! Spend 10 mins reviewing active habits or ambient notes." };
      case 'Low Productivity': return { prefix: "Safe Harbor", title: "Soft Recovery", desc: "Feeling slow? That's fine. Check off just one backlog concept today." };
      default: return { prefix: "My Oasis", title: "Workspace Core", desc: "A quiet summary of your active chapters, doubt resolution, and daily levels." };
    }
  };

  const currentMeta = getAtmosphereTitle();
  const pieData = [{ value: completedTopics }, { value: Math.max(0, totalTopics - completedTopics) }];
  const COLORS = ['#4F46E5', isDark ? '#27272A' : '#E5E7EB'];

  return (
    <div className="space-y-8 animate-fadeIn pb-24 max-w-6xl mx-auto text-left">
      
      {/* Handcrafted Header Vibe & Dual Navigation Tabs */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-stone-200/40 dark:border-zinc-800/50 pb-6">
        <div>
          <span className="px-3.5 py-1 text-[9px] font-extrabold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 rounded-full border border-indigo-500/15">
            {currentMeta.prefix}
          </span>
          <h2 className={`text-4xl font-extrabold tracking-tight mt-2 ${isDark ? 'text-zinc-100 font-sans' : 'text-stone-900'}`}>
            {activeTab === 'overview' ? currentMeta.title : 'Study Replay'}
          </h2>
          <p className="text-stone-500 dark:text-zinc-400 font-medium text-sm mt-1">
            {activeTab === 'overview' ? currentMeta.desc : 'Your daily breakthroughs, focus alignment, and distraction avoidance metrics.'}
          </p>
        </div>
        
        {/* Elite Sub-Tab Toggle */}
        <div className="flex items-center gap-4.5 self-start md:self-auto">
          <div className={`flex p-1 rounded-2xl border ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-stone-50 border-stone-200/50 shadow-sm'}`}>
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'overview' 
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-sm' 
                  : 'text-stone-400 hover:text-stone-600 dark:hover:text-zinc-300'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('replay')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'replay' 
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-sm' 
                  : 'text-stone-400 hover:text-stone-600 dark:hover:text-zinc-300'
              }`}
            >
              🍿 Study Replay
            </button>
          </div>
        </div>
      </header>

      {/* OFFLINE EMERGENCY BANNER */}
      {isOffline && (
        <div className="p-5 rounded-2xl bg-amber-500/[0.04] border border-amber-500/20 text-amber-500 flex items-center justify-between flex-wrap gap-4 text-left animate-slideDown">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-sm animate-pulse">
              <i className="fa-solid fa-satellite-dish"></i>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider leading-none">Emergency Offline Sanctuary Engaged</p>
              <p className="text-xs font-semibold mt-1 text-stone-500 dark:text-zinc-400">Your network telemetry is offline, but local notes, study lists, and focus alarms remain 100% functional.</p>
            </div>
          </div>
          <span className="hidden sm:inline-block px-3.5 py-1.5 bg-amber-500/10 rounded-xl text-[9px] font-extrabold uppercase tracking-widest border border-amber-500/15">
            Secure Local Sync
          </span>
        </div>
      )}

      {/* RENDER TAB CONTENT */}
      {activeTab === 'overview' ? (
        <>
          {/* OVERVIEW TAB CONTENT */}

          {/* ACADEMIC PROFILE & STUDY MODE SWITCHER CARD */}
          <section className={`p-6 lg:p-8 rounded-[2rem] border text-left space-y-6 ${
            isDark ? 'bg-zinc-950/40 border-zinc-800/80' : 'bg-white border-stone-200/50 shadow-sm'
          }`}>
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div className="space-y-2">
                <span className="px-3 py-1 text-[9px] font-extrabold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 rounded-full border border-indigo-500/15">
                  <i className="fa-solid fa-graduation-cap mr-1.5"></i> Active Academic Orbit
                </span>
                <h3 className={`text-2xl font-black tracking-tight ${isDark ? 'text-zinc-100' : 'text-stone-900'}`}>
                  {userProfile?.isIndividualStudy ? "Individual Study Orbit" : "Class-Based Learning Orbit"}
                </h3>
                <p className="text-stone-500 dark:text-zinc-400 text-xs font-semibold leading-relaxed max-w-xl">
                  {userProfile?.isIndividualStudy 
                    ? `Charted self-paced path to master special skills. Currently focused on: ${userProfile.selectedSubjects?.join(', ') || 'General studies'}.`
                    : `Syllabus aligned for ${userProfile?.classLevel || 'Class 10'} • ${userProfile?.course || 'General'} • ${userProfile?.boardOrUniversity || 'CBSE Board'} ${userProfile?.semester ? `• Semester ${userProfile.semester}` : ''}.`
                  }
                </p>
              </div>

              {/* Mode Swapper Button Group */}
              <div className="flex items-center gap-3 w-full lg:w-auto shrink-0 flex-wrap">
                <button
                  onClick={() => onSwitchStudyMode && onSwitchStudyMode(!userProfile?.isIndividualStudy)}
                  className={`px-4.5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 border ${
                    isDark 
                      ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800/80 hover:border-zinc-700' 
                      : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100/80'
                  }`}
                >
                  <i className="fa-solid fa-arrows-spin text-sm text-indigo-500"></i>
                  <span>Switch to {userProfile?.isIndividualStudy ? "Class-Based" : "Individual Study"}</span>
                </button>

                <button
                  onClick={() => {
                    setEditClassLevel(userProfile?.classLevel || 'Class 10');
                    setEditCourse(userProfile?.course || 'General');
                    setEditBoard(userProfile?.boardOrUniversity || 'CBSE');
                    setEditSemester(userProfile?.semester || 'N/A');
                    setShowEditProfileModal(true);
                  }}
                  className={`px-4.5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 text-white bg-gradient-to-r from-indigo-600 to-indigo-700 hover:brightness-110 shadow-sm`}
                >
                  <i className="fa-solid fa-sliders text-sm"></i>
                  <span>Adjust Profile</span>
                </button>
              </div>
            </div>

            {/* Profile Grid Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              <div className={`p-4 rounded-2xl border ${isDark ? 'bg-zinc-900/40 border-zinc-850' : 'bg-stone-50/50 border-stone-100'}`}>
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Learning Standard</p>
                <p className={`text-sm font-bold mt-1 ${isDark ? 'text-zinc-200' : 'text-stone-850'}`}>
                  {userProfile?.isIndividualStudy ? "Self-Directed" : userProfile?.classLevel}
                </p>
              </div>
              <div className={`p-4 rounded-2xl border ${isDark ? 'bg-zinc-900/40 border-zinc-850' : 'bg-stone-50/50 border-stone-100'}`}>
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Course / Stream</p>
                <p className={`text-sm font-bold mt-1 ${isDark ? 'text-zinc-200' : 'text-stone-850'}`}>
                  {userProfile?.isIndividualStudy ? "Specialist Skillset" : userProfile?.course}
                </p>
              </div>
              <div className={`p-4 rounded-2xl border ${isDark ? 'bg-zinc-900/40 border-zinc-850' : 'bg-stone-50/50 border-stone-100'}`}>
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Institution / Board</p>
                <p className={`text-sm font-bold mt-1 ${isDark ? 'text-zinc-200' : 'text-stone-850'}`}>
                  {userProfile?.isIndividualStudy ? "MindOrbit AI" : userProfile?.boardOrUniversity}
                </p>
              </div>
              <div className={`p-4 rounded-2xl border ${isDark ? 'bg-zinc-900/40 border-zinc-850' : 'bg-stone-50/50 border-stone-100'}`}>
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Active Subjects</p>
                <p className={`text-sm font-bold mt-1 ${isDark ? 'text-zinc-200' : 'text-stone-850'}`}>
                  {subjects.length} Loaded
                </p>
              </div>
            </div>
          </section>

          {/* EDIT PROFILE MODAL */}
          {showEditProfileModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className={`w-full max-w-lg rounded-3xl p-6 lg:p-8 border shadow-2xl animate-scaleUp text-left ${
                isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-100' : 'bg-white border-stone-200 text-stone-950'
              }`}>
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h4 className="text-lg font-black tracking-tight">Adjust Academic Target</h4>
                    <p className="text-xs text-stone-500 dark:text-zinc-400 mt-1">Recalibrate class syllabi alignment or self-directed learning goals.</p>
                  </div>
                  <button 
                    onClick={() => setShowEditProfileModal(false)}
                    className="w-8 h-8 rounded-full border border-stone-200 dark:border-zinc-800 flex items-center justify-center text-stone-400 hover:text-stone-600 dark:hover:text-zinc-300 cursor-pointer"
                  >
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-widest mb-1.5 text-stone-500 dark:text-zinc-400">Class / Grade</label>
                      <select
                        value={editClassLevel}
                        onChange={(e) => setEditClassLevel(e.target.value)}
                        className={`w-full p-3 rounded-xl text-xs font-semibold border ${
                          isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-200' : 'bg-white border-stone-200 text-stone-800'
                        }`}
                      >
                        <option value="Class 9">Class 9 (School)</option>
                        <option value="Class 10">Class 10 (School)</option>
                        <option value="Class 11">Class 11 (High School)</option>
                        <option value="Class 12">Class 12 (High School)</option>
                        <option value="B.Tech">B.Tech (College/Uni)</option>
                        <option value="B.Sc">B.Sc (College/Uni)</option>
                        <option value="MBA">MBA (Postgrad)</option>
                        <option value="MBBS">MBBS (Medical)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-widest mb-1.5 text-stone-500 dark:text-zinc-400">Course / Stream</label>
                      <select
                        value={editCourse}
                        onChange={(e) => setEditCourse(e.target.value)}
                        className={`w-full p-3 rounded-xl text-xs font-semibold border ${
                          isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-200' : 'bg-white border-stone-200 text-stone-800'
                        }`}
                      >
                        <option value="General">General / Elective</option>
                        <option value="Science">Science (PCM/PCB)</option>
                        <option value="Commerce">Commerce / Business</option>
                        <option value="Humanities">Humanities / Arts</option>
                        <option value="Computer Science">Computer Science / IT</option>
                        <option value="Management">Management Studies</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-widest mb-1.5 text-stone-500 dark:text-zinc-400">Board / University</label>
                      <input
                        type="text"
                        value={editBoard}
                        onChange={(e) => setEditBoard(e.target.value)}
                        className={`w-full p-3 rounded-xl text-xs font-semibold border ${
                          isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-200' : 'bg-white border-stone-200 text-stone-800'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-widest mb-1.5 text-stone-500 dark:text-zinc-400">Semester</label>
                      <select
                        value={editSemester}
                        onChange={(e) => setEditSemester(e.target.value)}
                        className={`w-full p-3 rounded-xl text-xs font-semibold border ${
                          isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-200' : 'bg-white border-stone-200 text-stone-800'
                        }`}
                      >
                        <option value="N/A">N/A</option>
                        <option value="Semester 1">Semester 1</option>
                        <option value="Semester 2">Semester 2</option>
                        <option value="Semester 3">Semester 3</option>
                        <option value="Semester 4">Semester 4</option>
                        <option value="Semester 5">Semester 5</option>
                        <option value="Semester 6">Semester 6</option>
                        <option value="Semester 7">Semester 7</option>
                        <option value="Semester 8">Semester 8</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-4 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowEditProfileModal(false)}
                      className={`flex-1 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider text-center border cursor-pointer ${
                        isDark ? 'border-zinc-800 text-zinc-400 hover:bg-zinc-900' : 'border-stone-200 text-stone-500 hover:bg-stone-50'
                      }`}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const newProfile: UserProfile = {
                          isIndividualStudy: false,
                          classLevel: editClassLevel,
                          course: editCourse,
                          boardOrUniversity: editBoard,
                          semester: editSemester === 'N/A' ? undefined : editSemester
                        };
                        onSwitchStudyMode && onSwitchStudyMode(false, newProfile);
                        setShowEditProfileModal(false);
                      }}
                      className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-bold text-xs uppercase tracking-wider text-center cursor-pointer hover:brightness-110"
                    >
                      Apply & Update
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ADAPTIVE STUDY RECOMMENDATIONS & SMART FILTERS */}
          <section className="space-y-6">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-6 bg-indigo-500 rounded-full"></div>
              <h4 className={`text-lg font-extrabold tracking-tight ${isDark ? 'text-zinc-100 font-sans' : 'text-stone-900'}`}>
                Adaptive Study Recommendations & Mock Practice
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* Card 1: Study Notes & Summaries */}
              <div className={`p-6 rounded-3xl border flex flex-col justify-between ${
                isDark ? 'bg-[#131315] border-zinc-850 hover:border-zinc-800' : 'bg-white border-stone-200/50 shadow-sm hover:shadow-md'
              } transition-all duration-300`}>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 text-sm">
                      <i className="fa-solid fa-file-invoice"></i>
                    </div>
                    <span className="text-[9px] font-extrabold uppercase tracking-widest text-indigo-500 bg-indigo-500/10 px-2.5 py-1 rounded-full">
                      High Yield Note
                    </span>
                  </div>
                  <div className="text-left space-y-1">
                    <p className={`text-sm font-bold ${isDark ? 'text-zinc-200' : 'text-stone-850'}`}>
                      {subjects[0]?.name || 'Workspace Setup'} Summary
                    </p>
                    <p className="text-xs text-stone-500 dark:text-zinc-400 font-medium leading-relaxed">
                      AI summarized quick-read cheat sheets, formula files, and bullet maps based on your {userProfile?.boardOrUniversity || 'MindOrbit'} guidelines.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => onNavigate && onNavigate('notes')}
                  className="mt-6 w-full py-2.5 rounded-xl border border-indigo-500/10 hover:bg-indigo-500/5 text-indigo-500 font-bold text-xs cursor-pointer transition-colors"
                >
                  Retrieve Active Notes
                </button>
              </div>

              {/* Card 2: Adaptive Practice Quizzes */}
              <div className={`p-6 rounded-3xl border flex flex-col justify-between ${
                isDark ? 'bg-[#131315] border-zinc-850 hover:border-zinc-800' : 'bg-white border-stone-200/50 shadow-sm hover:shadow-md'
              } transition-all duration-300`}>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 text-sm">
                      <i className="fa-solid fa-circle-question"></i>
                    </div>
                    <span className="text-[9px] font-extrabold uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                      Active Recall
                    </span>
                  </div>
                  <div className="text-left space-y-1">
                    <p className={`text-sm font-bold ${isDark ? 'text-zinc-200' : 'text-stone-850'}`}>
                      Adaptive Concept Quiz
                    </p>
                    <p className="text-xs text-stone-500 dark:text-zinc-400 font-medium leading-relaxed">
                      Auto-tailored MCQ checks to benchmark your recall. Adapts difficulty dynamically based on your previous answers.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => onNavigate && onNavigate('quizzes')}
                  className="mt-6 w-full py-2.5 rounded-xl border border-emerald-500/10 hover:bg-emerald-500/5 text-emerald-500 font-bold text-xs cursor-pointer transition-colors"
                >
                  Launch Diagnostic Quiz
                </button>
              </div>

              {/* Card 3: Board Mock Tests & PYQs */}
              <div className={`p-6 rounded-3xl border flex flex-col justify-between ${
                isDark ? 'bg-[#131315] border-zinc-850 hover:border-zinc-800' : 'bg-white border-stone-200/50 shadow-sm hover:shadow-md'
              } transition-all duration-300`}>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500 text-sm">
                      <i className="fa-solid fa-file-signature"></i>
                    </div>
                    <span className="text-[9px] font-extrabold uppercase tracking-widest text-purple-500 bg-purple-500/10 px-2.5 py-1 rounded-full">
                      Exam Prep
                    </span>
                  </div>
                  <div className="text-left space-y-1">
                    <p className={`text-sm font-bold ${isDark ? 'text-zinc-200' : 'text-stone-850'}`}>
                      Mocks & PYQs Hub
                    </p>
                    <p className="text-xs text-stone-500 dark:text-zinc-400 font-medium leading-relaxed">
                      Take authentic practice exam blueprints, board mock sheets, and past year question files for {userProfile?.boardOrUniversity || 'MindOrbit'}.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => onNavigate && onNavigate('quizzes')}
                  className="mt-6 w-full py-2.5 rounded-xl border border-purple-500/10 hover:bg-purple-500/5 text-purple-500 font-bold text-xs cursor-pointer transition-colors"
                >
                  Open PYQ Blueprints
                </button>
              </div>

            </div>
          </section>

          {/* AI CUSTOM LEARNING PATH ROADMAP - INDIVIDUAL STUDY MODE ONLY */}
          {userProfile?.isIndividualStudy && userProfile.customLearningPath && (
            <section className={`p-6 lg:p-8 rounded-[2rem] border text-left space-y-8 ${
              isDark ? 'bg-[#111113] border-zinc-850' : 'bg-white border-stone-200/50 shadow-sm'
            }`}>
              <div className="space-y-1.5">
                <span className="px-3 py-1 text-[9px] font-extrabold uppercase tracking-widest text-purple-600 dark:text-purple-400 bg-purple-500/10 rounded-full border border-purple-500/15">
                  ✨ Gemini GenAI Custom Study Path
                </span>
                <h4 className={`text-xl font-black tracking-tight ${isDark ? 'text-zinc-150' : 'text-stone-900'}`}>
                  {userProfile.customLearningPath.title}
                </h4>
                <p className="text-xs text-stone-500 dark:text-zinc-400 leading-relaxed font-semibold">
                  {userProfile.customLearningPath.overview}
                </p>
              </div>

              {/* Target Skills Tags */}
              <div className="flex flex-wrap gap-2 pt-1 border-t border-stone-200/40 dark:border-zinc-800/60 pt-4">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-stone-400 self-center mr-2">Target Skills:</p>
                {userProfile.customLearningPath.targetSkills.map((skill, sIdx) => (
                  <span 
                    key={sIdx}
                    className="px-3 py-1 bg-indigo-500/[0.06] border border-indigo-500/15 text-indigo-500 font-bold text-[10px] uppercase rounded-lg"
                  >
                    {skill}
                  </span>
                ))}
              </div>

              {/* Modules Roadmap Timeline */}
              <div className="relative border-l-2 border-indigo-500/20 ml-4 pl-6 space-y-8 py-2">
                {userProfile.customLearningPath.modules.map((mod, mIdx) => (
                  <div key={mIdx} className="relative group">
                    {/* Glowing circular node pin */}
                    <div className="absolute left-[-33px] top-1 w-4 h-4 rounded-full border-2 border-indigo-500 bg-zinc-900 flex items-center justify-center">
                      <div className="w-1.5. h-1.5. bg-indigo-500 rounded-full"></div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-3">
                        <h5 className={`text-sm font-extrabold ${isDark ? 'text-zinc-100' : 'text-stone-900'}`}>
                          {mod.moduleName}
                        </h5>
                        <span className="px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/15 text-indigo-500 font-extrabold text-[9px] uppercase tracking-wider rounded">
                          {mod.suggestedHours} Hours
                        </span>
                      </div>
                      
                      <p className="text-xs text-stone-500 dark:text-zinc-400 leading-relaxed font-semibold">
                        {mod.description}
                      </p>

                      {/* Subtopics sub-grid */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {mod.subtopics.map((sub, subIdx) => (
                          <span 
                            key={subIdx}
                            className="px-2 py-0.5 bg-zinc-500/10 text-stone-500 dark:text-zinc-400 font-medium text-[10px] rounded-md border border-stone-200/20 dark:border-zinc-800"
                          >
                            {sub}
                          </span>
                        ))}
                      </div>

                      {/* Learning activity suggestions */}
                      <div className="p-3 rounded-xl bg-indigo-500/[0.03] border border-indigo-500/10 flex items-start gap-2.5 text-xs text-stone-550 dark:text-zinc-400 font-medium">
                        <i className="fa-solid fa-graduation-cap text-indigo-500 mt-0.5"></i>
                        <p>
                          <strong className="text-indigo-500 font-bold">Primary Practice: </strong> 
                          {mod.learningActivity}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Milestones Target Progress Card */}
              <div className={`p-5 rounded-2xl border ${isDark ? 'bg-zinc-900/30 border-zinc-850' : 'bg-stone-50/50 border-stone-150'}`}>
                <p className="text-[10px] font-black uppercase tracking-wider text-stone-400">Roadmap Verification Milestones</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                  {userProfile.customLearningPath.milestones.map((mil, milIdx) => (
                    <div key={milIdx} className="p-3.5 rounded-xl bg-indigo-500/[0.02] border border-indigo-500/5 flex items-start gap-3">
                      <div className="w-6 h-6 rounded-lg bg-indigo-500/10 text-indigo-500 text-xs flex items-center justify-center shrink-0">
                        {milIdx + 1}
                      </div>
                      <div className="text-xs text-stone-500 dark:text-zinc-400">
                        <p className={`font-bold ${isDark ? 'text-zinc-200' : 'text-stone-850'}`}>{mil.target}</p>
                        <p className="mt-0.5 leading-relaxed font-medium">{mil.verificationTask}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Study Tips banner */}
              <div className="pt-4 border-t border-stone-200/40 dark:border-zinc-800/60 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <i className="fa-solid fa-lightbulb text-amber-500 mt-1"></i>
                  <div>
                    <p className="text-xs font-bold text-stone-500 dark:text-zinc-300">Generative Pacing Strategy</p>
                    <p className="text-[11px] text-stone-400 leading-relaxed mt-0.5">
                      {userProfile.customLearningPath.studyTips[0] || "Pace learning modules in 45-minute focus intervals with 5-minute active breaks."}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <i className="fa-solid fa-compass text-indigo-500 mt-1"></i>
                  <div>
                    <p className="text-xs font-bold text-stone-500 dark:text-zinc-300">Continuous Assessment</p>
                    <p className="text-[11px] text-stone-400 leading-relaxed mt-0.5">
                      {userProfile.customLearningPath.studyTips[1] || "Assess each module by completing diagnostic mocks to automatically flag subtopic backlogs."}
                    </p>
                  </div>
                </div>
              </div>

            </section>
          )}

          {/* MOOD BASED RECOMMENDATIONS CARD */}
          <section className={`p-8 rounded-[2rem] border text-left space-y-6 ${
            isDark ? 'bg-[#151518] border-zinc-850' : 'bg-white border-stone-100 shadow-sm'
          }`}>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <span className="px-3 py-1 text-[9px] font-extrabold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 rounded-full border border-indigo-500/15">
                  Cognitive Calibrator
                </span>
                <h4 className={`text-xl font-extrabold tracking-tight mt-2.5 ${isDark ? 'text-zinc-150' : 'text-stone-900'}`}>
                  How is your academic energy level today?
                </h4>
                <p className="text-stone-550 dark:text-zinc-400 text-xs mt-1 font-semibold">
                  Calibrate your mood state to optimize real-time recommendations, pacing models, and soundscapes.
                </p>
              </div>

              {userMood !== 'ordinary' && (
                <button
                  onClick={() => {
                    setUserMood('ordinary');
                    setAtmosphere('Ordinary');
                  }}
                  className="text-xs font-extrabold uppercase text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 transition-all cursor-pointer shrink-0"
                >
                  <i className="fa-solid fa-arrow-rotate-left mr-1.5"></i> Reset to Balanced
                </button>
              )}
            </div>

            {/* Tactical Mood Selector Pills */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fadeIn">
              {/* Tired Pill */}
              <button
                onClick={() => {
                  setUserMood('tired');
                  setAtmosphere('Low Productivity');
                }}
                className={`p-4 rounded-2xl border text-left cursor-pointer transition-all flex items-start gap-3.5 ${
                  userMood === 'tired'
                    ? 'bg-amber-500/10 border-amber-500 ring-1 ring-amber-500/20'
                    : 'bg-stone-50/50 dark:bg-zinc-900/40 border-stone-200/50 dark:border-zinc-800 hover:bg-stone-100/80 dark:hover:bg-zinc-850'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center text-base shrink-0">
                  <i className="fa-solid fa-battery-quarter animate-pulse"></i>
                </div>
                <div>
                  <h5 className={`font-bold text-xs ${isDark ? 'text-zinc-200' : 'text-stone-800'}`}>Exhausted</h5>
                  <p className="text-[10px] text-stone-500 dark:text-zinc-400 mt-0.5 leading-normal font-semibold">Gentle pacing summary loops</p>
                </div>
              </button>

              {/* Energetic Pill */}
              <button
                onClick={() => {
                  setUserMood('energetic');
                  setAtmosphere('Exams');
                }}
                className={`p-4 rounded-2xl border text-left cursor-pointer transition-all flex items-start gap-3.5 ${
                  userMood === 'energetic'
                    ? 'bg-indigo-500/10 border-indigo-500 ring-1 ring-indigo-500/20'
                    : 'bg-stone-50/50 dark:bg-zinc-900/40 border-stone-200/50 dark:border-zinc-800 hover:bg-stone-100/80 dark:hover:bg-zinc-850'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center text-base shrink-0">
                  <i className="fa-solid fa-bolt-lightning animate-bounce"></i>
                </div>
                <div>
                  <h5 className={`font-bold text-xs ${isDark ? 'text-zinc-200' : 'text-stone-800'}`}>Highly Energetic</h5>
                  <p className="text-[10px] text-stone-500 dark:text-zinc-400 mt-0.5 leading-normal font-semibold">Intense Mock test drills</p>
                </div>
              </button>

              {/* Anxious Pill */}
              <button
                onClick={() => {
                  setUserMood('anxious');
                  setAtmosphere('Low Productivity');
                }}
                className={`p-4 rounded-2xl border text-left cursor-pointer transition-all flex items-start gap-3.5 ${
                  userMood === 'anxious'
                    ? 'bg-rose-500/10 border-rose-500 ring-1 ring-rose-500/20'
                    : 'bg-stone-50/50 dark:bg-zinc-900/40 border-stone-200/50 dark:border-zinc-800 hover:bg-stone-100/80 dark:hover:bg-zinc-850'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center text-base shrink-0">
                  <i className="fa-solid fa-heart-pulse"></i>
                </div>
                <div>
                  <h5 className={`font-bold text-xs ${isDark ? 'text-zinc-200' : 'text-stone-800'}`}>Anxious</h5>
                  <p className="text-[10px] text-stone-500 dark:text-zinc-400 mt-0.5 leading-normal font-semibold">Calm flow-state blocks</p>
                </div>
              </button>

              {/* Balanced Pill */}
              <button
                onClick={() => {
                  setUserMood('ordinary');
                  setAtmosphere('Ordinary');
                }}
                className={`p-4 rounded-2xl border text-left cursor-pointer transition-all flex items-start gap-3.5 ${
                  userMood === 'ordinary'
                    ? 'bg-emerald-500/10 border-emerald-500 ring-1 ring-emerald-500/20'
                    : 'bg-stone-50/50 dark:bg-zinc-900/40 border-stone-200/50 dark:border-zinc-800 hover:bg-stone-100/80 dark:hover:bg-zinc-850'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-base shrink-0">
                  <i className="fa-solid fa-circle-check"></i>
                </div>
                <div>
                  <h5 className={`font-bold text-xs ${isDark ? 'text-zinc-200' : 'text-stone-800'}`}>Standard</h5>
                  <p className="text-[10px] text-stone-500 dark:text-zinc-400 mt-0.5 leading-normal font-semibold">General active learning loops</p>
                </div>
              </button>
            </div>

            {/* Recommendations Output Block */}
            {userMood !== 'ordinary' && (
              <div className={`p-6 rounded-2xl border animate-slideDown ${
                userMood === 'tired' ? 'bg-amber-500/[0.01] border-amber-500/15' :
                userMood === 'energetic' ? 'bg-indigo-500/[0.01] border-indigo-500/15' :
                'bg-rose-500/[0.01] border-rose-500/15'
              }`}>
                <h5 className={`text-[10px] font-black uppercase flex items-center gap-2 mb-4 ${
                  userMood === 'tired' ? 'text-amber-500' :
                  userMood === 'energetic' ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-500'
                }`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current animate-ping"></span>
                  <span>AI Study Calibration Plan</span>
                </h5>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                  {userMood === 'tired' && (
                    <>
                      <div className="p-4 rounded-xl bg-white dark:bg-[#18181b] border border-stone-100 dark:border-zinc-800/60">
                        <span className="font-extrabold text-xs text-amber-500 block">01 • Pomodoro Setup</span>
                        <p className="text-[11px] mt-1 text-stone-500 dark:text-zinc-400 font-medium leading-relaxed">Join the silent accountability **Neet Night Study** room with low-intensity Rain Forest audio active.</p>
                      </div>
                      <div className="p-4 rounded-xl bg-white dark:bg-[#18181b] border border-stone-100 dark:border-zinc-800/60">
                        <span className="font-extrabold text-xs text-amber-500 block">02 • Concept Mapping</span>
                        <p className="text-[11px] mt-1 text-stone-500 dark:text-zinc-400 font-medium leading-relaxed">Launch Doubt Solver, voice record or enter a core concept doubt and use the TTS voice output for passive absorption.</p>
                      </div>
                      <div className="p-4 rounded-xl bg-white dark:bg-[#18181b] border border-stone-100 dark:border-zinc-800/60">
                        <span className="font-extrabold text-xs text-amber-500 block">03 • Simple Wins</span>
                        <p className="text-[11px] mt-1 text-stone-500 dark:text-zinc-400 font-medium leading-relaxed">Open Notes Library, read 1 pre-compiled master outline guide. Consistency is key when energy is limited.</p>
                      </div>
                    </>
                  )}
                  {userMood === 'energetic' && (
                    <>
                      <div className="p-4 rounded-xl bg-white dark:bg-[#18181b] border border-stone-100 dark:border-zinc-800/60">
                        <span className="font-extrabold text-xs text-indigo-500 block">01 • High-Stakes Diagnostics</span>
                        <p className="text-[11px] mt-1 text-stone-500 dark:text-zinc-400 font-medium leading-relaxed">Generate an interactive CBSE/JEE diagnostic quiz in Mock Arena to identify active weak concepts.</p>
                      </div>
                      <div className="p-4 rounded-xl bg-white dark:bg-[#18181b] border border-stone-100 dark:border-zinc-800/60">
                        <span className="font-extrabold text-xs text-indigo-500 block">02 • Collaborative Push</span>
                        <p className="text-[11px] mt-1 text-stone-500 dark:text-zinc-400 font-medium leading-relaxed">Lock in a 45m Pomodoro pledge on Focus Rooms, select Space ambient audio, and study with peers.</p>
                      </div>
                      <div className="p-4 rounded-xl bg-white dark:bg-[#18181b] border border-stone-100 dark:border-zinc-800/60">
                        <span className="font-extrabold text-xs text-indigo-500 block">03 • Rapid Recap</span>
                        <p className="text-[11px] mt-1 text-stone-500 dark:text-zinc-400 font-medium leading-relaxed">Run a Deep Dive query inside notes library to assemble an extensive, complex outline on tricky subjects.</p>
                      </div>
                    </>
                  )}
                  {userMood === 'anxious' && (
                    <>
                      <div className="p-4 rounded-xl bg-white dark:bg-[#18181b] border border-stone-100 dark:border-zinc-800/60">
                        <span className="font-extrabold text-xs text-rose-500 block">01 • Calming Setting</span>
                        <p className="text-[11px] mt-1 text-stone-500 dark:text-zinc-400 font-medium leading-relaxed">We have locked your workspace atmosphere to Recovery to hide aggressive timers and metrics immediately.</p>
                      </div>
                      <div className="p-4 rounded-xl bg-white dark:bg-[#18181b] border border-stone-100 dark:border-zinc-800/60">
                        <span className="font-extrabold text-xs text-rose-500 block">02 • Soft Maintenance</span>
                        <p className="text-[11px] mt-1 text-stone-500 dark:text-zinc-400 font-medium leading-relaxed">Answer 1 simple doubt or review 1 resolved card inside the Doubt Solver to re-anchor momentum.</p>
                      </div>
                      <div className="p-4 rounded-xl bg-white dark:bg-[#18181b] border border-stone-100 dark:border-zinc-800/60">
                        <span className="font-extrabold text-xs text-rose-500 block">03 • Low-Stress Planning</span>
                        <p className="text-[11px] mt-1 text-stone-500 dark:text-zinc-400 font-medium leading-relaxed">Write down just 1 small sub-task for tomorrow in Study Planner. Tomorrow is a brand new start.</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </section>

          {/* ASYMMETRIC BENTO GRID ROW - PREDICTOR + CONTROLS */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
            {/* Peak Focus Window Predictor */}
            <div className={`p-8 rounded-[2rem] border relative overflow-hidden lg:col-span-8 flex flex-col md:flex-row gap-8 items-center justify-between transition-all duration-300 md:hover:-translate-y-1 ${
              isDark ? 'bg-[#151518] border-zinc-850' : 'bg-white border-stone-100 shadow-sm'
            }`}>
              <div className="space-y-4 flex-1">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping"></span>
                  <span className="text-[9px] font-extrabold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Circadian Predictor</span>
                </div>
                <h4 className={`text-2xl font-extrabold tracking-tight ${isDark ? 'text-zinc-150' : 'text-stone-900 font-sans'}`}>
                  Your Peak Study Slot Prediction
                </h4>
                <p className="text-stone-500 dark:text-zinc-400 font-medium text-xs leading-relaxed">
                  Analyzing previous focus metrics, your cognitive retention operates best between <span className="text-indigo-600 dark:text-indigo-450 font-extrabold bg-indigo-500/5 px-2 py-0.5 rounded">7:00 PM – 10:00 PM</span>. Try launching Focus Rooms during this window tonight!
                </p>
                <div className="flex gap-4.5 pt-2 flex-wrap text-stone-400 text-xs font-bold">
                  <div className="flex items-center gap-1.5">
                    <i className="fa-solid fa-bolt text-amber-500"></i> Expected Efficiency: <span className="text-emerald-500 font-extrabold">Ultra</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <i className="fa-regular fa-clock text-indigo-500"></i> Optimum Slot: <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">8:15 PM</span>
                  </div>
                </div>
              </div>
              
              <div className="w-full md:w-36 aspect-square bg-gradient-to-tr from-indigo-500/10 to-purple-500/10 rounded-2xl border border-indigo-500/10 flex flex-col items-center justify-center p-4 text-center shrink-0">
                <span className="text-[9px] font-extrabold uppercase tracking-widest text-stone-400">Synergy Score</span>
                <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400 tracking-tight mt-1">94%</span>
                <span className="text-[8px] text-emerald-500 font-extrabold uppercase mt-1 leading-none">Excellent</span>
              </div>
            </div>

            {/* Atmosphere Lock Summary Panel */}
            <div className={`p-6 rounded-[2rem] border relative overflow-hidden text-left lg:col-span-4 flex flex-col justify-between ${
              isDark ? 'bg-[#151518] border-zinc-850' : 'bg-stone-50/50 border-stone-100 shadow-sm'
            }`}>
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-[8px] font-black uppercase text-stone-400 tracking-wider">Atmosphere Calibration</span>
                  <div className="flex gap-1">
                    {(['Ordinary', 'Exams'] as DashboardAtmosphere[]).map(at => (
                      <button
                        key={at}
                        onClick={() => setAtmosphere(at)}
                        className={`px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                          atmosphere === at 
                            ? 'bg-indigo-600 text-white shadow-sm' 
                            : 'text-stone-400 hover:text-stone-600'
                        }`}
                      >
                        {at}
                      </button>
                    ))}
                  </div>
                </div>
                
                {atmosphere === 'Exams' ? (
                  <div className="space-y-2">
                    <span className="text-[8px] font-extrabold text-rose-500 uppercase tracking-widest bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/15">Exam Compression</span>
                    <h5 className={`text-sm font-extrabold ${isDark ? 'text-zinc-150' : 'text-stone-900'}`}>High Stakes Sync</h5>
                    <p className="text-stone-500 dark:text-zinc-400 text-xs leading-relaxed font-semibold">
                      Syllabus holds {totalTopics - completedTopics} pending chapters. Activate the Mock Arena to run a diagnostics loop.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <span className="text-[8px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/15">Balanced</span>
                    <h5 className={`text-sm font-extrabold ${isDark ? 'text-zinc-150' : 'text-stone-900'}`}>Steady Pace Lock</h5>
                    <p className="text-stone-500 dark:text-zinc-400 text-xs leading-relaxed font-semibold">
                      Your syllabus is steady. You have completed {completionPercentage}% of target chapters. No rush!
                    </p>
                  </div>
                )}
              </div>

              {/* Dynamic Action Trigger */}
              <button 
                onClick={() => setActiveTab('replay')}
                className="w-full mt-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer border border-transparent shadow"
              >
                Inspect Study Replay <i className="fa-solid fa-arrow-right ml-1"></i>
              </button>
            </div>
          </div>

          {/* MAIN STATS AND AREA CHART ROW */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Progress Circle Card */}
            <div className={`p-8 rounded-[2rem] border flex flex-col items-center justify-center relative overflow-hidden group ${
              isDark ? 'bg-[#151518] border-zinc-850' : 'bg-white border-stone-100 shadow-sm'
            }`}>
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-6">Syllabus Overview</h3>
              <div className="w-44 h-44 relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} innerRadius={60} outerRadius={78} paddingAngle={6} dataKey="value" stroke="none">
                      {pieData.map((_, index) => <Cell key={index} fill={COLORS[index]} cornerRadius={8} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className={`text-3xl font-extrabold tracking-tight ${isDark ? 'text-zinc-100' : 'text-stone-900'}`}>{completionPercentage}%</p>
                  <p className="text-[8px] font-black text-indigo-500 uppercase tracking-widest mt-1">Syllabus Sync</p>
                </div>
              </div>
              <div className="flex gap-8 w-full mt-8 justify-center border-t border-stone-100 dark:border-zinc-850/60 pt-6">
                <div className="text-center">
                  <p className={`text-xl font-extrabold ${isDark ? 'text-zinc-150' : 'text-stone-900'}`}>{completedTopics}</p>
                  <p className="text-[9px] font-black text-stone-400 uppercase tracking-wider">Chapters Done</p>
                </div>
                <div className="text-center">
                  <p className={`text-xl font-extrabold ${isDark ? 'text-zinc-150' : 'text-stone-900'}`}>{doubts.length}</p>
                  <p className="text-[9px] font-black text-stone-400 uppercase tracking-wider">Doubts Raised</p>
                </div>
              </div>
            </div>

            {/* Engagement Waveforms */}
            <div className={`lg:col-span-2 p-8 rounded-[2rem] border flex flex-col justify-between ${
              isDark ? 'bg-[#151518] border-zinc-850' : 'bg-white border-stone-100 shadow-sm'
            }`}>
              <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400">Cognitive Activity Waveforms</h3>
                  <p className="text-[10px] text-stone-400 font-semibold mt-0.5">Atmosphere state: {atmosphere}</p>
                </div>
                <div className="flex gap-4">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-600"></div>
                    <span className="text-[9px] font-black text-stone-400 uppercase tracking-wider">Focus Intensity</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-purple-500"></div>
                    <span className="text-[9px] font-black text-stone-400 uppercase tracking-wider">Active Revision</span>
                  </div>
                </div>
              </div>
              
              <div className="flex-1 w-full min-h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={getActivityData()} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorFocus" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorIntensity" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#a855f7" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)"} />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 10, fontWeight: 600}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 10, fontWeight: 600}} dx={-5} />
                    <Tooltip 
                      contentStyle={{
                        borderRadius: '16px', 
                        border: 'none', 
                        background: isDark ? '#1F1F23' : 'white', 
                        boxShadow: '0 12px 30px rgba(0,0,0,0.08)',
                        fontSize: '11px'
                      }}
                    />
                    <Area type="monotone" dataKey="Focus" stroke="#4F46E5" strokeWidth={2.5} fillOpacity={1} fill="url(#colorFocus)" />
                    <Area type="monotone" dataKey="Intensity" stroke="#a855f7" strokeWidth={2.5} fillOpacity={1} fill="url(#colorIntensity)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* GAME LOGIC & BADGES */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`text-xl font-extrabold tracking-tight ${isDark ? 'text-zinc-150' : 'text-stone-900'}`}>Milestones & Rewards</h3>
                <p className="text-stone-500 dark:text-zinc-400 font-medium text-xs mt-1">Nourish study habits and unlock custom diagnostic ranks.</p>
              </div>

              {/* Quick Streak Booster */}
              <div 
                onClick={() => onSetStudyStreak(prev => prev + 1)}
                className={`flex items-center gap-3 cursor-pointer p-2.5 px-4 rounded-xl border select-none transition-all hover:scale-[1.02] active:scale-95 ${
                  isDark ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-stone-200/50 shadow-sm'
                }`}
                title="Log 1 additional study day!"
              >
                <i className="fa-solid fa-fire text-orange-500 text-sm animate-pulse"></i>
                <div className="text-left leading-tight">
                  <p className="text-[7.5px] font-black uppercase text-stone-400 tracking-wider">Log Streak +</p>
                  <p className="text-xs font-extrabold">{studyStreak} Days</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {badges.map(badge => {
                let progressPercent = 0;
                let progressText = "";

                if (badge.id === '1') {
                  progressPercent = Math.min((studyStreak / 3) * 100, 100);
                  progressText = `${studyStreak}/3 Days`;
                } else if (badge.id === '2') {
                  progressPercent = Math.min((resolvedCount / 3) * 100, 100);
                  progressText = `${resolvedCount}/3 Solved`;
                } else if (badge.id === '3') {
                  progressPercent = Math.min((completedTopics / 3) * 100, 100);
                  progressText = `${completedTopics}/3 Topics`;
                } else if (badge.id === '4') {
                  progressPercent = badge.unlocked ? 100 : 0;
                  progressText = badge.unlocked ? "Nourished" : "0/1 Session";
                }

                return (
                  <div 
                    key={badge.id}
                    className={`p-6 rounded-[2rem] border flex flex-col justify-between transition-all duration-300 relative overflow-hidden bg-white dark:bg-[#151518] ${
                      badge.unlocked 
                        ? 'border-indigo-500/30 shadow-sm shadow-indigo-500/5' 
                        : 'opacity-70 border-stone-150 dark:border-zinc-850'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-3.5 text-left">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm transition-all duration-500 ${
                          badge.unlocked 
                            ? 'bg-indigo-500/10 text-indigo-500 ring-1 ring-indigo-500/20' 
                            : 'bg-stone-100 text-stone-400 dark:bg-zinc-800'
                        }`}>
                          <i className={`fa-solid ${badge.icon}`}></i>
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <p className={`text-xs font-extrabold truncate ${isDark ? 'text-zinc-150' : 'text-stone-800'}`}>{badge.name}</p>
                          <span className={`text-[8px] font-black uppercase tracking-wider ${badge.unlocked ? 'text-emerald-500' : 'text-stone-400'}`}>
                            {badge.unlocked ? 'Unlocked' : 'Locked'}
                          </span>
                        </div>
                      </div>

                      <p className="text-[11px] text-stone-500 dark:text-zinc-400 font-medium mt-4 leading-relaxed min-h-[44px] text-left">
                        {badge.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-4 border-t border-stone-100 dark:border-zinc-850/50">
                      <div className="w-full bg-stone-100 dark:bg-zinc-800 rounded-full h-1 overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-1000 ${
                            badge.unlocked ? 'bg-gradient-to-r from-indigo-500 to-purple-500' : 'bg-stone-250'
                          }`}
                          style={{ width: `${progressPercent}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-[8px] font-bold uppercase text-stone-400">Progress</span>
                        <span className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400">{progressText}</span>
                      </div>
                    </div>

                    {!badge.unlocked && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (badge.id === '1') {
                            onSetStudyStreak(3);
                          } else {
                            onUnlockBadge(badge.id);
                          }
                        }}
                        className="mt-3 w-full text-[9px] font-extrabold uppercase tracking-widest py-1.5 rounded-xl bg-stone-50 dark:bg-zinc-900 text-indigo-600 dark:text-indigo-450 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 transition-all border border-transparent cursor-pointer"
                      >
                        ⚡ Fast Unlock
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </>
      ) : (
        <>
          {/* STUDY REPLAY TAB CONTENT */}
          <div className="space-y-8 animate-fadeIn text-left">
            
            {/* Choose Day Toggle */}
            <div className="flex items-center justify-between border-b border-stone-150 dark:border-zinc-850/60 pb-4">
              <div>
                <h4 className={`text-lg font-extrabold ${isDark ? 'text-zinc-150' : 'text-stone-900'}`}>Focus Timeline Recaps</h4>
                <p className="text-stone-400 text-xs mt-0.5">Toggle active archives to inspect cognitive curves.</p>
              </div>

              <div className={`flex p-1 rounded-xl border ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-stone-50 border-stone-200/50'}`}>
                <button
                  onClick={() => setActiveDay('today')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeDay === 'today' ? 'bg-indigo-600 text-white' : 'text-stone-400 hover:text-stone-600'}`}
                >
                  Today
                </button>
                <button
                  onClick={() => setActiveDay('yesterday')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeDay === 'yesterday' ? 'bg-indigo-600 text-white' : 'text-stone-400 hover:text-stone-600'}`}
                >
                  Yesterday
                </button>
              </div>
            </div>

            {/* Asymmetric Replay Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Hours studied Dial */}
              <div className={`lg:col-span-5 p-8 rounded-[2rem] border flex flex-col justify-between ${
                isDark ? 'bg-[#151518] border-zinc-850' : 'bg-white border-stone-100 shadow-sm'
              }`}>
                <div className="flex justify-between items-start mb-6">
                  <span className="text-[10px] uppercase font-black tracking-widest text-emerald-500">01 • Logged Focus</span>
                  <i className="fa-solid fa-hourglass text-stone-400 text-sm"></i>
                </div>

                <div className="flex flex-col items-center py-4">
                  <div className="relative w-40 h-40 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90">
                      <circle cx="80" cy="80" r="64" stroke="rgba(128,128,128,0.04)" strokeWidth="4" fill="none" />
                      <circle cx="80" cy="80" r="64" stroke="#10B981" strokeWidth="6" strokeDasharray={402} strokeDashoffset={402 - (Math.min(activeFocusMinutes, 480) / 480) * 402} strokeLinecap="round" fill="none" className="transition-all duration-1000" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className={`text-4xl font-extrabold tracking-tight ${isDark ? 'text-zinc-150' : 'text-stone-900'}`}>{hoursStudied}h</span>
                      <span className="text-[8px] font-black uppercase text-stone-400 mt-1">{activeFocusMinutes} Total Mins</span>
                    </div>
                  </div>

                  <div className="mt-6 text-center space-y-1">
                    <p className="text-xs font-extrabold text-stone-700 dark:text-zinc-300">Strong Circadian Cohesion</p>
                    <p className="text-[11px] text-stone-400 leading-relaxed font-semibold">Your study blocks matched peak bio-rhythms cleanly. Intrinsic memory consolidation is active.</p>
                  </div>
                </div>
              </div>

              {/* Strongest Subject Details */}
              <div className={`lg:col-span-7 p-8 rounded-[2rem] border flex flex-col justify-between h-full min-h-[300px] ${
                isDark ? 'bg-[#151518] border-zinc-850' : 'bg-stone-50/50 border-stone-100 shadow-sm'
              }`}>
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] uppercase font-black tracking-widest text-indigo-500">02 • Retention Focus</span>
                    <span className="px-2 py-0.5 text-[8px] font-black bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-md border border-indigo-500/15 uppercase">Core Anchor</span>
                  </div>

                  <p className="text-[8px] font-black text-stone-400 uppercase tracking-[0.25em] leading-none">Identified Peak subject</p>
                  <h3 className={`text-3xl font-extrabold tracking-tight ${isDark ? 'text-zinc-150' : 'text-stone-900 font-sans'}`}>
                    {strongestSubject.name}
                  </h3>
                  <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 leading-none">
                    {strongestSubject.classLevel || 'Active Stream'}
                  </span>

                  <p className="text-xs text-stone-500 dark:text-zinc-400 font-medium leading-relaxed pt-3">
                    Your focus timeline shows the highest mathematical comprehension, doubt resolution, and master study guide compilations for this subject. Good visual memory connections detected.
                  </p>
                </div>

                <div className="mt-8 pt-6 border-t border-stone-200/50 dark:border-zinc-850/60 flex justify-between items-center flex-wrap gap-4">
                  <div>
                    <span className="text-[8px] font-black uppercase text-stone-400 tracking-wider">Chapter Count Finished</span>
                    <p className={`text-xl font-extrabold ${isDark ? 'text-zinc-150' : 'text-stone-900'}`}>
                      {subjects.find(s => s.name === strongestSubject.name)?.topics.filter(t => t.completed).length || 1} Chapters
                    </p>
                  </div>
                  <div>
                    <span className="text-[8px] font-black uppercase text-stone-400 tracking-wider">Concept Level</span>
                    <p className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400">Mastery Rank</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Second Row Replay */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Distractions Avoided Interlocks */}
              <div className={`lg:col-span-6 p-8 rounded-[2rem] border ${
                isDark ? 'bg-[#151518] border-zinc-850' : 'bg-white border-stone-100 shadow-sm'
              }`}>
                <div className="flex justify-between items-center mb-6">
                  <span className="text-[10px] uppercase font-black tracking-widest text-amber-500">03 • Sanctuary Shield</span>
                  <div className="text-right">
                    <span className="text-xl font-extrabold text-amber-500">+{totalDistractionsAvoidedMins} min</span>
                    <p className="text-[8px] font-black text-stone-400 uppercase leading-none">Shielded</p>
                  </div>
                </div>

                <p className="text-stone-500 dark:text-zinc-400 text-xs font-medium leading-relaxed mb-6">
                  Toggle active workspace locks and mental block parameters. Avoided hours automatically recalibrate the density metrics.
                </p>

                <div className="space-y-3">
                  {distractions.map(d => (
                    <div 
                      key={d.id} 
                      onClick={() => toggleDistraction(d.id)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 select-none ${
                        d.avoided 
                          ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
                          : isDark ? 'bg-zinc-900/20 border-zinc-850 text-zinc-500' : 'bg-stone-50/50 border-stone-150 text-stone-500'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs ${
                          d.avoided ? 'bg-emerald-500/10 text-emerald-500' : 'bg-stone-100 dark:bg-zinc-800 text-stone-400'
                        }`}>
                          <i className={`fa-solid ${d.icon}`}></i>
                        </div>
                        <div className="min-w-0 text-left">
                          <p className={`text-xs font-extrabold truncate ${d.avoided ? 'text-emerald-600 dark:text-emerald-400' : 'text-stone-700 dark:text-zinc-300'}`}>{d.name}</p>
                          <p className="text-[9px] text-stone-400 dark:text-zinc-500 truncate">{d.details}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[9px] font-extrabold uppercase bg-stone-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md text-stone-500 dark:text-zinc-400">
                          +{d.duration}m
                        </span>
                        <div className={`w-4.5 h-4.5 rounded-full flex items-center justify-center border ${
                          d.avoided ? 'bg-emerald-500 border-emerald-400 text-white' : 'border-stone-300 dark:border-zinc-700'
                        }`}>
                          {d.avoided && <i className="fa-solid fa-check text-[8px] font-extrabold"></i>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cognitive Wave Timeline Chart */}
              <div className={`lg:col-span-6 p-8 rounded-[2rem] border flex flex-col justify-between min-h-[360px] ${
                isDark ? 'bg-[#151518] border-zinc-850' : 'bg-white border-stone-100 shadow-sm'
              }`}>
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-[10px] uppercase font-black tracking-widest text-[#4F46E5]">04 • Cognitive Waves</span>
                    <span className="text-[8px] font-black uppercase text-stone-400 tracking-wider">Focus density index</span>
                  </div>

                  <p className="text-xs text-stone-400 font-medium leading-relaxed mb-6">
                    Real-time monitoring wave displaying focus intensity fluctuations across study intervals.
                  </p>
                </div>

                <div className="h-40 w-full pr-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={timelineData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="replayFocusColor" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="time" tick={{ fill: '#88888b', fontSize: 8, fontWeight: 700 }} axisLine={false} tickLine={false} />
                      <Tooltip 
                        contentStyle={{
                          borderRadius: '12px',
                          background: isDark ? '#1F1F23' : '#FFF',
                          border: 'none',
                          fontSize: '11px',
                          boxShadow: '0 8px 25px rgba(0,0,0,0.06)'
                        }}
                      />
                      <Area type="monotone" dataKey="efficiency" stroke="#4F46E5" strokeWidth={2.5} fillOpacity={1} fill="url(#replayFocusColor)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className={`p-4 rounded-xl border border-dashed mt-6 text-left ${
                  isDark ? 'border-zinc-800 bg-zinc-900/10' : 'border-stone-200 bg-stone-50/50'
                }`}>
                  <span className="text-[8px] font-black uppercase tracking-widest text-indigo-500 block mb-1">
                    ✏️ Calibration Insight
                  </span>
                  <p className="text-[10px] italic text-stone-500 dark:text-zinc-400 leading-relaxed font-semibold">
                    Highly concentrated study observed between 7:00 PM – 10:00 PM during doubt solver queries. Cognitive sync is excellent. Keep soundscapes active to secure this peak circadian lock tomorrow.
                  </p>
                </div>
              </div>

            </div>

          </div>
        </>
      )}

    </div>
  );
};

export default Dashboard;
