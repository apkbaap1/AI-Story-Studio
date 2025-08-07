
import React from 'react';

export type Theme = 'light' | 'dark';

export type ChatMessageRole = 'user' | 'model' | 'system';

export interface ChatMessage {
  id: string;
  role: ChatMessageRole;
  content: React.ReactNode;
  isThinking?: boolean;
}


export const SUPPORTED_LANGUAGES = [
    'English', 'Hindi', 'Bengali', 'Tamil', 'Telugu', 'Marathi', 
    'Gujarati', 'Kannada', 'Malayalam', 'Punjabi'
];
