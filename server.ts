import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { synthesizeDetailedFallbackCards } from './src/utils/synthesisFallback.ts';
import { normalizeIdeaCards } from './src/utils/ideaContent.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Handle JSON parsing and payload too large errors gracefully
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err) {
    console.warn('Express middleware request notice:', err.message);
    if (err.type === 'entity.too.large') {
      return res.status(413).json({
        error: 'File payload is too large. Please upload an excerpt or a file under 25MB.',
        success: false
      });
    }
    return res.status(err.status || 400).json({
      error: err.message || 'Invalid request payload',
      success: false
    });
  }
  next();
});

const port = process.env.PORT || 3000;

// Initialize Gemini SDK with server-side key adhering to SDK guidelines
const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// Server-side in-memory audio cache to guarantee fast response and save quota
const ttsAudioCache = new Map<string, string>();

// Helper to generate content with fallback cascade across responsive models
async function generateContentWithFallback(aiInstance: GoogleGenAI, requestPayload: any) {
  // Try gemini-2.5-flash first (lightning-fast, high throughput, zero 503 errors),
  // then gemini-2.5-flash-lite, then gemini-3.8-flash
  const models = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-3.8-flash'];
  let lastError: any = null;
  for (const model of models) {
    try {
      return await aiInstance.models.generateContent({
        ...requestPayload,
        model,
      });
    } catch (err: any) {
      console.warn(`Model ${model} failed (${err.message}). Trying fallback model...`);
      lastError = err;
    }
  }
  throw lastError;
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasGeminiKey: Boolean(apiKey),
    timestamp: new Date().toISOString()
  });
});

// Natural Studio Voice Text-to-Speech using Gemini TTS
// Cascades gemini-3.8-flash-tts (flagship natural speech) -> gemini-3.8-flash-lite-tts
app.post('/api/tts', async (req, res) => {
  try {
    const { text, voiceName, style } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text content is required for speech' });
    }

    if (!ai) {
      return res.status(503).json({ error: 'Gemini API key not configured' });
    }

    const validVoices = ['Kore', 'Puck', 'Fenrir', 'Charon', 'Zephyr'];
    const chosenVoice = validVoices.includes(voiceName) ? voiceName : 'Kore';
    const promptText = text.slice(0, 2500).trim();
    const cacheKey = `${chosenVoice}:${promptText}`;

    // Return cached audio if available
    const cached = ttsAudioCache.get(cacheKey);
    if (cached) {
      return res.json({
        success: true,
        audioBase64: cached,
        mimeType: 'audio/wav',
        voiceName: chosenVoice,
        cached: true,
      });
    }

    // Cascade: gemini-3.8-flash-tts first (flagship high-naturalness), then gemini-3.8-flash-lite-tts
    const ttsModels = ['gemini-3.8-flash-tts', 'gemini-3.8-flash-lite-tts'];
    let generatedAudioBase64: string | null = null;
    let lastError: any = null;

    for (const model of ttsModels) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: promptText,
                  speechMetadata: {
                    style:
                      style ||
                      'Warm, articulate human narrator speaking with natural conversational prosody, calm breathing intervals, and clear inflection.',
                  },
                },
              ],
            },
          ],
          config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: chosenVoice },
              },
            },
          },
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (base64Audio) {
          generatedAudioBase64 = base64Audio;
          // Store in cache (cap at 100 entries to prevent memory growth)
          if (ttsAudioCache.size > 100) {
            const firstKey = ttsAudioCache.keys().next().value;
            if (firstKey) ttsAudioCache.delete(firstKey);
          }
          ttsAudioCache.set(cacheKey, base64Audio);
          break;
        }
      } catch (err: any) {
        console.warn(`TTS model ${model} notice (${err.message}). Trying fallback...`);
        lastError = err;
      }
    }

    if (generatedAudioBase64) {
      return res.json({
        success: true,
        audioBase64: generatedAudioBase64,
        mimeType: 'audio/wav',
        voiceName: chosenVoice,
      });
    }

    throw lastError || new Error('No audio returned from speech synthesis');
  } catch (error: any) {
    console.warn('Gemini TTS error or rate limit:', error.message);
    return res.status(503).json({
      error: error.message || 'TTS generation unavailable',
      fallbackRecommended: true,
    });
  }
});

// Ebook / PDF / EPUB Ingestion Route using Gemini 3.8 Flash
app.post('/api/extract-ebook', async (req, res) => {
  try {
    const { fileBase64, mimeType, text, bookTitle, author, targetCount = 6 } = req.body;
    const title = bookTitle?.trim() || 'Uploaded Ebook';
    const authorName = author?.trim() || 'Author';

    if (!text && !fileBase64) {
      return res.status(400).json({ error: 'Please provide either ebook text content or an uploaded document file.' });
    }

    const count = Math.min(8, Math.max(2, Number(targetCount) || 4));

    if (!ai) {
      const fallbackCards = synthesizeDetailedFallbackCards(title, authorName, text, count);
      return res.json({ success: true, ideas: fallbackCards, bookTitle: title, author: authorName });
    }

    const parts: any[] = [];

    // If PDF uploaded directly
    if (fileBase64 && mimeType === 'application/pdf') {
      parts.push({
        inlineData: {
          data: fileBase64,
          mimeType: 'application/pdf',
        },
      });
      parts.push({
        text: `You are an elite micro-learning curator for Deepstash.
Analyze this uploaded ebook PDF: "${title}" by ${authorName}.
Extract exactly ${count} distinct, high-impact "Idea Cards" representing the most profound, practical lessons and mental models from this book.

CRITICAL LENGTH REQUIREMENT:
Each card's 'body' MUST be exactly 1,000 characters in length, including spaces.
Do NOT write short 30-word summaries. Provide an in-depth, comprehensive explanation detailing the underlying principle, how the mechanism operates in practice, real-world examples, and nuanced implications so the reader gets deep mastery.
Format each card with:
- title: Punchy headline title (4-8 words)
- body: Rich, detailed deep-dive prose of ~1,000 characters
- actionableTakeaway: Specific practical action or mental exercise (30-50 words)
- tags: 2 to 3 topic tags`,
      });
    } else {
      // Text / EPUB chapter excerpts provided
      const rawText = (text || '').slice(0, 16000);
      parts.push({
        text: `You are an elite micro-learning curator for Deepstash.
Extract exactly ${count} distinct, high-impact "Idea Cards" from the following ebook content for "${title}" by ${authorName}.

Book Excerpt / Content:
"""
${rawText}
"""

CRITICAL LENGTH REQUIREMENT:
Each card's 'body' MUST be exactly 1,000 characters in length, including spaces.
Do NOT write brief summaries. Provide an in-depth, comprehensive breakdown explaining the core principle, the psychological or strategic mechanism, concrete context, and nuanced takeaways.
Format each card with:
- title: Punchy headline (4-8 words)
- body: Rich in-depth explanation of ~1,000 characters
- actionableTakeaway: A practical daily rule, reflection, or test
- tags: 2-3 relevant tags (e.g. Habits, Leadership, Psychology, Wealth)
- sourceType: "Book"
- sourceTitle: "${title}"
- author: "${authorName}"`,
      });
    }

    const response = await generateContentWithFallback(ai, {
      contents: parts,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              body: {
                type: Type.STRING,
                description: 'Rich, comprehensive explanation of ~1000 characters (850 to 1150 characters) with detailed practical mechanics and real-world nuance.'
              },
              actionableTakeaway: { type: Type.STRING },
              sourceType: { type: Type.STRING },
              sourceTitle: { type: Type.STRING },
              author: { type: Type.STRING },
              tags: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              readTime: { type: Type.STRING }
            },
            required: ['title', 'body', 'actionableTakeaway', 'tags']
          }
        }
      }
    });

    const parsed = JSON.parse(response.text || '[]');
    const ideas = normalizeIdeaCards(parsed.map((item: any, idx: number) => ({
      ...item,
      id: `ebook_${Date.now()}_${idx}`,
      sourceType: 'Book',
      sourceTitle: title,
      author: authorName,
      likesCount: Math.floor(Math.random() * 20) + 18,
      readTime: item.readTime || `${Math.max(1, Math.round((item.body?.length || 1000) / 500))} min read`,
      createdAt: new Date().toISOString()
    })));

    return res.json({ success: true, ideas, bookTitle: title, author: authorName });
  } catch (error: any) {
    console.warn('Gemini ebook extraction notice, fallback to smart synthesis:', error.message);
    const title = req.body.bookTitle?.trim() || 'Uploaded Ebook';
    const authorName = req.body.author?.trim() || 'Author';
    const count = Math.min(8, Math.max(2, Number(req.body.targetCount) || 4));
    const fallbackIdeas = synthesizeDetailedFallbackCards(title, authorName, req.body.text, count);
    return res.json({ success: true, ideas: fallbackIdeas, bookTitle: title, author: authorName, fallback: true });
  }
});

// AI Idea Extraction Route using Gemini 3.8 Flash
app.post('/api/extract-ideas', async (req, res) => {
  try {
    const { text, sourceTitle, sourceType, author, topic } = req.body;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({ error: 'Text or notes are required to extract ideas.' });
    }

    if (!ai) {
      // High-quality fallback synthesizer if no GEMINI_API_KEY configured
      const mockIdeas = [
        {
          id: `gen_${Date.now()}_1`,
          title: 'The Inversion Principle of Success',
          body: 'Instead of seeking brilliance or trying to solve hard problems directly, identify all the ways to fail and systematically avoid them. As Charlie Munger advised: Invert, always invert.',
          actionableTakeaway: 'Ask yourself: What is the single worst mistake I could make on this project? Write it down and eliminate the conditions that enable it.',
          sourceType: sourceType || 'Mental Model',
          sourceTitle: sourceTitle || 'Poor Charlie\'s Almanack',
          author: author || 'Charlie Munger',
          tags: ['Thinking', 'Strategy', 'Mental Models'],
          readTime: '1 min read',
          likesCount: 28,
          createdAt: new Date().toISOString()
        },
        {
          id: `gen_${Date.now()}_2`,
          title: 'Lower Activation Energy for Hard Habits',
          body: 'Every behavior has an activation threshold. When building a desired routine, decrease the friction to start to under two minutes. You cannot optimize a habit that does not yet exist.',
          actionableTakeaway: 'Prepare your workspace or tools the night before so starting takes zero mental decision-making.',
          sourceType: sourceType || 'Book',
          sourceTitle: sourceTitle || 'Atomic Habits',
          author: author || 'James Clear',
          tags: ['Habits', 'Productivity'],
          readTime: '1 min read',
          likesCount: 45,
          createdAt: new Date().toISOString()
        },
        {
          id: `gen_${Date.now()}_3`,
          title: 'Seek Asymmetric Upside',
          body: 'Look for decisions where the downside is strictly capped and minimal, but the potential upside is unbounded. Compounding happens when you stay in the game long enough for fat tails to emerge.',
          actionableTakeaway: 'Evaluate new opportunities by whether failure is survivable and success can scale non-linearly.',
          sourceType: sourceType || 'Book',
          sourceTitle: sourceTitle || 'Skin in the Game',
          author: author || 'Nassim Nicholas Taleb',
          tags: ['Decision Making', 'Wealth'],
          readTime: '1 min read',
          likesCount: 31,
          createdAt: new Date().toISOString()
        }
      ];

      return res.json({ success: true, ideas: normalizeIdeaCards(mockIdeas as any), source: 'fallback' });
    }

    const prompt = `You are an elite micro-learning curator for Deepstash.
Analyze the provided source text, notes, or topic excerpt.
Extract 3 to 4 distinct, memorable, and actionable "Idea Cards".

CRITICAL LENGTH REQUIREMENT:
Each card's 'body' MUST be exactly 1,000 characters in length, including spaces.
Do NOT write brief 30-word summaries. Provide an in-depth, comprehensive breakdown explaining the core principle, how it works in real life, underlying psychological or practical mechanisms, and nuanced takeaways.

Source Text:
"""
${text.slice(0, 8000)}
"""

Provided context:
- Source Type: ${sourceType || 'Book / Article'}
- Source Title: ${sourceTitle || 'Curated Wisdom'}
- Author: ${author || 'Curator'}
- Focus Topic: ${topic || 'Micro-learning'}

Output a JSON array of objects conforming to the schema.`;

    const response = await generateContentWithFallback(ai, {
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: {
                type: Type.STRING,
                description: 'A punchy, memorable headline summarizing the core insight, 4 to 8 words.'
              },
              body: {
                type: Type.STRING,
                description: 'Rich, thorough explanation of approximately 1000 characters (850 to 1150 characters) with deep context and real-world mechanisms.'
              },
              actionableTakeaway: {
                type: Type.STRING,
                description: 'One practical reflection question, daily experiment, or concrete action step.'
              },
              sourceType: {
                type: Type.STRING,
                description: 'Book, Article, Podcast, Mental Model, or Quote'
              },
              sourceTitle: {
                type: Type.STRING,
                description: 'Title of the source work'
              },
              author: {
                type: Type.STRING,
                description: 'Author or thinker name'
              },
              tags: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '2 to 3 concise relevant tags (e.g. Productivity, Psychology, Habits)'
              },
              readTime: {
                type: Type.STRING,
                description: 'e.g. 1 min read'
              }
            },
            required: ['title', 'body', 'actionableTakeaway', 'sourceType', 'sourceTitle', 'author', 'tags']
          }
        }
      }
    });

    const parsed = JSON.parse(response.text || '[]');
    const ideas = normalizeIdeaCards(parsed.map((item: any, idx: number) => ({
      ...item,
      id: `ai_${Date.now()}_${idx}`,
      likesCount: Math.floor(Math.random() * 25) + 10,
      readTime: item.readTime || `${Math.max(1, Math.round((item.body?.length || 1000) / 500))} min read`,
      createdAt: new Date().toISOString()
    })));

    return res.json({ success: true, ideas, source: 'gemini' });
  } catch (error: any) {
    console.warn('Gemini API notice, activating intelligent fallback synthesis:', error.message);
    const sourceTitle = req.body.sourceTitle || 'Curated Wisdom';
    const author = req.body.author || 'Curator';
    const fallbackCards = synthesizeDetailedFallbackCards(sourceTitle, author, req.body.text, 3);

    return res.json({
      success: true,
      ideas: fallbackCards,
      source: 'smart-synthesizer'
    });
  }
});

// Configure Vite middleware in development vs static files in production
const isProd = process.env.NODE_ENV === 'production';

async function startServer() {
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(Number(port), '0.0.0.0', () => {
    console.log(`Deepstash app server running at http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
