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
    setQuestions(q)
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
