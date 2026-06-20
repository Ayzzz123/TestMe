import { useState, useCallback, useRef } from 'react'
import type { Question, GradingResult } from '../types'
import { QuestionCard } from './QuestionCard'
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

  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [showMobileSheet, setShowMobileSheet] = useState(false)
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false)
  const initialized = useRef(false)

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

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">没有题目</p>
      </div>
    )
  }

  const unanswered = questions.filter(q => !hasAnswer(q.id)).length
  const pct = totalCount > 0 ? Math.round((answeredCount / totalCount) * 100) : 0

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* 桌面端可折叠侧边栏 */}
      <aside
        className={`hidden md:block bg-white border-r border-gray-200 flex-shrink-0 transition-all duration-300 overflow-hidden ${
          sidebarOpen ? 'w-64' : 'w-12'
        }`}
      >
        {sidebarOpen ? (
          <div className="p-3 h-full flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-gray-500">答题卡</span>
              <button
                onClick={() => setSidebarOpen(false)}
                className="w-6 h-6 rounded hover:bg-gray-100 flex items-center justify-center text-gray-400 text-sm"
              >
                ◀
              </button>
            </div>
            <div className="text-xs text-gray-400 mb-3">
              {answeredCount}/{totalCount} · {pct}%
            </div>
            <div className="flex-1 overflow-y-auto">
              <div className="flex flex-wrap gap-1.5">
                {questions.map((q, i) => {
                  const answered = hasAnswer(q.id)
                  const isCurrent = i === currentIndex
                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentIndex(i)}
                      className={`w-7 h-7 rounded text-xs font-medium transition-all flex-shrink-0 ${
                        isCurrent
                          ? 'bg-blue-500 text-white ring-2 ring-blue-200'
                          : answered
                            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                            : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                      }`}
                    >
                      {i + 1}
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-gray-100 flex gap-3 text-[10px] text-gray-400">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-100 border border-emerald-300" /> 已答</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-gray-100" /> 未答</span>
            </div>
          </div>
        ) : (
          <div className="p-2 flex flex-col items-center gap-3 pt-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="w-7 h-7 rounded hover:bg-gray-100 flex items-center justify-center text-gray-400 text-sm"
              title="展开答题卡"
            >
              ▶
            </button>
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-16 bg-gray-100 rounded-full relative overflow-hidden">
                <div
                  className="absolute bottom-0 left-0 right-0 bg-emerald-400 rounded-full transition-all"
                  style={{ height: `${pct}%` }}
                />
              </div>
              <span className="text-[10px] font-bold text-gray-500">{pct}%</span>
              <span className="text-[10px] text-gray-400">{answeredCount}/{totalCount}</span>
            </div>
          </div>
        )}
      </aside>

      {/* 主答题区 */}
      <main className="flex-1 flex flex-col max-w-3xl mx-auto w-full p-4 md:p-6">
        {/* 顶部 */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700">
              第 {currentIndex + 1}<span className="text-gray-400 font-normal"> / {totalCount}</span>
            </span>
            <span className="text-xs text-gray-400 hidden sm:inline">已答 {answeredCount} 题</span>
          </div>
          <button
            onClick={() => setShowMobileSheet(true)}
            className="md:hidden text-xs px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 shadow-sm"
          >
            📋 {answeredCount}/{totalCount}
          </button>
        </div>

        <ProgressBar current={currentIndex} total={totalCount} />

        {/* 题目卡片 */}
        <div className="flex-1 mt-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 md:p-8">
            <QuestionCard
              question={currentQuestion}
              userAnswer={userAnswers[currentQuestion.id] || ''}
              onAnswer={answer => setAnswer(currentQuestion.id, answer)}
            />
          </div>
        </div>

        {/* 底部导航 */}
        <div className="flex items-center justify-between mt-5 pb-4">
          <button
            onClick={goPrev}
            disabled={isFirst}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              isFirst
                ? 'text-gray-300 cursor-not-allowed'
                : 'text-gray-600 hover:bg-white hover:shadow-sm border border-gray-200 bg-white'
            }`}
          >
            ← 上一题
          </button>

          <div className="flex gap-2">
            {isLast ? (
              <button
                onClick={goNext}
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl text-sm font-medium hover:from-emerald-600 hover:to-emerald-700 shadow-sm transition-all"
              >
                提交答卷
              </button>
            ) : (
              <button
                onClick={goNext}
                className="px-6 py-2.5 bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-600 shadow-sm transition-all"
              >
                下一题 →
              </button>
            )}
          </div>
        </div>
      </main>

      {/* 移动端答题卡抽屉 */}
      {showMobileSheet && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowMobileSheet(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-5 max-h-[70vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-gray-800">答题卡</span>
              <span className="text-xs text-gray-400">{answeredCount}/{totalCount} 已答</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {questions.map((q, i) => {
                const answered = hasAnswer(q.id)
                const isCurrent = i === currentIndex
                return (
                  <button
                    key={q.id}
                    onClick={() => { setCurrentIndex(i); setShowMobileSheet(false) }}
                    className={`w-9 h-9 rounded-lg text-xs font-medium transition-all ${
                      isCurrent
                        ? 'bg-blue-500 text-white ring-2 ring-blue-200'
                        : answered
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {i + 1}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* 提交确认弹窗 */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowSubmitConfirm(false)} />
          <div className="relative bg-white rounded-2xl p-6 max-w-sm mx-4 shadow-xl">
            <h3 className="font-bold text-gray-800 text-lg mb-2">确认提交</h3>
            <p className="text-gray-600 text-sm mb-6">
              还有 <span className="font-bold text-red-500">{unanswered}</span> 题未作答，提交后未答题将计 0 分。
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowSubmitConfirm(false)}
                className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
              >
                继续答题
              </button>
              <button
                onClick={handleSubmit}
                className="px-5 py-2 bg-emerald-500 text-white rounded-xl text-sm font-medium hover:bg-emerald-600"
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
