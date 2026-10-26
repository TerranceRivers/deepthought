export class StudioPlayer {
  private generation = 0;
  private request?: AbortController;
  private audio?: HTMLAudioElement;
  private paused = false;
  private speed = 1;
  private cache = new Map<string, string>();
  constructor(private createAudio = (url: string) => new Audio(url), private requestAudio: typeof fetch = fetch) {}
  stop() {
    this.generation++;
    this.request?.abort();
    if (this.audio) {
      this.audio.onended = null;
      this.audio.onerror = null;
      this.audio.pause();
      this.audio.removeAttribute('src');
      this.audio.load();
      this.audio = undefined;
    }
    this.paused = false;
    if (typeof window !== 'undefined') window.speechSynthesis?.cancel();
  }
  pause() { this.paused = true; this.audio?.pause(); }
  async resume() {
    const generation = this.generation;
    this.paused = false;
    try { await this.audio?.play(); }
    catch (error) { if (generation === this.generation) throw error; }
  }
  setRate(value: number) { this.speed = value; if (this.audio) this.audio.playbackRate = value; }
  async play(text: string, voiceName: string, callbacks: {
    ready: () => void; ended: () => void; error: (message: string) => void;
  }) {
    this.stop();
    const generation = this.generation;
    const current = () => generation === this.generation;
    const controller = new AbortController();
    this.request = controller;
    const timer = setTimeout(() => controller.abort(), 90000);
    const fail = (message: string) => {
      if (!current()) return;
      this.stop();
      callbacks.error(message);
    };
    try {
      const key = JSON.stringify([voiceName, text]);
      let url = this.cache.get(key);
      if (!url) {
        const response = await this.requestAudio('/api/tts', {
          method: 'POST', signal: controller.signal,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, voiceName }),
        });
        const data = await response.json();
        if (!current()) return;
        if (!response.ok) throw new Error(data.error || 'Studio narration is unavailable. Please retry.');
        if (!data.audioBase64 || data.mimeType !== 'audio/wav') throw new Error('Invalid studio audio. Please retry.');
        url = 'data:audio/wav;base64,' + data.audioBase64;
        this.cache.set(key, url);
        if (this.cache.size > 20) this.cache.delete(this.cache.keys().next().value!);
      }
      if (!current()) return;
      const audio = this.createAudio(url);
      this.audio = audio;
      audio.playbackRate = this.speed;
      audio.onended = () => {
        if (!current()) return;
        this.stop();
        callbacks.ended();
      };
      audio.onerror = () => fail('Studio audio could not be played. Please retry.');
      if (!this.paused) await audio.play();
      if (current()) callbacks.ready();
    } catch (error) {
      fail(error instanceof Error && error.name !== 'AbortError' ? error.message : 'Studio narration timed out. Please retry.');
    } finally { clearTimeout(timer); }
  }
}
