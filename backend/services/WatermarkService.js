import { PDFDocument, rgb, degrees } from 'pdf-lib';

class WatermarkService {
  /**
   * Applies a diagonal, semi-transparent repeating watermark to a PDF buffer.
   * @param {Buffer} pdfBuffer The original PDF file buffer.
   * @param {Object} user The user object (name, email, usn, role).
   * @param {Object} resource Optional resource context.
   * @returns {Promise<Buffer>} The watermarked PDF buffer.
   */
  async applyWatermark(pdfBuffer, user, resource = {}) {
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const pages = pdfDoc.getPages();

    // Format the watermark text
    const timestamp = new Date().toLocaleString('en-US', { timeZone: 'UTC' }) + ' UTC';
    const lines = [
      user.name,
      user.usn ? `USN: ${user.usn}` : `Role: ${user.role}`,
      user.email,
      `Generated: ${timestamp}`,
    ];
    if (resource.name) {
      lines.push(`Resource: ${resource.name}`);
    }

    const watermarkText = lines.join('\n');

    for (const page of pages) {
      const { width, height } = page.getSize();
      const fontSize = 16;
      const opacity = 0.1; // 10% opacity
      const angle = degrees(45);
      const color = rgb(0, 0, 0); // Black (inverts to white in dark mode)

      // Create a grid of watermarks (e.g., 2 columns, 3 rows)
      const cols = 2;
      const rows = 3;
      
      const xSpacing = width / cols;
      const ySpacing = height / rows;

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          page.drawText(watermarkText, {
            x: (i * xSpacing) + 20,
            y: (j * ySpacing) + 40,
            size: fontSize,
            color: color,
            opacity: opacity,
            rotate: angle,
            lineHeight: fontSize * 1.2,
          });
        }
      }
    }

    const watermarkedBytes = await pdfDoc.save();
    return Buffer.from(watermarkedBytes);
  }
}

export default new WatermarkService();
