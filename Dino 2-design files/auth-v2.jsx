/* Auth + Profile for Dino 2 — local-only (localStorage) */
const { useState: useStateA, useEffect: useEffectA, useMemo: useMemoA } = React;

const AUTH_KEY = "dt_revision_user_v1";
const THEME_KEY = "dt_revision_theme_v1";

const AVATAR_OPTIONS = ["🦕", "🦖", "🦎", "🐙", "🦊", "🐼", "🐯", "🦁", "🐸", "🦄", "🐧", "🐨", "🐻", "🦉", "🐵", "🦔"];

function loadUser() {
  try { return JSON.parse(localStorage.getItem(AUTH_KEY)); } catch { return null; }
}
function saveUser(u) { localStorage.setItem(AUTH_KEY, JSON.stringify(u)); }
function clearUser() { localStorage.removeItem(AUTH_KEY); }

function useAuth() {
  const [user, setUser] = useStateA(loadUser);
  const signIn = (u) => { const full = { ...u, joinedAt: Date.now() }; saveUser(full); setUser(full); };
  const signOut = () => { clearUser(); setUser(null); };
  const update = (patch) => { const next = { ...user, ...patch }; saveUser(next); setUser(next); };
  return { user, signIn, signOut, update };
}

/* ---------- Tiny dino mascot ---------- */
function DinoMascot({ size = 160 }) {
  return (
    <svg viewBox="0 0 200 200" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
      {/* body */}
      <ellipse cx="100" cy="130" rx="62" ry="45" fill="#A5E6C3" stroke="#2A2344" strokeWidth="3.5" />
      {/* legs */}
      <rect x="70" y="160" width="14" height="22" rx="4" fill="#A5E6C3" stroke="#2A2344" strokeWidth="3.5" />
      <rect x="116" y="160" width="14" height="22" rx="4" fill="#A5E6C3" stroke="#2A2344" strokeWidth="3.5" />
      {/* tail */}
      <path d="M38 130 Q10 115 20 95 Q30 110 55 120 Z" fill="#A5E6C3" stroke="#2A2344" strokeWidth="3.5" strokeLinejoin="round"/>
      {/* head */}
      <ellipse cx="140" cy="90" rx="38" ry="34" fill="#A5E6C3" stroke="#2A2344" strokeWidth="3.5" />
      {/* neck connector */}
      <path d="M115 110 Q120 130 100 130" fill="#A5E6C3" stroke="#2A2344" strokeWidth="3.5" strokeLinejoin="round"/>
      {/* belly */}
      <path d="M70 138 Q100 160 130 138" fill="#FFE0C2" stroke="none"/>
      {/* back spikes */}
      <path d="M60 100 l6 -10 l6 10 M80 92 l6 -10 l6 10 M100 90 l6 -10 l6 10" stroke="#2A2344" strokeWidth="3" fill="#FFB088" strokeLinejoin="round"/>
      {/* eye */}
      <circle cx="150" cy="82" r="6" fill="#2A2344"/>
      <circle cx="152" cy="80" r="1.8" fill="#fff"/>
      {/* cheek */}
      <circle cx="130" cy="100" r="4" fill="#FFB7B7" opacity="0.7"/>
      {/* smile */}
      <path d="M148 100 Q158 108 165 102" stroke="#2A2344" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      {/* nostril */}
      <circle cx="170" cy="90" r="2" fill="#2A2344"/>
    </svg>
  );
}

/* ---------- Sign In Page ---------- */
function SignInPage({ onSignIn, onClose }) {
  const [name, setName] = useStateA("");
  const [avatar, setAvatar] = useStateA("🦕");
  const [classCode, setClassCode] = useStateA("");
  const [step, setStep] = useStateA(0); // 0 = name, 1 = avatar

  useEffectA(() => {
    if (!onClose) return;
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [onClose]);

  const canContinue = name.trim().length >= 2;

  const submit = () => {
    if (!canContinue) return;
    onSignIn({ name: name.trim(), avatar, classCode: classCode.trim() || null });
  };

  return (
    <div className="signin">
      {onClose && <button className="signin-close" onClick={onClose} aria-label="close">✕</button>}
      <div className="signin-left">
        <div className="signin-badge">DINO 2 · Study Club</div>
        <h1 className="signin-hero">Hey there,<br/>let's revise 🦕</h1>
        <p className="signin-sub">
          Pick a name and a pal, and we'll save your progress as you go. No emails, no passwords — it's just you and the dinos.
        </p>
        <div className="signin-mascot"><DinoMascot size={200} /></div>
        <div className="signin-features">
          <div className="signin-feature"><span>📚</span><div><b>25 topics</b><small>Core + Systems</small></div></div>
          <div className="signin-feature"><span>🃏</span><div><b>Flashcards</b><small>flip & learn</small></div></div>
          <div className="signin-feature"><span>🏆</span><div><b>Earn streaks</b><small>every day</small></div></div>
        </div>
      </div>

      <div className="signin-right">
        <div className="signin-card">
          <div className="signin-step-head">
            <span className="signin-step-num">{step + 1}</span>
            <span className="signin-step-label">of 2</span>
          </div>

          {step === 0 && (
            <>
              <h2 className="signin-q">What should we call you?</h2>
              <p className="signin-q-sub">First name is fine — this just shows up on your profile.</p>
              <input
                className="signin-input"
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={24}
                autoFocus
                onKeyDown={(e) => { if (e.key === "Enter" && canContinue) setStep(1); }}
              />
              <input
                className="signin-input signin-input-small"
                type="text"
                placeholder="Class code (optional)"
                value={classCode}
                onChange={(e) => setClassCode(e.target.value)}
                maxLength={12}
              />
              <button
                className="btn primary btn-big"
                disabled={!canContinue}
                onClick={() => setStep(1)}
              >Continue →</button>
            </>
          )}

          {step === 1 && (
            <>
              <h2 className="signin-q">Pick your revision pal</h2>
              <p className="signin-q-sub">This shows up as your avatar. You can change it later.</p>
              <div className="avatar-grid">
                {AVATAR_OPTIONS.map((a) => (
                  <button
                    key={a}
                    className={`avatar-opt ${avatar === a ? "selected" : ""}`}
                    onClick={() => setAvatar(a)}
                  >{a}</button>
                ))}
              </div>
              <div className="signin-preview">
                <div className="signin-preview-avatar">{avatar}</div>
                <div>
                  <div className="signin-preview-name">{name || "You"}</div>
                  <div className="signin-preview-meta">{classCode ? "Class " + classCode : "Ready to learn"}</div>
                </div>
              </div>
              <div className="signin-actions">
                <button className="btn" onClick={() => setStep(0)}>← Back</button>
                <button className="btn primary btn-big" onClick={submit}>Let's go! 🚀</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- Profile Page ---------- */
function ProfilePage({ user, topics, progress, onUpdate, onSignOut, onBack, onResetProgress }) {
  const [editing, setEditing] = useStateA(false);
  const [draftName, setDraftName] = useStateA(user.name);
  const [draftAvatar, setDraftAvatar] = useStateA(user.avatar);
  const [draftClass, setDraftClass] = useStateA(user.classCode || "");

  const stats = useMemoA(() => {
    const started = topics.filter(t => (progress[t.code]?.pct || window.topicPercent?.(progress[t.code]) || 0) > 0).length;
    const mastered = topics.filter(t => (window.topicPercent?.(progress[t.code]) || 0) === 100).length;
    const totalPct = topics.reduce((s, t) => s + (window.topicPercent?.(progress[t.code]) || 0), 0);
    const overall = topics.length ? Math.round(totalPct / topics.length) : 0;
    // words learned = sum of flashcards in topics they've started
    const words = topics.reduce((s, t) => {
      const pct = window.topicPercent?.(progress[t.code]) || 0;
      if (pct === 0) return s;
      return s + Math.floor((t.flashcards?.length || 0) * (pct / 100));
    }, 0);
    return { started, mastered, overall, words };
  }, [topics, progress]);

  const days = Math.max(1, Math.floor((Date.now() - user.joinedAt) / 86400000));
  const level = Math.min(10, Math.floor(stats.overall / 10) + 1);

  const save = () => {
    if (draftName.trim().length >= 2) {
      onUpdate({ name: draftName.trim(), avatar: draftAvatar, classCode: draftClass.trim() || null });
      setEditing(false);
    }
  };

  const doReset = () => {
    if (confirm("Reset ALL your progress? This can't be undone.")) onResetProgress();
  };
  const doSignOut = () => {
    if (confirm("Sign out? Your progress stays saved on this device.")) onSignOut();
  };

  // sort topics by progress for recent activity section
  const byProgress = [...topics]
    .map(t => ({ t, pct: window.topicPercent?.(progress[t.code]) || 0 }))
    .filter(x => x.pct > 0)
    .sort((a, b) => b.pct - a.pct);

  return (
    <div className="profile-page">
      <div className="profile-bar">
        <button className="btn" onClick={onBack}>← Back to topics</button>
        <span className="profile-bar-title">My Profile</span>
        <button className="btn btn-ghost" onClick={doSignOut}>Sign out</button>
      </div>

      <div className="profile-layout">
        {/* Hero card */}
        <div className="profile-hero">
          <div className="profile-avatar-wrap">
            <div className="profile-avatar-big">{user.avatar}</div>
            <div className="profile-level-badge">LVL {level}</div>
          </div>
          <div className="profile-hero-text">
            {!editing ? (
              <>
                <h1 className="profile-name">{user.name}</h1>
                <div className="profile-meta">
                  {user.classCode && <span className="profile-class">Class {user.classCode}</span>}
                  <span>Revising for {days} day{days === 1 ? "" : "s"}</span>
                </div>
                <button className="btn btn-small" onClick={() => setEditing(true)}>✏️ Edit profile</button>
              </>
            ) : (
              <div className="profile-edit">
                <input className="signin-input signin-input-small" value={draftName} onChange={(e) => setDraftName(e.target.value)} maxLength={24}/>
                <input className="signin-input signin-input-small" value={draftClass} placeholder="Class code" onChange={(e) => setDraftClass(e.target.value)} maxLength={12}/>
                <div className="profile-avatar-picker">
                  {AVATAR_OPTIONS.map((a) => (
                    <button key={a} className={`avatar-opt ${draftAvatar === a ? "selected" : ""}`} onClick={() => setDraftAvatar(a)}>{a}</button>
                  ))}
                </div>
                <div className="profile-edit-actions">
                  <button className="btn" onClick={() => { setEditing(false); setDraftName(user.name); setDraftAvatar(user.avatar); setDraftClass(user.classCode || ""); }}>Cancel</button>
                  <button className="btn primary" onClick={save}>Save</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className="profile-stats">
          <div className="pstat pstat-overall">
            <div className="pstat-value">{stats.overall}<small>%</small></div>
            <div className="pstat-label">Overall</div>
            <div className="pstat-bar"><span style={{ width: stats.overall + "%" }}/></div>
          </div>
          <div className="pstat pstat-started">
            <div className="pstat-value">{stats.started}</div>
            <div className="pstat-label">Topics started</div>
          </div>
          <div className="pstat pstat-mastered">
            <div className="pstat-value">{stats.mastered}<small>/{topics.length}</small></div>
            <div className="pstat-label">Mastered</div>
          </div>
          <div className="pstat pstat-words">
            <div className="pstat-value">{stats.words}</div>
            <div className="pstat-label">Key words learned</div>
          </div>
        </div>

        {/* Activity */}
        <div className="profile-section">
          <h3 className="profile-section-title">Your progress</h3>
          {byProgress.length === 0 ? (
            <div className="profile-empty">
              <span>🦖</span>
              <div>
                <b>No progress yet — that's okay!</b>
                <small>Open any topic and the dinos will start tracking what you've learned.</small>
              </div>
            </div>
          ) : (
            <div className="profile-topics">
              {byProgress.slice(0, 8).map(({ t, pct }) => (
                <div key={t.code} className="profile-topic-row">
                  <span className="profile-topic-code">{t.code}</span>
                  <span className="profile-topic-title">{t.title}</span>
                  <span className="profile-topic-bar"><span style={{ width: pct + "%" }}/></span>
                  <span className="profile-topic-pct">{pct}%</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Settings */}
        <div className="profile-section">
          <h3 className="profile-section-title">Settings</h3>
          <div className="profile-settings">
            <ProfileSetting
              label="Theme"
              value={<ThemeToggle/>}
              help="Switch between cream paper and dark mode."
            />
            <ProfileSetting
              label="Reset progress"
              value={<button className="btn btn-danger" onClick={doReset}>Reset all progress</button>}
              help="Clears flashcards, quizzes and notes read. Your profile stays."
            />
            <ProfileSetting
              label="Sign out"
              value={<button className="btn" onClick={doSignOut}>Sign out of Dino 2</button>}
              help="Progress stays saved on this device."
            />
          </div>
        </div>

        <div className="profile-foot">
          Member of Study Club since {new Date(user.joinedAt).toLocaleDateString()}.<br/>
          Made with 🦕 for GCSE revision.
        </div>
      </div>
    </div>
  );
}

function ProfileSetting({ label, value, help }) {
  return (
    <div className="profile-setting">
      <div>
        <div className="profile-setting-label">{label}</div>
        <div className="profile-setting-help">{help}</div>
      </div>
      <div className="profile-setting-value">{value}</div>
    </div>
  );
}

function ThemeToggle() {
  const [theme, setTheme] = useStateA(() => localStorage.getItem(THEME_KEY) || "light");
  useEffectA(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);
  return (
    <div className="theme-toggle">
      <button className={theme === "light" ? "on" : ""} onClick={() => setTheme("light")}>☀️ Light</button>
      <button className={theme === "dark" ? "on" : ""} onClick={() => setTheme("dark")}>🌙 Dark</button>
    </div>
  );
}

/* ---------- Floating sign-in / avatar button (bottom-left, always visible) ---------- */
function FloatingAuthButton({ user, onSignInClick, onProfileClick }) {
  if (user) {
    return (
      <button className="fab-auth fab-signed-in" onClick={onProfileClick} aria-label="Open profile">
        <span className="fab-avatar">{user.avatar}</span>
        <span className="fab-text">
          <span className="fab-name">{user.name}</span>
          <span className="fab-sub">My profile</span>
        </span>
      </button>
    );
  }
  return (
    <button className="fab-auth fab-signed-out" onClick={onSignInClick}>
      <span className="fab-dino">🦕</span>
      <span className="fab-text">
        <span className="fab-name">Sign in</span>
        <span className="fab-sub">Save your progress</span>
      </span>
    </button>
  );
}

/* ---------- Avatar button (goes in hero) ---------- */
function AvatarButton({ user, onClick }) {
  return (
    <button className="avatar-btn" onClick={onClick} aria-label="Open profile">
      <span className="avatar-btn-face">{user.avatar}</span>
      <span className="avatar-btn-name">{user.name.split(" ")[0]}</span>
    </button>
  );
}

/* Expose to window so app-v2.jsx can use them */
Object.assign(window, {
  useAuth,
  SignInPage,
  ProfilePage,
  AvatarButton,
  FloatingAuthButton,
  DinoMascot,
  ThemeToggle,
  loadUser,
  saveUser,
  clearUser,
  AUTH_KEY,
});
