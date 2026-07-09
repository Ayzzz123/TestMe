import { useState } from 'react'
import type { Question } from '../types'
import avionicsExam from '../data/avionics-exam.json'
import structureExam from '../data/aircraft-structure-exam.json'
import engineExam from '../data/engine-exam.json'
import { shuffle } from '../utils/shuffle'
import { ReviewDashboard } from './ReviewDashboard'
import { getDueReviewItems } from '../utils/spacedRepetition'

interface Props {
  onStartQuiz: (questions: Question[], title: string) => void
  onStartReview: (questions: Question[], title: string) => void
}

interface HomeworkChapter {
  index: number
  name: string
  start: number
  end: number
}

const AVIONICS_CHAPTERS: HomeworkChapter[] = [
  { index: 1, name: '自动飞行系统-系统概述 自动驾驶 飞行指引 自动油门', start: 0, end: 16 },
  { index: 2, name: '导航系统-自主式导航', start: 17, end: 27 },
  { index: 3, name: '导航系统-无线电导航', start: 28, end: 43 },
  { index: 4, name: '导航系统-ADIRS 及备用仪表', start: 44, end: 57 },
  { index: 5, name: '通信系统-机上通信及应急通信设备', start: 58, end: 74 },
  { index: 6, name: '通信系统-无线电通信', start: 75, end: 91 },
  { index: 7, name: '指示与记录系统', start: 92, end: 111 },
  { index: 8, name: '自动飞行系统2', start: 112, end: 136 },
]

const STRUCTURE_CHAPTERS: HomeworkChapter[] = [
  { index: 1, name: '飞机结构损伤与修理基础', start: 0, end: 9 },
  { index: 2, name: '飞机结构部件与修理准则', start: 10, end: 19 },
  { index: 3, name: '飞机结构损伤综合', start: 20, end: 29 },
  { index: 4, name: '飞机结构检查与复合材料基础', start: 30, end: 34 },
  { index: 5, name: '铆钉规范与飞机检查方法', start: 35, end: 39 },
]

const ENGINE_CHAPTERS: HomeworkChapter[] = [
  { index: 1, name: '作业1', start: 0, end: 41 },
  { index: 2, name: '作业2', start: 42, end: 83 },
  { index: 3, name: '作业3', start: 84, end: 125 },
  { index: 4, name: '作业4', start: 126, end: 167 },
  { index: 5, name: '作业5', start: 168, end: 212 },
]

export function HomePage({ onStartQuiz, onStartReview }: Props) {
  const [avionicsOpen, setAvionicsOpen] = useState(true)
  const [structureOpen, setStructureOpen] = useState(true)
  const [engineOpen, setEngineOpen] = useState(true)

  const allQuestions = avionicsExam as Question[]
  const allStructureQuestions = structureExam as Question[]
  const allEngineQuestions = engineExam as Question[]

  const startHomework = (chapter: HomeworkChapter) => {
    const questions = allQuestions.slice(chapter.start, chapter.end + 1)
    onStartQuiz(questions, `航空电子系统 Ⅰ — 作业${chapter.index}`)
  }

  const startStructureHomework = (chapter: HomeworkChapter) => {
    const questions = allStructureQuestions.slice(chapter.start, chapter.end + 1)
    onStartQuiz(questions, `飞机结构与部附件修理 — 作业${chapter.index}`)
  }

  const startAvionicsExam = () => {
    const questions = shuffle(allQuestions)
    onStartQuiz(questions, `航空电子系统 Ⅰ — 模拟考试`)
  }

  const startStructureExam = () => {
    const questions = shuffle(allStructureQuestions)
    onStartQuiz(questions, `飞机结构与部附件修理 — 模拟考试`)
  }

  const startEngineHomework = (chapter: HomeworkChapter) => {
    const questions = allEngineQuestions.slice(chapter.start, chapter.end + 1)
    onStartQuiz(questions, `航空动力装置结构与系统 — 作业${chapter.index}`)
  }

  const startEngineExam = () => {
    const questions = shuffle(allEngineQuestions)
    onStartQuiz(questions, `航空动力装置结构与系统 — 模拟考试`)
  }

  const handleStartReview = () => {
    const dueItems = getDueReviewItems()
    const reviewQuestions = dueItems
      .map(item =>
        allQuestions.find(q => q.id === item.questionId) ||
        allStructureQuestions.find(q => q.id === item.questionId) ||
        allEngineQuestions.find(q => q.id === item.questionId)
      )
      .filter((q): q is Question => q !== undefined)

    if (reviewQuestions.length > 0) {
      onStartReview(reviewQuestions, '间隔复习')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        {/* 顶部 */}
        <div className="text-center mb-12 mt-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-sm border border-gray-100 mb-5">
            <span className="text-3xl">📝</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2 tracking-tight">TestMe</h1>
          <p className="text-gray-500 text-lg">选择科目，逐题自测，自动评分</p>
        </div>

        {/* 考试栏 */}
        <div>
          <div className="flex items-center gap-3 mb-5">
            <h2 className="text-lg font-bold text-gray-800">📋 考试栏</h2>
            <span className="text-xs font-medium text-gray-500 bg-white border border-gray-200 px-2.5 py-0.5 rounded-full">
              3 门科目
            </span>
          </div>

          <ReviewDashboard onStartReview={handleStartReview} />

          {/* 航空电子系统 Ⅰ — 可展开分组 */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* 分组标题栏 */}
            <button
              onClick={() => setAvionicsOpen(v => !v)}
              className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 bg-gradient-to-br from-blue-50 to-slate-100 rounded-xl flex items-center justify-center text-xl shadow-sm">
                  ✈️
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-gray-800 text-lg">航空电子系统 Ⅰ</h3>
                  <p className="text-sm text-gray-400">
                    共 8 次作业，合计 {allQuestions.length} 题
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2.5 py-0.5 rounded-full">
                  {AVIONICS_CHAPTERS.length} 次作业
                </span>
                <svg
                  className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${avionicsOpen ? 'rotate-180' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {/* 子章节卡片网格 */}
            {avionicsOpen && (
              <div className="px-6 pb-6">
                <div className="border-t border-gray-100 pt-5" />

                {/* 模拟考试卡片 */}
                <div
                  onClick={startAvionicsExam}
                  className="group relative bg-slate-50/60 border border-gray-100 rounded-xl p-4 cursor-pointer
                    hover:bg-white hover:shadow-md hover:border-blue-200 hover:-translate-y-0.5
                    transition-all duration-300 mb-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-sm font-bold text-blue-600 shadow-sm border border-gray-100 group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                      🏆
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-800 text-sm leading-snug">模拟考试</h4>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-semibold">
                          {allQuestions.length} 题
                        </span>
                      </div>
                    </div>
                    <div className="w-6 h-6 rounded-full bg-white group-hover:bg-blue-50 flex items-center justify-center text-gray-300 group-hover:text-blue-400 transition-all duration-300 mt-1 flex-shrink-0">
                      →
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {AVIONICS_CHAPTERS.map(ch => (
                    <div
                      key={ch.index}
                      onClick={() => startHomework(ch)}
                      className="group relative bg-slate-50/60 border border-gray-100 rounded-xl p-4 cursor-pointer
                        hover:bg-white hover:shadow-md hover:border-blue-200 hover:-translate-y-0.5
                        transition-all duration-300"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-sm font-bold text-blue-600 shadow-sm border border-gray-100 group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                          {ch.index}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-800 text-sm leading-snug">{ch.name}</h4>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-semibold">
                              {ch.end - ch.start + 1} 题
                            </span>
                          </div>
                        </div>
                        <div className="w-6 h-6 rounded-full bg-white group-hover:bg-blue-50 flex items-center justify-center text-gray-300 group-hover:text-blue-400 transition-all duration-300 mt-1 flex-shrink-0">
                          →
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 飞机结构与部附件修理 — 可展开分组 */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mt-4">
            {/* 分组标题栏 */}
            <button
              onClick={() => setStructureOpen(v => !v)}
              className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 bg-gradient-to-br from-amber-50 to-orange-100 rounded-xl flex items-center justify-center text-xl shadow-sm">
                  🔧
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-gray-800 text-lg">飞机结构与部附件修理</h3>
                  <p className="text-sm text-gray-400">
                    共 5 次作业，合计 {allStructureQuestions.length} 题
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2.5 py-0.5 rounded-full">
                  {STRUCTURE_CHAPTERS.length} 次作业
                </span>
                <svg
                  className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${structureOpen ? 'rotate-180' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {/* 子章节卡片网格 */}
            {structureOpen && (
              <div className="px-6 pb-6">
                <div className="border-t border-gray-100 pt-5" />

                {/* 模拟考试卡片 */}
                <div
                  onClick={startStructureExam}
                  className="group relative bg-slate-50/60 border border-gray-100 rounded-xl p-4 cursor-pointer
                    hover:bg-white hover:shadow-md hover:border-amber-200 hover:-translate-y-0.5
                    transition-all duration-300 mb-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-sm font-bold text-amber-600 shadow-sm border border-gray-100 group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                      🏆
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-800 text-sm leading-snug">模拟考试</h4>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full font-semibold">
                          {allStructureQuestions.length} 题
                        </span>
                      </div>
                    </div>
                    <div className="w-6 h-6 rounded-full bg-white group-hover:bg-amber-50 flex items-center justify-center text-gray-300 group-hover:text-amber-400 transition-all duration-300 mt-1 flex-shrink-0">
                      →
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {STRUCTURE_CHAPTERS.map(ch => (
                    <div
                      key={ch.index}
                      onClick={() => startStructureHomework(ch)}
                      className="group relative bg-slate-50/60 border border-gray-100 rounded-xl p-4 cursor-pointer
                        hover:bg-white hover:shadow-md hover:border-amber-200 hover:-translate-y-0.5
                        transition-all duration-300"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-sm font-bold text-amber-600 shadow-sm border border-gray-100 group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                          {ch.index}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-800 text-sm leading-snug">{ch.name}</h4>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full font-semibold">
                              {ch.end - ch.start + 1} 题
                            </span>
                          </div>
                        </div>
                        <div className="w-6 h-6 rounded-full bg-white group-hover:bg-amber-50 flex items-center justify-center text-gray-300 group-hover:text-amber-400 transition-all duration-300 mt-1 flex-shrink-0">
                          →
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 航空动力装置结构与系统 — 可展开分组 */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mt-4">
            {/* 分组标题栏 */}
            <button
              onClick={() => setEngineOpen(v => !v)}
              className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 bg-gradient-to-br from-red-50 to-rose-100 rounded-xl flex items-center justify-center text-xl shadow-sm">
                  🔥
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-gray-800 text-lg">航空动力装置结构与系统</h3>
                  <p className="text-sm text-gray-400">
                    共 5 次作业，合计 {allEngineQuestions.length} 题
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2.5 py-0.5 rounded-full">
                  {ENGINE_CHAPTERS.length} 次作业
                </span>
                <svg
                  className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${engineOpen ? 'rotate-180' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {/* 子章节卡片网格 */}
            {engineOpen && (
              <div className="px-6 pb-6">
                <div className="border-t border-gray-100 pt-5" />

                {/* 模拟考试卡片 */}
                <div
                  onClick={startEngineExam}
                  className="group relative bg-slate-50/60 border border-gray-100 rounded-xl p-4 cursor-pointer
                    hover:bg-white hover:shadow-md hover:border-red-200 hover:-translate-y-0.5
                    transition-all duration-300 mb-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-sm font-bold text-red-600 shadow-sm border border-gray-100 group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                      🏆
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-800 text-sm leading-snug">模拟考试</h4>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-semibold">
                          {allEngineQuestions.length} 题
                        </span>
                      </div>
                    </div>
                    <div className="w-6 h-6 rounded-full bg-white group-hover:bg-red-50 flex items-center justify-center text-gray-300 group-hover:text-red-400 transition-all duration-300 mt-1 flex-shrink-0">
                      →
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {ENGINE_CHAPTERS.map(ch => (
                    <div
                      key={ch.index}
                      onClick={() => startEngineHomework(ch)}
                      className="group relative bg-slate-50/60 border border-gray-100 rounded-xl p-4 cursor-pointer
                        hover:bg-white hover:shadow-md hover:border-red-200 hover:-translate-y-0.5
                        transition-all duration-300"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-sm font-bold text-red-600 shadow-sm border border-gray-100 group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                          {ch.index}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-800 text-sm leading-snug">{ch.name}</h4>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-semibold">
                              {ch.end - ch.start + 1} 题
                            </span>
                          </div>
                        </div>
                        <div className="w-6 h-6 rounded-full bg-white group-hover:bg-red-50 flex items-center justify-center text-gray-300 group-hover:text-red-400 transition-all duration-300 mt-1 flex-shrink-0">
                          →
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 底部 */}
        <p className="text-center text-xs text-gray-400 mt-12">
          数据存储在浏览器本地，不会上传到任何服务器
        </p>
      </div>
    </div>
  )
}
