import React, { useMemo, useState } from 'react';
import { Award, CheckCircle2, ChevronLeft, ChevronRight, RotateCcw, Search, X, XCircle } from 'lucide-react';
import { EXAM_QUESTIONS } from '../../data/questionsData';
import { QUESTION_BANK } from '../../data/questionBank';

export const PracticeQuizView: React.FC = () => {
  const [category, setCategory] = useState('All topics');
  const [difficulty, setDifficulty] = useState('All levels');
  const [query, setQuery] = useState('');
  const [index, setIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [finished, setFinished] = useState(false);
  const [mode, setMode] = useState<'mcq' | 'viva'>('mcq');
  const [vivaTopic, setVivaTopic] = useState('All topics');
  const [vivaQuery, setVivaQuery] = useState('');
  const [revealedViva, setRevealedViva] = useState<string | null>(null);
  const [vivaPage, setVivaPage] = useState(0);

  const vivaQuestions = QUESTION_BANK.filter((question) => question.questionType === 'Viva');
  const vivaTopics = ['All topics', ...new Set(vivaQuestions.map((question) => question.topic))];
  const visibleViva = vivaQuestions.filter((question) =>
    (vivaTopic === 'All topics' || question.topic === vivaTopic)
    && (!vivaQuery.trim() || `${question.question} ${question.answer} ${question.category} ${question.topic}`.toLowerCase().includes(vivaQuery.trim().toLowerCase())));

  const categories = useMemo(() => ['All topics', ...new Set(EXAM_QUESTIONS.map((question) => question.category))], []);
  const filteredQuestions = useMemo(() => {
    const search = query.trim().toLowerCase();
    return EXAM_QUESTIONS.filter((question) => (category === 'All topics' || question.category === category)
      && (difficulty === 'All levels' || question.difficulty === difficulty)
      && (!search || `${question.question} ${question.explanation} ${question.keyRule} ${question.options.map((option) => option.text).join(' ')}`.toLowerCase().includes(search)));
  }, [category, difficulty, query]);
  const current = filteredQuestions[index];
  const selected = selectedOptionId ?? (current ? answers[current.id] ?? null : null);
  const submitted = current ? Boolean(answers[current.id]) : false;
  const correctCount = Object.entries(answers).filter(([id, answer]) => EXAM_QUESTIONS.find((question) => question.id === id)?.correctOptionId === answer).length;

  const resetQuestion = () => setSelectedOptionId(null);
  const changeFilters = (update: () => void) => {
    update(); setIndex(0); resetQuestion(); setFinished(false);
  };
  const submitAnswer = () => {
    if (!current || !selectedOptionId || submitted) return;
    setAnswers((previous) => ({ ...previous, [current.id]: selectedOptionId }));
    setSelectedOptionId(null);
  };
  const move = (nextIndex: number) => {
    setIndex(nextIndex); resetQuestion();
  };
  const restart = () => {
    setAnswers({}); setIndex(0); setSelectedOptionId(null); setFinished(false);
  };

  if (mode === 'viva') return <div className="space-y-5">
    <header className="relative overflow-hidden rounded-2xl border border-indigo-400/20 bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 p-6 sm:p-8">
      <div className="absolute -right-8 -top-16 h-56 w-56 rounded-full bg-violet-500/15 blur-3xl" />
      <div className="relative">
        <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-indigo-300">Oral exam practice · answer at your own pace</p>
        <h1 className="mt-2 text-2xl font-bold text-white sm:text-3xl">Computer Networks Viva</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-300">Browse the question bank, think through your response, then reveal a model answer. Filter by topic or search for a concept.</p>
        <div className="mt-5 flex flex-wrap gap-3 text-xs font-semibold"><span className="rounded-full border border-indigo-300/20 bg-indigo-400/10 px-3 py-1.5 text-indigo-100">{vivaQuestions.length.toLocaleString()} viva prompts</span><span className="rounded-full border border-slate-700 bg-slate-900/70 px-3 py-1.5 text-slate-300">{vivaTopics.length - 1} topics</span></div>
      </div>
    </header>
    <div className="flex gap-2 rounded-xl border border-slate-800 bg-slate-900 p-2" role="tablist" aria-label="Practice mode">
      <button type="button" role="tab" aria-selected={false} onClick={() => setMode('mcq')} className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-400 hover:bg-slate-800 hover:text-white">Multiple choice</button>
      <button type="button" role="tab" aria-selected className="rounded-lg bg-indigo-500/15 px-4 py-2 text-sm font-semibold text-indigo-200">Viva questions</button>
    </div>
    <section className="grid gap-3 rounded-xl border border-slate-800 bg-slate-900 p-4 sm:grid-cols-[1fr_260px]" aria-label="Viva question filters">
      <label className="space-y-1 text-xs text-slate-400">Search questions<input value={vivaQuery} onChange={(event) => { setVivaQuery(event.target.value); setVivaPage(0); setRevealedViva(null); }} placeholder="Search protocols, concepts, or question text" className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-400" /></label>
      <label className="space-y-1 text-xs text-slate-400">Topic<select value={vivaTopic} onChange={(event) => { setVivaTopic(event.target.value); setVivaPage(0); setRevealedViva(null); }} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white">{vivaTopics.map((topic) => <option key={topic}>{topic}</option>)}</select></label>
    </section>
    <p className="text-xs text-slate-500">Showing {visibleViva.length === 0 ? 0 : vivaPage * 50 + 1}–{Math.min((vivaPage + 1) * 50, visibleViva.length)} of {visibleViva.length.toLocaleString()} questions</p>
    <section className="grid gap-3 lg:grid-cols-2">
      {visibleViva.slice(vivaPage * 50, (vivaPage + 1) * 50).map((question, questionIndex) => <article key={question.id} className="group rounded-xl border border-slate-800 bg-slate-900 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-400/40 hover:shadow-lg hover:shadow-indigo-950/30">
        <div className="flex items-center justify-between gap-3"><span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">{question.topic}</span><span className="text-[10px] text-slate-500">{question.difficulty}</span></div>
        <h2 className="mt-3 text-sm font-semibold leading-relaxed text-white">{vivaPage * 50 + questionIndex + 1}. {question.question}</h2>
        {revealedViva === question.id ? <div className="mt-4 rounded-lg border border-emerald-500/20 bg-emerald-950/30 p-4 text-sm leading-relaxed text-emerald-100 animate-in fade-in">{question.answer}</div> : <button type="button" onClick={() => setRevealedViva(question.id)} className="mt-4 rounded-lg border border-indigo-400/30 bg-indigo-500/10 px-3 py-2 text-xs font-bold text-indigo-200 transition-colors hover:bg-indigo-500/20">Reveal model answer</button>}
      </article>)}
    </section>
    {visibleViva.length > 50 && <nav className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900 p-3" aria-label="Viva question pages"><button type="button" disabled={vivaPage === 0} onClick={() => { setVivaPage((page) => page - 1); setRevealedViva(null); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 disabled:opacity-40">Previous 50</button><span className="text-xs text-slate-400">Page {vivaPage + 1} of {Math.ceil(visibleViva.length / 50)}</span><button type="button" disabled={(vivaPage + 1) * 50 >= visibleViva.length} onClick={() => { setVivaPage((page) => page + 1); setRevealedViva(null); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="rounded-lg bg-indigo-500 px-3 py-2 text-xs font-bold text-white disabled:opacity-40">Next 50</button></nav>}
    {visibleViva.length === 0 && <p className="rounded-xl border border-slate-800 bg-slate-900 p-8 text-center text-sm text-slate-400">No viva questions match. Try a different topic or search term.</p>}
  </div>;

  return <div className="space-y-5">
    <header className="rounded-2xl border border-slate-800 bg-gradient-to-br from-sky-950/70 via-slate-900 to-slate-950 p-6">
      <p className="text-[10px] font-bold uppercase tracking-widest text-sky-400">Practice quiz</p>
      <h1 className="mt-1 text-xl font-bold text-white">Computer Networks</h1>
      <p className="mt-1 text-sm text-slate-400">{EXAM_QUESTIONS.length} multiple-choice questions with explanations across {categories.length - 1} topics.</p>
    </header>

    <div className="flex gap-2 rounded-xl border border-slate-800 bg-slate-900 p-2" role="tablist" aria-label="Practice mode">
      <button type="button" role="tab" aria-selected className="rounded-lg bg-sky-500/15 px-4 py-2 text-sm font-semibold text-sky-200">Multiple choice</button>
      <button type="button" role="tab" aria-selected={false} onClick={() => setMode('viva')} className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-400 hover:bg-slate-800 hover:text-white">Viva questions <span className="ml-1 text-indigo-300">{vivaQuestions.length.toLocaleString()}</span></button>
    </div>

    <section className="grid gap-3 rounded-xl border border-slate-800 bg-slate-900 p-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Quiz filters">
      <label className="space-y-1 text-xs text-slate-400">Search questions
        <span className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"><Search className="h-4 w-4 text-slate-500" /><input value={query} onChange={(event) => changeFilters(() => setQuery(event.target.value))} placeholder="Search topic or keyword" className="min-w-0 flex-1 bg-transparent text-white outline-none" /></span>
      </label>
      <label className="space-y-1 text-xs text-slate-400">Topic
        <select value={category} onChange={(event) => changeFilters(() => setCategory(event.target.value))} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white">{categories.map((item) => <option key={item}>{item}</option>)}</select>
      </label>
      <label className="space-y-1 text-xs text-slate-400">Difficulty
        <select value={difficulty} onChange={(event) => changeFilters(() => setDifficulty(event.target.value))} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white">{['All levels', 'Easy', 'Medium', 'Hard'].map((item) => <option key={item}>{item}</option>)}</select>
      </label>
      <div className="flex items-end"><button type="button" onClick={() => { setCategory('All topics'); setDifficulty('All levels'); setQuery(''); setIndex(0); setFinished(false); resetQuestion(); }} className="w-full rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800">Clear filters</button></div>
    </section>

    {finished ? <section className="mx-auto max-w-lg space-y-4 rounded-xl border border-slate-800 bg-slate-900 p-8 text-center">
      <Award className="mx-auto h-12 w-12 text-sky-400" />
      <h2 className="text-lg font-bold text-white">Quiz complete</h2>
      <p className="text-sm text-slate-300">You answered {Object.keys(answers).length} questions and got {correctCount} correct.</p>
      <button type="button" onClick={restart} className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-bold text-white"><RotateCcw className="h-4 w-4" />Retake quiz</button>
    </section> : current ? <section className="space-y-5 rounded-xl border border-slate-800 bg-slate-900 p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3 text-xs">
        <p className="font-mono font-bold text-sky-300">Question {index + 1} of {filteredQuestions.length}</p>
        <div className="flex gap-2"><span className="rounded bg-slate-800 px-2 py-1 text-slate-300">{current.category}</span><span className="rounded bg-slate-800 px-2 py-1 text-slate-400">{current.difficulty}</span></div>
        <p className="text-slate-400">Score: {correctCount} / {Object.keys(answers).length}</p>
      </div>
      <h2 className="text-base font-semibold leading-relaxed text-white">{current.question}</h2>
      <div className="space-y-2">
        {current.options.map((option) => {
          const correct = submitted && option.id === current.correctOptionId;
          const incorrect = submitted && selected === option.id && !correct;
          const active = selected === option.id;
          return <button key={option.id} type="button" onClick={() => !submitted && setSelectedOptionId(option.id)} disabled={submitted} className={`flex w-full items-center justify-between gap-3 rounded-lg border p-3 text-left text-sm transition-colors ${correct ? 'border-emerald-600 bg-emerald-950/60 text-emerald-200' : incorrect ? 'border-rose-600 bg-rose-950/60 text-rose-200' : active ? 'border-sky-500 bg-sky-950 text-white' : 'border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-600'}`}>
            <span>{option.text}</span>{correct && <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />}{incorrect && <XCircle className="h-4 w-4 shrink-0 text-rose-400" />}
          </button>;
        })}
      </div>
      {submitted && <div className="space-y-2 rounded-lg border border-slate-800 bg-slate-950 p-4"><p className={`inline-flex items-center gap-2 text-sm font-bold ${answers[current.id] === current.correctOptionId ? 'text-emerald-400' : 'text-rose-400'}`}>{answers[current.id] === current.correctOptionId ? <><CheckCircle2 className="h-4 w-4" />Correct</> : <><XCircle className="h-4 w-4" />Incorrect · correct answer: {current.correctOptionId.toUpperCase()}</>}</p><p className="text-sm leading-relaxed text-slate-300">{current.explanation}</p><p className="text-xs text-sky-300">Key rule: {current.keyRule}</p></div>}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-4">
        <button type="button" onClick={() => move(index - 1)} disabled={index === 0} className="inline-flex items-center gap-1 rounded-lg bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 disabled:opacity-40"><ChevronLeft className="h-4 w-4" />Previous</button>
        {!submitted ? <button type="button" onClick={submitAnswer} disabled={!selectedOptionId} className="rounded-lg bg-sky-600 px-5 py-2 text-xs font-bold text-white disabled:opacity-40">Check answer</button> : index < filteredQuestions.length - 1 ? <button type="button" onClick={() => move(index + 1)} className="inline-flex items-center gap-1 rounded-lg bg-sky-600 px-4 py-2 text-xs font-bold text-white">Next <ChevronRight className="h-4 w-4" /></button> : <button type="button" onClick={() => setFinished(true)} className="rounded-lg bg-sky-600 px-4 py-2 text-xs font-bold text-white">Finish quiz</button>}
      </div>
    </section> : <section className="rounded-xl border border-dashed border-slate-700 bg-slate-900 py-14 text-center"><X className="mx-auto h-7 w-7 text-slate-600" /><h2 className="mt-3 font-semibold text-white">No questions match your filters</h2><p className="mt-1 text-sm text-slate-400">Try another search or clear the filters.</p></section>}
  </div>;
};
