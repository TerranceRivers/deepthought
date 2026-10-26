import { test } from 'node:test';
import assert from 'node:assert/strict';
import { StudioPlayer } from './studioPlayer';

function setup() {
  const pending: { resolve: (value: Response) => void; signal: AbortSignal }[] = [];
  const sounds: any[] = [];
  const events: string[] = [];
  const player = new StudioPlayer((url) => {
    const sound = { url, onended: null, onerror: null, playbackRate: 1,
      playing: false, playCount: 0,
      async play() { this.playing = true; this.playCount++; },
      pause() { this.playing = false; }, removeAttribute() {}, load() {} };
    sounds.push(sound);
    return sound as unknown as HTMLAudioElement;
  }, ((_url: any, init: any) => new Promise<Response>(resolve => pending.push({ resolve, signal: init.signal }))) as typeof fetch);
  const callbacks = { ready: () => events.push('ready'), ended: () => events.push('ended'), error: (message: string) => events.push(message) };
  const respond = (index: number, status = 200) => pending[index].resolve(new Response(JSON.stringify(
    status === 200 ? { audioBase64: 'wav', mimeType: 'audio/wav' } : { error: 'Studio unavailable' }), { status }));
  return { player, pending, sounds, events, callbacks, respond };
}
test('late response cannot play over a newer selection', async () => {
  const s = setup();
  const first = s.player.play('old', 'Kore', s.callbacks);
  const second = s.player.play('new', 'Kore', s.callbacks);
  assert.equal(s.pending[0].signal.aborted, true);
  s.respond(1); await second;
  s.respond(0); await first;
  assert.equal(s.sounds.length, 1);
  assert.equal(s.sounds[0].playing, true);
  assert.deepEqual(s.events, ['ready']);
  s.player.stop();
});
test('stop while loading prevents late playback', async () => {
  const s = setup(); const task = s.player.play('text', 'Kore', s.callbacks);
  s.player.stop(); s.respond(0); await task;
  assert.equal(s.sounds.length, 0); assert.deepEqual(s.events, []);
});
test('replacement stops current audio and ignores stale ended callback', async () => {
  const s = setup(); const a = s.player.play('a', 'Kore', s.callbacks);
  s.respond(0); await a;
  const staleEnd = s.sounds[0].onended;
  const b = s.player.play('b', 'Kore', s.callbacks);
  assert.equal(s.sounds[0].playing, false);
  staleEnd();
  s.respond(1); await b;
  assert.deepEqual(s.events, ['ready', 'ready']);
  s.player.stop();
});
test('pause during generation stays paused until resume', async () => {
  const s = setup(); const a = s.player.play('a', 'Kore', s.callbacks);
  s.player.pause(); s.respond(0); await a;
  assert.equal(s.sounds[0].playCount, 0);
  await s.player.resume(); assert.equal(s.sounds[0].playCount, 1);
  s.player.stop();
});
test('provider failure reports an error and never creates fallback speech', async () => {
  const s = setup(); const a = s.player.play('a', 'Kore', s.callbacks);
  s.respond(0, 503); await a;
  assert.equal(s.sounds.length, 0);
  assert.deepEqual(s.events, ['Studio unavailable']);
});
test('ended callback fires only once and edited text requests new narration', async () => {
  const s = setup(); const a = s.player.play('a', 'Kore', s.callbacks);
  s.respond(0); await a;
  const ended = s.sounds[0].onended; ended(); ended();
  assert.deepEqual(s.events, ['ready', 'ended']);
  const b = s.player.play('edited', 'Kore', s.callbacks);
  assert.equal(s.pending.length, 2);
  s.respond(1); await b; s.player.stop();
});
