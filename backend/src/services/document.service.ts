import prisma from '../config/db';
import { parsePdf } from './parsing.service';
import { chunkPages } from './chunking.service';
import { generateEmbeddings } from './embedding.service';
import { upsertVector } from './qdrant.service';
import { v4 as uuidv4 } from 'uuid';

interface CreateDocumentInput {
  filename: string;
  originalName: string;
  filePath: string;
  organizationId: string;
  uploadedById: string;
}

export async function createDocument(data: CreateDocumentInput) {
  return prisma.document.create({
    data: {
      filename: data.filename,
      originalName: data.originalName,
      filePath: data.filePath,
      organizationId: data.organizationId,
      uploadedById: data.uploadedById,
      status: 'processing',
    },
  });
}

export async function listDocuments(organizationId: string) {
  return prisma.document.findMany({
    where: { organizationId },
    orderBy: { createdAt: 'desc' },
    include: {
      uploadedBy: { select: { id: true, email: true } },
    },
  });
}

// Both id AND organizationId are required — this is the multi-tenant guardrail.
// A user from org B can never retrieve org A's document even with a known valid ID.
export async function getDocumentById(id: string, organizationId: string) {
  return prisma.document.findFirst({
    where: { id, organizationId },
  });
}

export async function processDocument(documentId: string) {
  const document = await prisma.document.findUnique({ where: { id: documentId } });
  if (!document) {
    throw new Error('Document not found');
  }

  try {
    const pages = await parsePdf(document.filePath);
    const chunks = chunkPages(pages);

    if (chunks.length === 0) {
      throw new Error('No text could be extracted from this PDF');
    }

    // One batch API call for all chunks — much cheaper than N individual calls
    const embeddings = await generateEmbeddings(chunks.map((c) => c.text));

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const qdrantId = uuidv4();

      const chunkRow = await prisma.chunk.create({
        data: {
          text: chunk.text,
          page: chunk.page,
          documentId: document.id,
          organizationId: document.organizationId,
          qdrantId,
        },
      });

      await upsertVector(qdrantId, embeddings[i], {
        orgId: document.organizationId,
        docId: document.id,
        chunkId: chunkRow.id,
        page: chunk.page,
        text: chunk.text,
      });
    }

    await prisma.document.update({
      where: { id: document.id },
      data: { status: 'ready' },
    });

    return { chunkCount: chunks.length };
  } catch (err) {
    await prisma.document.update({
      where: { id: document.id },
      data: { status: 'failed' },
    });
    throw err;
  }
}
