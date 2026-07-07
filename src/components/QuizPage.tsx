import { useState, useCallback, useRef } from 'react'
import type { Question, GradingResult, ReviewItem } from '../types'
import { QuestionCard } from './QuestionCard'
import { ProgressBar } from './ProgressBar'
import { useQuiz } from '../hooks/useQuiz'
import { gradeAll } from '../utils/grading'
import { clearProgress } from '../utils/storage'

interface Props {
  questions: Question[]
  onFinish: (results: GradingResult[], totalScore: number, maxScore: number) => void
  isReviewMode?: boolean
  reviewItems?: ReviewItem[]
  onReviewComplete?: (results: { questionId: string; quality: number }[]) => void
}

export function QuizPage({ questions, onFinish, isReviewMode = false, reviewItems = [], onReviewComplete }: Props) {
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
  const [reviewQualities, setReviewQualities] = useState<Record<string, number>>({})
  const [showQualityPicker, setShowQualityPicker] = useState(false)
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

  const handleReviewSubmit = useCallback((finalQualities?: Record<string, number>) => {
    if (!onReviewComplete) return
    const qualities = finalQualities || reviewQualities
    const results = questions.map(q => ({
      questionId: q.id,
      quality: qualities[q.id] ?? 3,
    }))
    clearProgress()
    onReviewComplete(results)
  }, [questions, reviewQualities, onReviewComplete])

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 flex items-center justify-center">
        <p className="text-gray-400">没有题目</p>
      </div>
    )
  }

  const unanswered = questions.filter(q => !hasAnswer(q.id)).length
  const pct = totalCount > 0 ? Math.round((answeredCount / totalCount) * 100) : 0
  const currentReviewItem = isReviewMode
    ? reviewItems.find(r => r.questionId === currentQuestion.id)
    : null

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 flex">
      {/* 桌面端可折叠侧边栏 */}
      <aside
        className={`hidden md:block bg-white/80 backdrop-blur border-r border-gray-100 flex-shrink-0 transition-all duration-300 overflow-hidden ${
          sidebarOpen ? 'w-60' : 'w-12'
        }`}
      >
        {sidebarOpen ? (
          <div className="p-3 h-full flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-gray-500 tracking-wide uppercase">答题卡</span>
              <button
                onClick={() => setSidebarOpen(false)}
                className="w-6 h-6 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
              >
                ◀
              </button>
            </div>
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-400 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-thin">
              <div className="flex flex-wrap gap-1.5">
                {questions.map((q, i) => {
                  const answered = hasAnswer(q.id)
                  const isCurrent = i === currentIndex
                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentIndex(i)}
                      className={`w-7 h-7 rounded-lg text-xs font-semibold transition-all flex-shrink-0
                        ${isCurrent
                          ? isReviewMode
                            ? 'bg-purple-500 text-white shadow-sm shadow-purple-200 scale-110'
                            : 'bg-blue-500 text-white shadow-sm shadow-blue-200 scale-110'
                          : answered
                            ? isReviewMode
                              ? 'bg-purple-50 text-purple-600 hover:bg-purple-100 border border-purple-200'
                              : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200'
                            : 'bg-gray-50 text-gray-400 hover:bg-gray-100 border border-gray-200'
                        }`}
                    >
                      {i + 1}
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-gray-100 flex gap-4 text-[10px] text-gray-400">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-emerald-200" /> 已答</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-gray-200" /> 未答</span>
            </div>
          </div>
        ) : (
          <div className="p-2 flex flex-col items-center gap-3 pt-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
              title="展开答题卡"
            >
              ▶
            </button>
            <div className="flex flex-col items-center gap-1.5">
              <div className="w-8 h-20 bg-gray-100 rounded-full relative overflow-hidden">
                <div
                  className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-emerald-400 to-emerald-300 rounded-full transition-all duration-500"
                  style={{ height: `${pct}%` }}
                />
              </div>
              <span className="text-[10px] text-gray-400">{answeredCount}</span>
            </div>
          </div>
        )}
      </aside>

      {/* 主答题区 */}
      <main className="flex-1 flex flex-col max-w-3xl mx-auto w-full p-4 md:p-8">
        {/* 顶部信息栏 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <span className="text-sm font-semibold text-gray-700">
              第 <span className="text-blue-500">{currentIndex + 1}</span>
              <span className="text-gray-400 font-normal"> / {totalCount}</span>
            </span>
            <span className="text-xs text-gray-400 hidden sm:inline">已答 {answeredCount} 题</span>
          </div>
          <button
            onClick={() => setShowMobileSheet(true)}
            className="md:hidden text-xs px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 shadow-sm"
          >
            📋 {answeredCount}/{totalCount}
          </button>
        </div>

        <ProgressBar current={currentIndex} total={totalCount} />

        {currentReviewItem && (
          <div className="flex items-center gap-2 mb-3 mt-4">
            <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-purple-50 text-purple-600">
              🔄 第 {currentReviewItem.repetitions + 1} 轮复习
            </span>
            <span className="text-xs text-gray-400">
              上次复习: {currentReviewItem.lastReview}
            </span>
          </div>
        )}

        {/* 题目卡片 */}
        <div className="flex-1 mt-5">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 transition-all">
            <QuestionCard
              question={currentQuestion}
              userAnswer={userAnswers[currentQuestion.id] || ''}
              onAnswer={answer => setAnswer(currentQuestion.id, answer)}
            />
          </div>
        </div>

        {/* 底部导航 */}
        {isReviewMode ? (
          <div className="flex flex-col gap-3 mt-5 pb-4">
            {showQualityPicker && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                <p className="text-xs text-gray-400 mb-3 text-center">你对这道题的掌握程度？</p>
                <div className="flex gap-2">
                  {[
                    { q: 0, label: '完全忘记', emoji: '😰' },
                    { q: 1, label: '有印象', emoji: '🤔' },
                    { q: 2, label: '看答案想起', emoji: '💡' },
                    { q: 3, label: '犹豫答对', emoji: '👍' },
                    { q: 4, label: '较流畅', emoji: '😊' },
                    { q: 5, label: '非常轻松', emoji: '🚀' },
                  ].map(({ q, label, emoji }) => (
                    <button
                      key={q}
                      onClick={() => {
                        const newQualities = { ...reviewQualities, [currentQuestion.id]: q }
                        setReviewQualities(newQualities)
                        setShowQualityPicker(false)
                        if (isLast) {
                          handleReviewSubmit(newQualities)
                        } else {
                          setCurrentIndex(currentIndex + 1)
                        }
                      }}
                      className="flex-1 flex flex-col items-center gap-1 py-3 px-1 rounded-xl hover:bg-purple-50 transition-colors border border-gray-100 hover:border-purple-200 text-xs"
                    >
                      <span className="text-lg">{emoji}</span>
                      <span className="text-[10px] text-gray-500">{label}</span>
                      <span className="text-[10px] font-bold text-gray-400">{q}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="flex items-center justify-between">
              <button
                onClick={goPrev}
                disabled={isFirst}
                className={`px-5 py-3 rounded-xl text-sm font-medium transition-all ${
                  isFirst
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-gray-600 hover:bg-white hover:shadow-sm border border-gray-200 bg-white'
                }`}
              >
                ← 上一题
              </button>
              <button
                onClick={() => setShowQualityPicker(true)}
                disabled={!hasAnswer(currentQuestion.id)}
                className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all ${
                  hasAnswer(currentQuestion.id)
                    ? 'bg-purple-500 text-white hover:bg-purple-600 shadow-sm shadow-purple-200'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                {isLast ? '评估并完成' : '评估掌握度'}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between mt-5 pb-4">
            <button
              onClick={goPrev}
              disabled={isFirst}
              className={`px-5 py-3 rounded-xl text-sm font-medium transition-all ${
                isFirst
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'text-gray-600 hover:bg-white hover:shadow-sm border border-gray-200 bg-white'
              }`}
            >
              ← 上一题
            </button>

            {isLast ? (
              <button
                onClick={goNext}
                className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl text-sm font-semibold hover:from-emerald-600 hover:to-emerald-700 shadow-sm shadow-emerald-200 transition-all hover:shadow-md"
              >
                提交答卷
              </button>
            ) : (
              <button
                onClick={goNext}
                className="px-6 py-3 bg-blue-500 text-white rounded-xl text-sm font-semibold hover:bg-blue-600 shadow-sm shadow-blue-200 transition-all hover:shadow-md"
              >
                下一题 →
              </button>
            )}
          </div>
        )}
      </main>

      {/* 移动端答题卡 */}
      {showMobileSheet && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setShowMobileSheet(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 max-h-[70vh] overflow-y-auto shadow-2xl">
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
            <div className="flex items-center justify-between mb-4">
              <span className="font-bold text-gray-800 text-lg">{isReviewMode ? '复习进度' : '答题卡'}</span>
              <span className="text-sm text-gray-400">{answeredCount}/{totalCount} 已答</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {questions.map((q, i) => {
                const answered = hasAnswer(q.id)
                const isCurrent = i === currentIndex
                return (
                  <button
                    key={q.id}
                    onClick={() => { setCurrentIndex(i); setShowMobileSheet(false) }}
                    className={`w-10 h-10 rounded-xl text-xs font-semibold transition-all ${
                      isCurrent
                        ? isReviewMode
                          ? 'bg-purple-500 text-white shadow-md shadow-purple-200'
                          : 'bg-blue-500 text-white shadow-md shadow-blue-200'
                        : answered
                          ? isReviewMode
                            ? 'bg-purple-50 text-purple-600 border border-purple-200'
                            : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                          : 'bg-gray-50 text-gray-400 border border-gray-200'
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

      {/* 提交确认 */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setShowSubmitConfirm(false)} />
          <div className="relative bg-white rounded-2xl p-8 max-w-sm w-full shadow-xl text-center">
            <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4">
              ⚠️
            </div>
            <h3 className="font-bold text-gray-800 text-lg mb-2">确认提交</h3>
            <p className="text-gray-500 text-sm mb-6">
              还有 <span className="font-bold text-red-500">{unanswered}</span> 题未作答<br />提交后将计为 0 分
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSubmitConfirm(false)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                继续答题
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-medium hover:bg-emerald-600 transition-colors"
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
