import { marked } from "marked"
import { sanitiseHtml } from "@/lib/html"

export async function markdownToSafeHtml(md: string): Promise<string> {
  const html = await marked.parse(md)
  return sanitiseHtml(typeof html === "string" ? html : String(html))
}
