const STOPWORDS = new Set([
  '的', '了', '是', '和', '或', '等', '在', '与', '及', '这', '那',
  '也', '就', '都', '而', '但', '把', '被', '从', '到', '对', '向',
  '其', '该', '所', '为', '以', '之', '不', '还', '有', '又', '要',
  '能', '会', '可', '着', '过', '去', '来', '中', '上', '下',
  'a', 'an', 'the', 'is', 'are', 'of', 'in', 'on', 'to', 'for',
])

export function extractKeywords(text: string): string[] {
  if (!text.trim()) return []

  const keywords: string[] = []
  const chars = [...text.trim()]

  for (let i = 0; i <= chars.length - 2; i++) {
    const bigram = chars.slice(i, i + 2).join('')
    // 跳过包含停用词的 bigram
    const hasStopword = [...bigram].some(ch => STOPWORDS.has(ch))
    if (!hasStopword) {
      keywords.push(bigram)
    }
  }

  // 去重
  return [...new Set(keywords)]
}

export function keywordCoverage(modelKeywords: string[], userText: string): number {
  if (modelKeywords.length === 0) return 0

  const userLower = userText.toLowerCase()
  let matched = 0

  for (const kw of modelKeywords) {
    if (userLower.includes(kw.toLowerCase())) {
      matched++
    }
  }

  return matched / modelKeywords.length
}

export function jaccardSimilarity(a: string, b: string): number {
  // 基于字符 bigram 的 Jaccard 相似度
  const bigramsA = getBigrams(a)
  const bigramsB = getBigrams(b)

  if (bigramsA.length === 0 && bigramsB.length === 0) return 1.0

  const setA = new Set(bigramsA)
  const setB = new Set(bigramsB)

  let intersection = 0
  for (const bg of setA) {
    if (setB.has(bg)) intersection++
  }

  const union = setA.size + setB.size - intersection
  return union === 0 ? 0 : intersection / union
}

function getBigrams(text: string): string[] {
  const cleaned = text.replace(/\s+/g, '')
  const bigrams: string[] = []
  for (let i = 0; i < cleaned.length - 1; i++) {
    bigrams.push(cleaned.substring(i, i + 2))
  }
  return bigrams
}

export function combinedSimilarity(modelAnswer: string, userAnswer: string): number {
  // 两个都为空 → 完全一致
  if (!modelAnswer.trim() && !userAnswer.trim()) return 1.0
  // 一个为空 → 完全不相似
  if (!modelAnswer.trim() || !userAnswer.trim()) return 0

  const keywords = extractKeywords(modelAnswer)
  const coverage = keywordCoverage(keywords, userAnswer)
  const jaccard = jaccardSimilarity(modelAnswer, userAnswer)
  return coverage * 0.6 + jaccard * 0.4
}
