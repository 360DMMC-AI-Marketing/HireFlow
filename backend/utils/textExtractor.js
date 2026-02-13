import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Fallback: Extract readable text strings directly from a PDF buffer.
 * Works on many PDFs where the structured parser fails (corrupted XRef, invalid root, etc.)
 */
function extractTextFromPDFBuffer(buffer) {
  const str = buffer.toString('latin1');
  const textChunks = [];
  
  // Extract text between BT (Begin Text) and ET (End Text) operators
  const btEtRegex = /BT\s([\s\S]*?)ET/g;
  let match;
  while ((match = btEtRegex.exec(str)) !== null) {
    const block = match[1];
    // Extract strings in parentheses: Tj and ' operators
    const tjRegex = /\(([^)]*)\)\s*Tj/g;
    let tjMatch;
    while ((tjMatch = tjRegex.exec(block)) !== null) {
      const decoded = tjMatch[1]
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '\r')
        .replace(/\\t/g, '\t')
        .replace(/\\\(/g, '(')
        .replace(/\\\)/g, ')')
        .replace(/\\\\/g, '\\');
      if (decoded.trim()) textChunks.push(decoded.trim());
    }
    // TJ operator: array of strings/numbers
    const tjArrayRegex = /\[([^\]]*)\]\s*TJ/gi;
    let arrMatch;
    while ((arrMatch = tjArrayRegex.exec(block)) !== null) {
      const inner = arrMatch[1];
      const innerStrRegex = /\(([^)]*)\)/g;
      let strMatch;
      let line = '';
      while ((strMatch = innerStrRegex.exec(inner)) !== null) {
        line += strMatch[1]
          .replace(/\\n/g, '\n')
          .replace(/\\r/g, '\r')
          .replace(/\\\(/g, '(')
          .replace(/\\\)/g, ')')
          .replace(/\\\\/g, '\\');
      }
      if (line.trim()) textChunks.push(line.trim());
    }
  }
  
  // Also try to find Unicode/hex strings common in modern PDFs
  const hexRegex = /<([0-9A-Fa-f\s]+)>\s*Tj/g;
  while ((match = hexRegex.exec(str)) !== null) {
    const hex = match[1].replace(/\s/g, '');
    let decoded = '';
    for (let i = 0; i < hex.length; i += 4) {
      const code = parseInt(hex.substring(i, i + 4), 16);
      if (code > 31 && code < 65535) decoded += String.fromCharCode(code);
    }
    if (decoded.trim()) textChunks.push(decoded.trim());
  }
  
  return textChunks.join(' ').replace(/\s+/g, ' ').trim();
}

export const extractText = async (fileBuffer, mimeType) => {
  const type = (mimeType || '').toLowerCase();
  
  try {
    // --- PDF ---
    if (type.includes('pdf')) {
      console.log('📄 Parsing PDF...');
      
      // Attempt 1: pdf-parse v2 (structured parsing)
      try {
        const { PDFParse } = await import('pdf-parse');
        const uint8 = new Uint8Array(fileBuffer);
        const parser = new PDFParse(uint8);
        const data = await parser.getText();
        const text = data.pages.map(p => p.text).join('\n').trim();
        if (text.length > 50) {
          console.log(`✅ Extracted ${text.length} characters from PDF (pdf-parse)`);
          return text;
        }
        console.warn('⚠️  pdf-parse returned very little text, trying fallback...');
      } catch (pdfParseError) {
        console.warn(`⚠️  pdf-parse failed: ${pdfParseError.message}, trying fallback...`);
      }
      
      // Attempt 2: Raw buffer text extraction (handles corrupted/non-standard PDFs)
      console.log('📄 Trying raw PDF text extraction...');
      const rawText = extractTextFromPDFBuffer(fileBuffer);
      if (rawText.length > 50) {
        console.log(`✅ Extracted ${rawText.length} characters from PDF (raw fallback)`);
        return rawText;
      }
      
      // Attempt 3: Last resort - extract any readable ASCII strings from buffer
      console.log('📄 Trying ASCII string extraction...');
      const asciiText = fileBuffer.toString('utf-8')
        .replace(/[^\x20-\x7E\n\r\t]/g, ' ')
        .replace(/\s{3,}/g, '\n')
        .split('\n')
        .filter(line => line.trim().length > 3 && /[a-zA-Z]{2,}/.test(line))
        .join('\n')
        .trim();
      
      if (asciiText.length > 50) {
        console.log(`✅ Extracted ${asciiText.length} characters from PDF (ASCII fallback)`);
        return asciiText;
      }
      
      console.error('❌ All PDF extraction methods failed - no readable text found');
      return '';
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