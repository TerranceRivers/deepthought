import { useState, useEffect, useRef } from 'react';
import { IdeaCard } from '../types';
import { StudioPlayer } from '../utils/studioPlayer';

export type VoiceMode = 'studio-kore' | 'studio-puck' | 'studio-fenrir';
const VOICES = { 'studio-kore': 'Kore', 'studio-puck': 'Puck', 'studio-fenrir': 'Fenrir' };
interface Options { onCardRead?: (card: IdeaCard) => void; onBatchComplete?: (count: number) => void; }
export function useContinuousAudioPlayer(options?: Options) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [currentIdea, setCurrentIdea] = useState<IdeaCard | null>(null);
  const [batchQueue, setBatchQueue] = useState<IdeaCard[]>([]);
  const [currentBatchIndex, setCurrentBatchIndex] = useState(0);
  const [isAutoPlayActive, setIsAutoPlayActive] = useState(false);
  const [isBatchFinished, setIsBatchFinished] = useState(false);
  const [voiceMode, updateVoice] = useState<VoiceMode>('studio-kore');
  const [rate, updateRate] = useState(1);
  const [autoScroll, setAutoScroll] = useState(true);
  const player = useRef<StudioPlayer | null>(null);
  if (!player.current) player.current = new StudioPlayer();
  // Async handlers read live session state instead of a previous render's queue.
  const session = useRef({ queue: [] as IdeaCard[], index: 0, continuous: false,
    active: false, paused: false, voice: voiceMode });
  const latest = useRef({ options, autoScroll });
  latest.current = { options, autoScroll };
  useEffect(() => () => player.current?.stop(), []);
  function fail(message: string) {
    session.current.active = false;
    session.current.paused = false;
    setIsPlaying(false); setIsPaused(false); setIsLoadingAudio(false);
    setIsAutoPlayActive(false); setAudioError(message);
  }
  function playAt(index: number) {
    const state = session.current;
    const idea = state.queue[index];
    if (!idea) return;
    state.index = index; state.active = true; state.paused = false;
    setCurrentBatchIndex(index); setCurrentIdea(idea);
    setIsPlaying(false); setIsPaused(false); setIsLoadingAudio(true);
    setIsBatchFinished(false); setAudioError(null);
    if (latest.current.autoScroll) document.getElementById('idea-card-' + idea.id)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const text = [idea.title + '.', 'By ' + idea.author + ', from ' + idea.sourceTitle + '.', idea.body, idea.actionableTakeaway || ''].join(' ');
    void player.current!.play(text, VOICES[state.voice], {
      ready: () => {
        setIsLoadingAudio(false); setIsPlaying(true); setIsPaused(session.current.paused);
        latest.current.options?.onCardRead?.(idea);
      },
      ended: () => {
        const state = session.current;
        if (state.continuous && state.index + 1 < state.queue.length) { playAt(state.index + 1); return; }
        state.active = false;
        setIsPlaying(false); setIsPaused(false); setIsAutoPlayActive(false);
        if (state.continuous) { setIsBatchFinished(true); latest.current.options?.onBatchComplete?.(state.queue.length); }
        else setCurrentIdea(null);
      },
      error: fail,
    });
  }
  function stop() {
    player.current!.stop();
    session.current.active = false; session.current.queue = []; session.current.paused = false;
    setIsPlaying(false); setIsPaused(false); setIsLoadingAudio(false);
    setIsAutoPlayActive(false); setIsBatchFinished(false); setCurrentIdea(null);
    setBatchQueue([]); setAudioError(null);
  }
  function pause() { session.current.paused = true; player.current!.pause(); setIsPaused(true); }
  function resume() {
    session.current.paused = false; setIsPaused(false);
    void player.current!.resume().catch(() => { player.current!.stop(); fail('Playback was blocked. Tap the card to retry.'); });
  }
  function startContinuousBatch(ideas: IdeaCard[], start = 0, size = 10) {
    if (!ideas.length) return;
    const first = Math.max(0, Math.min(start, ideas.length - 1));
    const queue = Array.from({ length: Math.min(ideas.length, Math.max(1, size)) }, (_, i) => ideas[(first + i) % ideas.length]);
    session.current.queue = queue; session.current.continuous = true;
    setBatchQueue(queue); setIsAutoPlayActive(true); playAt(0);
  }
  function playSingleCard(idea: IdeaCard, ideas?: IdeaCard[]) {
    const state = session.current;
    if (state.active && state.queue[state.index]?.id === idea.id) { if (state.paused) resume(); else pause(); return; }
    if (ideas?.some(card => card.id === idea.id)) startContinuousBatch(ideas, ideas.findIndex(card => card.id === idea.id));
    else {
      state.queue = [idea]; state.continuous = false; setBatchQueue([idea]);
      setIsAutoPlayActive(false); playAt(0);
    }
  }
  function setVoiceMode(voice: VoiceMode) {
    if (!VOICES[voice] || session.current.voice === voice) return;
    session.current.voice = voice; updateVoice(voice);
    if (session.current.active) playAt(session.current.index);
  }
  function move(delta: number) {
    const state = session.current;
    if (!state.queue.length) return;
    setIsAutoPlayActive(state.continuous);
    playAt((state.index + delta + state.queue.length) % state.queue.length);
  }
  return {
    isPlaying, isPaused, isLoadingAudio, audioError, currentIdea, isAutoPlayActive,
    currentBatchIndex, batchLimit: batchQueue.length, batchQueue, isBatchFinished,
    voiceMode, setVoiceMode, rate,
    changeRate: (value: number) => { updateRate(value); player.current!.setRate(value); },
    autoScroll, setAutoScroll, playSingleCard, startContinuousBatch,
    continueNextBatch: (ideas: IdeaCard[]) => startContinuousBatch(ideas,
      ideas.length ? (ideas.findIndex(card => card.id === currentIdea?.id) + 1) % ideas.length : 0),
    pause, resume, stop, nextInBatch: () => move(1), prevInBatch: () => move(-1),
  };
}
