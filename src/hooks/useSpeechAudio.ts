import { useState, useEffect, useRef, useCallback } from 'react';

export function useSpeechAudio() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIdeaId, setCurrentIdeaId] = useState<string | null>(null);
  const [rate, setRate] = useState<number>(1.0);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }
    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  const stop = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    setIsPlaying(false);
    setCurrentIdeaId(null);
  }, []);

  const speak = useCallback(
    (ideaId: string, title: string, body: string, takeaway?: string, author?: string) => {
      if (!synthRef.current) return;

      // If already playing this idea, pause/stop
      if (isPlaying && currentIdeaId === ideaId) {
        stop();
        return;
      }

      synthRef.current.cancel();

      const textToRead = `${title}. By ${author || 'curator'}. ${body}. ${
        takeaway ? `Actionable takeaway: ${takeaway}` : ''
      }`;

      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.rate = rate;
      utterance.pitch = 1.0;

      // Try selecting a natural sounding English voice
      const voices = synthRef.current.getVoices();
      const preferredVoice = voices.find(
        (v) => (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.lang.startsWith('en')) && !v.name.includes('Bad')
      );
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onstart = () => {
        setIsPlaying(true);
        setCurrentIdeaId(ideaId);
      };

      utterance.onend = () => {
        setIsPlaying(false);
        setCurrentIdeaId(null);
      };

      utterance.onerror = () => {
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
      // Re-trigger with new rate if currently playing
      stop();
    }
  };

  return {
    isPlaying,
    currentIdeaId,
    rate,
    speak,
    stop,
    changeRate,
  };
}
