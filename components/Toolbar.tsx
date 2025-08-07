
import React from 'react';
import { WriteIcon } from './icons/WriteIcon';
import { BookOpenIcon } from './icons/BookOpenIcon';
import { CharacterIcon } from './icons/CharacterIcon';
import { TwistIcon } from './icons/TwistIcon';
import { ImproveIcon } from './icons/ImproveIcon';
import { TranslateIcon } from './icons/TranslateIcon';
import { SunIcon } from './icons/SunIcon';
import { MoonIcon } from './icons/MoonIcon';
import { ChatBubbleIcon } from './icons/ChatBubbleIcon';
import { LightbulbIcon } from './icons/LightbulbIcon';
import { Theme } from '../types';

interface ToolbarProps {
  onContinue: () => void;
  onSuggestTitle: () => void;
  onGetCharacters: () => void;
  onSuggestPlotTwist: () => void;
  onImprove: () => void;
  onTranslate: () => void;
  onDiscussIdea: () => void;
  onWritersBlock: () => void;
  onToggleTheme: () => void;
  theme: Theme;
  isLoading: boolean;
  hasSelection: boolean;
  hasContent: boolean;
}

interface TooltipButtonProps {
    onClick: () => void;
    disabled?: boolean;
    tooltip: string;
    children: React.ReactNode;
}

const TooltipButton: React.FC<TooltipButtonProps> = ({ onClick, disabled = false, tooltip, children }) => {
    return (
        <div className="group relative flex justify-center">
            <button
                onClick={onClick}
                disabled={disabled}
                className="w-12 h-12 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 transition-colors duration-200
                           hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white
                           disabled:text-gray-400 dark:disabled:text-gray-600 disabled:bg-transparent dark:disabled:bg-transparent disabled:cursor-not-allowed"
            >
                {children}
            </button>
            <span className="absolute left-full ml-4 top-1/2 -translate-y-1/2 w-max px-3 py-1.5 bg-gray-950 text-white text-sm rounded-md shadow-lg
                             opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10 border border-gray-700">
                {tooltip}
            </span>
        </div>
    );
};

export const Toolbar: React.FC<ToolbarProps> = (props) => {
  return (
    <div className="flex flex-col items-center justify-between h-full w-full">
        <div className="flex flex-col items-center gap-2 mt-4">
            <TooltipButton onClick={props.onDiscussIdea} disabled={props.isLoading} tooltip="Discuss Idea">
                <ChatBubbleIcon />
            </TooltipButton>
             <TooltipButton onClick={props.onWritersBlock} disabled={props.isLoading} tooltip="Writer's Block">
                <LightbulbIcon />
            </TooltipButton>
            <hr className="w-8 border-t border-gray-300 dark:border-gray-700 my-2" />
            <TooltipButton onClick={props.onContinue} disabled={props.isLoading || !props.hasContent} tooltip="Continue Writing">
                <WriteIcon />
            </TooltipButton>
            <TooltipButton onClick={props.onSuggestTitle} disabled={props.isLoading || !props.hasContent} tooltip="Suggest Titles">
                <BookOpenIcon />
            </TooltipButton>
            <TooltipButton onClick={props.onGetCharacters} disabled={props.isLoading} tooltip="Character Ideas">
                <CharacterIcon />
            </TooltipButton>
            <TooltipButton onClick={props.onSuggestPlotTwist} disabled={props.isLoading || !props.hasContent} tooltip="Suggest Plot Twist">
                <TwistIcon />
            </TooltipButton>
            <TooltipButton onClick={props.onImprove} disabled={props.isLoading || !props.hasSelection} tooltip="Improve Selection">
                <ImproveIcon />
            </TooltipButton>
            <TooltipButton onClick={props.onTranslate} disabled={props.isLoading || !props.hasSelection} tooltip="Translate Selection">
                <TranslateIcon />
            </TooltipButton>
        </div>
        <div className="flex flex-col items-center gap-2 mb-4">
             <TooltipButton onClick={props.onToggleTheme} tooltip={`Switch to ${props.theme === 'light' ? 'Dark' : 'Light'} Mode`}>
                {props.theme === 'light' ? <MoonIcon /> : <SunIcon />}
            </TooltipButton>
        </div>
    </div>
  );
};
