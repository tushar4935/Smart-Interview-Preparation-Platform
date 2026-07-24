const fs = require('fs');
const pdfParse = require('pdf-parse');

// only PDFs are text-extractable for now. .doc/.docx still upload and store fine,
// they just can't drive the "practice from resume" flow.
// TODO: add mammoth if we start seeing a lot of docx uploads
const extractText = async (filePath, mimeType) => {
  const isPdf = mimeType === 'application/pdf' || filePath.toLowerCase().endsWith('.pdf');
  if (!isPdf) return '';
  try {
    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer);
    return (data.text || '').trim();
  } catch (err) {
    return '';
  }
};

module.exports = { extractText };
