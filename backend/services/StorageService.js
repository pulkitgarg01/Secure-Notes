import fs from 'fs';
import path from 'path';
import multer from 'multer';

/**
 * StorageService abstracts file operations (upload, read, delete, stats).
 * This makes it trivial to swap out the local file system for cloud storage
 * (e.g., AWS S3, Cloudinary) in the future without modifying application routes.
 */
class StorageService {
  constructor() {
    this.uploadDir = process.env.UPLOAD_DIR || 'uploads';
    this.ensureUploadDir();
  }

  ensureUploadDir() {
    const fullPath = path.resolve(process.cwd(), this.uploadDir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
  }

  _resolvePath(filePath) {
    if (path.isAbsolute(filePath)) return filePath;
    if (filePath.startsWith(this.uploadDir + path.sep) || filePath.startsWith(this.uploadDir + '/')) {
      return path.resolve(process.cwd(), filePath);
    }
    return path.resolve(process.cwd(), this.uploadDir, filePath);
  }

  /**
   * Returns a multer instance configured for the storage backend.
   * @param {Object} options Options like maxMb and fileFilter
   * @returns {multer.Multer}
   */
  getUploader(options = {}) {
    const { maxMb = 2, fileFilter } = options;

    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, this.uploadDir);
      },
      filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const name = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '_');
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `${name}-${uniqueSuffix}${ext}`);
      }
    });

    return multer({
      storage,
      fileFilter,
      limits: { fileSize: maxMb * 1024 * 1024 }
    });
  }

  /**
   * Deletes a file from storage.
   * @param {string} filePath 
   * @returns {boolean} True if deleted, false otherwise.
   */
  async deleteFile(filePath) {
    if (!filePath) return false;
    try {
      const fullPath = this._resolvePath(filePath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        return true;
      }
      return false;
    } catch (e) {
      console.error('StorageService error deleting file:', e);
      return false;
    }
  }

  /**
   * Checks if a file exists.
   * @param {string} filePath 
   * @returns {boolean}
   */
  async fileExists(filePath) {
    try {
      return fs.existsSync(this._resolvePath(filePath));
    } catch {
      return false;
    }
  }

  /**
   * Gets the file size in bytes.
   * @param {string} filePath 
   * @returns {number} Size in bytes.
   */
  async getFileSize(filePath) {
    try {
      const stats = fs.statSync(this._resolvePath(filePath));
      return stats.size;
    } catch {
      return 0;
    }
  }

  /**
   * Returns a readable stream for the file.
   * @param {string} filePath 
   * @returns {import('fs').ReadStream}
   */
  async getFileStream(filePath) {
    return fs.createReadStream(this._resolvePath(filePath));
  }

  /**
   * Reads a file completely into memory and returns a Buffer.
   * @param {string} filePath 
   * @returns {Promise<Buffer>}
   */
  async getFileBuffer(filePath) {
    return fs.promises.readFile(this._resolvePath(filePath));
  }
}

export default new StorageService();
