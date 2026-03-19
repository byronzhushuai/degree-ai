import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get('file') as File;

  if (!file) {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  try {
    const PDFParser = (await import('pdf2json')).default;
    const pdfParser = new PDFParser();

    const text = await new Promise<string>((resolve, reject) => {
      pdfParser.on('pdfParser_dataReady', (pdfData: any) => {
        const pages = pdfData.Pages || [];
        const fullText = pages
          .map((page: any) =>
            (page.Texts || [])
              .map((t: any) => decodeURIComponent(t.R?.[0]?.T || ''))
              .join(' ')
          )
          .join('\n');
        resolve(fullText);
      });
      pdfParser.on('pdfParser_dataError', reject);
      pdfParser.parseBuffer(buffer);
    });

    return NextResponse.json({ text });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to parse PDF' }, { status: 500 });
  }
}