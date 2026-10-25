# Deepstash — Micro-Learning, Smart Stashes & Flashcard Mindmaps

A modern micro-learning platform for bite-sized insights, 1,000-character concept digests, interactive mindmaps, and natural voice narration. Extract key wisdom from books (EPUB/PDF), articles, and thoughts into structured, memorable knowledge cards.

---

## ✨ Features

- **1,000-Character Micro-Learning Digests:** High-impact, bite-sized deep dives and takeaways calibrated for fast comprehension and lasting retention.
- **Natural Voice Audio Narration:** Listen to any idea or chapter with human-like voices (pitch, rate, tone controls, speech synthesis).
- **Interactive Flashcard Mindmaps:** Connect related concepts, review flashcard summaries, test your recall, and navigate knowledge graphs.
- **EPUB & PDF Book Extractor:** Drop in your favorite ebooks or documents to extract core themes, takeaways, and chapter summaries automatically.
- **Dual AI & Offline Resilient Synthesis:** Powered by Google Gemini API with built-in heuristic synthesis fallbacks—the app operates smoothly even without an API key!
- **Curated Topics & Stashes:** Organize insights into Productivity, Philosophy, Psychology, Tech, and more.

---

## 🚀 Quick Start

### 1. Clone the repository
```bash
git clone https://github.com/<your-username>/deepstash-micro-learning.git
cd deepstash-micro-learning
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment Setup (API Key Safety)
> ⚠️ **Security Notice:** API keys are never stored in the repository.

Copy `.env.example` to create your local `.env`:
```bash
cp .env.example .env
```

Open `.env` and insert your Gemini API key (optional—the app includes an offline extractor mode if omitted):
```env
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

### 4. Run the development server
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🛠️ Tech Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS, Motion, Lucide React
- **Backend / Dev Server:** Node.js, Express, tsx, Vite
- **Document Processing:** JSZip (EPUB parser), Canvas/PDF text extraction
- **Audio:** Web Speech API natural voice synthesis

---

## 🔒 Security & Privacy

- All `.env` and secret files are explicitly blocked from git tracking via `.gitignore`.
- Ebook extractions and personal notes are kept in your browser's local state unless you choose to share them.
