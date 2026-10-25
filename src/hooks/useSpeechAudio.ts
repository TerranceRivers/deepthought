import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ensureVoicesLoaded,
  findBestNaturalVoice,
  formatSpeechTextForNaturalCadence,
  startSpeechKeepAlive,
  stopSpeechKeepAlive,
} from '../utils/naturalSpeech';

export function useSpeechAudio() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIdeaId, setCurrentIdeaId] = useState<string | null>(null);
  const [rate, setRate] = useState<number>(1.0);
  const [activeVoiceName, setActiveVoiceName] = useState<string>('Natural Voice');
  const synthRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }
    ensureVoicesLoaded();
    return () => {
      stopSpeechKeepAlive();
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  const stop = useCallback(() => {
    stopSpeechKeepAlive();
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    setIsPlaying(false);
    setCurrentIdeaId(null);
  }, []);

  const speak = useCallback(
    async (ideaId: string, title: string, body: string, takeaway?: string, author?: string, sourceTitle?: string) => {
      if (!synthRef.current) return;

      // If already playing this idea, pause/stop
      if (isPlaying && currentIdeaId === ideaId) {
        stop();
        return;
      }

      synthRef.current.cancel();
      stopSpeechKeepAlive();

      const textToRead = formatSpeechTextForNaturalCadence(title, body, takeaway, author, sourceTitle);
      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.rate = Math.max(0.75, Math.min(1.5, rate * 0.94));
      utterance.pitch = 0.98;

      const preferredVoice = await findBestNaturalVoice();
      if (preferredVoice) {
        utterance.voice = preferredVoice;
        setActiveVoiceName(preferredVoice.name.replace(/Microsoft\s+|Google\s+|Apple\s+/gi, '').trim());
      }

      utterance.onstart = () => {
        setIsPlaying(true);
        setCurrentIdeaId(ideaId);
        startSpeechKeepAlive();
      };

      utterance.onend = () => {
        stopSpeechKeepAlive();
        setIsPlaying(false);
        setCurrentIdeaId(null);
      };

      utterance.onerror = (e) => {
        console.warn('Speech synthesis error:', e);
        stopSpeechKeepAlive();
        setIsPlaying(false);
        setCurrentIdeaId(null);
      };

      synthRef.current.speak(utterance);
    },
    [isPlaying, currentIdeaId, rate, stop]
  );

  const changeRate = (newRate: number) => {
    setRate(newRate);
    if (isPlaying && currentIdeaId) {
      stop();
    }
  };

  return {
    isPlaying,
    currentIdeaId,
    activeVoiceName,
    rate,
    speak,
    stop,
    changeRate,
  };
}
