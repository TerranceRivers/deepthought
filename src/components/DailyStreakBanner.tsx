import React from 'react';
import { Sparkles, Flame, ArrowRight, Zap, Target, Headphones } from 'lucide-react';
import { IdeaCard, UserStats } from '../types';

interface DailyStreakBannerProps {
  userStats: UserStats;
  ideaOfTheDay: IdeaCard | null;
  onOpenIdea: (idea: IdeaCard) => void;
  onStartFocus: () => void;
  onStartAutoPlay10?: () => void;
}

export const DailyStreakBanner: React.FC<DailyStreakBannerProps> = ({
  userStats,
  ideaOfTheDay,
  onOpenIdea,
  onStartFocus,
  onStartAutoPlay10,
}) => {
  const isGoalMet = userStats.readTodayCount >= userStats.dailyGoal;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-stone-200 dark:border-stone-800 bg-gradient-to-r from-stone-900 to-stone-800 dark:from-stone-900 dark:to-stone-950 text-white p-6 sm:p-8 shadow-md">
      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="max-w-xl">
          <div className="flex items-center gap-2 mb-2 text-xs font-bold tracking-wider uppercase text-amber-400">
            <Flame className="w-4 h-4 fill-amber-400" />
            <span>Daily Micro-Learning Streak · {userStats.streakDays} Days</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight mb-2">
            {isGoalMet ? 'Daily Goal Completed! 🎉' : `Read 5 ideas today to build compounding wisdom.`}
          </h2>

          <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
            {ideaOfTheDay ? (
              <>
                <span className="font-semibold text-white">Today's Spotlight: </span>
                "{ideaOfTheDay.title}" by {ideaOfTheDay.author} ({ideaOfTheDay.sourceTitle})
              </>
            ) : (
              'Bite-sized ideas take 1 minute to absorb, but change how you think for a lifetime.'
            )}
          </p>

          {/* Progress bar */}
          <div className="mt-4 flex items-center gap-3">
            <div className="flex-1 max-w-xs h-2 bg-stone-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-400 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, (userStats.readTodayCount / userStats.dailyGoal) * 100)}%`,
                }}
              />
            </div>
            <span className="text-xs text-stone-300 font-semibold">
              {userStats.readTodayCount} / {userStats.dailyGoal} read
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {onStartAutoPlay10 && (
            <button
              type="button"
              onClick={onStartAutoPlay10}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-stone-950 transition-all shadow-md"
            >
              <Headphones className="w-4 h-4 fill-stone-950" />
              <span>Auto-Play 10 Posts</span>
            </button>
          )}

          {ideaOfTheDay && (
            <button
              type="button"
              onClick={() => onOpenIdea(ideaOfTheDay)}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all"
            >
              Spotlight
            </button>
          )}

          <button
            type="button"
            onClick={onStartFocus}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-md"
          >
            <Zap className="w-4 h-4 fill-white" />
            <span>Focus Snap</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
