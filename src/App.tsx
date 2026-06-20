import { useState, useCallback } from 'react'
import type { Question, GradingResult, AppPage } from './types'
import { HomePage } from './components/HomePage'
import { QuizPage } from './components/QuizPage'
import { ResultPage } from './components/ResultPage'

export default function App() {
  const [page, setPage] = useState<AppPage>('upload')
  const [questions, setQuestions] = useState<Question[]>([])
  const [results, setResults] = useState<GradingResult[]>([])
  const [totalScore, setTotalScore] = useState(0)
  const [maxScore, setMaxScore] = useState(0)
  const [examTitle, setExamTitle] = useState('')

  const handleStartQuiz = useCallback((q: Question[], title: string) => {
    // 每题分值 = 100 / 题数，保留两位小数；最后一题补齐差额确保满分精确 100
    const raw = 100 / q.length
    const perQuestion = Math.floor(raw * 100) / 100
    const remainder = Math.round((100 - perQuestion * (q.length - 1)) * 100) / 100
    const normalized = q.map((item, i) => ({
      ...item,
      score: i === q.length - 1 ? remainder : perQuestion,
    }))
    setQuestions(normalized)
    setExamTitle(title)
    setPage('quiz')
  }, [])

  const handleFinish = useCallback((r: GradingResult[], ts: number, ms: number) => {
    setResults(r)
    setTotalScore(ts)
    setMaxScore(ms)
    setPage('result')
  }, [])

  const handleRestart = useCallback(() => {
    setPage('quiz')
  }, [])

  const handleGoHome = useCallback(() => {
    setPage('upload')
  }, [])

  if (page === 'upload') {
    return <HomePage onStartQuiz={handleStartQuiz} />
  }

  if (page === 'quiz') {
    return <QuizPage questions={questions} onFinish={handleFinish} />
  }

  return (
    <ResultPage
      results={results}
      totalScore={totalScore}
      maxScore={maxScore}
      questions={questions}
      examTitle={examTitle}
      onRestart={handleRestart}
      onGoHome={handleGoHome}
    />
  )
}
