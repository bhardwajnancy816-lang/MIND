import React, { useState } from 'react';
import { Subject, ThemeMode, StreamType, SyllabusTopic } from '../types';

interface SyllabusTrackerProps {
  subjects: Subject[];
  onToggleTopic: (subjectId: string, topicId: string) => void;
  onUpdateRevisionStatus: (subjectId: string, topicId: string, status: SyllabusTopic['revisionStatus']) => void;
  onAddSubject: (name: string, classLevel: string) => void;
  onAddTopic: (subjectId: string, topicName: string) => void;
  onDeleteTopic: (subjectId: string, topicId: string) => void;
  onResetSubject: (subjectId: string) => void;
  theme: ThemeMode;
}

const SyllabusTracker: React.FC<SyllabusTrackerProps> = ({ 
  subjects, 
  onToggleTopic, 
  onUpdateRevisionStatus,
  onAddSubject, 
  onAddTopic,
  onDeleteTopic,
  onResetSubject,
  theme 
}) => {
  const isDark = theme === 'dark';
  const [selectedClass, setSelectedClass] = useState<string>('All');
  const [selectedStream, setSelectedStream] = useState<StreamType | 'All'>('All');
  const [isAdding, setIsAdding] = useState(false);
  const [newSubName, setNewSubName] = useState('');
  const [newSubClass, setNewSubClass] = useState('');
  
  // Topic search & filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Not Started' | 'Partial' | 'Mastered'>('All');
  
  // Track open custom status dropdown
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // Track inline topic name input states per subject
  const [newTopicInputs, setNewTopicInputs] = useState<{ [subjId: string]: string }>({});

  const classes = ['All', ...Array.from(new Set(subjects.map(s => s.classLevel)))].sort();
  const streams: (StreamType | 'All')[] = ['All', 'Science', 'Commerce', 'Humanities', 'General'];

  const filteredSubjects = subjects.filter(s => {
    const classMatch = selectedClass === 'All' || s.classLevel === selectedClass;
    const streamMatch = selectedStream === 'All' || s.stream === selectedStream;
    return classMatch && streamMatch;
  });

  // Calculate Syllabus Board Level Diagnostic Metrics
  const allSubTopics = subjects.flatMap(s => s.topics);
  const totalTopicCount = allSubTopics.length || 1;
  const masteredCount = allSubTopics.filter(t => t.revisionStatus === 'Mastered').length;
  const partialCount = allSubTopics.filter(t => t.revisionStatus === 'Partial').length;
  const notStartedCount = allSubTopics.filter(t => !t.revisionStatus || t.revisionStatus === 'Not Started').length;
  const masteryPercentage = Math.round((masteredCount / totalTopicCount) * 100);
  const activeFocusIndex = Math.round(((masteredCount + (partialCount * 0.5)) / totalTopicCount) * 100);

  const handleSubmitSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSubName && newSubClass) {
      onAddSubject(newSubName, newSubClass);
      setNewSubName('');
      setNewSubClass('');
      setIsAdding(false);
    }
  };

  const handleInlineAddTopicSubmit = (subjId: string) => {
    const topicName = newTopicInputs[subjId]?.trim();
    if (topicName) {
      onAddTopic(subjId, topicName);
      setNewTopicInputs(prev => ({ ...prev, [subjId]: '' }));
    }
  };

  const getSubjectIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('math')) return 'fa-cube';
    if (n.includes('phys')) return 'fa-atom';
    if (n.includes('comp') || n.includes('cs')) return 'fa-code';
    if (n.includes('bio')) return 'fa-dna';
    if (n.includes('hist') || n.includes('landmark')) return 'fa-landmark';
    if (n.includes('geo')) return 'fa-earth-americas';
    if (n.includes('chem')) return 'fa-flask-vial';
    if (n.includes('acc') || n.includes('account')) return 'fa-calculator';
    if (n.includes('bst') || n.includes('business')) return 'fa-briefcase';
    if (n.includes('eco')) return 'fa-arrow-trend-up';
    if (n.includes('pol') || n.includes('ps')) return 'fa-gavel';
    return 'fa-book-open-reader';
  };

  const getStatusConfig = (status: SyllabusTopic['revisionStatus']) => {
    switch (status) {
      case 'Mastered':
        return { 
          color: 'text-emerald-600 dark:text-emerald-400', 
          bg: 'bg-emerald-500/10', 
          border: 'border-emerald-500/10', 
          icon: 'fa-circle-check',
          glow: ''
        };
      case 'Partial':
        return { 
          color: 'text-amber-605 dark:text-amber-400', 
          bg: 'bg-amber-500/10', 
          border: 'border-amber-500/10', 
          icon: 'fa-circle-half-stroke',
          glow: ''
        };
      default:
        return { 
          color: 'text-stone-500 dark:text-zinc-500', 
          bg: 'bg-stone-550/10 dark:bg-zinc-800/20', 
          border: 'border-stone-200 dark:border-zinc-800/40', 
          icon: 'fa-circle-dot',
          glow: ''
        };
    }
  };

  return (
    <div className="space-y-10 animate-fadeIn pb-24">
      <header className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div>
          <h2 className={`text-4xl font-extrabold tracking-tight ${isDark ? 'text-zinc-100' : 'text-stone-900'}`}>
            Syllabus <span className="bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">Board</span>
          </h2>
          <p className="text-stone-500 font-medium text-sm mt-1">Configure and monitor specific study scopes across academic chapters.</p>
        </div>
        
        <div className="flex flex-wrap gap-3.5">
          <div className={`flex p-1 rounded-xl border ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-stone-50 border-stone-200/50'}`}>
            {streams.map(stream => (
              <button
                key={stream}
                onClick={() => setSelectedStream(stream)}
                className={`px-3.5 py-2 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  selectedStream === stream 
                    ? 'bg-indigo-600 text-white shadow-sm' 
                    : 'text-stone-400 hover:text-stone-600'
                }`}
              >
                {stream}
              </button>
            ))}
          </div>

          <select 
            className={`px-4 py-2.5 rounded-xl border font-bold text-[10px] uppercase tracking-wider outline-none transition-all cursor-pointer ${isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-300' : 'bg-white border-stone-200 text-stone-650'}`}
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
          >
            {classes.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          
          <button 
            onClick={() => setIsAdding(true)}
            className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-[10px] uppercase tracking-wider shadow-md cursor-pointer transition-all"
          >
            <i className="fa-solid fa-plus mr-1.5 text-[10px]"></i> Subject
          </button>
        </div>
      </header>

      {/* METRIC BENTO-GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Core Orbit Mastery index */}
        <div className={`p-6 rounded-[2rem] border flex items-center justify-between ${isDark ? 'bg-zinc-950/20 border-zinc-805' : 'bg-white border-stone-200/40 shadow-sm'}`}>
          <div className="space-y-1">
            <span className="text-[9px] font-black uppercase text-stone-400 tracking-wider">Board Orbit index</span>
            <p className={`text-2xl font-extrabold tracking-tight ${isDark ? 'text-zinc-100' : 'text-stone-900'}`}>{activeFocusIndex}%</p>
            <p className="text-[10px] text-stone-500 font-semibold leading-none">Weighted Completion</p>
          </div>
          <div className="relative w-14 h-14 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90">
              <circle cx="28" cy="28" r="22" stroke="rgba(128,128,128,0.06)" strokeWidth="3" fill="none" />
              <circle cx="28" cy="28" r="22" stroke="#6366F1" strokeWidth="4.5" strokeDasharray={138} strokeDashoffset={138 - (activeFocusIndex / 100) * 138} strokeLinecap="round" fill="none" className="transition-all duration-1000" />
            </svg>
            <i className="fa-solid fa-compass absolute text-indigo-500 text-xs"></i>
          </div>
        </div>

        {/* Mastered statistics */}
        <div className={`p-6 rounded-[2rem] border flex items-center justify-between ${isDark ? 'bg-zinc-950/20 border-zinc-805' : 'bg-white border-stone-200/40 shadow-sm'}`}>
          <div className="space-y-1">
            <span className="text-[9px] font-black uppercase text-emerald-500 tracking-wider">Concept Mastery</span>
            <p className="text-2xl font-extrabold tracking-tight text-emerald-500">{masteredCount} <span className="text-xs font-bold text-stone-400">Chapters</span></p>
            <p className="text-[10px] text-stone-500 font-semibold leading-none">Perfect Retention Rate</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-505 flex items-center justify-center border border-emerald-500/10">
            <i className="fa-solid fa-heart-pulse text-base"></i>
          </div>
        </div>

        {/* Partial stats */}
        <div className={`p-6 rounded-[2rem] border flex items-center justify-between ${isDark ? 'bg-zinc-950/20 border-zinc-805' : 'bg-white border-stone-200/40 shadow-sm'}`}>
          <div className="space-y-1">
            <span className="text-[9px] font-black uppercase text-amber-500 tracking-wider">Partial Retain</span>
            <p className="text-2xl font-extrabold tracking-tight text-amber-550 dark:text-amber-400">{partialCount} <span className="text-xs font-bold text-stone-400">Chapters</span></p>
            <p className="text-[10px] text-stone-500 font-semibold leading-none">Active Work Required</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-505 flex items-center justify-center border border-amber-500/10">
            <i className="fa-solid fa-hourglass-half text-base"></i>
          </div>
        </div>

        {/* Backlogs */}
        <div className={`p-6 rounded-[2rem] border flex items-center justify-between ${isDark ? 'bg-zinc-950/20 border-zinc-805' : 'bg-white border-stone-200/40 shadow-sm'}`}>
          <div className="space-y-1">
            <span className="text-[9px] font-black uppercase text-stone-400 tracking-wider">Backlog Space</span>
            <p className={`text-2xl font-extrabold tracking-tight ${isDark ? 'text-zinc-150' : 'text-stone-900'}`}>{notStartedCount} <span className="text-xs font-semibold text-stone-405">Chapters</span></p>
            <p className="text-[10px] text-stone-550 font-semibold leading-none">Not yet initiated</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-stone-500/10 text-stone-400 flex items-center justify-center border border-stone-550/10">
            <i className="fa-solid fa-list-check text-base"></i>
          </div>
        </div>
      </div>

      {/* Interactive Search bar */}
      <div className={`p-6 rounded-[2rem] border ${isDark ? 'bg-zinc-950/20 border-zinc-805' : 'bg-white border-stone-200/40 shadow-sm'} flex flex-col md:flex-row gap-6 items-center justify-between`}>
        <div className="relative w-full md:w-80">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 text-sm"><i className="fa-solid fa-magnifying-glass"></i></span>
          <input 
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Find chapters or topics..."
            className={`w-full py-3 pl-10 pr-10 rounded-xl text-xs font-semibold outline-none border transition-all ${isDark ? 'bg-zinc-900/60 border-zinc-800 text-white placeholder-zinc-600 focus:border-indigo-500' : 'bg-stone-50 border-stone-200 text-stone-900 placeholder-stone-400 focus:border-stone-300'}`}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700">
              <i className="fa-solid fa-circle-xmark"></i>
            </button>
          )}
        </div>
        
        <div className="flex flex-wrap items-center gap-3.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Filter Revision:</span>
          <div className={`flex p-1 rounded-xl border ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-stone-50 border-stone-205/50'}`}>
            {(['All', 'Not Started', 'Partial', 'Mastered'] as const).map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3.5 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  statusFilter === st 
                    ? 'bg-indigo-600 text-white shadow-sm' 
                    : 'text-stone-400 hover:text-stone-650'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isAdding && (
        <div className={`p-8 rounded-[2rem] border animate-slideDown mb-8 ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-stone-200/40 shadow-xl'}`}>
           <h3 className={`text-base font-extrabold mb-6 tracking-tight ${isDark ? 'text-zinc-100' : 'text-stone-900'}`}>New Subject Parameters</h3>
           <form onSubmit={handleSubmitSubject} className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <input 
                autoFocus
                className={`px-5 py-3.5 rounded-xl border text-xs font-semibold outline-none focus:border-indigo-505 ${isDark ? 'bg-zinc-950/40 border-zinc-800 text-white placeholder-zinc-650' : 'bg-stone-50 border-stone-200 text-stone-900 placeholder-stone-450'}`}
                placeholder="Subject Name (e.g. Cognitive Psychology)"
                value={newSubName}
                onChange={(e) => setNewSubName(e.target.value)}
              />
              <input 
                className={`px-5 py-3.5 rounded-xl border text-xs font-semibold outline-none focus:border-indigo-505 ${isDark ? 'bg-zinc-950/40 border-zinc-800 text-white placeholder-zinc-650' : 'bg-stone-50 border-stone-200 text-stone-900 placeholder-stone-450'}`}
                placeholder="Class (e.g. Class 12)"
                value={newSubClass}
                onChange={(e) => setNewSubClass(e.target.value)}
              />
              <div className="md:col-span-2 flex justify-end gap-3 mt-2">
                <button type="button" onClick={() => setIsAdding(false)} className="text-stone-400 font-bold text-xs uppercase cursor-pointer">Cancel</button>
                <button type="submit" className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold uppercase tracking-wider text-[10px] shadow-sm cursor-pointer">
                  Save Subject
                </button>
              </div>
           </form>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {filteredSubjects.map((subject) => {
          const displayTopics = subject.topics.filter(t => {
            const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = statusFilter === 'All' || t.revisionStatus === statusFilter;
            return matchesSearch && matchesStatus;
          });

          const completedCount = subject.topics.filter(t => t.completed).length;
          const progress = Math.round((completedCount / (subject.topics.length || 1)) * 100);

          return (
            <div key={subject.id} className="card-premium rounded-[2.5rem] p-8 group flex flex-col justify-between border border-stone-200/50 dark:border-zinc-800/40">
              <div>
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-indigo-500/10 text-indigo-500 rounded-2xl flex items-center justify-center text-2xl border border-indigo-500/10 transition-transform group-hover:rotate-6">
                      <i className={`fa-solid ${getSubjectIcon(subject.name)}`}></i>
                    </div>
                    <div>
                      <h3 className={`text-xl font-extrabold tracking-tight ${isDark ? 'text-zinc-100' : 'text-stone-900'}`}>{subject.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-[9px] font-bold text-stone-400 uppercase tracking-wider">{subject.classLevel}</p>
                        <div className="w-1 h-1 bg-stone-300 dark:bg-zinc-750 rounded-full"></div>
                        <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-wider">{subject.stream}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right flex flex-col items-end">
                    <span className="text-3xl font-extrabold text-indigo-500">{progress}%</span>
                    <button 
                      onClick={() => {
                        if (confirm(`Reset progress for ${subject.name}?`)) {
                          onResetSubject(subject.id);
                        }
                      }}
                      className="text-[8px] font-bold text-red-400 bg-red-400/5 hover:bg-red-400/10 border border-red-400/10 px-2.5 py-1 rounded-lg uppercase tracking-wider mt-1.5 transition-all cursor-pointer"
                      title="Reset progress"
                    >
                      <i className="fa-solid fa-rotate-left mr-1"></i> Reset progress
                    </button>
                  </div>
                </div>
                
                <div className={`w-full h-2 rounded-full mb-8 overflow-hidden ${isDark ? 'bg-zinc-800' : 'bg-stone-100'}`}>
                  <div 
                    className="bg-indigo-600 h-full rounded-full transition-all duration-1000 ease-out" 
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>

                <div className="space-y-3.5 max-h-[350px] overflow-y-auto pr-1 custom-scrollbar">
                  {displayTopics.map((topic) => {
                    const statusCfg = getStatusConfig(topic.revisionStatus);
                    const dropdownId = `${subject.id}-${topic.id}`;
                    const isDropdownOpen = openDropdownId === dropdownId;

                    return (
                      <div 
                        key={topic.id} 
                        className={`flex items-center p-4 rounded-xl border transition-all select-none relative ${
                          topic.completed 
                            ? (isDark ? 'bg-[#18181F] border-indigo-500/20' : 'bg-indigo-50/20 border-indigo-150/40 shadow-sm') 
                            : (isDark ? 'bg-zinc-900/20 border-zinc-800/65 hover:border-zinc-700' : 'bg-white border-stone-200/55 hover:border-indigo-100')
                        }`}
                      >
                        <div className="relative flex items-center justify-center mr-4">
                          <input
                            type="checkbox"
                            checked={topic.completed}
                            onChange={() => onToggleTopic(subject.id, topic.id)}
                            className="w-5 h-5 rounded hover:border-indigo-500 cursor-pointer accent-indigo-650"
                          />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <span className={`text-sm font-semibold tracking-tight block truncate ${topic.completed ? (isDark ? 'text-zinc-600 line-through' : 'text-stone-400 line-through') : (isDark ? 'text-zinc-200' : 'text-stone-750')}`}>
                            {topic.name}
                          </span>
                          
                          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                            <div className="relative">
                              <button
                                onClick={() => setOpenDropdownId(isDropdownOpen ? null : dropdownId)}
                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[8px] font-bold uppercase tracking-wider transition-all cursor-pointer ${statusCfg.bg} ${statusCfg.color} ${statusCfg.border} hover:scale-103`}
                              >
                                <i className={`fa-solid ${statusCfg.icon}`}></i>
                                <span>{topic.revisionStatus}</span>
                                <i className="fa-solid fa-chevron-down text-[7px] opacity-60 ml-0.5"></i>
                              </button>

                              {/* Dropdown Popover */}
                              {isDropdownOpen && (
                                <div className={`absolute left-0 mt-2.5 w-40 rounded-xl p-1.5 z-40 border shadow-md animate-scaleUp ${isDark ? 'bg-[#17171C] border-zinc-800 text-white' : 'bg-white border-stone-200/80 text-stone-800'}`}>
                                  <p className="text-[7.5px] font-bold uppercase tracking-wider text-stone-400 px-3.5 py-1 mb-1 border-b border-stone-200/40 dark:border-zinc-800">Assign Status</p>
                                  <button
                                    onClick={() => {
                                      onUpdateRevisionStatus(subject.id, topic.id, 'Not Started');
                                      setOpenDropdownId(null);
                                    }}
                                    className="w-full text-left px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider flex items-center gap-1.5 text-stone-450 hover:bg-stone-50 dark:hover:bg-zinc-800 cursor-pointer"
                                  >
                                    <span className="w-1.5 h-1.5 rounded-full bg-stone-400"></span> Not Started
                                  </button>
                                  <button
                                    onClick={() => {
                                      onUpdateRevisionStatus(subject.id, topic.id, 'Partial');
                                      setOpenDropdownId(null);
                                    }}
                                    className="w-full text-left px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider flex items-center gap-1.5 text-amber-500 hover:bg-amber-100/10 dark:hover:bg-zinc-800 cursor-pointer"
                                  >
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Partial Focus
                                  </button>
                                  <button
                                    onClick={() => {
                                      onUpdateRevisionStatus(subject.id, topic.id, 'Mastered');
                                      setOpenDropdownId(null);
                                    }}
                                    className="w-full text-left px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider flex items-center gap-1.5 text-emerald-500 hover:bg-emerald-100/10 dark:hover:bg-zinc-800 cursor-pointer"
                                  >
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Mastered
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            if (confirm(`Remove topic "${topic.name}"?`)) {
                              onDeleteTopic(subject.id, topic.id);
                            }
                          }}
                          className="w-7 h-7 rounded-lg bg-red-400/5 hover:bg-red-400/15 text-red-450 border border-red-500/10 flex items-center justify-center transition-all ml-4 shrink-0 cursor-pointer"
                          title="Remove Topic"
                        >
                          <i className="fa-solid fa-trash text-[10px]"></i>
                        </button>
                      </div>
                    );
                  })}
                  {displayTopics.length === 0 && (
                    <div className="py-8 text-center text-[10px] uppercase font-bold tracking-wider text-stone-450">
                      No matches registered
                    </div>
                  )}
                </div>
              </div>

              {/* Add Custom Topic Box */}
              <div className="mt-6 pt-5 border-t border-stone-200/50 dark:border-zinc-800/40">
                <div className="flex gap-2.5 items-center">
                  <input 
                    type="text"
                    value={newTopicInputs[subject.id] || ''}
                    onChange={e => setNewTopicInputs(prev => ({ ...prev, [subject.id]: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && handleInlineAddTopicSubmit(subject.id)}
                    placeholder="+ Add custom chapter/topic..."
                    className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold outline-none border transition-all ${isDark ? 'bg-zinc-950/40 border-zinc-800 text-white placeholder-zinc-650 focus:border-indigo-500' : 'bg-stone-50 border-stone-205 text-stone-850 placeholder-stone-400 focus:border-stone-300'}`}
                  />
                  <button 
                    onClick={() => handleInlineAddTopicSubmit(subject.id)}
                    className="p-3 bg-indigo-600 text-white rounded-lg hover:scale-105 active:scale-95 transition-all text-xs cursor-pointer shadow-sm"
                    title="Add Topic"
                  >
                    <i className="fa-solid fa-plus font-black"></i>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        
        {filteredSubjects.length === 0 && (
          <div className="col-span-full py-24 text-center text-stone-400">
            <i className="fa-solid fa-hourglass-empty text-5xl mb-4 text-stone-300"></i>
            <h3 className="text-xl font-bold tracking-tight">No registered subjects discovered</h3>
            <p className="font-semibold text-xs text-stone-450 max-w-sm mx-auto mt-1">Refine your active stream tags or add a custom subject context to activate the board.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SyllabusTracker;
