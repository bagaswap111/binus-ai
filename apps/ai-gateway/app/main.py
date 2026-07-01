# ponytail: FastAPI AI Gateway dengan filter pipeline + RAG context
import os
import re
import sys
import httpx
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, field_validator
from .filters import run_pipeline

NEXTJS_URL = os.getenv("NEXTJS_URL", "http://localhost:3000")
GATEWAY_API_KEY = os.getenv("GATEWAY_API_KEY", "")
DEBUG = os.getenv("DEBUG", "").lower() in ("1", "true", "yes")

if not NEXTJS_URL.startswith("http"):
    print("FATAL: NEXTJS_URL must start with http:// or https://", file=sys.stderr)
    sys.exit(1)


async def verify_api_key(req: Request):
    if GATEWAY_API_KEY:
        key = req.headers.get("X-API-Key", "")
        if key != GATEWAY_API_KEY:
            raise HTTPException(403, "Forbidden")


app = FastAPI(title="BINUS AI Gateway")

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
    user_id: str | None = None
    stream: bool = False

    @field_validator("messages")
    @classmethod
    def sanitize_messages(cls, v: list[dict]) -> list[dict]:
        for msg in v:
            if "content" in msg and isinstance(msg["content"], str):
                if len(msg["content"]) > 10000:
                    raise ValueError("content exceeds 10000 characters")
                msg["content"] = re.sub(r"[\x00-\x08\x0B\x0C\x0E-\x1F]", "", msg["content"])
        return v


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/v1/filter")
async def filter_text(req: Request, text: str = "", user_role: str = "SMA", subject_id: str | None = None):
    if not DEBUG:
        raise HTTPException(404, "Not found")
    if len(text) > 10000:
        raise HTTPException(400, "text too long")
    result = await run_pipeline(text, user_role, subject_id)
    return {"redacted": result["redacted"], "blocked": result["blocked"], "filters": result["filters"]}


@app.post("/v1/chat")
async def chat(req: Request, chat_req: ChatRequest):
    await verify_api_key(req)
    role = chat_req.user_role or "SMA"

    if not chat_req.messages:
        raise HTTPException(400, "No messages")

    last_msg = chat_req.messages[-1]["content"]

    filter_result = await run_pipeline(last_msg, role, chat_req.subject_id, chat_req.user_id)

    if filter_result["blocked"]:
        return {
            "content": "I can't respond to that. This content was filtered for your account type.",
            "model": chat_req.model,
            "filtered": True,
        }

    # inject RAG context
    context = ""
    if chat_req.subject_id:
        try:
            async with httpx.AsyncClient() as client:
                kg = await client.get(
                    f"{NEXTJS_URL}/api/knowledge?subjectId={chat_req.subject_id}",
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

    answer = f"BINUS AI: kamu bilang '{filter_result['redacted'][:80]}'. Gateway aktif, model={chat_req.model}."
    if context:
        answer = f"{context}\n\n{answer}"

    return {"content": answer, "model": chat_req.model, "filtered": False}
