import { useState, useCallback, useRef } from 'react'
import type { Question, GradingResult } from '../types'
import { QuestionCard } from './QuestionCard'
import { AnswerSheet } from './AnswerSheet'
import { ProgressBar } from './ProgressBar'
import { useQuiz } from '../hooks/useQuiz'
import { gradeAll } from '../utils/grading'
import { clearProgress } from '../utils/storage'

interface Props {
  questions: Question[]
  onFinish: (results: GradingResult[], totalScore: number, maxScore: number) => void
}

export function QuizPage({ questions, onFinish }: Props) {
  const {
    userAnswers,
    currentIndex,
    setCurrentIndex,
    setAnswer,
    hasAnswer,
    answeredCount,
    totalCount,
    startQuiz,
  } = useQuiz()

  const [showAnswerSheet, setShowAnswerSheet] = useState(false)
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false)
  const initialized = useRef(false)

  // 初始化题目（仅一次）
  if (!initialized.current && questions.length > 0) {
    startQuiz(questions)
    initialized.current = true
  }

  const currentQuestion = questions[currentIndex]
  const isLast = currentIndex === questions.length - 1
  const isFirst = currentIndex === 0

  const goNext = useCallback(() => {
    if (isLast) {
      const unanswered = questions.filter(q => !hasAnswer(q.id)).length
      if (unanswered > 0) {
        setShowSubmitConfirm(true)
      } else {
        handleSubmit()
      }
    } else {
      setCurrentIndex(currentIndex + 1)
    }
  }, [isLast, currentIndex, questions, hasAnswer])

  const goPrev = useCallback(() => {
    if (!isFirst) setCurrentIndex(currentIndex - 1)
  }, [isFirst, currentIndex])

  const handleSubmit = useCallback(() => {
    const { results, totalScore, maxScore } = gradeAll(questions, userAnswers)
    clearProgress()
    onFinish(results, totalScore, maxScore)
  }, [questions, userAnswers, onFinish])

  // 键盘快捷键
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') goPrev()
    if (e.key === 'ArrowRight') goNext()
    if (e.ctrlKey && e.key === 'Enter') {
      if (isLast) handleSubmit()
      else goNext()
    }
  }, [goPrev, goNext, isLast, handleSubmit])

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">没有题目</p>
      </div>
    )
  }

  const unanswered = questions.filter(q => !hasAnswer(q.id)).length

  return (
    <div className="min-h-screen bg-gray-50 flex" onKeyDown={handleKeyDown} tabIndex={-1}>
      {/* 桌面端答题卡侧边栏 */}
      <aside className="hidden md:block w-72 bg-white border-r border-gray-200 p-4 overflow-y-auto flex-shrink-0">
        <AnswerSheet
          questions={questions}
          currentIndex={currentIndex}
          hasAnswer={hasAnswer}
          onJump={setCurrentIndex}
        />
      </aside>

      {/* 主答题区 */}
      <main className="flex-1 flex flex-col max-w-3xl mx-auto w-full p-4 md:p-8">
        {/* 顶部信息 */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-500">
            第 {currentIndex + 1} 题 / 共 {totalCount} 题
          </span>
          <button
            onClick={() => setShowAnswerSheet(true)}
            className="md:hidden text-sm px-3 py-1 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
          >
            📋 答题卡 ({answeredCount}/{totalCount})
          </button>
        </div>

        <ProgressBar current={currentIndex} total={totalCount} />

        {/* 题目 */}
        <div className="flex-1 mt-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <QuestionCard
              question={currentQuestion}
              userAnswer={userAnswers[currentQuestion.id] || ''}
              onAnswer={answer => setAnswer(currentQuestion.id, answer)}
            />
          </div>
        </div>

        {/* 底部导航 */}
        <div className="flex items-center justify-between mt-6 pb-4">
          <button
            onClick={goPrev}
            disabled={isFirst}
            className={`px-5 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
              isFirst
                ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            ← 上一题
          </button>

          {isLast ? (
            <button
              onClick={goNext}
              className="px-6 py-2.5 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors"
            >
              提交答卷
            </button>
          ) : (
            <button
              onClick={goNext}
              className="px-6 py-2.5 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
            >
              下一题 →
            </button>
          )}
        </div>
      </main>

      {/* 移动端答题卡抽屉 */}
      {showAnswerSheet && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowAnswerSheet(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-4 max-h-[70vh] overflow-y-auto">
            <AnswerSheet
              questions={questions}
              currentIndex={currentIndex}
              hasAnswer={hasAnswer}
              onJump={i => { setCurrentIndex(i); setShowAnswerSheet(false) }}
              onClose={() => setShowAnswerSheet(false)}
            />
          </div>
        </div>
      )}

      {/* 提交确认弹窗 */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowSubmitConfirm(false)} />
          <div className="relative bg-white rounded-xl p-6 max-w-sm mx-4 shadow-xl">
            <h3 className="font-bold text-gray-800 mb-2">确认提交</h3>
            <p className="text-gray-600 text-sm mb-6">
              还有 {unanswered} 题未作答，确定提交吗？提交后未答题将计 0 分。
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowSubmitConfirm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
              >
                继续答题
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm hover:bg-emerald-600"
              >
                确定提交
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
