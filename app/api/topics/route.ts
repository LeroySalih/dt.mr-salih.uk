import { NextResponse } from "next/server"
import { listTopics } from "@/lib/content"
import { computeTopicProgress } from "@/lib/progress"
import { getAuthenticatedProfile } from "@/lib/auth"

export async function GET() {
  const topics = await listTopics()
  const profile = await getAuthenticatedProfile()

  let progress: Awaited<ReturnType<typeof computeTopicProgress>> = {}
  if (profile) {
    progress = await computeTopicProgress({
      pupilId: profile.userId,
      lessonIds: topics.map((t) => t.lessonId),
    })
  }

  return NextResponse.json({
    signedIn: Boolean(profile),
    profile: profile
      ? { userId: profile.userId, firstName: profile.firstName, email: profile.email }
      : null,
    topics: topics.map((t) => ({
      code: t.code,
      title: t.title,
      rawTitle: t.rawTitle,
      section: t.section,
      lessonId: t.lessonId,
      vocabCount: t.vocabCount,
      progress: progress[t.lessonId] ?? { flashcardsDone: false, mcqPassed: false, explainDone: false },
    })),
  })
}
