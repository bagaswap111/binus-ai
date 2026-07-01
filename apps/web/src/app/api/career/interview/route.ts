import { auth } from "@/auth"
import { NextResponse } from "next/server"
import { chatCompletion as callGateway } from "@/lib/ai-gateway"

const questions: Record<string, string[]> = {
  umum: [
    "Ceritakan tentang diri Anda.",
    "Apa kelebihan dan kekurangan Anda?",
    "Mengapa Anda tertarik dengan posisi ini?",
    "Di mana Anda melihat diri Anda dalam 5 tahun?",
    "Mengapa kami harus mempekerjakan Anda?",
  ],
  behavioral: [
    "Ceritakan saat Anda menghadapi konflik di tim. Bagaimana Anda menyelesaikannya?",
    "Berikan contoh saat Anda memimpin sebuah proyek.",
    "Ceritakan kegagalan terbesar Anda dan apa yang Anda pelajari.",
    "Bagaimana Anda menangani tekanan dan deadline ketat?",
    "Ceritakan saat Anda harus mengambil keputusan sulit.",
  ],
  beasiswa: [
    "Mengapa Anda layak menerima beasiswa ini?",
    "Apa kontribusi Anda kepada masyarakat?",
    "Bagaimana rencana Anda setelah menyelesaikan studi?",
    "Apa pencapaian yang paling Anda banggakan?",
    "Ceritakan pengalaman organisasi Anda.",
  ],
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { mode, answer, questionIndex, topic } = await req.json()
  // mode: "start" | "answer" | "feedback"
  const category = (topic || "umum") as keyof typeof questions
  const qs = questions[category] || questions.umum
  const qi = questionIndex || 0

  if (mode === "start" || !answer) {
    return NextResponse.json({ question: qs[qi] || qs[0], questionIndex: qi, total: qs.length })
  }

  if (mode === "feedback") {
    const feedback = await callGateway([
      { role: "system", content: "Kamu adalah pewawancara profesional. Beri feedback singkat (2-3 kalimat) untuk jawaban wawancara ini. Nilai: struktur jawaban, kejelasan, dan dampak." },
      { role: "user", content: `Pertanyaan: ${qs[qi] || qs[0]}\nJawaban: ${answer}\n\nBeri feedback dalam format:\nSkor: X/10\nKelebihan: ...\nPerbaikan: ...` },
    ], { userRole: "SMA" })
    return NextResponse.json({ feedback, questionIndex: qi })
  }

  // submit answer, get next question
  const nextQi = qi + 1
  if (nextQi >= qs.length) {
    return NextResponse.json({ done: true })
  }

  return NextResponse.json({ question: qs[nextQi], questionIndex: nextQi, total: qs.length })
}
