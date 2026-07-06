import React, { useState, useRef, useEffect } from 'react';
import { Message, Note, Doubt, ThemeMode, StudyMode } from '../types';
import { getGeminiResponse, cleanAIResponse } from '../services/geminiService';

interface AITutorProps {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  notes: Note[];
  onSaveDoubt: (doubt: Omit<Doubt, 'id' | 'timestamp' | 'resolved'>) => void;
  theme: ThemeMode;
}

type AIToolType = 'Chat' | 'Voice' | 'Scanner';

const AITutor: React.FC<AITutorProps> = ({ messages, setMessages, notes, onSaveDoubt, theme }) => {
  const isDark = theme === 'dark';
  const [activeTool, setActiveTool] = useState<AIToolType>('Chat');
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [studyMode, setStudyMode] = useState<StudyMode>('Normal');
  
  // Text-To-Speech (TTS) Settings
  const [isTtsEnabled, setIsTtsEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [vocalError, setVocalError] = useState<string | null>(null);
  const [isMicRestricted, setIsMicRestricted] = useState(false);
  
  // Custom fallback simulation modal states
  const [showVocalFallbackModal, setShowVocalFallbackModal] = useState(false);
  const [fallbackModalInput, setFallbackModalInput] = useState('');
  const [fallbackSuggestedPrompt, setFallbackSuggestedPrompt] = useState('');

  // Homework Scanner State
  const [scannerFile, setScannerFile] = useState<string | null>(null); // base64 string
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [scannerInput, setScannerInput] = useState('Please analyze this page or textbook question, highlight what formulas apply, and explain the concept step-by-step.');
  const [cameraError, setCameraError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (activeTool === 'Voice') {
          handleVoiceSendDirect(transcript);
        } else {
          setInput(prev => prev + (prev ? ' ' : '') + transcript);
        }
        setIsListening(false);
        setVocalError(null);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
        const randomPrompts = [
          "Explain Bernoulli's principle in aerodynamics.",
          "What are the major structural elements of cell membrane?",
          "Give me an active recall trick for Trigonometric formulas.",
          "How is a semiconductor transistor structured?",
          "What is the difference between speed and velocity in classical physics?"
        ];
        const chosen = randomPrompts[Math.floor(Math.random() * randomPrompts.length)];

        if (event.error === 'audio-capture') {
          setIsMicRestricted(true);
          setVocalError("Microphone restricted by browser sandbox (audio-capture block). Click the button below to 'Open in New Tab' to activate direct microphone flow! Or simply simulate using our Vocal Dub Simulator.");
          setFallbackSuggestedPrompt(chosen);
          setFallbackModalInput(chosen);
          setShowVocalFallbackModal(true);
        } else if (event.error === 'not-allowed') {
          setIsMicRestricted(true);
          setVocalError("Browser blocked microphone access (not-allowed). Please click 'Open in New Tab' to activate direct microphone flow, or simulate input below.");
          setFallbackSuggestedPrompt(chosen);
          setFallbackModalInput(chosen);
          setShowVocalFallbackModal(true);
        } else {
          setVocalError(`Speech input error: ${event.error}. Feel free to type in the search bar below or pick a simulator topic.`);
        }
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    return () => {
      // Cleanup camera streams on unmount
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [activeTool]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Voice Speech synthesizer
  const speakText = (text: string) => {
    if (!isTtsEnabled || !window.speechSynthesis) return;
    window.speechSynthesis.cancel(); // limit overlapping voice
    
    // Clean text from symbols
    const cleanSpeech = text
      .substring(0, 320) // Speak the intro chunk to avoid long robotic voice
      .replace(/[^\w\s\d,.]/gi, '');

    const utterance = new SpeechSynthesisUtterance(cleanSpeech);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const toggleListening = async () => {
    setVocalError(null);
    let userMediaAllowed = true;
    // Attempt to request microphone permission first to bypass secure origin constraints in iframe
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
      } else {
        userMediaAllowed = false;
      }
    } catch (err) {
      console.warn("Microphone permission check bypassed/denied:", err);
      userMediaAllowed = false;
      setIsMicRestricted(true);
      setVocalError("Microphone restricted by browser sandbox (audio-capture block). Click the button below to 'Open in New Tab' to activate direct microphone flow! Or simply simulate using our Vocal Dub Simulator.");
    }

    if (!recognitionRef.current || isMicRestricted || !userMediaAllowed) {
      const randomPrompts = [
        "Explain Bernoulli's principle in aerodynamics.",
        "What are the major structural elements of cell membrane?",
        "Give me an active recall trick for Trigonometric formulas.",
        "How is a semiconductor transistor structured?",
        "What is the difference between speed and velocity in classical physics?"
      ];
      const chosen = randomPrompts[Math.floor(Math.random() * randomPrompts.length)];
      setFallbackSuggestedPrompt(chosen);
      setFallbackModalInput(chosen);
      setShowVocalFallbackModal(true);
      return;
    }

    if (isListening) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        setIsListening(false);
      }
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error("Failed to start recognition", err);
        setIsMicRestricted(true);
        // Fallback simulation triggers automatically via custom modal
        const preset = "Explain quantum entanglement in simple terms.";
        setFallbackSuggestedPrompt(preset);
        setFallbackModalInput(preset);
        setShowVocalFallbackModal(true);
      }
    }
  };

  // Submit standard chat message
  const handleSend = async () => {
    if ((!input.trim() && !selectedNoteId) || isLoading) return;

    const currentInput = input;
    setInput('');
    stopSpeaking();
    
    let parts: any[] = [{ text: currentInput }];
    if (selectedNoteId) {
      const note = notes.find(n => n.id === selectedNoteId);
      if (note) {
        parts.push({ text: `\n\n[CONTEXT FROM NOTE: ${note.title}]\n${note.content}` });
      }
    }

    const newUserMsg: Message = { role: 'user', parts: [{ text: currentInput }], timestamp: Date.now(), mode: studyMode };
    setMessages(prev => [...prev, newUserMsg]);
    setIsLoading(true);

    const responseText = await getGeminiResponse([...messages, { role: 'user', parts, timestamp: Date.now() }], studyMode);
    
    setMessages(prev => [...prev, { role: 'model', parts: [{ text: responseText }], timestamp: Date.now() }]);
    setIsLoading(false);
    setSelectedNoteId(null);
    speakText(responseText);
  };

  // Voice Doubt sending directly
  const handleVoiceSendDirect = async (userVoicePrompt: string) => {
    if (!userVoicePrompt.trim() || isLoading) return;
    
    const newUserMsg: Message = { role: 'user', parts: [{ text: userVoicePrompt }], timestamp: Date.now(), mode: 'ELI5' };
    setMessages(prev => [...prev, newUserMsg]);
    setIsLoading(true);

    const parts = [{ text: userVoicePrompt }];
    const responseText = await getGeminiResponse([...messages, { role: 'user', parts, timestamp: Date.now() }], 'ELI5');
    
    setMessages(prev => [...prev, { role: 'model', parts: [{ text: responseText }], timestamp: Date.now() }]);
    setIsLoading(false);
    speakText(responseText);
  };

  // Simulated Voice capture flow for sandbox environments
  const handleSimulatedVocalInput = (suggestionText: string) => {
    setVocalError(null);
    setIsListening(true);
    setInput(`🎙️ Orbit Simulating Vocal Transmission: "${suggestionText}"`);
    setTimeout(() => {
      setIsListening(false);
      setInput('');
      handleVoiceSendDirect(suggestionText);
    }, 1500);
  };

  // Image compression utility to prevent PayloadTooLargeError / 413 HTTP errors on heavy images
  const compressImage = (dataUrl: string, maxWidth = 1024, maxHeight = 1024, quality = 0.75): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions preserving aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        } else {
          resolve(dataUrl); // fallback to original if ctx is not available
        }
      };
      img.onerror = (err) => {
        reject(err);
      };
      img.src = dataUrl;
    });
  };

  // Homework Camera Scanner Actions
  const handleStartCamera = async () => {
    setCameraError(null);
    try {
      setScannerFile(null);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err: any) {
      console.error("Camera access failed:", err);
      const errName = err?.name || '';
      const errMsg = err?.message || '';
      
      if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError' || errMsg.includes('Permission dismissed') || errMsg.includes('denied')) {
        setCameraError("Camera access was denied or dismissed. Please enable camera access in your browser settings for this site, or upload an image file directly.");
      } else {
        setCameraError(`Could not access camera device: ${errMsg || "Unknown device error"}. Please check connections or upload an image file instead.`);
      }
    }
  };

  const handleCapturePhoto = async () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        try {
          const compressed = await compressImage(dataUrl);
          setScannerFile(compressed);
        } catch (e) {
          console.warn("Compression failed, using raw data url", e);
          setScannerFile(dataUrl);
        }
        handleStopCamera();
      }
    }
  };

  const handleStopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const rawResult = event.target?.result as string;
        try {
          const compressed = await compressImage(rawResult);
          setScannerFile(compressed);
          setCameraError(null);
        } catch (e) {
          console.warn("Compression failed, using raw file", e);
          setScannerFile(rawResult);
        }
        handleStopCamera();
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProcessScan = async () => {
    if (!scannerFile || isLoading) return;

    setIsLoading(true);
    const photoBase64 = scannerFile.split(',')[1]; // strip header
    
    // Add User message with image parts
    const userPrompt = scannerInput;
    const scannerMsg: Message = {
      role: 'user',
      parts: [
        { text: userPrompt },
        { 
          inlineData: {
            mimeType: 'image/jpeg',
            data: photoBase64
          }
        }
      ],
      timestamp: Date.now(),
      mode: 'Exam-Oriented'
    };

    setMessages(prev => [...prev, scannerMsg]);
    
    const responseText = await getGeminiResponse([...messages, {
      role: 'user',
      parts: [
        { text: userPrompt },
        { 
          inlineData: {
            mimeType: 'image/jpeg',
            data: photoBase64
          }
        }
      ],
      timestamp: Date.now()
    }], 'Exam-Oriented');

    setMessages(prev => [...prev, { role: 'model', parts: [{ text: responseText }], timestamp: Date.now() }]);
    setIsLoading(false);
    setScannerFile(null);
    setActiveTool('Chat'); // switch to see explanation
    speakText(responseText);
  };

  return (
    <div className={`flex flex-col h-[calc(100vh-8rem)] rounded-[2.5rem] overflow-hidden transition-all border ${isDark ? 'bg-zinc-950/20 border-zinc-800/80 shadow-2xl' : 'bg-white border-stone-100 shadow-xl shadow-stone-200/20'}`}>
      
      {/* Upper Mode Selector & Configurations */}
      <div className={`p-6 lg:p-8 flex flex-col md:flex-row justify-between items-center border-b gap-4 ${isDark ? 'border-zinc-800/50 bg-zinc-900/10' : 'border-stone-100 bg-stone-50/20'}`}>
        <div className="flex items-center gap-4 self-stretch md:self-auto justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-gradient-to-tr from-indigo-505 to-purple-500 rounded-2xl flex items-center justify-center text-white text-lg shadow-md shadow-indigo-500/10">
              <i className="fa-solid fa-brain animate-pulse"></i>
            </div>
            <div>
              <h3 className={`font-extrabold tracking-tight text-base ${isDark ? 'text-zinc-100' : 'text-stone-900'}`}>Tutor Orbit</h3>
              <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-500 flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-emerald-500 animate-ping"></span> Live & Ready
              </p>
            </div>
          </div>
        </div>

        {/* Start-Up Styled Tool Tab Switcher */}
        <div className={`flex p-1 rounded-xl border ${isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-stone-100 border-stone-200/50'}`}>
          <button
            onClick={() => { setActiveTool('Chat'); stopSpeaking(); }}
            className={`px-4 py-2 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer ${activeTool === 'Chat' ? 'bg-indigo-600 text-white shadow-sm' : 'text-stone-450 hover:text-stone-605'}`}
          >
            <i className="fa-regular fa-comment mr-1.5"></i> Tutor Box
          </button>
          
          <button
            onClick={() => { setActiveTool('Voice'); stopSpeaking(); }}
            className={`px-4 py-2 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer ${activeTool === 'Voice' ? 'bg-indigo-600 text-white shadow-sm' : 'text-stone-450 hover:text-stone-605'}`}
          >
            <i className="fa-solid fa-microphone-lines mr-1.5"></i> AI Vocal Solver
          </button>
          
          <button
            onClick={() => { setActiveTool('Scanner'); stopSpeaking(); }}
            className={`px-4 py-2 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer ${activeTool === 'Scanner' ? 'bg-indigo-600 text-white shadow-sm' : 'text-stone-450 hover:text-stone-605'}`}
          >
            <i className="fa-solid fa-crop-simple mr-1.5 animate-pulse"></i> Camera Scanner
          </button>
        </div>

        {/* Optional context params */}
        <div className="flex items-center gap-3">
          <select 
            className={`text-[9px] font-bold uppercase tracking-wider rounded-xl px-4 py-3 outline-none transition-all cursor-pointer border ${
              isDark 
                ? 'bg-zinc-900 border-zinc-800 text-zinc-300' 
                : 'bg-white border-stone-205 text-stone-600 shadow-sm'
            }`}
            value={selectedNoteId || ''}
            onChange={(e) => setSelectedNoteId(e.target.value || null)}
          >
            <option value="">No context note</option>
            {notes.map(n => <option key={n.id} value={n.id}>{n.title}</option>)}
          </select>
        </div>
      </div>

      {/* Main Tool Frame Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        
        {/* VIEW 1: ADVANCED CHAT INTERACTION (Default) */}
        {activeTool === 'Chat' && (
          <>
            {/* Chat Conversation Stream */}
            <div ref={scrollRef} className={`flex-1 overflow-y-auto p-6 lg:p-10 space-y-8 custom-scrollbar ${isDark ? 'bg-zinc-950/10' : 'bg-[#FAFAF9]/30'}`}>
              
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center p-8 text-center text-stone-400">
                  <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mb-4 border border-indigo-500/10">
                    <i className="fa-solid fa-sparkles text-2xl"></i>
                  </div>
                  <h4 className={`text-base font-extrabold tracking-tight ${isDark ? 'text-zinc-200' : 'text-stone-800'}`}>Orbit AI Study Space</h4>
                  <p className="text-xs text-stone-500 font-semibold max-w-sm mt-1 leading-relaxed">
                    Ask textbook doubts, solve equations, clarify exam concepts or request step-by-step master guides.
                  </p>
                </div>
              )}

              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`message-bubble rounded-3xl px-6 py-4.5 shadow-sm transition-all ${
                      msg.role === 'user' 
                        ? 'bg-indigo-650 text-white rounded-tr-none font-semibold text-sm leading-relaxed' 
                        : `${isDark ? 'bg-zinc-900 border-zinc-805 text-zinc-100' : 'bg-white text-stone-800 border-stone-200/40 shadow-sm'} border rounded-tl-none text-sm leading-relaxed`
                    }`}>
                      {msg.role === 'model' && (
                        <div className="flex justify-between items-center mb-3">
                          <div className="flex gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                            <div className="w-1.5 h-1.5 rounded-full bg-purple-400"></div>
                          </div>
                          {window.speechSynthesis && (
                            <button 
                              onClick={() => speakText(msg.parts[0]?.text || '')}
                              className="text-stone-450 hover:text-indigo-500 text-[10px] pl-3 flex items-center gap-1"
                              title="Listen to Explanation"
                            >
                              <i className="fa-solid fa-volume-high"></i>
                            </button>
                          )}
                        </div>
                      )}
                      
                      {msg.parts.map((p, pIdx) => {
                        if (p.inlineData) {
                          return (
                            <div key={pIdx} className="mb-3 rounded-xl overflow-hidden border border-stone-200/50 max-w-xs">
                              <img src={`data:${p.inlineData.mimeType};base64,${p.inlineData.data}`} alt="Scanned worksheet" className="w-full h-auto object-cover" referrerPolicy="no-referrer" />
                            </div>
                          );
                        }
                        return (
                          <p key={pIdx} className="whitespace-pre-wrap font-medium tracking-tight">
                            {msg.role === 'model' ? cleanAIResponse(p.text || "") : p.text}
                          </p>
                        );
                      })}
                    </div>
                    
                    <div className="flex items-center gap-3.5 mt-2 px-1">
                      <span className={`text-[9px] font-bold uppercase tracking-wider ${msg.role === 'user' ? 'text-indigo-500' : 'text-stone-400'}`}>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {msg.role === 'model' && idx > 0 && (
                        <button 
                          onClick={() => onSaveDoubt({
                            question: messages[idx - 1]?.parts[0]?.text || 'Scanned query',
                            answer: cleanAIResponse(msg.parts[0]?.text || ""),
                            subject: 'General'
                          })}
                          className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider text-stone-450 hover:text-indigo-505 transition-colors cursor-pointer"
                        >
                          <i className="fa-solid fa-bookmark text-[9px]"></i> Save card to Vault
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Skeletons */}
              {isLoading && (
                <div className="flex justify-start">
                   <div className="w-full max-w-sm rounded-3xl border border-dashed border-stone-200/60 dark:border-zinc-800 p-6 space-y-3.5 animate-pulse">
                     <div className="flex items-center gap-1.5">
                       <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                       <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                       <span className="text-[9px] font-bold uppercase tracking-wider text-stone-400 ml-1">Decoding sat frequencies...</span>
                     </div>
                     <div className="h-3 bg-stone-200/50 dark:bg-zinc-800 rounded-full w-[85%]"></div>
                     <div className="h-3 bg-stone-200/50 dark:bg-zinc-800 rounded-full w-[95%]"></div>
                     <div className="h-3 bg-stone-200/50 dark:bg-zinc-800 rounded-full w-[60%]"></div>
                   </div>
                </div>
              )}
            </div>

            {/* Input area */}
            <div className={`p-6 lg:p-8 border-t ${isDark ? 'bg-[#121214] border-zinc-800/80' : 'bg-white border-stone-100'} space-y-4`}>
              {vocalError && (
                <div className="max-w-4xl mx-auto p-4 rounded-xl bg-amber-500/10 dark:bg-amber-500/[0.05] border border-amber-500/20 text-amber-600 dark:text-amber-500 text-xs font-semibold leading-relaxed flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-slideDown">
                  <div className="flex gap-2 items-center text-[11px]">
                    <span className="text-sm select-none">⚠️</span>
                    <span>{vocalError}</span>
                  </div>
                  <a 
                    href={window.location.href} 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-1.5 self-end sm:self-auto bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors inline-flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    Open in New Tab <i className="fa-solid fa-arrow-up-right-from-square text-[9px]"></i>
                  </a>
                </div>
              )}

              <div className="max-w-4xl mx-auto flex items-center justify-between gap-3 bg-stone-50 dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 p-1.5 rounded-2xl">
                
                <div className="flex items-center gap-2 pl-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Tutor Node</span>
                </div>

                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder={isListening ? "Listening closely to your query..." : "Ask textbook doubts in English or Hinglish..."}
                  className="flex-1 bg-transparent py-4 px-3 outline-none font-semibold text-sm text-stone-900 dark:text-white placeholder-stone-400"
                />

                <div className="flex items-center gap-1.5">
                  <button 
                    onClick={toggleListening}
                    className={`p-3 rounded-xl transition-all cursor-pointer ${isListening ? 'text-red-500 animate-pulse bg-red-500/10' : 'text-stone-450 hover:text-indigo-500'}`}
                    title={isListening ? "Stop listening" : "Speak Query"}
                  >
                     <i className={`fa-solid ${isListening ? 'fa-microphone animate-bounce' : 'fa-microphone'} text-sm`}></i>
                  </button>

                  <button
                    onClick={handleSend}
                    disabled={isLoading || (!input.trim() && !selectedNoteId)}
                    className="p-3.5 bg-indigo-600 text-white rounded-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-45 cursor-pointer shadow-md shadow-indigo-600/15"
                  >
                    <i className="fa-solid fa-paper-plane text-xs"></i>
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* VIEW 2: AI VOICE DOUBT SOLVER (True Speak-to-Speak Panel) */}
        {activeTool === 'Voice' && (
          <div className={`flex-1 flex flex-col items-center justify-center p-10 max-w-3xl mx-auto space-y-10 text-center`}>
            
            <div className="space-y-2">
              <span className="px-4 py-1.5 bg-indigo-500/10 text-indigo-500 border border-indigo-500/15 rounded-full text-[9px] font-bold uppercase tracking-wider">AI Interactive Voice Sphere</span>
              <h4 className={`text-4xl font-black tracking-tight ${isDark ? 'text-white' : 'text-stone-900'}`}>Hands-Free Vocal Solver</h4>
              <p className="text-xs text-stone-500 leading-normal max-w-md font-semibold mx-auto">
                No typing required. Speak your textbook queries or doubts aloud. The orbit satellite transcribes, solves, and speaks back explanations instantly!
              </p>
            </div>

            {vocalError && (
              <div className="w-full max-w-md p-5 rounded-2xl bg-amber-500/10 dark:bg-amber-500/[0.05] border border-amber-500/20 text-amber-600 dark:text-amber-500 text-left text-xs font-semibold leading-relaxed space-y-3.5 animate-slideDown">
                <div className="flex gap-2.5 items-start">
                  <span className="text-sm select-none">⚠️</span>
                  <span>{vocalError}</span>
                </div>
                <div className="flex gap-3">
                  <a 
                    href={window.location.href} 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all inline-flex items-center gap-1.5 shadow-sm cursor-pointer border border-transparent"
                  >
                    <i className="fa-solid fa-arrow-up-right-from-square"></i> Open in New Tab
                  </a>
                  <button 
                    onClick={() => setVocalError(null)}
                    className="px-3.5 py-2 border border-stone-200 dark:border-zinc-800 text-stone-500 dark:text-zinc-400 hover:bg-stone-100 dark:hover:bg-zinc-900 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer bg-transparent"
                  >
                    Dismiss Warning
                  </button>
                </div>
              </div>
            )}

            {/* Vocal Pulse Radar */}
            <div className="relative flex items-center justify-center w-64 h-64">
              <div className={`absolute w-full h-full rounded-full bg-indigo-500/5 dark:bg-indigo-500/[0.02] border border-dashed border-indigo-500/10 ${isListening || isSpeaking ? 'animate-spin' : ''}`}></div>
              <div className={`absolute w-44 h-44 rounded-full bg-indigo-55/10 dark:bg-indigo-500/[0.03] border border-indigo-55/20 ${isListening || isSpeaking ? 'animate-ping' : ''}`}></div>
              
              <button
                onClick={toggleListening}
                disabled={isLoading}
                className={`w-32 h-32 rounded-full flex flex-col items-center justify-center shadow-lg transition-transform hover:scale-103 cursor-pointer select-none active:scale-95 duration-300 border relative ${
                  isListening 
                    ? 'bg-red-500 border-red-400 text-white shadow-red-500/20' 
                    : isSpeaking 
                      ? 'bg-indigo-600 border-indigo-500 text-white shadow-indigo-500/20' 
                      : 'bg-indigo-500/10 border-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20'
                }`}
              >
                <i className={`fa-solid ${isListening ? 'fa-microphone text-3xl animate-pulse' : isSpeaking ? 'fa-volume-high text-3xl animate-bounce' : 'fa-microphone-lines text-3xl'} text-3xl`}></i>
                <span className="text-[8px] font-extrabold uppercase tracking-widest mt-3.5 block leading-none">
                  {isListening ? 'Listening' : isSpeaking ? 'Speaking back' : 'Tap to speak'}
                </span>
              </button>
            </div>

            {/* Waveform graphic helper */}
            <div className="flex gap-1.5 items-end h-8">
              {[0.1, 0.45, 0.9, 0.35, 1.0, 0.6, 0.25, 0.8, 0.55, 0.1].map((val, ix) => (
                <div 
                  key={ix} 
                  className={`w-1 rounded-full text-indigo-500 transition-all duration-300 ${isListening || isSpeaking ? 'bg-indigo-500' : 'bg-stone-300'}`}
                  style={{ height: `${(isListening || isSpeaking ? val : 0.1) * 100}%` }}
                ></div>
              ))}
            </div>

            {/* Futuristic typing fallback panel for maximum usability inside iframe */}
            <div className="w-full max-w-md mx-auto space-y-2">
              <div className="flex gap-2 bg-stone-50 dark:bg-zinc-900 border border-stone-200 dark:border-zinc-850 p-1.5 rounded-2rem">
                <input
                  type="text"
                  placeholder="Or format / type your vocal doubt here..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && input.trim()) {
                      handleVoiceSendDirect(input);
                      setInput('');
                    }
                  }}
                  className="flex-1 bg-transparent py-3 px-4 outline-none font-semibold text-xs text-stone-900 dark:text-white placeholder-stone-400"
                />
                <button
                  onClick={() => {
                    if (input.trim()) {
                      handleVoiceSendDirect(input);
                      setInput('');
                    }
                  }}
                  disabled={isLoading || !input.trim()}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-[10px] uppercase tracking-wider cursor-pointer disabled:opacity-45 transition-all"
                >
                  Solve
                </button>
              </div>
            </div>

            {/* TTS vocal feedback checkbox */}
            <div className="flex flex-col sm:flex-row items-center gap-6 justify-center">
              <label className="flex items-center gap-2 px-4 py-2 bg-stone-50 dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-xl cursor-pointer">
                <input 
                  type="checkbox"
                  checked={isTtsEnabled}
                  onChange={e => setIsTtsEnabled(e.target.checked)}
                  className="w-4 h-4 accent-indigo-600 cursor-pointer" 
                />
                <span className="text-[10px] font-bold uppercase text-stone-500 tracking-wider">Enable vocal feedback (Narration)</span>
              </label>

              {isSpeaking && (
                <button 
                  onClick={stopSpeaking}
                  className="px-4 py-2 text-[9px] font-bold uppercase tracking-wider text-red-500 bg-red-400/10 hover:bg-red-400/20 border border-red-500/10 rounded-xl transition-all cursor-pointer"
                >
                  <i className="fa-solid fa-volume-xmark mr-1"></i> Stop speaking response
                </button>
              )}
            </div>

            {/* Dynamic verbal transcript query box */}
            {isLoading && (
              <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-505 animate-pulse">
                Satellite processing query frequency...
              </p>
            )}

            {/* Prompt Helper advice with Interactive vocal shortcuts */}
            <div className={`p-6 rounded-2xl max-w-lg w-full border ${isDark ? 'bg-zinc-900/40 border-zinc-900' : 'bg-stone-50/50 border-stone-200/50'} text-left space-y-3`}>
              <p className="text-[10px] font-black uppercase text-indigo-500 tracking-wider flex items-center gap-1.5">
                <i className="fa-solid fa-microphone-lines animate-bounce"></i> Interactive Vocal Suggestions
              </p>
              <p className="text-[11px] text-stone-500 dark:text-zinc-400 leading-relaxed font-semibold">
                Tap any option below to instantly simulate vocal input and voice-solve doubts with Text-to-Speech narration enabled:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  "Explain quantum tunneling simply.",
                  "Derive the quadratic formula step-by-step.",
                  "How does Bernoulli's Aerodynamics work?",
                  "Is gravity constant across our Solar planet orbit?"
                ].map((sStr) => (
                  <button 
                    key={sStr} 
                    onClick={() => handleSimulatedVocalInput(sStr)}
                    className={`p-2.5 rounded-xl border text-left font-semibold text-[11px] leading-snug cursor-pointer transition-all hover:scale-[1.02] flex items-center gap-2 ${
                      isDark 
                        ? 'bg-zinc-950/40 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white lg:hover:bg-zinc-800' 
                        : 'bg-white border-stone-200 text-stone-750 hover:bg-stone-105 hover:text-indigo-600 shadow-sm'
                    }`}
                  >
                    <i className="fa-solid fa-volume-high text-indigo-500 shrink-0 text-[10px]"></i>
                    <span>"{sStr}"</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: CAMERA HOMEWORK SCANNER */}
        {activeTool === 'Scanner' && (
          <div className="flex-1 overflow-y-auto p-6 lg:p-10 space-y-8 custom-scrollbar">
            <div className="max-w-3xl mx-auto space-y-8">
              
              <div className="text-center space-y-2">
                <span className="px-4 py-1.5 bg-indigo-500/10 text-indigo-500 border border-indigo-500/15 rounded-full text-[9px] font-bold uppercase tracking-wider">Multimodal Math & Science Solver</span>
                <h4 className={`text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-stone-900'}`}>Camera Homework Scanner</h4>
                <p className="text-xs text-stone-500 max-w-lg mx-auto font-semibold leading-relaxed">
                  Take a snapshot of any printed workbook sheet, handwritten notebook equation, or textbook figure. MindOrbit's satellite AI translates it into core structured logic instantly!
                </p>
              </div>

              {cameraError && (
                <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/20 text-amber-500 text-xs font-semibold flex items-start gap-2.5 max-w-xl mx-auto shadow-sm text-left">
                  <i className="fa-solid fa-triangle-exclamation text-base shrink-0 mt-0.5 animate-bounce"></i>
                  <div>
                    <p className="font-bold">Camera Scan Notice</p>
                    <p className="text-[11px] leading-relaxed mt-0.5 text-stone-500 dark:text-zinc-400">{cameraError}</p>
                  </div>
                </div>
              )}

              {/* Viewfinder frame */}
              <div className={`aspect-video w-full rounded-[2.5rem] border overflow-hidden relative ${isDark ? 'bg-zinc-950/40 border-zinc-800' : 'bg-stone-100 border-stone-200/50 shadow-inner'} flex flex-col items-center justify-center`}>
                
                {/* Active camera feed stream */}
                {isCameraActive && (
                  <div className="absolute inset-0 w-full h-full bg-black relative">
                    <video 
                      ref={videoRef} 
                      className="w-full h-full object-cover" 
                      playsInline 
                      muted 
                    />
                    {/* Futuristic scanner crosshairs overlays */}
                    <div className="absolute inset-8 border border-white/25 rounded-2xl pointer-events-none flex items-center justify-center">
                      <div className="w-10 h-10 border-t-2 border-l-2 border-indigo-500 absolute top-0 left-0"></div>
                      <div className="w-10 h-10 border-t-2 border-r-2 border-indigo-500 absolute top-0 right-0"></div>
                      <div className="w-10 h-10 border-b-2 border-l-2 border-indigo-500 absolute bottom-0 left-0"></div>
                      <div className="w-10 h-10 border-b-2 border-r-2 border-indigo-500 absolute bottom-0 right-0"></div>
                      <div className="w-full h-0.5 bg-indigo-550/30 absolute shadow-lg shadow-indigo-500 animate-scannerMove"></div>
                    </div>
                  </div>
                )}

                {/* Captured Image Preview showing crop frames */}
                {scannerFile && (
                  <div className="absolute inset-0 w-full h-full bg-zinc-900 relative flex items-center justify-center p-4">
                    <img src={scannerFile} alt="Attached layout preview" className="max-w-full max-h-full object-contain rounded-xl shadow-lg border border-zinc-800" referrerPolicy="no-referrer" />
                    <button 
                      onClick={() => setScannerFile(null)}
                      className="absolute top-4 right-4 w-9 h-9 bg-red-500 text-white rounded-full flex items-center justify-center hover:scale-105 active:scale-95 shadow-lg shadow-red-500/10 cursor-pointer border border-transparent"
                      title="Clear photo"
                    >
                      <i className="fa-solid fa-xmark text-sm"></i>
                    </button>
                  </div>
                )}

                {/* Empty State / Initial Options */}
                {!isCameraActive && !scannerFile && (
                  <div className="p-8 text-center space-y-6">
                    <div className="w-20 h-20 bg-indigo-500/10 text-indigo-500 border border-indigo-150/20 rounded-full flex items-center justify-center text-3xl mx-auto shadow-inner shadow-black/5 animate-pulse">
                      <i className="fa-solid fa-camera"></i>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <button 
                        onClick={handleStartCamera}
                        className="px-6 py-4 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl font-bold uppercase text-[10px] tracking-widest shadow-md hover:scale-101 cursor-pointer transition-all flex items-center gap-1.5 justify-center"
                      >
                        <i className="fa-solid fa-video text-xs"></i> Connect Live Video
                      </button>

                      <label className="px-6 py-4 bg-stone-50 hover:bg-stone-100 dark:bg-zinc-900 dark:hover:bg-zinc-850 text-stone-515 dark:text-zinc-300 border border-stone-250 dark:border-zinc-800 rounded-xl font-bold uppercase text-[10px] tracking-widest cursor-pointer transition-all flex items-center gap-1.5 justify-center">
                        <i className="fa-solid fa-file-arrow-up text-xs"></i> Choose document file
                        <input type="file" onChange={handleFileUpload} accept="image/*" className="hidden" />
                      </label>
                    </div>
                  </div>
                )}

                {/* Video active trigger actions */}
                {isCameraActive && (
                  <div className="absolute bottom-6 left-1/2 -smart-x-1/2 -translate-x-1/2 flex gap-4 min-w-[200px] z-20">
                    <button 
                      onClick={handleCapturePhoto}
                      className="flex-1 py-3 px-5 bg-[#10B981] text-white rounded-xl font-bold text-[10px] uppercase tracking-wider shadow-lg shadow-emerald-500/10 hover:scale-101 transition-all cursor-pointer"
                    >
                      <i className="fa-solid fa-circle-dot mr-1"></i> Capture Photo
                    </button>
                    <button 
                      onClick={handleStopCamera}
                      className="py-3 px-4 bg-zinc-900 text-zinc-300 border border-zinc-850 rounded-xl font-bold text-[10px] uppercase tracking-wider hover:bg-zinc-850 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              {/* Input for scanning parameters and instructions */}
              {scannerFile && (
                <div className={`p-6 rounded-[2rem] border animate-slideDown ${isDark ? 'bg-zinc-900 border-zinc-805' : 'bg-white border-stone-200/50 shadow-md'} space-y-4`}>
                  <div className="space-y-1.5 text-left">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-500"><i className="fa-solid fa-gears mr-1"></i> Smart Scanner instructions</span>
                    <p className="text-[10.5px] italic text-stone-450 leading-relaxed font-semibold">Customize instructions or specify what problem needs attention:</p>
                    <textarea 
                      rows={2}
                      className={`w-full px-4 py-3 rounded-xl border text-xs font-semibold outline-none transition-all ${isDark ? 'bg-zinc-950/40 border-zinc-850 text-white' : 'bg-stone-50 border-stone-200'}`}
                      value={scannerInput}
                      onChange={e => setScannerInput(e.target.value)}
                      placeholder="e.g. solve equation, explain chemistry diagram..."
                    />
                  </div>

                  <div className="flex gap-4 items-center justify-end">
                    <button 
                      onClick={() => setScannerFile(null)}
                      className="text-stone-400 font-bold text-[10px] uppercase hover:underline cursor-pointer"
                    >
                      Reset Picture
                    </button>
                    
                    <button 
                      onClick={handleProcessScan}
                      disabled={isLoading}
                      className="px-6 py-3.5 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl font-bold uppercase tracking-wider text-[10px] shadow-md shadow-indigo-600/10 cursor-pointer hover:scale-101"
                    >
                      {isLoading ? 'Decrypting worksheet...' : 'Launch scanner & Solve ✓'}
                    </button>
                  </div>
                </div>
              )}
              
            </div>
          </div>
        )}

        {/* FALLBACK VOCAL SIMULATION MODAL */}
        {showVocalFallbackModal && (
          <div className="fixed inset-0 bg-stone-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className={`w-full max-w-lg rounded-3xl p-6 lg:p-8 space-y-6 shadow-2xl border ${
              isDark 
                ? 'bg-[#121214] border-zinc-800 text-white' 
                : 'bg-white border-stone-200 text-stone-900'
            }`}>
              <div className="flex justify-between items-start gap-4">
                <div className="space-y-1">
                  <span className="px-3 py-1 bg-indigo-500/10 text-indigo-500 text-[9px] font-black uppercase tracking-wider rounded-full">
                    🎙️ Sandbox Simulator Mode
                  </span>
                  <h3 className="text-xl font-bold tracking-tight">Vocal Dub Simulator</h3>
                </div>
                <button 
                  onClick={() => setShowVocalFallbackModal(false)}
                  className="p-2 hover:bg-stone-100 dark:hover:bg-zinc-800/80 rounded-xl text-stone-450 hover:text-stone-600 transition-colors cursor-pointer bg-transparent border-0"
                >
                  <i className="fa-solid fa-xmark text-sm"></i>
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-xs text-stone-500 dark:text-zinc-400 leading-relaxed font-semibold">
                  Sandbox constraints block real-time audio capture inside embed frames. Speak-solve this doubt seamlessly with the Orbit simulator:
                </p>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-indigo-500 block">Edit Vocal transmission</label>
                  <textarea
                    rows={3}
                    className={`w-full px-4 py-3 rounded-2xl border text-xs font-semibold outline-none transition-all ${
                      isDark 
                        ? 'bg-zinc-950/40 border-zinc-850 text-white focus:border-indigo-500/40' 
                        : 'bg-stone-50 border-stone-200 text-stone-900 focus:border-indigo-500/40'
                    }`}
                    value={fallbackModalInput}
                    onChange={(e) => setFallbackModalInput(e.target.value)}
                    placeholder="Type or format your query here..."
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">Or pick a sample textbook doubt</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      "Explain Bernoulli's principle simply.",
                      "Formulate structural elements of cell membrane.",
                      "What is Lenz's law and energy relation?",
                      "Provide a formula recall trick for Trigonometry."
                    ].map((txt) => (
                      <button
                        key={txt}
                        onClick={() => {
                          setFallbackModalInput(txt);
                        }}
                        className={`p-2.5 rounded-xl border text-left text-[11px] font-semibold cursor-pointer transition-all ${
                          isDark
                            ? 'bg-zinc-950/20 border-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white'
                            : 'bg-stone-50/50 border-stone-100 text-stone-600 hover:bg-stone-100/80 hover:text-indigo-600'
                        }`}
                      >
                        {txt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowVocalFallbackModal(false)}
                  className="px-4 py-2 border border-stone-200 dark:border-zinc-800 rounded-xl text-[10px] font-black uppercase tracking-wider text-stone-400 hover:text-stone-600 dark:text-zinc-400 dark:hover:text-white transition-all cursor-pointer bg-transparent"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (fallbackModalInput.trim()) {
                      setShowVocalFallbackModal(false);
                      handleVoiceSendDirect(fallbackModalInput);
                    }
                  }}
                  disabled={!fallbackModalInput.trim() || isLoading}
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all disabled:opacity-45 cursor-pointer shadow-md shadow-indigo-600/10"
                >
                  Solve with Gemini
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AITutor;
