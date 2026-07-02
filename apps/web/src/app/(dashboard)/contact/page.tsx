import { Mail, MessageCircle, BookOpen } from "lucide-react"

export default function ContactPage() {
  return (
    <div className="max-w-xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold">Contact & Support</h1>
      <p className="text-sm text-muted-foreground">
        Need help? Reach out through any of the channels below.
      </p>

      <div className="space-y-3">
        <a href="mailto:support@binus.ai"
          className="flex items-center gap-3 rounded-lg border p-4 hover:bg-muted transition-colors">
          <Mail className="size-5 text-muted-foreground" aria-hidden="true" />
          <div>
            <div className="text-sm font-medium">Email Support</div>
            <div className="text-xs text-muted-foreground">support@binus.ai</div>
          </div>
        </a>

        <div className="flex items-center gap-3 rounded-lg border p-4">
          <MessageCircle className="size-5 text-muted-foreground" aria-hidden="true" />
          <div>
            <div className="text-sm font-medium">In-App Chat</div>
            <div className="text-xs text-muted-foreground">Use the Chat AI in the sidebar for instant help</div>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-lg border p-4">
          <BookOpen className="size-5 text-muted-foreground" aria-hidden="true" />
          <div>
            <div className="text-sm font-medium">Documentation</div>
            <div className="text-xs text-muted-foreground">Check the FAQ page for common questions</div>
          </div>
        </div>
      </div>
    </div>
  )
}
