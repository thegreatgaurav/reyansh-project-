import { Request, Response } from 'express';

export async function createPresignedUpload(_req: Request, res: Response): Promise<void> {
  res.status(200).json({
    uploadUrl: 'https://storage.example.com/presigned-url',
    path: 'documents/uploaded-file.pdf',
    expiresInSeconds: 300
  });
}
