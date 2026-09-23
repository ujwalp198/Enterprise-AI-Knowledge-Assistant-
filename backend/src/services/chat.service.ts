import prisma from '../config/db';
import { generateEmbedding } from './embedding.service';
import { searchVectors } from './qdrant.service';
import { generateAnswer, RetrievedChunk } from './llm.service';

interface QueryInput {
  question: string;
  orgId: string;
  userId: string;
}

export async function runQuery({ question, orgId, userId }: QueryInput) {
  // 1. Embed the question using the same model as the stored chunks
  const questionEmbedding = await generateEmbedding(question);

  // 2. Search Qdrant — orgId filter enforces multi-tenant isolation
  const results = await searchVectors(questionEmbedding, orgId, 5);
  
  // Extract points from query response
  const points = results.points || [];

  if (points.length === 0) {
    const answer =
      "I couldn't find any relevant information in your organization's documents to answer this question.";
    await prisma.query.create({
      data: { question, answer, organizationId: orgId, askedById: userId },
    });
    return { answer, citations: [] };
  }

  // 3. Fetch document names so citations are human-readable
  const docIdStrings = points
    .map((p) => p.payload?.docId)
    .filter((id): id is string => id !== undefined);
  
  const docIds = [...new Set(docIdStrings)];
  const documents = await prisma.document.findMany({
    where: { id: { in: docIds }, organizationId: orgId }, // defense-in-depth org check
    select: { id: true, originalName: true },
  });
  const docNameMap = new Map(documents.map((d) => [d.id, d.originalName]));

  const chunks: RetrievedChunk[] = points
    .map((p) => ({
      text: p.payload?.text as string || '',
      page: p.payload?.page as number || 0,
      docId: p.payload?.docId as string || '',
      docName: docNameMap.get(p.payload?.docId as string || '') || 'Unknown document',
    }))
    .filter(chunk => chunk.docId !== '' && chunk.text !== '');

  // 4. Generate the answer from retrieved context
  const answer = await generateAnswer(question, chunks);

  // 5. Log the query for history / analytics
  await prisma.query.create({
    data: { question, answer, organizationId: orgId, askedById: userId },
  });

  // 6. Return answer + citation metadata
  const citations = chunks.map((c) => ({
    docId: c.docId,
    docName: c.docName,
    page: c.page,
  }));

  return { answer, citations };
}
