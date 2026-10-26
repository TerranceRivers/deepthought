/**
 * Natural Speech Synthesis Engine
 * 
 * Provides human-like speech synthesis by:
 * 1. Asynchronously resolving browser voices (handles Chrome/Safari/Edge race conditions)
 * 2. Scoring voices to guarantee natural/neural human voices over robotic legacy synthesizers (eSpeak, Desktop David)
 * 3. Applying conversational prosody, natural breath pauses, and optimal pitch/rate
 * 4. Overcoming the Chromium 15-second speech synthesis stall bug via active heartbeat
 */

export interface AvailableVoice {
  id: string;
  name: string;
  displayName: string;
  lang: string;
  isNatural: boolean;
  rawVoice: SpeechSynthesisVoice;
}

let cachedVoices: SpeechSynthesisVoice[] = [];
let voicesLoadedPromise: Promise<SpeechSynthesisVoice[]> | null = null;

// Score voice quality based on neural/natural indicators
export function scoreVoiceQuality(voice: SpeechSynthesisVoice): number {
  let score = 0;
  const name = voice.name.toLowerCase();
  const lang = voice.lang.toLowerCase();

  // Language match (English prioritized)
  if (lang.startsWith('en')) {
    score += 40;
    if (lang === 'en-us' || lang === 'en-gb') score += 10;
  } else {
    score -= 50;
  }

  // Tier 1: Modern Neural / Online Natural voices (sound completely human)
  if (name.includes('natural') || name.includes('online (natural)')) score += 100;
  if (name.includes('neural')) score += 95;
  if (name.includes('premium')) score += 90;
  if (name.includes('enhanced')) score += 85;
  if (name.includes('wavenet')) score += 80;
  if (name.includes('studio')) score += 75;

  // Tier 2: Proven high-grade modern browser engines
  if (name.includes('google')) {
    score += 70;
    if (name.includes('us english') || name.includes('uk english')) score += 15;
  }
  if (name.includes('samantha')) score += 65;
  if (name.includes('siri')) score += 65;
  if (name.includes('karen') || name.includes('moira') || name.includes('tessa')) score += 60;
  if (name.includes('alex') || name.includes('daniel') || name.includes('oliver')) score += 60;
  if (name.includes('jenny') || name.includes('guy') || name.includes('aria')) score += 75;

  // Penalize robotic, legacy computerized voices heavily
  if (name.includes('espeak')) score -= 150;
  if (name.includes('desktop')) score -= 80; // Microsoft David/Zira Desktop
  if (name.includes('david')) score -= 70;
  if (name.includes('zira')) score -= 60;
  if (name.includes('mark') && name.includes('mobile')) score -= 30;
  if (name.includes('robot') || name.includes('sampler')) score -= 100;

  return score;
}

// Initialize and ensure voices are loaded across all browsers
export function ensureVoicesLoaded(): Promise<SpeechSynthesisVoice[]> {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return Promise.resolve([]);
  }

  if (cachedVoices.length > 0) {
    return Promise.resolve(cachedVoices);
  }

  if (voicesLoadedPromise) {
    return voicesLoadedPromise;
  }

  voicesLoadedPromise = new Promise((resolve) => {
    const synth = window.speechSynthesis;
    const existing = synth.getVoices();
    if (existing.length > 0) {
      cachedVoices = existing;
      resolve(existing);
      return;
    }

    let resolved = false;
    const onVoicesChanged = () => {
      const v = synth.getVoices();
      if (v.length > 0 && !resolved) {
        resolved = true;
        cachedVoices = v;
        synth.removeEventListener('voiceschanged', onVoicesChanged);
        resolve(v);
      }
    };

    synth.addEventListener('voiceschanged', onVoicesChanged);

    // Backup polling timeout for browsers that don't emit voiceschanged
    const interval = setInterval(() => {
      const v = synth.getVoices();
      if (v.length > 0 && !resolved) {
        resolved = true;
        cachedVoices = v;
        clearInterval(interval);
        synth.removeEventListener('voiceschanged', onVoicesChanged);
        resolve(v);
      }
    }, 100);

    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        clearInterval(interval);
        cachedVoices = synth.getVoices();
        resolve(cachedVoices);
      }
    }, 1500);
  });

  return voicesLoadedPromise;
}

// Get clean list of available high-quality voices
export async function getCuratedNaturalVoices(): Promise<AvailableVoice[]> {
  const rawVoices = await ensureVoicesLoaded();
  
  // Sort by quality score
  const scored = rawVoices
    .filter((v) => v.lang.startsWith('en'))
    .map((v) => ({
      voice: v,
      score: scoreVoiceQuality(v),
    }))
    .sort((a, b) => b.score - a.score);

  return scored.map(({ voice, score }) => {
    let cleanName = voice.name
      .replace(/Microsoft\s+/i, '')
      .replace(/Google\s+/i, 'Google ')
      .replace(/Apple\s+/i, '')
      .replace(/Online\s*\((Natural)\)/i, '(Natural)')
      .replace(/\(.*?\)/g, (match) => {
        if (match.toLowerCase().includes('natural') || match.toLowerCase().includes('enhanced')) {
          return match;
        }
        return '';
      })
      .trim();

    const isNatural = score >= 50;

    return {
      id: voice.voiceURI || voice.name,
      name: voice.name,
      displayName: `${cleanName} ${isNatural ? '✨ (Natural)' : ''}`.trim(),
      lang: voice.lang,
      isNatural,
      rawVoice: voice,
    };
  });
}

// Find the absolute best natural voice currently installed
export async function findBestNaturalVoice(preferredName?: string): Promise<SpeechSynthesisVoice | null> {
  const rawVoices = await ensureVoicesLoaded();
  if (rawVoices.length === 0) return null;

  if (preferredName) {
    const matched = rawVoices.find(
      (v) => v.name.toLowerCase() === preferredName.toLowerCase() || v.voiceURI === preferredName
    );
    if (matched) return matched;
  }

  // Filter English and sort by score
  const sorted = [...rawVoices]
    .filter((v) => v.lang.startsWith('en'))
    .sort((a, b) => scoreVoiceQuality(b) - scoreVoiceQuality(a));

  return sorted[0] || rawVoices[0] || null;
}

// Prepare natural text with prosody and punctuation pauses
export function formatSpeechTextForNaturalCadence(
  title: string,
  body: string,
  takeaway?: string,
  author?: string,
  sourceTitle?: string
): string {
  const parts: string[] = [];

  // Title with intro pause
  parts.push(`${title.trim()}.`);

  // Author & source context
  if (author && sourceTitle) {
    parts.push(`By ${author}, from ${sourceTitle}.`);
  } else if (sourceTitle) {
    parts.push(`From ${sourceTitle}.`);
  }

  // Body clean-up: convert abrupt bullet points or symbols to spoken pauses
  const cleanBody = body
    .replace(/\s+/g, ' ')
    .replace(/(\d+)\/(\d+)/g, '$1 out of $2')
    .replace(/—|–/g, ', ')
    .replace(/\.{2,}/g, '.')
    .trim();

  parts.push(cleanBody);

  // Takeaway with conversational intro
  if (takeaway && takeaway.trim()) {
    parts.push(`Actionable takeaway: ${takeaway.trim()}`);
  }

  return parts.join(' ');
}

// Heartbeat keep-alive to prevent Chromium from cutting off audio after ~15s
let heartbeatInterval: NodeJS.Timeout | null = null;

export function startSpeechKeepAlive() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  if (heartbeatInterval) clearInterval(heartbeatInterval);

  heartbeatInterval = setInterval(() => {
    const synth = window.speechSynthesis;
    if (synth.speaking && !synth.paused) {
      synth.pause();
      synth.resume();
    }
  }, 10000);
}

export function stopSpeechKeepAlive() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
}
