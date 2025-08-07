
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

export default function App() {
  const [theme, setTheme] = useState<Theme>('dark');
  const [isFocusMode, setFocusMode] = useState<boolean>(false);
  const [storyContent, setStoryContent] = useState<string>('');
  const [selectedText, setSelectedText] = useState<string>('');
  const [isAiResponding, setIsAiResponding] = useState<boolean>(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>(initialChat);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const pdfRef = useRef<HTMLDivElement>(null);
  const chatInstance = useRef<any>(null); // Using any for Gemini Chat object

  useEffect(() => {
    // Initialize theme from localStorage or default to dark
    const savedTheme = localStorage.getItem('story-studio-theme') as Theme;
    const initialTheme = savedTheme || 'dark';
    setTheme(initialTheme);
    
    // Initialize Gemini Chat
    chatInstance.current = geminiService.startChat();
  }, []);

  useEffect(() => {
    // Apply theme class to html element
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('story-studio-theme', theme);
  }, [theme]);

  const handleSendMessage = useCallback(async (prompt: string, hiddenPrompt?: string) => {
    setIsAiResponding(true);
    const thinkingId = nanoid();

    setChatHistory(prev => [
      ...prev,
      ...(prompt ? [{ id: nanoid(), role: 'user', content: prompt }] : []),
      { id: thinkingId, role: 'model', content: "Thinking...", isThinking: true }
    ]);
    
    try {
      const fullPrompt = hiddenPrompt || prompt;
      const response = await chatInstance.current.sendMessage(fullPrompt);
      
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
  }, []);
  
  const addSystemMessage = (content: React.ReactNode) => {
      setChatHistory(prev => [...prev, { id: nanoid(), role: 'system', content }]);
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
     if (isAiResponding) return;
     setIsAiResponding(true);
     const thinkingId = nanoid();
     setChatHistory(prev => [...prev, {id: thinkingId, role: 'model', content: "Continuing the story...", isThinking: true}]);

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
  }, [storyContent, isAiResponding]);

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
