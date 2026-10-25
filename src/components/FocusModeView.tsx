import React, { useState, useEffect, useCallback } from 'react';
import {
  ChevronUp,
  ChevronDown,
  Volume2,
  VolumeX,
  Bookmark,
  Heart,
  Share2,
  Sparkles,
  Maximize2,
  Minimize2,
  Check,
  ArrowLeft,
  FastForward,
} from 'lucide-react';
import { IdeaCard } from '../types';

interface FocusModeViewProps {
  ideas: IdeaCard[];
  stashedIdeaIds: Set<string>;
  likedIdeaIds: Set<string>;
  onLike: (id: string) => void;
  onStash: (idea: IdeaCard) => void;
  onToggleAudio: (idea: IdeaCard) => void;
  isPlayingAudio: boolean;
  currentAudioId: string | null;
  onClose: () => void;
  onShare: (idea: IdeaCard) => void;
  copiedId: string | null;
}

export const FocusModeView: React.FC<FocusModeViewProps> = ({
  ideas,
  stashedIdeaIds,
  likedIdeaIds,
  onLike,
  onStash,
  onToggleAudio,
  isPlayingAudio,
  currentAudioId,
  onClose,
  onShare,
  copiedId,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const currentCard = ideas[currentIndex] || ideas[0];
  const isStashed = currentCard ? stashedIdeaIds.has(currentCard.id) : false;
  const isLiked = currentCard ? likedIdeaIds.has(currentCard.id) : false;
  const isCurrentAudio = currentCard ? isPlayingAudio && currentAudioId === currentCard.id : false;

  const handleNext = useCallback(() => {
    if (currentIndex < ideas.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  }, [currentIndex, ideas.length]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex]);

  // Synchronize current card when continuous auto-play advances
  useEffect(() => {
    if (currentAudioId) {
      const idx = ideas.findIndex((i) => i.id === currentAudioId);
      if (idx !== -1 && idx !== currentIndex) {
        setCurrentIndex(idx);
      }
    }
  }, [currentAudioId, ideas, currentIndex]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'j') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowUp' || e.key === 'k') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === ' ' && currentCard) {
        e.preventDefault();
        onToggleAudio(currentCard);
      } else if (e.key.toLowerCase() === 'l' && currentCard) {
        e.preventDefault();
        onLike(currentCard.id);
      } else if (e.key.toLowerCase() === 's' && currentCard) {
        e.preventDefault();
        onStash(currentCard);
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev, currentCard, onToggleAudio, onLike, onStash, onClose]);

  if (!currentCard) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-stone-500">
        No cards available to preview.
      </div>
    );
  }

  const progressPercentage = ((currentIndex + 1) / ideas.length) * 100;

  return (
    <div className="relative w-full max-w-2xl mx-auto min-h-[80vh] flex flex-col justify-between py-2 sm:py-6">
      {/* Top Bar with Progress & Exit */}
      <div className="flex items-center justify-between gap-4 mb-4 px-2">
        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Exit Focus</span>
        </button>

        {/* Progress indicator */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-stone-400">
            {currentIndex + 1} / {ideas.length}
          </span>
          <div className="w-24 h-1.5 bg-stone-200 dark:bg-stone-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Shortcut hints */}
        <div className="hidden sm:flex items-center gap-2 text-[11px] text-stone-400">
          <span className="bg-stone-100 dark:bg-stone-800 px-1.5 py-0.5 rounded">↑ / ↓</span>
          <span>to swipe</span>
        </div>
      </div>

      {/* The Central Focused Snap Card */}
      <div className="relative flex-1 flex flex-col justify-between rounded-3xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 sm:p-10 shadow-xl transition-all duration-300 my-auto">
        <div>
          {/* Source kicker */}
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-stone-500 dark:text-stone-400">
              <span className="text-blue-600 dark:text-blue-400">{currentCard.sourceType}</span>
              <span aria-hidden="true" className="text-stone-300 dark:text-stone-700">·</span>
              <span className="truncate max-w-[200px]">{currentCard.sourceTitle}</span>
              {currentCard.author && (
                <>
                  <span aria-hidden="true" className="text-stone-300 dark:text-stone-700">·</span>
                  <span className="truncate text-stone-700 dark:text-stone-300">{currentCard.author}</span>
                </>
              )}
            </div>

            {/* Audio Toggle */}
            <button
              type="button"
              onClick={() => onToggleAudio(currentCard)}
              className={`p-2 rounded-xl text-xs flex items-center gap-1.5 font-medium transition-all ${
                isCurrentAudio
                  ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 ring-2 ring-amber-400 animate-pulse'
                  : 'text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
            >
              {isCurrentAudio ? (
                <>
                  <VolumeX className="w-4 h-4" />
                  <span className="text-[11px]">Listening</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4" />
                  <span className="text-[11px] hidden sm:inline">Listen</span>
                </>
              )}
            </button>
          </div>

          {/* Big Headline */}
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-900 dark:text-stone-50 mb-4 sm:mb-6 leading-tight">
            {currentCard.title}
          </h2>

          {/* Deepstash Takeaway Prose */}
          <div className="prose prose-stone dark:prose-invert max-w-none mb-6">
            <p className="text-base sm:text-lg leading-relaxed text-stone-700 dark:text-stone-300 font-normal whitespace-pre-line">
              {currentCard.body}
            </p>
            <div className="text-[11px] font-semibold text-stone-400 dark:text-stone-500 mt-2">
              {currentCard.body.length} characters · ~{Math.max(1, Math.round(currentCard.body.length / 450))} min read
            </div>
          </div>

          {/* Actionable Takeaway banner */}
          {currentCard.actionableTakeaway && (
            <div className="mb-6 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 p-4 text-xs sm:text-sm text-stone-800 dark:text-stone-200 leading-relaxed">
              <div className="font-semibold text-xs uppercase tracking-wider text-amber-700 dark:text-amber-400 mb-1.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span>Actionable Takeaway</span>
              </div>
              <p>{currentCard.actionableTakeaway}</p>
            </div>
          )}

          {/* Tags */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {currentCard.tags.map((tag) => (
              <span key={tag} className="text-stone-500 dark:text-stone-400 font-medium">
                #{tag}
              </span>
            ))}
            <span aria-hidden="true" className="text-stone-300 dark:text-stone-700">·</span>
            <span className="text-stone-400 text-xs">{currentCard.readTime}</span>
          </div>
        </div>

        {/* Card Action Controls */}
        <div className="pt-6 mt-6 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Like */}
            <button
              type="button"
              onClick={() => onLike(currentCard.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                isLiked
                  ? 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40'
                  : 'text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-rose-600 dark:fill-rose-400' : ''}`} />
              <span>{currentCard.likesCount + (isLiked ? 1 : 0)}</span>
            </button>

            {/* Share */}
            <button
              type="button"
              onClick={() => onShare(currentCard)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              {copiedId === currentCard.id ? (
                <Check className="w-4 h-4 text-emerald-600" />
              ) : (
                <Share2 className="w-4 h-4" />
              )}
              <span>{copiedId === currentCard.id ? 'Copied' : 'Share'}</span>
            </button>
          </div>

          {/* Stash Action Button */}
          <button
            type="button"
            onClick={() => onStash(currentCard)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm ${
              isStashed
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-stone-900 text-white hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-200'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${isStashed ? 'fill-current' : ''}`} />
            <span>{isStashed ? 'In My Stash' : 'Stash Card'}</span>
          </button>
        </div>
      </div>

      {/* Floating Vertical Navigation Arrows */}
      <div className="flex items-center justify-center gap-4 mt-4">
        <button
          type="button"
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className={`flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
            currentIndex === 0
              ? 'opacity-40 cursor-not-allowed border-stone-200 dark:border-stone-800 text-stone-400'
              : 'border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800'
          }`}
        >
          <ChevronUp className="w-4 h-4" />
          <span>Previous Idea</span>
        </button>

        <button
          type="button"
          onClick={handleNext}
          disabled={currentIndex === ideas.length - 1}
          className={`flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
            currentIndex === ideas.length - 1
              ? 'opacity-40 cursor-not-allowed border-stone-200 dark:border-stone-800 text-stone-400'
              : 'border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800'
          }`}
        >
          <span>Next Idea</span>
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
