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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        <div className="text-center mb-10 mt-4">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">📝 模拟考试</h1>
          <p className="text-gray-500">选择科目，逐题自测，自动评分</p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              📋 考试栏
              <span className="text-xs font-normal text-gray-400 bg-gray-200 px-2 py-0.5 rounded-full">
                {SUBJECTS.length} 门
              </span>
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {SUBJECTS.map(subject => (
              <div
                key={subject.key}
                className="bg-white rounded-xl border border-gray-200 p-6 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
                onClick={() => onStartQuiz(subject.data, subject.title)}
              >
                <div className="flex items-start gap-4">
                  <span className="text-3xl">{subject.icon}</span>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-800 text-base">{subject.title}</h3>
                    {subject.subtitle && <p className="text-sm text-gray-400 mt-0.5">{subject.subtitle}</p>}
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
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
