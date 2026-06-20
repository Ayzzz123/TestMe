import * as pdfjsLib from 'pdfjs-dist'

// 设置 worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString()

export async function extractPdfText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()

  // 使用 CMap 支持中日韩文字的正确解码
  const cMapUrl = new URL('pdfjs-dist/cmaps/', import.meta.url).toString()

  const pdf = await pdfjsLib.getDocument({
    data: arrayBuffer,
    cMapUrl,
    cMapPacked: true,
    useSystemFonts: false,
  }).promise

  const pages: string[] = []
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent({
      includeMarkedContent: true,
      disableNormalization: false,
    })
    const text = content.items
      .map((item: any) => item.str)
      .join(' ')
    pages.push(text)
  }

  return pages.join('\n')
}
