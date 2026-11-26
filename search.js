/**
 * 影迹 · CineLog — Online Media & Poster Search Engine
 * Zero-config multi-source search with automatic HD poster fetching:
 * 1. Bangumi (bgm.tv) — Native Chinese search for Movies, TV, Anime, Variety
 * 2. iTunes Search (JSONP) — HD movie posters & Chinese titles (no CORS issues)
 * 3. Jikan (MyAnimeList) — Anime posters & metadata
 * 4. TVMaze — International TV shows & series posters
 * 5. Optional TMDB API Key (if user configures one for even richer Chinese results)
 */
(function (global) {
  const TMDB_KEY_STORAGE = "cinelog_tmdb_key_v1";

  function getTmdbKey() {
    return (localStorage.getItem(TMDB_KEY_STORAGE) || "").trim();
  }

  function setTmdbKey(key) {
    const clean = String(key || "").trim();
    if (clean) localStorage.setItem(TMDB_KEY_STORAGE, clean);
    else localStorage.removeItem(TMDB_KEY_STORAGE);
  }

  // Helper: fetch with timeout
  async function fetchJsonWithTimeout(url, options = {}, timeoutMs = 8000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { ...options, signal: controller.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } finally {
      clearTimeout(timer);
    }
  }

  // Helper: JSONP request (used for iTunes API to avoid CORS blocks on static hosting)
  function fetchJsonp(url, timeoutMs = 8000) {
    return new Promise((resolve, reject) => {
      const cbName = "__cinelog_jsonp_" + Date.now() + "_" + Math.floor(Math.random() * 10000);
      const script = document.createElement("script");
      let settled = false;

      const cleanup = () => {
        if (script.parentNode) script.parentNode.removeChild(script);
        try {
          delete global[cbName];
        } catch {
          global[cbName] = undefined;
        }
      };

      const timer = setTimeout(() => {
        if (settled) return;
        settled = true;
        cleanup();
        reject(new Error("JSONP timeout"));
      }, timeoutMs);

      global[cbName] = (data) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        cleanup();
        resolve(data);
      };

      script.onerror = () => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        cleanup();
        reject(new Error("JSONP load failed"));
      };

      const sep = url.includes("?") ? "&" : "?";
      script.src = `${url}${sep}callback=${cbName}`;
      document.head.appendChild(script);
    });
  }

  // 1. Bangumi (Chinese friendly: Anime type=2, Real/Movie/TV/Variety type=6)
  async function searchBangumi(query, categoryHint) {
    const typeParam = categoryHint === "anime" ? "&type=2" : "";
    const url = `https://api.bgm.tv/search/subject/${encodeURIComponent(query)}?responseGroup=large&max_results=8${typeParam}`;
    const data = await fetchJsonWithTimeout(url, {
      headers: { Accept: "application/json" },
    });
    const list = Array.isArray(data && data.list) ? data.list : [];
    return list
      .filter((item) => item && (item.type === 2 || item.type === 6))
      .map((item) => {
        const poster =
          (item.images && (item.images.large || item.images.common || item.images.medium)) || "";
        const safePoster = poster ? poster.replace(/^http:\/\//i, "https://") : "";
        const yearMatch = String(item.air_date || "").match(/\d{4}/);
        const mappedCat = item.type === 2 ? "anime" : (categoryHint === "variety" ? "variety" : (categoryHint === "tv" ? "tv" : "movie"));
        return {
          source: "Bangumi",
          title: item.name_cn || item.name || "",
          originalTitle: item.name_cn && item.name !== item.name_cn ? item.name : "",
          year: yearMatch ? Number(yearMatch[0]) : "",
          category: mappedCat,
          posterUrl: safePoster,
          summary: (item.summary || "").trim().slice(0, 140),
        };
      })
      .filter((r) => r.title && r.posterUrl);
  }

  // 2. iTunes Search via JSONP (Great for Movies with Chinese titles & HD posters)
  async function searchItunes(query) {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&country=cn&lang=zh_cn&media=movie&entity=movie&limit=8`;
    const data = await fetchJsonp(url);
    const list = Array.isArray(data && data.results) ? data.results : [];
    return list
      .map((item) => {
        const rawArt = item.artworkUrl100 || item.artworkUrl60 || "";
        const hdPoster = rawArt.replace(/\d+x\d+bb\./i, "600x900bb.");
        const yearMatch = String(item.releaseDate || "").match(/\d{4}/);
        return {
          source: "iTunes",
          title: item.trackName || item.collectionName || "",
          originalTitle: item.artistName ? `导演 / 出品：${item.artistName}` : "",
          year: yearMatch ? Number(yearMatch[0]) : "",
          category: "movie",
          posterUrl: hdPoster,
          summary: (item.longDescription || item.shortDescription || "").trim().slice(0, 140),
        };
      })
      .filter((r) => r.title && r.posterUrl);
  }

  // 3. Jikan (MyAnimeList) for Anime
  async function searchJikan(query) {
    const url = `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=6&sfw=true`;
    const data = await fetchJsonWithTimeout(url);
    const list = Array.isArray(data && data.data) ? data.data : [];
    return list
      .map((item) => {
        const poster =
          (item.images && item.images.jpg && (item.images.jpg.large_image_url || item.images.jpg.image_url)) || "";
        return {
          source: "MAL动漫",
          title: item.title_japanese || item.title || "",
          originalTitle: item.title_english || item.title || "",
          year: item.year || (item.aired && item.aired.prop && item.aired.prop.from && item.aired.prop.from.year) || "",
          category: "anime",
          posterUrl: poster,
          summary: (item.synopsis || "").trim().slice(0, 140),
        };
      })
      .filter((r) => r.title && r.posterUrl);
  }

  // 4. TVMaze for TV Shows / Series
  async function searchTvMaze(query) {
    const url = `https://api.tvmaze.com/search/shows?q=${encodeURIComponent(query)}`;
    const list = await fetchJsonWithTimeout(url);
    if (!Array.isArray(list)) return [];
    return list
      .slice(0, 6)
      .map((entry) => {
        const s = entry.show || {};
        const poster = (s.image && (s.image.original || s.image.medium)) || "";
        const yearMatch = String(s.premiered || "").match(/\d{4}/);
        const cleanSummary = String(s.summary || "").replace(/<[^>]+>/g, "").trim();
        return {
          source: "TVMaze",
          title: s.name || "",
          originalTitle: s.language ? `${s.language} · ${s.type || "Series"}` : "",
          year: yearMatch ? Number(yearMatch[0]) : "",
          category: "tv",
          posterUrl: poster,
          summary: cleanSummary.slice(0, 140),
        };
      })
      .filter((r) => r.title && r.posterUrl);
  }

  // 5. Optional TMDB Multi Search (if user provides an API Key)
  async function searchTmdb(query, apiKey) {
    const isBearer = apiKey.length > 40;
    const url = isBearer
      ? `https://api.themoviedb.org/3/search/multi?query=${encodeURIComponent(query)}&language=zh-CN&include_adult=false`
      : `https://api.themoviedb.org/3/search/multi?api_key=${encodeURIComponent(apiKey)}&query=${encodeURIComponent(query)}&language=zh-CN&include_adult=false`;
    const headers = isBearer ? { Authorization: `Bearer ${apiKey}` } : {};
    const data = await fetchJsonWithTimeout(url, { headers });
    const list = Array.isArray(data && data.results) ? data.results : [];
    return list
      .filter((item) => (item.media_type === "movie" || item.media_type === "tv") && item.poster_path)
      .slice(0, 10)
      .map((item) => {
        const isAnime = Array.isArray(item.genre_ids) && item.genre_ids.includes(16);
        const cat = isAnime ? "anime" : item.media_type === "tv" ? "tv" : "movie";
        const dateStr = item.release_date || item.first_air_date || "";
        const yearMatch = dateStr.match(/\d{4}/);
        return {
          source: "TMDB",
          title: item.title || item.name || "",
          originalTitle: item.original_title || item.original_name || "",
          year: yearMatch ? Number(yearMatch[0]) : "",
          category: cat,
          posterUrl: `https://image.tmdb.org/t/p/w500${item.poster_path}`,
          summary: (item.overview || "").trim().slice(0, 140),
        };
      });
  }

  /**
   * Unified search across available sources in parallel.
   */
  async function searchMedia(query, categoryHint = "all") {
    const q = String(query || "").trim();
    if (!q) return [];

    const tasks = [];
    const tmdbKey = getTmdbKey();
    if (tmdbKey) {
      tasks.push(searchTmdb(q, tmdbKey));
    }

    // Bangumi is best for Chinese titles across all categories
    tasks.push(searchBangumi(q, categoryHint));

    if (categoryHint === "all" || categoryHint === "movie") {
      tasks.push(searchItunes(q));
    }
    if (categoryHint === "all" || categoryHint === "anime") {
      tasks.push(searchJikan(q));
    }
    if (categoryHint === "all" || categoryHint === "tv" || categoryHint === "variety") {
      tasks.push(searchTvMaze(q));
    }

    const settled = await Promise.allSettled(tasks);
    const combined = [];
    const seen = new Set();

    settled.forEach((res) => {
      if (res.status === "fulfilled" && Array.isArray(res.value)) {
        res.value.forEach((item) => {
          const dedupKey = `${item.title.toLowerCase()}_${item.year || ""}_${item.source}`;
          if (!seen.has(dedupKey)) {
            seen.add(dedupKey);
            combined.push(item);
          }
        });
      }
    });

    return combined.slice(0, 18);
  }

  /**
   * Find the single best official poster URL for an existing item
   * (tries Chinese title first, then originalTitle if needed).
   */
  async function findBestPoster(item) {
    const queries = [item.title, item.originalTitle]
      .map((s) => String(s || "").trim())
      .filter(Boolean);

    for (const q of queries) {
      try {
        const results = await searchMedia(q, item.category || "all");
        if (results.length > 0) {
          // Prefer exact category match first
          const sameCat = results.find((r) => r.category === item.category && r.posterUrl);
          if (sameCat) return sameCat.posterUrl;
          const anyPoster = results.find((r) => r.posterUrl);
          if (anyPoster) return anyPoster.posterUrl;
        }
      } catch {
        // try next query
      }
    }
    return "";
  }

  global.CineSearch = {
    searchMedia,
    findBestPoster,
    getTmdbKey,
    setTmdbKey,
  };
})(window);
