import { Router } from "express";
import fetch from "node-fetch";
import { query } from "../db/client.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

router.use(requireAuth);

const GEMINI_BASE = process.env.GEMINI_API_URL || "https://generativelanguage.googleapis.com/v1beta";
const MODEL = process.env.GEMINI_MODEL || "gemini-flash-lite-latest";
const API_KEY =
  process.env.GEMINI_API_KEY ||
  process.env.GOOGLE_API_KEY ||
  process.env.ANTHROPIC_API_KEY;

function buildSystemPrompt(skinType) {
  return `You are SkinLove Assistant, an expert skincare advisor
specialising in East African skin tones and locally available
products in Uganda and Kenya. You have deep knowledge of brands
like Vaseline, Dove, Nivea, Neutrogena, CeraVe, Simple, Olay,
Palmolive, Pond's and Glow & Lovely.

Always give advice that is:
- Practical and affordable (reference UGX prices where possible)
- Relevant to tropical/equatorial climate skincare needs
- Sensitive to darker skin tones and melanin-rich skin
- Based on the user's skin type: ${skinType || "not set yet"}

Keep responses concise (under 100 words), warm, and actionable.
If asked about stores, mention Kampala locations.
Never recommend products not available in East Africa.`;
}

function normaliseMessages(body) {
  if (Array.isArray(body.messages) && body.messages.length > 0) {
    return body.messages
      .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
      .slice(-20)
      .map((m) => ({ role: m.role, content: m.content }));
  }
  if (typeof body.message === "string" && body.message.trim()) {
    return [{ role: "user", content: body.message.trim() }];
  }
  return [];
}

// Gemini uses "model" for assistant turns
function toGeminiContents(messages) {
  return messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
}

// POST /api/chat — send conversation to Gemini, stream reply, save history
router.post("/", async (req, res, next) => {
  try {
    const messages = normaliseMessages(req.body || {});
    if (messages.length === 0) {
      return res.status(400).json({ error: "message or messages are required" });
    }

    const userResult = await query("SELECT skin_type FROM users WHERE id = $1", [req.user.id]);
    const skinType = userResult.rows[0]?.skin_type;

    if (!API_KEY) {
      return res.status(503).json({ error: "The AI assistant is not configured yet" });
    }

    // Persist the latest user message
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    await query("INSERT INTO chat_history (user_id, role, message) VALUES ($1, 'user', $2)", [
      req.user.id,
      lastUser.content,
    ]);

    const url = `${GEMINI_BASE}/models/${MODEL}:streamGenerateContent?alt=sse`;

    let upstream;
    try {
      upstream = await fetch(url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-goog-api-key": API_KEY,
        },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: buildSystemPrompt(skinType) }] },
          contents: toGeminiContents(messages),
          generationConfig: { maxOutputTokens: 600 },
        }),
      });
    } catch (err) {
      console.error("[chat] Gemini unreachable", err.message);
      return res.status(502).json({ error: "The AI assistant is temporarily unavailable" });
    }

    if (!upstream.ok || !upstream.body) {
      const detail = await upstream.text().catch(() => "");
      console.error("[chat] Gemini error", upstream.status, detail.slice(0, 500));
      return res.status(502).json({ error: "The AI assistant is temporarily unavailable" });
    }

    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("X-Accel-Buffering", "no");

    const decoder = new TextDecoder();
    let buffer = "";
    let fullReply = "";

    try {
      for await (const chunk of upstream.body) {
        buffer += decoder.decode(chunk, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data:")) continue;
          const payload = line.slice(5).trim();
          if (!payload || payload === "[DONE]") continue;
          try {
            const event = JSON.parse(payload);
            const parts = event.candidates?.[0]?.content?.parts || [];
            for (const part of parts) {
              if (typeof part.text === "string" && part.text) {
                fullReply += part.text;
                res.write(part.text);
              }
            }
          } catch {
            // ignore partial JSON
          }
        }
      }
    } catch (err) {
      console.error("[chat] stream error", err.message);
    }

    res.end();

    if (fullReply) {
      await query("INSERT INTO chat_history (user_id, role, message) VALUES ($1, 'assistant', $2)", [
        req.user.id,
        fullReply,
      ]);
    }
  } catch (err) {
    next(err);
  }
});

// GET /api/chat/history — last 20 messages for current user
router.get("/history", async (req, res, next) => {
  try {
    const result = await query(
      `SELECT role, message, created_at FROM (
         SELECT id, role, message, created_at
         FROM chat_history
         WHERE user_id = $1
         ORDER BY created_at DESC, id DESC
         LIMIT 20
       ) recent
       ORDER BY created_at ASC, id ASC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

export default router;
