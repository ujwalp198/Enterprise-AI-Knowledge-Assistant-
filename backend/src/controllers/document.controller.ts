import { Request, Response } from 'express';
import {
  createDocument,
  listDocuments,
  getDocumentById,
  processDocument,
} from '../services/document.service';

export async function uploadDocument(req: Request, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const document = await createDocument({
      filename: req.file.filename,
      originalName: req.file.originalname,
      filePath: req.file.path,
      organizationId: req.user!.orgId,   // always from token, never from request body
      uploadedById: req.user!.userId,
    });

    // Parse + chunk synchronously — fine for portfolio-scale PDFs;
    // swap in a background queue (BullMQ) later if needed
    const result = await processDocument(document.id);

    res.status(201).json({ document, chunksCreated: result.chunkCount });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Upload failed' });
  }
}

export async function getDocuments(req: Request, res: Response) {
  try {
    const documents = await listDocuments(req.user!.orgId);
    res.status(200).json({ documents });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
}

export async function getDocument(req: Request, res: Response) {
  try {
    const document = await getDocumentById(req.params.id as string, req.user!.orgId);
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }
    res.status(200).json({ document });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch document' });
  }
}
