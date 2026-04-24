import { Hero } from "@/components/Hero"
import { TopicGrid } from "@/components/TopicGrid"
import { listTopics } from "@/lib/content"
import { computeTopicProgress } from "@/lib/progress"
import { getAuthenticatedProfile } from "@/lib/auth"

export const dynamic = "force-dynamic"

export default async function HomePage() {
  const profile = await getAuthenticatedProfile()
  const topics = await listTopics(profile?.userId)
  const progress = profile
    ? await computeTopicProgress({ pupilId: profile.userId, lessonIds: topics.map((t) => t.lessonId) })
    : {}

  const signedIn = Boolean(profile)
  const enriched = topics.map((t) => ({
    code: t.code,
    title: t.title,
    rawTitle: t.rawTitle,
    section: t.section,
    lessonId: t.lessonId,
    vocabCount: t.vocabCount,
    progress: progress[t.lessonId] ?? { flashcardsDone: false, mcqPassed: false, explainDone: false },
  }))

  const coreTotal = enriched.filter((t) => t.section === "core").length
  const sysTotal = enriched.filter((t) => t.section === "systems").length
  const coreDone = signedIn
    ? enriched.filter((t) => t.section === "core" && t.progress.flashcardsDone && t.progress.mcqPassed && t.progress.explainDone).length
    : 0
  const sysDone = signedIn
    ? enriched.filter((t) => t.section === "systems" && t.progress.flashcardsDone && t.progress.mcqPassed && t.progress.explainDone).length
    : 0
  const overall = signedIn && enriched.length
    ? Math.round(
        (enriched.reduce((s, t) => s + ([t.progress.flashcardsDone, t.progress.mcqPassed, t.progress.explainDone].filter(Boolean).length / 3), 0) / enriched.length) * 100,
      )
    : 0

  return (
    <div className="page">
      <Hero overall={overall} coreDone={coreDone} coreTotal={coreTotal} sysDone={sysDone} sysTotal={sysTotal} topicsTotal={enriched.length} firstName={profile?.firstName ?? null} />
      <TopicGrid initial={{ signedIn, topics: enriched }} />
      <footer className="foot">Progress saved right here in your browser <span className="heart">♥</span> No sign-in needed.</footer>
    </div>
  )
}
