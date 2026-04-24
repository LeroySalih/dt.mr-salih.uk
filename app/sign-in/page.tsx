import { redirect } from "next/navigation"
import { getAuthenticatedProfile } from "@/lib/auth"
import { SignInForm } from "@/components/SignInForm"

export const dynamic = "force-dynamic"

export default async function SignInPage() {
  const profile = await getAuthenticatedProfile()
  if (profile) redirect("/")

  return (
    <div className="signin">
      <div className="signin-left">
        <div className="signin-badge">DT Revision · Mr Salih</div>
        <h1 className="signin-hero">Hey there,<br/>let&apos;s revise 🦕</h1>
        <p className="signin-sub">
          Sign in with your school email and password. Your flashcard, quiz,
          and explain progress saves against your account across devices.
        </p>
        <div className="signin-features">
          <div className="signin-feature"><span>📚</span><div><b>KS4 topics</b><small>Core + Systems</small></div></div>
          <div className="signin-feature"><span>🃏</span><div><b>Flashcards</b><small>practice to pass</small></div></div>
          <div className="signin-feature"><span>🏆</span><div><b>Real marking</b><small>from your teacher</small></div></div>
        </div>
      </div>

      <div className="signin-right">
        <SignInForm />
      </div>
    </div>
  )
}
