import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import AITutor from './components/AITutor';
import SyllabusTracker from './components/SyllabusTracker';
import NotesManager from './components/NotesManager';
import LandingPage from './components/LandingPage';
import StudyPlanner from './components/StudyPlanner';
import DeepDive from './components/DeepDive';
import MockTest from './components/MockTest';
import DoubtVault from './components/DoubtVault';
import StudyReplay from './components/StudyReplay';
import FocusRooms from './components/FocusRooms';
import RevisionPlanner from './components/RevisionPlanner';
import { Subject, Note, Doubt, Reminder, ThemeMode, Badge, Message, SyllabusTopic, UserProfile } from './types';
import { INITIAL_SYLLABUS, INITIAL_BADGES, INITIAL_CHAT_MESSAGES, APP_MODES } from './constants';

const App: React.FC = () => {
  const [activeMode, setActiveMode] = useState<string>(APP_MODES.LANDING);

  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    try {
      const local = localStorage.getItem('mindorbit_user_profile_v1');
      return local ? JSON.parse(local) : null;
    } catch {
      return null;
    }
  });

  // Auto-route on mount if locked in or profile exists
  useEffect(() => {
    const lockUntilText = localStorage.getItem('mindorbit_focus_lock_until');
    if (lockUntilText && Number(lockUntilText) > Date.now()) {
      setActiveMode(APP_MODES.FOCUS_ROOMS);
    } else {
      const savedProfile = localStorage.getItem('mindorbit_user_profile_v1');
      if (savedProfile) {
        setActiveMode(APP_MODES.DASHBOARD);
      }
    }
  }, []);

  const handleNavigate = useCallback((newMode: string) => {
    const lockUntilText = localStorage.getItem('mindorbit_focus_lock_until');
    if (lockUntilText) {
      const lockUntil = Number(lockUntilText);
      if (lockUntil > Date.now() && newMode !== APP_MODES.FOCUS_ROOMS) {
        const remaining = Math.max(0, Math.ceil((lockUntil - Date.now()) / 1000));
        const mins = Math.floor(remaining / 60);
        const secs = remaining % 60;
        alert(`🔒 LOCK-IN ACTIVE: You pledged to study with ultimate focus and cannot navigate away until your countdown is done!\n\nTime Remaining: ${mins}m ${secs}s.\nLet's respect our pledge!`);
        return;
      }
    }
    setActiveMode(newMode);
  }, []);

  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('mindorbit_theme');
    return (saved as ThemeMode) || 'dark';
  });
  const [isOffline, setIsOffline] = useState<boolean>(false);

  const [subjects, setSubjects] = useState<Subject[]>(() => {
    try {
      const local = localStorage.getItem('mindorbit_syllabus_v3');
      return local ? JSON.parse(local) : INITIAL_SYLLABUS;
    } catch {
      return INITIAL_SYLLABUS;
    }
  });
  const [notes, setNotes] = useState<Note[]>(() => {
    try {
      const local = localStorage.getItem('mindorbit_notes');
      return local ? JSON.parse(local) : [];
    } catch {
      return [];
    }
  });
  const [doubts, setDoubts] = useState<Doubt[]>(() => {
    try {
      const local = localStorage.getItem('mindorbit_doubts');
      return local ? JSON.parse(local) : [];
    } catch {
      return [];
    }
  });
  const [reminders, setReminders] = useState<Reminder[]>(() => {
    try {
      const local = localStorage.getItem('mindorbit_reminders');
      return local ? JSON.parse(local) : [];
    } catch {
      return [];
    }
  });
  const [badges, setBadges] = useState<Badge[]>(() => {
    try {
      const local = localStorage.getItem('mindorbit_badges');
      return local ? JSON.parse(local) : INITIAL_BADGES;
    } catch {
      return INITIAL_BADGES;
    }
  });
  const [chatHistory, setChatHistory] = useState<Message[]>(() => {
    try {
      const local = localStorage.getItem('mindorbit_chat_v1');
      return local ? JSON.parse(local) : INITIAL_CHAT_MESSAGES;
    } catch {
      return INITIAL_CHAT_MESSAGES;
    }
  });
  const [studyStreak, setStudyStreak] = useState<number>(() => {
    try {
      const local = localStorage.getItem('mindorbit_streak');
      return local ? Number(local) : 3;
    } catch {
      return 3;
    }
  });

  useEffect(() => {
    if (activeMode !== APP_MODES.LANDING) {
      localStorage.setItem('mindorbit_syllabus_v3', JSON.stringify(subjects));
      localStorage.setItem('mindorbit_notes', JSON.stringify(notes));
      localStorage.setItem('mindorbit_doubts', JSON.stringify(doubts));
      localStorage.setItem('mindorbit_reminders', JSON.stringify(reminders));
      localStorage.setItem('mindorbit_badges', JSON.stringify(badges));
      localStorage.setItem('mindorbit_chat_v1', JSON.stringify(chatHistory));
      localStorage.setItem('mindorbit_streak', studyStreak.toString());
      localStorage.setItem('mindorbit_theme', theme);
      if (userProfile) {
        localStorage.setItem('mindorbit_user_profile_v1', JSON.stringify(userProfile));
      }
    }
    document.body.className = theme;
  }, [subjects, notes, doubts, reminders, badges, chatHistory, studyStreak, theme, activeMode, userProfile]);


  // Dynamic automatic Badge unlock evaluation engine
  useEffect(() => {
    const resolvedCount = doubts.filter(d => d.resolved).length;
    const completedSomeTopics = subjects.some(s => s.topics.length > 0 && s.topics.filter(t => t.completed).length >= 3);
    const completedSubjectAll = subjects.some(s => s.topics.length > 0 && s.topics.every(t => t.completed));
    const consistencyKingUnlocked = completedSomeTopics || completedSubjectAll;

    const currentHour = new Date().getHours();
    const isLateHour = currentHour >= 22 || currentHour < 5;
    const studiedLate = reminders.some(r => r.completed && (r.time.toLowerCase().includes('pm') && (r.time.startsWith('10') || r.time.startsWith('11') || r.time.startsWith('12')))) || isLateHour;

    setBadges(prev => {
      let changed = false;
      const updated = prev.map(badge => {
        let shouldUnlock = badge.unlocked;
        if (badge.id === '1') {
          shouldUnlock = studyStreak >= 3;
        } else if (badge.id === '2') {
          shouldUnlock = resolvedCount >= 3;
        } else if (badge.id === '3') {
          shouldUnlock = consistencyKingUnlocked;
        } else if (badge.id === '4') {
          shouldUnlock = studiedLate;
        }

        if (shouldUnlock !== badge.unlocked) {
          changed = true;
          return { ...badge, unlocked: shouldUnlock };
        }
        return badge;
      });

      return changed ? updated : prev;
    });
  }, [doubts, subjects, reminders, studyStreak]);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
  };

  const handleAuthSuccess = useCallback((profile: UserProfile) => {
    setUserProfile(profile);
    localStorage.setItem('mindorbit_user_profile_v1', JSON.stringify(profile));
    
    // Auto-populate relevant subjects based on the profile
    let matchingSubjects: Subject[] = [];
    
    if (profile.isIndividualStudy) {
      const subs = profile.selectedSubjects || ["General Skills"];
      matchingSubjects = subs.map((s, idx) => ({
        id: `custom-sub-${idx}-${Math.random().toString(36).substr(2, 5)}`,
        name: s,
        classLevel: "Individual Study",
        stream: "General",
        topics: (profile.customLearningPath?.modules || []).map((m: any, mIdx: number) => ({
          id: `custom-topic-${idx}-${mIdx}`,
          name: m.moduleName,
          completed: false,
          revisionStatus: 'Not Started' as const
        }))
      }));
      
      if (matchingSubjects.every(sub => sub.topics.length === 0)) {
        matchingSubjects.forEach(sub => {
          sub.topics = [
            { id: `topic-sub-${Math.random()}`, name: 'Fundamentals and Basics', completed: false, revisionStatus: 'Not Started' },
            { id: `topic-sub-${Math.random()}`, name: 'Core Concepts Exploration', completed: false, revisionStatus: 'Not Started' },
            { id: `topic-sub-${Math.random()}`, name: 'Advanced Hands-on Practice', completed: false, revisionStatus: 'Not Started' },
            { id: `topic-sub-${Math.random()}`, name: 'Milestone Verification Quiz', completed: false, revisionStatus: 'Not Started' }
          ];
        });
      }
    } else {
      const level = profile.classLevel || 'Class 10';
      const stream = profile.course || 'General';
      
      matchingSubjects = INITIAL_SYLLABUS.filter(s => {
        const classMatch = s.classLevel.toLowerCase() === level.toLowerCase();
        const streamMatch = s.stream === 'General' || s.stream.toLowerCase() === stream.toLowerCase();
        return classMatch && streamMatch;
      });
      
      if (matchingSubjects.length === 0) {
        if (level.includes('B.Tech') || level.includes('B.Sc') || stream.includes('Science') || stream.includes('Engineering') || stream.includes('Computer')) {
          matchingSubjects = [
            {
              id: 'col-cs-1',
              name: 'Data Structures & Algorithms',
              classLevel: level,
              stream: 'Science',
              topics: [
                { id: 'ds-1', name: 'Asymptotic Analysis & Big O', completed: false, revisionStatus: 'Not Started' },
                { id: 'ds-2', name: 'Linked Lists, Stacks, and Queues', completed: false, revisionStatus: 'Not Started' },
                { id: 'ds-3', name: 'Binary Trees & Balanced Search Trees', completed: false, revisionStatus: 'Not Started' },
                { id: 'ds-4', name: 'Graph Algorithms & Traversals', completed: false, revisionStatus: 'Not Started' },
                { id: 'ds-5', name: 'Dynamic Programming & Recursion', completed: false, revisionStatus: 'Not Started' }
              ]
            },
            {
              id: 'col-cs-2',
              name: 'Database Management Systems',
              classLevel: level,
              stream: 'Science',
              topics: [
                { id: 'db-1', name: 'Relational Model & ER Diagrams', completed: false, revisionStatus: 'Not Started' },
                { id: 'db-2', name: 'SQL Querying and Joins', completed: false, revisionStatus: 'Not Started' },
                { id: 'db-3', name: 'Normal Forms & Normalization', completed: false, revisionStatus: 'Not Started' },
                { id: 'db-4', name: 'Indexing, B-Trees & Performance', completed: false, revisionStatus: 'Not Started' }
              ]
            },
            {
              id: 'col-math-3',
              name: 'Advanced Calculus',
              classLevel: level,
              stream: 'Science',
              topics: [
                { id: 'math-1', name: 'Limits & Partial Derivatives', completed: false, revisionStatus: 'Not Started' },
                { id: 'math-2', name: 'Multiple Integrals', completed: false, revisionStatus: 'Not Started' },
                { id: 'math-3', name: 'Differential Equations', completed: false, revisionStatus: 'Not Started' }
              ]
            }
          ];
        } else if (level.includes('MBA') || level.includes('Business') || stream.includes('Commerce') || stream.includes('Management')) {
          matchingSubjects = [
            {
              id: 'col-mba-1',
              name: 'Strategic Management',
              classLevel: level,
              stream: 'Commerce',
              topics: [
                { id: 'sm-1', name: 'SWOT & PESTEL Frameworks', completed: false, revisionStatus: 'Not Started' },
                { id: 'sm-2', name: 'Porter\'s Five Forces Analysis', completed: false, revisionStatus: 'Not Started' },
                { id: 'sm-3', name: 'Blue Ocean vs Red Ocean Strategy', completed: false, revisionStatus: 'Not Started' },
                { id: 'sm-4', name: 'Corporate Governance & Ethics', completed: false, revisionStatus: 'Not Started' }
              ]
            },
            {
              id: 'col-mba-2',
              name: 'Financial Accounting & Reporting',
              classLevel: level,
              stream: 'Commerce',
              topics: [
                { id: 'fa-1', name: 'Balance Sheets & Income Statements', completed: false, revisionStatus: 'Not Started' },
                { id: 'fa-2', name: 'Cash Flow Analysis & Ratio Metrics', completed: false, revisionStatus: 'Not Started' },
                { id: 'fa-3', name: 'Double Entry Ledger Systems', completed: false, revisionStatus: 'Not Started' }
              ]
            },
            {
              id: 'col-mba-3',
              name: 'Marketing Management',
              classLevel: level,
              stream: 'Commerce',
              topics: [
                { id: 'mkt-1', name: 'The 4 Ps of Marketing', completed: false, revisionStatus: 'Not Started' },
                { id: 'mkt-2', name: 'Customer Segmentation & Targeting', completed: false, revisionStatus: 'Not Started' },
                { id: 'mkt-3', name: 'Brand Positioning & Equity', completed: false, revisionStatus: 'Not Started' }
              ]
            }
          ];
        } else {
          matchingSubjects = [
            {
              id: 'col-gen-1',
              name: 'Critical Thinking & Writing',
              classLevel: level,
              stream: 'General',
              topics: [
                { id: 'ct-1', name: 'Structuring Logical Arguments', completed: false, revisionStatus: 'Not Started' },
                { id: 'ct-2', name: 'Academic Research & Citations', completed: false, revisionStatus: 'Not Started' },
                { id: 'ct-3', name: 'Rhetorical Patterns & Analysis', completed: false, revisionStatus: 'Not Started' }
              ]
            },
            {
              id: 'col-gen-2',
              name: 'Principles of Economics',
              classLevel: level,
              stream: 'General',
              topics: [
                { id: 'ec-1', name: 'Supply, Demand, and Equilibrium', completed: false, revisionStatus: 'Not Started' },
                { id: 'ec-2', name: 'Elasticity & Market Structures', completed: false, revisionStatus: 'Not Started' },
                { id: 'ec-3', name: 'Macroeconomic Metrics: GDP & Inflation', completed: false, revisionStatus: 'Not Started' }
              ]
            }
          ];
        }
      }
    }
    
    setSubjects(matchingSubjects);
    localStorage.setItem('mindorbit_syllabus_v3', JSON.stringify(matchingSubjects));
    setActiveMode(APP_MODES.DASHBOARD);
  }, []);

  const handleSwitchStudyMode = useCallback((toIndividual: boolean, newProfile?: UserProfile) => {
    setUserProfile(prev => {
      const activeProf = prev || { isIndividualStudy: !toIndividual };
      const updatedProfile = newProfile || {
        ...activeProf,
        isIndividualStudy: toIndividual
      };
      
      // Save the current subjects list to preserve progress
      if (activeProf.isIndividualStudy) {
        localStorage.setItem('mindorbit_syllabus_individual', JSON.stringify(subjects));
      } else {
        localStorage.setItem('mindorbit_syllabus_class_based', JSON.stringify(subjects));
      }
      
      // Load the other mode's subjects if available
      let otherSubjects: Subject[] = [];
      const cachedKey = toIndividual ? 'mindorbit_syllabus_individual' : 'mindorbit_syllabus_class_based';
      const cached = localStorage.getItem(cachedKey);
      
      if (cached) {
        otherSubjects = JSON.parse(cached);
      } else {
        if (toIndividual) {
          const subs = updatedProfile.selectedSubjects || ["General Skills"];
          otherSubjects = subs.map((s, idx) => ({
            id: `custom-sub-${idx}-${Math.random().toString(36).substr(2, 5)}`,
            name: s,
            classLevel: "Individual Study",
            stream: "General",
            topics: (updatedProfile.customLearningPath?.modules || []).map((m: any, mIdx: number) => ({
              id: `custom-topic-${idx}-${mIdx}`,
              name: m.moduleName,
              completed: false,
              revisionStatus: 'Not Started' as const
            }))
          }));
          if (otherSubjects.every(sub => sub.topics.length === 0)) {
            otherSubjects.forEach(sub => {
              sub.topics = [
                { id: `topic-sub-${Math.random()}`, name: 'Fundamentals and Basics', completed: false, revisionStatus: 'Not Started' as const },
                { id: `topic-sub-${Math.random()}`, name: 'Core Concepts Exploration', completed: false, revisionStatus: 'Not Started' as const },
                { id: `topic-sub-${Math.random()}`, name: 'Advanced Hands-on Practice', completed: false, revisionStatus: 'Not Started' as const },
                { id: `topic-sub-${Math.random()}`, name: 'Milestone Verification Quiz', completed: false, revisionStatus: 'Not Started' as const }
              ];
            });
          }
        } else {
          const level = updatedProfile.classLevel || 'Class 10';
          const stream = updatedProfile.course || 'General';
          otherSubjects = INITIAL_SYLLABUS.filter(s => {
            const classMatch = s.classLevel.toLowerCase() === level.toLowerCase();
            const streamMatch = s.stream === 'General' || s.stream.toLowerCase() === stream.toLowerCase();
            return classMatch && streamMatch;
          });
        }
      }
      
      setSubjects(otherSubjects);
      localStorage.setItem('mindorbit_syllabus_v3', JSON.stringify(otherSubjects));
      localStorage.setItem('mindorbit_user_profile_v1', JSON.stringify(updatedProfile));
      
      return updatedProfile;
    });
  }, [subjects]);

  const handleLogout = () => {
    setActiveMode(APP_MODES.LANDING);
  };

  const handleSetStudyStreak = (streak: number) => {
    setStudyStreak(streak);
  };

  const handleToggleTopic = (subjectId: string, topicId: string) => {
    const updatedSubjects = subjects.map(s => s.id === subjectId ? { ...s, topics: s.topics.map(t => t.id === topicId ? { ...t, completed: !t.completed } : t) } : s);
    setSubjects(updatedSubjects);
  };

  const handleUpdateRevisionStatus = (subjectId: string, topicId: string, status: SyllabusTopic['revisionStatus']) => {
    const updatedSubjects = subjects.map(s => s.id === subjectId ? { ...s, topics: s.topics.map(t => t.id === topicId ? { ...t, revisionStatus: status } : t) } : s);
    setSubjects(updatedSubjects);
  };

  const handleAddTopic = (subjectId: string, name: string) => {
    const updatedSubjects = subjects.map(s => s.id === subjectId ? {
      ...s,
      topics: [
        ...s.topics,
        { id: `topic-${Math.random().toString(36).substr(2, 5)}`, name, completed: false, revisionStatus: 'Not Started' }
      ]
    } : s);
    setSubjects(updatedSubjects);
  };

  const handleDeleteTopic = (subjectId: string, topicId: string) => {
    const updatedSubjects = subjects.map(s => s.id === subjectId ? {
      ...s,
      topics: s.topics.filter(t => t.id !== topicId)
    } : s);
    setSubjects(updatedSubjects);
  };

  const handleResetSubject = (subjectId: string) => {
    const updatedSubjects = subjects.map(s => s.id === subjectId ? {
      ...s,
      topics: s.topics.map(t => ({ ...t, completed: false, revisionStatus: 'Not Started' }))
    } : s);
    setSubjects(updatedSubjects);
  };

  const handleAddSubject = (name: string, classLevel: string) => {
    const newSubject: Subject = {
      id: `subj-${Math.random().toString(36).substr(2, 5)}`,
      name,
      classLevel,
      stream: 'General',
      topics: [
        { id: `topic-${Math.random()}`, name: 'Introductory Chapter', completed: false, revisionStatus: 'Not Started' }
      ]
    };
    setSubjects(prev => [...prev, newSubject]);
  };

  const handleAddNote = (newNoteData: Omit<Note, 'id' | 'timestamp'>) => {
    const newNote: Note = { ...newNoteData, id: Math.random().toString(36).substr(2, 9), timestamp: Date.now() };
    setNotes(prev => [newNote, ...prev]);
  };

  const handleDeleteNote = (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
  };

  const handleSaveDoubt = (doubtData: Omit<Doubt, 'id' | 'timestamp' | 'resolved'>) => {
    const newDoubt: Doubt = { ...doubtData, id: Math.random().toString(36).substr(2, 9), timestamp: Date.now(), resolved: false };
    setDoubts(prev => [newDoubt, ...prev]);
  };

  const handleToggleDoubtResolved = (id: string) => {
    const updatedDoubts = doubts.map(d => d.id === id ? { ...d, resolved: !d.resolved } : d);
    setDoubts(updatedDoubts);
  };

  const handleDeleteDoubt = (id: string) => {
    setDoubts(prev => prev.filter(d => d.id !== id));
  };

  const handleAddReminder = (
    task: string, 
    time: string, 
    type: Reminder['type'] = 'Study',
    priority: Reminder['priority'] = 'Medium',
    estimatedPomodoros: number = 1
  ) => {
    const newReminder: Reminder = { 
      id: Math.random().toString(36).substr(2, 9), 
      task, 
      time, 
      completed: false, 
      type,
      priority,
      estimatedPomodoros,
      completedPomodoros: 0
    };
    setReminders(prev => [...prev, newReminder]);
  };

  const handleIncrementTaskPomodoro = (id: string) => {
    const updatedReminders = reminders.map(r => r.id === id ? {
      ...r,
      completedPomodoros: Math.min((r.completedPomodoros || 0) + 1, r.estimatedPomodoros || 1)
    } : r);
    setReminders(updatedReminders);
  };

  const toggleReminder = (id: string) => {
    const updatedReminders = reminders.map(r => r.id === id ? { ...r, completed: !r.completed } : r);
    setReminders(updatedReminders);
  };

  const deleteReminder = (id: string) => {
    setReminders(prev => prev.filter(r => r.id !== id));
  };

  const handleUpdateChatHistory = (newChat: Message[] | ((prev: Message[]) => Message[])) => {
    setChatHistory(prev => {
      const next = typeof newChat === 'function' ? newChat(prev) : newChat;
      return next;
    });
  };

  const renderContent = () => {
    const isDark = theme === 'dark';
    switch (activeMode) {
      case APP_MODES.DASHBOARD:
        return (
          <Dashboard 
            subjects={subjects} 
            notes={notes} 
            doubts={doubts} 
            theme={theme} 
            badges={badges} 
            studyStreak={studyStreak}
            onSetStudyStreak={handleSetStudyStreak}
            onUnlockBadge={(id) => {
              const updatedBadges = badges.map(b => b.id === id ? { ...b, unlocked: true } : b);
              setBadges(updatedBadges);
            }}
            isOffline={isOffline}
            onNavigate={handleNavigate}
            reminders={reminders}
            userProfile={userProfile}
            onSwitchStudyMode={handleSwitchStudyMode}
          />
        );
      case APP_MODES.CHAT:
        return <AITutor messages={chatHistory} setMessages={handleUpdateChatHistory} notes={notes} onSaveDoubt={handleSaveDoubt} theme={theme} isOffline={isOffline} />;
      case APP_MODES.PLANNER:
        return (
          <StudyPlanner 
            reminders={reminders} 
            onAddReminder={handleAddReminder} 
            onToggleReminder={toggleReminder} 
            onDeleteReminder={deleteReminder} 
            onIncrementTaskPomodoro={handleIncrementTaskPomodoro}
            theme={theme} 
            isOffline={isOffline}
          />
        );
      case APP_MODES.SYLLABUS:
        return (
          <SyllabusTracker 
            subjects={subjects} 
            onToggleTopic={handleToggleTopic} 
            onUpdateRevisionStatus={handleUpdateRevisionStatus}
            onAddSubject={handleAddSubject} 
            onAddTopic={handleAddTopic}
            onDeleteTopic={handleDeleteTopic}
            onResetSubject={handleResetSubject}
            theme={theme} 
          />
        );
      case APP_MODES.NOTES:
        return <NotesManager notes={notes} onAddNote={handleAddNote} onDeleteNote={handleDeleteNote} theme={theme} isOffline={isOffline} />;
      case APP_MODES.DEEP_DIVE:
        return <DeepDive theme={theme} />;
      case APP_MODES.MOCK_TEST:
        return <MockTest subjects={subjects} theme={theme} />;
      case APP_MODES.DOUBTS:
        return (
          <DoubtVault 
            doubts={doubts} 
            onSaveDoubt={handleSaveDoubt} 
            onToggleResolved={handleToggleDoubtResolved} 
            onDeleteDoubt={handleDeleteDoubt} 
            theme={theme} 
          />
        );
      case APP_MODES.FOCUS_ROOMS:
        return (
          <FocusRooms 
            theme={theme} 
          />
        );
      case APP_MODES.REVISION_PLANS:
        return (
          <RevisionPlanner 
            subjects={subjects} 
            theme={theme} 
            onNavigateToMockTest={() => {
              handleNavigate(APP_MODES.MOCK_TEST);
            }}
          />
        );
      case APP_MODES.REPLAY:
        return (
          <StudyReplay 
            subjects={subjects} 
            doubts={doubts} 
            notes={notes} 
            reminders={reminders} 
            theme={theme} 
            isOffline={isOffline} 
          />
        );
      default:
        return (
          <Dashboard 
            subjects={subjects} 
            notes={notes} 
            doubts={doubts} 
            theme={theme} 
            badges={badges} 
            studyStreak={studyStreak}
            onSetStudyStreak={handleSetStudyStreak}
            onUnlockBadge={() => {}}
            userProfile={userProfile}
            onSwitchStudyMode={handleSwitchStudyMode}
          />
        );
    }
  };

  if (activeMode === APP_MODES.LANDING) {
    return <LandingPage onStart={handleAuthSuccess} theme={theme} />;
  }

  return (
    <div className={`flex min-h-screen transition-colors duration-500 ${theme === 'dark' ? 'bg-[#0F0F11]' : 'bg-[#FAFAF9]'}`}>
      <Sidebar 
        activeMode={activeMode} 
        setActiveMode={handleNavigate} 
        theme={theme} 
        toggleTheme={toggleTheme} 
        onLogout={handleLogout}
        isOffline={isOffline}
        setIsOffline={(offline) => {
          setIsOffline(offline);
          if (offline) {
            localStorage.setItem('mindorbit_offline_forced', 'true');
          } else {
            localStorage.removeItem('mindorbit_offline_forced');
          }
        }}
      />
      <main className="flex-1 ml-0 lg:ml-72 p-6 lg:p-16 pb-32 lg:pb-16 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;
