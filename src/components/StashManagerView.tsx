import React, { useState } from 'react';
import { Folder, FolderPlus, Trash2, ArrowRight, BookOpen, Clock, Sparkles, Headphones } from 'lucide-react';
import { IdeaCard, Stash } from '../types';
import { IdeaCardItem } from './IdeaCardItem';

interface StashManagerViewProps {
  stashes: Stash[];
  ideas: IdeaCard[];
  activeStashId: string | null;
  onSelectStash: (stashId: string | null) => void;
  onOpenCreateStash: () => void;
  onDeleteCustomStash: (stashId: string) => void;
  stashedIdeaIds: Set<string>;
  likedIdeaIds: Set<string>;
  onLike: (id: string) => void;
  onStash: (idea: IdeaCard) => void;
  onToggleAudio: (idea: IdeaCard, playlist?: IdeaCard[]) => void;
  onStartAutoPlayStash?: (stashIdeas: IdeaCard[]) => void;
  isPlayingAudio: boolean;
  currentAudioId: string | null;
  onSelectTag?: (tag: string) => void;
  onOpenDetails: (idea: IdeaCard) => void;
  onShare: (idea: IdeaCard) => void;
  copiedId: string | null;
}

export const StashManagerView: React.FC<StashManagerViewProps> = ({
  stashes,
  ideas,
  activeStashId,
  onSelectStash,
  onOpenCreateStash,
  onDeleteCustomStash,
  stashedIdeaIds,
  likedIdeaIds,
  onLike,
  onStash,
  onToggleAudio,
  onStartAutoPlayStash,
  isPlayingAudio,
  currentAudioId,
  onSelectTag,
  onOpenDetails,
  onShare,
  copiedId,
}) => {
  const activeStash = stashes.find((s) => s.id === activeStashId);

  // If a stash is selected, show its ideas
  if (activeStash) {
    const stashIdeas = ideas.filter((i) => activeStash.ideaIds.includes(i.id));

    return (
      <div className="space-y-6">
        {/* Stash Header Banner */}
        <div className="p-6 sm:p-8 rounded-3xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-xs">
          <button
            type="button"
            onClick={() => onSelectStash(null)}
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline mb-3 inline-flex items-center gap-1"
          >
            ← Back to All Stashes
          </button>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="text-4xl">{activeStash.iconEmoji}</span>
              <div>
                <h2 className="text-2xl font-extrabold text-stone-900 dark:text-stone-100">
                  {activeStash.name}
                </h2>
                <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-0.5">
                  {activeStash.description}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-3 text-xs font-semibold text-stone-600 dark:text-stone-300">
                <span className="flex items-center gap-1">
                  <BookOpen className="w-4 h-4 text-stone-400" />
                  {stashIdeas.length} {stashIdeas.length === 1 ? 'Idea' : 'Ideas'}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4 text-stone-400" />
                  ~{stashIdeas.length} min read
                </span>
              </div>

              {stashIdeas.length > 0 && onStartAutoPlayStash && (
                <button
                  type="button"
                  onClick={() => onStartAutoPlayStash(stashIdeas)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-stone-950 transition-all shadow-md"
                >
                  <Headphones className="w-4 h-4 fill-stone-950" />
                  <span>Listen to Book Cards ({stashIdeas.length})</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Ideas Grid inside Stash */}
        {stashIdeas.length === 0 ? (
          <div className="p-12 text-center rounded-3xl border border-dashed border-stone-300 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/40">
            <Folder className="w-10 h-10 text-stone-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-stone-800 dark:text-stone-200 mb-1">
              This stash is empty
            </h3>
            <p className="text-xs text-stone-500 mb-4 max-w-sm mx-auto">
              Browse the feed and click the "Stash" button on any idea to organize it here.
            </p>
            <button
              type="button"
              onClick={() => onSelectStash(null)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 hover:opacity-90 transition-opacity"
            >
              Browse Stashes
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {stashIdeas.map((idea) => (
              <IdeaCardItem
                key={idea.id}
                idea={idea}
                isStashed={stashedIdeaIds.has(idea.id)}
                isLiked={likedIdeaIds.has(idea.id)}
                isPlayingAudio={isPlayingAudio && currentAudioId === idea.id}
                onLike={onLike}
                onStash={onStash}
                onToggleAudio={(i) => onToggleAudio(i, stashIdeas)}
                onSelectTag={onSelectTag}
                onOpenDetails={onOpenDetails}
                onShare={onShare}
                copiedId={copiedId}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // All Stashes Overview Grid
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold text-stone-900 dark:text-stone-100">
            My Curated Stashes
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">
            Your personal digital notebooks of ideas, mental models, and wisdom
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenCreateStash}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all"
        >
          <FolderPlus className="w-4 h-4" />
          <span>New Stash</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {stashes.map((stash) => {
          const count = stash.ideaIds.length;
          return (
            <div
              key={stash.id}
              onClick={() => onSelectStash(stash.id)}
              className="group relative flex flex-col justify-between p-6 rounded-3xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:border-blue-400 dark:hover:border-blue-600 shadow-xs hover:shadow-md transition-all cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-3xl">{stash.iconEmoji}</span>
                  <div className="flex items-center gap-1.5">
                    {stash.isCustom && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Delete custom stash "${stash.name}"?`)) {
                            onDeleteCustomStash(stash.id);
                          }
                        }}
                        className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                        title="Delete stash"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">
                      {count} {count === 1 ? 'idea' : 'ideas'}
                    </span>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {stash.name}
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 line-clamp-2 leading-relaxed">
                  {stash.description}
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs font-semibold text-blue-600 dark:text-blue-400">
                <span>View Stash</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
