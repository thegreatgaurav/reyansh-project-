import sheetService from './sheetService';
import config from '../config/config';

class DocumentLibraryService {
  constructor() {
    this.sheetName = 'DocumentLibrary';
  }

  /* =========================
     BASIC SAFETY CHECK
     ========================= */

  async ensureSheetReadable() {
    const data = await sheetService.getSheetData(this.sheetName);
    if (!Array.isArray(data)) {
      throw new Error(
        'DocumentLibrary sheet is not readable. Make sure it exists and is shared with the logged-in Google account.'
      );
    }
    return true;
  }

  /* =========================
     UTILITIES
     ========================= */

  generateId(prefix = 'doc') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  }

  normalizePath(path = '/') {
    let p = String(path).trim().replace(/\\/g, '/').replace(/\/+/g, '/');
    if (!p.startsWith('/')) p = '/' + p;
    if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1);
    return p;
  }

  getCurrentUser() {
    return 'Current User'; // replace later with real auth user
  }

  /* =========================
     CORE READ
     ========================= */

  async getDocuments(path = '/') {
    await this.ensureSheetReadable();

    const normPath = this.normalizePath(path);
    const rows = await sheetService.getSheetData(this.sheetName);

    const folders = rows.filter(
      r =>
        r.type === 'folder' &&
        this.normalizePath(r.parentPath || '/') === normPath
    );

    const currentFolder = rows.find(
      r => r.type === 'folder' && this.normalizePath(r.path) === normPath
    );

    let files = [];
    if (currentFolder?.documents) {
      try {
        files = JSON.parse(currentFolder.documents) || [];
      } catch {
        files = [];
      }
    }

    return { folders, files };
  }

  /* =========================
     FOLDER OPS
     ========================= */

  async createFolder(parentPath, name) {
    await this.ensureSheetReadable();

    const path = this.normalizePath(parentPath);
    const fullPath = path === '/' ? `/${name}` : `${path}/${name}`;

    const existing = await this.getFolderByPath(fullPath);
    if (existing) return existing;

    const folder = {
      id: this.generateId('folder'),
      name,
      type: 'folder',
      path: fullPath,
      parentPath: path,
      level: fullPath.split('/').filter(Boolean).length,
      itemCount: 0,
      documents: '[]',
      createdBy: this.getCurrentUser(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await sheetService.appendRow(this.sheetName, folder);
    return folder;
  }

  async getFolderByPath(path) {
    const rows = await sheetService.getSheetData(this.sheetName);
    return rows.find(
      r => r.type === 'folder' && this.normalizePath(r.path) === this.normalizePath(path)
    );
  }

  /* =========================
     FILE OPS
     ========================= */

  async uploadFile(path, file) {
    await this.ensureSheetReadable();

    const folder = await this.getFolderByPath(path);
    if (!folder) {
      throw new Error(`Folder does not exist at ${path}`);
    }

    const fileId = await sheetService.uploadFile(file);

    const doc = {
      id: this.generateId('file'),
      name: file.name,
      fileId,
      mimeType: file.type,
      size: file.size,
      uploadedBy: this.getCurrentUser(),
      uploadedAt: new Date().toISOString()
    };

    let docs = [];
    try {
      docs = JSON.parse(folder.documents || '[]');
    } catch {
      docs = [];
    }

    docs.push(doc);

    const updated = {
      ...folder,
      documents: JSON.stringify(docs),
      itemCount: docs.length,
      updatedAt: new Date().toISOString()
    };

    const rowIndex = await this.getRowIndex(folder.id);
    await sheetService.updateRow(this.sheetName, rowIndex, updated);

    return doc;
  }

  /* =========================
     HELPERS
     ========================= */

  async getRowIndex(id) {
    const rows = await sheetService.getSheetData(this.sheetName);
    const idx = rows.findIndex(r => r.id === id);
    return idx === -1 ? null : idx + 2;
  }
}

export default new DocumentLibraryService();
