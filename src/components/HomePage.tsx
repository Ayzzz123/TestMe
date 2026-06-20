import type { Question } from '../types'
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

const SUBJECTS: ExamSubject[] = [
  {
    key: 'avionics',
    title: '航空电子系统 Ⅰ',
    subtitle: '',
    count: 112,
    icon: '✈️',
    data: avionicsExam as Question[],
  },
]

export function HomePage({ onStartQuiz }: Props) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        {/* 顶部 */}
        <div className="text-center mb-12 mt-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-sm border border-gray-100 mb-5">
            <span className="text-3xl">📝</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2 tracking-tight">模拟考试</h1>
          <p className="text-gray-500 text-lg">选择科目，逐题自测，自动评分</p>
        </div>

        {/* 考试栏 */}
        <div>
          <div className="flex items-center gap-3 mb-5">
            <h2 className="text-lg font-bold text-gray-800">📋 考试栏</h2>
            <span className="text-xs font-medium text-gray-500 bg-white border border-gray-200 px-2.5 py-0.5 rounded-full">
              {SUBJECTS.length} 门科目
            </span>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            {SUBJECTS.map(subject => (
              <div
                key={subject.key}
                onClick={() => onStartQuiz(subject.data, subject.title)}
                className="group relative bg-white rounded-2xl border border-gray-100 p-6 cursor-pointer
                  shadow-sm hover:shadow-lg hover:border-blue-200 hover:-translate-y-0.5
                  transition-all duration-300"
              >
                {/* 背景装饰 */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-blue-50/80 to-transparent rounded-tr-2xl rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <div className="relative flex items-start gap-5">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-50 to-slate-100 rounded-xl flex items-center justify-center text-2xl shadow-sm group-hover:scale-110 transition-transform duration-300">
                    {subject.icon}
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <h3 className="font-bold text-gray-800 text-lg leading-tight">{subject.title}</h3>
                    {subject.subtitle && (
                      <p className="text-sm text-gray-400 mt-1">{subject.subtitle}</p>
                    )}
                    <div className="flex items-center gap-2.5 mt-3">
                      <span className="text-xs bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full font-semibold">
                        {subject.count} 题
                      </span>
                      <span className="text-xs bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full font-semibold">
                        模拟考试
                      </span>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-gray-50 group-hover:bg-blue-50 flex items-center justify-center text-gray-300 group-hover:text-blue-400 transition-all duration-300 mt-2">
                    →
                  </div>
                </div>
              </div>
            ))}
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
