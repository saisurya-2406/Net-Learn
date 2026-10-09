import React, { useEffect, useMemo, useState } from 'react';
import { Bookmark, BookmarkCheck, ExternalLink, Search, Video, BookOpen, Router, Wrench, FileText, GraduationCap, FlaskConical, X } from 'lucide-react';
import { LEARNING_RESOURCES, RESOURCE_CATEGORIES, type LearningResource, type ResourceKind } from '../../data/resourceLibrary';

const KIND_ICONS: Record<ResourceKind, React.ComponentType<{ className?: string }>> = {
  'YouTube channel': Video,
  'YouTube search': Search,
  Video,
  'Video candidate': Video,
  Course: GraduationCap,
  Simulator: Router,
  Tool: Wrench,
  'Protocol specification': FileText,
  Guide: BookOpen,
  Lab: FlaskConical,
  'Learning path': BookOpen,
};

const readBookmarks = () => {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem('netlearn-resource-bookmarks') ?? '[]');
    return Array.isArray(saved) && saved.every((id) => typeof id === 'string') ? saved as string[] : [];
  } catch {
    return [];
  }
};

const readCompleted = () => {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem('netlearn-resource-progress') ?? '[]');
    return Array.isArray(saved) && saved.every((id) => typeof id === 'string') ? saved as string[] : [];
  } catch {
    return [];
  }
};

export const StudyResourcesView: React.FC<{ onOpenSection?: (section: NonNullable<LearningResource['appSection']>) => void }> = ({ onOpenSection }) => {
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState('All resources');
  const [topic, setTopic] = useState('All topics');
  const [provider, setProvider] = useState('All providers');
  const [difficulty, setDifficulty] = useState('All levels');
  const [language, setLanguage] = useState('All languages');
  const [bookmarks, setBookmarks] = useState<string[]>(readBookmarks);
  const [bookmarksOnly, setBookmarksOnly] = useState(false);
  const [completed, setCompleted] = useState<string[]>(readCompleted);
  const [completedOnly, setCompletedOnly] = useState(false);
  const [selected, setSelected] = useState<LearningResource | null>(null);
  const [sortOrder, setSortOrder] = useState<'title-asc' | 'title-desc' | 'type' | 'provider'>('title-asc');
  const [page, setPage] = useState(1);
  const pageSize = 18;

  const topics = useMemo(() => [...new Set(LEARNING_RESOURCES.map((item) => item.topic))].sort(), []);
  const providers = useMemo(() => [...new Set(LEARNING_RESOURCES.map((item) => item.provider))].sort(), []);
  const languages = useMemo(() => [...new Set(LEARNING_RESOURCES.map((item) => item.language ?? 'Not specified'))].sort(), []);
  const filtered = useMemo(() => {
    const terms = query.trim().toLowerCase();
    return LEARNING_RESOURCES.filter((item) => {
      const searchable = [item.title, item.description, item.kind, item.topic, item.provider, item.url, item.access, ...item.tags, ...(item.details ?? [])].join(' ').toLowerCase();
      return (!terms || searchable.includes(terms))
        && (kind === 'All resources' || item.kind === kind)
        && (topic === 'All topics' || item.topic === topic)
        && (provider === 'All providers' || item.provider === provider)
        && (difficulty === 'All levels' || item.difficulty === difficulty)
        && (language === 'All languages' || (item.language ?? 'Not specified') === language)
        && (!bookmarksOnly || bookmarks.includes(item.id))
        && (!completedOnly || completed.includes(item.id));
    }).sort((a, b) => sortOrder === 'title-desc' ? b.title.localeCompare(a.title)
      : sortOrder === 'type' ? a.kind.localeCompare(b.kind) || a.title.localeCompare(b.title)
        : sortOrder === 'provider' ? a.provider.localeCompare(b.provider) || a.title.localeCompare(b.title)
          : a.title.localeCompare(b.title));
  }, [query, kind, topic, provider, difficulty, language, bookmarksOnly, bookmarks, completedOnly, completed, sortOrder]);

  useEffect(() => setPage(1), [query, kind, topic, provider, difficulty, language, bookmarksOnly, completedOnly, sortOrder]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visibleResources = filtered.slice((page - 1) * pageSize, page * pageSize);

  const toggleBookmark = (id: string) => {
    setBookmarks((current) => {
      const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
      localStorage.setItem('netlearn-resource-bookmarks', JSON.stringify(next));
      return next;
    });
  };
  const toggleCompleted = (id: string) => {
    setCompleted((current) => {
      const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
      localStorage.setItem('netlearn-resource-progress', JSON.stringify(next));
      return next;
    });
  };
  const clearFilters = () => {
    setQuery(''); setKind('All resources'); setTopic('All topics'); setProvider('All providers');
    setDifficulty('All levels'); setLanguage('All languages'); setBookmarksOnly(false); setCompletedOnly(false); setSortOrder('title-asc'); setPage(1);
  };
  const Select = ({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) => (
    <label className="min-w-0 space-y-1 text-[11px] text-slate-400">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white">
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-sky-950/50 p-6">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-400">NetLearn Resource Hub</p>
        <h1 className="mt-2 text-2xl font-bold text-white">Computer Networks learning library</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-300">Browse official protocol specifications, learning platforms, simulators, packet tools, and channel pages. Channel and search links are labeled accurately; search results are not presented as verified videos.</p>
        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {RESOURCE_CATEGORIES.slice(1).map((category) => <div key={category} className="rounded-lg border border-slate-700/80 bg-slate-950/60 p-3"><p className="text-lg font-bold text-white">{LEARNING_RESOURCES.filter((item) => item.kind === category).length}</p><p className="text-[11px] text-slate-400">{category}</p></div>)}
        </div>
      </header>

      <section className="rounded-xl border border-slate-800 bg-slate-900 p-4" aria-label="Search and filter resources">
        <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
          <label className="space-y-1 text-[11px] text-slate-400 md:col-span-3 lg:col-span-2">
            <span>Search title, topic, protocol, or description</span>
            <span className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"><Search className="h-4 w-4 shrink-0 text-slate-500" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try OSPF, Wireshark, subnetting…" className="min-w-0 flex-1 bg-transparent text-xs text-white outline-none placeholder:text-slate-600" /></span>
          </label>
          <Select label="Resource type" value={kind} onChange={setKind} options={[...RESOURCE_CATEGORIES]} />
          <Select label="Topic / protocol" value={topic} onChange={setTopic} options={['All topics', ...topics]} />
          <Select label="Provider" value={provider} onChange={setProvider} options={['All providers', ...providers]} />
          <Select label="Difficulty" value={difficulty} onChange={setDifficulty} options={['All levels', 'Beginner', 'Intermediate', 'Advanced']} />
          <Select label="Language" value={language} onChange={setLanguage} options={['All languages', ...languages]} />
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800 pt-3">
          <p className="text-xs text-slate-400">Showing <strong className="text-white">{filtered.length}</strong> of {LEARNING_RESOURCES.length} resources</p>
          <div className="flex gap-2">
            <label className="flex items-center gap-2 text-[11px] text-slate-400">Sort
              <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value as typeof sortOrder)} className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-xs text-white"><option value="title-asc">Title A–Z</option><option value="title-desc">Title Z–A</option><option value="type">Resource type</option><option value="provider">Provider</option></select>
            </label>
            <button type="button" onClick={() => setBookmarksOnly((value) => !value)} aria-pressed={bookmarksOnly} className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold ${bookmarksOnly ? 'bg-sky-600 text-white' : 'border border-slate-700 text-slate-300 hover:bg-slate-800'}`}><BookmarkCheck className="h-4 w-4" />Saved ({bookmarks.length})</button>
            <button type="button" onClick={() => setCompletedOnly((value) => !value)} aria-pressed={completedOnly} className={`rounded-lg px-3 py-2 text-xs font-semibold ${completedOnly ? 'bg-emerald-700 text-white' : 'border border-slate-700 text-slate-300 hover:bg-slate-800'}`}>Completed ({completed.length})</button>
            <button type="button" onClick={clearFilters} className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800"><X className="h-4 w-4" />Clear filters</button>
          </div>
        </div>
      </section>

      {filtered.length ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {visibleResources.map((item) => {
          const Icon = KIND_ICONS[item.kind];
          return <article key={item.id} className="flex flex-col rounded-xl border border-slate-800 bg-slate-900 p-4 transition-colors hover:border-sky-700">
            <div className="flex items-start justify-between gap-3">
              <span className="inline-flex items-center gap-2 rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-sky-300"><Icon className="h-3.5 w-3.5" />{item.kind}</span>
              <button type="button" onClick={() => toggleBookmark(item.id)} aria-label={bookmarks.includes(item.id) ? 'Remove bookmark' : 'Save resource'} aria-pressed={bookmarks.includes(item.id)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-sky-300">{bookmarks.includes(item.id) ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}</button>
            </div>
            {item.thumbnailUrl && <a href={item.url} target="_blank" rel="noopener noreferrer" className="mt-3 block overflow-hidden rounded-lg bg-slate-950"><img src={item.thumbnailUrl} alt={`Thumbnail for ${item.title}`} loading="lazy" className="aspect-video w-full object-cover" /></a>}
            <h2 className="mt-3 text-base font-bold leading-snug text-white">{item.title}</h2>
            <p className="mt-1 text-[11px] text-slate-500">{item.provider} · {item.topic}</p>
            <p className="mt-1 text-[10px] text-slate-500">{item.difficulty}{item.duration ? ` · ${item.duration}` : ''}{item.language ? ` · ${item.language}` : ''}</p>
            <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-300">{item.description}</p>
            <div className="mt-4 flex flex-wrap gap-1.5">{item.tags.slice(0, 4).map((tag) => <span key={tag} className="rounded-full bg-slate-800 px-2 py-1 text-[10px] text-slate-400">{tag}</span>)}</div>
            <div className="mt-4 space-y-2 border-t border-slate-800 pt-3">
              <p className="text-[11px] text-slate-400"><span className="font-semibold text-slate-300">Status:</span> {item.status}</p>
              <p className="text-[11px] leading-relaxed text-slate-400">{item.access}</p>
              <div className="flex items-center justify-between gap-2 pt-1">
                <button type="button" onClick={() => setSelected(item)} className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800">Details & exercise</button>
                {item.appSection && onOpenSection ? <button type="button" onClick={() => onOpenSection(item.appSection!)} className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-600">Open in NetLearn</button> : <a href={item.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-3 py-2 text-xs font-bold text-white hover:bg-sky-500">{item.kind === 'Video' ? 'Watch video' : 'Open source'} <ExternalLink className="h-3.5 w-3.5" /></a>}
              </div>
            </div>
          </article>;
        })}
      </div> : <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/70 py-16 text-center"><Search className="mx-auto h-7 w-7 text-slate-600" /><h2 className="mt-3 font-semibold text-white">No resources match these filters</h2><p className="mt-1 text-sm text-slate-400">Try a different topic or clear the filters.</p><button type="button" onClick={clearFilters} className="mt-4 rounded-lg bg-sky-600 px-4 py-2 text-xs font-bold text-white">Show all resources</button></div>}

      {filtered.length > pageSize && <nav aria-label="Resource pages" className="flex items-center justify-center gap-3"><button type="button" disabled={page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))} className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-300 disabled:opacity-40">Previous</button><span className="text-xs text-slate-400">Page {page} of {pageCount}</span><button type="button" disabled={page >= pageCount} onClick={() => setPage((current) => Math.min(pageCount, current + 1))} className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-300 disabled:opacity-40">Next</button></nav>}

      {selected && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null); }}>
        <section role="dialog" aria-modal="true" aria-labelledby="resource-detail-title" className="max-h-[85vh] w-full max-w-2xl overflow-auto rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-2xl">
          <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-widest text-sky-400">{selected.kind} · {selected.topic}</p><h2 id="resource-detail-title" className="mt-2 text-xl font-bold text-white">{selected.title}</h2></div><button type="button" onClick={() => setSelected(null)} aria-label="Close details" className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"><X className="h-5 w-5" /></button></div>
          <p className="mt-4 text-sm leading-relaxed text-slate-300">{selected.description}</p>
          {selected.youtubeId && <div className="mt-4 aspect-video overflow-hidden rounded-xl bg-black"><iframe title={selected.title} src={`https://www.youtube-nocookie.com/embed/${selected.youtubeId}`} className="h-full w-full" loading="lazy" referrerPolicy="strict-origin-when-cross-origin" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen /></div>}
          <div className="mt-4 grid gap-3 sm:grid-cols-2"><p className="rounded-lg bg-slate-950 p-3 text-xs text-slate-300"><strong className="block text-slate-500">Difficulty</strong>{selected.difficulty}</p><p className="rounded-lg bg-slate-950 p-3 text-xs text-slate-300"><strong className="block text-slate-500">Access</strong>{selected.access}</p></div>
          {selected.learningObjectives?.length ? <div className="mt-4"><h3 className="text-sm font-semibold text-white">Learning objectives</h3><ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-slate-300">{selected.learningObjectives.map((objective) => <li key={objective}>{objective}</li>)}</ul></div> : null}
          {selected.details?.length ? <div className="mt-4"><h3 className="text-sm font-semibold text-white">How to use it</h3><ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-slate-300">{selected.details.map((detail) => <li key={detail}>{detail}</li>)}</ul></div> : null}
          {selected.licenseNotes && <p className="mt-4 rounded-lg border border-slate-800 bg-slate-950 p-3 text-xs text-slate-300"><strong className="text-slate-400">Licensing:</strong> {selected.licenseNotes}</p>}
          <button type="button" onClick={() => toggleCompleted(selected.id)} aria-pressed={completed.includes(selected.id)} className={`mt-4 rounded-lg px-3 py-2 text-xs font-bold ${completed.includes(selected.id) ? 'border border-emerald-700 text-emerald-300' : 'bg-emerald-700 text-white hover:bg-emerald-600'}`}>{completed.includes(selected.id) ? 'Completed · click to undo' : 'Mark resource complete'}</button>
          {selected.relatedLabs?.length ? <div className="mt-4"><h3 className="text-sm font-semibold text-white">Related practical labs</h3><div className="mt-2 flex flex-wrap gap-2">{selected.relatedLabs.map((labId) => <button key={labId} type="button" onClick={() => { setSelected(null); onOpenSection?.('labs'); }} className="rounded-lg border border-emerald-800 px-3 py-2 text-xs font-semibold text-emerald-300">Open related lab in NetLearn ({labId})</button>)}</div></div> : null}
          {selected.docsUrl && <a href={selected.docsUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-sky-300">Official documentation <ExternalLink className="h-4 w-4" /></a>}
          {selected.repositoryUrl && <a href={selected.repositoryUrl} target="_blank" rel="noopener noreferrer" className="ml-4 inline-flex items-center gap-2 text-sm font-semibold text-sky-300">Source repository <ExternalLink className="h-4 w-4" /></a>}
          <p className="mt-4 text-[11px] text-slate-500">Link status: {selected.status}. Catalog record date: {selected.lastChecked}; this is not a successful live check.</p>
          {selected.appSection && onOpenSection ? <button type="button" onClick={() => { setSelected(null); onOpenSection(selected.appSection!); }} className="mt-5 inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-bold text-white">Open in NetLearn</button> : <a href={selected.url} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-bold text-white">Open original resource <ExternalLink className="h-4 w-4" /></a>}
        </section>
      </div>}
    </div>
  );
};
