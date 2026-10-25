import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Compass,
  Layers,
  Sparkles,
  Plus,
  Search,
  Filter,
  Check,
  Zap,
  BookOpen,
  ArrowUpDown,
  Smartphone,
  Quote,
} from 'lucide-react';
import { IdeaCard, Stash, UserStats } from './types';
import { INITIAL_IDEAS, INITIAL_STASHES } from './data/seedData';
import { useContinuousAudioPlayer } from './hooks/useContinuousAudioPlayer';
import { ContinuousAudioBar } from './components/ContinuousAudioBar';
import { Navbar } from './components/Navbar';
import { IdeaCardItem } from './components/IdeaCardItem';
import { FocusModeView } from './components/FocusModeView';
import { StashModal } from './components/StashModal';
import { StashManagerView } from './components/StashManagerView';
import { AIExtractorModal } from './components/AIExtractorModal';
import { CreateCardModal } from './components/CreateCardModal';
import { CardDetailModal } from './components/CardDetailModal';
import { DailyStreakBanner } from './components/DailyStreakBanner';
import { EbookUploadModal } from './components/EbookUploadModal';
import { InstallAppButton } from './components/InstallAppButton';
import { normalizeIdeaCard, normalizeIdeaCards } from './utils/ideaContent';

const TOPIC_FILTERS = [
  'All',
  'Productivity',
  'Mental Models',
  'Stoicism',
  'Wealth',
  'Psychology',
  'Health',
];

export default function App() {
  // Theme state
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('deepstash_theme');
      if (saved === 'dark' || saved === 'light') return saved;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('deepstash_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Ideas state (persisted to localStorage)
  const [ideas, setIdeas] = useState<IdeaCard[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('deepstash_ideas');
      if (saved) {
        try {
          return normalizeIdeaCards(JSON.parse(saved));
        } catch (e) {
          console.error(e);
        }
      }
    }
    return normalizeIdeaCards(INITIAL_IDEAS);
  });

  // Stashes state
  const [stashes, setStashes] = useState<Stash[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('deepstash_stashes');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error(e);
        }
      }
    }
    return INITIAL_STASHES;
  });

  // Liked ideas
  const [likedIdeaIds, setLikedIdeaIds] = useState<Set<string>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('deepstash_likes');
      if (saved) {
        try {
          return new Set(JSON.parse(saved));
        } catch (e) {
          console.error(e);
        }
      }
    }
    return new Set(['idea_1', 'idea_9']);
  });

  // User learning streak and stats
  const [userStats, setUserStats] = useState<UserStats>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('deepstash_stats');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error(e);
        }
      }
    }
    return {
      streakDays: 4,
      lastReadDate: new Date().toISOString().split('T')[0],
      readTodayCount: 2,
      dailyGoal: 5,
      totalSavedCount: 6,
    };
  });

  // Persist states
  useEffect(() => {
    localStorage.setItem('deepstash_ideas', JSON.stringify(ideas));
  }, [ideas]);

  useEffect(() => {
    localStorage.setItem('deepstash_stashes', JSON.stringify(stashes));
  }, [stashes]);

  useEffect(() => {
    localStorage.setItem('deepstash_likes', JSON.stringify(Array.from(likedIdeaIds)));
  }, [likedIdeaIds]);

  useEffect(() => {
    localStorage.setItem('deepstash_stats', JSON.stringify(userStats));
  }, [userStats]);

  // View & Filter states
  const [currentTab, setCurrentTab] = useState<'explore' | 'focus' | 'stashes'>('explore');
  const [selectedTopic, setSelectedTopic] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'trending' | 'newest' | 'likes'>('trending');
  const [activeStashId, setActiveStashId] = useState<string | null>(null);

  // Modals state
  const [selectedStashIdea, setSelectedStashIdea] = useState<IdeaCard | null>(null);
  const [activeDetailIdea, setActiveDetailIdea] = useState<IdeaCard | null>(null);
  const [isAIExtractorOpen, setIsAIExtractorOpen] = useState(false);
  const [isCreateCardOpen, setIsCreateCardOpen] = useState(false);
  const [isEbookModalOpen, setIsEbookModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);


  // All idea IDs present in any stash
  const stashedIdeaIds = useMemo(() => {
    const ids = new Set<string>();
    stashes.forEach((s) => {
      s.ideaIds.forEach((id) => ids.add(id));
    });
    return ids;
  }, [stashes]);

  // Spotlight idea
  const ideaOfTheDay = useMemo(() => {
    return ideas[0] || null;
  }, [ideas]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((cur) => (cur === msg ? null : cur));
    }, 2800);
  };

  // Like action
  const handleLike = useCallback((id: string) => {
    setLikedIdeaIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Stash toggle action
  const handleToggleStash = useCallback((stashId: string, ideaId: string) => {
    setStashes((prev) =>
      prev.map((stash) => {
        if (stash.id === stashId) {
          const has = stash.ideaIds.includes(ideaId);
          return {
            ...stash,
            ideaIds: has
              ? stash.ideaIds.filter((id) => id !== ideaId)
              : [...stash.ideaIds, ideaId],
          };
        }
        return stash;
      })
    );
  }, []);

  // Create new Stash
  const handleCreateStash = useCallback(
    (name: string, description: string, iconEmoji: string) => {
      const newStash: Stash = {
        id: `stash_${Date.now()}`,
        name,
        description: description || 'Personal curated ideas',
        iconEmoji: iconEmoji || '💡',
        themeColor: '#3B82F6',
        ideaIds: selectedStashIdea ? [selectedStashIdea.id] : [],
        isCustom: true,
        createdAt: new Date().toISOString(),
      };

      setStashes((prev) => [newStash, ...prev]);
      showToast(`Created stash "${name}"!`);
    },
    [selectedStashIdea]
  );

  // Delete custom Stash
  const handleDeleteCustomStash = useCallback((stashId: string) => {
    setStashes((prev) => prev.filter((s) => s.id !== stashId));
    setActiveStashId(null);
    showToast('Stash deleted.');
  }, []);


  // Share quote action
  const handleShare = useCallback((idea: IdeaCard) => {
    const text = `"${idea.title}"\n${idea.body}\n— ${idea.author} (${idea.sourceTitle})\nCurated on Deepstash`;
    navigator.clipboard.writeText(text);
    setCopiedId(idea.id);
    showToast('Quote copied to clipboard!');
    setTimeout(() => {
      setCopiedId((cur) => (cur === idea.id ? null : cur));
    }, 2000);
  }, []);

  // Add ideas extracted from AI
  const handleAddExtractedIdeas = useCallback(
    (newIdeas: IdeaCard[], targetStashId?: string) => {
      setIdeas((prev) => [...normalizeIdeaCards(newIdeas), ...prev]);

      if (targetStashId) {
        const idsToAdd = newIdeas.map((i) => i.id);
        setStashes((prev) =>
          prev.map((s) =>
            s.id === targetStashId
              ? { ...s, ideaIds: Array.from(new Set([...s.ideaIds, ...idsToAdd])) }
              : s
          )
        );
      }

      showToast(`Added ${newIdeas.length} idea cards to Deepstash!`);
    },
    []
  );

  // Add manually created idea
  const handleCreateCard = useCallback((newIdea: IdeaCard, targetStashId?: string) => {
    setIdeas((prev) => [normalizeIdeaCard(newIdea), ...prev]);
    if (targetStashId) {
      setStashes((prev) =>
        prev.map((s) =>
          s.id === targetStashId
            ? { ...s, ideaIds: [newIdea.id, ...s.ideaIds] }
            : s
        )
      );
    }
    showToast(`Published "${newIdea.title}"!`);
  }, []);

  // Add Ebook cards into dedicated new Stash
  const handleCreateStashWithIdeas = useCallback(
    (stashName: string, description: string, iconEmoji: string, newCards: IdeaCard[]) => {
      setIdeas((prev) => [...normalizeIdeaCards(newCards), ...prev]);

      const newStash: Stash = {
        id: `stash_ebook_${Date.now()}`,
        name: stashName,
        description,
        iconEmoji: iconEmoji || '📚',
        themeColor: '#6366F1',
        ideaIds: newCards.map((c) => c.id),
        isCustom: true,
        createdAt: new Date().toISOString(),
      };

      setStashes((prev) => [newStash, ...prev]);
      setActiveStashId(newStash.id);
      setCurrentTab('stashes');
      showToast(`Created Stash "${stashName}" with ${newCards.length} ideas! 📚`);
    },
    []
  );

  // Open detail modal and record read
  const handleOpenDetails = useCallback((idea: IdeaCard) => {
    setActiveDetailIdea(idea);
    setUserStats((prev) => ({
      ...prev,
      readTodayCount: Math.min(prev.dailyGoal, prev.readTodayCount + 1),
    }));
  }, []);

  // Filtered & Sorted ideas for explore feed
  const filteredIdeas = useMemo(() => {
    let result = [...ideas];

    // Topic Filter
    if (selectedTopic !== 'All') {
      result = result.filter(
        (i) =>
          i.tags.some((t) => t.toLowerCase() === selectedTopic.toLowerCase()) ||
          i.sourceType.toLowerCase() === selectedTopic.toLowerCase()
      );
    }

    // Active Tag Filter
    if (activeTag) {
      result = result.filter((i) =>
        i.tags.some((t) => t.toLowerCase() === activeTag.toLowerCase())
      );
    }

    // Search Query Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.body.toLowerCase().includes(q) ||
          i.author.toLowerCase().includes(q) ||
          i.sourceTitle.toLowerCase().includes(q) ||
          i.tags.some((t) => t.toLowerCase().includes(q.replace(/^#/, '')))
      );
    }

    // Sorting
    if (sortBy === 'newest') {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === 'likes') {
      result.sort((a, b) => b.likesCount - a.likesCount);
    }

    return result;
  }, [ideas, selectedTopic, activeTag, searchQuery, sortBy]);

  // Continuous 10-Post Audio Player Hook
  const handleCardRead = useCallback((card: IdeaCard) => {
    setUserStats((prev) => ({
      ...prev,
      readTodayCount: Math.min(prev.dailyGoal, prev.readTodayCount + 1),
    }));
  }, []);

  const handleBatchComplete = useCallback((count: number) => {
    showToast(`🎉 10-Post Playlist Finished! You read ${count} ideas.`);
  }, []);

  const audioPlayer = useContinuousAudioPlayer({
    onCardRead: handleCardRead,
    onBatchComplete: handleBatchComplete,
  });

  const isPlayingAudio = audioPlayer.isPlaying && !audioPlayer.isPaused;
  const currentAudioId = audioPlayer.currentIdea?.id || null;
  const audioRate = audioPlayer.rate;
  const changeAudioRate = audioPlayer.changeRate;

  // Audio toggle
  const handleToggleAudio = useCallback(
    (idea: IdeaCard) => {
      audioPlayer.playSingleCard(idea, filteredIdeas);
    },
    [audioPlayer, filteredIdeas]
  );

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 flex flex-col transition-colors selection:bg-blue-600 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl bg-stone-900 text-white dark:bg-white dark:text-stone-900 text-xs font-bold shadow-2xl animate-bounce">
          <Check className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navigation */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenAIExtractor={() => setIsAIExtractorOpen(true)}
        onOpenCreateCard={() => setIsCreateCardOpen(true)}
        onOpenEbookModal={() => setIsEbookModalOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        userStats={userStats}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* VIEW 1: FOCUS SNAP MODE (Stories / TikTok-style vertical view) */}
        {currentTab === 'focus' && (
          <FocusModeView
            ideas={filteredIdeas.length > 0 ? filteredIdeas : ideas}
            stashedIdeaIds={stashedIdeaIds}
            likedIdeaIds={likedIdeaIds}
            onLike={handleLike}
            onStash={(idea) => setSelectedStashIdea(idea)}
            onToggleAudio={handleToggleAudio}
            isPlayingAudio={isPlayingAudio}
            currentAudioId={currentAudioId}
            onClose={() => setCurrentTab('explore')}
            onShare={handleShare}
            copiedId={copiedId}
          />
        )}

        {/* VIEW 2: MY STASHES COLLECTIONS */}
        {currentTab === 'stashes' && (
          <StashManagerView
            stashes={stashes}
            ideas={ideas}
            activeStashId={activeStashId}
            onSelectStash={setActiveStashId}
            onOpenCreateStash={() => handleCreateStash('New Stash', '', '💡')}
            onDeleteCustomStash={handleDeleteCustomStash}
            stashedIdeaIds={stashedIdeaIds}
            likedIdeaIds={likedIdeaIds}
            onLike={handleLike}
            onStash={(idea) => setSelectedStashIdea(idea)}
            onToggleAudio={(idea, playlist) =>
              audioPlayer.playSingleCard(idea, playlist || filteredIdeas)
            }
            onStartAutoPlayStash={(stashIdeas) => {
              audioPlayer.startContinuousBatch(stashIdeas, 0, 10);
              showToast(`Started audio playlist for ${stashIdeas.length} book cards! 🎧`);
            }}
            isPlayingAudio={isPlayingAudio}
            currentAudioId={currentAudioId}
            onSelectTag={(tag) => {
              setActiveTag(tag);
              setCurrentTab('explore');
            }}
            onOpenDetails={handleOpenDetails}
            onShare={handleShare}
            copiedId={copiedId}
          />
        )}

        {/* VIEW 3: EXPLORE FEED (Editorial Grid & Filtering) */}
        {currentTab === 'explore' && (
          <div className="space-y-8">
            {/* Daily Streak & Spotlight Banner */}
            <DailyStreakBanner
              userStats={userStats}
              ideaOfTheDay={ideaOfTheDay}
              onOpenIdea={handleOpenDetails}
              onStartFocus={() => setCurrentTab('focus')}
              onStartAutoPlay10={() => {
                audioPlayer.startContinuousBatch(filteredIdeas, 0, 10);
                showToast('Started continuous 10-post auto-read session! 🎧');
              }}
            />

            {/* Filter Bar & Topic Segmented Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
              {/* Topic Filters */}
              <div className="flex items-center gap-1 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
                {TOPIC_FILTERS.map((topic) => (
                  <button
                    key={topic}
                    type="button"
                    onClick={() => {
                      setSelectedTopic(topic);
                      setActiveTag(null);
                    }}
                    className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-all ${
                      selectedTopic === topic && !activeTag
                        ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 shadow-xs'
                        : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-900'
                    }`}
                  >
                    {topic}
                  </button>
                ))}
              </div>

              {/* Tag reset & Sort Controls */}
              <div className="flex items-center gap-2 text-xs">
                {activeTag && (
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold border border-blue-200 dark:border-blue-800">
                    <span>#{activeTag}</span>
                    <button
                      type="button"
                      onClick={() => setActiveTag(null)}
                      className="hover:opacity-75 font-bold"
                    >
                      ×
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-1 p-1 bg-stone-100 dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800">
                  <button
                    type="button"
                    onClick={() => setSortBy('trending')}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                      sortBy === 'trending'
                        ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-xs'
                        : 'text-stone-500'
                    }`}
                  >
                    Trending
                  </button>
                  <button
                    type="button"
                    onClick={() => setSortBy('newest')}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                      sortBy === 'newest'
                        ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-xs'
                        : 'text-stone-500'
                    }`}
                  >
                    Newest
                  </button>
                  <button
                    type="button"
                    onClick={() => setSortBy('likes')}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                      sortBy === 'likes'
                        ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-xs'
                        : 'text-stone-500'
                    }`}
                  >
                    Most Liked
                  </button>
                </div>
              </div>
            </div>

            {/* Ideas Grid */}
            {filteredIdeas.length === 0 ? (
              <div className="p-16 text-center rounded-3xl border border-dashed border-stone-300 dark:border-stone-800 bg-white/50 dark:bg-stone-900/40">
                <Search className="w-10 h-10 text-stone-400 mx-auto mb-3" />
                <h3 className="text-base font-bold text-stone-800 dark:text-stone-200 mb-1">
                  No ideas match your filter
                </h3>
                <p className="text-xs text-stone-500 mb-4 max-w-sm mx-auto">
                  Try adjusting your search query, or use the AI Extractor to turn any article into cards.
                </p>
                <div className="flex justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedTopic('All');
                      setActiveTag(null);
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300"
                  >
                    Reset Filters
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAIExtractorOpen(true)}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white"
                  >
                    Extract with AI
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredIdeas.map((idea) => (
                  <IdeaCardItem
                    key={idea.id}
                    idea={idea}
                    isStashed={stashedIdeaIds.has(idea.id)}
                    isLiked={likedIdeaIds.has(idea.id)}
                    isPlayingAudio={isPlayingAudio && currentAudioId === idea.id}
                    onLike={handleLike}
                    onStash={(i) => setSelectedStashIdea(i)}
                    onToggleAudio={handleToggleAudio}
                    onSelectTag={(tag) => setActiveTag(tag)}
                    onOpenDetails={handleOpenDetails}
                    onShare={handleShare}
                    copiedId={copiedId}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-stone-200 dark:border-stone-800 py-8 text-center text-xs text-stone-500 dark:text-stone-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-stone-800 dark:text-stone-200">Deepstash</span>
            <span aria-hidden="true">·</span>
            <span>Micro-Learning & Idea Curation</span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <button
              type="button"
              onClick={() => setIsAIExtractorOpen(true)}
              className="hover:text-blue-600 transition-colors"
            >
              AI Extractor
            </button>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => setCurrentTab('focus')}
              className="hover:text-blue-600 transition-colors"
            >
              Focus Mode
            </button>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => setCurrentTab('stashes')}
              className="hover:text-blue-600 transition-colors"
            >
              My Stashes
            </button>
          </div>
        </div>
      </footer>

      {/* MODALS */}
      {selectedStashIdea && (
        <StashModal
          idea={selectedStashIdea}
          stashes={stashes}
          onClose={() => setSelectedStashIdea(null)}
          onToggleStash={handleToggleStash}
          onCreateStash={handleCreateStash}
        />
      )}

      {isAIExtractorOpen && (
        <AIExtractorModal
          onClose={() => setIsAIExtractorOpen(false)}
          onAddExtractedIdeas={handleAddExtractedIdeas}
          stashes={stashes}
        />
      )}

      {isCreateCardOpen && (
        <CreateCardModal
          onClose={() => setIsCreateCardOpen(false)}
          onCreateCard={handleCreateCard}
          stashes={stashes}
        />
      )}

      {isEbookModalOpen && (
        <EbookUploadModal
          onClose={() => setIsEbookModalOpen(false)}
          onAddExtractedIdeas={handleAddExtractedIdeas}
          onCreateStashWithIdeas={handleCreateStashWithIdeas}
          onStartAutoPlay={(cards) => {
            audioPlayer.startContinuousBatch(cards, 0, 10);
            showToast(`Started continuous voice playlist for ${cards.length} book cards! 🎧`);
          }}
          onPreviewCardAudio={(card) => audioPlayer.playSingleCard(card)}
          voiceMode={audioPlayer.voiceMode}
          onSelectVoiceMode={audioPlayer.setVoiceMode}
          stashes={stashes}
        />
      )}

      {activeDetailIdea && (
        <CardDetailModal
          idea={activeDetailIdea}
          isStashed={stashedIdeaIds.has(activeDetailIdea.id)}
          isLiked={likedIdeaIds.has(activeDetailIdea.id)}
          isPlayingAudio={isPlayingAudio && currentAudioId === activeDetailIdea.id}
          audioRate={audioRate}
          onChangeAudioRate={changeAudioRate}
          voiceMode={audioPlayer.voiceMode}
          onSelectVoiceMode={audioPlayer.setVoiceMode}
          onLike={handleLike}
          onStash={(i) => setSelectedStashIdea(i)}
          onToggleAudio={handleToggleAudio}
          onClose={() => setActiveDetailIdea(null)}
          onShare={handleShare}
          copiedId={copiedId}
          onSelectTag={(tag) => {
            setActiveTag(tag);
            setCurrentTab('explore');
          }}
        />
      )}

      {/* Persistent Continuous Audio Player Bar */}
      <ContinuousAudioBar
        currentIdea={audioPlayer.currentIdea}
        isPlaying={audioPlayer.isPlaying}
        isPaused={audioPlayer.isPaused}
        isLoadingAudio={audioPlayer.isLoadingAudio}
        isAutoPlayActive={audioPlayer.isAutoPlayActive}
        currentBatchIndex={audioPlayer.currentBatchIndex}
        batchLimit={audioPlayer.batchLimit}
        isBatchFinished={audioPlayer.isBatchFinished}
        voiceMode={audioPlayer.voiceMode}
        onSelectVoiceMode={audioPlayer.setVoiceMode}
        activeVoiceLabel={audioPlayer.activeVoiceLabel}
        isStudioAudioActive={audioPlayer.isStudioAudioActive}
        availableVoices={audioPlayer.availableVoices}
        selectedBrowserVoiceId={audioPlayer.selectedBrowserVoiceId}
        onSelectBrowserVoiceId={audioPlayer.setSelectedBrowserVoiceId}
        rate={audioPlayer.rate}
        onChangeRate={audioPlayer.changeRate}
        autoScroll={audioPlayer.autoScroll}
        onToggleAutoScroll={() => audioPlayer.setAutoScroll(!audioPlayer.autoScroll)}
        onPause={audioPlayer.pause}
        onResume={audioPlayer.resume}
        onStop={audioPlayer.stop}
        onNext={audioPlayer.nextInBatch}
        onPrev={audioPlayer.prevInBatch}
        onContinueNext10={() => audioPlayer.continueNextBatch(filteredIdeas)}
      />
      <InstallAppButton />
    </div>
  );
}
