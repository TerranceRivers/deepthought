import React, { useState } from 'react';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  X,
  Sparkles,
  ChevronUp,
  ChevronDown,
  RotateCw,
  CheckCircle2,
  Headphones,
  Sliders,
  Settings2,
} from 'lucide-react';
import { IdeaCard } from '../types';
import { VoiceMode } from '../hooks/useContinuousAudioPlayer';
import { AvailableVoice } from '../utils/naturalSpeech';

interface ContinuousAudioBarProps {
  currentIdea: IdeaCard | null;
  isPlaying: boolean;
  isPaused: boolean;
  isLoadingAudio: boolean;
  isAutoPlayActive: boolean;
  currentBatchIndex: number;
  batchLimit: number;
  isBatchFinished: boolean;
  voiceMode: VoiceMode;
  onSelectVoiceMode: (mode: VoiceMode) => void;
  activeVoiceLabel?: string;
  isStudioAudioActive?: boolean;
  availableVoices?: AvailableVoice[];
  selectedBrowserVoiceId?: string | null;
  onSelectBrowserVoiceId?: (id: string) => void;
  rate: number;
  onChangeRate: (rate: number) => void;
  autoScroll: boolean;
  onToggleAutoScroll: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onNext: () => void;
  onPrev: () => void;
  onContinueNext10: () => void;
}

export const ContinuousAudioBar: React.FC<ContinuousAudioBarProps> = ({
  currentIdea,
  isPlaying,
  isPaused,
  isLoadingAudio,
  isAutoPlayActive,
  currentBatchIndex,
  batchLimit,
  isBatchFinished,
  voiceMode,
  onSelectVoiceMode,
  activeVoiceLabel,
  isStudioAudioActive,
  availableVoices = [],
  selectedBrowserVoiceId,
  onSelectBrowserVoiceId,
  rate,
  onChangeRate,
  autoScroll,
  onToggleAutoScroll,
  onPause,
  onResume,
  onStop,
  onNext,
  onPrev,
  onContinueNext10,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // If nothing is playing and no batch finished, don't show
  if (!currentIdea && !isBatchFinished && !isAutoPlayActive) {
    return null;
  }

  // 10-Posts Batch Complete State
  if (isBatchFinished) {
    return (
      <aside aria-label="Audio playback" className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-xl animate-in fade-in slide-in-from-bottom-5 duration-300">
        <div className="rounded-3xl border border-amber-300 dark:border-amber-800 bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 text-white p-5 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="font-extrabold text-base leading-tight">
                10-Post Playlist Finished! 🎉
              </div>
              <p className="text-xs text-amber-100 mt-0.5">
                You absorbed 10 idea cards. Ready for the next 10?
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onStop}
              className="px-3 py-2 text-xs font-semibold rounded-xl text-amber-100 hover:text-white hover:bg-white/10 transition-colors"
            >
              Done
            </button>
            <button
              type="button"
              onClick={onContinueNext10}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white text-stone-900 text-xs font-bold shadow-md hover:bg-amber-50 transition-all"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Play Next 10 Posts</span>
            </button>
          </div>
        </div>
      </aside>
    );
  }

  const postsRemaining = Math.max(0, batchLimit - (currentBatchIndex + 1));

  return (
    <aside aria-label="Audio playback" className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="rounded-3xl border border-stone-200 dark:border-stone-800 bg-white/95 dark:bg-stone-900/95 backdrop-blur-xl text-stone-900 dark:text-stone-100 p-4 shadow-2xl transition-all">
        {/* Top Progress Track: 10 Segments */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-[11px] font-semibold text-stone-500 dark:text-stone-400 mb-1.5">
            <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
              <Headphones className="w-3.5 h-3.5" />
              <span>
                {isAutoPlayActive
                  ? `Continuous Auto-Play: Post ${currentBatchIndex + 1} of ${batchLimit}`
                  : 'Now Playing'}
              </span>
            </div>
            {isAutoPlayActive && (
              <span className="text-[11px] text-stone-400">
                {postsRemaining === 0 ? 'Last post in batch' : `${postsRemaining} left before pause`}
              </span>
            )}
          </div>

          {/* 10 Visual Progress Dots/Segments */}
          {isAutoPlayActive && (
            <div className="flex items-center gap-1.5 w-full">
              {Array.from({ length: batchLimit }).map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                    idx < currentBatchIndex
                      ? 'bg-blue-600 dark:bg-blue-500'
                      : idx === currentBatchIndex
                      ? 'bg-amber-500 animate-pulse'
                      : 'bg-stone-200 dark:bg-stone-800'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Main Player Row */}
        <div className="flex items-center justify-between gap-3">
          {/* Card Info */}
          <div className="flex-1 min-w-0 pr-2">
            <h4 className="text-xs sm:text-sm font-bold text-stone-900 dark:text-stone-100 truncate">
              {currentIdea?.title || 'Loading Idea...'}
            </h4>
            <div className="flex items-center gap-2 text-[11px] text-stone-500 dark:text-stone-400 truncate mt-0.5">
              <span>{currentIdea?.sourceType}</span>
              <span aria-hidden="true">·</span>
              <span className="truncate">{currentIdea?.sourceTitle}</span>
              {currentIdea?.author && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="truncate">{currentIdea.author}</span>
                </>
              )}
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-[10px] text-blue-600 dark:text-blue-400 font-semibold shrink-0">
                <Sparkles className="w-2.5 h-2.5" />
                <span>{activeVoiceLabel || 'Natural Voice'}</span>
              </span>
            </div>
          </div>

          {/* Player Controls */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Prev */}
            {isAutoPlayActive && (
              <button
                type="button"
                onClick={onPrev}
                className="p-2 text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                title="Previous idea"
              >
                <SkipBack className="w-4 h-4" />
              </button>
            )}

            {/* Play/Pause Button */}
            <button
              type="button"
              onClick={isPlaying && !isPaused ? onPause : onResume}
              disabled={isLoadingAudio}
              className="w-10 h-10 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-md transition-transform active:scale-95 disabled:opacity-50"
            >
              {isLoadingAudio ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : isPlaying && !isPaused ? (
                <Pause className="w-5 h-5 fill-white" />
              ) : (
                <Play className="w-5 h-5 fill-white ml-0.5" />
              )}
            </button>

            {/* Next */}
            {isAutoPlayActive && (
              <button
                type="button"
                onClick={onNext}
                className="p-2 text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                title="Next idea in batch"
              >
                <SkipForward className="w-4 h-4" />
              </button>
            )}

            {/* Settings toggle */}
            <button
              type="button"
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-xl text-xs transition-colors ${
                showSettings
                  ? 'bg-stone-200 dark:bg-stone-800 text-stone-900 dark:text-stone-100'
                  : 'text-stone-400 hover:text-stone-700 dark:hover:text-stone-300'
              }`}
              title="Voice & Speed Settings"
            >
              <Settings2 className="w-4 h-4" />
            </button>

            {/* Close / Stop */}
            <button
              type="button"
              onClick={onStop}
              className="p-2 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              title="Stop auto-reading"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Collapsible Settings Drawer: Voice Selection, Speed, Auto-Scroll */}
        {showSettings && (
          <div className="mt-3 pt-3 border-t border-stone-100 dark:border-stone-800 flex flex-col gap-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Voice Style Selector */}
              <div>
                <label className="block text-[11px] font-semibold text-stone-500 dark:text-stone-400 mb-1">
                  Speaking Voice Engine:
                </label>
                <select
                  value={voiceMode}
                  onChange={(e) => onSelectVoiceMode(e.target.value as VoiceMode)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <optgroup label="✨ Studio AI Voices (Gemini)">
                    <option value="studio-kore">🎙️ Studio Kore (Warm AI Female)</option>
                    <option value="studio-puck">🎙️ Studio Puck (Conversational AI Male)</option>
                    <option value="studio-fenrir">🎙️ Studio Fenrir (Deep Resonant AI Male)</option>
                    <option value="studio-charon">🎙️ Studio Charon (Authoritative AI Male)</option>
                    <option value="studio-zephyr">🎙️ Studio Zephyr (Bright Modern AI Female)</option>
                  </optgroup>
                </select>
              </div>

              {/* Speed Control */}
              <div>
                <label className="block text-[11px] font-semibold text-stone-500 dark:text-stone-400 mb-1">
                  Pacing Speed:
                </label>
                <div className="flex items-center gap-1">
                  {[0.85, 1.0, 1.2, 1.5].map((spd) => (
                    <button
                      key={spd}
                      type="button"
                      onClick={() => onChangeRate(spd)}
                      className={`flex-1 py-1 text-xs rounded-lg font-semibold transition-colors ${
                        rate === spd
                          ? 'bg-blue-600 text-white'
                          : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200'
                      }`}
                    >
                      {spd}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Auto-Scroll Toggle */}
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 cursor-pointer text-[11px] text-stone-600 dark:text-stone-300 font-medium">
                  <input
                    type="checkbox"
                    checked={autoScroll}
                    onChange={onToggleAutoScroll}
                    className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                  />
                  <span>Auto-follow reading card</span>
                </label>
              </div>
            </div>

            {/* Optional Specific Browser Natural Voice Selector if multiple installed */}
            {availableVoices.length > 0 && onSelectBrowserVoiceId && (
              <div className="pt-2 border-t border-dashed border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="text-[11px] text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-blue-500" />
                  <span>Installed Natural Voice Profile:</span>
                </div>
                <select
                  value={selectedBrowserVoiceId || availableVoices[0]?.id || ''}
                  onChange={(e) => onSelectBrowserVoiceId(e.target.value)}
                  className="px-2.5 py-1 text-[11px] rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200 max-w-xs truncate font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {availableVoices.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.displayName}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
