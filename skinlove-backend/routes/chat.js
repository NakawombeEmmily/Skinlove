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

const APP_KNOWLEDGE = `ABOUT SKINLOVE (the app you live inside):
SkinLove is a skincare recommendation web app built for East Africa (Uganda & Kenya). You are its built-in assistant, so you can also answer questions about how the app itself works.

Features and how to use them:
- Register / Log in: create an account with name, email, password and skin type. Log in to save your wishlist and chat history.
- Products tab: browse all skincare products. Filter by skin type, product type, or search by name. Tap the heart (♡) on a product to add it to your wishlist.
- Wishlist: saved products appear on the Products tab and in your Profile. Remove by tapping the heart again.
- AI Chat: this screen — ask any skincare or app question.
- Find Stores: uses your device GPS to list Kampala stores sorted by distance from you.
- Profile: view/update your name and skin type, and see your wishlist.
- Admin (admins only): add/edit products, deactivate users, and view analytics.
Supported skin types: dry, oily, normal, combination, sensitive.`;

function buildSystemPrompt({ skinType, catalogue, stores }) {
  return `You are SkinLove Assistant, the built-in AI guide and skincare advisor for the SkinLove app. You specialise in East African skin tones and products available in Uganda and Kenya (brands like Vaseline, Dove, Nivea, Neutrogena, CeraVe, Simple, Olay, Palmolive, Pond's and Glow & Lovely).

Always give advice that is:
- Practical and affordable (reference UGX prices where possible)
- Relevant to tropical / equatorial climate skincare needs
- Sensitive to darker skin tones and melanin-rich skin
- Tailored to the current user's skin type: ${skinType || "not set yet"}

Answer app questions using this knowledge:
${APP_KNOWLEDGE}

If the user asks what is available, only recommend items from this live catalogue of the app's products:
${catalogue || "(no products loaded)"}

If asked about stores or where to buy, use these live store locations:
${stores || "(no stores loaded)"}

Rules:
- Keep responses concise (under 120 words), warm, and actionable.
- When recommending a product, use its exact name and price from the catalogue above.
- Never recommend products that are not in the catalogue or not available in East Africa.
- If a question is unrelated to skincare or the SkinLove app, politely steer back.`;
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

// Load the live app catalogue and store list so the assistant can answer
// questions about what SkinLove actually offers.
async function loadAppContext() {
  const [products, stores] = await Promise.all([
    query(
      `SELECT name, brand, type, description, price, rating, skin_types
         FROM products
        WHERE is_active = true
        ORDER BY name`
    ),
    query(`SELECT name, hours FROM stores ORDER BY name`),
  ]);

  const catalogue = products.rows
    .map((p) => {
      const suits = Array.isArray(p.skin_types) ? p.skin_types.join(", ") : "";
      const rating = p.rating ? `, rated ${p.rating}` : "";
      return `- ${p.name} (${p.brand || "unknown brand"}) — ${p.type || "product"} — ${p.price || "price n/a"} — suits: ${suits || "all"}${rating} — ${p.description || ""}`;
    })
    .join("\n");

  const storeList = stores.rows
    .map((s) => `- ${s.name}${s.hours ? ` (${s.hours})` : ""}`)
    .join("\n");

  return { catalogue, stores: storeList };
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

    const { catalogue, stores } = await loadAppContext();
    const systemPrompt = buildSystemPrompt({ skinType, catalogue, stores });

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
          system_instruction: { parts: [{ text: systemPrompt }] },
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
