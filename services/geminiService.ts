
import { GoogleGenAI, Chat } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: AIzaSyAdc1jiETeOvYQgT2QmmBWwjomLQ3dgU5Q });
const textModel = "gemini-2.5-flash";

export function startChat(): Chat {
  return ai.chats.create({
    model: textModel,
    config: {
      systemInstruction: "You are a friendly and insightful AI writing assistant for the 'AI Story Studio' app. Your goal is to help users brainstorm, develop, and refine their stories. Be creative, encouraging, and provide clear, concise, and actionable suggestions. When asked to perform a task like suggesting titles or improving text, focus on fulfilling that request directly. When chatting, be a supportive co-author.",
    },
  });
}

export async function continueWritingStream(storyContent: string) {
    const systemInstruction = "You are a creative and eloquent co-author. Your task is to continue the story provided by the user in a natural and compelling way. Maintain the existing tone and style, and advance the plot or deepen the characters. Do not add introductory phrases like 'Here's the continuation'. Just write the next part of the story.";
    
    return ai.models.generateContentStream({
        model: textModel,
        contents: storyContent || "Start a new, intriguing story.",
        config: {
            systemInstruction
        }
    });
}
