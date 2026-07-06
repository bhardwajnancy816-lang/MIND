import { Message, StudyMode, TestQuestion } from "../types";

export const cleanAIResponse = (text: string): string => {
  if (!text) return "";
  return text
    .replace(/[#*]/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

export const getGeminiResponse = async (messages: Message[], mode: StudyMode = 'Normal', systemInstruction?: string) => {
  try {
    const response = await fetch("/api/gemini/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ messages, mode, systemInstruction })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP error ${response.status}`);
    }

    const data = await response.json();
    return data.text || "Main orbit se connect nahi ho pa raha hoon. Please try again.";
  } catch (error) {
    console.error("Gemini client-side API error:", error);
    return "Error: Orbit connection lost. Please check your satellite (internet).";
  }
};

export const generateMockTest = async (subject: string, topics: string[], count: number): Promise<TestQuestion[]> => {
  try {
    const response = await fetch("/api/gemini/mock-test", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ subject, topics, count })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP error ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Test generation client-side API error:", error);
    throw new Error("Satellite interference prevented test generation. Try again.");
  }
};

export const generateStudyPath = async (
  subjects: string[],
  topics: string[],
  goals: string,
  exam: string
): Promise<any> => {
  try {
    const response = await fetch("/api/gemini/generate-study-path", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ subjects, topics, goals, exam })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP error ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Study path generation client-side API error:", error);
    throw new Error("Orbit interference prevented customized study path generation. Try again.");
  }
};
