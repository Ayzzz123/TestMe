import { useState, useCallback } from 'react'
import type { Question, GradingResult, AppPage } from './types'
import { UploadPage } from './components/UploadPage'
import { QuizPage } from './components/QuizPage'
import { ResultPage } from './components/ResultPage'

export default function App() {
  const [page, setPage] = useState<AppPage>('upload')
  const [questions, setQuestions] = useState<Question[]>([])
  const [results, setResults] = useState<GradingResult[]>([])
  const [totalScore, setTotalScore] = useState(0)
  const [maxScore, setMaxScore] = useState(0)

  const handleQuestionsLoaded = useCallback((q: Question[]) => {
    setQuestions(q)
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

  if (page === 'upload') {
    return <UploadPage onQuestionsLoaded={handleQuestionsLoaded} />
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
      onRestart={handleRestart}
    />
  )
}
