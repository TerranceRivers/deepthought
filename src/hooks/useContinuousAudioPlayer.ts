import { useState, useEffect, useRef, useCallback } from 'react';
import { IdeaCard } from '../types';
import {
  ensureVoicesLoaded,
  getCuratedNaturalVoices,
  findBestNaturalVoice,
  formatSpeechTextForNaturalCadence,
  startSpeechKeepAlive,
  stopSpeechKeepAlive,
  AvailableVoice,
} from '../utils/naturalSpeech';

export type VoiceMode =
  | 'studio-kore'
  | 'studio-puck'
  | 'studio-fenrir'
  | 'studio-charon'
  | 'studio-zephyr'
  | 'browser-natural';

interface UseContinuousAudioPlayerOptions {
  onCardRead?: (card: IdeaCard) => void;
  onBatchComplete?: (count: number) => void;
}

export function useContinuousAudioPlayer(options?: UseContinuousAudioPlayerOptions) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [currentIdea, setCurrentIdea] = useState<IdeaCard | null>(null);
  const [activeVoiceLabel, setActiveVoiceLabel] = useState<string>('Studio Voice (AI)');
  const [isStudioAudioActive, setIsStudioAudioActive] = useState<boolean>(false);
  
  // Continuous 10-Post Batch State
  const [isAutoPlayActive, setIsAutoPlayActive] = useState(false);
  const [batchQueue, setBatchQueue] = useState<IdeaCard[]>([]);
  const [currentBatchIndex, setCurrentBatchIndex] = useState(0);
  const [batchLimit, setBatchLimit] = useState(10);
  const [isBatchFinished, setIsBatchFinished] = useState(false);

  // Settings & Voices
  const [voiceMode, setVoiceMode] = useState<VoiceMode>('studio-kore');
  const [selectedBrowserVoiceId, setSelectedBrowserVoiceId] = useState<string | null>(null);
  const [availableVoices, setAvailableVoices] = useState<AvailableVoice[]>([]);
  const [rate, setRate] = useState<number>(1.0);
  const [autoScroll, setAutoScroll] = useState<boolean>(true);

  // Audio elements & synthesis refs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const audioCacheRef = useRef<Map<string, string>>(new Map());

  // Load natural browser voices on mount
  useEffect(() => {
    let isMounted = true;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }

    ensureVoicesLoaded().then(() => {
      if (!isMounted) return;
      getCuratedNaturalVoices().then((curated) => {
        if (isMounted) {
          setAvailableVoices(curated);
          if (curated.length > 0 && !selectedBrowserVoiceId) {
            setSelectedBrowserVoiceId(curated[0].id);
          }
        }
      });
    });

    return () => {
      isMounted = false;
      stopSpeechKeepAlive();
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
    return formatSpeechTextForNaturalCadence(
      idea.title,
      idea.body,
      idea.actionableTakeaway,
      idea.author,
      idea.sourceTitle
    );
  }, []);

  // Web Speech playback with guaranteed high-quality natural human voice
  const playWebSpeechFallback = useCallback(
    async (idea: IdeaCard, onEndedCallback: () => void) => {
      if (!synthRef.current) return;
      synthRef.current.cancel();
      stopSpeechKeepAlive();

      const text = prepareSpeechText(idea);
      const utterance = new SpeechSynthesisUtterance(text);
      // Relaxed, human conversation pace
      utterance.rate = Math.max(0.75, Math.min(1.5, rate * 0.94));
      // Warmer, non-robotic pitch
      utterance.pitch = 0.98;

      const chosenVoice = await findBestNaturalVoice(selectedBrowserVoiceId || undefined);
      if (chosenVoice) {
        utterance.voice = chosenVoice;
        setActiveVoiceLabel(chosenVoice.name.replace(/Microsoft\s+|Google\s+|Apple\s+/gi, '').trim());
      } else {
        setActiveVoiceLabel('Natural Voice');
      }

      setIsStudioAudioActive(false);

      utterance.onstart = () => {
        setIsLoadingAudio(false);
        setIsPlaying(true);
        setIsPaused(false);
        startSpeechKeepAlive();
      };

      utterance.onend = () => {
        stopSpeechKeepAlive();
        onEndedCallback();
      };

      utterance.onerror = (e) => {
        console.warn('Natural SpeechSynthesis notice:', e);
        stopSpeechKeepAlive();
        setIsPlaying(false);
        setIsLoadingAudio(false);
      };

      synthRef.current.speak(utterance);
    },
    [prepareSpeechText, rate, selectedBrowserVoiceId]
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

      // Check if user selected a studio AI voice or browser natural voice
      const studioVoiceMap: Record<string, string> = {
        'studio-kore': 'Kore',
        'studio-puck': 'Puck',
        'studio-fenrir': 'Fenrir',
        'studio-charon': 'Charon',
        'studio-zephyr': 'Zephyr',
      };

      const isStudioMode = voiceMode.startsWith('studio-');
      const selectedVoiceName = studioVoiceMap[voiceMode] || 'Kore';
      const cacheKey = `${idea.id}_${selectedVoiceName}`;

      let base64Audio = isStudioMode ? audioCacheRef.current.get(cacheKey) : undefined;

      if (isStudioMode && !base64Audio) {
        try {
          const res = await fetch('/api/tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: prepareSpeechText(idea),
              voiceName: selectedVoiceName,
              style: 'Warm, natural, articulate human narrator with natural pacing and conversational prosody',
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
          console.warn('Studio TTS fetch notice, using natural browser speech engine:', err);
        }
      }

      // If Studio Audio is available, play via HTML5 Audio
      if (base64Audio) {
        try {
          const audio = new Audio(`data:audio/wav;base64,${base64Audio}`);
          audio.playbackRate = rate;
          audioRef.current = audio;
          setIsStudioAudioActive(true);
          setActiveVoiceLabel(`Studio ${selectedVoiceName} (AI Natural)`);

          audio.oncanplaythrough = () => {
            setIsLoadingAudio(false);
            setIsPlaying(true);
          };

          audio.onended = () => {
            onCardFinished();
          };

          audio.onerror = () => {
            console.warn('Audio playback error, falling back to natural speech synthesis');
            playWebSpeechFallback(idea, onCardFinished);
          };

          await audio.play();
          return;
        } catch (e) {
          console.warn('Audio play() threw:', e);
        }
      }

      // High-quality fallback with natural/neural browser voice
      await playWebSpeechFallback(idea, onCardFinished);
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
    activeVoiceLabel,
    isStudioAudioActive,
    availableVoices,
    selectedBrowserVoiceId,
    setSelectedBrowserVoiceId,
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
