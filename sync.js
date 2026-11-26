/**
 * 影迹 · CineLog — Cloud Sync Engine
 * Supports:
 * 1. GitHub Gist (Recommended: 100% free, never sleeps, private secret gist)
 * 2. Supabase REST API (Free Postgres cloud database)
 *
 * Credentials are stored strictly in the local browser's localStorage
 * and are never hardcoded into source files.
 */
(function (global) {
  const SYNC_CONFIG_KEY = "cinelog_sync_config_v1";
  const GIST_FILENAME = "cinelog-data.json";
  const SUPABASE_TABLE = "cinelog_store";
  const SUPABASE_ROW_ID = "default_user";

  const defaultConfig = {
    provider: "none", // "none" | "gist" | "supabase"
    autoSync: true,
    // GitHub Gist
    gistToken: "",
    gistId: "",
    // Supabase
    supabaseUrl: "",
    supabaseAnonKey: "",
    supabaseRecordId: SUPABASE_ROW_ID,
    // Metadata
    lastSyncedAt: null,
  };

  function loadConfig() {
    try {
      const raw = localStorage.getItem(SYNC_CONFIG_KEY);
      if (raw) {
        return { ...defaultConfig, ...JSON.parse(raw) };
      }
    } catch (e) {
      console.warn("Failed to load sync config:", e);
    }
    return { ...defaultConfig };
  }

  function saveConfig(cfg) {
    const merged = { ...defaultConfig, ...cfg };
    localStorage.setItem(SYNC_CONFIG_KEY, JSON.stringify(merged));
    return merged;
  }

  function isConfigured(cfg) {
    if (!cfg || cfg.provider === "none") return false;
    if (cfg.provider === "gist") {
      return Boolean(cfg.gistToken && cfg.gistToken.trim());
    }
    if (cfg.provider === "supabase") {
      return Boolean(
        cfg.supabaseUrl &&
          cfg.supabaseUrl.trim() &&
          cfg.supabaseAnonKey &&
          cfg.supabaseAnonKey.trim()
      );
    }
    return false;
  }

  // ================= GITHUB GIST PROVIDER =================
  async function gistRequest(url, token, options = {}) {
    const res = await fetch(url, {
      ...options,
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token.trim()}`,
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });
    if (!res.ok) {
      let msg = `GitHub API 错误 (${res.status})`;
      try {
        const errData = await res.json();
        if (errData && errData.message) msg += `: ${errData.message}`;
      } catch {}
      throw new Error(msg);
    }
    return res.json();
  }

  async function pullFromGist(cfg) {
    if (!cfg.gistId || !cfg.gistId.trim()) {
      return { exists: false, data: null };
    }
    const gist = await gistRequest(
      `https://api.github.com/gists/${encodeURIComponent(cfg.gistId.trim())}`,
      cfg.gistToken
    );
    const file = gist.files && gist.files[GIST_FILENAME];
    if (!file) {
      return { exists: false, data: null };
    }
    let content = file.content;
    if (file.truncated && file.raw_url) {
      const rawRes = await fetch(file.raw_url);
      if (!rawRes.ok) throw new Error("无法读取大型 Gist 原始内容");
      content = await rawRes.text();
    }
    const parsed = JSON.parse(content);
    return { exists: true, data: parsed };
  }

  async function pushToGist(cfg, payload) {
    const body = {
      description: "影迹 CineLog 个人影音云端同步数据",
      public: false,
      files: {
        [GIST_FILENAME]: {
          content: JSON.stringify(payload, null, 2),
        },
      },
    };

    if (cfg.gistId && cfg.gistId.trim()) {
      const updated = await gistRequest(
        `https://api.github.com/gists/${encodeURIComponent(cfg.gistId.trim())}`,
        cfg.gistToken,
        {
          method: "PATCH",
          body: JSON.stringify(body),
        }
      );
      return { gistId: updated.id };
    } else {
      const created = await gistRequest("https://api.github.com/gists", cfg.gistToken, {
        method: "POST",
        body: JSON.stringify(body),
      });
      return { gistId: created.id, created: true };
    }
  }

  // ================= SUPABASE REST PROVIDER =================
  function normalizeSupabaseUrl(url) {
    return String(url || "").trim().replace(/\/+$/, "");
  }

  async function supabaseRequest(cfg, path, options = {}) {
    const base = normalizeSupabaseUrl(cfg.supabaseUrl);
    const key = cfg.supabaseAnonKey.trim();
    const res = await fetch(`${base}/rest/v1/${path}`, {
      ...options,
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });
    if (!res.ok) {
      let msg = `Supabase 错误 (${res.status})`;
      try {
        const errData = await res.json();
        if (errData && errData.message) msg += `: ${errData.message}`;
      } catch {}
      throw new Error(msg);
    }
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  }

  async function pullFromSupabase(cfg) {
    const rowId = (cfg.supabaseRecordId || SUPABASE_ROW_ID).trim();
    const rows = await supabaseRequest(
      cfg,
      `${SUPABASE_TABLE}?id=eq.${encodeURIComponent(rowId)}&select=payload,updated_at`
    );
    if (!Array.isArray(rows) || rows.length === 0 || !rows[0].payload) {
      return { exists: false, data: null };
    }
    return { exists: true, data: rows[0].payload };
  }

  async function pushToSupabase(cfg, payload) {
    const rowId = (cfg.supabaseRecordId || SUPABASE_ROW_ID).trim();
    await supabaseRequest(cfg, `${SUPABASE_TABLE}?on_conflict=id`, {
      method: "POST",
      headers: {
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify({
        id: rowId,
        payload,
        updated_at: new Date().toISOString(),
      }),
    });
    return { ok: true };
  }

  // ================= UNIFIED API =================
  async function pull(cfg) {
    if (!isConfigured(cfg)) throw new Error("尚未配置云端同步");
    if (cfg.provider === "gist") return pullFromGist(cfg);
    if (cfg.provider === "supabase") return pullFromSupabase(cfg);
    throw new Error("不支持的同步方式");
  }

  async function push(cfg, items, updatedAt) {
    if (!isConfigured(cfg)) throw new Error("尚未配置云端同步");
    const payload = {
      version: 1,
      updatedAt: updatedAt || Date.now(),
      items,
    };
    if (cfg.provider === "gist") return pushToGist(cfg, payload);
    if (cfg.provider === "supabase") return pushToSupabase(cfg, payload);
    throw new Error("不支持的同步方式");
  }

  // ================= CONFIG TRANSFER CODE =================
  function encodeShareCode(cfg) {
    const minimal = {
      provider: cfg.provider,
      autoSync: cfg.autoSync,
      gistToken: cfg.gistToken || "",
      gistId: cfg.gistId || "",
      supabaseUrl: cfg.supabaseUrl || "",
      supabaseAnonKey: cfg.supabaseAnonKey || "",
      supabaseRecordId: cfg.supabaseRecordId || SUPABASE_ROW_ID,
    };
    const json = JSON.stringify(minimal);
    const bytes = new TextEncoder().encode(json);
    let bin = "";
    bytes.forEach((b) => (bin += String.fromCharCode(b)));
    return "CINELOG1:" + btoa(bin);
  }

  function decodeShareCode(code) {
    const trimmed = String(code || "").trim();
    if (!trimmed.startsWith("CINELOG1:")) {
      throw new Error("无效的配置口令格式");
    }
    const b64 = trimmed.slice("CINELOG1:".length);
    const bin = atob(b64);
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    const json = new TextDecoder().decode(bytes);
    const parsed = JSON.parse(json);
    if (!parsed || !parsed.provider) {
      throw new Error("配置口令缺少同步方式");
    }
    return { ...defaultConfig, ...parsed };
  }

  const SUPABASE_SQL_SNIPPET = `create table if not exists public.cinelog_store (
  id text primary key,
  payload jsonb not null,
  updated_at timestamptz default now()
);

alter table public.cinelog_store enable row level security;

create policy "Allow public access for personal cinelog"
  on public.cinelog_store
  for all
  using (true)
  with check (true);`;

  global.CineSync = {
    loadConfig,
    saveConfig,
    isConfigured,
    pull,
    push,
    encodeShareCode,
    decodeShareCode,
    SUPABASE_SQL_SNIPPET,
  };
})(window);
