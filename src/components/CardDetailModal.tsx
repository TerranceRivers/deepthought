import { X, Volume2, VolumeX, Bookmark, Heart, Share2, Sparkles, Check, BookOpen, Quote } from 'lucide-react';
import { IdeaCard } from '../types';
import { VoiceMode } from '../hooks/useContinuousAudioPlayer';

interface CardDetailModalProps {
  idea: IdeaCard | null;
  isStashed: boolean;
  isLiked: boolean;
  isPlayingAudio: boolean;
  audioRate: number;
  onChangeAudioRate: (rate: number) => void;
  voiceMode?: VoiceMode;
  onSelectVoiceMode?: (mode: VoiceMode) => void;
  onLike: (id: string) => void;
  onStash: (idea: IdeaCard) => void;
  onToggleAudio: (idea: IdeaCard) => void;
  onClose: () => void;
  onShare: (idea: IdeaCard) => void;
  copiedId: string | null;
  onSelectTag?: (tag: string) => void;
}

export const CardDetailModal: React.FC<CardDetailModalProps> = ({
  idea,
  isStashed,
  isLiked,
  isPlayingAudio,
  audioRate,
  onChangeAudioRate,
  voiceMode,
  onSelectVoiceMode,
  onLike,
  onStash,
  onToggleAudio,
  onClose,
  onShare,
  copiedId,
  onSelectTag,
}) => {
  if (!idea) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 sm:p-8 shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Kicker */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
          <div className="flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase text-stone-500 dark:text-stone-400">
            <span className="text-blue-600 dark:text-blue-400">{idea.sourceType}</span>
            <span aria-hidden="true" className="text-stone-300 dark:text-stone-700">·</span>
            <span>{idea.sourceTitle}</span>
            {idea.author && (
              <>
                <span aria-hidden="true" className="text-stone-300 dark:text-stone-700">·</span>
                <span className="text-stone-800 dark:text-stone-200">{idea.author}</span>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Big Title */}
        <div className="mt-4 mb-4">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-900 dark:text-stone-100 leading-snug">
            {idea.title}
          </h2>
        </div>

        {/* Audio Player Controls Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-800 mb-6">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onToggleAudio(idea)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                isPlayingAudio
                  ? 'bg-amber-500 text-white shadow-sm animate-pulse'
                  : 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 hover:opacity-90'
              }`}
            >
              {isPlayingAudio ? (
                <>
                  <VolumeX className="w-4 h-4" />
                  <span>Pause Narration</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4" />
                  <span>Listen to Idea</span>
                </>
              )}
            </button>

            {/* Voice Mode Selector */}
            {voiceMode && onSelectVoiceMode && (
              <select
                value={voiceMode}
                onChange={(e) => onSelectVoiceMode(e.target.value as VoiceMode)}
                className="px-2.5 py-1 text-xs rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200 font-medium"
              >
                <optgroup label="Studio AI Voices">
                  <option value="studio-kore">🎙️ Kore (Warm Female)</option>
                  <option value="studio-puck">🎙️ Puck (Conversational Male)</option>
                  <option value="studio-fenrir">🎙️ Fenrir (Deep Male)</option>
                  <option value="studio-charon">🎙️ Charon (Broadcast Male)</option>
                  <option value="studio-zephyr">🎙️ Zephyr (Modern Female)</option>
                </optgroup>
              </select>
            )}
          </div>

          {/* Speed Selector */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-stone-400 mr-1 text-[11px]">Speed:</span>
            {[0.9, 1.0, 1.25, 1.5].map((speed) => (
              <button
                key={speed}
                type="button"
                onClick={() => onChangeAudioRate(speed)}
                className={`px-2 py-1 rounded-lg font-semibold transition-colors ${
                  audioRate === speed
                    ? 'bg-blue-600 text-white'
                    : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>

        {/* Main Body */}
        <div className="mb-6 space-y-2">
          <p className="text-base sm:text-lg leading-relaxed text-stone-700 dark:text-stone-200 font-normal whitespace-pre-line">
            {idea.body}
          </p>
          <div className="text-[11px] font-semibold text-stone-400 dark:text-stone-500 pt-1">
            {idea.body.length} characters · ~{Math.max(1, Math.round(idea.body.length / 450))} min read
          </div>
        </div>

        {/* Actionable Takeaway banner */}
        {idea.actionableTakeaway && (
          <div className="mb-6 rounded-2xl bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/40 p-4 text-xs sm:text-sm text-stone-800 dark:text-stone-200 leading-relaxed">
            <div className="font-semibold text-xs uppercase tracking-wider text-amber-700 dark:text-amber-400 mb-1.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span>Actionable Takeaway</span>
            </div>
            <p>{idea.actionableTakeaway}</p>
          </div>
        )}

        {/* Tags */}
        <div className="flex flex-wrap items-center gap-2 mb-6 text-xs">
          {idea.tags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => {
                onSelectTag?.(tag);
                onClose();
              }}
              className="px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 font-medium hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
            >
              #{tag}
            </button>
          ))}
          <span className="text-stone-400 text-xs ml-auto">{idea.readTime}</span>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onLike(idea.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                isLiked
                  ? 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40'
                  : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-rose-600 dark:fill-rose-400' : ''}`} />
              <span>{idea.likesCount + (isLiked ? 1 : 0)} Likes</span>
            </button>

            <button
              type="button"
              onClick={() => onShare(idea)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              {copiedId === idea.id ? (
                <Check className="w-4 h-4 text-emerald-600" />
              ) : (
                <Share2 className="w-4 h-4" />
              )}
              <span>{copiedId === idea.id ? 'Copied' : 'Share Quote'}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => onStash(idea)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm ${
              isStashed
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-stone-900 text-white hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-200'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${isStashed ? 'fill-current' : ''}`} />
            <span>{isStashed ? 'Stashed' : 'Stash Idea'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
