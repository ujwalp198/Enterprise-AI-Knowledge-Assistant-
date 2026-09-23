import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'dummy_key');

export async function generateEmbedding(text: string): Promise<number[]> {
  const model = genAI.getGenerativeModel({ model: 'gemini-embedding-2' });
  const result = await model.embedContent(text);
  return result.embedding.values;
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const model = genAI.getGenerativeModel({ model: 'gemini-embedding-2' });
  const allEmbeddings: number[][] = [];
  const BATCH_SIZE = 100;

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batchTexts = texts.slice(i, i + BATCH_SIZE);
    const requests = batchTexts.map((text) => ({ content: { role: 'user', parts: [{ text }] } }));
    const result = await model.batchEmbedContents({ requests });
    allEmbeddings.push(...result.embeddings.map((e) => e.values));
  }

  return allEmbeddings;
}
