import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

const PORT = 3000;

// Lazy-loaded AI client to prevent startup crashes when API keys are being configured
let aiClient: GoogleGenAI | null = null;

const getAIClient = (): GoogleGenAI => {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey) {
      throw new Error("We've set up your API key automatically. If you're seeing this error, please check that your API key is correctly attached under Settings > Secrets as GEMINI_API_KEY.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
};

// Robust helper function with automated retry and fallback model switching
const generateWithFallback = async (params: any): Promise<any> => {
  const primaryModel = params.model || 'gemini-3.5-flash';
  const modelsToTry = [
    primaryModel,
    'gemini-3.1-flash-lite'
  ];

  let lastError: any = null;

  for (const model of modelsToTry) {
    const maxAttempts = 2;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`[Gemini SDK] Dispatching generateContent. Model: ${model}. Attempt: ${attempt}/${maxAttempts}`);
        // Clone and map to the specific model we want to attempt
        const queryParams = {
          ...params,
          model,
        };
        const response = await getAIClient().models.generateContent(queryParams);
        return response;
      } catch (err: any) {
        lastError = err;
        console.warn(`[Gemini SDK Checkpoint] Warning with model ${model} on attempt ${attempt}:`, err?.message || err);
        // If it's the last attempt of the last model, don't delay, let it throw or handle below
        if (model !== modelsToTry[modelsToTry.length - 1] || attempt < maxAttempts) {
          const delayTime = 1000 * attempt;
          console.log(`[Gemini SDK Checkpoint] Waiting ${delayTime}ms for backoff fallback...`);
          await new Promise(resolve => setTimeout(resolve, delayTime));
        }
      }
    }
  }

  throw lastError || new Error("All fallback models and retries exhausted.");
};

// Helper clean AI Response function
const cleanAIResponse = (text: string): string => {
  if (!text) return "";
  return text
    .replace(/[#*]/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

// API: Health
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// API: Gemini Chat Proxy
app.post("/api/gemini/chat", async (req, res) => {
  try {
    const { messages, mode, systemInstruction } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "messages array is required" });
    }

    const contents = messages.map((msg: any) => ({
      role: msg.role,
      parts: msg.parts
    }));

    let modeInstruction = "";
    if (mode === 'ELI5') {
      modeInstruction = "IMPORTANT: Use the 'Explain Like I'm 5' methodology. Use simple analogies, avoid complex jargon, and use basic Hinglish where helpful.";
    } else if (mode === 'Exam-Oriented') {
      modeInstruction = "IMPORTANT: Be exam-oriented. Focus on marks-weightage, keywords that examiners look for, and provide structured, point-wise answers with common exam questions.";
    }

    const baseInstruction = systemInstruction || `You are MindOrbit, an elite AI student assistant.
      - Support both English and Hinglish as per student's comfort.
      - Be encouraging but professional.
      - If notes context is provided, prioritize answering from the notes.
      - Break down complex topics into small, digestible chunks.
      - DO NOT use markdown symbols like # for headers or * for bold/lists. Use plain text formatting.
      ${modeInstruction}`;

    const params = {
      model: 'gemini-3.5-flash',
      contents,
      config: {
        systemInstruction: baseInstruction,
        temperature: 0.8,
      }
    };

    const response = await generateWithFallback(params);
    const rawText = response.text || "Main orbit se connect nahi ho pa raha hoon. Please try again.";
    const cleanText = cleanAIResponse(rawText);
    res.json({ text: cleanText });
  } catch (error: any) {
    console.error("Server API error calling Gemini:", error);
    res.status(500).json({ error: error.message || "Error: Orbit connection lost." });
  }
});

// API: Mock Test Generation Proxy
app.post("/api/gemini/mock-test", async (req, res) => {
  try {
    const { subject, topics, count } = req.body;
    if (!subject || !topics || typeof count !== "number") {
      return res.status(400).json({ error: "subject, topics, and count are required" });
    }

    const prompt = `Generate a mock test for Subject: ${subject}. Topics included: ${topics.join(', ')}. Generate exactly ${count} multiple-choice questions. Each question must have 4 options and a detailed explanation for the correct answer. Provide the output in JSON format.`;

    const response = await generateWithFallback({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              options: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING } 
              },
              correctAnswerIndex: { type: Type.INTEGER },
              explanation: { type: Type.STRING }
            },
            required: ["question", "options", "correctAnswerIndex", "explanation"]
          }
        }
      }
    });

    try {
      const parsed = JSON.parse(response.text || "[]");
      res.json(parsed);
    } catch (parseErr) {
      console.error("JSON parse error on mock test generator response text:", response.text);
      res.status(500).json({ error: "Failed to parse structured JSON mock test questions." });
    }
  } catch (error: any) {
    console.error("Server API error generating mock test:", error);
    res.status(500).json({ error: error.message || "Satellite interference prevented test generation." });
  }
});

// API: AI Generated Revision Plans
app.post("/api/gemini/revision-plan", async (req, res) => {
  try {
    const { subjectName, examDate, weakTopics } = req.body;
    if (!subjectName || !examDate) {
      return res.status(400).json({ error: "subjectName and examDate are required" });
    }

    const prompt = `Create a comprehensive, personalized study revision plan leading up to the Exam Date: ${examDate} for the subject: ${subjectName}. The student has highlighted these weak topics or areas to pay focus on: ${weakTopics || "None specified, do standard balanced revision breakdown"}. Include active recall spacing and a mock test schedule. Provide the result in structured JSON.`;

    const response = await generateWithFallback({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overview: { type: Type.STRING },
            dailyTargets: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  day: { type: Type.STRING },
                  topic: { type: Type.STRING },
                  intensity: { type: Type.STRING },
                  task: { type: Type.STRING },
                  estimatedMinutes: { type: Type.INTEGER }
                },
                required: ["day", "topic", "intensity", "task", "estimatedMinutes"]
              }
            },
            revisionCycles: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  cycleName: { type: Type.STRING },
                  triggerDay: { type: Type.STRING },
                  strategy: { type: Type.STRING }
                },
                required: ["cycleName", "triggerDay", "strategy"]
              }
            },
            mockTestSchedule: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  milestone: { type: Type.STRING },
                  scheduleDay: { type: Type.STRING },
                  focusAreas: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  }
                },
                required: ["milestone", "scheduleDay", "focusAreas"]
              }
            }
          },
          required: ["overview", "dailyTargets", "revisionCycles", "mockTestSchedule"]
        }
      }
    });

    try {
      const parsed = JSON.parse(response.text || "{}");
      res.json(parsed);
    } catch (parseErr) {
      console.error("JSON parse error on revision plan generator response:", response.text);
      res.status(500).json({ error: "Failed to parse structured JSON revision plan." });
    }
  } catch (error: any) {
    console.error("Server API error generating revision plan:", error);
    res.status(500).json({ error: error.message || "Orbit interference prevented plan generation." });
  }
});

// API: Smart Doubt Solving with Visual Concept Nodes
app.post("/api/gemini/solve-doubt", async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) {
      return res.status(400).json({ error: "question is required" });
    }

    const prompt = `Solve this academic doubt: "${question}". Provide a fully structured breakdown containing step-by-step explanations, a voice narration script (for auditory learning), a quick summary, and a simplified conceptual flowchart of dependencies (nodes and connections representing variables or equations). Provide the result in structured JSON.`;

    const response = await generateWithFallback({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            answer: { type: Type.STRING, description: "Detailed comprehensive text explanation." },
            voiceIntro: { type: Type.STRING, description: "Cheerful 1-2 sentence auditory explanation or welcome intro." },
            quickSummary: { type: Type.STRING, description: "A high level summary context with 2 main takeaways." },
            steps: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  stepNumber: { type: Type.INTEGER },
                  title: { type: Type.STRING },
                  explanation: { type: Type.STRING }
                },
                required: ["stepNumber", "title", "explanation"]
              }
            },
            diagramNodes: {
              type: Type.ARRAY,
              description: "Conceptual flowchart representing components, laws or equations. Form custom visual links.",
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING, description: "Unique node code, e.g. NodeA" },
                  label: { type: Type.STRING, description: "Short labels like Force, Energy, Mass or Lenz's Law." },
                  color: { type: Type.STRING, description: "Recommend bg CSS color: blue, purple, emerald, rose, indigo." },
                  connections: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "Array of string IDs that this node connects to downstream."
                  },
                  explanation: { type: Type.STRING, description: "What this node represents or contributes." }
                },
                required: ["id", "label", "color", "connections", "explanation"]
              }
            }
          },
          required: ["answer", "voiceIntro", "quickSummary", "steps", "diagramNodes"]
        }
      }
    });

    try {
      const parsed = JSON.parse(response.text || "{}");
      res.json(parsed);
    } catch (parseErr) {
      console.error("JSON parse error on doubt solver:", response.text);
      res.status(500).json({ error: "Failed to parse structured JSON doubt solving package." });
    }
  } catch (error: any) {
    console.error("Server API error solving doubt:", error);
    res.status(500).json({ error: error.message || "Failed to establish AI orbit connection to solve your doubt." });
  }
});

// API: AI Generated Custom Study Path for Individual Study Mode
app.post("/api/gemini/generate-study-path", async (req, res) => {
  try {
    const { subjects, topics, goals, exam } = req.body;
    if (!subjects || !topics) {
      return res.status(400).json({ error: "subjects and topics are required" });
    }

    const prompt = `Create a customized individual learning path for:
Subjects: ${Array.isArray(subjects) ? subjects.join(', ') : subjects}
Topics: ${Array.isArray(topics) ? topics.join(', ') : topics}
Learning Goals: ${goals || "General Mastery"}
Target Exam: ${exam || "General Study"}.
Provide a list of structured modules, recommended study sources, target skills, milestones, and quick learning tips. Format the response as JSON.`;

    const response = await generateWithFallback({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            overview: { type: Type.STRING },
            targetSkills: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            modules: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  moduleName: { type: Type.STRING },
                  description: { type: Type.STRING },
                  suggestedHours: { type: Type.INTEGER },
                  subtopics: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  },
                  learningActivity: { type: Type.STRING }
                },
                required: ["moduleName", "description", "suggestedHours", "subtopics", "learningActivity"]
              }
            },
            milestones: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  target: { type: Type.STRING },
                  verificationTask: { type: Type.STRING }
                },
                required: ["target", "verificationTask"]
              }
            },
            studyTips: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["title", "overview", "targetSkills", "modules", "milestones", "studyTips"]
        }
      }
    });

    try {
      const parsed = JSON.parse(response.text || "{}");
      res.json(parsed);
    } catch (parseErr) {
      console.error("JSON parse error on generate-study-path:", response.text);
      res.status(500).json({ error: "Failed to parse structured study path JSON." });
    }
  } catch (error: any) {
    console.error("Server API error generating study path:", error);
    res.status(500).json({ error: error.message || "Orbit interference prevented study path generation." });
  }
});

// Integrate backend and frontend (Vite or static server)
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('/{*splat}', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
  });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

startServer();
