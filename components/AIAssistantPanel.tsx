
import React, { useEffect, useRef, useState } from 'react';
import { ChatMessage, SUPPORTED_LANGUAGES } from '../types';
import { SparklesIcon } from './icons/SparklesIcon';
import { Spinner } from './Spinner';

interface AIAssistantPanelProps {
  chatHistory: ChatMessage[];
  isAiResponding: boolean;
  onSendMessage: (prompt: string, hiddenPrompt?: string) => void;
  onSuggestionClick: (text: string) => void;
  onLanguageSelect: (language: string) => void;
}

const WelcomeMessage = () => (
    <div className="flex flex-col items-center justify-center h-full text-center p-6 text-gray-500 dark:text-gray-400">
        <SparklesIcon className="w-16 h-16 mb-4 text-indigo-500 dark:text-indigo-400"/>
        <h3 className="font-bold text-lg text-gray-800 dark:text-gray-200">AI Assistant</h3>
        <p className="mt-2 text-sm">Your creative partner. Use the tools on the left or type below to brainstorm, get ideas, and improve your story.</p>
    </div>
);

const WritersBlockPrompt: React.FC<{ onSendMessage: (prompt: string, hiddenPrompt?: string) => void }> = ({ onSendMessage }) => (
    <div className="bg-gray-200 dark:bg-gray-900/50 rounded-lg p-3 space-y-2">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Feeling stuck? Try one of these:</p>
        <button onClick={() => onSendMessage("Give me a random writing prompt for a story.", "Give me a random, unique writing prompt.")} className="w-full text-left text-sm p-2 rounded-md bg-white dark:bg-gray-700/60 hover:bg-gray-100 dark:hover:bg-gray-700">Get a random writing prompt</button>
        <button onClick={() => onSendMessage("Share an inspirational quote about writing.", "Share an inspirational quote about writing or creativity.")} className="w-full text-left text-sm p-2 rounded-md bg-white dark:bg-gray-700/60 hover:bg-gray-100 dark:hover:bg-gray-700">Share an inspirational quote</button>
        <button onClick={() => onSendMessage("Suggest a sensory detail I could add to my scene.", "Suggest a single, vivid sensory detail (sight, sound, smell, touch, or taste) that could be added to a story scene.")} className="w-full text-left text-sm p-2 rounded-md bg-white dark:bg-gray-700/60 hover:bg-gray-100 dark:hover:bg-gray-700">Suggest a sensory detail</button>
    </div>
);

const TranslatePrompt: React.FC<{ onSelect: (lang: string) => void }> = ({ onSelect }) => (
     <div className="bg-gray-200 dark:bg-gray-900/50 rounded-lg p-3 space-y-2">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Translate selection into:</p>
        <div className="grid grid-cols-2 gap-2">
            {SUPPORTED_LANGUAGES.map((lang) => (
                <button 
                    key={lang}
                    onClick={() => onSelect(lang)}
                    className="text-center text-sm p-2 rounded-md bg-white dark:bg-gray-700/60 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                    {lang}
                </button>
            ))}
        </div>
    </div>
);


export const AIAssistantPanel: React.FC<AIAssistantPanelProps> = ({ chatHistory, isAiResponding, onSendMessage, onSuggestionClick, onLanguageSelect }) => {
  const [userInput, setUserInput] = useState('');
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);
  
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userInput.trim() && !isAiResponding) {
      onSendMessage(userInput.trim());
      setUserInput('');
    }
  };

  const renderMessageContent = (message: ChatMessage) => {
    if (message.role === 'system') {
        if(message.content === 'welcome') return <WelcomeMessage />;
        if(message.content === 'writers_block') return <WritersBlockPrompt onSendMessage={onSendMessage} />;
        if(message.content === 'translate') return <TranslatePrompt onSelect={onLanguageSelect} />;
        return <p className="text-center text-xs italic text-gray-500 dark:text-gray-400 p-2">{message.content}</p>;
    }
    
    return (
        <div
            className={`w-fit max-w-[90%] rounded-xl px-4 py-2.5 text-sm sm:text-base ${
                message.role === 'user'
                ? 'ml-auto bg-indigo-600 text-white'
                : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200'
            }`}
        >
            {message.isThinking ? <Spinner /> : 
                <p 
                    className="whitespace-pre-wrap" 
                    onClick={() => message.role === 'model' && onSuggestionClick(message.content as string)}
                >
                    {message.content}
                </p>
            }
        </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-gray-100 dark:bg-gray-800 transition-colors duration-300">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700/50">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">AI Assistant</h2>
        </div>
        <div className="flex-grow p-4 overflow-y-auto space-y-4">
            {chatHistory.map((msg) => (
                <div key={msg.id}>{renderMessageContent(msg)}</div>
            ))}
            <div ref={endOfMessagesRef} />
        </div>
        <div className="p-3 border-t border-gray-200 dark:border-gray-700/50">
            <form onSubmit={handleFormSubmit} className="flex items-center gap-2">
                <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder="Ask the AI anything..."
                    disabled={isAiResponding}
                    className="flex-grow w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
                />
                <button type="submit" disabled={isAiResponding || !userInput.trim()} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 dark:disabled:bg-indigo-800 disabled:cursor-not-allowed">
                    Send
                </button>
            </form>
        </div>
    </div>
  );
};
