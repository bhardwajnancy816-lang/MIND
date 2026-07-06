import React, { useState, useEffect } from 'react';
import { Subject, ThemeMode } from '../types';

interface RevisionPlannerProps {
  subjects: Subject[];
  theme: ThemeMode;
  onNavigateToMockTest?: (targetSubject: string, targetTopics: string[]) => void;
}

interface DailyTarget {
  day: string;
  topic: string;
  intensity: string;
  task: string;
  estimatedMinutes: number;
  completed?: boolean;
}

interface RevisionCycle {
  cycleName: string;
  triggerDay: string;
  strategy: string;
}

interface MockTestMilestone {
  milestone: string;
  scheduleDay: string;
  focusAreas: string[];
}

interface RevisionPlan {
  subjectName: string;
  examDate: string;
  weakTopics: string;
  overview: string;
  dailyTargets: DailyTarget[];
  revisionCycles: RevisionCycle[];
  mockTestSchedule: MockTestMilestone[];
  createdAt: number;
}

const RevisionPlanner: React.FC<RevisionPlannerProps> = ({ subjects, theme, onNavigateToMockTest }) => {
  const isDark = theme === 'dark';
  
  // Creation values
  const [selectedSubject, setSelectedSubject] = useState('');
  const [customSubject, setCustomSubject] = useState('');
  const [examDate, setExamDate] = useState('');
  const [weakTopics, setWeakTopics] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Active Plan local state
  const [activePlan, setActivePlan] = useState<RevisionPlan | null>(null);

  // Load plan from memory
  useEffect(() => {
    try {
      const cached = localStorage.getItem('mindorbit_active_revision_plan');
      if (cached) {
        setActivePlan(JSON.parse(cached));
      }
    } catch (e) {
      console.warn("Could not parse cached revision plan:", e);
    }
  }, []);

  // Save changes back to memory
  const savePlanToCache = (plan: RevisionPlan | null) => {
    try {
      if (plan) {
        localStorage.setItem('mindorbit_active_revision_plan', JSON.stringify(plan));
      } else {
        localStorage.removeItem('mindorbit_active_revision_plan');
      }
      setActivePlan(plan);
    } catch (e) {
      console.error("Could not write active plan to cache:", e);
    }
  };

  const handleGeneratePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalSubjectName = selectedSubject === 'custom' ? customSubject : selectedSubject;
    if (!finalSubjectName || !examDate) {
      setErrorMsg('Please select or specify a subject and select your target exam date.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const response = await fetch('/api/gemini/revision-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectName: finalSubjectName,
          examDate,
          weakTopics
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || `HTTP error ${response.status}`);
      }

      const generatedData = await response.json();
      
      const newPlan: RevisionPlan = {
        subjectName: finalSubjectName,
        examDate,
        weakTopics,
        overview: generatedData.overview || "Your accelerated revision roadmap is active.",
        dailyTargets: (generatedData.dailyTargets || []).map((t: any) => ({ ...t, completed: false })),
        revisionCycles: generatedData.revisionCycles || [],
        mockTestSchedule: generatedData.mockTestSchedule || [],
        createdAt: Date.now()
      };

      savePlanToCache(newPlan);
      
      // Reset inputs
      setSelectedSubject('');
      setCustomSubject('');
      setExamDate('');
      setWeakTopics('');
    } catch (err: any) {
      console.error("Revision model creation failure:", err);
      setErrorMsg(err.message || 'Orbit lost connection. Please try again in secondary airspace.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleTarget = (dayIndex: number) => {
    if (!activePlan) return;
    const copyTargets = [...activePlan.dailyTargets];
    copyTargets[dayIndex].completed = !copyTargets[dayIndex].completed;

    const updatedPlan = {
      ...activePlan,
      dailyTargets: copyTargets
    };
    savePlanToCache(updatedPlan);
  };

  const handleClearPlan = () => {
    if (window.confirm("Are you sure you want to archive and clear this revision plan?")) {
      savePlanToCache(null);
    }
  };

  // Compute countdown metrics
  const getDaysRemainingString = () => {
    if (!activePlan) return '';
    const examTime = new Date(activePlan.examDate).getTime();
    const diff = examTime - Date.now();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    
    if (days < 0) return 'Passed 🏁';
    if (days === 0) return 'TODAY! ⚡';
    return `${days} Days Left`;
  };

  const completionRatio = activePlan 
    ? Math.round((activePlan.dailyTargets.filter(t => t.completed).length / activePlan.dailyTargets.length) * 100) 
    : 0;

  return (
    <div className="space-y-10 animate-fadeIn pb-24 max-w-6xl mx-auto">
      
      {/* Visual Header Grid block */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-stone-200/20 pb-8">
        <div>
          <span className="px-3.5 py-1 text-[8px] font-black uppercase tracking-widest text-indigo-500 bg-indigo-505/10 rounded-full border border-indigo-500/10">
            Neuro Timelines
          </span>
          <h2 className={`text-4xl font-extrabold tracking-tight mt-2 ${isDark ? 'text-zinc-101' : 'text-stone-900'}`}>
            AI Revision <span className="bg-gradient-to-r from-purple-500 to-indigo-500 bg-clip-text text-transparent">Plans</span>
          </h2>
          <p className="text-stone-500 font-medium text-sm mt-1">
            Specify syllabus inputs and let MindOrbit generate science-backed spaced revision pathways.
          </p>
        </div>

        {activePlan && (
          <button
            id="clear-active-plan-btn"
            onClick={handleClearPlan}
            className="px-5 py-3.5 bg-red-400/5 hover:bg-red-400/15 text-red-500 rounded-xl font-bold text-[10px] uppercase tracking-wider border border-red-500/10 cursor-pointer transition-all active:scale-95"
          >
            Archive Plan Log
          </button>
        )}
      </header>

      {/* VIEW 1: CREATION DESIGNER FORM */}
      {!activePlan ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-8">
            <form onSubmit={handleGeneratePlan} className={`p-8 lg:p-10 rounded-[2.5rem] border ${isDark ? 'bg-zinc-950/25 border-zinc-850' : 'bg-white border-stone-200/50 shadow-xl'} space-y-6`}>
              <h3 className={`text-base font-black tracking-tight ${isDark ? 'text-white' : 'text-stone-900'}`}>
                1. Specify Revision Inputs
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Subject picker standard list */}
                <div className="space-y-1.5 text-left">
                  <label className="text-[9px] font-black uppercase text-stone-400 tracking-wider">Select Target Subject:</label>
                  <select
                    id="planner-select-subject"
                    value={selectedSubject}
                    onChange={e => setSelectedSubject(e.target.value)}
                    required
                    className={`w-full py-3.5 px-4 rounded-xl text-xs font-semibold outline-none border transition-all cursor-pointer ${
                      isDark 
                        ? 'bg-zinc-950/40 border-zinc-850 text-white focus:border-indigo-500' 
                        : 'bg-white border-stone-250 text-stone-900 focus:border-stone-300'
                    }`}
                  >
                    <option value="">- Choose subject -</option>
                    {subjects.map(s => (
                      <option key={s.id} value={s.name}>{s.name} ({s.classLevel})</option>
                    ))}
                    <option value="custom">- Specify custom board/exam -</option>
                  </select>
                </div>

                {/* Exam target calendar date picker */}
                <div className="space-y-1.5 text-left">
                  <label className="text-[9px] font-black uppercase text-stone-400 tracking-wider">Target Exam Date:</label>
                  <input
                    id="planner-exam-date"
                    type="date"
                    required
                    value={examDate}
                    onChange={e => setExamDate(e.target.value)}
                    className={`w-full py-3 px-4 rounded-xl text-xs font-semibold outline-none border transition-all cursor-pointer ${
                      isDark 
                        ? 'bg-zinc-950/40 border-zinc-850 text-white focus:border-indigo-500' 
                        : 'bg-white border-stone-250 text-stone-900 focus:border-stone-300'
                    }`}
                  />
                </div>

              </div>

              {/* Custom spec description */}
              {selectedSubject === 'custom' && (
                <div className="space-y-1.5 text-left animate-slideDown">
                  <label className="text-[9px] font-black uppercase text-stone-400 tracking-wider">Enter Custom Exam Name:</label>
                  <input
                    id="custom-exam-name"
                    type="text"
                    required
                    placeholder="e.g. UPSC Prelims, JEE Advanced, NEET Biochemistry"
                    value={customSubject}
                    onChange={e => setCustomSubject(e.target.value)}
                    className={`w-full py-3.5 px-4 rounded-xl text-xs font-semibold outline-none border transition-all ${
                      isDark 
                        ? 'bg-zinc-950/40 border-zinc-850 text-white focus:border-indigo-500' 
                        : 'bg-white border-stone-250 text-stone-900 focus:border-stone-300'
                    }`}
                  />
                </div>
              )}

              {/* Weak topics list text input */}
              <div className="space-y-1.5 text-left">
                <label className="text-[9px] font-black uppercase text-stone-400 tracking-wider">Highlight Weak topics/Chapters:</label>
                <textarea
                  id="weak-topics-input"
                  rows={4}
                  placeholder="e.g. Surface Chemistry formulas, Lens equations, integration by parts details, or French Revolution treaty treaties."
                  value={weakTopics}
                  onChange={e => setWeakTopics(e.target.value)}
                  className={`w-full py-3.5 px-4 rounded-xl text-xs font-semibold outline-none border transition-all ${
                    isDark 
                      ? 'bg-zinc-950/40 border-zinc-850 text-white focus:border-indigo-500' 
                      : 'bg-[#FAFAF9] border-stone-250 text-stone-900 focus:border-stone-305'
                  }`}
                />
                <span className="text-[10px] text-stone-450 italic mt-1 font-semibold block">
                  MindOrbit auto-allocates extra revision loops and spaced tests for these specific segments during planning.
                </span>
              </div>

              {errorMsg && (
                <p className="text-xs text-red-500 font-bold uppercase tracking-wider animate-shake">
                  <i className="fa-solid fa-circle-exclamation mr-1"></i> {errorMsg}
                </p>
              )}

              <button
                id="generate-plan-active-btn"
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold uppercase tracking-widest text-[10px] hover:scale-[1.01] active:scale-95 transition-all shadow-md shadow-indigo-600/15 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <i className="fa-solid fa-arrows-spin animate-spin text-sm"></i> Resolving Spaced Spacing Intervals...
                  </span>
                ) : 'Assemble accelerated AI Revision Plan ✓'}
              </button>

            </form>
          </div>

          {/* Sidebar tip guideline block */}
          <div className="space-y-8">
            <div className={`p-8 rounded-[2.5rem] border ${isDark ? 'bg-zinc-95 * 20 px-8 border-zinc-850' : 'bg-white border-stone-200/50 shadow-md'}`}>
              <h4 className={`text-sm font-black uppercase tracking-wider border-b pb-4 ${isDark ? 'border-zinc-850 text-zinc-350' : 'border-stone-150 text-stone-900'}`}>
                Scientific revision
              </h4>
              
              <ul className="space-y-5.5 mt-5 text-[11px] leading-relaxed font-semibold text-stone-500 text-left">
                <li className="flex gap-3">
                  <span className="w-5 h-5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/10 flex items-center justify-center font-bold">1</span>
                  <span><strong>Spaced Timelines</strong>: AI distributes target focus blocks according to your countdown, leaving buffer review windows at standard 3-day intervals.</span>
                </li>
                <li className="flex gap-3">
                  <span className="w-5 h-5 rounded bg-indigo-500/10 text-indigo-500 border border-indigo-500/10 flex items-center justify-center font-bold">2</span>
                  <span><strong>Active diagnostics</strong>: Generates milestones for diagnostic mock testing, pinpointing weakness points leading to exam date.</span>
                </li>
                <li className="flex gap-3">
                  <span className="w-5 h-5 rounded bg-purple-500/10 text-purple-500 border border-purple-500/10 flex items-center justify-center font-bold">3</span>
                  <span><strong>Confidence Checklists</strong>: Review daily targets step-by-step; visual checkboxes keep track of total mastery.</span>
                </li>
              </ul>
            </div>
          </div>

        </div>
      ) : (
        /* VIEW 2: ACTIVE SCIENTIFIC ROADMAP DISPLAY */
        <div className="space-y-10 animate-scaleUp">
          
          {/* Progress Overview Card Panel */}
          <div className={`p-8 rounded-[2.5rem] border relative overflow-hidden ${isDark ? 'bg-zinc-950/30 border-zinc-850' : 'bg-white border-stone-200/50 shadow-xl'}`}>
            <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl pointer-events-none"></div>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
              <div className="space-y-1 text-left">
                <span className="text-[8px] font-black uppercase text-indigo-500 bg-indigo-500/5 p-1 px-3.5 rounded-full border border-indigo-500/5">Active custom Roadmap active</span>
                <p className="text-[10px] uppercase font-bold text-stone-450 tracking-wider mt-3">Revision Focus:</p>
                <h3 className={`text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-stone-900'}`}>{activePlan.subjectName} Revision</h3>
                <p className="text-xs text-stone-450 font-bold uppercase tracking-wider">{activePlan.overview.substring(0, 110)}...</p>
              </div>

              <div className="flex gap-8 items-center bg-stone-50 dark:bg-zinc-900 p-4 rounded-2xl border border-stone-200/40 dark:border-zinc-800">
                <div className="text-center">
                  <p className="text-[8px] font-black uppercase text-stone-400 tracking-wider">Countdown</p>
                  <p className="text-xl font-extrabold text-indigo-500 mt-1 tracking-tight">{getDaysRemainingString()}</p>
                </div>
                <div className="w-px h-10 bg-stone-200 dark:bg-zinc-850"></div>
                <div className="text-center">
                  <p className="text-[8px] font-black uppercase text-stone-400 tracking-wider">Targets Mastered</p>
                  <p className="text-xl font-extrabold text-emerald-500 mt-1 tracking-tight">{completionRatio}%</p>
                </div>
              </div>
            </div>

            {/* Micro visual horizontal progress bar */}
            <div className="w-full bg-stone-105 dark:bg-zinc-90 w-full h-1.5 rounded-full overflow-hidden mt-6 relative z-10 border border-transparent">
              <div 
                className="h-full bg-gradient-to-r from-[#6366F1] to-[#EC4899] transition-all duration-500" 
                style={{ width: `${completionRatio}%` }}
              ></div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* COLUMN 1: INTERACTIVE DAILY CHECKLIST TIMELINE (Span 2) */}
            <div className="lg:col-span-2 space-y-6 text-left">
              <h4 className={`text-sm font-black uppercase tracking-wider flex items-center gap-2 ${isDark ? 'text-zinc-300' : 'text-stone-900'}`}>
                <i className="fa-solid fa-list-check text-indigo-505"></i> Daily targets calendar
              </h4>

              <div className="space-y-4">
                {activePlan.dailyTargets.map((target, index) => (
                  <div
                    key={index}
                    id={`target-block-${index}`}
                    onClick={() => handleToggleTarget(index)}
                    className={`p-5 px-6 rounded-2rem border flex items-center justify-between gap-4 cursor-pointer transition-all duration-200 select-none ${
                      target.completed
                        ? 'border-emerald-500/20 bg-emerald-500/[0.01]/10 text-stone-400 line-through'
                        : isDark
                          ? 'bg-zinc-950/20 border-zinc-850 hover:bg-zinc-900/40 text-zinc-150'
                          : 'bg-white border-stone-200/50 hover:border-stone-250 hover:shadow-sm text-stone-900'
                    }`}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      {/* Interactive checkbox indicator */}
                      <button
                        title="Mark progress"
                        className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                          target.completed
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'border-stone-300 dark:border-zinc-800 bg-transparent'
                        }`}
                      >
                        {target.completed && <i className="fa-solid fa-check text-[10px]"></i>}
                      </button>

                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="text-[10px] font-black uppercase text-[#6366F1]">{target.day}</span>
                          <span className={`text-[8px] px-2 py-0.2 rounded-md font-bold uppercase border ${
                            target.intensity === 'Intense' ? 'bg-red-500/10 border-red-500/10 text-red-505' :
                            target.intensity === 'Normal' ? 'bg-indigo-500/10 border-indigo-500/10 text-indigo-500' :
                            'bg-emerald-500/10 border-emerald-500/10 text-emerald-550'
                          }`}>
                            {target.intensity} focus
                          </span>
                        </div>
                        <h5 className="text-sm font-black tracking-tight leading-snug">{target.topic}</h5>
                        <p className={`text-xs mt-1 leading-relaxed ${target.completed ? 'text-stone-450' : 'text-stone-500 font-semibold'}`}>
                          {target.task}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[9px] font-mono font-bold text-stone-400 block uppercase"><i className="fa-regular fa-clock text-[8px] mr-0.5"></i> Estimated</span>
                      <span className="text-xs font-black tracking-tight mt-0.5 block">{target.estimatedMinutes} Mins</span>
                    </div>

                  </div>
                ))}
              </div>
            </div>

            {/* COLUMN 2: REVISION CYCLES & MOCK TESTING MILSTONES */}
            <div className="space-y-8 text-left">
              
              {/* Spaced Recall intervals */}
              <div className="space-y-5">
                <h4 className={`text-sm font-black uppercase tracking-wider flex items-center gap-2 ${isDark ? 'text-zinc-300' : 'text-stone-900'}`}>
                  <i className="fa-solid fa-repeat text-indigo-505 animate-spin duration-1000"></i> Active Recall spaced cycles
                </h4>

                <div className="space-y-4">
                  {activePlan.revisionCycles.map((cycle, idx) => (
                    <div
                      key={idx}
                      className={`p-6 rounded-[2rem] border ${isDark ? 'bg-zinc-95 * 20 border-zinc-850' : 'bg-white border-stone-150 shadow-sm'} space-y-3`}
                    >
                      <div className="flex justify-between items-center">
                        <h5 className={`text-xs font-black uppercase tracking-tight ${isDark ? 'text-zinc-150' : 'text-stone-950'}`}>{cycle.cycleName}</h5>
                        <span className="text-[8px] font-black uppercase bg-[#6366F1]/10 text-[#6366F1] px-2 py-0.5 rounded border border-[#6366F1]/15 leading-none">{cycle.triggerDay}</span>
                      </div>
                      <p className="text-[11px] text-stone-500 font-semibold leading-relaxed">{cycle.strategy}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mock tests schedule diary */}
              <div className="space-y-5">
                <h4 className={`text-sm font-black uppercase tracking-wider flex items-center gap-2 ${isDark ? 'text-zinc-300' : 'text-stone-900'}`}>
                  <i className="fa-solid fa-file-signature text-rose-500"></i> Testing milestones
                </h4>

                <div className="space-y-4">
                  {activePlan.mockTestSchedule.map((milestone, idx) => (
                    <div
                      key={idx}
                      className={`p-6 rounded-[2rem] border ${isDark ? 'bg-zinc-95 * 20 border-zinc-850' : 'bg-white border-stone-150 shadow-sm'} space-y-4`}
                    >
                      <div className="flex items-start justify-between gap-2.5">
                        <div className="space-y-0.5">
                          <span className="text-[8px] font-black uppercase tracking-widest text-rose-500">{milestone.scheduleDay}</span>
                          <h5 className={`text-xs font-black truncate leading-snug ${isDark ? 'text-zinc-150' : 'text-stone-900'}`}>{milestone.milestone}</h5>
                        </div>
                      </div>

                      <div className="space-y-1.5 flex flex-col">
                        <span className="text-[8px] font-black uppercase text-stone-400 tracking-wider">Suggested test Topics:</span>
                        <div className="flex flex-wrap gap-1">
                          {milestone.focusAreas.map((area, areaIdx) => (
                            <span key={areaIdx} className="text-[9px] font-semibold bg-stone-50 dark:bg-zinc-900 p-0.8 px-2.5 rounded-lg border border-stone-200 dark:border-zinc-800 text-stone-500">{area}</span>
                          ))}
                        </div>
                      </div>

                      {/* Link directly to mock generator page if registered */}
                      {onNavigateToMockTest && (
                        <button
                          onClick={() => onNavigateToMockTest(activePlan.subjectName, milestone.focusAreas)}
                          className="w-full py-2 bg-rose-500/5 hover:bg-rose-500/10 text-rose-500 rounded-xl font-bold uppercase tracking-widest text-[9px] transition-all cursor-pointer border border-rose-500/10 select-none"
                        >
                          Launch Mock Test for focus areas
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
};

export default RevisionPlanner;
