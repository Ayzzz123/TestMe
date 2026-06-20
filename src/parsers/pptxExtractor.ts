import JSZip from 'jszip'

export async function extractPptxText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()
  const zip = await JSZip.loadAsync(arrayBuffer)

  // 找到所有 slide XML 文件
  const slideFiles = Object.keys(zip.files)
    .filter(name => /^ppt\/slides\/slide\d+\.xml$/i.test(name))
    .sort((a, b) => {
      const na = parseInt(a.match(/slide(\d+)/i)?.[1] || '0')
      const nb = parseInt(b.match(/slide(\d+)/i)?.[1] || '0')
      return na - nb
    })

  const texts: string[] = []

  for (const slideFile of slideFiles) {
    const xmlContent = await zip.files[slideFile].async('text')
    // 提取所有 <a:t> 标签内的文本
    const textMatches = xmlContent.matchAll(/<a:t[^>]*>([^<]*)<\/a:t>/g)
    const slideTexts: string[] = []
    for (const m of textMatches) {
      if (m[1].trim()) slideTexts.push(m[1].trim())
    }
    if (slideTexts.length > 0) {
      texts.push(slideTexts.join('\n'))
    }
  }

  return texts.join('\n\n')
}
