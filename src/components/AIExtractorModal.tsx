import React, { useState } from 'react';
import { X, Sparkles, Loader2, Check, ArrowRight, BookOpen, Layers, RefreshCw } from 'lucide-react';
import { IdeaCard, Stash } from '../types';

interface AIExtractorModalProps {
  onClose: () => void;
  onAddExtractedIdeas: (ideas: IdeaCard[], targetStashId?: string) => void;
  stashes: Stash[];
}

const PRESETS = [
  {
    name: 'Atomic Habits',
    sourceType: 'Book',
    sourceTitle: 'Atomic Habits',
    author: 'James Clear',
    topic: 'Habits & Systems',
    snippet:
      'You do not rise to the level of your goals. You fall to the level of your systems. Habits are the compound interest of self-improvement. The 4 laws: Make it obvious, make it attractive, make it easy, make it satisfying. Small 1% changes compound exponentially over time.',
  },
  {
    name: 'Naval: How to Get Rich',
    sourceType: 'Podcast / Notes',
    sourceTitle: 'The Almanack of Naval Ravikant',
    author: 'Naval Ravikant',
    topic: 'Wealth & Leverage',
    snippet:
      'Seek wealth, not money or status. Wealth is having assets that earn while you sleep. You’re not going to get rich renting out your time. You must own equity. Arm yourself with specific knowledge, accountability, and leverage. Code and media are permissionless leverage.',
  },
  {
    name: 'Thinking, Fast & Slow',
    sourceType: 'Book',
    sourceTitle: 'Thinking, Fast and Slow',
    author: 'Daniel Kahneman',
    topic: 'Psychology & Biases',
    snippet:
      'System 1 operates automatically and quickly, with little or no effort and no sense of voluntary control. System 2 allocates attention to effortful mental operations. Loss aversion: losses loom larger than gains. Anchoring effect and availability heuristic bias real-world forecasting.',
  },
  {
    name: 'Meditations',
    sourceType: 'Book',
    sourceTitle: 'Meditations',
    author: 'Marcus Aurelius',
    topic: 'Stoic Philosophy',
    snippet:
      'When you wake up in the morning, tell yourself: The people I deal with today will be meddling, ungrateful, arrogant, dishonest, jealous, and surly. They are like this because they cannot distinguish good from evil. But I have seen the beauty of good, and the ugliness of evil, and have recognized that the wrongdoer has a nature related to my own.',
  },
];

export const AIExtractorModal: React.FC<AIExtractorModalProps> = ({
  onClose,
  onAddExtractedIdeas,
  stashes,
}) => {
  const [inputText, setInputText] = useState('');
  const [sourceTitle, setSourceTitle] = useState('');
  const [sourceType, setSourceType] = useState('Book');
  const [author, setAuthor] = useState('');
  const [targetStashId, setTargetStashId] = useState<string>(stashes[0]?.id || '');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [extractedIdeas, setExtractedIdeas] = useState<IdeaCard[] | null>(null);

  const applyPreset = (preset: (typeof PRESETS)[0]) => {
    setInputText(preset.snippet);
    setSourceTitle(preset.sourceTitle);
    setSourceType(preset.sourceType);
    setAuthor(preset.author);
    setErrorMsg(null);
  };

  const handleExtract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) {
      setErrorMsg('Please paste some text, article notes, or select a preset.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/extract-ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: inputText,
          sourceTitle: sourceTitle.trim() || 'Curated Article',
          sourceType: sourceType || 'Book',
          author: author.trim() || 'Curator',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to extract ideas');
      }

      if (data.ideas && Array.isArray(data.ideas)) {
        setExtractedIdeas(data.ideas);
      } else {
        throw new Error('No ideas returned from model');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Something went wrong while processing with AI.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAll = () => {
    if (!extractedIdeas || extractedIdeas.length === 0) return;
    onAddExtractedIdeas(extractedIdeas, targetStashId || undefined);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 sm:p-8 shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-100 dark:border-stone-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                AI Idea Extractor
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Turn long-form books, articles, or transcripts into bite-sized actionable cards
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Section: Form or Results */}
        {!extractedIdeas ? (
          <form onSubmit={handleExtract} className="space-y-4 pt-4">
            {/* Quick Presets */}
            <div>
              <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 mb-1.5">
                Quick Sample Presets:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {PRESETS.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => applyPreset(p)}
                    className="p-2.5 text-left rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/40 hover:border-blue-400 dark:hover:border-blue-600 hover:bg-blue-50/30 transition-all text-xs"
                  >
                    <div className="font-semibold text-stone-800 dark:text-stone-200 truncate">
                      {p.name}
                    </div>
                    <div className="text-[11px] text-stone-400 truncate">{p.author}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Input Text Area */}
            <div>
              <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 mb-1.5">
                Paste Text, Article Notes, or Book Summary:
              </label>
              <textarea
                rows={5}
                required
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Paste an article paragraph, chapter takeaway, podcast notes, or thought..."
                className="w-full p-3.5 text-xs sm:text-sm rounded-2xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/60 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Metadata Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 mb-1">
                  Source Title:
                </label>
                <input
                  type="text"
                  value={sourceTitle}
                  onChange={(e) => setSourceTitle(e.target.value)}
                  placeholder="e.g. Atomic Habits"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 mb-1">
                  Author / Thinker:
                </label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="e.g. James Clear"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 mb-1">
                  Source Type:
                </label>
                <select
                  value={sourceType}
                  onChange={(e) => setSourceType(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Book">Book</option>
                  <option value="Article">Article</option>
                  <option value="Podcast">Podcast</option>
                  <option value="Mental Model">Mental Model</option>
                  <option value="Quote">Quote</option>
                  <option value="Original">Original Idea</option>
                </select>
              </div>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-600 dark:text-rose-400">
                {errorMsg}
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-md disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Extracting Bite-Sized Cards...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Synthesize Idea Cards</span>
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* Results View */
          <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <Check className="w-4 h-4" />
                  Successfully extracted {extractedIdeas.length} idea cards!
                </span>
                <p className="text-xs text-stone-500">
                  Review the cards below, pick a stash, and add them to your collection.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setExtractedIdeas(null)}
                className="flex items-center gap-1 text-xs text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Try another</span>
              </button>
            </div>

            {/* Target Stash Selection */}
            <div className="flex items-center gap-2 p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700">
              <span className="text-xs font-semibold text-stone-600 dark:text-stone-300">
                Save directly to Stash:
              </span>
              <select
                value={targetStashId}
                onChange={(e) => setTargetStashId(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-medium"
              >
                <option value="">General Feed only (No Stash)</option>
                {stashes.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.iconEmoji} {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Extracted Cards Preview List */}
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {extractedIdeas.map((idea, index) => (
                <div
                  key={idea.id || index}
                  className="rounded-2xl border border-stone-200 dark:border-stone-800 p-4 bg-stone-50/50 dark:bg-stone-800/30"
                >
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">
                    <span>{idea.sourceType}</span>
                    <span>·</span>
                    <span>{idea.sourceTitle}</span>
                  </div>
                  <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100 mb-1">
                    {idea.title}
                  </h4>
                  <p className="text-xs text-stone-600 dark:text-stone-300 mb-2 leading-relaxed">
                    {idea.body}
                  </p>
                  {idea.actionableTakeaway && (
                    <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-900/40 text-[11px] text-stone-700 dark:text-stone-300 mb-2">
                      <span className="font-semibold text-amber-700 dark:text-amber-400">Action: </span>
                      {idea.actionableTakeaway}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-1 text-[11px] text-stone-400">
                    {idea.tags.map((t) => (
                      <span key={t}>#{t}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Action Bar */}
            <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 dark:text-stone-400"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveAll}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all"
              >
                <Check className="w-4 h-4" />
                <span>Add {extractedIdeas.length} Cards to Stash</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
