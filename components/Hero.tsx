import Image from "next/image"

type Props = {
  overall: number
  coreDone: number
  coreTotal: number
  sysDone: number
  sysTotal: number
  topicsTotal: number
  firstName?: string | null
}

export function Hero({ overall, coreDone, coreTotal, sysDone, sysTotal, topicsTotal, firstName }: Props) {
  return (
    <div className="hero">
      <div className="hero-top">
        <div className="logo">
          <div className="logo-mark logo-mark-img">
            <Image src="/assets/salih-avatar.png" alt="" width={42} height={42} />
          </div>
          <span><em className="logo-accent">dt</em><b>.mr-salih.uk</b></span>
        </div>
        <div className="hero-spec">Edexcel iGCSE · D&amp;T Systems</div>
      </div>

      <div className="hero-body">
        <div className="hero-body-left">
          <h1>
            {firstName ? (
              <>Hey <em>{firstName}</em> — let&apos;s smash it.</>
            ) : (
              <>Let&apos;s smash <em>GCSE revision</em> — one topic at a time.</>
            )}
          </h1>
          <p className="hero-sub">
            Flip flashcards, crush quizzes, and practise exam answers across all {topicsTotal} topics. Your progress saves automatically.
          </p>
          <div className="stats">
            <div className="stat stat-overall"><div className="stat-value">{overall}<span className="suf">%</span></div><div className="stat-label">Overall</div></div>
            <div className="stat stat-core"><div className="stat-value">{coreDone}<span className="suf">/{coreTotal}</span></div><div className="stat-label">Core done</div></div>
            <div className="stat stat-sys"><div className="stat-value">{sysDone}<span className="suf">/{sysTotal}</span></div><div className="stat-label">Systems done</div></div>
            <div className="stat"><div className="stat-value">{topicsTotal}</div><div className="stat-label">Topics total</div></div>
          </div>
        </div>
        <div className="hero-body-right">
          <Image src="/assets/hero-pupils.png" alt="Two pupils with boxes of D&T topics" width={300} height={300} className="hero-illo" />
        </div>
      </div>
    </div>
  )
}
