import { QdrantClient } from '@qdrant/js-client-rest';

const client = new QdrantClient({
  url: process.env.QDRANT_URL,
  apiKey: process.env.QDRANT_API_KEY,
});

const COLLECTION_NAME = process.env.QDRANT_COLLECTION || 'document_chunks_v3';
const VECTOR_SIZE = 3072; // gemini-embedding-2 output dimension

export async function ensureCollection() {
  const collections = await client.getCollections();
  const exists = collections.collections.some((c) => c.name === COLLECTION_NAME);

  if (!exists) {
    await client.createCollection(COLLECTION_NAME, {
      vectors: { size: VECTOR_SIZE, distance: 'Cosine' },
    });
    console.log(`Created Qdrant collection: ${COLLECTION_NAME}`);
  }
}

export interface QdrantPayload {
  orgId: string;
  docId: string;
  chunkId: string;
  page: number;
  text: string;
  // Index signature to satisfy TypeScript's Record<string, unknown> expectation
  [key: string]: unknown;
}

export async function upsertVector(
  id: string,
  vector: number[],
  payload: QdrantPayload,
) {
  await client.upsert(COLLECTION_NAME, {
    points: [{ id, vector, payload }],
  });
}

// orgId filter is mandatory — every search is scoped to one tenant
export async function searchVectors(
  vector: number[],
  orgId: string,
  limit = 5,
) {
  return client.query(COLLECTION_NAME, {
    query: vector,
    limit: limit,
    with_payload: true,
    filter: {
      must: [{ key: 'orgId', match: { value: orgId } }],
    },
  });
}

export { client };
