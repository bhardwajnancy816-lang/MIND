import React, { useState, useMemo } from 'react';
import { Note, ThemeMode, TopicStudy } from '../types';
import { getGeminiResponse, cleanAIResponse } from '../services/geminiService';

interface NotesManagerProps {
  notes: Note[];
  onAddNote: (note: Omit<Note, 'id' | 'timestamp'>) => void;
  onDeleteNote: (id: string) => void;
  theme: ThemeMode;
  isOffline?: boolean;
}

const NotesManager: React.FC<NotesManagerProps> = ({ 
  notes, 
  onAddNote, 
  onDeleteNote, 
  theme, 
  isOffline 
}) => {
  const isDark = theme === 'dark';
  const [activeTab, setActiveTab] = useState<'shelf' | 'generator'>('shelf');
  
  // Library State
  const [isAdding, setIsAdding] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteTags, setNewNoteTags] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // AI Guide Generator State (Deep Dive)
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<TopicStudy | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Extract unique tags for filtering notes
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    notes.forEach(note => {
      note.tags?.forEach(tag => tags.add(tag.toLowerCase().trim()));
    });
    return Array.from(tags).sort();
  }, [notes]);

  const filteredNotes = useMemo(() => {
    if (!selectedTag) return notes;
    return notes.filter(note => 
      note.tags?.some(tag => tag.toLowerCase() === selectedTag.toLowerCase())
    );
  }, [notes, selectedTag]);

  // Handle Note manual file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        onAddNote({
          title: file.name,
          content: content,
          type: 'text',
          tags: ['imported']
        });
      };
      reader.readAsText(file);
    }
  };

  const handleManualAdd = () => {
    if (newNoteTitle && newNoteContent) {
      const parsedTags = newNoteTags
        .split(',')
        .map(t => t.trim())
        .filter(t => t !== '');

      onAddNote({
        title: newNoteTitle,
        content: newNoteContent,
        type: 'text',
        tags: parsedTags
      });
      setNewNoteTitle('');
      setNewNoteContent('');
      setNewNoteTags('');
      setIsAdding(false);
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTag(prev => prev === tag ? null : tag);
  };

  // AI Guide Generation (Deep Dive)
  const handleDeepDive = async () => {
    if (!query.trim() || isLoading) return;
    setIsLoading(true);
    setSaveSuccess(false);
    setResult(null);
    
    try {
      const messages = [{
        role: 'user' as const,
        parts: [{ text: `Provide a comprehensive, high-quality, step-by-step master study guide for the topic: "${query}". Include definition, core concepts, key formulas (if any), 3 real-world examples, and a quick revision summary. Structure it beautifully for a Class 9-12 student. Use clean Markdown paragraphs.` }],
        timestamp: Date.now()
      }];

      const content = await getGeminiResponse(messages, 'Normal');
      setResult({
        topicName: query,
        content: cleanAIResponse(content),
        timestamp: Date.now()
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Save AI Guide directly to Note Shelf
  const handleSaveGuideToLib = () => {
    if (result) {
      onAddNote({
        title: `AI Guide: ${result.topicName}`,
        content: result.content,
        type: 'text',
        tags: ['ai-guide', 'generated']
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-24 max-w-6xl mx-auto text-left">
      
      {/* Handcrafted Header & Tab toggle */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-stone-200/40 dark:border-zinc-800/50 pb-6">
        <div>
          <span className="px-3.5 py-1 text-[9px] font-extrabold uppercase tracking-widest text-indigo-605 dark:text-indigo-400 bg-indigo-500/10 rounded-full border border-indigo-500/15">
            Smart Library
          </span>
          <h2 className={`text-4xl font-extrabold tracking-tight mt-2 ${isDark ? 'text-zinc-150 font-sans' : 'text-stone-900'}`}>
            {activeTab === 'shelf' ? 'My Note Shelf' : 'AI Guide Builder'}
          </h2>
          <p className="text-stone-500 dark:text-zinc-400 font-medium text-sm mt-1">
            {activeTab === 'shelf' 
              ? 'Archived chapters, imported notes, and smart textbook summaries.' 
              : 'Prompt any concept or textbook topic to instantly compile a master outline guide.'}
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-4.5 self-start md:self-auto">
          <div className={`flex p-1 rounded-2xl border ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-stone-50 border-stone-200/50 shadow-sm'}`}>
            <button
              onClick={() => setActiveTab('shelf')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'shelf' 
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-sm' 
                  : 'text-stone-400 hover:text-stone-600 dark:hover:text-zinc-300'
              }`}
            >
              My Shelf
            </button>
            <button
              onClick={() => setActiveTab('generator')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'generator' 
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-sm' 
                  : 'text-stone-400 hover:text-stone-600 dark:hover:text-zinc-300'
              }`}
            >
              🪄 AI Study Guides
            </button>
          </div>
        </div>
      </header>

      {/* OFFLINE STATUS NOTIFICATION BANNER */}
      {isOffline && (
        <div className="p-4 rounded-2xl bg-amber-500/[0.04] border border-amber-500/20 text-amber-500 flex items-center gap-3.5 text-left animate-slideDown">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center text-xs">
            <i className="fa-solid fa-cloud-arrow-down"></i>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider leading-none">Offline Protection Engaged</p>
            <p className="text-xs font-semibold mt-1 text-stone-500 dark:text-zinc-400">Library materials and textbook summaries are stored local-first and fully readable without active network signals.</p>
          </div>
        </div>
      )}

      {/* RENDER CONTENT BASED ON ACTIVE SUB-TAB */}
      {activeTab === 'shelf' ? (
        <>
          {/* LIBRARY SHELF TAB */}
          
          {/* Header Controls for shelf */}
          <div className="flex flex-wrap items-center justify-between gap-4 py-2">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">Manage Vault</span>
            </div>
            
            <div className="flex items-center gap-3">
              <label className={`px-4.5 py-2.5 rounded-xl border font-bold text-[10px] uppercase tracking-wider cursor-pointer transition-all ${
                isDark 
                  ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-indigo-500/30' 
                  : 'bg-white border-stone-200 text-stone-600 shadow-sm hover:border-indigo-250'
              }`}>
                <i className="fa-solid fa-cloud-arrow-up mr-1.5 text-indigo-500"></i> Import .TXT File
                <input type="file" className="hidden" onChange={handleFileUpload} accept=".txt,.md,.json" />
              </label>

              <button 
                onClick={() => setIsAdding(!isAdding)}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-[10px] uppercase tracking-wider shadow-md cursor-pointer transition-all"
              >
                <i className="fa-solid fa-plus mr-1.5"></i> Manual Note
              </button>
            </div>
          </div>

          {/* ADD MANUAL NOTE DRAWER / CARD */}
          {isAdding && (
            <div className={`p-6 rounded-2xl border animate-slideDown mb-4 ${
              isDark ? 'bg-[#151518] border-zinc-805' : 'bg-white border-stone-200/50 shadow-xl'
            }`}>
              <div className="flex items-center gap-3 mb-5 text-left">
                <div className="w-8 h-8 bg-indigo-500/10 text-indigo-500 rounded-xl flex items-center justify-center text-sm">
                  <i className="fa-solid fa-pen-fancy"></i>
                </div>
                <h3 className={`text-base font-extrabold tracking-tight ${isDark ? 'text-zinc-150' : 'text-stone-900'}`}>Create Textbook Summary</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                <div className="space-y-4">
                  <div className="space-y-1.5 text-left">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-stone-400">Chapter Title</p>
                    <input 
                      className={`w-full p-3 rounded-xl border text-xs font-semibold outline-none transition-all ${
                        isDark ? 'bg-[#0f0f12] border-zinc-800 text-white placeholder-zinc-700' : 'bg-stone-50 border-stone-150 text-stone-800'
                      }`}
                      placeholder="e.g. Wave Optics Master Guide"
                      value={newNoteTitle}
                      onChange={(e) => setNewNoteTitle(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5 text-left">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-stone-400">Syllabus Tags (Comma separated)</p>
                    <input 
                      className={`w-full p-3 rounded-xl border text-xs font-semibold outline-none transition-all ${
                        isDark ? 'bg-[#0f0f12] border-zinc-800 text-white placeholder-zinc-700' : 'bg-stone-50 border-stone-150 text-stone-800'
                      }`}
                      placeholder="e.g. physics, class-12, optics"
                      value={newNoteTags}
                      onChange={(e) => setNewNoteTags(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="space-y-1.5 flex flex-col text-left">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-stone-400">Note Content</p>
                  <textarea 
                    className={`w-full p-3 rounded-xl border h-full min-h-[120px] text-xs font-semibold outline-none transition-all flex-grow ${
                      isDark ? 'bg-[#0f0f12] border-zinc-800 text-white placeholder-zinc-700' : 'bg-stone-50 border-stone-150 text-stone-800'
                    }`}
                    placeholder="Enter equations, definitions, bullet formulas, or outlines..."
                    value={newNoteContent}
                    onChange={(e) => setNewNoteContent(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-4 pt-4 border-t border-stone-100 dark:border-zinc-850/50">
                <button onClick={() => setIsAdding(false)} className="text-stone-400 font-bold text-[10px] uppercase tracking-wider cursor-pointer">Cancel</button>
                <button 
                  onClick={handleManualAdd} 
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold uppercase tracking-wider text-[10px]"
                >
                  Commit Note
                </button>
              </div>
            </div>
          )}

          {/* Tag map */}
          {allTags.length > 0 && (
            <div className="space-y-3 px-1 text-left">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Filter tags</h3>
                {selectedTag && (
                  <button 
                    onClick={() => setSelectedTag(null)}
                    className="text-[9.5px] font-black text-indigo-500 uppercase tracking-wider hover:underline cursor-pointer"
                  >
                    Clear Filter
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {allTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-3.5 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                      selectedTag === tag
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : isDark 
                          ? 'bg-zinc-900/30 border-zinc-800 text-zinc-500 hover:border-zinc-700' 
                          : 'border-stone-150 text-stone-500 hover:border-stone-250 bg-white shadow-sm'
                    }`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Notes Grid Display */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
            {filteredNotes.map((note) => (
              <div 
                key={note.id} 
                className={`p-6 lg:p-7 rounded-[2rem] border group flex flex-col justify-between min-h-[280px] bg-white dark:bg-[#151518] transition-all duration-300 md:hover:-translate-y-1 ${
                  isDark ? 'border-zinc-850/70' : 'border-stone-150 shadow-sm hover:border-indigo-150'
                }`}
              >
                <div>
                  <div className="flex justify-between items-start mb-4 gap-2">
                    <div className="w-10 h-10 bg-indigo-500/10 text-indigo-500 rounded-xl flex items-center justify-center text-base border border-indigo-500/5">
                      <i className="fa-solid fa-file-invoice text-sm"></i>
                    </div>
                    <button 
                      onClick={() => onDeleteNote(note.id)}
                      className="w-7 h-7 flex items-center justify-center text-stone-400 hover:text-red-500 md:opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-red-500/5 cursor-pointer"
                      title="Delete Note"
                    >
                      <i className="fa-solid fa-trash text-xs"></i>
                    </button>
                  </div>

                  <div className="text-left">
                    <h4 className={`text-base font-extrabold mb-2.5 tracking-tight leading-snug ${isDark ? 'text-zinc-150' : 'text-stone-900'}`}>{note.title}</h4>
                    <p className="text-stone-500 dark:text-zinc-400 text-xs leading-relaxed font-semibold line-clamp-4">
                      {note.content}
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-3.5 pt-4 border-t border-stone-100 dark:border-zinc-850/50">
                  {note.tags && note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {note.tags.map(tag => (
                        <span key={tag} className="px-2 py-0.5 bg-stone-100 dark:bg-zinc-800/40 text-indigo-600 dark:text-indigo-400 rounded text-[8.5px] font-extrabold uppercase tracking-wider">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center text-left">
                    <div>
                      <span className="text-[7.5px] text-stone-400 font-bold uppercase tracking-wider block">Compiled</span>
                      <span className="text-[9px] font-extrabold text-stone-500 dark:text-zinc-500">
                        {new Date(note.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    
                    {/* Modal expanded viewer (simplified expanded card link) */}
                    <button 
                      onClick={() => {
                        alert(`📚 EXPANDED VIEW:\n\n${note.title}\n----------------------------------\n\n${note.content}`);
                      }}
                      className="text-indigo-600 dark:text-indigo-450 text-[10px] font-extrabold uppercase tracking-wider hover:underline py-1 px-2 hover:bg-indigo-500/5 rounded"
                    >
                      Read Guide <i className="fa-solid fa-arrow-right-long ml-1 text-[8px]"></i>
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {filteredNotes.length === 0 && (
              <div className="col-span-full py-16 text-center text-stone-400">
                <div className="w-14 h-14 rounded-xl bg-stone-100 dark:bg-zinc-900/40 flex items-center justify-center mx-auto mb-4 border border-stone-200/50 dark:border-zinc-800">
                  <i className="fa-solid fa-folder text-base text-indigo-500"></i>
                </div>
                <h3 className="text-lg font-extrabold tracking-tight">Empty shelf</h3>
                <p className="font-semibold text-xs text-stone-400 mt-1 max-w-sm mx-auto">
                  {selectedTag 
                    ? `No notes categorized under label #${selectedTag} found.` 
                    : "Generate high-quality concept study guides using the AI Study Guides tab!"}
                </p>
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          {/* AI STUDY GUIDE GENERATOR TAB (DEEP DIVE) */}
          <div className="space-y-8 animate-fadeIn text-left">
            
            {/* Custom search master bar */}
            <div className={`p-8 lg:p-10 rounded-[2rem] border relative overflow-hidden bg-white dark:bg-[#151518] ${
              isDark ? 'border-zinc-850' : 'border-stone-150 shadow-sm'
            }`}>
              <div className="max-w-2xl mx-auto space-y-4">
                <p className="text-center font-bold text-xs uppercase tracking-wider text-stone-400">Neural Guide Compiler</p>
                <h4 className={`text-center text-xl font-extrabold tracking-tight ${isDark ? 'text-zinc-150' : 'text-stone-900 font-sans'}`}>
                  Which curriculum topic would you like to compile today?
                </h4>
                
                <div className="relative flex items-center pt-2">
                  <input 
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleDeepDive()}
                    placeholder="e.g. Laws of Thermodynamics, Chemical Equations, Python Dictionaries..."
                    disabled={isOffline}
                    className={`w-full rounded-xl py-4.5 pl-5 pr-16 font-semibold text-sm outline-none focus:ring-4 ring-indigo-500/15 transition-all border ${
                      isDark 
                        ? 'bg-[#0f0f12] border-zinc-800 text-white placeholder-zinc-700' 
                        : 'bg-stone-50 border-stone-150 text-stone-900 placeholder-stone-400'
                    } ${isOffline ? 'opacity-50 cursor-not-allowed' : ''}`}
                  />
                  <button 
                    onClick={handleDeepDive}
                    disabled={isLoading || !query.trim() || isOffline}
                    className="absolute right-2 p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg hover:scale-103 active:scale-97 transition-all disabled:opacity-40 cursor-pointer shadow"
                  >
                    {isLoading ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-wand-magic-sparkles"></i>}
                  </button>
                </div>
                
                {isOffline && (
                  <p className="text-center text-[10px] text-amber-500 font-bold uppercase tracking-wider">
                    ⚠️ AI Guide generation is restricted while satellite telemetries are offline.
                  </p>
                )}
              </div>
            </div>

            {/* Generated results container */}
            {result && (
              <div className={`p-8 rounded-[2rem] border animate-slideDown transition-all bg-white dark:bg-[#151518] ${
                isDark ? 'border-zinc-850' : 'border-stone-150 shadow-sm'
              }`}>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-6 border-b border-stone-100 dark:border-zinc-850/50">
                  <div className="text-left">
                    <p className="text-[8px] font-black uppercase tracking-[0.25em] text-indigo-500">Structured Study Outline</p>
                    <h3 className={`text-2xl font-extrabold tracking-tight mt-1 ${isDark ? 'text-zinc-150' : 'text-stone-900 font-sans'}`}>{result.topicName}</h3>
                  </div>

                  <button 
                    onClick={handleSaveGuideToLib}
                    disabled={saveSuccess}
                    className={`flex items-center gap-2 px-4.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      saveSuccess 
                        ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/20' 
                        : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/15 hover:bg-indigo-600 hover:text-white hover:border-transparent'
                    }`}
                  >
                    {saveSuccess ? (
                      <>
                        <i className="fa-solid fa-check text-sm animate-bounce"></i> Guide Saved
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-box-archive text-sm"></i> Save to Shelf
                      </>
                    )}
                  </button>
                </div>

                {/* Guide markdown output */}
                <div className="whitespace-pre-wrap text-left text-sm leading-relaxed font-semibold text-stone-500 dark:text-zinc-400 max-w-4xl prose prose-indigo">
                  {result.content}
                </div>
              </div>
            )}

            {/* Suggestions cards if no query run */}
            {!result && !isLoading && (
              <div className="space-y-4">
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-stone-400 block px-1">Curriculum Core Inspirations</span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { tag: 'Physics', title: 'Quantum Entanglement Outline', icon: 'fa-atom', color: 'text-amber-500 bg-amber-500/10' },
                    { tag: 'Biology', title: 'Photosynthesis Krebs Cycle', icon: 'fa-dna', color: 'text-emerald-500 bg-emerald-500/10' },
                    { tag: 'Chemistry', title: 'Periodic Bonding Trends', icon: 'fa-flask-vial', color: 'text-indigo-550 bg-indigo-500/10' }
                  ].map(suggestion => (
                    <button 
                      key={suggestion.title}
                      onClick={() => { setQuery(suggestion.title); }}
                      disabled={isOffline}
                      className={`p-6 rounded-[2rem] text-left group transition-all cursor-pointer border bg-white dark:bg-[#151518] ${
                        isDark ? 'border-zinc-850' : 'border-stone-150 shadow-sm'
                      } ${isOffline ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div className="flex items-center gap-2.5 mb-4">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs ${suggestion.color}`}>
                          <i className={`fa-solid ${suggestion.icon}`}></i>
                        </div>
                        <p className="text-[9px] font-extrabold uppercase tracking-widest text-stone-400">{suggestion.tag}</p>
                      </div>
                      <p className={`text-base font-extrabold tracking-tight transition-all truncate ${
                        isDark ? 'text-zinc-200 group-hover:text-indigo-400' : 'text-stone-700 group-hover:text-indigo-650'
                      }`}>
                        {suggestion.title}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}

    </div>
  );
};

export default NotesManager;
