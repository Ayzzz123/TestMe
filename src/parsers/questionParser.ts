import type { Question, QuestionType } from '../types'

export function parseQuestions(rawText: string): Question[] {
  const questions: Question[] = []

  // 按题号边界分割：匹配 "数字. [" 开头的行
  const questionRegex = /(?:^|\n)\s*(\d+)\.\s*\[([^\]]*)\]\s*([\s\S]*?)(?=\n\s*\d+\.\s*\[|$)/g
  let match: RegExpExecArray | null

  let qIndex = 0
  while ((match = questionRegex.exec(rawText)) !== null) {
    qIndex++
    const body = match[3] || ''

    // 提取题干
    const stem = extractStem(match[0])

    // 提取选项
    const options = extractOptions(body)

    // 提取答案
    const answer = extractAnswer(body)

    // 推断题型
    const type = inferType(stem, options, answer)

    questions.push({
      id: `q${qIndex}`,
      type,
      stem,
      options: type === 'short-answer' ? [] : options,
      answer,
      explanation: '',
      chapter: '',
      score: 5,
    })
  }

  return questions
}

function extractStem(block: string): string {
  const lines = block.split('\n')
  const stemLines: string[] = []

  for (const line of lines) {
    const trimmed = line.trim()
    // 跳过题号行
    if (/^\d+\.\s*\[/.test(trimmed)) {
      const stemPart = trimmed.replace(/^\d+\.\s*\[[^\]]*\]\s*/, '').trim()
      if (stemPart) stemLines.push(stemPart)
      continue
    }
    // 跳过选项行
    if (/^[A-D]\.\s/.test(trimmed)) continue
    // 跳过答案行（含"答案"前缀的）
    if (/^答案[:：]/.test(trimmed)) continue
    // 跳过答案行（只有冒号的格式 : A, : CD, : 等）
    if (/^\s*:\s*[A-D]*\s*$/.test(line)) continue
    // 跳过章节头行（如 "1: -"）
    if (/^\d+:\s*-/.test(trimmed)) continue
    // 跳过统计行
    if (/^:\s*\d+/.test(trimmed) || /^题目数量/.test(trimmed)) continue
    // 跳过章节行
    if (/^第\d+章/.test(trimmed)) continue

    if (trimmed) stemLines.push(trimmed)
  }

  return stemLines.join(' ').trim()
}

function extractOptions(body: string): string[] {
  const options: string[] = []
  const optionRegex = /^\s*([A-D])\.\s*(.*)/gm
  let m: RegExpExecArray | null
  while ((m = optionRegex.exec(body)) !== null) {
    options.push(m[2].trim())
  }
  return options
}

function extractAnswer(body: string): string {
  // 优先匹配 "答案: X" 格式
  const answerRegex = /答案[:：]\s*(.+)/i
  const m = answerRegex.exec(body)
  if (m) return m[1].trim()

  // 回退匹配纯 ": X" 格式（中文"答案"可能在 PDF 提取中丢失）
  // 匹配行末的 ": A", ": CD", ": ABCD" 或 ": " 空答案
  const fallbackRegex = /^[ \t]*:\s*([A-Da-d]*)\s*$/m
  const fm = fallbackRegex.exec(body)
  if (fm) return fm[1].trim()

  return ''
}

function inferType(stem: string, options: string[], answer: string): QuestionType {
  const hasBlank = /\([\s　]*\)|（[\s　]*）/.test(stem)

  const isSingleLetter = /^[A-Da-d]$/.test(answer.trim())
  const isMultiLetter = /^[A-Da-d]{2,4}$/.test(answer.trim())

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

  // 默认
  return options.length > 0 ? 'single' : 'short-answer'
}
