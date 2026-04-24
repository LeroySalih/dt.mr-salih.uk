import { redirect } from "next/navigation"
import { getAuthenticatedProfile } from "@/lib/auth"
import { query } from "@/lib/db"
import { listTopics } from "@/lib/content"
import { computeTopicProgress } from "@/lib/progress"
import { ProfileClient } from "@/components/ProfileClient"

export const dynamic = "force-dynamic"

export default async function ProfilePage() {
  const profile = await getAuthenticatedProfile()
  if (!profile) redirect("/sign-in")

  const { rows: groupRows } = await query<{ join_code: string | null }>(
    `select g.join_code
     from groups g join group_membership gm on gm.group_id = g.group_id
     where gm.user_id = $1 and coalesce(g.active, true) = true`,
    [profile.userId],
  )
  const classCodes = groupRows.map((r) => r.join_code).filter((c): c is string => !!c)

  const topics = await listTopics()
  const progress = await computeTopicProgress({
    pupilId: profile.userId,
    lessonIds: topics.map((t) => t.lessonId),
  })

  const started = topics.filter((t) => {
    const p = progress[t.lessonId]
    return p && (p.flashcardsDone || p.mcqPassed || p.explainDone)
  }).length
  const mastered = topics.filter((t) => {
    const p = progress[t.lessonId]
    return p && p.flashcardsDone && p.mcqPassed && p.explainDone
  }).length
  const overall = topics.length
    ? Math.round(
        (topics.reduce((s, t) => {
          const p = progress[t.lessonId]
          if (!p) return s
          return s + [p.flashcardsDone, p.mcqPassed, p.explainDone].filter(Boolean).length / 3
        }, 0) /
          topics.length) *
          100,
      )
    : 0

  const recent = topics
    .map((t) => {
      const p = progress[t.lessonId]
      const pct = p ? Math.round(([p.flashcardsDone, p.mcqPassed, p.explainDone].filter(Boolean).length / 3) * 100) : 0
      return { code: t.code, title: t.title || t.rawTitle, pct }
    })
    .filter((x) => x.pct > 0)
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 8)

  return (
    <ProfileClient
      firstName={profile.firstName ?? ""}
      lastName={profile.lastName ?? ""}
      email={profile.email ?? ""}
      classCodes={classCodes}
      stats={{ started, mastered, total: topics.length, overall }}
      recent={recent}
    />
  )
}
