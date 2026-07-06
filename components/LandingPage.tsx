import React, { useState, useEffect } from 'react';
import { ThemeMode, UserProfile } from '../types';
import { generateStudyPath } from '../services/geminiService';

interface LandingPageProps {
  onStart: (profile: UserProfile) => void;
  theme: ThemeMode;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStart, theme }) => {
  const [stage, setStage] = useState<'splash' | 'onboarding'>('splash');
  const [isFading, setIsFading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Onboarding States
  const [studyMode, setStudyMode] = useState<'class' | 'individual'>('class');
  
  // Class-based states
  const [classLevel, setClassLevel] = useState<string>('Class 10');
  const [courseStream, setCourseStream] = useState<string>('General');
  const [boardUniversity, setBoardUniversity] = useState<string>('CBSE');
  const [semester, setSemester] = useState<string>('N/A');

  // Individual Study states
  const [customSubjects, setCustomSubjects] = useState<string>('Artificial Intelligence, Web Development');
  const [customTopics, setCustomTopics] = useState<string>('React, Neural Networks, TypeScript');
  const [learningGoals, setLearningGoals] = useState<string>('Build a real-world web application and pass coding tests');
  const [targetExam, setTargetExam] = useState<string>('Coding Interviews / SAT Prep');

  const isDark = theme === 'dark';

  useEffect(() => {
    // Initial splash delay
    const timer = setTimeout(() => {
      setIsFading(true);
      setTimeout(() => {
        setStage('onboarding');
        setIsFading(false);
      }, 500);
    }, 1800);
    return () => clearTimeout(timer);
  }, []);

  const handleLaunchClassMode = () => {
    setLoading(true);
    setTimeout(() => {
      const profile: UserProfile = {
        isIndividualStudy: false,
        classLevel,
        course: courseStream,
        boardOrUniversity: boardUniversity,
        semester: semester === 'N/A' ? undefined : semester,
      };
      onStart(profile);
      setLoading(false);
    }, 600);
  };

  const handleLaunchIndividualMode = async () => {
    setLoading(true);
    setError(null);
    try {
      const subjectsList = customSubjects.split(',').map(s => s.trim()).filter(Boolean);
      const topicsList = customTopics.split(',').map(t => t.trim()).filter(Boolean);

      if (subjectsList.length === 0) {
        throw new Error("Please specify at least one subject of interest.");
      }

      // Generate the personalized study path using Gemini
      let pathData = null;
      try {
        pathData = await generateStudyPath(
          subjectsList,
          topicsList,
          learningGoals,
          targetExam
        );
      } catch (geminiErr) {
        console.warn("Gemini study path generation failed, setting high-quality default path", geminiErr);
        // Elegant default fallback study path if offline or API key isn't active yet
        pathData = {
          title: `Custom Path: ${subjectsList[0] || 'My Studies'}`,
          overview: `An AI-structured study path centered around ${subjectsList.join(' and ')} to help you master topics and reach your learning goals.`,
          targetSkills: topicsList.length > 0 ? topicsList : ["Critical Problem Solving", "Analytical Thinking"],
          modules: subjectsList.map((sub, sIdx) => ({
            moduleName: `Module ${sIdx + 1}: ${sub} Fundamentals`,
            description: `Dive deep into core principles, foundational theories, and initial concepts of ${sub}.`,
            suggestedHours: 12,
            subtopics: topicsList.length > 0 ? topicsList : ["Concept Setup", "Initial Practice"],
            learningActivity: `Review core notes, construct visual maps, and take diagnostic mock tests.`
          })),
          milestones: [
            { target: `Complete foundational module 1`, verificationTask: `Score above 80% on the AI generated mock test.` },
            { target: `Apply intermediate skills`, verificationTask: `Draft an interactive notes page summarizing key laws.` }
          ],
          studyTips: [
            "Use Active Recall: Test yourself before reading notes.",
            "Use Spaced Repetition: Review topics at 1, 3, and 7-day intervals."
          ]
        };
      }

      const profile: UserProfile = {
        isIndividualStudy: true,
        selectedSubjects: subjectsList,
        selectedTopics: topicsList,
        learningGoals,
        selectedExams: [targetExam],
        customLearningPath: pathData
      };

      onStart(profile);
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSkipSelection = () => {
    // Quick default profile
    const defaultProfile: UserProfile = {
      isIndividualStudy: false,
      classLevel: 'Class 12',
      course: 'Science',
      boardOrUniversity: 'CBSE'
    };
    onStart(defaultProfile);
  };

  if (stage === 'splash') {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center transition-opacity duration-800 ${isFading ? 'opacity-0' : 'opacity-100'} ${isDark ? 'bg-[#0F0F11]' : 'bg-[#FAFAF9]'}`}>
        <div className="relative">
          <div className="w-20 h-20 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-3xl flex items-center justify-center shadow-xl shadow-indigo-500/20 animate-bounce">
            <i className="fa-solid fa-rocket text-white text-3xl"></i>
          </div>
          <div className="absolute inset-[-24px] border border-indigo-500/10 rounded-full animate-orbit"></div>
        </div>
        
        <div className="mt-10 text-center">
          <h1 className={`text-3xl font-black tracking-tight ${isDark ? 'text-zinc-100' : 'text-stone-900'}`}>MindOrbit</h1>
          <p className="text-emerald-500/90 font-bold text-[9px] uppercase tracking-[0.25em] mt-2">Personalized AI Study Space</p>
        </div>

        <div className="flex gap-1.5 mt-12">
          <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></div>
          <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse [animation-delay:-0.2s]"></div>
          <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse [animation-delay:-0.4s]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-4 lg:p-8 relative overflow-y-auto transition-all duration-1000 ${isDark ? 'bg-[#0F0F11]' : 'bg-[#FAFAF9]'}`}>
      {/* Soft Ambient Blur Glows */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[100px]"></div>
      <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[90px]"></div>

      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10 my-4">
        
        {/* Left Descriptive Column */}
        <div className="lg:col-span-5 flex flex-col items-start space-y-6 text-left pr-4 hidden lg:flex">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-indigo-500/10 rounded-full text-indigo-500 font-extrabold text-[10px] uppercase tracking-wider">
            <i className="fa-solid fa-graduation-cap"></i> Dynamic Onboarding
          </div>
          <h2 className={`text-4xl font-extrabold leading-[1.15] tracking-tight ${isDark ? 'text-zinc-100' : 'text-stone-900'}`}>
            Configure your <br />
            <span className="bg-gradient-to-r from-indigo-400 via-indigo-500 to-purple-500 bg-clip-text text-transparent">academic orbit.</span>
          </h2>
          <p className="text-stone-500 dark:text-zinc-400 font-medium text-sm leading-relaxed">
            Choose whether to sync your school syllabus for focused board prep, or chart an independent course to master new software skills or crack entrance tests.
          </p>

          <div className="space-y-4 pt-2">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500 text-sm shrink-0">
                <i className="fa-solid fa-list-check"></i>
              </div>
              <div>
                <p className={`text-xs font-bold ${isDark ? 'text-zinc-200' : 'text-stone-800'}`}>Smart Syllabi Matching</p>
                <p className="text-[11px] text-stone-500 dark:text-zinc-400 mt-0.5">Auto-injects chapters, sample notes, and previous year exams.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500 text-sm shrink-0">
                <i className="fa-solid fa-diagram-project"></i>
              </div>
              <div>
                <p className={`text-xs font-bold ${isDark ? 'text-zinc-200' : 'text-stone-800'}`}>Generative Study Paths</p>
                <p className="text-[11px] text-stone-500 dark:text-zinc-400 mt-0.5">Let Gemini customize your weekly plan, milestones, and tips.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Dynamic Form Column */}
        <div className="lg:col-span-7 w-full">
          <div className={`card-premium rounded-[2.5rem] p-6 lg:p-8 ${isDark ? 'bg-zinc-950/40 border-zinc-800/80' : 'bg-white border-stone-200/60 shadow-xl'}`}>
            <div className="flex justify-between items-center mb-6">
              <div className="text-left">
                <h3 className={`text-xl font-bold tracking-tight ${isDark ? 'text-zinc-100' : 'text-stone-900'}`}>
                  Academic Profile Setup
                </h3>
                <p className="text-stone-500 dark:text-zinc-400 text-xs mt-1">Customize how your AI workspace organizes content.</p>
              </div>
              <button
                onClick={handleSkipSelection}
                className="text-[11px] font-bold text-stone-400 hover:text-indigo-500 transition-colors cursor-pointer"
              >
                Skip Setup
              </button>
            </div>

            {/* Mode Select Tabs */}
            <div className={`grid grid-cols-2 p-1 rounded-2xl mb-6 ${isDark ? 'bg-zinc-900/60 border border-zinc-800' : 'bg-stone-100'}`}>
              <button
                type="button"
                onClick={() => setStudyMode('class')}
                className={`py-3 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                  studyMode === 'class'
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow'
                    : 'text-stone-500 hover:text-stone-700 dark:text-zinc-400'
                }`}
              >
                <i className="fa-solid fa-school text-sm"></i>
                <span>Class-Based Learning</span>
              </button>
              <button
                type="button"
                onClick={() => setStudyMode('individual')}
                className={`py-3 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                  studyMode === 'individual'
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow'
                    : 'text-stone-500 hover:text-stone-700 dark:text-zinc-400'
                }`}
              >
                <i className="fa-solid fa-user-astronaut text-sm"></i>
                <span>Individual Study</span>
              </button>
            </div>

            {error && (
              <div className="mb-4 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs text-left flex items-start gap-2.5">
                <i className="fa-solid fa-circle-exclamation shrink-0 mt-0.5"></i>
                <p>{error}</p>
              </div>
            )}

            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                <div className="relative">
                  <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <i className="fa-solid fa-wand-magic-sparkles text-indigo-500 text-sm animate-pulse"></i>
                  </div>
                </div>
                <div>
                  <p className={`text-xs font-black uppercase tracking-wider ${isDark ? 'text-zinc-300' : 'text-stone-800'}`}>
                    {studyMode === 'individual' ? 'Generative Matrix Synthesis...' : 'Configuring Academic Framework...'}
                  </p>
                  <p className="text-[10px] text-stone-500 dark:text-zinc-400 mt-1.5 max-w-xs mx-auto leading-relaxed">
                    {studyMode === 'individual'
                      ? 'Gemini is custom tailoring subjects, milestones, activities, and specific study recommendations.'
                      : 'Setting up syllabi chapters, exam structures, and practice sets.'}
                  </p>
                </div>
              </div>
            ) : studyMode === 'class' ? (
              /* Class-Based Form */
              <div className="space-y-4 text-left">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-[10px] font-extrabold uppercase tracking-widest mb-1.5 ${isDark ? 'text-zinc-400' : 'text-stone-500'}`}>
                      Select Class / Grade
                    </label>
                    <select
                      value={classLevel}
                      onChange={(e) => setClassLevel(e.target.value)}
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
                      <option value="Other Higher Education">Other College/University</option>
                    </select>
                  </div>

                  <div>
                    <label className={`block text-[10px] font-extrabold uppercase tracking-widest mb-1.5 ${isDark ? 'text-zinc-400' : 'text-stone-500'}`}>
                      Course / Stream
                    </label>
                    <select
                      value={courseStream}
                      onChange={(e) => setCourseStream(e.target.value)}
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
                    <label className={`block text-[10px] font-extrabold uppercase tracking-widest mb-1.5 ${isDark ? 'text-zinc-400' : 'text-stone-500'}`}>
                      Board / University
                    </label>
                    <input
                      type="text"
                      value={boardUniversity}
                      onChange={(e) => setBoardUniversity(e.target.value)}
                      placeholder="e.g. CBSE, ICSE, Delhi University, MIT"
                      className={`w-full p-3 rounded-xl text-xs font-semibold border ${
                        isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-200' : 'bg-white border-stone-200 text-stone-800'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-[10px] font-extrabold uppercase tracking-widest mb-1.5 ${isDark ? 'text-zinc-400' : 'text-stone-500'}`}>
                      Semester (if applicable)
                    </label>
                    <select
                      value={semester}
                      onChange={(e) => setSemester(e.target.value)}
                      className={`w-full p-3 rounded-xl text-xs font-semibold border ${
                        isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-200' : 'bg-white border-stone-200 text-stone-800'
                      }`}
                    >
                      <option value="N/A">N/A (Full Year Course)</option>
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

                <div className="pt-4">
                  <button
                    onClick={handleLaunchClassMode}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-xs uppercase tracking-widest hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <i className="fa-solid fa-circle-play text-sm"></i>
                    <span>Initialize Class Workspace</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Individual Study Form */
              <div className="space-y-4 text-left">
                <div>
                  <label className={`block text-[10px] font-extrabold uppercase tracking-widest mb-1.5 ${isDark ? 'text-zinc-400' : 'text-stone-500'}`}>
                    Subjects of Interest (Comma-separated)
                  </label>
                  <input
                    type="text"
                    value={customSubjects}
                    onChange={(e) => setCustomSubjects(e.target.value)}
                    placeholder="e.g. Artificial Intelligence, German, Advanced Physics"
                    className={`w-full p-3 rounded-xl text-xs font-semibold border ${
                      isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-200' : 'bg-white border-stone-200 text-stone-800'
                    }`}
                  />
                  <p className="text-[10px] text-stone-400 mt-1">Separate with commas. These will form your main workspace panels.</p>
                </div>

                <div>
                  <label className={`block text-[10px] font-extrabold uppercase tracking-widest mb-1.5 ${isDark ? 'text-zinc-400' : 'text-stone-500'}`}>
                    Topics, Skills, or Concepts to Master
                  </label>
                  <input
                    type="text"
                    value={customTopics}
                    onChange={(e) => setCustomTopics(e.target.value)}
                    placeholder="e.g. React hooks, Convolutional Networks, Quantum entanglement"
                    className={`w-full p-3 rounded-xl text-xs font-semibold border ${
                      isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-200' : 'bg-white border-stone-200 text-stone-800'
                    }`}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-[10px] font-extrabold uppercase tracking-widest mb-1.5 ${isDark ? 'text-zinc-400' : 'text-stone-500'}`}>
                      Target Exam or Career Goal
                    </label>
                    <input
                      type="text"
                      value={targetExam}
                      onChange={(e) => setTargetExam(e.target.value)}
                      placeholder="e.g. SAT Exam, Full Stack Developer job, JEE"
                      className={`w-full p-3 rounded-xl text-xs font-semibold border ${
                        isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-200' : 'bg-white border-stone-200 text-stone-800'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-[10px] font-extrabold uppercase tracking-widest mb-1.5 ${isDark ? 'text-zinc-400' : 'text-stone-500'}`}>
                      Specific Learning Goal
                    </label>
                    <input
                      type="text"
                      value={learningGoals}
                      onChange={(e) => setLearningGoals(e.target.value)}
                      placeholder="e.g. Build an app, solve past questions"
                      className={`w-full p-3 rounded-xl text-xs font-semibold border ${
                        isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-200' : 'bg-white border-stone-200 text-stone-800'
                      }`}
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    onClick={handleLaunchIndividualMode}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs uppercase tracking-widest hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-purple-500/15"
                  >
                    <i className="fa-solid fa-wand-magic-sparkles text-sm"></i>
                    <span>Generate AI Study Path</span>
                  </button>
                </div>
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-stone-200/40 dark:border-zinc-800/60 flex flex-col items-center">
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                No Cloud Cost • Always Saved Locally 👋
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 text-[9px] font-semibold uppercase tracking-[0.3em] text-stone-400/50">
        MindOrbit • Pure Study Architecture
      </div>
    </div>
  );
};

export default LandingPage;
