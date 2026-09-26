import React, { useState } from 'react';
import { 
  CheckCircle2, XCircle, RotateCcw, 
  HelpCircle, BookOpen, AlertCircle, ChevronRight, ChevronLeft, Award
} from 'lucide-react';
import { EXAM_QUESTIONS, VIVA_QUESTIONS, ExamQuestion, VivaQuestion } from '../../data/questionsData';

export const PracticeAndVivaView: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [currentQIndex, setCurrentQIndex] = useState<number>(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState<boolean>(false);
  const [userAnswers, setUserAnswers] = useState<{ [qId: string]: string }>({});
  const [quizFinished, setQuizFinished] = useState<boolean>(false);
  const [activeSection, setActiveSection] = useState<'mcq' | 'viva'>('mcq');

  // Filtered Questions
  const filteredQuestions: ExamQuestion[] = selectedCategory === 'all'
    ? EXAM_QUESTIONS
    : EXAM_QUESTIONS.filter((q) => q.category.toLowerCase().includes(selectedCategory.toLowerCase()));

  const currentQ: ExamQuestion = filteredQuestions[currentQIndex] || filteredQuestions[0];

  const handleSelectOption = (optId: string) => {
    if (isAnswerSubmitted) return;
    setSelectedOptionId(optId);
  };

  const handleConfirmAnswer = () => {
    if (!selectedOptionId || isAnswerSubmitted) return;
    setIsAnswerSubmitted(true);
    setUserAnswers({
      ...userAnswers,
      [currentQ.id]: selectedOptionId,
    });
  };

  const handleNextQuestion = () => {
    if (currentQIndex < filteredQuestions.length - 1) {
      const nextIdx = currentQIndex + 1;
      setCurrentQIndex(nextIdx);
      const nextQ = filteredQuestions[nextIdx];
      const prevAns = userAnswers[nextQ?.id];
      if (prevAns) {
        setSelectedOptionId(prevAns);
        setIsAnswerSubmitted(true);
      } else {
        setSelectedOptionId(null);
        setIsAnswerSubmitted(false);
      }
    } else {
      setQuizFinished(true);
    }
  };

  const handlePrevQuestion = () => {
    if (currentQIndex > 0) {
      const prevIdx = currentQIndex - 1;
      setCurrentQIndex(prevIdx);
      const prevQ = filteredQuestions[prevIdx];
      const prevAns = userAnswers[prevQ?.id];
      if (prevAns) {
        setSelectedOptionId(prevAns);
        setIsAnswerSubmitted(true);
      } else {
        setSelectedOptionId(null);
        setIsAnswerSubmitted(false);
      }
    }
  };

  const handleRestartQuiz = () => {
    setCurrentQIndex(0);
    setSelectedOptionId(null);
    setIsAnswerSubmitted(false);
    setUserAnswers({});
    setQuizFinished(false);
  };

  // Calculate score
  const correctCount = Object.entries(userAnswers).filter(([qId, ansId]) => {
    const q = EXAM_QUESTIONS.find(item => item.id === qId);
    return q?.correctOptionId === ansId;
  }).length;

  return (
    <div className="flex flex-col gap-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-slate-900 border border-slate-800 rounded-xl">
        <div>
          <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-slate-800 text-sky-400 border border-slate-700">
            Academic Assessment & Preparation
          </span>
          <h2 className="text-xl font-bold text-white tracking-tight mt-1">
            Computer Networks Standard Practice Examination
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Topic-wise multiple choice questions with detailed textbook explanations and oral viva examination review.
          </p>
        </div>

        {/* Section Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => setActiveSection('mcq')}
            className={`px-3 py-1.5 rounded font-bold transition-all ${
              activeSection === 'mcq'
                ? 'bg-sky-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Practice Quiz (MCQs)
          </button>
          <button
            onClick={() => setActiveSection('viva')}
            className={`px-3 py-1.5 rounded font-bold transition-all ${
              activeSection === 'viva'
                ? 'bg-sky-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Viva Voce Oral Bank
          </button>
        </div>
      </div>

      {activeSection === 'mcq' ? (
        <div className="space-y-4">
          {/* Category Filters */}
          <div className="flex flex-wrap items-center gap-2 pb-2">
            <span className="text-xs text-slate-400 font-semibold mr-1">Filter Category:</span>
            {[
              { id: 'all', label: 'All Topics' },
              { id: 'fundamentals', label: 'Fundamentals' },
              { id: 'data link', label: 'Data Link' },
              { id: 'network', label: 'Network & Subnetting' },
              { id: 'transport', label: 'Transport (TCP/UDP)' },
              { id: 'application', label: 'Application Layer' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setSelectedCategory(t.id);
                  setCurrentQIndex(0);
                  setSelectedOptionId(null);
                  setIsAnswerSubmitted(false);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedCategory === t.id
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {quizFinished ? (
            /* Quiz Score Summary Card */
            <div className="p-8 bg-slate-900 border border-slate-800 rounded-xl text-center space-y-4 max-w-lg mx-auto">
              <div className="w-16 h-16 rounded-full bg-sky-500/10 border-2 border-sky-500/30 text-sky-400 flex items-center justify-center mx-auto">
                <Award className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Quiz Completed</h3>
                <p className="text-xs text-slate-400 mt-1">
                  You scored <strong>{correctCount}</strong> out of <strong>{filteredQuestions.length}</strong> questions correctly ({Math.round((correctCount / filteredQuestions.length) * 100)}%).
                </p>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleRestartQuiz}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Retake Practice Quiz</span>
                </button>
              </div>
            </div>
          ) : currentQ ? (
            /* Standard MCQ Test Card */
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
              
              {/* Question Index & Meta Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sky-400 text-sm">
                    Question {currentQIndex + 1} of {filteredQuestions.length}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono text-[10px] uppercase">
                    {currentQ.category}
                  </span>
                </div>
                <span className="text-slate-400 font-mono text-xs">
                  Score: {correctCount} / {Object.keys(userAnswers).length} Answered
                </span>
              </div>

              {/* Question Text */}
              <div className="text-base font-semibold text-white leading-relaxed">
                {currentQ.question}
              </div>

              {/* Multiple Choice Options */}
              <div className="space-y-2.5">
                {currentQ.options.map((opt) => {
                  const isSelected = selectedOptionId === opt.id;
                  const isCorrect = isAnswerSubmitted && opt.id === currentQ.correctOptionId;
                  const isWrong = isAnswerSubmitted && isSelected && opt.id !== currentQ.correctOptionId;

                  return (
                    <button
                      key={opt.id}
                      onClick={() => handleSelectOption(opt.id)}
                      disabled={isAnswerSubmitted}
                      className={`w-full p-3.5 rounded-lg border text-left transition-all flex items-center justify-between text-xs ${
                        isCorrect
                          ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200'
                          : isWrong
                          ? 'bg-rose-950/80 border-rose-500 text-rose-200'
                          : isSelected
                          ? 'bg-sky-950 border-sky-400 text-white shadow-sm ring-1 ring-sky-400'
                          : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-md bg-slate-900 border border-slate-700 flex items-center justify-center font-mono font-bold text-[11px]">
                          {opt.id.toUpperCase()}
                        </span>
                        <span>{opt.text}</span>
                      </div>

                      {isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                      {isWrong && <XCircle className="w-4 h-4 text-rose-400" />}
                    </button>
                  );
                })}
              </div>

              {/* Explanation Card upon submit */}
              {isAnswerSubmitted && (
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-2 animate-in fade-in text-xs">
                  <div className="flex items-center gap-2 font-bold">
                    {selectedOptionId === currentQ.correctOptionId ? (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Correct Answer
                      </span>
                    ) : (
                      <span className="text-rose-400 flex items-center gap-1">
                        <XCircle className="w-4 h-4" /> Incorrect Answer (Correct option is {currentQ.correctOptionId.toUpperCase()})
                      </span>
                    )}
                  </div>
                  <p className="text-slate-300 leading-relaxed font-sans">
                    {currentQ.explanation}
                  </p>
                  {currentQ.keyRule && (
                    <div className="text-[11px] font-mono text-sky-400 pt-1">
                      Key Principle: {currentQ.keyRule}
                    </div>
                  )}
                </div>
              )}

              {/* Bottom Nav Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs">
                <button
                  disabled={currentQIndex === 0}
                  onClick={handlePrevQuestion}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 rounded font-semibold transition-colors flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                {!isAnswerSubmitted ? (
                  <button
                    disabled={!selectedOptionId}
                    onClick={handleConfirmAnswer}
                    className="px-5 py-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white rounded font-bold transition-all shadow-sm"
                  >
                    Check Answer
                  </button>
                ) : (
                  <button
                    onClick={handleNextQuestion}
                    className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded font-bold transition-all shadow-sm flex items-center gap-1"
                  >
                    <span>{currentQIndex === filteredQuestions.length - 1 ? 'Finish Quiz' : 'Next Question'}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>

            </div>
          ) : null}
        </div>
      ) : (
        /* Oral Viva Voce Question Bank */
        <div className="space-y-4">
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
            <h3 className="font-bold text-white text-sm">
              Oral / Viva Voce Examination Question Bank
            </h3>
            <p className="text-xs text-slate-400">
              Curated oral interview questions frequently tested in academic practical examinations and CCNA interviews.
            </p>

            <div className="space-y-3 pt-2">
              {VIVA_QUESTIONS.map((vq, i) => (
                <div key={vq.id} className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-2 text-xs">
                  <div className="flex items-start justify-between gap-3">
                    <span className="font-bold text-sky-400 leading-snug">
                      Q{i + 1}. {vq.question}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono text-[10px] uppercase shrink-0">
                      {vq.category}
                    </span>
                  </div>

                  <div className="text-slate-300 leading-relaxed font-sans pl-4 border-l-2 border-slate-700">
                    <strong className="text-slate-400">Answer: </strong>
                    {vq.modelAnswer}
                  </div>

                  {vq.expectedConcepts && vq.expectedConcepts.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1 pt-1 pl-4">
                      <span className="text-[10px] text-slate-500 font-mono">Key Keywords:</span>
                      {vq.expectedConcepts.map((kc: string, ki: number) => (
                        <span key={ki} className="px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 text-[10px] border border-slate-800 font-mono">
                          {kc}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
