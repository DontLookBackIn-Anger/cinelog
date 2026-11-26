/**
 * Cinematic 2:3 Poster Art Generator (SVG Data URI)
 * Ensures every entry always displays a crisp, theatrical poster even offline,
 * while also serving as an artistic generator or fallback for custom URLs.
 */
(function (global) {
  const PALETTES = {
    cosmos:   { bg1: "#090e1f", bg2: "#1b2848", accent: "#f5b841", glow: "#38bdf8", motif: "orbit" },
    noir:     { bg1: "#0d0f14", bg2: "#261c2c", accent: "#f43f5e", glow: "#fb923c", motif: "spotlight" },
    sunset:   { bg1: "#1c0f13", bg2: "#5a2a27", accent: "#fbbf24", glow: "#f97316", motif: "horizon" },
    emerald:  { bg1: "#071a18", bg2: "#134e4a", accent: "#34d399", glow: "#2dd4bf", motif: "waves" },
    sakura:   { bg1: "#1b1026", bg2: "#4c1d45", accent: "#f472b6", glow: "#c084fc", motif: "petals" },
    cobalt:   { bg1: "#081426", bg2: "#1e3a5f", accent: "#60a5fa", glow: "#38bdf8", motif: "grid" },
    autumn:   { bg1: "#1c130a", bg2: "#5c3416", accent: "#fb923c", glow: "#facc15", motif: "horizon" },
    violet:   { bg1: "#120c24", bg2: "#311b63", accent: "#a78bfa", glow: "#f472b6", motif: "orbit" },
    neon:     { bg1: "#09131c", bg2: "#163042", accent: "#22d3ee", glow: "#f472b6", motif: "spotlight" },
    stage:    { bg1: "#141026", bg2: "#3b1d5e", accent: "#34d399", glow: "#fbbf24", motif: "stage" },
  };

  const PALETTE_KEYS = Object.keys(PALETTES);

  const CATEGORY_LABELS = {
    movie: "CINEMA · 电影",
    tv: "SERIES · 电视剧",
    anime: "ANIME · 动漫",
    variety: "VARIETY · 综艺",
  };

  function escapeXml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }

  function hashString(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return Math.abs(h);
  }

  function renderMotif(motif, accent, glow) {
    switch (motif) {
      case "orbit":
        return `
          <circle cx="200" cy="215" r="95" fill="url(#orbGlow)" opacity="0.9"/>
          <ellipse cx="200" cy="220" rx="165" ry="42" fill="none" stroke="${accent}" stroke-width="2" stroke-opacity="0.65" transform="rotate(-18 200 220)"/>
          <ellipse cx="200" cy="220" rx="135" ry="30" fill="none" stroke="${glow}" stroke-width="1.2" stroke-opacity="0.45" transform="rotate(-18 200 220)"/>
          <circle cx="318" cy="176" r="6" fill="${accent}"/>
          <circle cx="88" cy="115" r="2" fill="#fff" opacity="0.8"/>
          <circle cx="310" cy="95" r="1.8" fill="#fff" opacity="0.6"/>
          <circle cx="140" cy="82" r="1.4" fill="#fff" opacity="0.7"/>
          <circle cx="265" cy="135" r="1.5" fill="#fff" opacity="0.5"/>
        `;
      case "spotlight":
        return `
          <polygon points="200,0 60,460 340,460" fill="${glow}" opacity="0.12"/>
          <polygon points="200,0 120,460 280,460" fill="${accent}" opacity="0.14"/>
          <circle cx="200" cy="205" r="78" fill="none" stroke="${accent}" stroke-width="1.8" stroke-opacity="0.55"/>
          <circle cx="200" cy="205" r="52" fill="${accent}" opacity="0.18"/>
          <line x1="40" y1="205" x2="360" y2="205" stroke="#fff" stroke-opacity="0.14" stroke-dasharray="4 6"/>
        `;
      case "horizon":
        return `
          <circle cx="200" cy="235" r="88" fill="url(#orbGlow)" opacity="0.92"/>
          <path d="M0 295 Q100 250 200 280 T400 270 L400 440 L0 440 Z" fill="#090b10" opacity="0.42"/>
          <path d="M0 325 Q130 288 240 315 T400 305 L400 460 L0 460 Z" fill="#090b10" opacity="0.68"/>
          <line x1="55" y1="235" x2="345" y2="235" stroke="${accent}" stroke-opacity="0.3" stroke-width="1"/>
        `;
      case "waves":
        return `
          <circle cx="200" cy="190" r="76" fill="url(#orbGlow)" opacity="0.78"/>
          <path d="M-20 260 C80 210, 160 300, 260 250 C330 215, 370 265, 420 245" fill="none" stroke="${accent}" stroke-width="2.5" stroke-opacity="0.65"/>
          <path d="M-20 290 C90 240, 180 330, 280 280 C340 250, 380 295, 420 275" fill="none" stroke="${glow}" stroke-width="1.8" stroke-opacity="0.45"/>
          <path d="M-20 320 C100 275, 190 355, 295 310 C350 285, 385 320, 420 305" fill="none" stroke="#fff" stroke-width="1" stroke-opacity="0.22"/>
        `;
      case "petals":
        return `
          <circle cx="200" cy="210" r="90" fill="url(#orbGlow)" opacity="0.82"/>
          <ellipse cx="145" cy="155" rx="18" ry="8" fill="${accent}" opacity="0.65" transform="rotate(-35 145 155)"/>
          <ellipse cx="268" cy="145" rx="14" ry="6" fill="${glow}" opacity="0.7" transform="rotate(28 268 145)"/>
          <ellipse cx="285" cy="240" rx="16" ry="7" fill="${accent}" opacity="0.55" transform="rotate(-22 285 240)"/>
          <ellipse cx="115" cy="260" rx="12" ry="5" fill="#fff" opacity="0.45" transform="rotate(40 115 260)"/>
          <circle cx="200" cy="210" r="115" fill="none" stroke="#fff" stroke-opacity="0.16" stroke-dasharray="2 8"/>
        `;
      case "stage":
        return `
          <polygon points="80,0 175,380 25,380" fill="${accent}" opacity="0.15"/>
          <polygon points="320,0 375,380 225,380" fill="${glow}" opacity="0.15"/>
          <circle cx="200" cy="200" r="74" fill="url(#orbGlow)" opacity="0.85"/>
          <rect x="135" y="135" width="130" height="130" rx="22" fill="none" stroke="${accent}" stroke-width="1.6" stroke-opacity="0.55" transform="rotate(12 200 200)"/>
        `;
      default: // grid
        return `
          <circle cx="200" cy="195" r="84" fill="url(#orbGlow)" opacity="0.82"/>
          <g stroke="${accent}" stroke-opacity="0.18" stroke-width="1">
            <line x1="0" y1="280" x2="400" y2="280"/>
            <line x1="0" y1="315" x2="400" y2="315"/>
            <line x1="0" y1="355" x2="400" y2="355"/>
            <line x1="200" y1="250" x2="40" y2="440"/>
            <line x1="200" y1="250" x2="140" y2="440"/>
            <line x1="200" y1="250" x2="260" y2="440"/>
            <line x1="200" y1="250" x2="360" y2="440"/>
          </g>
        `;
    }
  }

  function wrapTitle(title) {
    const clean = String(title || "未命名").trim();
    if (clean.length <= 8) return [clean];
    if (clean.length <= 16) {
      const mid = Math.ceil(clean.length / 2);
      return [clean.slice(0, mid), clean.slice(mid)];
    }
    return [clean.slice(0, 8), clean.slice(8, 15) + "…"];
  }

  function generatePosterDataUri({ title, originalTitle = "", year = "", category = "movie", paletteKey = "" }) {
    const key =
      paletteKey && PALETTES[paletteKey]
        ? paletteKey
        : PALETTE_KEYS[hashString(title + category) % PALETTE_KEYS.length];
    const p = PALETTES[key];
    const catLabel = CATEGORY_LABELS[category] || "CINELOG";
    const lines = wrapTitle(title);
    const fontSize = lines[0].length > 6 ? 34 : 42;
    const titleStartY = lines.length === 1 ? 470 : 444;

    const titleSvg = lines
      .map(
        (line, idx) =>
          `<text x="200" y="${titleStartY + idx * (fontSize + 8)}" text-anchor="middle" fill="#ffffff" font-family="PingFang SC, Microsoft YaHei, sans-serif" font-size="${fontSize}" font-weight="800" letter-spacing="2">${escapeXml(line)}</text>`
      )
      .join("");

    const subText = originalTitle ? originalTitle.slice(0, 28) : (year ? `${year} · COLLECTION` : "PERSONAL ARCHIVE");

    const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 600" width="400" height="600">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${p.bg1}"/>
      <stop offset="100%" stop-color="${p.bg2}"/>
    </linearGradient>
    <radialGradient id="orbGlow" cx="50%" cy="45%" r="55%">
      <stop offset="0%" stop-color="${p.accent}" stop-opacity="0.95"/>
      <stop offset="55%" stop-color="${p.glow}" stop-opacity="0.45"/>
      <stop offset="100%" stop-color="${p.bg1}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="bottomFade" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#07090e" stop-opacity="0"/>
      <stop offset="52%" stop-color="#07090e" stop-opacity="0.72"/>
      <stop offset="100%" stop-color="#07090e" stop-opacity="0.96"/>
    </linearGradient>
  </defs>

  <rect width="400" height="600" fill="url(#bgGrad)"/>

  ${renderMotif(p.motif, p.accent, p.glow)}

  <rect x="0" y="290" width="400" height="310" fill="url(#bottomFade)"/>

  <!-- Subtle cinema frame border -->
  <rect x="16" y="16" width="368" height="568" rx="12" fill="none" stroke="#ffffff" stroke-opacity="0.14" stroke-width="1"/>

  <!-- Top Category Header -->
  <text x="200" y="54" text-anchor="middle" fill="${p.accent}" font-family="Segoe UI, PingFang SC, sans-serif" font-size="11.5" font-weight="700" letter-spacing="3">${escapeXml(catLabel)}</text>
  <line x1="158" y1="68" x2="242" y2="68" stroke="${p.accent}" stroke-opacity="0.5" stroke-width="1.2"/>

  <!-- Main Title -->
  ${titleSvg}

  <!-- Original Title / Subtitle -->
  <text x="200" y="528" text-anchor="middle" fill="rgba(255,255,255,0.62)" font-family="Segoe UI, sans-serif" font-size="12.5" letter-spacing="1.6">${escapeXml(subText.toUpperCase())}</text>

  <!-- Year Footer -->
  <text x="200" y="562" text-anchor="middle" fill="${p.accent}" font-family="Segoe UI, sans-serif" font-size="12" font-weight="700" letter-spacing="3">${escapeXml(year || "CINELOG")}</text>
</svg>`.trim();

    return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);
  }

  global.PosterArt = {
    generate: generatePosterDataUri,
    palettes: PALETTE_KEYS,
  };
})(window);
