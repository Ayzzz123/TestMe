import type { Question, GradingResult } from '../types'
import { extractKeywords, keywordCoverage } from './similarity'

export function gradeQuestion(question: Question, userAnswer: string): GradingResult {
  const trimmed = userAnswer.trim()
  const maxScore = question.score

  switch (question.type) {
    case 'single':
    case 'true-false':
      return {
        questionId: question.id,
        isCorrect: trimmed.toUpperCase() === question.answer.toUpperCase(),
        isPartial: false,
        userAnswer: trimmed,
        correctAnswer: question.answer,
        earnedScore: trimmed.toUpperCase() === question.answer.toUpperCase() ? maxScore : 0,
        maxScore,
      }

    case 'multiple': {
      const userSet = new Set(trimmed.toUpperCase().split('').sort())
      const answerSet = new Set(question.answer.toUpperCase().split('').sort())
      const hasWrong = [...userSet].some(c => !answerSet.has(c))
      const hasAll = [...answerSet].every(c => userSet.has(c))

      if (hasAll && !hasWrong) {
        return {
          questionId: question.id,
          isCorrect: true,
          isPartial: false,
          userAnswer: trimmed,
          correctAnswer: question.answer,
          earnedScore: maxScore,
          maxScore,
        }
      } else if (hasWrong) {
        return {
          questionId: question.id,
          isCorrect: false,
          isPartial: false,
          userAnswer: trimmed,
          correctAnswer: question.answer,
          earnedScore: 0,
          maxScore,
        }
      } else {
        // 漏选
        return {
          questionId: question.id,
          isCorrect: false,
          isPartial: true,
          userAnswer: trimmed,
          correctAnswer: question.answer,
          earnedScore: maxScore / 2,
          maxScore,
        }
      }
    }

    case 'fill-blank':
      return {
        questionId: question.id,
        isCorrect: trimmed === question.answer.trim(),
        isPartial: false,
        userAnswer: trimmed,
        correctAnswer: question.answer,
        earnedScore: trimmed === question.answer.trim() ? maxScore : 0,
        maxScore,
      }

    case 'short-answer': {
      const coverage = keywordCoverage(extractKeywords(question.answer), trimmed)
      if (coverage >= 0.8) {
        return { questionId: question.id, isCorrect: true, isPartial: false, userAnswer: trimmed, correctAnswer: question.answer, earnedScore: maxScore, maxScore, coverage }
      } else if (coverage >= 0.5) {
        return { questionId: question.id, isCorrect: false, isPartial: true, userAnswer: trimmed, correctAnswer: question.answer, earnedScore: Math.round(maxScore * 0.7 * 10) / 10, maxScore, coverage }
      } else if (coverage >= 0.3) {
        return { questionId: question.id, isCorrect: false, isPartial: true, userAnswer: trimmed, correctAnswer: question.answer, earnedScore: Math.round(maxScore * 0.4 * 10) / 10, maxScore, coverage }
      } else {
        return { questionId: question.id, isCorrect: false, isPartial: false, userAnswer: trimmed, correctAnswer: question.answer, earnedScore: 0, maxScore, coverage }
      }
    }

    default:
      return {
        questionId: question.id,
        isCorrect: false,
        isPartial: false,
        userAnswer: trimmed,
        correctAnswer: question.answer,
        earnedScore: 0,
        maxScore,
      }
  }
}

export interface GradeAllResult {
  results: GradingResult[]
  totalScore: number
  maxScore: number
  correctCount: number
  partialCount: number
  wrongCount: number
}

export function gradeAll(questions: Question[], userAnswers: Record<string, string>): GradeAllResult {
  const results = questions.map(q => gradeQuestion(q, userAnswers[q.id] || ''))
  const totalScore = results.reduce((sum, r) => sum + r.earnedScore, 0)
  const maxScore = questions.reduce((sum, q) => sum + q.score, 0)
  const correctCount = results.filter(r => r.isCorrect).length
  const partialCount = results.filter(r => r.isPartial).length
  const wrongCount = results.length - correctCount - partialCount

  return { results, totalScore, maxScore, correctCount, partialCount, wrongCount }
}
