import React, { useState, useEffect } from 'react';
import { Doubt, ThemeMode } from '../types';

interface DoubtVaultProps {
  doubts: Doubt[];
  onSaveDoubt: (doubt: Omit<Doubt, 'id' | 'timestamp' | 'resolved'>) => void;
  onToggleResolved: (id: string) => void;
  onDeleteDoubt: (id: string) => void;
  theme: ThemeMode;
}

interface DiagramNode {
  id: string;
  label: string;
  color: string;
  connections: string[];
  explanation: string;
}

interface StepByStep {
  stepNumber: number;
  title: string;
  explanation: string;
}

interface SolveResult {
  answer: string;
  voiceIntro: string;
  quickSummary: string;
  steps: StepByStep[];
  diagramNodes: DiagramNode[];
}

const DoubtVault: React.FC<DoubtVaultProps> = ({ 
  doubts, 
  onSaveDoubt, 
  onToggleResolved, 
  onDeleteDoubt, 
  theme 
}) => {
  const isDark = theme === 'dark';

  // State: Tab selector
  const [activeTab, setActiveTab] = useState<'flashcards' | 'solver'>('flashcards');

  // Manual doubt creation state (for tab 1)
  const [showForm, setShowForm] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  const [newSubject, setNewSubject] = useState('Physics');

  // Interactive filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState('All');
  
  // Track flipped card IDs
  const [flippedIds, setFlippedIds] = useState<Set<string>>(new Set());

  // Smart Solver State (for tab 2)
  const [solverInput, setSolverInput] = useState('');
  const [isSolving, setIsSolving] = useState(false);
  const [solveResult, setSolveResult] = useState<SolveResult | null>(null);
  const [selectedNode, setSelectedNode] = useState<DiagramNode | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [solverSubject, setSolverSubject] = useState('Physics');

  // Subjects derived dynamically
  const subjectsList = ['All', ...Array.from(new Set(doubts.map(d => d.subject)))];

  const handleToggleFlip = (id: string) => {
    setFlippedIds(prev => {
      const copy = new Set(prev);
      if (copy.has(id)) {
        copy.delete(id);
      } else {
        copy.add(id);
      }
      return copy;
    });
  };

  const handleCreateDoubtSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newQuestion.trim() && newAnswer.trim()) {
      onSaveDoubt({
        question: newQuestion,
        answer: newAnswer,
        subject: newSubject
      });
      setNewQuestion('');
      setNewAnswer('');
      setShowForm(false);
    }
  };

  // Solver Trigger
  const handleSolveDoubt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!solverInput.trim()) return;

    setIsSolving(true);
    setSolveResult(null);
    setSelectedNode(null);

    // Stop speaking if active
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }

    try {
      const response = await fetch('/api/gemini/solve-doubt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: solverInput })
      });

      if (!response.ok) {
        throw new Error(`Solving endpoint returned status ${response.status}`);
      }

      const data = await response.json();
      setSolveResult(data);
      
      // Auto selecting the first visual conceptual node if present
      if (data.diagramNodes && data.diagramNodes.length > 0) {
        setSelectedNode(data.diagramNodes[0]);
      }
    } catch (err) {
      console.error("Doubt processing error:", err);
      alert("Failed to reach Orbit Doubt service. Make sure your local server is online.");
    } finally {
      setIsSolving(false);
    }
  };

  // TTS audio synthesis welcome intro
  const handleStartSpeaking = (text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const handleStopSpeaking = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  // Save the custom resolved doubt inside their persistent review list
  const handleSaveSolvedCard = () => {
    if (!solveResult) return;
    onSaveDoubt({
      question: solverInput,
      answer: solveResult.answer,
      subject: solverSubject
    });
    alert(`Success! Doubts card saved under subject ${solverSubject}.`);
  };

  // Clean speaking state on tab exit
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [activeTab]);

  // Filter list
  const filteredDoubts = doubts.filter(d => {
    const matchesSearch = d.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          d.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = selectedSubjectFilter === 'All' || d.subject === selectedSubjectFilter;
    return matchesSearch && matchesSubject;
  });

  return (
    <div className="space-y-10 animate-fadeIn pb-24 text-left">
      
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h2 className={`text-4xl font-extrabold tracking-tight ${isDark ? 'text-zinc-100' : 'text-stone-900'}`}>
            Doubt <span className="bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">Vault</span>
          </h2>
          <p className="text-stone-500 font-medium text-sm mt-1 font-semibold">Review saved concepts and master challenging curriculum topics.</p>
        </div>
        
        {activeTab === 'flashcards' && (
          <button 
            id="create-manual-flashcard-btn"
            onClick={() => setShowForm(!showForm)}
            className="px-5 py-3.5 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl font-bold text-[10px] uppercase tracking-wider shadow-md cursor-pointer transition-all"
          >
            {showForm ? 'Close Designer' : '+ Create Flashcard'}
          </button>
        )}
      </header>

      {/* Tabs Selector Navigation bar */}
      <div className="flex border-b border-stone-200/55 dark:border-zinc-800/80 p-0.5 gap-2">
        <button
          id="tab-select-flashcards"
          onClick={() => setActiveTab('flashcards')}
          className={`pb-3.5 px-6 font-bold text-xs uppercase tracking-widest border-b-2 cursor-pointer transition-all ${
            activeTab === 'flashcards'
              ? 'border-indigo-600 text-indigo-500'
              : 'border-transparent text-stone-400 hover:text-stone-600'
          }`}
        >
          <i className="fa-solid fa-layer-group mr-1.5"></i> Vault Flashcards ({doubts.length})
        </button>
        <button
          id="tab-select-solver"
          onClick={() => setActiveTab('solver')}
          className={`pb-3.5 px-6 font-bold text-xs uppercase tracking-widest border-b-2 cursor-pointer transition-all ${
            activeTab === 'solver'
              ? 'border-indigo-600 text-indigo-500'
              : 'border-transparent text-stone-400 hover:text-stone-600'
          }`}
        >
          <i className="fa-solid fa-wand-magic-sparkles mr-1.5 text-indigo-505 animate-pulse"></i> Smart AI Solver <span className="bg-indigo-500/10 text-indigo-550 border border-indigo-500/10 px-2 py-0.5 rounded text-[8px] tracking-tight">Premium</span>
        </button>
      </div>

      {/* VIEW 1: FLASHCARDS MANAGER */}
      {activeTab === 'flashcards' && (
        <div className="space-y-10">
          
          {/* Spaced repetition card explanation */}
          <div className={`p-8 rounded-[2.5rem] border ${isDark ? 'bg-zinc-900/20 border-zinc-805' : 'bg-stone-50/50 border-stone-200/50 shadow-sm'} space-y-6`}>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center text-lg shrink-0 border border-indigo-500/10">
                <i className="fa-solid fa-graduation-cap"></i>
              </div>
              <div>
                <h4 className={`text-lg font-extrabold tracking-tight ${isDark ? 'text-zinc-100' : 'text-stone-900'}`}>Orbit Active Spaced Recall system</h4>
                <p className="text-xs text-stone-500 mt-1 leading-relaxed font-semibold">
                  The Doubt Vault stores challenging concepts compiled during your study sessions. 
                  Use this workspace to solidify memory, test definitions, and archive progress as you master each concept.
                </p>
              </div>
            </div>

            {/* 3 Step Visual Guide */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2 border-t border-stone-200/40 dark:border-zinc-805/60">
              <div className="flex gap-3">
                <span className="w-6 h-6 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center text-[10px] font-black shrink-0 border border-indigo-500/10">1</span>
                <div>
                  <h5 className={`text-xs font-bold ${isDark ? 'text-zinc-200' : 'text-stone-800'}`}>Build cards</h5>
                  <p className="text-[10px] text-stone-500 mt-0.5 leading-snug font-semibold">Create key concept query cards manually or save them from your AI Tutor conversation logs.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="w-6 h-6 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center text-[10px] font-black shrink-0 border border-indigo-500/10">2</span>
                <div>
                  <h5 className={`text-xs font-bold ${isDark ? 'text-zinc-200' : 'text-stone-800'}`}>Flip to test</h5>
                  <p className="text-[10px] text-stone-500 mt-0.5 leading-snug font-semibold">Tap any card's body or click "Reveal" to check the verified answer and test your concept memory.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-[10px] font-black shrink-0 border border-emerald-500/10">3</span>
                <div>
                  <h5 className={`text-xs font-bold ${isDark ? 'text-emerald-500' : 'text-stone-800'}`}>Master & archive</h5>
                  <p className="text-[10px] text-stone-500 mt-0.5 leading-snug font-semibold">Mark cards as "Mastered ✓" when you no longer struggle with them, syncing your overall subject orbits.</p>
                </div>
              </div>
            </div>
          </div>

          {showForm && (
            <form onSubmit={handleCreateDoubtSubmit} className={`p-8 rounded-[2.5rem] border animate-slideDown mb-8 ${isDark ? 'bg-zinc-900 border-zinc-805' : 'bg-white border-stone-200/40 shadow-xl'}`}>
              <h3 className={`text-base font-extrabold mb-6 tracking-tight ${isDark ? 'text-zinc-150' : 'text-stone-905'}`}>Construct Review Card</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                <div className="space-y-1.5 text-left">
                  <label className="text-[9px] font-bold uppercase text-stone-400 tracking-wider">Concept Query</label>
                  <textarea
                    id="doubt-manual-q"
                    rows={3} 
                    required
                    className={`w-full px-4 py-3 rounded-xl border text-xs font-semibold outline-none transition-all ${isDark ? 'bg-zinc-950/40 border-zinc-800 text-white focus:border-indigo-505' : 'bg-stone-50 border-stone-200 text-stone-900 focus:focus-border-stone-300'}`}
                    placeholder="e.g. What is Lens Maker's Formula in Wave Optics?"
                    value={newQuestion}
                    onChange={e => setNewQuestion(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5 text-left">
                  <label className="text-[9px] font-bold uppercase text-stone-400 tracking-wider font-semibold">Verified Solution Explanation</label>
                  <textarea
                    id="doubt-manual-a"
                    rows={3}
                    required
                    className={`w-full px-4 py-3 rounded-xl border text-xs font-semibold outline-none transition-all ${isDark ? 'bg-zinc-950/40 border-zinc-800 text-white focus:border-indigo-505' : 'bg-stone-50 border-stone-200 text-stone-900 focus:focus-border-stone-300'}`}
                    placeholder="e.g. 1/f = (μ - 1)(1/R1 - 1/R2) where f is focal length, μ is index..."
                    value={newAnswer}
                    onChange={e => setNewAnswer(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1 flex items-center gap-2.5">
                  <span className="text-[9px] font-bold uppercase text-stone-400 tracking-wider">Subject Tag:</span>
                  <select
                    id="doubt-manual-subject"
                    className={`px-3 py-1.5 border rounded-xl font-bold text-xs outline-none transition-all cursor-pointer ${isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-300' : 'bg-white border-stone-200 text-stone-650'}`}
                    value={newSubject}
                    onChange={e => setNewSubject(e.target.value)}
                  >
                    <option value="Physics">Physics</option>
                    <option value="Mathematics">Mathematics</option>
                    <option value="Chemistry">Chemistry</option>
                    <option value="Biology">Biology</option>
                    <option value="History">History</option>
                    <option value="English">English</option>
                    <option value="Computer Science">Computer Science</option>
                    <option value="General">General</option>
                  </select>
                </div>
                <div className="flex gap-4 self-end">
                  <button type="button" onClick={() => setShowForm(false)} className="text-stone-400 font-bold text-xs uppercase cursor-pointer">Cancel</button>
                  <button id="save-manual-doubt-btn" type="submit" className="px-6 py-3 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl font-bold uppercase tracking-wider text-[9px] cursor-pointer">Save Flashcard</button>
                </div>
              </div>
            </form>
          )}

          {/* Filters */}
          <div className={`p-6 rounded-[2rem] border ${isDark ? 'bg-zinc-950/20 border-zinc-805' : 'bg-white border-stone-200/40 shadow-sm'} flex flex-col md:flex-row gap-6 items-center justify-between`}>
            <div className="relative w-full md:w-85">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 text-sm"><i className="fa-solid fa-magnifying-glass"></i></span>
              <input 
                id="doubt-vault-search"
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search questions or keywords..."
                className={`w-full py-2.5 pl-10 pr-4 rounded-xl text-xs font-semibold outline-none border transition-all ${isDark ? 'bg-zinc-900/60 border-zinc-800 text-white placeholder-zinc-650' : 'bg-stone-50 border-stone-200 text-stone-900 placeholder-stone-400'}`}
              />
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Select Subject:</span>
              <div className="flex flex-wrap gap-1 bg-stone-50 dark:bg-zinc-900/40 border border-stone-200/50 dark:border-zinc-800 p-1 rounded-xl">
                {subjectsList.map(subj => (
                  <button
                    key={subj}
                    onClick={() => setSelectedSubjectFilter(subj)}
                    className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      selectedSubjectFilter === subj 
                        ? 'bg-indigo-650 text-white' 
                        : 'text-stone-450 hover:text-stone-705'
                    }`}
                  >
                    {subj}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* DOUBTS FLASHCARDGRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {filteredDoubts.map(doubt => {
              const isFlipped = flippedIds.has(doubt.id);
              return (
                <div 
                  key={doubt.id} 
                  id={`doubt-card-${doubt.id}`}
                  onClick={() => handleToggleFlip(doubt.id)}
                  className={`p-6 lg:p-8 rounded-[2.5rem] border flex flex-col justify-between min-h-[280px] transition-all cursor-pointer relative select-none group transition-all duration-300 hover:shadow-lg active:scale-[0.99] ${
                    doubt.resolved 
                      ? 'border-emerald-500/20 bg-emerald-500/[0.01]' 
                      : isDark ? 'bg-zinc-950/20 border-zinc-805 hover:border-zinc-700 shadow-md shadow-black/5' : 'bg-white border-stone-200/50 shadow-md shadow-stone-200/10 hover:border-stone-300'
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-center mb-5 gap-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-2">
                        <span className="text-[8px] px-2.5 py-1 bg-indigo-500/10 text-indigo-500 rounded-lg font-bold uppercase tracking-wider border border-indigo-500/10">Revision {doubt.id.substring(0,3)}</span>
                        <span className="text-[8px] px-2.5 py-1 bg-stone-500/10 text-stone-450 rounded-lg font-bold uppercase tracking-wider">{doubt.subject}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleResolved(doubt.id);
                          }}
                          className={`px-2.5 py-1.5 rounded-lg text-[8px] font-bold uppercase tracking-wider border cursor-pointer transition-all ${
                            doubt.resolved 
                              ? 'bg-emerald-600 border-emerald-600 text-white' 
                              : 'bg-transparent text-stone-400 border-stone-250 dark:border-zinc-800 hover:text-stone-600'
                          }`}
                        >
                          <i className={`fa-solid ${doubt.resolved ? 'fa-circle-check mr-1' : 'fa-circle mr-1'}`}></i>
                          <span>{doubt.resolved ? 'Mastered ✓' : 'Solve'}</span>
                        </button>
                        
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteDoubt(doubt.id);
                          }}
                          className="w-7 h-7 rounded-lg bg-red-400/5 hover:bg-red-400/15 text-red-400 border border-red-500/10 flex items-center justify-center transition-all cursor-pointer"
                          title="Remove Card"
                        >
                          <i className="fa-solid fa-trash text-[10px]"></i>
                        </button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-start gap-4">
                        <span className="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center text-xs text-indigo-505 font-extrabold select-none shrink-0 border border-indigo-500/10">Q</span>
                        <p className={`text-base font-bold leading-snug flex-1 tracking-tight ${isDark ? 'text-zinc-150' : 'text-stone-900'}`}>{doubt.question}</p>
                      </div>

                      <div className="border-t border-stone-150 dark:border-zinc-800/60 pt-4 mt-2">
                        {isFlipped ? (
                          <div className="flex items-start gap-4 animate-scaleUp text-left">
                            <span className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-xs text-emerald-500 font-extrabold select-none shrink-0 border border-emerald-500/10">A</span>
                            <div className={`p-4 rounded-xl text-xs lg:text-sm leading-relaxed border flex-1 font-semibold ${isDark ? 'bg-zinc-900/60 border-zinc-805 text-zinc-300' : 'bg-stone-55 border-stone-150 text-stone-600 shadow-sm'}`}>
                              {doubt.answer}
                            </div>
                          </div>
                        ) : (
                          <div className="py-5 flex flex-col items-center justify-center rounded-xl border border-dashed border-stone-250 dark:border-zinc-800 bg-stone-50/50 dark:bg-zinc-950/40 text-center opacity-70 group-hover:opacity-100 transition-opacity">
                            <i className="fa-solid fa-eye-slash text-stone-400 text-sm mb-1.5 animate-pulse"></i>
                            <span className="text-[9px] font-bold uppercase tracking-wider text-stone-450">Explanation is hidden • Click card to flip over</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Reveal trigger */}
                  <div className="mt-4 flex justify-between items-center border-t border-stone-100 dark:border-zinc-805/40 pt-3">
                    <span className="text-[8px] font-bold uppercase tracking-wider text-stone-400 block"><i className="fa-solid fa-arrows-rotate mr-1"></i> Continuous Recall Ready</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleFlip(doubt.id);
                      }}
                      className={`text-[8.5px] font-bold uppercase tracking-wider px-4 py-2 rounded-lg border flex items-center gap-1.5 transition-all cursor-pointer ${
                        isFlipped 
                          ? 'bg-stone-150/40 dark:bg-zinc-900 text-stone-450 border-stone-200 dark:border-zinc-800' 
                          : 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20 hover:bg-indigo-500/20'
                      }`}
                    >
                      <i className={`fa-solid ${isFlipped ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                      <span>{isFlipped ? 'Hide solution' : 'Reveal solution'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
            
            {filteredDoubts.length === 0 && (
              <div className="col-span-full py-20 text-center text-stone-450">
                <i className="fa-solid fa-bookmark text-4xl mb-4 text-stone-300 font-normal"></i>
                <h3 className="text-lg font-bold tracking-tight">No flashcards indexed</h3>
                <p className="font-semibold text-xs mt-1">Refine your subject filters or ask questions inside the Tutor Space to save core flashcards.</p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* VIEW 2: AI SMART DOUBT SOLVER */}
      {activeTab === 'solver' && (
        <div className="space-y-8 animate-fadeIn">
          
          {/* Pitch intro */}
          <div className={`p-8 rounded-[2.5rem] border ${isDark ? 'bg-zinc-900/20 border-zinc-805' : 'bg-stone-50/50 border-stone-200/50 shadow-sm'} flex flex-col md:flex-row gap-6 items-center justify-between`}>
            <div className="flex items-start gap-4 max-w-2xl text-left">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center text-lg shrink-0 border border-indigo-500/10">
                <i className="fa-solid fa-wand-magic-sparkles"></i>
              </div>
              <div>
                <h4 className={`text-lg font-extrabold tracking-tight ${isDark ? 'text-zinc-100' : 'text-stone-900'}`}>Visual Step-by-Step AI Doubt solver</h4>
                <p className="text-xs text-stone-500 mt-1 leading-relaxed font-semibold">
                  Entering any complex physics, maths, or history doubt. The system generates step-by-step logic, 
                  synthesizes a conceptual flowchart diagram mapping equations or concepts, reads a voice summary, and allows 
                  exporting the full solution card directly into your Spaced Repetition deck.
                </p>
              </div>
            </div>
            
            <div className="flex flex-col space-y-1 w-full md:w-56 text-left shrink-0">
              <label className="text-[9px] font-black uppercase text-stone-400 tracking-wider">Classification Subject:</label>
              <select
                id="solver-subject-tag-input"
                className={`w-full py-3 px-4 rounded-xl text-xs font-bold outline-none border transition-all cursor-pointer ${
                  isDark ? 'bg-zinc-950/40 border-zinc-800 text-white focus:border-indigo-505' : 'bg-white border-stone-250 text-stone-800 focus:focus-border-stone-300'
                }`}
                value={solverSubject}
                onChange={e => setSolverSubject(e.target.value)}
              >
                <option value="Physics">Physics</option>
                <option value="Mathematics">Mathematics</option>
                <option value="Chemistry">Chemistry</option>
                <option value="Biology">Biology</option>
                <option value="History">History</option>
                <option value="English">English</option>
                <option value="General">General</option>
              </select>
            </div>
          </div>

          {/* Form input */}
          <form onSubmit={handleSolveDoubt} className={`p-8 rounded-[2.5rem] border ${isDark ? 'bg-zinc-950/20 border-zinc-850' : 'bg-white border-stone-200/50 shadow-md'} space-y-5`}>
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase text-stone-400 tracking-wider">Doubt statement or question:</label>
              <textarea
                id="solver-doubt-input-field"
                rows={3}
                required
                value={solverInput}
                onChange={e => setSolverInput(e.target.value)}
                placeholder="e.g. Why does Lenz's law conform to the conservation of energy law? Explain step-by-step."
                className={`w-full py-3.5 px-4 rounded-xl text-xs font-semibold outline-none border transition-all ${
                  isDark 
                    ? 'bg-zinc-950/40 border-zinc-855 text-white focus:border-indigo-500' 
                    : 'bg-stone-50 border-stone-250 text-stone-900 focus:border-stone-300'
                }`}
              />
            </div>

            <button
              id="trigger-solve-doubt-btn"
              type="submit"
              disabled={isSolving}
              className="px-6 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold uppercase tracking-widest text-[9.5px] cursor-pointer disabled:opacity-50 transition-all shadow-md active:scale-95"
            >
              {isSolving ? (
                <span className="flex items-center gap-2">
                  <i className="fa-solid fa-arrows-spin animate-spin text-sm"></i> Extracting visual mechanics layers...
                </span>
              ) : (
                <span>Resolve Doubt with Visual step-by-step & Diagram <i className="fa-solid fa-chevron-right ml-1.5"></i></span>
              )}
            </button>
          </form>

          {/* Loading coordinates placeholder */}
          {isSolving && (
            <div className="py-20 text-center space-y-4">
              <i className="fa-solid fa-satellite-dish text-4xl text-indigo-500 animate-bounce"></i>
              <h5 className="font-bold text-sm tracking-tight text-stone-405">Synthesizing visual flowchart nodes & step coordinates...</h5>
              <p className="text-[10px] text-stone-400 font-semibold tracking-wide">Please wait for Gemini Model 3.5 to package diagram dependencies.</p>
            </div>
          )}

          {/* RESULTS DISPLAY CANVAS */}
          {solveResult && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left animate-scaleUp">
              
              {/* Left Column: Flowchart Nodes Diagram & TTS Auditory Controller */}
              <div className="space-y-8">
                
                {/* Voice Explanation widget banner */}
                <div className={`p-6 rounded-[2rem] border relative overflow-hidden flex flex-col justify-between ${isDark ? 'bg-zinc-950/30 border-zinc-850' : 'bg-white border-stone-200/50 shadow-md'}`}>
                  
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[8px] font-black uppercase text-indigo-500 tracking-wider">Voice explanation mode</span>
                    <span className={`w-2 h-2 rounded-full ${isSpeaking ? 'bg-emerald-500 animate-ping' : 'bg-stone-400'}`}></span>
                  </div>

                  <div className="flex gap-4 items-center">
                    <button
                      id="solver-trigger-tts"
                      onClick={() => isSpeaking ? handleStopSpeaking() : handleStartSpeaking(solveResult.voiceIntro)}
                      className={`w-11 h-11 rounded-full flex items-center justify-center text-sm cursor-pointer border transition-all ${
                        isSpeaking 
                          ? 'bg-red-500 text-white border-red-500 animate-pulse' 
                          : 'bg-indigo-500/10 text-indigo-500 border-indigo-500/25 hover:bg-indigo-505/20'
                      }`}
                    >
                      <i className={`fa-solid ${isSpeaking ? 'fa-square' : 'fa-volume-high'}`}></i>
                    </button>
                    <div>
                      <h5 className="text-xs font-black tracking-tight">Audio Explanation Welcome</h5>
                      <p className="text-[10.5px] text-stone-500 leading-normal mt-0.5 font-semibold">" {solveResult.voiceIntro} "</p>
                    </div>
                  </div>

                  {/* Animated Wave visual indicator if speaking */}
                  {isSpeaking && (
                    <div className="mt-4 flex items-center gap-1 justify-center py-1">
                      {[1, 2, 3, 4, 5, 4, 3, 2, 1].map((h, i) => (
                        <span key={i} className="w-1 bg-[#6366F1] rounded-full transition-all duration-300 animate-pulse" style={{ height: `${h * 4}px` }}></span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Conceptual flowchart visual box */}
                <div className={`p-6 rounded-[2rem] border ${isDark ? 'bg-zinc-950/30 border-zinc-850' : 'bg-white border-stone-200/50 shadow-md'} space-y-5`}>
                  <div className="border-b pb-4">
                    <span className="text-[8px] font-black uppercase text-stone-400">Interactive Concept Diagram</span>
                    <h5 className="text-xs font-black uppercase mt-1">Conceptual Dependency Flow</h5>
                  </div>

                  {/* Dynamic Nodes Flow Graph rendered inline! */}
                  <div className="space-y-4 relative">
                    
                    <div className="grid grid-cols-1 gap-2.5">
                      {solveResult.diagramNodes.map((node) => {
                        const isSelected = selectedNode?.id === node.id;
                        return (
                          <div
                            key={node.id}
                            id={`diagram-node-${node.id}`}
                            onClick={() => setSelectedNode(node)}
                            className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-[#6366F1]/10 border-indigo-500 shadow-sm'
                                : 'bg-stone-50 dark:bg-zinc-90 w-full hover:bg-stone-105 hover:dark:bg-zinc-85 border-stone-200/60 dark:border-zinc-800'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              {/* Small color key indicator */}
                              <span className={`w-2 h-2 rounded-full ${
                                node.color === 'emerald' ? 'bg-emerald-550' :
                                node.color === 'rose' ? 'bg-rose-500' :
                                node.color === 'indigo' ? 'bg-indigo-650' :
                                node.color === 'purple' ? 'bg-purple-600' : 'bg-blue-600'
                              }`}></span>
                              <span className="font-black text-xs">{node.label}</span>
                            </div>

                            {node.connections && node.connections.length > 0 && (
                              <div className="flex items-center gap-1">
                                <span className="text-[8px] font-bold text-stone-400 font-mono">FLOWS TO:</span>
                                {node.connections.map((c, idx) => (
                                  <span key={idx} className="bg-stone-200 dark:bg-zinc-800 text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase font-mono">{c}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Node explanation detailed pop down block */}
                    {selectedNode && (
                      <div className={`p-4 rounded-xl border text-[11px] leading-relaxed animate-scaleUp text-stone-500 mt-4 border-stone-150 dark:border-zinc-800 font-semibold ${
                        isDark ? 'bg-zinc-900/40 text-zinc-300' : 'bg-[#FAFAF9]'
                      }`}>
                        <span className="font-black uppercase text-[8px] text-stone-400 tracking-wider block mb-1">
                          Node: {selectedNode.label} Coordinates:
                        </span>
                        {selectedNode.explanation}
                      </div>
                    )}

                  </div>

                </div>

              </div>

              {/* Right Columns: Step-by-Step explanation, Quick Summary, Save button (Span 2) */}
              <div className="lg:col-span-2 space-y-8">
                
                {/* 2 Bullet Quick Summary mode */}
                <div className={`p-6 rounded-[2rem] border ${isDark ? 'bg-indigo-950/10 border-indigo-900/35' : 'bg-indigo-50/20 border-indigo-100 shadow-sm'} space-y-2`}>
                  <span className="text-[8px] font-black uppercase text-indigo-505 tracking-widest"><i className="fa-solid fa-compress mr-1"></i> Quick recap mode</span>
                  <p className="text-xs font-bold leading-relaxed text-stone-550 italic">
                    "{solveResult.quickSummary}"
                  </p>
                </div>

                {/* Step-by-Step card sequence list */}
                <div className="space-y-5">
                  <h4 className={`text-xs font-black uppercase tracking-widest text-[#6366F1]`}>Step-by-step explanation:</h4>
                  
                  <div className="space-y-4">
                    {solveResult.steps.map((step) => (
                      <div
                        key={step.stepNumber}
                        className={`p-6 rounded-[2.5rem] border ${
                          isDark ? 'bg-zinc-950/26 border-zinc-850' : 'bg-white border-stone-200/50 shadow-sm'
                        } flex gap-4`}
                      >
                        <span className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-505 border border-indigo-500/10 font-black text-xs flex items-center justify-center shrink-0">
                          {step.stepNumber}
                        </span>

                        <div className="space-y-1">
                          <h5 className={`font-black text-sm tracking-tight ${isDark ? 'text-zinc-150' : 'text-stone-900'}`}>{step.title}</h5>
                          <p className="text-xs text-stone-500 leading-relaxed font-semibold">{step.explanation}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                </div>

                {/* Full Explanation complete details review block */}
                <div className={`p-6 lg:p-8 rounded-[2.5rem] border ${isDark ? 'bg-zinc-950/30 border-zinc-850' : 'bg-stone-50/50 border-stone-150'} space-y-4`}>
                  <h5 className="text-xs font-black uppercase">Detailed Comprehensive Analysis</h5>
                  <p className="text-xs lg:text-[13px] text-stone-500 font-semibold leading-relaxed whitespace-pre-line">{solveResult.answer}</p>
                </div>

                {/* Export Action block */}
                <div className="pt-4 border-t border-stone-100 dark:border-zinc-850 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-stone-450"><i className="fa-solid fa-cloud-arrow-up mr-1 text-[#6366F1]"></i> sync explanation</span>
                  <button
                    id="save-solved-doubt-vault-btn"
                    onClick={handleSaveSolvedCard}
                    className="px-5 py-3.5 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl font-black uppercase tracking-wider text-[9.5px] cursor-pointer hover:scale-103 active:scale-95 transition-all shadow-md"
                  >
                    Add Explanation card to Vault deck
                  </button>
                </div>

              </div>
              
            </div>
          )}

        </div>
      )}

    </div>
  );
};

export default DoubtVault;
