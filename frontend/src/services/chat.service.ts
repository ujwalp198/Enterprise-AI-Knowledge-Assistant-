import api from './api';

export interface Citation {
  docId: string;
  docName: string;
  page: number;
}

export interface QueryResult {
  answer: string;
  citations: Citation[];
}

export async function askQuestion(question: string): Promise<QueryResult> {
  const res = await api.post('/chat/query', { question });
  return res.data;
}
