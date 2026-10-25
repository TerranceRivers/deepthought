import React from 'react';
import { Bookmark, Heart, Volume2, VolumeX, Share2, Sparkles, BookOpen, ExternalLink, Check } from 'lucide-react';
import { IdeaCard } from '../types';

interface IdeaCardItemProps {
  idea: IdeaCard;
  isStashed: boolean;
  isLiked: boolean;
  isPlayingAudio: boolean;
  onLike: (id: string) => void;
  onStash: (idea: IdeaCard) => void;
  onToggleAudio: (idea: IdeaCard) => void;
  onSelectTag?: (tag: string) => void;
  onOpenDetails: (idea: IdeaCard) => void;
  onShare: (idea: IdeaCard) => void;
  copiedId: string | null;
}

export const IdeaCardItem: React.FC<IdeaCardItemProps> = ({
  idea,
  isStashed,
  isLiked,
  isPlayingAudio,
  onLike,
  onStash,
  onToggleAudio,
  onSelectTag,
  onOpenDetails,
  onShare,
  copiedId,
}) => {
  return (
    <article
      id={`idea-card-${idea.id}`}
      className={`group relative flex flex-col justify-between rounded-2xl border p-6 shadow-sm transition-all duration-300 ${
        isPlayingAudio
          ? 'ring-2 ring-blue-500 border-blue-400 dark:border-blue-500 bg-blue-50/20 dark:bg-blue-950/20 shadow-md scale-[1.01]'
          : 'border-stone-200 dark:border-stone-800/80 bg-white dark:bg-stone-900/90 hover:shadow-md hover:border-stone-300 dark:hover:border-stone-700'
      }`}
    >
      {/* Top Source Kicker & Audio Button */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wider uppercase text-stone-500 dark:text-stone-400 truncate">
          <span>{idea.sourceType}</span>
          <span aria-hidden="true" className="text-stone-300 dark:text-stone-600">·</span>
          <span className="truncate">{idea.sourceTitle}</span>
          {idea.author && (
            <>
              <span aria-hidden="true" className="text-stone-300 dark:text-stone-600">·</span>
              <span className="truncate text-stone-600 dark:text-stone-300">{idea.author}</span>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => onToggleAudio(idea)}
          title={isPlayingAudio ? 'Stop audio' : 'Listen to idea'}
          className={`shrink-0 p-1.5 rounded-lg text-xs transition-colors ${
            isPlayingAudio
              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 animate-pulse'
              : 'text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800'
          }`}
          aria-label={isPlayingAudio ? 'Stop narration' : 'Listen to narration'}
        >
          {isPlayingAudio ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Main Headline */}
      <h3
        onClick={() => onOpenDetails(idea)}
        className="text-lg md:text-xl font-bold tracking-tight text-stone-900 dark:text-stone-100 mb-2.5 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors leading-snug"
      >
        {idea.title}
      </h3>

      {/* Body Text */}
      <div className="mb-3">
        <p
          onClick={() => onOpenDetails(idea)}
          className="text-[14px] leading-relaxed text-stone-600 dark:text-stone-300 cursor-pointer font-normal line-clamp-5"
        >
          {idea.body}
        </p>
        {idea.body.length > 280 && (
          <button
            type="button"
            onClick={() => onOpenDetails(idea)}
            className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline mt-1 inline-block"
          >
            Read full insight ({idea.body.length} chars) →
          </button>
        )}
      </div>

      {/* Actionable Takeaway box */}
      {idea.actionableTakeaway && (
        <div className="mb-4 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200/70 dark:border-stone-800 p-3 text-xs leading-relaxed text-stone-700 dark:text-stone-300">
          <div className="font-semibold text-[11px] uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
            <span>Actionable Takeaway</span>
          </div>
          <p className="line-clamp-2">{idea.actionableTakeaway}</p>
        </div>
      )}

      {/* Tags List */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-4 text-xs">
        {idea.tags.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => onSelectTag?.(tag)}
            className="text-stone-500 dark:text-stone-400 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
          >
            #{tag}
          </button>
        ))}
        <span aria-hidden="true" className="text-stone-300 dark:text-stone-700">·</span>
        <span className="text-stone-400 dark:text-stone-500 text-[11px]">{idea.readTime}</span>
      </div>

      {/* Footer Actions */}
      <div className="pt-3 border-t border-stone-100 dark:border-stone-800/80 flex items-center justify-between">
        <div className="flex items-center gap-1">
          {/* Like Button */}
          <button
            type="button"
            onClick={() => onLike(idea.id)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              isLiked
                ? 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
            aria-label="Like idea"
          >
            <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-rose-600 dark:fill-rose-400' : ''}`} />
            <span>{idea.likesCount + (isLiked ? 1 : 0)}</span>
          </button>

          {/* Share Quote */}
          <button
            type="button"
            onClick={() => onShare(idea)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            title="Copy idea quote"
            aria-label="Share quote"
          >
            {copiedId === idea.id ? (
              <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Share2 className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">
              {copiedId === idea.id ? 'Copied' : 'Share'}
            </span>
          </button>
        </div>

        {/* Stash Button */}
        <button
          type="button"
          onClick={() => onStash(idea)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            isStashed
              ? 'bg-blue-600 text-white shadow-sm hover:bg-blue-700'
              : 'bg-stone-900 text-stone-100 hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-200'
          }`}
        >
          <Bookmark className={`w-3.5 h-3.5 ${isStashed ? 'fill-current' : ''}`} />
          <span>{isStashed ? 'Stashed' : 'Stash'}</span>
        </button>
      </div>
    </article>
  );
};
