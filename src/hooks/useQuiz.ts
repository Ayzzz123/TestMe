import { useState, useCallback, useEffect } from 'react'
import type { Question, QuizSession } from '../types'
import { saveProgress, loadProgress, clearProgress } from '../utils/storage'

interface UseQuizReturn {
  questions: Question[]
  userAnswers: Record<string, string>
  currentIndex: number
  setCurrentIndex: (i: number) => void
  setAnswer: (questionId: string, answer: string) => void
  hasAnswer: (questionId: string) => boolean
  answeredCount: number
  totalCount: number
  startQuiz: (questions: Question[]) => void
  resetQuiz: () => void
  isReady: boolean
}

export function useQuiz(): UseQuizReturn {
  const [questions, setQuestions] = useState<Question[]>([])
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({})
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isReady, setIsReady] = useState(false)

  // 恢复上次进度（仅在 mount 时）
  useEffect(() => {
    const saved = loadProgress()
    if (saved && saved.questions.length > 0 && !saved.submitted) {
      setQuestions(saved.questions)
      setUserAnswers(saved.userAnswers)
      setCurrentIndex(saved.currentIndex)
      setIsReady(true)
    }
  }, [])

  // 自动保存进度（当答题状态变化时）
  useEffect(() => {
    if (questions.length > 0) {
      const session: QuizSession = {
        questions,
        userAnswers,
        currentIndex,
        startTime: Date.now(),
        submitted: false,
      }
      saveProgress(session)
    }
  }, [questions, userAnswers, currentIndex])

  const startQuiz = useCallback((q: Question[]) => {
    clearProgress()
    setQuestions(q)
    setUserAnswers({})
    setCurrentIndex(0)
    setIsReady(true)
  }, [])

  const resetQuiz = useCallback(() => {
    setUserAnswers({})
    setCurrentIndex(0)
  }, [])

  const setAnswer = useCallback((questionId: string, answer: string) => {
    setUserAnswers(prev => ({ ...prev, [questionId]: answer }))
  }, [])

  const hasAnswer = useCallback((questionId: string): boolean => {
    return userAnswers[questionId] !== undefined && userAnswers[questionId].trim() !== ''
  }, [userAnswers])

  const answeredCount = questions.filter(q => hasAnswer(q.id)).length

  return {
    questions,
    userAnswers,
    currentIndex,
    setCurrentIndex,
    setAnswer,
    hasAnswer,
    answeredCount,
    totalCount: questions.length,
    startQuiz,
    resetQuiz,
    isReady,
  }
}
