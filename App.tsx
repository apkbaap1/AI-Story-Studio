
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Editor } from './components/Editor';
import { Toolbar } from './components/Toolbar';
import { AIAssistantPanel } from './components/AIAssistantPanel';
import * as geminiService from './services/geminiService';
import { Theme, ChatMessage } from './types';
import { PdfPreview } from './components/PdfPreview';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { nanoid } from 'https://esm.sh/nanoid@5.0.7';

const initialChat: ChatMessage[] = [
    { id: nanoid(), role: 'system', content: 'welcome' }
];

const ApiKeyWarning = () => (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-80 backdrop-blur-sm" aria-modal="true" role="dialog">
        <div className="max-w-lg p-8 m-4 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-red-500/50">
            <div className="text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <h2 className="text-2xl font-bold text-red-600 dark:text-red-500 mt-4 mb-2">Action Required: Set API Key</h2>
                <p className="text-gray-700 dark:text-gray-300">
                    Your Gemini API key is missing. AI features are currently disabled.
                </p>
            </div>
            <div className="mt-6 text-left text-sm text-gray-600 dark:text-gray-400 space-y-2">
                <p className="font-semibold text-gray-800 dark:text-gray-200">To fix this in Vercel:</p>
                <ol className="list-decimal list-inside space-y-1 pl-2">
                    <li>Go to your Project Settings in Vercel.</li>
                    <li>Navigate to the <strong>Environment Variables</strong> section.</li>
                    <li>Create a new variable with:</li>
                    <ul className="list-disc list-inside pl-6 mt-1 font-mono bg-gray-100 dark:bg-gray-900/50 p-2 rounded">
                        <li><strong>Key:</strong> <code className="font-bold">API_KEY</code></li>
                        <li><strong>Value:</strong> [Your Google AI Studio API Key]</li>
                    </ul>
                    <li>Redeploy your application.</li>
                </ol>
            </div>
            <div className="mt-6 text-center">
                 <a href="https://vercel.com/docs/projects/environment-variables" target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline">
                    Read Vercel Docs for help
                    <svg xmlns="http://www.w3.org/2000/svg" className="inline-block h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                 </a>
            </div>
        </div>
    </div>
);


export default function App() {
  const [theme, setTheme] = useState<Theme>('dark');
  const [isFocusMode, setFocusMode] = useState<boolean>(false);
  const [storyContent, setStoryContent] = useState<string>('');
  const [selectedText, setSelectedText] = useState<string>('');
  const [isAiResponding, setIsAiResponding] = useState<boolean>(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>(initialChat);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [isApiKeyMissing, setIsApiKeyMissing] = useState<boolean>(false);
  
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const pdfRef = useRef<HTMLDivElement>(null);
  const chatInstance = useRef<any>(null); // Using any for Gemini Chat object

  useEffect(() => {
    // Initialize theme from localStorage
    const savedTheme = localStorage.getItem('story-studio-theme') as Theme;
    const initialTheme = savedTheme || 'dark';
    setTheme(initialTheme);
    
    // Check for API key and initialize chat
    if (geminiService.isApiKeySet()) {
      try {
        chatInstance.current = geminiService.startChat();
      } catch (error: any) {
        console.error("Failed to initialize AI Chat:", error);
        setChatHistory(prev => [...prev, { id: nanoid(), role: 'system', content: `Error: Could not start AI assistant. ${error.message}` }]);
      }
    } else {
      setIsApiKeyMissing(true);
      setChatHistory(prev => [...prev, { id: nanoid(), role: 'system', content: 'AI features disabled. API_KEY is not set.' }]);
    }
  }, []);

  useEffect(() => {
    // Apply theme class to html element
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('story-studio-theme', theme);
  }, [theme]);

  const handleSendMessage = useCallback(async (prompt: string, hiddenPrompt?: string) => {
    if (!isApiKeyMissing) {
        setIsAiResponding(true);
        const thinkingId = nanoid();

        setChatHistory(prev => [
          ...prev,
          ...(prompt ? [{ id: nanoid(), role: 'user' as const, content: prompt }] : []),
          { id: thinkingId, role: 'model' as const, content: "Thinking...", isThinking: true }
        ]);
        
        try {
          const fullPrompt = hiddenPrompt || prompt;
          const response = await chatInstance.current.sendMessage({ message: fullPrompt });
          
          setChatHistory(prev => prev.map(msg => 
            msg.id === thinkingId ? { ...msg, content: response.text, isThinking: false } : msg
          ));

        } catch (e: any) {
          const errorContent = `An error occurred: ${e.message}`;
          setChatHistory(prev => prev.map(msg => 
            msg.id === thinkingId ? { ...msg, content: errorContent, isThinking: false } : msg
          ));
        } finally {
          setIsAiResponding(false);
        }
    }
  }, [isApiKeyMissing]);
  
  const addSystemMessage = (content: React.ReactNode) => {
      setChatHistory(prev => [...prev, { id: nanoid(), role: 'system' as const, content }]);
  };
  
  // --- AI ACTIONS ---
  const handleSuggestTitles = useCallback(() => {
    handleSendMessage('', `Based on the following story, suggest 5 creative titles. Story: "${storyContent}"`);
  }, [storyContent, handleSendMessage]);

  const handleGetCharacterIdeas = useCallback(() => {
    handleSendMessage('', "Generate 3 diverse and interesting character ideas for a story. Provide a name and a short description for each.");
  }, [handleSendMessage]);

  const handleSuggestPlotTwist = useCallback(() => {
    handleSendMessage('', `Based on the following story, suggest one surprising plot twist. Story: "${storyContent}"`);
  }, [storyContent, handleSendMessage]);

  const handleImproveWriting = useCallback(() => {
    if (!selectedText.trim()) {
      addSystemMessage('Please select some text in the editor to improve.');
      return;
    }
    handleSendMessage('', `Rewrite the following text to be more vivid and engaging, improving the prose without adding new plot points. Text: "${selectedText}"`);
  }, [selectedText, handleSendMessage]);

  const handleContinueWriting = useCallback(async () => {
     if (isAiResponding || isApiKeyMissing) return;
     setIsAiResponding(true);
     const thinkingId = nanoid();
     setChatHistory(prev => [...prev, {id: thinkingId, role: 'model' as const, content: "Continuing the story...", isThinking: true}]);

    try {
      const stream = await geminiService.continueWritingStream(storyContent);
      let currentContent = storyContent.length > 0 && !storyContent.endsWith(' ') ? storyContent + ' ' : storyContent;
      
      for await (const chunk of stream) {
        currentContent += chunk.text;
        setStoryContent(currentContent);
      }
      setChatHistory(prev => prev.filter(msg => msg.id !== thinkingId)); // Remove thinking message
    } catch (e: any)       {
       const errorContent = `An error occurred while streaming: ${e.message}`;
       setChatHistory(prev => prev.map(msg => msg.id === thinkingId ? {...msg, content: errorContent, isThinking: false } : msg));
    } finally {
      setIsAiResponding(false);
    }
  }, [storyContent, isAiResponding, isApiKeyMissing]);

  const handleLanguageSelect = (language: string) => {
     if (!selectedText.trim()) return;
     handleSendMessage('', `Translate the following text into ${language}. Only return the translated text. Text: "${selectedText}"`);
  };

  const handleTranslate = useCallback(() => {
    if (!selectedText.trim()) {
      addSystemMessage('Please select some text to translate.');
      return;
    }
    addSystemMessage('translate'); // Special message for panel to render languages
  }, [selectedText]);

  const handleSuggestionClick = (text: string) => {
    if (editorRef.current) {
        const { selectionStart, selectionEnd } = editorRef.current;
        const newText = storyContent.substring(0, selectionStart) + text + storyContent.substring(selectionEnd);
        setStoryContent(newText);
        editorRef.current.focus();
    }
  };
  
  // --- UI ACTIONS ---
  const handleExportPdf = () => {
      if (storyContent.trim()) setIsExportingPdf(true);
  };
  
  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');
  const toggleFocusMode = () => setFocusMode(prev => !prev);


  useEffect(() => {
    if (!isExportingPdf) return;
    const exportWorker = async () => {
        const element = pdfRef.current;
        if (!element) { setIsExportingPdf(false); return; }
        try {
            const canvas = await html2canvas(element, { scale: 2, logging: false, useCORS: true, backgroundColor: null });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const imgProps = pdf.getImageProperties(imgData);
            const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeight);
            pdf.save('ai-story.pdf');
        } catch (e) {
            console.error("Error exporting PDF:", e);
            addSystemMessage("Could not export to PDF. See console for details.");
        } finally {
            setIsExportingPdf(false);
        }
    };
    setTimeout(exportWorker, 100);
  }, [isExportingPdf]);

  return (
    <>
      {isApiKeyMissing && <ApiKeyWarning />}
      <div className={`flex h-screen font-sans text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-900 transition-all duration-300`}>
        <div 
           className={`bg-gray-100 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700/50 p-2 flex flex-col items-center transition-transform duration-500 ease-in-out ${isFocusMode ? '-translate-x-full w-0' : 'w-20'}`}
        >
          <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center mb-6 flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-white">
              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
            </svg>
          </div>
          <Toolbar
            onContinue={handleContinueWriting}
            onSuggestTitle={handleSuggestTitles}
            onGetCharacters={handleGetCharacterIdeas}
            onSuggestPlotTwist={handleSuggestPlotTwist}
            onImprove={handleImproveWriting}
            onTranslate={handleTranslate}
            onDiscussIdea={() => handleSendMessage("Let's brainstorm some ideas for my story.")}
            onWritersBlock={() => addSystemMessage('writers_block')}
            onToggleTheme={toggleTheme}
            theme={theme}
            isLoading={isAiResponding}
            isApiConfigured={!isApiKeyMissing}
            hasSelection={!!selectedText.trim()}
            hasContent={!!storyContent.trim()}
          />
        </div>

        <main className="flex-1 flex flex-col p-2 sm:p-6 gap-6 transition-all duration-300">
          <Editor
            ref={editorRef}
            content={storyContent}
            onContentChange={setStoryContent}
            onSelectionChange={setSelectedText}
            isStreaming={isAiResponding}
            onExportPdf={handleExportPdf}
            isExporting={isExportingPdf}
            isFocusMode={isFocusMode}
            onToggleFocusMode={toggleFocusMode}
          />
        </main>
        
        <aside className={`transition-transform duration-500 ease-in-out bg-gray-200/50 dark:bg-gray-800/50 border-l border-gray-200 dark:border-gray-700/50 flex flex-col ${isFocusMode ? 'translate-x-full w-0' : 'w-[380px]'}`}>
          <AIAssistantPanel
            chatHistory={chatHistory}
            isAiResponding={isAiResponding}
            isApiConfigured={!isApiKeyMissing}
            onSendMessage={handleSendMessage}
            onSuggestionClick={handleSuggestionClick}
            onLanguageSelect={handleLanguageSelect}
          />
        </aside>
      </div>
      {isExportingPdf && (
          <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
               <PdfPreview ref={pdfRef} content={storyContent} />
          </div>
      )}
    </>
  );
}
