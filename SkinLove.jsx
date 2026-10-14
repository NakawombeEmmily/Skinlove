import React, { useCallback, useEffect, useRef, useState } from "react";
import "./SkinLove.css";

const API_BASE =
  (typeof process !== "undefined" && process.env && process.env.REACT_APP_API_URL) ||
  (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_API_URL) ||
  "https://skinlove.onrender.com";

const TOKEN_KEY = "skinlove_token";
const USER_KEY = "skinlove_user";
const SKIN_TYPES = ["oily", "dry", "combination", "normal", "sensitive"];
const PRODUCT_TYPES = ["Cleanser", "Moisturizer", "Sunscreen", "Treatment", "Body Care"];

const oils = [
  {
    title: "Golden Rose Oil",
    description: "A silky botanical blend that restores radiance and softness.",
    image: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Nourishing Argan",
    description: "Deep hydration with antioxidant-rich oils for a luminous glow.",
    image: "https://images.unsplash.com/photo-1492724441997-5dc865305da7?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Fresh Citrus Serum",
    description: "Brightening and refreshing care with silky absorption.",
    image: "https://images.unsplash.com/photo-1518976024611-488c8d944ce8?auto=format&fit=crop&w=900&q=80",
  },
];

function readStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

async function api(path, { method = "GET", body, auth = true } = {}) {
  const headers = { "Content-Type": "application/json" };
  const token = localStorage.getItem(TOKEN_KEY);
  if (auth && token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(API_BASE + path, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    const err = new Error("Connection issue — please try again");
    err.network = true;
    throw err;
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    const err = new Error((data && (data.error || data.message)) || "Connection issue — please try again");
    err.status = res.status;
    throw err;
  }
  return data;
}

function Stars({ rating }) {
  const value = Number(rating) || 0;
  const full = Math.round(value);
  return (
    <span className="stars" aria-label={`Rated ${value} out of 5`}>
      {"★".repeat(full)}
      <span className="stars-empty">{"★".repeat(Math.max(0, 5 - full))}</span>
      <span className="stars-value">{value ? value.toFixed(1) : "New"}</span>
    </span>
  );
}

function LoadingOverlay() {
  return (
    <div className="loading-overlay" role="status" aria-live="polite">
      <span className="pulse-dot" />
      <span className="pulse-dot pulse-dot-2" />
      <span className="pulse-dot pulse-dot-3" />
    </div>
  );
}

function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div className={`toast toast-${toast.kind}`} role="alert">
      {toast.message}
    </div>
  );
}

function PublicNav({ onLogIn, onSignUp, onExplore }) {
  return (
    <header className="app-nav">
      <button className="brand-btn" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
        🌿 SkinLove
      </button>
      <nav className="nav-links">
        <button onClick={onExplore}>Products</button>
        <button onClick={onLogIn}>Log in</button>
        <button className="btn btn-primary nav-cta" onClick={onSignUp}>
          Sign up
        </button>
      </nav>
    </header>
  );
}

function AppNav({ view, setView, user, onLogout, onHome }) {
  const item = (id, label) => (
    <button key={id} className={view === id ? "nav-item active" : "nav-item"} onClick={() => setView(id)}>
      {label}
    </button>
  );

  return (
    <header className="app-nav">
      <button className="brand-btn" onClick={onHome}>
        🌿 SkinLove
      </button>
      <nav className="nav-links">
        {item("home", "Home")}
        {item("products", "Products")}
        {item("stores", "Find Stores")}
        {item("chat", "AI Chat")}
        {item("profile", "Profile")}
        {user.role === "admin" && item("admin", "Admin")}
        <span className="nav-user">{user.name.split(" ")[0]}</span>
        <button className="btn btn-secondary nav-cta" onClick={onLogout}>
          Log out
        </button>
      </nav>
    </header>
  );
}

function Landing({ onSignUp, onLogIn, onExplore }) {
  return (
    <>
      <header className="skinlove-hero">
        <div className="hero-copy">
          <p className="eyebrow">SkinLove Rituals</p>
          <h1>Skincare that knows your skin, your climate and your budget.</h1>
          <p className="hero-text">
            Personal product picks for East African skin, daily routines, and local stores near you — powered by an AI
            skincare assistant.
          </p>
          <div className="hero-actions">
            <button className="btn btn-primary" onClick={onSignUp}>
              Create free account
            </button>
            <button className="btn btn-secondary" onClick={onExplore}>
              Explore products
            </button>
            <button className="link-btn" onClick={onLogIn}>
              I already have an account
            </button>
          </div>
        </div>

        <div className="hero-visual">
          <div className="hero-image-card">
            <img
              src="https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=900&q=80"
              alt="Glass bottle of oil and flowers"
            />
            <div className="hero-image-label">Botanical oil collection</div>
          </div>
          <div className="hero-tile">
            <strong>Built for Kampala weather</strong>
            <p>Humidity, dust and strong equatorial sun — advice that works in real life.</p>
          </div>
        </div>
      </header>

      <section className="section section-light" id="oils">
        <div className="section-header">
          <p className="eyebrow">Featured oils</p>
          <h2>Oil blends that deliver comfort and glow.</h2>
        </div>
        <div className="oil-grid">
          {oils.map((oil) => (
            <article className="oil-card" key={oil.title}>
              <img src={oil.image} alt={oil.title} />
              <div className="oil-card-body">
                <h3>{oil.title}</h3>
                <p>{oil.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section" id="ritual">
        <div className="section-split">
          <div>
            <p className="eyebrow">Four-terrain journey</p>
            <h2>From first cleanse to confident skin.</h2>
            <p>
              Savannah Mastery finds your skin type, Tsavo Fluency matches locally stocked products, the Ethical
              Savannah keeps advice safe and affordable, and Agent Savannah answers questions any time.
            </p>
            <div className="hero-actions">
              <button className="btn btn-primary" onClick={onSignUp}>
                Start my skin journey
              </button>
            </div>
          </div>
          <div className="feature-list">
            <div>
              <strong>Savannah Mastery</strong>
              <p>Answer a few questions and identify your skin type in minutes.</p>
            </div>
            <div>
              <strong>Tsavo Fluency</strong>
              <p>See products filtered for your skin — Vaseline, Dove, CeraVe, Nivea and more.</p>
            </div>
            <div>
              <strong>Agent Savannah</strong>
              <p>Ask the AI assistant anything and get advice under 100 words.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="testimonials">
        <div>
          <p className="eyebrow">Customer love</p>
          <h2>Users feel the difference from first touch.</h2>
        </div>
        <div className="testimonial-card">
          <p>
            “The SkinLove front end feels warm, luxurious, and easy to navigate. The oil visuals make the whole
            experience feel more natural and inviting.”
          </p>
          <strong>— Anna M., beauty founder</strong>
        </div>
      </section>

      <section className="footer-cta">
        <div>
          <h2>Ready for your best skin yet?</h2>
          <p>Create a free account to save your skin type, wishlist and daily routine.</p>
        </div>
        <button className="btn btn-primary" onClick={onSignUp}>
          Get started
        </button>
      </section>
    </>
  );
}

function AuthPage({ onAuth, run, showToast, onBack }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "", skin_type: "" });

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (mode === "login") {
      const data = await run(() =>
        api("/api/auth/login", { method: "POST", body: { email: form.email, password: form.password }, auth: false })
      );
      if (data) {
        showToast(`Welcome back, ${data.user.name.split(" ")[0]}!`, "success");
        onAuth(data.token, data.user);
      }
    } else {
      if (!form.name || !form.email || !form.password) {
        showToast("Please fill in your name, email and password");
        return;
      }
      const data = await run(() =>
        api("/api/auth/register", {
          method: "POST",
          body: {
            name: form.name,
            email: form.email,
            password: form.password,
            skin_type: form.skin_type || null,
          },
          auth: false,
        })
      );
      if (data) {
        showToast("Account created — welcome to SkinLove!", "success");
        onAuth(data.token, data.user);
      }
    }
  };

  return (
    <section className="auth-wrap">
      <div className="auth-card">
        <p className="eyebrow">{mode === "login" ? "Welcome back" : "Savannah Mastery"}</p>
        <h2>{mode === "login" ? "Log in to SkinLove" : "Create your account"}</h2>

        <div className="auth-tabs">
          <button className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>
            Log in
          </button>
          <button className={mode === "signup" ? "active" : ""} onClick={() => setMode("signup")}>
            Sign up
          </button>
        </div>

        <form className="auth-form" onSubmit={submit}>
          {mode === "signup" && (
            <label>
              Full name
              <input value={form.name} onChange={update("name")} placeholder="e.g. Amina Nakato" autoComplete="name" />
            </label>
          )}
          <label>
            Email
            <input
              type="email"
              value={form.email}
              onChange={update("email")}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={form.password}
              onChange={update("password")}
              placeholder="At least 6 characters"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />
          </label>
          {mode === "signup" && (
            <label>
              Skin type
              <select value={form.skin_type} onChange={update("skin_type")}>
                <option value="">Not sure yet — choose later</option>
                {SKIN_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t[0].toUpperCase() + t.slice(1)}
                  </option>
                ))}
              </select>
            </label>
          )}
          <button type="submit" className="btn btn-primary">
            {mode === "login" ? "Log in" : "Create account"}
          </button>
        </form>

        <button className="link-btn auth-back" onClick={onBack}>
          Back to home
        </button>
        <p className="auth-hint">Demo admin: admin@skinlove.com · SkinLove2026</p>
      </div>
    </section>
  );
}

function Dashboard({ user, setView }) {
  const firstName = user.name.split(" ")[0];
  const steps = [
    { title: "Step 1 — Cleanse", text: "Wash with a gentle cleanser suited to your skin type, morning and night." },
    { title: "Step 2 — Treat", text: "Add a serum or spot treatment for your main concern: tone, spots or dryness." },
    { title: "Step 3 — Moisturise", text: "Lock in hydration with a light gel or rich cream depending on your skin." },
    { title: "Step 4 — SPF", text: "Finish with sunscreen. Equatorial UV is strong all year round." },
  ];

  return (
    <>
      <section className="dash-hero">
        <div>
          <p className="eyebrow">Savannah Mastery</p>
          <h1>Hi {firstName}, let's keep that glow going.</h1>
          <p className="hero-text">
            Your skin type is <strong>{user.skin_type || "not set yet"}</strong>. Everything you see is filtered for
            you.
          </p>
        </div>
        <div className="dash-actions">
          <button className="btn btn-primary" onClick={() => setView("products")}>
            Browse products
          </button>
          <button className="btn btn-secondary" onClick={() => setView("chat")}>
            Ask the AI
          </button>
          <button className="btn btn-secondary" onClick={() => setView("stores")}>
            Find stores
          </button>
        </div>
      </section>

      <section className="section section-light">
        <div className="section-header">
          <p className="eyebrow">Daily routine</p>
          <h2>Four simple steps, every day.</h2>
        </div>
        <div className="feature-list routine-grid">
          {steps.map((step) => (
            <div key={step.title}>
              <strong>{step.title}</strong>
              <p>{step.text}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function ProductsPage({ user, run, showToast, onRequireLogin, onUserUpdated }) {
  const [products, setProducts] = useState([]);
  const [wishlistIds, setWishlistIds] = useState([]);
  const [skinType, setSkinType] = useState(user?.skin_type || "");
  const [type, setType] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (search) {
      const timer = setTimeout(() => load(), 400);
      return () => clearTimeout(timer);
    }
    load();
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skinType, type, search]);

  useEffect(() => {
    const loadWishlist = async () => {
      if (!user) {
        setWishlistIds([]);
        return;
      }
      const data = await run(() => api("/api/wishlist"));
      if (data) setWishlistIds(data.map((p) => p.id));
    };
    loadWishlist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const load = async () => {
    const params = new URLSearchParams();
    if (skinType) params.set("skin_type", skinType);
    if (type) params.set("type", type);
    if (search) params.set("search", search);
    const qs = params.toString();
    const data = await run(() => api(`/api/products${qs ? `?${qs}` : ""}`));
    if (data) setProducts(data);
  };

  const toggleWishlist = async (product) => {
    if (!user) return onRequireLogin();
    const has = wishlistIds.includes(product.id);
    const data = await run(() =>
      api(`/api/wishlist/${product.id}`, { method: has ? "DELETE" : "POST" })
    );
    if (data) {
      const fresh = await run(() => api("/api/wishlist"));
      if (fresh) setWishlistIds(fresh.map((p) => p.id));
      showToast(has ? "Removed from wishlist" : "Added to wishlist", "success");
    }
  };

  const applyMySkinType = () => {
    if (user?.skin_type) setSkinType(user.skin_type);
  };

  return (
    <section className="page-section">
      <div className="section-header">
        <p className="eyebrow">Tsavo Fluency</p>
        <h2>Products matched to your skin.</h2>
      </div>

      <div className="filter-bar">
        <input
          className="filter-search"
          placeholder="Search name, brand or benefit…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={skinType} onChange={(e) => setSkinType(e.target.value)}>
          <option value="">All skin types</option>
          {SKIN_TYPES.map((t) => (
            <option key={t} value={t}>
              {t[0].toUpperCase() + t.slice(1)}
            </option>
          ))}
        </select>
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">All categories</option>
          {PRODUCT_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        {user?.skin_type && (
          <button className="btn btn-secondary btn-small" onClick={applyMySkinType}>
            Use my skin type
          </button>
        )}
      </div>

      {products.length === 0 ? (
        <p className="empty-state">No products match those filters yet — try clearing them.</p>
      ) : (
        <div className="product-grid">
          {products.map((p) => {
            const wished = wishlistIds.includes(p.id);
            return (
              <article className="product-card" key={p.id}>
                <div className="product-emoji">{p.image_emoji || "🧴"}</div>
                <button
                  className={wished ? "wish-btn active" : "wish-btn"}
                  onClick={() => toggleWishlist(p)}
                  aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
                >
                  {wished ? "♥" : "♡"}
                </button>
                <h3>{p.name}</h3>
                <p className="product-brand">{p.brand || "Unknown brand"}</p>
                <p className="product-price">{p.price || "Price TBC"}</p>
                <Stars rating={p.rating} />
                <p className="product-desc">{p.description}</p>
                <div className="tag-row">
                  {(p.skin_types || []).map((s) => (
                    <span key={s} className="tag">
                      {s}
                    </span>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function StoresPage({ run, showToast }) {
  const [stores, setStores] = useState([]);
  const [coords, setCoords] = useState(null);
  const [locating, setLocating] = useState(false);

  const loadAll = useCallback(async () => {
    const data = await run(() => api("/api/stores", { auth: false }));
    if (data) setStores(data);
  }, [run]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const findNearby = () => {
    if (!navigator.geolocation) {
      showToast("Geolocation is not supported by your browser");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCoords({ latitude, longitude });
        const data = await run(() => api(`/api/stores/nearby?lat=${latitude}&lng=${longitude}`, { auth: false }));
        if (data) {
          setStores(data);
          showToast(`Found ${data.length} stores sorted by distance`, "success");
        }
        setLocating(false);
      },
      () => {
        setLocating(false);
        showToast("Location access denied — showing all Kampala stores");
        loadAll();
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  };

  return (
    <section className="page-section">
      <div className="section-header">
        <p className="eyebrow">Ethical Savannah</p>
        <h2>Stores near you in Kampala.</h2>
        <p className="hero-text">Share your location to sort shops by real distance using GPS.</p>
      </div>

      <div className="filter-bar">
        <button className="btn btn-primary btn-small" onClick={findNearby} disabled={locating}>
          {locating ? "Finding you…" : "📍 Use my GPS"}
        </button>
        {coords && (
          <span className="coords-chip">
            {coords.latitude.toFixed(4)}, {coords.longitude.toFixed(4)}
          </span>
        )}
        <button className="btn btn-secondary btn-small" onClick={loadAll}>
          Show all stores
        </button>
      </div>

      <div className="store-grid">
        {stores.map((s) => (
          <article className="store-card" key={s.id}>
            <h3>{s.name}</h3>
            <p className="store-hours">⏰ {s.hours || "Hours not listed"}</p>
            {s.distance_km != null && <p className="store-distance">📍 {Number(s.distance_km).toFixed(1)} km away</p>}
            <div className="tag-row">
              {(s.available_products || []).map((b) => (
                <span key={b} className="tag">
                  {b}
                </span>
              ))}
            </div>
          </article>
        ))}
        {stores.length === 0 && <p className="empty-state">No stores found yet.</p>}
      </div>
    </section>
  );
}

function ChatPage({ user, run, showToast }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    const loadHistory = async () => {
      const data = await run(() => api("/api/chat/history"));
      if (data) setMessages(data.map((m) => ({ role: m.role, content: m.message })));
    };
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    if (endRef.current) endRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;

    const history = [...messages, { role: "user", content: text }];
    setMessages([...history, { role: "assistant", content: "" }]);
    setInput("");
    setBusy(true);

    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ messages: history.map(({ role, content }) => ({ role, content })) }),
      });

      if (!res.ok || !res.body) {
        let detail = null;
        try {
          detail = await res.json();
        } catch {
          detail = null;
        }
        throw new Error((detail && detail.error) || "Connection issue — please try again");
      }

      if (res.headers.get("X-Support-Escalated") === "1") {
        showToast(
          "Your message has been passed to the SkinLove support team — a human will follow up shortly.",
          "success"
        );
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        const snapshot = acc;
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = { role: "assistant", content: snapshot };
          return next;
        });
      }

      if (!acc.trim()) {
        throw new Error("No reply received — please try again");
      }
    } catch (err) {
      showToast(err.message || "Connection issue — please try again");
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="page-section chat-section">
      <div className="section-header">
        <p className="eyebrow">Agent Savannah</p>
        <h2>Ask the SkinLove Assistant.</h2>
        <p className="hero-text">Skincare advice for East African skin, in under 100 words.</p>
      </div>

      <div className="chat-window">
        <div className="chat-messages">
          {messages.length === 0 && (
            <div className="chat-empty">
              <p>Try: “I have oily skin and break out in humid weather — what should I use?”</p>
              <p>Or: “What can I buy for under UGX 20,000 in Kampala?”</p>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`bubble ${m.role === "user" ? "bubble-user" : "bubble-bot"}`}>
              {m.content || (busy && i === messages.length - 1 ? "…" : "")}
            </div>
          ))}
          <div ref={endRef} />
        </div>

        <form className="chat-input" onSubmit={send}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your skin…"
            disabled={busy}
          />
          <button type="submit" className="btn btn-primary btn-small" disabled={busy || !input.trim()}>
            Send
          </button>
        </form>
      </div>
    </section>
  );
}

function ProfilePage({ user, run, showToast, onUserUpdated }) {
  const [name, setName] = useState(user.name);
  const [skinType, setSkinType] = useState(user.skin_type || "");
  const [wishlist, setWishlist] = useState([]);

  useEffect(() => {
    const loadWishlist = async () => {
      const data = await run(() => api("/api/wishlist"));
      if (data) setWishlist(data);
    };
    loadWishlist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const save = async (e) => {
    e.preventDefault();
    const data = await run(() => api("/api/users/me", { method: "PUT", body: { name, skin_type: skinType } }));
    if (data) {
      onUserUpdated(data.user);
      showToast("Profile updated", "success");
    }
  };

  const removeWish = async (product) => {
    const data = await run(() => api(`/api/wishlist/${product.id}`, { method: "DELETE" }));
    if (data) {
      setWishlist((list) => list.filter((p) => p.id !== product.id));
      showToast("Removed from wishlist", "success");
    }
  };

  return (
    <section className="page-section">
      <div className="section-header">
        <p className="eyebrow">Your profile</p>
        <h2>Keep your details fresh.</h2>
      </div>

      <div className="profile-grid">
        <form className="panel" onSubmit={save}>
          <label>
            Full name
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label>
            Email
            <input value={user.email} disabled />
          </label>
          <label>
            Skin type
            <select value={skinType} onChange={(e) => setSkinType(e.target.value)}>
              <option value="">Not set</option>
              {SKIN_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t[0].toUpperCase() + t.slice(1)}
                </option>
              ))}
            </select>
          </label>
          <p className="muted">Member since {new Date(user.created_at || Date.now()).toLocaleDateString()}</p>
          <button type="submit" className="btn btn-primary">
            Save changes
          </button>
        </form>

        <div className="panel">
          <h3>My wishlist ({wishlist.length})</h3>
          {wishlist.length === 0 && <p className="empty-state">Nothing saved yet — tap ♡ on a product.</p>}
          <ul className="wish-list">
            {wishlist.map((p) => (
              <li key={p.id}>
                <span className="wish-emoji">{p.image_emoji || "🧴"}</span>
                <span className="wish-name">
                  {p.name}
                  <small>{p.price}</small>
                </span>
                <button className="link-btn" onClick={() => removeWish(p)}>
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function AdminPage({ run, showToast }) {
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [support, setSupport] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [form, setForm] = useState({
    name: "",
    brand: "",
    type: "Cleanser",
    price: "",
    rating: "",
    image_emoji: "🧴",
    description: "",
    skin_types: [],
  });

  const loadAll = useCallback(async () => {
    const [a, u, p, s] = await Promise.all([
      run(() => api("/api/admin/analytics")),
      run(() => api("/api/admin/users")),
      run(() => api("/api/products")),
      run(() => api("/api/admin/support")),
    ]);
    if (a) setAnalytics(a);
    if (u) setUsers(u);
    if (p) setProducts(p);
    if (s) setSupport(s);
  }, [run]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const resolveSupport = async (r) => {
    const data = await run(() => api(`/api/admin/support/${r.id}/resolve`, { method: "PUT" }));
    if (data) {
      showToast(`Support request from ${r.name} marked as resolved`, "success");
      loadAll();
    }
  };

  const toggleDeactivate = async (u) => {
    const data = await run(() =>
      api(`/api/admin/users/${u.id}/deactivate${u.is_active ? "" : "?activate=true"}`, { method: "PUT" })
    );
    if (data) {
      showToast(data.message, "success");
      loadAll();
    }
  };

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const toggleSkin = (t) =>
    setForm((f) => ({
      ...f,
      skin_types: f.skin_types.includes(t) ? f.skin_types.filter((x) => x !== t) : [...f.skin_types, t],
    }));

  const addProduct = async (e) => {
    e.preventDefault();
    if (!form.name) {
      showToast("Product name is required");
      return;
    }
    const data = await run(() =>
      api("/api/admin/products", {
        method: "POST",
        body: { ...form, rating: form.rating ? Number(form.rating) : null },
      })
    );
    if (data) {
      showToast(`${data.name} added`, "success");
      setForm({ ...form, name: "", brand: "", price: "", rating: "", description: "" });
      loadAll();
    }
  };

  const startEdit = (p) => {
    setEditingId(p.id);
    setEditForm({ name: p.name, brand: p.brand || "", type: p.type || "", price: p.price || "", rating: p.rating || "" });
  };

  const saveEdit = async (id) => {
    const data = await run(() =>
      api(`/api/admin/products/${id}`, {
        method: "PUT",
        body: { ...editForm, rating: editForm.rating ? Number(editForm.rating) : null },
      })
    );
    if (data) {
      showToast("Product updated", "success");
      setEditingId(null);
      loadAll();
    }
  };

  const deleteProduct = async (p) => {
    const data = await run(() => api(`/api/products/${p.id}`, { method: "DELETE" }));
    if (data) {
      showToast(`${p.name} removed from the shop`, "success");
      loadAll();
    }
  };

  const totals = analytics?.totals;

  return (
    <section className="page-section">
      <div className="section-header">
        <p className="eyebrow">Admin panel</p>
        <h2>Users, products and analytics.</h2>
      </div>

      <div className="stat-row">
        <div className="stat-card">
          <strong>{totals ? totals.total_users : "—"}</strong>
          <span>Total users</span>
        </div>
        <div className="stat-card">
          <strong>{totals ? totals.active_users : "—"}</strong>
          <span>Active users</span>
        </div>
        <div className="stat-card">
          <strong>{totals ? totals.total_products : "—"}</strong>
          <span>Products</span>
        </div>
        <div className="stat-card">
          <strong>{totals ? totals.total_orders : "—"}</strong>
          <span>Orders</span>
        </div>
        <div className="stat-card">
          <strong>{totals ? totals.chat_messages : "—"}</strong>
          <span>Chat messages</span>
        </div>
        <div className="stat-card">
          <strong>{totals ? totals.open_support : "—"}</strong>
          <span>Open support</span>
        </div>
      </div>

      <div className="panel">
        <h3>Support requests — users asking for a human</h3>
        {support.length > 0 ? (
          <div className="table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Message</th>
                  <th>Raised</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {support.map((r) => (
                  <tr key={r.id}>
                    <td>{r.name}</td>
                    <td>{r.email}</td>
                    <td>{r.message}</td>
                    <td>{new Date(r.created_at).toLocaleString()}</td>
                    <td>{r.status}</td>
                    <td>
                      {r.status === "open" && (
                        <button className="link-btn" onClick={() => resolveSupport(r)}>
                          Mark resolved
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="empty-state">No open requests. You'll see an alert here when a user asks to speak to a person.</p>
        )}
      </div>

      <div className="admin-grid">
        <div className="panel">
          <h3>Skin type breakdown</h3>
          {(analytics?.skin_types || []).map((row) => (
            <div className="bar-row" key={row.skin_type}>
              <span className="bar-label">{row.skin_type}</span>
              <span className="bar-track">
                <span
                  className="bar-fill"
                  style={{
                    width: `${Math.max(6, Math.round((row.count / Math.max(1, totals?.total_users || 1)) * 100))}%`,
                  }}
                />
              </span>
              <span className="bar-count">{row.count}</span>
            </div>
          ))}
          {!analytics && <p className="empty-state">Loading analytics…</p>}
        </div>

        <div className="panel">
          <h3>Top products</h3>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Rating</th>
                <th>Orders</th>
              </tr>
            </thead>
            <tbody>
              {(analytics?.top_products || []).map((p) => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td>{p.rating ?? "—"}</td>
                  <td>{p.orders}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h3>Monthly signups</h3>
          <table className="admin-table">
            <tbody>
              {(analytics?.monthly_signups || []).map((row) => (
                <tr key={row.month}>
                  <td>{row.month}</td>
                  <td>{row.count}</td>
                </tr>
              ))}
              {!analytics?.monthly_signups?.length && (
                <tr>
                  <td colSpan="2">No signups in the last 12 months</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="panel">
        <h3>User management</h3>
        <div className="table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Skin type</th>
                <th>Orders</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className={u.is_active ? "" : "row-inactive"}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{u.role}</td>
                  <td>{u.skin_type || "—"}</td>
                  <td>{u.order_count}</td>
                  <td>{u.is_active ? "Active" : "Deactivated"}</td>
                  <td>
                    <button className="link-btn" onClick={() => toggleDeactivate(u)}>
                      {u.is_active ? "Deactivate" : "Reactivate"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="admin-grid">
        <form className="panel" onSubmit={addProduct}>
          <h3>Add product</h3>
          <label>
            Name
            <input value={form.name} onChange={update("name")} />
          </label>
          <label>
            Brand
            <input value={form.brand} onChange={update("brand")} />
          </label>
          <div className="form-row">
            <label>
              Category
              <select value={form.type} onChange={update("type")}>
                {PRODUCT_TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </label>
            <label>
              Price (UGX)
              <input value={form.price} onChange={update("price")} placeholder="UGX 24,000" />
            </label>
            <label>
              Rating
              <input value={form.rating} onChange={update("rating")} placeholder="4.5" />
            </label>
            <label>
              Emoji
              <input value={form.image_emoji} onChange={update("image_emoji")} />
            </label>
          </div>
          <label>
            Description
            <textarea value={form.description} onChange={update("description")} rows="3" />
          </label>
          <div className="tag-row">
            {SKIN_TYPES.map((t) => (
              <button
                type="button"
                key={t}
                className={form.skin_types.includes(t) ? "tag tag-toggle active" : "tag tag-toggle"}
                onClick={() => toggleSkin(t)}
              >
                {t}
              </button>
            ))}
          </div>
          <button type="submit" className="btn btn-primary">
            Add product
          </button>
        </form>

        <div className="panel">
          <h3>Product management</h3>
          <div className="table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Brand</th>
                  <th>Price</th>
                  <th>Rating</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) =>
                  editingId === p.id ? (
                    <tr key={p.id}>
                      <td>
                        <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                      </td>
                      <td>
                        <input value={editForm.brand} onChange={(e) => setEditForm({ ...editForm, brand: e.target.value })} />
                      </td>
                      <td>
                        <input value={editForm.price} onChange={(e) => setEditForm({ ...editForm, price: e.target.value })} />
                      </td>
                      <td>
                        <input
                          value={editForm.rating}
                          onChange={(e) => setEditForm({ ...editForm, rating: e.target.value })}
                        />
                      </td>
                      <td>
                        <button className="link-btn" onClick={() => saveEdit(p.id)}>
                          Save
                        </button>
                        <button className="link-btn" onClick={() => setEditingId(null)}>
                          Cancel
                        </button>
                      </td>
                    </tr>
                  ) : (
                    <tr key={p.id}>
                      <td>{p.name}</td>
                      <td>{p.brand}</td>
                      <td>{p.price}</td>
                      <td>{p.rating ?? "—"}</td>
                      <td>
                        <button className="link-btn" onClick={() => startEdit(p)}>
                          Edit
                        </button>
                        <button className="link-btn danger" onClick={() => deleteProduct(p)}>
                          Remove
                        </button>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function SkinLove() {
  const [user, setUser] = useState(readStoredUser);
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [view, setView] = useState("home");
  const [loadingCount, setLoadingCount] = useState(0);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const showToast = useCallback((message, kind = "error") => {
    setToast({ message, kind });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3800);
  }, []);

  const clearSession = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  };

  const run = useCallback(
    async (fn) => {
      setLoadingCount((c) => c + 1);
      try {
        return await fn();
      } catch (err) {
        if (err && err.status === 401) {
          clearSession();
          setView("auth");
          showToast("Session expired — please log in again");
        } else {
          showToast(err.message || "Connection issue — please try again");
        }
        return null;
      } finally {
        setLoadingCount((c) => c - 1);
      }
    },
    [showToast]
  );

  useEffect(() => {
    if (!token) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const data = await api("/api/auth/me");
        if (!cancelled) {
          setUser(data.user);
          localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        }
      } catch (err) {
        if (!cancelled && err && err.status === 401) clearSession();
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAuth = (newToken, newUser) => {
    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    setView(newUser.role === "admin" ? "home" : "products");
  };

  const handleLogout = async () => {
    await run(() => api("/api/auth/logout", { method: "POST" }));
    clearSession();
    setView("home");
    showToast("Logged out — see you soon!", "success");
  };

  const handleUserUpdated = (updated) => {
    setUser(updated);
    localStorage.setItem(USER_KEY, JSON.stringify(updated));
  };

  const goAuth = () => setView("auth");
  const goHome = () => setView("home");
  const requireLogin = () => {
    showToast("Please log in or create an account first");
    setView("auth");
  };

  const needsAuth = view === "chat" || view === "profile" || view === "admin";
  const showAuthPage = view === "auth" || (needsAuth && !user);

  let content;
  if (showAuthPage) {
    content = <AuthPage onAuth={handleAuth} run={run} showToast={showToast} onBack={goHome} />;
  } else if (view === "products") {
    content = (
      <ProductsPage user={user} run={run} showToast={showToast} onRequireLogin={requireLogin} onUserUpdated={handleUserUpdated} />
    );
  } else if (view === "stores") {
    content = <StoresPage run={run} showToast={showToast} />;
  } else if (view === "chat") {
    content = <ChatPage user={user} run={run} showToast={showToast} />;
  } else if (view === "profile") {
    content = <ProfilePage user={user} run={run} showToast={showToast} onUserUpdated={handleUserUpdated} />;
  } else if (view === "admin") {
    content = user && user.role === "admin" ? <AdminPage run={run} showToast={showToast} /> : <AuthPage onAuth={handleAuth} run={run} showToast={showToast} onBack={goHome} />;
  } else if (user) {
    content = <Dashboard user={user} setView={setView} />;
  } else {
    content = <Landing onSignUp={goAuth} onLogIn={goAuth} onExplore={() => setView("products")} />;
  }

  return (
    <div className="skinlove-page">
      <div className="page-accent" />
      {loadingCount > 0 && <LoadingOverlay />}
      <Toast toast={toast} />

      {user ? (
        <AppNav view={view} setView={setView} user={user} onLogout={handleLogout} onHome={goHome} />
      ) : (
        <PublicNav onLogIn={goAuth} onSignUp={goAuth} onExplore={() => setView("products")} />
      )}

      <main className="app-main">{content}</main>

      <footer className="app-footer">
        <span>🌿 SkinLove — Built for East Africa</span>
        <span>Vercel + Render + Neon</span>
      </footer>
    </div>
  );
}
