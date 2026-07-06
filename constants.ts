
import { Subject, Badge, Message } from './types';

export const INITIAL_SYLLABUS: Subject[] = [
  // --- CLASS 9 (GENERAL) ---
  {
    id: 'c9-math',
    name: 'Mathematics',
    classLevel: 'Class 9',
    stream: 'General',
    topics: [
      { id: '9-m-1', name: 'Number Systems', completed: false, revisionStatus: 'Not Started' },
      { id: '9-m-2', name: 'Polynomials', completed: false, revisionStatus: 'Not Started' },
      { id: '9-m-3', name: 'Coordinate Geometry', completed: false, revisionStatus: 'Not Started' },
      { id: '9-m-4', name: 'Linear Equations in Two Variables', completed: false, revisionStatus: 'Not Started' },
      { id: '9-m-5', name: 'Lines and Angles', completed: false, revisionStatus: 'Not Started' },
      { id: '9-m-6', name: 'Triangles', completed: false, revisionStatus: 'Not Started' },
      { id: '9-m-7', name: 'Quadrilaterals', completed: false, revisionStatus: 'Not Started' },
      { id: '9-m-8', name: 'Circles', completed: false, revisionStatus: 'Not Started' },
      { id: '9-m-9', name: 'Heron\'s Formula', completed: false, revisionStatus: 'Not Started' },
      { id: '9-m-10', name: 'Surface Areas and Volumes', completed: false, revisionStatus: 'Not Started' }
    ]
  },
  {
    id: 'c9-sci',
    name: 'Science',
    classLevel: 'Class 9',
    stream: 'General',
    topics: [
      { id: '9-s-1', name: 'Matter in Our Surroundings', completed: false, revisionStatus: 'Not Started' },
      { id: '9-s-2', name: 'Is Matter Around Us Pure', completed: false, revisionStatus: 'Not Started' },
      { id: '9-s-3', name: 'Atoms and Molecules', completed: false, revisionStatus: 'Not Started' },
      { id: '9-s-4', name: 'The Fundamental Unit of Life', completed: false, revisionStatus: 'Not Started' },
      { id: '9-s-5', name: 'Tissues', completed: false, revisionStatus: 'Not Started' },
      { id: '9-s-6', name: 'Motion', completed: false, revisionStatus: 'Not Started' },
      { id: '9-s-7', name: 'Force and Laws of Motion', completed: false, revisionStatus: 'Not Started' },
      { id: '9-s-8', name: 'Gravitation', completed: false, revisionStatus: 'Not Started' },
      { id: '9-s-9', name: 'Work and Energy', completed: false, revisionStatus: 'Not Started' },
      { id: '9-s-10', name: 'Sound', completed: false, revisionStatus: 'Not Started' }
    ]
  },
  {
    id: 'c9-ss-hist',
    name: 'History (SST)',
    classLevel: 'Class 9',
    stream: 'General',
    topics: [
      { id: '9-h-1', name: 'The French Revolution', completed: false, revisionStatus: 'Not Started' },
      { id: '9-h-2', name: 'Socialism in Europe', completed: false, revisionStatus: 'Not Started' },
      { id: '9-h-3', name: 'Nazism and the Rise of Hitler', completed: false, revisionStatus: 'Not Started' }
    ]
  },
  {
    id: 'c9-eng',
    name: 'English',
    classLevel: 'Class 9',
    stream: 'General',
    topics: [
      { id: '9-e-1', name: 'The Fun They Had', completed: false, revisionStatus: 'Not Started' },
      { id: '9-e-2', name: 'The Sound of Music', completed: false, revisionStatus: 'Not Started' },
      { id: '9-e-3', name: 'Tenses & Modals', completed: false, revisionStatus: 'Not Started' }
    ]
  },

  // --- CLASS 10 (GENERAL) ---
  {
    id: 'c10-math',
    name: 'Mathematics',
    classLevel: 'Class 10',
    stream: 'General',
    topics: [
      { id: '10-m-1', name: 'Real Numbers', completed: false, revisionStatus: 'Not Started' },
      { id: '10-m-2', name: 'Polynomials', completed: false, revisionStatus: 'Not Started' },
      { id: '10-m-3', name: 'Pair of Linear Equations', completed: false, revisionStatus: 'Not Started' },
      { id: '10-m-4', name: 'Quadratic Equations', completed: false, revisionStatus: 'Not Started' },
      { id: '10-m-5', name: 'Arithmetic Progressions', completed: false, revisionStatus: 'Not Started' },
      { id: '10-m-6', name: 'Introduction to Trigonometry', completed: false, revisionStatus: 'Not Started' },
      { id: '10-m-7', name: 'Circles', completed: false, revisionStatus: 'Not Started' },
      { id: '10-m-8', name: 'Surface Areas and Volumes', completed: false, revisionStatus: 'Not Started' },
      { id: '10-m-9', name: 'Statistics', completed: false, revisionStatus: 'Not Started' },
      { id: '10-m-10', name: 'Probability', completed: false, revisionStatus: 'Not Started' }
    ]
  },
  {
    id: 'c10-sci',
    name: 'Science',
    classLevel: 'Class 10',
    stream: 'General',
    topics: [
      { id: '10-s-1', name: 'Chemical Reactions and Equations', completed: false, revisionStatus: 'Not Started' },
      { id: '10-s-2', name: 'Acids, Bases and Salts', completed: false, revisionStatus: 'Not Started' },
      { id: '10-s-3', name: 'Metals and Non-metals', completed: false, revisionStatus: 'Not Started' },
      { id: '10-s-4', name: 'Carbon and its Compounds', completed: false, revisionStatus: 'Not Started' },
      { id: '10-s-5', name: 'Life Processes', completed: false, revisionStatus: 'Not Started' },
      { id: '10-s-6', name: 'Control and Coordination', completed: false, revisionStatus: 'Not Started' },
      { id: '10-s-7', name: 'How do Organisms Reproduce', completed: false, revisionStatus: 'Not Started' },
      { id: '10-s-8', name: 'Light Reflection and Refraction', completed: false, revisionStatus: 'Not Started' },
      { id: '10-s-9', name: 'Human Eye and Colourful World', completed: false, revisionStatus: 'Not Started' },
      { id: '10-s-10', name: 'Electricity', completed: false, revisionStatus: 'Not Started' }
    ]
  },
  {
    id: 'c10-ss',
    name: 'Social Science',
    classLevel: 'Class 10',
    stream: 'General',
    topics: [
      { id: '10-ss-1', name: 'Rise of Nationalism in Europe', completed: false, revisionStatus: 'Not Started' },
      { id: '10-ss-2', name: 'Nationalism in India', completed: false, revisionStatus: 'Not Started' },
      { id: '10-ss-3', name: 'Resources and Development', completed: false, revisionStatus: 'Not Started' },
      { id: '10-ss-4', name: 'Power Sharing', completed: false, revisionStatus: 'Not Started' },
      { id: '10-ss-5', name: 'Development (Economics)', completed: false, revisionStatus: 'Not Started' }
    ]
  },
  {
    id: 'c10-it',
    name: 'Information Technology',
    classLevel: 'Class 10',
    stream: 'General',
    topics: [
      { id: '10-it-1', name: 'Communication Skills', completed: false, revisionStatus: 'Not Started' },
      { id: '10-it-2', name: 'Self-Management Skills', completed: false, revisionStatus: 'Not Started' },
      { id: '10-it-3', name: 'Digital Documentation (Advanced)', completed: false, revisionStatus: 'Not Started' },
      { id: '10-it-4', name: 'Electronic Spreadsheet (Advanced)', completed: false, revisionStatus: 'Not Started' }
    ]
  },

  // --- CLASS 11 SCIENCE ---
  {
    id: 'c11-sci-phys',
    name: 'Physics',
    classLevel: 'Class 11',
    stream: 'Science',
    topics: [
      { id: '11-p-1', name: 'Units and Measurements', completed: false, revisionStatus: 'Not Started' },
      { id: '11-p-2', name: 'Motion in a Straight Line', completed: false, revisionStatus: 'Not Started' },
      { id: '11-p-3', name: 'Laws of Motion', completed: false, revisionStatus: 'Not Started' },
      { id: '11-p-4', name: 'Work, Energy and Power', completed: false, revisionStatus: 'Not Started' },
      { id: '11-p-5', name: 'Gravitation', completed: false, revisionStatus: 'Not Started' },
      { id: '11-p-6', name: 'Thermodynamics', completed: false, revisionStatus: 'Not Started' },
      { id: '11-p-7', name: 'Waves & Oscillations', completed: false, revisionStatus: 'Not Started' }
    ]
  },
  {
    id: 'c11-sci-chem',
    name: 'Chemistry',
    classLevel: 'Class 11',
    stream: 'Science',
    topics: [
      { id: '11-c-1', name: 'Structure of Atom', completed: false, revisionStatus: 'Not Started' },
      { id: '11-c-2', name: 'Classification of Elements', completed: false, revisionStatus: 'Not Started' },
      { id: '11-c-3', name: 'Chemical Bonding', completed: false, revisionStatus: 'Not Started' },
      { id: '11-c-4', name: 'Redox Reactions', completed: false, revisionStatus: 'Not Started' },
      { id: '11-c-5', name: 'Organic: Basic Principles', completed: false, revisionStatus: 'Not Started' },
      { id: '11-c-6', name: 'Hydrocarbons', completed: false, revisionStatus: 'Not Started' }
    ]
  },
  {
    id: 'c11-sci-math',
    name: 'Mathematics',
    classLevel: 'Class 11',
    stream: 'Science',
    topics: [
      { id: '11-m-1', name: 'Sets and Functions', completed: false, revisionStatus: 'Not Started' },
      { id: '11-m-2', name: 'Complex Numbers', completed: false, revisionStatus: 'Not Started' },
      { id: '11-m-3', name: 'Permutations & Combinations', completed: false, revisionStatus: 'Not Started' },
      { id: '11-m-4', name: 'Limits and Derivatives', completed: false, revisionStatus: 'Not Started' }
    ]
  },
  {
    id: 'c11-sci-bio',
    name: 'Biology',
    classLevel: 'Class 11',
    stream: 'Science',
    topics: [
      { id: '11-b-1', name: 'The Living World', completed: false, revisionStatus: 'Not Started' },
      { id: '11-b-2', name: 'Cell: The Unit of Life', completed: false, revisionStatus: 'Not Started' },
      { id: '11-b-3', name: 'Human Physiology', completed: false, revisionStatus: 'Not Started' }
    ]
  },

  // --- CLASS 11 COMMERCE ---
  {
    id: 'c11-com-acc',
    name: 'Accountancy',
    classLevel: 'Class 11',
    stream: 'Commerce',
    topics: [
      { id: '11-a-1', name: 'Introduction to Accounting', completed: false, revisionStatus: 'Not Started' },
      { id: '11-a-2', name: 'Journal & Ledger', completed: false, revisionStatus: 'Not Started' },
      { id: '11-a-3', name: 'Financial Statements', completed: false, revisionStatus: 'Not Started' }
    ]
  },
  {
    id: 'c11-com-bst',
    name: 'Business Studies',
    classLevel: 'Class 11',
    stream: 'Commerce',
    topics: [
      { id: '11-bs-1', name: 'Nature and Purpose of Business', completed: false, revisionStatus: 'Not Started' },
      { id: '11-bs-2', name: 'Forms of Business Organizations', completed: false, revisionStatus: 'Not Started' },
      { id: '11-bs-3', name: 'Internal Trade', completed: false, revisionStatus: 'Not Started' }
    ]
  },
  {
    id: 'c11-com-eco',
    name: 'Economics',
    classLevel: 'Class 11',
    stream: 'Commerce',
    topics: [
      { id: '11-e-1', name: 'Microeconomics: Introduction', completed: false, revisionStatus: 'Not Started' },
      { id: '11-e-2', name: 'Consumer Equilibrium', completed: false, revisionStatus: 'Not Started' },
      { id: '11-e-3', name: 'Statistics for Economics', completed: false, revisionStatus: 'Not Started' }
    ]
  },

  // --- CLASS 11 HUMANITIES ---
  {
    id: 'c11-hum-ps',
    name: 'Political Science',
    classLevel: 'Class 11',
    stream: 'Humanities',
    topics: [
      { id: '11-ps-1', name: 'Constitution: Why and How?', completed: false, revisionStatus: 'Not Started' },
      { id: '11-ps-2', name: 'Rights in the Indian Constitution', completed: false, revisionStatus: 'Not Started' },
      { id: '11-ps-3', name: 'Political Theory', completed: false, revisionStatus: 'Not Started' }
    ]
  },
  {
    id: 'c11-hum-hist',
    name: 'History',
    classLevel: 'Class 11',
    stream: 'Humanities',
    topics: [
      { id: '11-h-1', name: 'Writing and City Life', completed: false, revisionStatus: 'Not Started' },
      { id: '11-h-2', name: 'Nomadic Empires', completed: false, revisionStatus: 'Not Started' },
      { id: '11-h-3', name: 'The Three Orders', completed: false, revisionStatus: 'Not Started' }
    ]
  },
  {
    id: 'c11-hum-soc',
    name: 'Sociology',
    classLevel: 'Class 11',
    stream: 'Humanities',
    topics: [
      { id: '11-soc-1', name: 'Sociology and Society', completed: false, revisionStatus: 'Not Started' },
      { id: '11-soc-2', name: 'Social Concepts and Their Use', completed: false, revisionStatus: 'Not Started' }
    ]
  },

  // --- CLASS 12 SCIENCE ---
  {
    id: 'c12-sci-phys',
    name: 'Physics',
    classLevel: 'Class 12',
    stream: 'Science',
    topics: [
      { id: '12-p-1', name: 'Electric Charges and Fields', completed: false, revisionStatus: 'Not Started' },
      { id: '12-p-2', name: 'Current Electricity', completed: false, revisionStatus: 'Not Started' },
      { id: '12-p-3', name: 'Magnetism and Matter', completed: false, revisionStatus: 'Not Started' },
      { id: '12-p-4', name: 'Ray Optics', completed: false, revisionStatus: 'Not Started' },
      { id: '12-p-5', name: 'Semiconductors', completed: false, revisionStatus: 'Not Started' }
    ]
  },
  {
    id: 'c12-sci-chem',
    name: 'Chemistry',
    classLevel: 'Class 12',
    stream: 'Science',
    topics: [
      { id: '12-c-1', name: 'Solutions', completed: false, revisionStatus: 'Not Started' },
      { id: '12-c-2', name: 'Electrochemistry', completed: false, revisionStatus: 'Not Started' },
      { id: '12-c-3', name: 'Chemical Kinetics', completed: false, revisionStatus: 'Not Started' },
      { id: '12-c-4', name: 'Haloalkanes and Haloarenes', completed: false, revisionStatus: 'Not Started' },
      { id: '12-c-5', name: 'Biomolecules', completed: false, revisionStatus: 'Not Started' }
    ]
  },
  {
    id: 'c12-sci-math',
    name: 'Mathematics',
    classLevel: 'Class 12',
    stream: 'Science',
    topics: [
      { id: '12-m-1', name: 'Relations and Functions', completed: false, revisionStatus: 'Not Started' },
      { id: '12-m-2', name: 'Matrices and Determinants', completed: false, revisionStatus: 'Not Started' },
      { id: '12-m-3', name: 'Calculus: Continuity', completed: false, revisionStatus: 'Not Started' },
      { id: '12-m-4', name: 'Integrals', completed: false, revisionStatus: 'Not Started' },
      { id: '12-m-5', name: 'Vector Algebra', completed: false, revisionStatus: 'Not Started' }
    ]
  },

  // --- CLASS 12 COMMERCE ---
  {
    id: 'c12-com-acc',
    name: 'Accountancy',
    classLevel: 'Class 12',
    stream: 'Commerce',
    topics: [
      { id: '12-a-1', name: 'Partnership: Fundamentals', completed: false, revisionStatus: 'Not Started' },
      { id: '12-a-2', name: 'Issue of Shares', completed: false, revisionStatus: 'Not Started' },
      { id: '12-a-3', name: 'Cash Flow Statement', completed: false, revisionStatus: 'Not Started' }
    ]
  },
  {
    id: 'c12-com-eco',
    name: 'Economics',
    classLevel: 'Class 12',
    stream: 'Commerce',
    topics: [
      { id: '12-e-1', name: 'Macroeconomics: National Income', completed: false, revisionStatus: 'Not Started' },
      { id: '12-e-2', name: 'Money and Banking', completed: false, revisionStatus: 'Not Started' },
      { id: '12-e-3', name: 'Indian Economic Development', completed: false, revisionStatus: 'Not Started' }
    ]
  },

  // --- CLASS 12 HUMANITIES ---
  {
    id: 'c12-hum-ps',
    name: 'Political Science',
    classLevel: 'Class 12',
    stream: 'Humanities',
    topics: [
      { id: '12-ps-1', name: 'End of Bipolarity', completed: false, revisionStatus: 'Not Started' },
      { id: '12-ps-2', name: 'Contemporary Centres of Power', completed: false, revisionStatus: 'Not Started' },
      { id: '12-ps-3', name: 'Challenges of Nation Building', completed: false, revisionStatus: 'Not Started' }
    ]
  },
  {
    id: 'c12-hum-hist',
    name: 'History',
    classLevel: 'Class 12',
    stream: 'Humanities',
    topics: [
      { id: '12-h-1', name: 'Bricks, Beads and Bones', completed: false, revisionStatus: 'Not Started' },
      { id: '12-h-2', name: 'Kings, Farmers and Towns', completed: false, revisionStatus: 'Not Started' },
      { id: '12-h-3', name: 'Kinship, Caste and Class', completed: false, revisionStatus: 'Not Started' }
    ]
  },
  {
    id: 'c12-hum-psy',
    name: 'Psychology',
    classLevel: 'Class 12',
    stream: 'Humanities',
    topics: [
      { id: '12-psy-1', name: 'Variations in Psychological Attributes', completed: false, revisionStatus: 'Not Started' },
      { id: '12-psy-2', name: 'Self and Personality', completed: false, revisionStatus: 'Not Started' }
    ]
  },

  // --- GENERAL / ELECTIVES (ALL STREAMS) ---
  {
    id: 'gen-eng-12',
    name: 'English Core',
    classLevel: 'Class 12',
    stream: 'General',
    topics: [
      { id: '12-ge-1', name: 'The Last Lesson', completed: false, revisionStatus: 'Not Started' },
      { id: '12-ge-2', name: 'Lost Spring', completed: false, revisionStatus: 'Not Started' },
      { id: '12-ge-3', name: 'My Mother at Sixty-Six', completed: false, revisionStatus: 'Not Started' }
    ]
  },
  {
    id: 'gen-cs-12',
    name: 'Computer Science',
    classLevel: 'Class 12',
    stream: 'General',
    topics: [
      { id: '12-cs-1', name: 'Python Revision Tour', completed: false, revisionStatus: 'Not Started' },
      { id: '12-cs-2', name: 'Database Management & SQL', completed: false, revisionStatus: 'Not Started' },
      { id: '12-cs-3', name: 'Computer Networks', completed: false, revisionStatus: 'Not Started' }
    ]
  },
  {
    id: 'gen-pe-12',
    name: 'Physical Education',
    classLevel: 'Class 12',
    stream: 'General',
    topics: [
      { id: '12-pe-1', name: 'Management of Sporting Events', completed: false, revisionStatus: 'Not Started' },
      { id: '12-pe-2', name: 'Children & Women in Sports', completed: false, revisionStatus: 'Not Started' },
      { id: '12-pe-3', name: 'Yoga as Preventive Measure', completed: false, revisionStatus: 'Not Started' }
    ]
  }
];

export const INITIAL_BADGES: Badge[] = [
  { id: '1', name: 'Streak King', icon: 'fa-fire', unlocked: false, description: 'Study for 3 days in a row.' },
  { id: '2', name: 'Doubt Destroyer', icon: 'fa-circle-check', unlocked: false, description: 'Resolve 3 saved doubts.' },
  { id: '3', name: 'Consistency King', icon: 'fa-crown', unlocked: false, description: 'Complete a full chapter syllabus.' },
  { id: '4', name: 'Night Owl', icon: 'fa-cloud-moon', unlocked: false, description: 'Study after 10 PM.' }
];

export const INITIAL_CHAT_MESSAGES: Message[] = [
  {
    role: 'model',
    parts: [{ text: "Orbiting... Main tumhara personal AI tutor hoon. I have every subject from Class 9 to 12 loaded into my neural core. Science, Commerce, or Humanities—how can I help you excel today?" }],
    timestamp: Date.now(),
  }
];

export const APP_MODES = {
  LANDING: 'landing',
  DASHBOARD: 'dashboard',
  CHAT: 'chat',
  NOTES: 'notes',
  SYLLABUS: 'syllabus',
  DOUBTS: 'doubts',
  PLANNER: 'planner',
  DEEP_DIVE: 'deep-dive',
  MOCK_TEST: 'mock-test',
  REPLAY: 'replay',
  FOCUS_ROOMS: 'focus-rooms',
  REVISION_PLANS: 'revision-plans'
} as const;
