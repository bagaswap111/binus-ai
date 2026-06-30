# ponytail: FastAPI AI Gateway dengan filter pipeline + RAG context
import os
import re
import sys
import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, field_validator
from .filters import run_pipeline

# startup security check
if not os.getenv("NEXTJS_URL"):
    print("WARNING: NEXTJS_URL not set, defaulting to http://localhost:3000", file=sys.stderr)

NEXTJS_URL = os.getenv("NEXTJS_URL", "http://localhost:3000")

app = FastAPI(title="BINUS AI Gateway", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    messages: list[dict]
    model: str = "gpt-4o-mini"
    user_role: str | None = None
    subject_id: str | None = None
    stream: bool = False

    @field_validator("messages")
    @classmethod
    def sanitize_messages(cls, v: list[dict]) -> list[dict]:
        # ponytail: strip control chars except newline/tab
        for msg in v:
            if "content" in msg and isinstance(msg["content"], str):
                msg["content"] = re.sub(r"[\x00-\x08\x0B\x0C\x0E-\x1F]", "", msg["content"])
        return v


class FilterResult(BaseModel):
    redacted: str
    blocked: bool
    filters: dict


@app.get("/health")
async def health():
    return {"status": "ok", "version": "0.1.0"}


@app.get("/v1/filter")
async def filter_text(text: str, user_role: str = "SMA", subject_id: str | None = None):
    """Debug endpoint — test filter pipeline."""
    result = await run_pipeline(text, user_role, subject_id)
    return FilterResult(
        redacted=result["redacted"],
        blocked=result["blocked"],
        filters=result["filters"],
    )


@app.post("/v1/chat")
async def chat(req: ChatRequest):
    role = req.user_role or "SMA"

    if not req.messages:
        raise HTTPException(400, "No messages")

    last_msg = req.messages[-1]["content"]

    # run filter on user input
    filter_result = await run_pipeline(last_msg, role, req.subject_id)

    if filter_result["blocked"]:
        return {
            "content": "I can't respond to that. This content was filtered for your account type.",
            "model": req.model,
            "filtered": True,
        }

    # inject RAG context
    context = ""
    if req.subject_id:
        try:
            async with httpx.AsyncClient() as client:
                kg = await client.get(
                    f"{NEXTJS_URL}/api/knowledge?subjectId={req.subject_id}",
                    timeout=3,
                )
                if kg.status_code == 200:
                    entries = kg.json()
                    if entries:
                        context = "Berikut adalah konteks materi:\n" + "\n".join(
                            f"- {e['title']}: {e['content'][:300]}"
                            for e in entries[:5]
                        )
        except httpx.ConnectError:
            pass  # ponytail: RAG offline bukan error fatal

    # ponytail: echo response — real LLM integration nanti
    answer = f"BINUS AI: kamu bilang '{filter_result['redacted'][:80]}'. Gateway aktif, model={req.model}."
    if context:
        answer = f"{context}\n\n{answer}"

    return {
        "content": answer,
        "model": req.model,
        "filtered": False,
    }
