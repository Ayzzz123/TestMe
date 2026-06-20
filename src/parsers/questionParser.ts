import type { Question, QuestionType } from '../types'

export function parseQuestions(rawText: string): Question[] {
  const questions: Question[] = []

  // 清理文本：移除分页符和多余空白
  const cleaned = rawText
    .replace(/\f/g, '\n')
    // 移除重复的文档标题行
    .replace(/航空电子系统Ⅰ\s*作业题目与答案汇总/g, '')
    // 移除作业头部行
    .replace(/^作业\s*\d+.*$/gm, '')
    // 移除题量行
    .replace(/^题量.*$/gm, '')
    // 移除题型分类标签行（独立的 "单选题", "多选题", "判断题" 行）
    .replace(/^(单选题|多选题|判断题)\s*$/gm, '')
    // 移除题目行前面的题型标签前缀（如 "单选题 1." → "1."）
    .replace(/^(单选题|多选题|判断题|填空题|简答题)\s+(?=\d+\.\s*\[)/gm, '')
    // 修复合并行：在 "✅ 正确答案: X N. [" 之间插入换行
    .replace(/(✅\s*正确答案\s*[:：]\s*\S+)\s+(\d+\.\s*\[)/g, '$1\n$2')
    // 修复合并行：在 "答案: X N. [" 之间插入换行
    .replace(/(答案\s*[:：]\s*\S+)\s+(\d+\.\s*\[)/g, '$1\n$2')

  // 按题号分割：匹配 N. [xxx] 格式（方括号内容可为空）
  const questionRegex = /(?:^|\n)\s*(\d+)\.\s*\[([^\]]*)\]\s*/gm
  const blocks: { index: number; number: string; typeTag: string; text: string }[] = []
  let match: RegExpExecArray | null
  let lastIndex = 0

  while ((match = questionRegex.exec(cleaned)) !== null) {
    if (blocks.length > 0) {
      blocks[blocks.length - 1].text = cleaned.slice(lastIndex, match.index)
    }
    blocks.push({ index: match.index, number: match[1], typeTag: match[2].trim(), text: '' })
    lastIndex = match.index + match[0].length
  }
  // 最后一块
  if (blocks.length > 0) {
    blocks[blocks.length - 1].text = cleaned.slice(lastIndex)
  }

  let qIndex = 0
  for (const block of blocks) {
    qIndex++
    const body = block.text

    // 1. 从标签确定题型
    const type = typeFromTag(block.typeTag)

    // 2. 提取答案
    const answer = extractAnswer(body)

    // 3. 提取选项
    const options = extractOptions(body)

    // 4. 提取题干（类型标签后的内容，去掉选项和答案）
    const stem = extractStem(body, block.typeTag)

    // 5. 如果标签没有明确题型，从答案和选项推断
    const finalType = type !== 'single' ? type : inferType(stem, options, answer)

    // 6. 判断题特殊处理：答案可能是 "对"/"错"
    const finalAnswer = normalizeAnswer(answer, finalType, options)

    questions.push({
      id: `q${qIndex}`,
      type: finalType,
      stem,
      options: finalType === 'short-answer' ? [] : options,
      answer: finalAnswer,
      explanation: '',
      chapter: '',
      score: 5,
    })
  }

  return questions
}

function typeFromTag(tag: string): QuestionType {
  if (tag.includes('单选')) return 'single'
  if (tag.includes('多选')) return 'multiple'
  if (tag.includes('判断')) return 'true-false'
  if (tag.includes('填空')) return 'fill-blank'
  if (tag.includes('简答')) return 'short-answer'
  return 'single' // 默认，后续由 inferType 推断
}

function extractAnswer(body: string): string {
  // 优先匹配 "✅ 正确答案: X" 格式
  const checkmarkRegex = /✅\s*正确答案\s*[:：]\s*(.+?)(?:\s*$|$)/m
  const cm = checkmarkRegex.exec(body)
  if (cm) return cm[1].trim()

  // 然后匹配 "答案: X" 格式
  const answerRegex = /答案\s*[:：]\s*(.+?)(?:\s*$|$)/m
  const am = answerRegex.exec(body)
  if (am) return am[1].trim()

  // 回退：纯 ": X" 格式
  const fallbackRegex = /^[ \t]*:\s*([^\n\r]+?)\s*$/m
  const fm = fallbackRegex.exec(body)
  if (fm) return fm[1].trim()

  return ''
}

function extractOptions(body: string): string[] {
  // 先去掉 ✅ 正确答案 部分，避免干扰选项提取
  const cleanBody = body.replace(/✅\s*正确答案\s*[:：].*$/, '').trim()

  const options: string[] = []

  // 策略：找到所有 [A-E]. 的位置，按位置排序，然后提取每段之间的文本
  const markerRegex = /([A-E])\.\s*/g
  const markers: { letter: string; index: number }[] = []
  let m: RegExpExecArray | null
  while ((m = markerRegex.exec(cleanBody)) !== null) {
    markers.push({ letter: m[1], index: m.index })
  }

  // 如果没有找到标记，回退到行格式
  if (markers.length === 0) {
    return options
  }

  // 按索引排序
  markers.sort((a, b) => a.index - b.index)

  // 提取每个选项的文本：从当前 marker 后到下一个 marker 前（或文本末尾）
  for (let i = 0; i < markers.length; i++) {
    const start = markers[i].index + 2  // 跳过 "A." (2 chars)
    const end = i < markers.length - 1 ? markers[i + 1].index : cleanBody.length
    const text = cleanBody.slice(start, end).trim()
    options.push(text)
  }

  return options
}

function extractStem(body: string, typeTag: string): string {
  // 找到第一个 A. 选项的位置
  const optionStart = body.search(/[A-E]\.\s*/)
  // 找到 ✅ 答案的位置
  const answerStart = body.search(/✅/)

  let stemEnd = body.length
  if (optionStart >= 0) stemEnd = Math.min(stemEnd, optionStart)
  if (answerStart >= 0) stemEnd = Math.min(stemEnd, answerStart)

  let stem = body.slice(0, stemEnd)

  // 清理：移除题号行残留、题型标签、纯数字行
  stem = stem
    .replace(/^\s*\d+\.\s*\[[^\]]*\]\s*/, '')  // 去除前面的题号标签
    .replace(/\s+/g, ' ')
    .trim()

  return stem
}

function normalizeAnswer(answer: string, type: QuestionType, options: string[]): string {
  // 判断题：如果答案是 "对" 或 "错"，映射到 A/B
  if (type === 'true-false') {
    if (answer === '对') return 'A'
    if (answer === '错') return 'B'
  }
  return answer
}

function inferType(stem: string, options: string[], answer: string): QuestionType {
  const hasBlank = /\([\s　]*\)|（[\s　]*）/.test(stem)

  const isSingleLetter = /^[A-Ea-e]$/.test(answer.trim())
  const isMultiLetter = /^[A-Ea-e]{2,5}$/.test(answer.trim())

  if (options.length === 2 && isSingleLetter) {
    return 'true-false'
  }

  if (isMultiLetter && options.length >= 3) {
    return 'multiple'
  }

  if (isSingleLetter && options.length >= 3 && !hasBlank) {
    return 'single'
  }

  if (hasBlank) {
    return 'fill-blank'
  }

  if (!answer || answer.length > 5 || options.length === 0) {
    return 'short-answer'
  }

  return options.length > 0 ? 'single' : 'short-answer'
}
