const { useState, useEffect, useMemo } = React;

// ---------- Progress helpers (localStorage) ----------
const LS_KEY = "dt_revision_progress_v1";
const LS_THEME = "dt_revision_theme_v1";

function loadProgress() {
  try {return JSON.parse(localStorage.getItem(LS_KEY)) || {};}
  catch {return {};}
}
function saveProgress(p) {localStorage.setItem(LS_KEY, JSON.stringify(p));}

function topicPercent(entry) {
  if (!entry) return 0;
  const fc = entry.flashcardsDone ? 1 : 0;
  const mcq = (entry.mcqBestScore || 0) >= 0.8 ? 1 : 0;
  const ex = entry.explainSelfAssessed ? 1 : 0;
  return Math.round((fc + mcq + ex) / 3 * 100);
}

// ---------- Section meta ----------
const SECTIONS = {
  core: {
    label: "Core Content",
    sub: "Topics 1.1 – 1.17 · examined for every specialism",
    accent: "var(--accent-core)",
    chip: "CORE"
  },
  systems: {
    label: "Material Specialism · Systems",
    sub: "Topics 5.1 – 5.8 · electronics, PCBs, microcontrollers",
    accent: "var(--accent-sys)",
    chip: "SYSTEMS"
  }
};

// ---------- Small UI atoms ----------
function Ring({ percent, size = 44, stroke = 3 }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c - percent / 100 * c;
  return (
    <svg width={size} height={size} className="ring" aria-hidden="true">
      <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke}
      className="ring-track" fill="none" />
      <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke}
      className="ring-fill" fill="none"
      strokeDasharray={c} strokeDashoffset={off}
      strokeLinecap="round"
      transform={`rotate(-90 ${size / 2} ${size / 2})`} />
    </svg>);

}

function Meter({ percent, accent }) {
  return (
    <div className="meter" aria-label={`${percent}% complete`}>
      <div className="meter-fill" style={{ width: `${percent}%`, background: accent }} />
    </div>);

}

// ---------- Topic card ----------
function TopicCard({ topic, entry, onOpen }) {
  const pct = topicPercent(entry);
  const done = pct === 100;
  const meta = SECTIONS[topic.section];
  return (
    <article className={`card ${done ? "card-done" : ""}`}
    style={{ "--card-accent": meta.accent, backgroundColor: "rgb(251, 251, 251)" }}>
      <div className="card-rule" />
      <header className="card-head">
        <div className="card-chip">
          <span className="chip-code">{topic.code}</span>
          <span className="chip-sep">·</span>
          <span className="chip-section">{meta.chip}</span>
        </div>
        {done && <span className="tick" aria-label="completed">✓</span>}
      </header>

      <h3 className="card-title" style={{ fontFamily: "ui-monospace", fontSize: "18px" }}>{topic.title}</h3>

      <div className="card-meta">
        <span>{topic.vocabCount} key terms</span>
        <span className="card-meta-sep">·</span>
        <span>3 study modes</span>
      </div>

      <div className="card-progress">
        <Meter percent={pct} accent={meta.accent} />
        <span className="card-pct">{pct}<span className="pct-sym">%</span></span>
      </div>

      <div className="card-actions">
        <button className="act" onClick={() => onOpen(topic, "flashcards")}>
          Flashcards
        </button>
        <button className="act" onClick={() => onOpen(topic, "mcq")}>
          MCQ
        </button>
        <button className="act" onClick={() => onOpen(topic, "explain")}>
          Explain
        </button>
      </div>

      <button className="notes-link" onClick={() => onOpen(topic, "notes")}>
        Study notes →
      </button>
    </article>);

}

// ---------- Header ----------
function Header({ overall, query, setQuery }) {
  return (
    <header className="site-head">
      <div className="head-left">
        <div className="mark">
          <span className="mark-dot" />
        </div>
        <div className="titles">
          <h1 className="site-title">Systems<span className="site-title-sep">.</span>Revise</h1>
          <p className="site-sub">Edexcel iGCSE (9–1) Design &amp; Technology · Systems specialism</p>
        </div>
      </div>

      <div className="head-right">
        <label className="search">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            type="text"
            placeholder="Search topics, terms…"
            value={query}
            onChange={(e) => setQuery(e.target.value)} />
          
          {query &&
          <button className="search-clear" onClick={() => setQuery("")} aria-label="clear">×</button>
          }
        </label>

        <div className="overall">
          <Ring percent={overall} size={56} stroke={3} />
          <div className="overall-text">
            <span className="overall-pct">{overall}<span className="pct-sym">%</span></span>
            <span className="overall-label">overall</span>
          </div>
        </div>
      </div>
    </header>);

}

// ---------- Section band ----------
function SectionBand({ meta, count, doneCount }) {
  return (
    <div className="band" style={{ "--band-accent": meta.accent }}>
      <div className="band-left">
        <span className="band-rule" />
        <h2 className="band-title">{meta.label}</h2>
      </div>
      <div className="band-right">
        <span className="band-sub">{meta.sub}</span>
        <span className="band-count">
          <b>{doneCount}</b> of {count} complete
        </span>
      </div>
    </div>);

}

// ---------- App ----------
function App() {
  const [progress, setProgress] = useState(loadProgress);
  const [query, setQuery] = useState("");
  const topics = window.TOPICS || [];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return topics;
    return topics.filter((t) =>
    t.title.toLowerCase().includes(q) ||
    t.code.toLowerCase().includes(q)
    );
  }, [topics, query]);

  const core = filtered.filter((t) => t.section === "core");
  const systems = filtered.filter((t) => t.section === "systems");

  const overall = useMemo(() => {
    if (!topics.length) return 0;
    const total = topics.reduce((s, t) => s + topicPercent(progress[t.code]), 0);
    return Math.round(total / topics.length);
  }, [topics, progress]);

  const coreDone = core.filter((t) => topicPercent(progress[t.code]) === 100).length;
  const sysDone = systems.filter((t) => topicPercent(progress[t.code]) === 100).length;

  const handleOpen = (topic, mode) => {
    // Study modes wired later. For now, stub the progress so the UI feels alive.
    console.log("open", topic.code, mode);
  };

  return (
    <div className="page">
      <Header
        overall={overall}
        query={query} setQuery={setQuery} />
      

      <main className="main">
        {core.length > 0 &&
        <section className="group">
            <SectionBand meta={SECTIONS.core} count={core.length} doneCount={coreDone} />
            <div className="grid">
              {core.map((t) =>
            <TopicCard key={t.code} topic={t}
            entry={progress[t.code]} onOpen={handleOpen} />
            )}
            </div>
          </section>
        }

        {systems.length > 0 &&
        <section className="group">
            <SectionBand meta={SECTIONS.systems} count={systems.length} doneCount={sysDone} />
            <div className="grid">
              {systems.map((t) =>
            <TopicCard key={t.code} topic={t}
            entry={progress[t.code]} onOpen={handleOpen} />
            )}
            </div>
          </section>
        }

        {filtered.length === 0 &&
        <div className="empty">
            <p>No topics match "<b>{query}</b>".</p>
            <button className="act" onClick={() => setQuery("")}>Clear search</button>
          </div>
        }
      </main>

      <footer className="foot">
        <span>Progress stored locally in your browser.</span>
        <span className="foot-sep">·</span>
        <span>25 topics · 17 core + 8 Systems</span>
      </footer>
    </div>);

}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);