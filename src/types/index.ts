export type SourceType = 'Book' | 'Article' | 'Podcast' | 'Mental Model' | 'Quote' | 'Original';

export interface IdeaCard {
  id: string;
  title: string;
  body: string;
  actionableTakeaway?: string;
  sourceType: SourceType;
  sourceTitle: string;
  author: string;
  tags: string[];
  likesCount: number;
  readTime: string; // e.g. "1 min read"
  createdAt: string;
  isLiked?: boolean;
  isBookmarked?: boolean;
  stashIds?: string[];
}

export interface Stash {
  id: string;
  name: string;
  description: string;
  iconEmoji: string;
  themeColor: string;
  ideaIds: string[];
  isCustom?: boolean;
  createdAt: string;
}

export interface UserStats {
  streakDays: number;
  lastReadDate: string;
  readTodayCount: number;
  dailyGoal: number;
  totalSavedCount: number;
}
