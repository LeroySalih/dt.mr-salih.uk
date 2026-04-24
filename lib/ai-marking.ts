import { query } from "@/lib/db"

/**
 * Enqueue a short-text submission onto ai_marking_queue for the n8n marking
 * flow to pick up. Matches the upsert semantics of planner-004's enqueue
 * (see planner-004/src/lib/ai/marking-queue.ts) minus the process_after delay
 * — revision answers mark immediately.
 *
 * The `assignment_id` column has no FK constraint; we use a sentinel of
 * `revision:<activityId>` so the n8n flow (or a teacher) can distinguish
 * revision-site submissions from normal assignment submissions.
 */
export async function enqueueShortTextMarking(params: {
  submissionId: string
  activityId: string
}) {
  const sentinel = `revision:${params.activityId}`
  await query(
    `insert into ai_marking_queue (submission_id, assignment_id, status)
     values ($1, $2, 'pending')
     on conflict (submission_id) where status in ('pending','processing') do nothing`,
    [params.submissionId, sentinel],
  )
}
