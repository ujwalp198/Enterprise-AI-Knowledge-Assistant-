import { ParsedPage } from './parsing.service';

export interface Chunk {
  text: string;
  page: number;
}

interface ChunkOptions {
  chunkSize?: number; // approximate characters per chunk
  overlap?: number;   // characters of overlap between adjacent chunks
}

export function chunkPages(
  pages: ParsedPage[],
  options: ChunkOptions = {},
): Chunk[] {
  const chunkSize = options.chunkSize ?? 1000; // ~200-250 tokens
  const overlap = options.overlap ?? 150;

  const chunks: Chunk[] = [];

  for (const page of pages) {
    const text = page.text.trim();
    if (!text) continue;

    // Chunk within the page boundary so every chunk maps to exactly one
    // page number — keeps citations accurate
    let start = 0;
    while (start < text.length) {
      const end = Math.min(start + chunkSize, text.length);
      const chunkText = text.slice(start, end).trim();

      if (chunkText.length > 0) {
        chunks.push({ text: chunkText, page: page.pageNumber });
      }

      if (end === text.length) break;
      start += chunkSize - overlap; // overlap prevents sentences being split at boundaries
    }
  }

  return chunks;
}
