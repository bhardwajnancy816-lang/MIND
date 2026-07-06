import React, { useState } from 'react';
import { Subject, ThemeMode, TestQuestion, MockTestResult } from '../types';
import { generateMockTest } from '../services/geminiService';

interface MockTestProps {
  subjects: Subject[];
  theme: ThemeMode;
}

const MockTest: React.FC<MockTestProps> = ({ subjects, theme }) => {
  const isDark = theme === 'dark';
  const [phase, setPhase] = useState<'setup' | 'loading' | 'taking' | 'result'>('setup');
  const [testMode, setTestMode] = useState<'exam' | 'practice'>('exam');
  
  // Setup state
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [questionCount, setQuestionCount] = useState<number>(10);
  
  // Taking state
  const [questions, setQuestions] = useState<TestQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [showFeedback, setShowFeedback] = useState(false);
  
  // Result state
  const [testResult, setTestResult] = useState<MockTestResult | null>(null);

  const startTest = async () => {
    const subject = subjects.find(s => s.id === selectedSubjectId);
    if (!subject) return;

    setPhase('loading');
    try {
      const topics = selectedTopics.length > 0 
        ? selectedTopics 
        : subject.topics.map(t => t.name);
        
      const generatedQuestions = await generateMockTest(subject.name, topics, questionCount);
      setQuestions(generatedQuestions);
      setUserAnswers(new Array(generatedQuestions.length).fill(-1));
      setCurrentQuestionIndex(0);
      setShowFeedback(false);
      setPhase('taking');
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to compile artificial questions.");
      setPhase('setup');
    }
  };

  const handleAnswer = (optionIndex: number) => {
    if (showFeedback && testMode === 'practice') return;
    
    const updated = [...userAnswers];
    updated[currentQuestionIndex] = optionIndex;
    setUserAnswers(updated);

    if (testMode === 'practice') {
      setShowFeedback(true);
    }
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setShowFeedback(false);
    } else {
      finishTest();
    }
  };

  const finishTest = () => {
    let score = 0;
    questions.forEach((q, i) => {
      if (q.correctAnswerIndex === userAnswers[i]) score++;
    });

    setTestResult({
      score,
      total: questions.length,
      questions,
      userAnswers,
      timestamp: Date.now()
    });
    setPhase('result');
  };

  const resetTest = () => {
    setPhase('setup');
    setQuestions([]);
    setUserAnswers([]);
    setTestResult(null);
    setShowFeedback(false);
  };

  if (phase === 'loading') {
    return (
      <div className="h-full flex flex-col items-center justify-center p-20 animate-fadeIn">
        <div className="w-24 h-24 bg-indigo-500/10 rounded-full flex items-center justify-center mb-10 relative">
          <div className="absolute inset-0 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <i className="fa-solid fa-graduation-cap text-indigo-500 text-3xl"></i>
        </div>
        <h3 className={`text-2xl font-extrabold mb-3 tracking-tight ${isDark ? 'text-zinc-150' : 'text-stone-900'}`}>Formulating Practice Questions...</h3>
        <p className="text-stone-500 font-medium text-center max-w-sm text-sm">Our AI tutor is curating specific test parameters to match your current syllabus requirements.</p>
      </div>
    );
  }

  if (phase === 'taking') {
    const q = questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
    const hasAnswered = userAnswers[currentQuestionIndex] !== -1;

    return (
      <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn pb-20">
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <h3 className={`text-xs font-bold uppercase tracking-widest text-indigo-550`}>
              {testMode === 'practice' ? 'Practice Lab' : 'Evaluation'} {currentQuestionIndex + 1} / {questions.length}
            </h3>
            <p className="text-stone-400 text-[10px] font-bold uppercase tracking-wider">
              {testMode === 'practice' ? 'Instant Helper Mode Active' : 'Final Assessment In Progress'}
            </p>
          </div>
          <button onClick={resetTest} className="text-red-400 font-bold text-[10px] uppercase tracking-widest hover:text-red-500 transition-colors cursor-pointer">Leave Test</button>
        </div>

        <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-zinc-800' : 'bg-stone-105'}`}>
          <div className="h-full bg-indigo-600 transition-all duration-500" style={{ width: `${progress}%` }}></div>
        </div>

        <div className={`p-8 lg:p-12 rounded-[2.5rem] card-premium border ${isDark ? 'border-zinc-850/80 shadow-2xl' : 'border-stone-100 shadow-xl'}`}>
          <p className={`text-xl lg:text-2xl font-extrabold mb-10 leading-snug tracking-tight ${isDark ? 'text-zinc-100' : 'text-stone-900'}`}>{q.question}</p>
          
          <div className="grid grid-cols-1 gap-4">
            {q.options.map((opt, idx) => {
              const isSelected = userAnswers[currentQuestionIndex] === idx;
              const isCorrect = idx === q.correctAnswerIndex;
              const shouldShowCorrect = showFeedback && isCorrect;
              const shouldShowIncorrect = showFeedback && isSelected && !isCorrect;

              return (
                <button
                  key={idx}
                  onClick={() => handleAnswer(idx)}
                  disabled={showFeedback && testMode === 'practice'}
                  className={`w-full text-left p-5 rounded-2xl border-2 transition-all font-bold group flex items-center gap-5 cursor-pointer ${
                    shouldShowCorrect 
                      ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500'
                      : shouldShowIncorrect
                        ? 'bg-red-500/10 border-red-500 text-red-500'
                        : isSelected
                          ? 'bg-indigo-500/10 border-indigo-500 text-indigo-500'
                          : isDark 
                            ? 'border-zinc-800 hover:border-zinc-700 text-zinc-300' 
                            : 'border-stone-100 hover:border-indigo-200 text-stone-750'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all text-xs ${
                    shouldShowCorrect ? 'bg-emerald-500 text-white' : 
                    shouldShowIncorrect ? 'bg-red-500 text-white' :
                    isSelected ? 'bg-indigo-600 text-white' : 
                    'bg-stone-500/10 text-stone-400 group-hover:bg-stone-500/20'
                  }`}>
                    {shouldShowCorrect ? <i className="fa-solid fa-check"></i> : 
                     shouldShowIncorrect ? <i className="fa-solid fa-xmark"></i> : 
                     String.fromCharCode(65 + idx)}
                  </div>
                  <span className="text-sm font-semibold tracking-tight">{opt}</span>
                </button>
              );
            })}
          </div>

          {showFeedback && (
            <div className={`mt-8 p-6 lg:p-8 rounded-[1.5rem] border animate-slideUp ${isDark ? 'bg-zinc-900/40 border-zinc-750' : 'bg-stone-50 border-stone-200/50'}`}>
              <div className="flex items-center gap-2 mb-3">
                 <div className="w-7 h-7 rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center text-xs">
                   <i className="fa-solid fa-lightbulb"></i>
                 </div>
                 <h4 className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-zinc-300' : 'text-stone-850'}`}>Intuition & Explanation</h4>
              </div>
              <p className={`text-xs lg:text-sm leading-relaxed font-medium ${isDark ? 'text-zinc-400' : 'text-stone-600'}`}>{q.explanation}</p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-6 pt-4">
           <button 
             onClick={nextQuestion}
             disabled={!hasAnswered}
             className="px-10 py-4.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold uppercase text-[10px] tracking-widest shadow-md hover:scale-103 active:scale-97 cursor-pointer transition-all disabled:opacity-45"
           >
             {currentQuestionIndex === questions.length - 1 ? 'Analyze Scores' : (testMode === 'practice' ? 'Next Question' : 'Next Question')}
           </button>
        </div>
      </div>
    );
  }

  if (phase === 'result' && testResult) {
    const percentage = Math.round((testResult.score / testResult.total) * 100);
    return (
      <div className="max-w-4xl mx-auto space-y-12 animate-fadeIn pb-24">
        <header className="text-center space-y-3">
           <h3 className="text-indigo-550 font-bold uppercase tracking-widest text-[10px]">Test Report Card</h3>
           <h2 className={`text-4xl font-extrabold tracking-tight ${isDark ? 'text-zinc-100' : 'text-stone-900'}`}>
             {testMode === 'practice' ? 'Review Finished' : percentage >= 50 ? 'Strong Progress Complete' : 'Needs Review'}
           </h2>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="card-premium p-8 rounded-[2rem] text-center">
              <p className="text-stone-400 font-bold uppercase text-[9px] tracking-wider mb-2">Total Accuracy</p>
              <p className={`text-4xl font-extrabold ${isDark ? 'text-zinc-150' : 'text-stone-900'}`}>{percentage}%</p>
           </div>
           <div className="card-premium p-8 rounded-[2rem] text-center">
              <p className="text-stone-400 font-bold uppercase text-[9px] tracking-wider mb-2">Final Hits</p>
              <p className={`text-4xl font-extrabold ${isDark ? 'text-zinc-150' : 'text-stone-900'}`}>{testResult.score}/{testResult.total}</p>
           </div>
           <div className="card-premium p-8 rounded-[2rem] flex flex-col justify-center items-center">
              <button 
                onClick={resetTest}
                className="w-full py-4.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold uppercase text-[10px] tracking-widest shadow-md cursor-pointer transition-all"
              >
                Assemble New Test
              </button>
           </div>
        </div>

        <div className="space-y-6">
           <h3 className={`text-xl font-extrabold tracking-tight ${isDark ? 'text-zinc-100' : 'text-stone-850'}`}>Performance Debrief</h3>
           {testResult.questions.map((q, idx) => {
             const isCorrect = testResult.userAnswers[idx] === q.correctAnswerIndex;
             return (
               <div key={idx} className={`p-8 rounded-[2rem] border transition-all ${isDark ? 'bg-zinc-900/30 border-zinc-800' : 'bg-white border-stone-200/40 shadow-sm'}`}>
                 <div className="flex justify-between items-start mb-4 gap-4">
                    <p className={`text-base font-bold flex-1 tracking-tight ${isDark ? 'text-zinc-100' : 'text-stone-900'}`}>{idx + 1}. {q.question}</p>
                    <div className={`px-3 py-1 rounded-md font-bold text-[8px] uppercase tracking-wider shrink-0 ${isCorrect ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                      {isCorrect ? 'Correct' : 'Needs Review'}
                    </div>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {q.options.map((opt, oIdx) => (
                      <div 
                        key={oIdx}
                        className={`p-3.5 rounded-xl text-xs font-semibold border ${
                          oIdx === q.correctAnswerIndex 
                            ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600' 
                            : oIdx === testResult.userAnswers[idx] && !isCorrect 
                              ? 'bg-red-500/10 border-red-500 text-red-505'
                              : isDark ? 'bg-zinc-950/20 border-zinc-805/40 text-zinc-500' : 'bg-stone-50 border-stone-100 text-stone-450'
                        }`}
                      >
                        {String.fromCharCode(65 + oIdx)}. {opt}
                      </div>
                    ))}
                 </div>

                 <div className={`p-6 rounded-xl border ${isDark ? 'bg-zinc-900/80 border-zinc-805' : 'bg-stone-50/50 border-stone-100'}`}>
                    <p className="text-indigo-500 font-bold uppercase text-[9px] tracking-wider mb-2">Explanatory Guide</p>
                    <p className={`text-xs leading-relaxed font-semibold ${isDark ? 'text-zinc-400' : 'text-stone-600'}`}>{q.explanation}</p>
                 </div>
               </div>
             );
           })}
        </div>
      </div>
    );
  }

  // Setup Phase
  return (
    <div className="space-y-12 animate-fadeIn pb-24 max-w-5xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className={`text-4xl font-extrabold tracking-tight ${isDark ? 'text-zinc-100' : 'text-stone-900'}`}>
             Review <span className="bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">Assessment</span>
          </h2>
          <p className="text-stone-500 font-medium text-sm mt-1">Check your understanding with targeted, AI-formulated practice tests.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          <div className="card-premium p-8 rounded-[2.5rem] space-y-8">
            <div>
              <h3 className={`text-base font-extrabold mb-4 tracking-tight ${isDark ? 'text-zinc-150' : 'text-stone-900'}`}>1. Target Subject</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {subjects.map(s => (
                  <button
                    key={s.id}
                    onClick={() => { setSelectedSubjectId(s.id); setSelectedTopics([]); }}
                    className={`p-5 rounded-2xl border-2 text-left font-bold transition-all cursor-pointer ${
                      selectedSubjectId === s.id 
                        ? 'bg-indigo-55/15 dark:bg-indigo-500/10 border-indigo-500 text-indigo-500' 
                        : isDark ? 'border-zinc-800 text-zinc-550 hover:border-zinc-700 bg-zinc-950/10' : 'border-stone-100 text-stone-500 hover:border-stone-200'
                    }`}
                  >
                    <span className="text-sm font-semibold tracking-tight">{s.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {selectedSubjectId && (
              <div className="animate-slideUp pt-4 border-t border-stone-200/50 dark:border-zinc-800/40">
                <div className="flex justify-between items-center mb-4">
                  <h3 className={`text-base font-extrabold tracking-tight ${isDark ? 'text-zinc-150' : 'text-stone-900'}`}>2. Topic Focus</h3>
                  <button 
                    onClick={() => setSelectedTopics([])}
                    className="text-[9px] font-bold uppercase tracking-wider text-indigo-500 cursor-pointer"
                  >
                    Select All Topics
                  </button>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {subjects.find(s => s.id === selectedSubjectId)?.topics.map(t => (
                    <button
                      key={t.id}
                      onClick={() => {
                        if (selectedTopics.includes(t.name)) {
                          setSelectedTopics(prev => prev.filter(x => x !== t.name));
                        } else {
                          setSelectedTopics(prev => [...prev, t.name]);
                        }
                      }}
                      className={`px-4 py-2.5 rounded-xl border-2 text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                        selectedTopics.includes(t.name)
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-600/10'
                          : isDark ? 'border-zinc-800 text-zinc-500 bg-zinc-950/10' : 'border-stone-100 text-stone-400 bg-stone-50/50'
                      }`}
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-8">
          <div className="card-premium p-8 rounded-[2.5rem] space-y-6">
            <h3 className={`text-base font-extrabold tracking-tight ${isDark ? 'text-zinc-150' : 'text-stone-900'}`}>3. Test Rules</h3>
            
            <div className="space-y-4">
              <div className="space-y-1.5 animate-fadeIn">
                <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Evaluation Type</p>
                <div className={`grid grid-cols-2 p-1 rounded-xl border ${isDark ? 'bg-zinc-900/40 border-zinc-800' : 'bg-stone-50 border-stone-200/50'}`}>
                  <button 
                    onClick={() => setTestMode('exam')}
                    className={`py-2 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer ${testMode === 'exam' ? 'bg-indigo-600 text-white shadow-sm' : 'text-stone-400 hover:text-stone-700'}`}
                  >
                    Exam
                  </button>
                  <button 
                    onClick={() => setTestMode('practice')}
                    className={`py-2 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer ${testMode === 'practice' ? 'bg-emerald-650 text-white shadow-sm' : 'text-stone-400 hover:text-stone-700'}`}
                  >
                    Practice
                  </button>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-stone-400">
                  <span>Question count</span>
                  <span className="text-indigo-500 font-extrabold">{questionCount} Qs</span>
                </div>
                <input 
                  type="range" min="5" max="25" step="5" value={questionCount} 
                  onChange={e => setQuestionCount(parseInt(e.target.value))}
                  className="w-full accent-indigo-500 h-1 bg-stone-200 dark:bg-zinc-800 rounded-full appearance-none cursor-pointer"
                />
              </div>
            </div>

            <div className="pt-4">
              <button
                disabled={!selectedSubjectId}
                onClick={startTest}
                className={`w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold uppercase text-[10px] tracking-widest shadow-md hover:scale-[1.02] active:scale-98 transition-all disabled:opacity-35 cursor-pointer`}
              >
                Begin {testMode === 'practice' ? 'Practice' : 'Self-Test'}
              </button>
            </div>
          </div>

          <div className={`p-6 rounded-[1.5rem] border flex items-center gap-4 ${isDark ? 'bg-zinc-900/30 border-zinc-800' : 'bg-stone-50 border-stone-250/25'}`}>
             <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${testMode === 'practice' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-indigo-500/10 text-indigo-500'}`}>
               <i className={`fa-solid ${testMode === 'practice' ? 'fa-book-open' : 'fa-graduation-cap'}`}></i>
             </div>
             <p className="text-[10px] font-bold text-stone-400 uppercase leading-relaxed tracking-wider">
               {testMode === 'practice' 
                 ? "Instant helper is active. See full solutions and AI guidance right after selecting answers." 
                 : "Final evaluation focus. Lock in answers to see a structured mastery summary report cards at the end."}
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MockTest;
