import { useState, useEffect } from 'react'
import type { Question } from '../types'
import { parseQuestions } from '../parsers/questionParser'
import avionicsExam from '../data/avionics-exam.json'

interface Props {
  onStartQuiz: (questions: Question[], title: string) => void
}

interface ExamSubject {
  key: string
  title: string
  subtitle: string
  icon: string
  count: number
  data: Question[]
}

const ICONS = ['✈️', '🔧', '⚡', '🛩️', '📡', '🧮', '🔬', '📐', '🌐', '💻']

const BUILT_IN: ExamSubject[] = [
  {
    key: 'avionics',
    title: '航空电子系统 Ⅰ',
    subtitle: '自动飞行 · 导航 · 通信 · 指示与记录',
    count: 112,
    icon: '✈️',
    data: avionicsExam as Question[],
  },
]

const STORAGE_KEY = 'exam_subjects'

function loadSubjects(): ExamSubject[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveSubjects(subjects: ExamSubject[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(subjects))
}

export function HomePage({ onStartQuiz }: Props) {
  const [subjects, setSubjects] = useState<ExamSubject[]>(() => {
    const saved = loadSubjects()
    // 合并内置科目和保存的科目（去重）
    const keys = new Set(saved.map(s => s.key))
    const merged = [...BUILT_IN]
    for (const s of saved) {
      if (!keys.has(s.key)) merged.push(s)
    }
    return merged
  })

  const [showAdd, setShowAdd] = useState(false)
  const [addTitle, setAddTitle] = useState('')
  const [addSubtitle, setAddSubtitle] = useState('')
  const [addIcon, setAddIcon] = useState('✈️')
  const [addText, setAddText] = useState('')
  const [addError, setAddError] = useState('')
  const [addLoading, setAddLoading] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  // 保存自定义科目到 localStorage（排除内置）
  useEffect(() => {
    const custom = subjects.filter(s => s.key !== 'avionics')
    saveSubjects(custom)
  }, [subjects])

  const handleAdd = () => {
    setAddError('')
    if (!addTitle.trim()) { setAddError('请输入科目名称'); return }
    if (!addText.trim()) { setAddError('请粘贴题目内容'); return }

    setAddLoading(true)
    const questions = parseQuestions(addText)
    if (questions.length === 0) {
      setAddError('未能解析到题目，请检查格式')
      setAddLoading(false)
      return
    }

    const key = 'custom-' + Date.now()
    const newSubject: ExamSubject = {
      key,
      title: addTitle.trim(),
      subtitle: addSubtitle.trim() || `${questions.length} 题`,
      icon: addIcon,
      count: questions.length,
      data: questions,
    }

    setSubjects(prev => [...prev, newSubject])
    setShowAdd(false)
    setAddTitle('')
    setAddSubtitle('')
    setAddIcon('✈️')
    setAddText('')
    setAddLoading(false)
  }

  const handleDelete = (key: string) => {
    setSubjects(prev => prev.filter(s => s.key !== key))
    setDeleteConfirm(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        {/* 顶部 */}
        <div className="text-center mb-10 mt-4">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">📝 模拟考试</h1>
          <p className="text-gray-500">选择科目，逐题自测，自动评分</p>
        </div>

        {/* 考试栏 */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              📋 考试栏
              <span className="text-xs font-normal text-gray-400 bg-gray-200 px-2 py-0.5 rounded-full">
                {subjects.length} 门
              </span>
            </h2>
            <button
              onClick={() => setShowAdd(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
            >
              + 添加科目
            </button>
          </div>

          {subjects.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <p className="text-4xl mb-4">📭</p>
              <p>还没有考试科目，点击「添加科目」开始</p>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            {subjects.map(subject => (
              <div key={subject.key} className="relative group">
                <div
                  className="bg-white rounded-xl border border-gray-200 p-6 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
                  onClick={() => onStartQuiz(subject.data, subject.title)}
                >
                  <div className="flex items-start gap-4">
                    <span className="text-3xl">{subject.icon}</span>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-800 text-base">{subject.title}</h3>
                      <p className="text-sm text-gray-400 mt-0.5">{subject.subtitle}</p>
                      <div className="flex items-center gap-3 mt-3">
                        <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">
                          {subject.count} 题
                        </span>
                        <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full font-medium">
                          模拟考试
                        </span>
                      </div>
                    </div>
                    <span className="text-gray-300 text-xl">→</span>
                  </div>
                </div>
                {/* 删除按钮 - 仅自定义科目 */}
                {subject.key !== 'avionics' && (
                  <button
                    onClick={e => { e.stopPropagation(); setDeleteConfirm(subject.key) }}
                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-100 text-red-500 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-200"
                    title="删除科目"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 添加科目弹窗 */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowAdd(false)} />
          <div className="relative bg-white rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <h3 className="font-bold text-gray-800 text-lg mb-4">添加考试科目</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">科目名称 *</label>
                <input
                  value={addTitle}
                  onChange={e => setAddTitle(e.target.value)}
                  placeholder="如：航空电子系统 Ⅰ"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">副标题</label>
                <input
                  value={addSubtitle}
                  onChange={e => setAddSubtitle(e.target.value)}
                  placeholder="如：自动飞行 · 导航 · 通信"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">图标</label>
                <div className="flex flex-wrap gap-2">
                  {ICONS.map(icon => (
                    <button
                      key={icon}
                      onClick={() => setAddIcon(icon)}
                      className={`w-10 h-10 text-xl rounded-lg border-2 transition-colors ${
                        addIcon === icon ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  题目内容 *
                  <span className="font-normal text-gray-400 ml-2">
                    （格式：1. [单选题] 题干 A. 选项A B. 选项B ✅ 正确答案: A）
                  </span>
                </label>
                <textarea
                  value={addText}
                  onChange={e => setAddText(e.target.value)}
                  placeholder={`粘贴题目内容，格式示例：

1. [单选题] 自动油门(A/T)在巡航阶段通常优先控制的参数是?
A. 发动机 N1 转速 B. 飞机航向 C. 起落架放下速度 D. 飞机俯仰角 ✅ 正确答案: A

2. [多选题] 自动飞行系统（AFS）包括？
A. A/T B. AP C. FD D. YD ✅ 正确答案: ABCD`}
                  rows={10}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:outline-none resize-none font-mono"
                />
              </div>

              {addError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                  {addError}
                </div>
              )}
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => setShowAdd(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleAdd}
                disabled={addLoading}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 disabled:opacity-50"
              >
                {addLoading ? '解析中...' : '确认添加'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 删除确认弹窗 */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-white rounded-xl p-6 max-w-sm mx-4 shadow-xl">
            <h3 className="font-bold text-gray-800 mb-2">删除科目</h3>
            <p className="text-gray-600 text-sm mb-6">确定要删除这个考试科目吗？此操作不可恢复。</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
