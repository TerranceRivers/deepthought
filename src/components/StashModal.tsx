import React, { useState } from 'react';
import { X, Plus, Check, FolderPlus, Sparkles } from 'lucide-react';
import { IdeaCard, Stash } from '../types';

interface StashModalProps {
  idea: IdeaCard | null;
  stashes: Stash[];
  onClose: () => void;
  onToggleStash: (stashId: string, ideaId: string) => void;
  onCreateStash: (name: string, description: string, iconEmoji: string) => void;
}

const EMOJI_OPTIONS = ['⚡', '🧠', '🏛️', '💎', '🔮', '🚀', '🎯', '🌿', '💡', '📚', '🛠️', '✨'];

export const StashModal: React.FC<StashModalProps> = ({
  idea,
  stashes,
  onClose,
  onToggleStash,
  onCreateStash,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newStashName, setNewStashName] = useState('');
  const [newStashDesc, setNewStashDesc] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('💡');

  if (!idea) return null;

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStashName.trim()) return;
    onCreateStash(newStashName.trim(), newStashDesc.trim(), selectedEmoji);
    setNewStashName('');
    setNewStashDesc('');
    setIsCreating(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-3xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-100 dark:border-stone-800">
          <div>
            <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">
              Save to Stashes
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 truncate max-w-[280px]">
              {idea.title}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Existing Stashes List */}
        <div className="my-4 max-h-60 overflow-y-auto space-y-2 pr-1">
          {stashes.map((stash) => {
            const isIncluded = stash.ideaIds.includes(idea.id);
            return (
              <button
                key={stash.id}
                type="button"
                onClick={() => onToggleStash(stash.id, idea.id)}
                className={`w-full flex items-center justify-between p-3 rounded-2xl border text-left transition-all ${
                  isIncluded
                    ? 'border-blue-500/50 bg-blue-50/50 dark:bg-blue-950/20 text-stone-900 dark:text-stone-100'
                    : 'border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800/60 text-stone-700 dark:text-stone-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl shrink-0">{stash.iconEmoji}</span>
                  <div>
                    <h4 className="text-sm font-semibold leading-tight">{stash.name}</h4>
                    <span className="text-[11px] text-stone-400">
                      {stash.ideaIds.length} {stash.ideaIds.length === 1 ? 'idea' : 'ideas'}
                    </span>
                  </div>
                </div>

                <div
                  className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                    isIncluded
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'border-stone-300 dark:border-stone-700 bg-transparent'
                  }`}
                >
                  {isIncluded && <Check className="w-3.5 h-3.5" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Create Stash Form or Button */}
        {isCreating ? (
          <form onSubmit={handleCreateSubmit} className="pt-3 border-t border-stone-100 dark:border-stone-800 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-stone-600 dark:text-stone-300">Emoji:</span>
              <div className="flex flex-wrap gap-1">
                {EMOJI_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setSelectedEmoji(emoji)}
                    className={`w-7 h-7 rounded-lg text-sm flex items-center justify-center transition-all ${
                      selectedEmoji === emoji
                        ? 'bg-blue-100 dark:bg-blue-950 ring-2 ring-blue-500'
                        : 'hover:bg-stone-100 dark:hover:bg-stone-800'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <input
              type="text"
              required
              value={newStashName}
              onChange={(e) => setNewStashName(e.target.value)}
              placeholder="Stash Name (e.g. Mental Models)"
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <input
              type="text"
              value={newStashDesc}
              onChange={(e) => setNewStashDesc(e.target.value)}
              placeholder="Short Description (optional)"
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-3 py-1.5 text-xs font-medium text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                Create & Save
              </button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setIsCreating(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl border border-dashed border-stone-300 dark:border-stone-700 text-xs font-semibold text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
          >
            <FolderPlus className="w-4 h-4" />
            <span>Create New Stash</span>
          </button>
        )}

        <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold rounded-xl bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 hover:opacity-90 transition-opacity"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
