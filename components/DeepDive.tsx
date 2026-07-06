import React, { useState } from 'react';
import { ThemeMode, TopicStudy } from '../types';
import { getGeminiResponse, cleanAIResponse } from '../services/geminiService';

interface DeepDiveProps {
  theme: ThemeMode;
}

const DeepDive: React.FC<DeepDiveProps> = ({ theme }) => {
  const isDark = theme === 'dark';
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<TopicStudy | null>(null);

  const handleDeepDive = async () => {
    if (!query.trim() || isLoading) return;
    setIsLoading(true);
    
    const messages = [{
      role: 'user' as const,
      parts: [{ text: `Provide a comprehensive, high-quality, step-by-step master guide for the topic: "${query}". Include definition, core concepts, key formulas (if any), 3 real-world examples, and a summary. Structure it perfectly for a student.` }],
      timestamp: Date.now()
    }];

    const content = await getGeminiResponse(messages, 'Normal');
    setResult({
      topicName: query,
      content: cleanAIResponse(content),
      timestamp: Date.now()
    });
    setIsLoading(false);
  };

  return (
    <div className="space-y-12 animate-fadeIn pb-24 max-w-5xl mx-auto">
      <header className="text-center mb-12">
        <h2 className={`text-4xl font-extrabold tracking-tight ${isDark ? 'text-zinc-100' : 'text-stone-900'}`}>
          Deep <span className="bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">Dive</span>
        </h2>
        <p className="text-stone-500 font-medium text-sm mt-2">Generate structured, calm master summaries for any academic topic instantly.</p>
      </header>

      {/* Search Master Bar */}
      <div className={`p-8 lg:p-12 rounded-[2.5rem] card-premium transition-all`}>
        <div className="max-w-3xl mx-auto space-y-6">
          <p className={`text-center font-semibold text-base ${isDark ? 'text-zinc-400' : 'text-stone-500'}`}>What concept or chapter would you like to master today?</p>
          <div className="relative flex items-center">
            <input 
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleDeepDive()}
              placeholder="e.g., Photosynthesis, Laws of Motion, Python Lists..."
              className={`w-full rounded-2xl py-5 pl-8 pr-20 font-semibold text-lg outline-none focus:ring-4 ring-indigo-505/10 transition-all border ${
                isDark 
                  ? 'bg-zinc-900 border-zinc-800 text-white placeholder-zinc-650' 
                  : 'bg-stone-50 border-stone-200 text-stone-900 placeholder-stone-400'
              }`}
            />
            <button 
              onClick={handleDeepDive}
              disabled={isLoading || !query.trim()}
              className="absolute right-3 p-4 bg-indigo-600 text-white rounded-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-45 cursor-pointer shadow-md shadow-indigo-600/15"
            >
              {isLoading ? <i className="fa-solid fa-spinner animate-spin text-base"></i> : <i className="fa-solid fa-seedling text-base"></i>}
            </button>
          </div>
        </div>
      </div>

      {/* Guide Results Section */}
      {result && (
        <div className={`p-8 lg:p-12 rounded-[2.5rem] card-premium animate-slideUp transition-all`}>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 pb-8 border-b border-stone-200/50 dark:border-zinc-800/60">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-500 mb-2">Concept Summary Guide</p>
              <h3 className={`text-3xl font-extrabold tracking-tight ${isDark ? 'text-zinc-100' : 'text-stone-900'}`}>{result.topicName}</h3>
            </div>
            <button className="flex items-center gap-2.5 px-6 py-3.5 bg-indigo-500/10 text-indigo-500 rounded-xl text-xs font-bold uppercase tracking-wider border border-indigo-500/10 hover:bg-indigo-600 hover:text-white transition-all cursor-pointer">
              <i className="fa-solid fa-box-archive text-sm"></i> Save to Lib
            </button>
          </div>
          <div className={`prose prose-stone max-w-none whitespace-pre-wrap leading-relaxed font-medium tracking-tight text-sm ${isDark ? 'text-zinc-350' : 'text-stone-600'}`}>
            {result.content}
          </div>
        </div>
      )}

      {/* Suggestion Grid */}
      {!result && !isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          {[
            { tag: 'Physics', title: 'Quantum Entanglement', icon: 'fa-atom' },
            { tag: 'History', title: 'World War I summary', icon: 'fa-compass' },
            { tag: 'Math', title: 'Calculus Integrals', icon: 'fa-square-root-variable' }
          ].map(suggestion => (
            <button 
              key={suggestion.title}
              onClick={() => { setQuery(suggestion.title); }}
              className={`p-8 rounded-[2rem] card-premium text-left group transition-all cursor-pointer border ${isDark ? 'border-zinc-800/40' : 'border-stone-100'}`}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-xs">
                  <i className={`fa-solid ${suggestion.icon}`}></i>
                </div>
                <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-500">{suggestion.tag}</p>
              </div>
              <p className={`text-lg font-bold tracking-tight transition-all ${isDark ? 'text-zinc-300 group-hover:text-indigo-400' : 'text-stone-700 group-hover:text-indigo-600'}`}>{suggestion.title}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default DeepDive;
