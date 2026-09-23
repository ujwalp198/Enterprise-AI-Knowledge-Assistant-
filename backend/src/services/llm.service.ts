import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'dummy_key');

export interface RetrievedChunk {
  text: string;
  page: number;
  docId: string;
  docName?: string;
}

export async function generateAnswer(
  question: string,
  chunks: RetrievedChunk[],
): Promise<string> {
  const context = chunks
    .map((c, i) => `[Source ${i + 1} — Page ${c.page}]\n${c.text}`)
    .join('\n\n');

  const systemInstruction =
    `You are an internal knowledge assistant for a company. ` +
    `Answer the user's question using ONLY the provided context below. ` +
    `If the context does not contain enough information to answer, say so clearly ` +
    `instead of guessing. Always reference which source(s) you used by their number ` +
    `(e.g., "According to Source 1...").`;

  const prompt = `Context:\n${context}\n\nQuestion: ${question}`;

  const model = genAI.getGenerativeModel({
    model: 'gemini-3.6-flash',
    systemInstruction,
  });

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.2 },
  });

  return result.response.text() || 'No answer generated.';
}
