
import React, { forwardRef, useMemo } from 'react';
import { PdfIcon } from './icons/PdfIcon';
import { FocusIcon } from './icons/FocusIcon';

interface EditorProps {
  content: string;
  onContentChange: (content: string) => void;
  onSelectionChange: (selectedText: string) => void;
  isStreaming: boolean;
  onExportPdf: () => void;
  isExporting: boolean;
  isFocusMode: boolean;
  onToggleFocusMode: () => void;
}

export const Editor = forwardRef<HTMLTextAreaElement, EditorProps>(({ content, onContentChange, onSelectionChange, isStreaming, onExportPdf, isExporting, isFocusMode, onToggleFocusMode }, ref) => {
    
  const handleSelect = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;
    const selectedText = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd);
    onSelectionChange(selectedText);
  };
    
  const stats = useMemo(() => {
    const trimmedContent = content.trim();
    if (!trimmedContent) {
        return { words: 0, chars: 0 };
    }
    const words = trimmedContent.split(/\s+/).filter(Boolean).length;
    const chars = content.length;
    return { words, chars };
  }, [content]);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-xl transition-colors duration-300">
      <textarea
        ref={ref}
        value={content}
        onChange={(e) => onContentChange(e.target.value)}
        onSelect={handleSelect}
        readOnly={isStreaming || isExporting}
        className="flex-grow w-full p-6 bg-transparent text-gray-800 dark:text-gray-200 text-lg leading-relaxed focus:outline-none resize-none placeholder-gray-500/80 dark:placeholder-gray-500 transition-colors duration-300"
        placeholder="Once upon a time..."
      />
      <div className="flex justify-between items-center px-4 py-2 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400 transition-colors duration-300">
        <div className="flex items-center gap-1">
            <button 
                onClick={onExportPdf} 
                disabled={!content.trim() || isExporting} 
                className="flex items-center gap-2 px-3 py-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white disabled:text-gray-400 dark:disabled:text-gray-600 disabled:cursor-not-allowed transition-colors"
                title="Export as PDF"
            >
                <PdfIcon />
                <span className="hidden sm:inline">{isExporting ? 'Exporting...' : 'Export PDF'}</span>
            </button>
             <button 
                onClick={onToggleFocusMode}
                className="flex items-center gap-2 px-3 py-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-colors"
                title={isFocusMode ? "Exit Focus Mode" : "Enter Focus Mode"}
            >
                <FocusIcon />
            </button>
        </div>
        <div className="flex items-center">
            <span>{stats.words} words</span>
            <span className="mx-2">|</span>
            <span>{stats.chars} characters</span>
        </div>
      </div>
    </div>
  );
});
