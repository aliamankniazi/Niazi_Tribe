import { dbClient } from '../database/client';
import { createObjectCsvWriter } from 'csv-writer';
import path from 'path';
import fs from 'fs';
import archiver from 'archiver';

export const exportToCSV = async (data: any[], fields: string[], outputPath: string): Promise<void> => {
  const csvWriter = createObjectCsvWriter({
    path: outputPath,
    header: fields.map(field => ({ id: field, title: field }))
  });

  await csvWriter.writeRecords(data);
};

export const createZipArchive = (inputPath: string, outputPath: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outputPath);
    const archive = archiver('zip', {
      zlib: { level: 9 }
    });

    output.on('close', () => resolve());
    archive.on('error', err => reject(err));

    archive.pipe(output);
    archive.directory(inputPath, false);
    archive.finalize();
  });
};

export const exportUserData = async (): Promise<string> => {
  const exportDir = path.join(__dirname, '../exports');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const zipFile = path.join(exportDir, `export-${timestamp}.zip`);

  try {
    // Create export directory
    await fs.promises.mkdir(exportDir, { recursive: true });

    // Export users
    const users = await dbClient.query('SELECT * FROM users');
    await exportToCSV(users, ['id', 'email', 'name', 'createdAt'], path.join(exportDir, 'users.csv'));

    // Create zip archive
    await createZipArchive(exportDir, zipFile);

    // Clean up export directory
    await fs.promises.rm(exportDir, { recursive: true });

    return path.basename(zipFile);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Export failed: ${error.message}`);
    }
    throw new Error('Export failed with unknown error');
  }
}; 