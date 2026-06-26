import { PDFParse } from "pdf-parse";

export const extractTextFromPDF = async (fileBuffer) => {
  // pdf-parse v2 exposes a PDFParse class (no default export).
  const parser = new PDFParse({ data: fileBuffer });
  try {
    const result = await parser.getText();
    return result.text;
  } finally {
    await parser.destroy();
  }
};
