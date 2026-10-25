import React from 'react';
import {
  Compass,
  Layers,
  Sparkles,
  Plus,
  Search,
  Flame,
  Sun,
  Moon,
  Smartphone,
  X,
  BookMarked,
} from 'lucide-react';
import { UserStats } from '../types';

interface NavbarProps {
  currentTab: 'explore' | 'focus' | 'stashes';
  onSelectTab: (tab: 'explore' | 'focus' | 'stashes') => void;
  onOpenAIExtractor: () => void;
  onOpenCreateCard: () => void;
  onOpenEbookModal: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  userStats: UserStats;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  onOpenAIExtractor,
  onOpenCreateCard,
  onOpenEbookModal,
  searchQuery,
  onSearchChange,
  userStats,
  theme,
  onToggleTheme,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-stone-200 dark:border-stone-800 bg-white/90 dark:bg-stone-950/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => onSelectTab('explore')}
              className="flex items-center gap-2.5 group text-left cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-extrabold text-lg shadow-sm group-hover:scale-105 transition-transform">
                <BookMarked className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-lg tracking-tight text-stone-950 dark:text-stone-50 leading-none">
                  Deepstash
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest text-stone-400 dark:text-stone-500">
                  Micro-Learning
                </span>
              </div>
            </button>

            {/* Navigation Tabs (Functional segmented controls with active/inactive state) */}
            <nav className="hidden md:flex items-center p-1 bg-stone-100 dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800">
              <button
                type="button"
                onClick={() => onSelectTab('explore')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  currentTab === 'explore'
                    ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Explore Feed</span>
              </button>

              <button
                type="button"
                onClick={() => onSelectTab('focus')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  currentTab === 'focus'
                    ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Focus Snap</span>
              </button>

              <button
                type="button"
                onClick={() => onSelectTab('stashes')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  currentTab === 'stashes'
                    ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>My Stashes</span>
              </button>
            </nav>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-xs lg:max-w-md hidden sm:block">
            <div className="relative">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search ideas, books, thinkers (#habits)..."
                className="w-full pl-9 pr-8 py-1.5 text-xs rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Action Buttons & Progress */}
          <div className="flex items-center gap-2">
            {/* Daily Streak Indicator */}
            <div
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900/40 text-amber-800 dark:text-amber-300 text-xs font-bold"
              title={`${userStats.readTodayCount} of ${userStats.dailyGoal} ideas read today`}
            >
              <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
              <span className="hidden xs:inline">{userStats.streakDays}d</span>
              <span className="text-[11px] font-normal text-amber-700/80 dark:text-amber-400/80">
                ({userStats.readTodayCount}/{userStats.dailyGoal})
              </span>
            </div>

            {/* AI Extract Button */}
            <button
              type="button"
              onClick={onOpenAIExtractor}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:hover:bg-blue-900 dark:text-blue-300 border border-blue-200 dark:border-blue-800 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span className="hidden sm:inline">AI Extract</span>
            </button>

            {/* Upload Ebook Button */}
            <button
              type="button"
              onClick={onOpenEbookModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:hover:bg-indigo-900 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 transition-colors"
            >
              <BookMarked className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span className="hidden sm:inline">Upload Ebook</span>
            </button>

            {/* Create Card Button */}
            <button
              type="button"
              onClick={onOpenCreateCard}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 hover:opacity-90 transition-opacity"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Card</span>
            </button>

            {/* Theme Toggle */}
            <button
              type="button"
              onClick={onToggleTheme}
              className="p-2 rounded-xl text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-900 transition-colors"
              aria-label="Toggle color theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-stone-100 dark:border-stone-900">
          <button
            type="button"
            onClick={() => onSelectTab('explore')}
            className={`flex items-center gap-1 py-1 text-xs font-semibold ${
              currentTab === 'explore'
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-stone-500'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Explore</span>
          </button>
          <button
            type="button"
            onClick={() => onSelectTab('focus')}
            className={`flex items-center gap-1 py-1 text-xs font-semibold ${
              currentTab === 'focus'
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-stone-500'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Focus Snap</span>
          </button>
          <button
            type="button"
            onClick={() => onSelectTab('stashes')}
            className={`flex items-center gap-1 py-1 text-xs font-semibold ${
              currentTab === 'stashes'
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-stone-500'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>My Stashes</span>
          </button>
        </div>
      </div>
    </header>
  );
};
