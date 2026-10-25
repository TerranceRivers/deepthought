import { useState, useEffect, useRef, useCallback } from 'react';
import { IdeaCard } from '../types';

export type VoiceMode = 'studio-kore' | 'studio-puck' | 'studio-fenrir';

interface UseContinuousAudioPlayerOptions {
  onCardRead?: (card: IdeaCard) => void;
  onBatchComplete?: (count: number) => void;
}

export function useContinuousAudioPlayer(options?: UseContinuousAudioPlayerOptions) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [currentIdea, setCurrentIdea] = useState<IdeaCard | null>(null);
  
  // Continuous 10-Post Batch State
  const [isAutoPlayActive, setIsAutoPlayActive] = useState(false);
  const [batchQueue, setBatchQueue] = useState<IdeaCard[]>([]);
  const [currentBatchIndex, setCurrentBatchIndex] = useState(0);
  const [batchLimit, setBatchLimit] = useState(10);
  const [isBatchFinished, setIsBatchFinished] = useState(false);

  // Settings
  const [voiceMode, setVoiceMode] = useState<VoiceMode>('studio-kore');
  const [rate, setRate] = useState<number>(1.0);
  const [autoScroll, setAutoScroll] = useState<boolean>(true);

  // Audio elements & synthesis refs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const audioCacheRef = useRef<Map<string, string>>(new Map());
  const prefetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  // Format clean, human-like speech text with conversational cadence
  const prepareSpeechText = useCallback((idea: IdeaCard) => {
    const authorLine = idea.author ? `by ${idea.author}, from ${idea.sourceTitle}.` : `from ${idea.sourceTitle}.`;
    const takeawayLine = idea.actionableTakeaway ? `Actionable takeaway: ${idea.actionableTakeaway}` : '';
    return `${idea.title}. ${authorLine} ${idea.body}. ${takeawayLine}`;
  }, []);

  // Fallback to Web Speech API with highest-quality natural human voice
  const playWebSpeechFallback = useCallback(
    (idea: IdeaCard, onEndedCallback: () => void) => {
      if (!synthRef.current) return;
      synthRef.current.cancel();

      const text = prepareSpeechText(idea);
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = rate * 0.96; // slightly relaxed for natural breathing pace
      utterance.pitch = 1.0;

      const voices = synthRef.current.getVoices();
      // Look for known high-quality natural voices first (Google US English, Samantha, Alex, Karen, Natural)
      const naturalVoice = voices.find(
        (v) =>
          (v.name.includes('Natural') ||
            v.name.includes('Google') ||
            v.name.includes('Samantha') ||
            v.name.includes('Karen') ||
            v.name.includes('Alex') ||
            v.name.includes('Daniel') ||
            v.name.includes('Enhanced')) &&
          v.lang.startsWith('en')
      ) || voices.find((v) => v.lang.startsWith('en'));

      if (naturalVoice) {
        utterance.voice = naturalVoice;
      }

      utterance.onstart = () => {
        setIsLoadingAudio(false);
        setIsPlaying(true);
        setIsPaused(false);
      };

      utterance.onend = () => {
        onEndedCallback();
      };

      utterance.onerror = (e) => {
        console.warn('SpeechSynthesis error:', e);
        setIsPlaying(false);
        setIsLoadingAudio(false);
      };

      synthRef.current.speak(utterance);
    },
    [prepareSpeechText, rate]
  );

  // Stop any active audio
  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    setIsPlaying(false);
    setIsPaused(false);
    setIsLoadingAudio(false);
    setCurrentIdea(null);
    setIsAutoPlayActive(false);
    setBatchQueue([]);
  }, []);

  // Pause playback
  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if (synthRef.current && isPlaying) {
      synthRef.current.pause();
    }
    setIsPaused(true);
  }, [isPlaying]);

  // Resume playback
  const resume = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.play();
      setIsPaused(false);
    } else if (synthRef.current && isPaused) {
      synthRef.current.resume();
      setIsPaused(false);
    }
  }, [isPaused]);

  // Main playback engine for an idea card
  const playCardInternal = useCallback(
    async (
      idea: IdeaCard,
      onCardFinished: () => void
    ) => {
      // Cancel any ongoing audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }

      setCurrentIdea(idea);
      setIsLoadingAudio(true);
      setIsPaused(false);

      // Notify consumer that this card is being read (increments daily progress)
      options?.onCardRead?.(idea);

      // Auto-scroll into view if desired
      if (autoScroll && typeof document !== 'undefined') {
        const el = document.getElementById(`idea-card-${idea.id}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }

      // Check cache for this idea's studio voice
      const voiceNameMap: Record<VoiceMode, string> = {
        'studio-kore': 'Kore',
        'studio-puck': 'Puck',
        'studio-fenrir': 'Fenrir',
      };
      const selectedVoiceName = voiceNameMap[voiceMode];
      const cacheKey = `${idea.id}_${selectedVoiceName}`;

      let base64Audio = audioCacheRef.current.get(cacheKey);

      if (!base64Audio) {
        try {
          const res = await fetch('/api/tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: prepareSpeechText(idea),
              voiceName: selectedVoiceName,
              style: 'Warm, natural, engaging conversational narrator with articulate pacing',
            }),
          });

          if (res.ok) {
            const data = await res.json();
            if (data.audioBase64 && typeof data.audioBase64 === 'string') {
              base64Audio = data.audioBase64;
              audioCacheRef.current.set(cacheKey, data.audioBase64);
            }
          }
        } catch (err) {
          console.warn('Studio TTS fetch failed, switching to natural client voice:', err);
        }
      }

      // If Studio Audio is available, play via HTML5 Audio
      if (base64Audio) {
        try {
          const audio = new Audio(`data:audio/wav;base64,${base64Audio}`);
          audio.playbackRate = rate;
          audioRef.current = audio;

          audio.oncanplaythrough = () => {
            setIsLoadingAudio(false);
            setIsPlaying(true);
          };

          audio.onended = () => {
            onCardFinished();
          };

          audio.onerror = () => {
            console.warn('Audio playback error, falling back to speech synthesis');
            playWebSpeechFallback(idea, onCardFinished);
          };

          await audio.play();
          return;
        } catch (e) {
          console.warn('Audio play() threw:', e);
        }
      }

      // Fallback if studio TTS failed or was unavailable
      playWebSpeechFallback(idea, onCardFinished);
    },
    [autoScroll, voiceMode, rate, prepareSpeechText, playWebSpeechFallback, options]
  );

  // Continuous auto-play loop handler
  const handleCardFinished = useCallback(() => {
    // If not in auto-play batch, stop here
    if (!isAutoPlayActive) {
      setIsPlaying(false);
      setCurrentIdea(null);
      return;
    }

    const nextIndex = currentBatchIndex + 1;

    // Check if we reached the 10-post limit or the end of queue
    if (nextIndex >= batchLimit || nextIndex >= batchQueue.length) {
      // Reached 10 posts! Pause auto-play and prompt user
      setIsPlaying(false);
      setIsPaused(false);
      setIsBatchFinished(true);
      options?.onBatchComplete?.(Math.min(batchLimit, batchQueue.length));
      return;
    }

    // Continue to next post in sequence!
    setCurrentBatchIndex(nextIndex);
    const nextIdea = batchQueue[nextIndex];
    if (nextIdea) {
      playCardInternal(nextIdea, handleCardFinished);
    }
  }, [isAutoPlayActive, currentBatchIndex, batchLimit, batchQueue, options, playCardInternal]);

  // Start continuous 10-post batch from an index
  const startContinuousBatch = useCallback(
    (allIdeas: IdeaCard[], startIndex: number = 0, batchSize: number = 10) => {
      if (allIdeas.length === 0) return;

      const safeStartIndex = Math.max(0, Math.min(startIndex, allIdeas.length - 1));
      // Extract up to 10 consecutive posts (wrapping around if needed)
      let selectedPosts = allIdeas.slice(safeStartIndex, safeStartIndex + batchSize);
      if (selectedPosts.length < batchSize && allIdeas.length > selectedPosts.length) {
        const remainingNeeded = batchSize - selectedPosts.length;
        selectedPosts = [...selectedPosts, ...allIdeas.slice(0, remainingNeeded)];
      }

      setBatchQueue(selectedPosts);
      setCurrentBatchIndex(0);
      setBatchLimit(selectedPosts.length);
      setIsAutoPlayActive(true);
      setIsBatchFinished(false);

      const firstCard = selectedPosts[0];
      playCardInternal(firstCard, handleCardFinished);
    },
    [playCardInternal, handleCardFinished]
  );

  // Play single card (with option to initiate continuous from it)
  const playSingleCard = useCallback(
    (idea: IdeaCard, allIdeas?: IdeaCard[]) => {
      // If already playing this idea, toggle pause/play
      if (isPlaying && currentIdea?.id === idea.id) {
        if (isPaused) {
          resume();
        } else {
          pause();
        }
        return;
      }

      if (allIdeas && allIdeas.length > 0) {
        const idx = allIdeas.findIndex((i) => i.id === idea.id);
        startContinuousBatch(allIdeas, idx >= 0 ? idx : 0, 10);
      } else {
        setIsAutoPlayActive(false);
        setIsBatchFinished(false);
        playCardInternal(idea, () => {
          setIsPlaying(false);
          setCurrentIdea(null);
        });
      }
    },
    [isPlaying, currentIdea, isPaused, resume, pause, startContinuousBatch, playCardInternal]
  );

  // Continue to the next 10 posts after batch completion
  const continueNextBatch = useCallback(
    (allIdeas: IdeaCard[]) => {
      if (!currentIdea || allIdeas.length === 0) {
        startContinuousBatch(allIdeas, 0, 10);
        return;
      }
      const lastIndex = allIdeas.findIndex((i) => i.id === currentIdea.id);
      const nextStartIndex = (lastIndex + 1) % allIdeas.length;
      startContinuousBatch(allIdeas, nextStartIndex, 10);
    },
    [currentIdea, startContinuousBatch]
  );

  // Next card in current batch
  const nextInBatch = useCallback(() => {
    if (batchQueue.length === 0) return;
    const nextIdx = (currentBatchIndex + 1) % batchQueue.length;
    setCurrentBatchIndex(nextIdx);
    playCardInternal(batchQueue[nextIdx], handleCardFinished);
  }, [batchQueue, currentBatchIndex, playCardInternal, handleCardFinished]);

  // Previous card in current batch
  const prevInBatch = useCallback(() => {
    if (batchQueue.length === 0) return;
    const prevIdx = (currentBatchIndex - 1 + batchQueue.length) % batchQueue.length;
    setCurrentBatchIndex(prevIdx);
    playCardInternal(batchQueue[prevIdx], handleCardFinished);
  }, [batchQueue, currentBatchIndex, playCardInternal, handleCardFinished]);

  // Change speed
  const changeRate = (newRate: number) => {
    setRate(newRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = newRate;
    }
  };

  return {
    isPlaying,
    isPaused,
    isLoadingAudio,
    currentIdea,
    isAutoPlayActive,
    currentBatchIndex,
    batchLimit,
    batchQueue,
    isBatchFinished,
    voiceMode,
    setVoiceMode,
    rate,
    changeRate,
    autoScroll,
    setAutoScroll,
    playSingleCard,
    startContinuousBatch,
    continueNextBatch,
    pause,
    resume,
    stop,
    nextInBatch,
    prevInBatch,
  };
}
