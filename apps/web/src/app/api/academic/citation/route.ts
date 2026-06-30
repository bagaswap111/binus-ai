import { auth } from "@/auth"
import { NextResponse } from "next/server"

const APA_EXAMPLES: Record<string, string> = {
  "10.1000": "Author, A. A. (Year). Title of article. Journal Name, Volume(Issue), Pages. https://doi.org/xxxx",
  "default": "Author, A. A. (Year). Title. Publisher. https://doi.org/xxxx",
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { doi, title, author, year, journal, format = "apa" } = await req.json()

  if (doi) {
    const prefix = Object.keys(APA_EXAMPLES).find((k) => doi.startsWith(k))
    const template = APA_EXAMPLES[prefix || "default"]
    return NextResponse.json({
      citation: template.replace("Author, A. A.", author || "Author, A. A.")
        .replace("Year", year || "Year")
        .replace("Title of article", title || "Title")
        .replace("Journal Name", journal || "Journal")
        .replace("https://doi.org/xxxx", `https://doi.org/${doi}`),
      format,
    })
  }

  const manual = `${author || "Author"} (${year || "n.d."}). ${title || "Untitled"}.`
  return NextResponse.json({ citation: manual, format })
}
