import { HelpCircle, BookOpen, FileText, MessageCircle, Shield, User, LogIn } from "lucide-react"

const faqs = [
  { icon: LogIn, q: "How do I sign in?", a: "Use your @binus.ac.id email via Microsoft SSO or register with email and password." },
  { icon: HelpCircle, q: "How do I create an exam?", a: "Go to Exams in the sidebar, click '+ New Exam', fill in the details, add questions, and publish." },
  { icon: BookOpen, q: "What are subjects used for?", a: "Subjects organize content per course. Each exam, project, and question is tagged to a subject." },
  { icon: FileText, q: "How do I submit a project?", a: "Open the project from the Projects page, upload your file, and the system checks for plagiarism automatically." },
  { icon: MessageCircle, q: "How does the AI Chat work?", a: "The AI assistant answers questions about your subjects, helps with assignments, and explains concepts." },
  { icon: Shield, q: "What is Content Review?", a: "Admins review flagged content (toxic language, sensitive data) before it goes live. Check the Admin panel." },
  { icon: User, q: "How do I change my role or profile?", a: "Profile changes are managed by your school admin. Contact them for role updates." },
]

export default function FAQPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold">Frequently Asked Questions</h1>
      <div className="space-y-3">
        {faqs.map((f, i) => (
          <details key={i} className="rounded-lg border p-4 group open:bg-muted/50">
            <summary className="flex items-center gap-3 cursor-pointer list-none">
              <f.icon className="size-5 text-muted-foreground shrink-0" aria-hidden="true" />
              <span className="font-medium">{f.q}</span>
            </summary>
            <p className="mt-3 text-sm text-muted-foreground pl-8">{f.a}</p>
          </details>
        ))}
      </div>
    </div>
  )
}
