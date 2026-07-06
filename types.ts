
export type StudyMode = 'Normal' | 'ELI5' | 'Exam-Oriented';

export interface UserProfile {
  isIndividualStudy: boolean;
  classLevel?: string;
  course?: string;
  boardOrUniversity?: string;
  semester?: string;
  selectedSubjects?: string[];
  selectedTopics?: string[];
  selectedSkills?: string[];
  selectedExams?: string[];
  learningGoals?: string;
  customLearningPath?: {
    title: string;
    overview: string;
    targetSkills: string[];
    modules: Array<{
      moduleName: string;
      description: string;
      suggestedHours: number;
      subtopics: string[];
      learningActivity: string;
    }>;
    milestones: Array<{
      target: string;
      verificationTask: string;
    }>;
    studyTips: string[];
  };
}

export interface Note {
  id: string;
  title: string;
  content: string;
  summary?: string;
  timestamp: number;
  type: 'text' | 'pdf' | 'image';
  previewUrl?: string;
  tags: string[];
}

export interface Doubt {
  id: string;
  question: string;
  answer: string;
  subject: string;
  timestamp: number;
  resolved: boolean;
  topicId?: string;
}

export interface SyllabusTopic {
  id: string;
  name: string;
  completed: boolean;
  revisionStatus: 'Not Started' | 'Partial' | 'Mastered';
}

export type StreamType = 'Science' | 'Commerce' | 'Humanities' | 'General';

export interface Subject {
  id: string;
  name: string;
  classLevel: string;
  stream: StreamType;
  topics: SyllabusTopic[];
}

export interface Message {
  role: 'user' | 'model';
  parts: { text?: string; inlineData?: { mimeType: string; data: string } }[];
  timestamp: number;
  mode?: StudyMode;
}

export interface Reminder {
  id: string;
  task: string;
  time: string;
  completed: boolean;
  type: 'Study' | 'Revision' | 'Nudge';
  priority?: 'High' | 'Medium' | 'Low';
  estimatedPomodoros?: number;
  completedPomodoros?: number;
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  unlocked: boolean;
  description: string;
}

export type ThemeMode = 'dark' | 'light';

export interface TopicStudy {
  topicName: string;
  content: string;
  timestamp: number;
}

export interface TestQuestion {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface MockTestResult {
  score: number;
  total: number;
  questions: TestQuestion[];
  userAnswers: number[];
  timestamp: number;
}
