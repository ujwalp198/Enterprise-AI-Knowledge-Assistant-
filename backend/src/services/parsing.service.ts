import fs from 'fs';
import pdfParse from 'pdf-parse';

export interface ParsedPage {
  pageNumber: number;
  text: string;
}

export async function parsePdf(filePath: string): Promise<ParsedPage[]> {
  const dataBuffer = fs.readFileSync(filePath);

  const pages: ParsedPage[] = [];

  // Use pagerender to capture text per-page so chunk citations
  // can reference the exact page number later ("Employee Handbook, Page 13")
  const options = {
    pagerender: (pageData: any) => {
      return pageData.getTextContent().then((textContent: any) => {
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        pages.push({ pageNumber: pages.length + 1, text: pageText });
        return pageText;
      });
    },
  };

  // Fix: pdfParse returns a promise, we need to await it properly
  await pdfParse(dataBuffer, options);

  return pages;
}
