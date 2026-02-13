import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export const extractText = async (fileBuffer, mimeType) => {
  const type = (mimeType || '').toLowerCase();
  
  try {
    // --- PDF ---
    if (type.includes('pdf')) {
      console.log('📄 Parsing PDF...');
      const { PDFParse } = await import('pdf-parse');
      const uint8 = new Uint8Array(fileBuffer);
      const parser = new PDFParse(uint8);
      const data = await parser.getText();
      const text = data.pages.map(p => p.text).join('\n').trim();
      console.log(`✅ Extracted ${text.length} characters from PDF`);
      return text;
    }
    
    // --- DOCX ---
    if (type.includes('word') || type.includes('docx') || type.includes('officedocument')) {
      console.log('📄 Parsing DOCX...');
      const mammoth = await import('mammoth');
      const fn = mammoth.default?.extractRawText || mammoth.extractRawText;
      const result = await fn({ buffer: fileBuffer });
      const text = (result.value || '').trim();
      console.log(`✅ Extracted ${text.length} characters from DOCX`);
      return text;
    }

    // --- DOC (legacy) ---
    if (type.includes('msword') || type.includes('doc')) {
      console.log('📄 Parsing DOC...');
      const mammoth = await import('mammoth');
      const fn = mammoth.default?.extractRawText || mammoth.extractRawText;
      const result = await fn({ buffer: fileBuffer });
      const text = (result.value || '').trim();
      console.log(`✅ Extracted ${text.length} characters from DOC`);
      return text;
    }

    console.warn(`⚠️  Unsupported file type: ${mimeType}`);
    return '';
  } catch (error) {
    console.error('❌ Text extraction error:', error.message);
    throw new Error(`Failed to extract text: ${error.message}`);
  }
};