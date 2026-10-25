import JSZip from 'jszip';

export interface ParsedEbook {
  title: string;
  author: string;
  fullText: string;
  chapters: { title: string; text: string }[];
  fileBase64?: string;
  mimeType?: string;
  fileSizeFormatted: string;
}

// Strip HTML tags and entities cleanly
function stripHtml(html: string): string {
  if (typeof document !== 'undefined') {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  }
  return html.replace(/<[^>]*>/g, ' ').replace(/&[a-z]+;/gi, ' ');
}

// Format bytes into readable format
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// Convert File to Base64
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Strip off data:application/...;base64,
      const base64 = result.split(',')[1] || result;
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
}

// Parse EPUB file
async function parseEpub(file: File): Promise<ParsedEbook> {
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);

  let title = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
  let author = 'Author';
  const chapters: { title: string; text: string }[] = [];

  // 1. Locate container.xml to find the root OPF file
  const containerXml = await zip.file('META-INF/container.xml')?.async('string');
  let opfPath = '';

  if (containerXml) {
    const match = containerXml.match(/full-path=["']([^"']+\.opf)["']/i);
    if (match && match[1]) {
      opfPath = match[1];
    }
  }

  // Fallback to find any .opf file
  if (!opfPath) {
    const opfFile = Object.keys(zip.files).find((p) => p.endsWith('.opf'));
    if (opfFile) opfPath = opfFile;
  }

  if (opfPath) {
    const opfContent = await zip.file(opfPath)?.async('string');
    if (opfContent) {
      // Extract title
      const titleMatch = opfContent.match(/<dc:title[^>]*>([^<]+)<\/dc:title>/i);
      if (titleMatch && titleMatch[1]) {
        title = titleMatch[1].trim();
      }

      // Extract author
      const creatorMatch = opfContent.match(/<dc:creator[^>]*>([^<]+)<\/dc:creator>/i);
      if (creatorMatch && creatorMatch[1]) {
        author = creatorMatch[1].trim();
      }
    }
  }

  // 2. Extract HTML / XHTML chapters
  const htmlFiles = Object.keys(zip.files)
    .filter((path) => path.match(/\.(html|xhtml|htm)$/i) && !path.includes('toc') && !path.includes('nav'))
    .sort();

  let accumulatedText = '';

  for (let i = 0; i < Math.min(htmlFiles.length, 25); i++) {
    const filePath = htmlFiles[i];
    const content = await zip.file(filePath)?.async('string');
    if (content) {
      const clean = stripHtml(content).replace(/\s+/g, ' ').trim();
      if (clean.length > 80) {
        // Derive chapter title from first heading or index
        const headingMatch = content.match(/<h[1-3][^>]*>([^<]+)<\/h[1-3]>/i);
        const chapterTitle = headingMatch ? stripHtml(headingMatch[1]).trim() : `Section ${i + 1}`;
        chapters.push({ title: chapterTitle, text: clean });
        accumulatedText += `\n\n--- ${chapterTitle} ---\n` + clean.slice(0, 3000);
      }
    }
  }

  return {
    title,
    author,
    fullText: accumulatedText.trim(),
    chapters,
    fileSizeFormatted: formatBytes(file.size),
  };
}

// Main parser function supporting EPUB, PDF, TXT, MD
export async function parseEbookFile(file: File): Promise<ParsedEbook> {
  const fileName = file.name.toLowerCase();
  const baseTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');

  // EPUB
  if (fileName.endsWith('.epub')) {
    try {
      return await parseEpub(file);
    } catch (err) {
      console.warn('EPUB zip parsing failed, fallback:', err);
    }
  }

  // PDF
  if (fileName.endsWith('.pdf') || file.type === 'application/pdf') {
    if (file.size > 20 * 1024 * 1024) {
      throw new Error('PDF file exceeds 20MB limit. Please upload a smaller excerpt or document under 20MB.');
    }
    const base64 = await fileToBase64(file);
    return {
      title: baseTitle,
      author: 'Author',
      fullText: '',
      chapters: [],
      fileBase64: base64,
      mimeType: 'application/pdf',
      fileSizeFormatted: formatBytes(file.size),
    };
  }

  // TXT / MD / JSON
  const rawText = await file.text();
  const lines = rawText.split('\n').filter((l) => l.trim().length > 0);
  let detectedTitle = baseTitle;
  let detectedAuthor = 'Author';

  if (lines[0] && lines[0].startsWith('# ')) {
    detectedTitle = lines[0].replace(/^#\s*/, '').trim();
  }

  return {
    title: detectedTitle,
    author: detectedAuthor,
    fullText: rawText,
    chapters: [{ title: 'Overview', text: rawText }],
    fileSizeFormatted: formatBytes(file.size),
  };
}
