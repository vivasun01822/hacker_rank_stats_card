const WIDTH = 600;
const PADDING = 28;
const BADGES_PER_ROW = 5;
const HEX_RADIUS = 40;
const ROW_HEIGHT = 136; // hexagon + two title lines + gap
const GRID_TOP = 136;
const EMPTY_HEIGHT = 56;
const BOTTOM_PADDING = 6;

const { THEMES } = require("./themes");

const STAR_INK = "#0F3D2E"; // stars sit on the badge metals, which are the same in every theme
const TIERS = {
  gold: ["#F5D98B", "#E9BE5A"],
  silver: ["#E4E9EB", "#C4CDD0"],
  bronze: ["#E3B08C", "#C98A5E"],
};

function escapeXml(value) {
  return String(value)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "") // illegal in XML 1.0
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function truncate(text, maxLength) {
  const chars = [...text];
  return chars.length > maxLength ? `${chars.slice(0, maxLength - 1).join("").trimEnd()}…` : text;
}

// ponytail: wraps by character count because SVG has no text measurement; card fonts vary by viewer's OS.
function wrapTitle(title, maxLineLength = 15) {
  const lines = [""];
  for (const word of title.split(/\s+/)) {
    const current = lines[lines.length - 1];
    if (!current) lines[lines.length - 1] = word;
    else if (`${current} ${word}`.length <= maxLineLength) lines[lines.length - 1] = `${current} ${word}`;
    else lines.push(word);
  }
  if (lines.length <= 2) return lines.map((line) => truncate(line, maxLineLength));
  return [truncate(lines[0], maxLineLength), truncate(lines.slice(1).join(" "), maxLineLength)];
}

function hexPoints(cx, cy, radius) {
  const halfWidth = radius * Math.sin(Math.PI / 3);
  return [
    [cx, cy - radius],
    [cx + halfWidth, cy - radius / 2],
    [cx + halfWidth, cy + radius / 2],
    [cx, cy + radius],
    [cx - halfWidth, cy + radius / 2],
    [cx - halfWidth, cy - radius / 2],
  ].map((point) => point.map((n) => +n.toFixed(2)).join(",")).join(" ");
}

function starPoints(radius) {
  const points = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? radius * 0.45 : radius;
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    points.push(`${+(r * Math.cos(angle)).toFixed(2)},${+(r * Math.sin(angle)).toFixed(2)}`);
  }
  return points.join(" ");
}

function tierOf(stars) {
  if (stars >= 5) return "gold";
  if (stars >= 3) return "silver";
  return "bronze";
}

function renderBadge(badge, index, theme) {
  const cellWidth = (WIDTH - PADDING * 2) / BADGES_PER_ROW;
  const row = Math.floor(index / BADGES_PER_ROW);
  const cx = +(PADDING + cellWidth * (index % BADGES_PER_ROW) + cellWidth / 2).toFixed(2);
  const cy = GRID_TOP + HEX_RADIUS + row * ROW_HEIGHT;
  const iconSize = 26;

  const icon = badge.iconData
    ? `<image href="${escapeXml(badge.iconData)}" x="${cx - iconSize / 2}" y="${cy - 26}" width="${iconSize}" height="${iconSize}"/>`
    : "";

  const starGap = 10;
  const starsLeft = cx - ((badge.stars - 1) * starGap) / 2;
  const stars = Array.from({ length: badge.stars }, (_, i) =>
    `<use href="#star" x="${+(starsLeft + i * starGap).toFixed(2)}" y="${cy + 15}"/>`
  ).join("");

  const title = wrapTitle(badge.title)
    .map((line, i) =>
      `<text x="${cx}" y="${cy + HEX_RADIUS + 20 + i * 17}" font-size="14" text-anchor="middle" fill="${theme.text}">${escapeXml(line)}</text>`
    ).join("");

  const edge = theme.hexStroke ? ` stroke="${theme.hexStroke}" stroke-width="1.5"` : "";
  return `<polygon points="${hexPoints(cx, cy, HEX_RADIUS)}" fill="url(#tier-${tierOf(badge.stars)})"${edge}/>${icon}${stars}${title}`;
}

function cardHeight(badgeCount) {
  const rows = Math.ceil(badgeCount / BADGES_PER_ROW);
  return GRID_TOP + (rows ? rows * ROW_HEIGHT : EMPTY_HEIGHT) + BOTTOM_PADDING;
}

function generateCardSVG({ username, full_name: fullName, badges }, theme = THEMES.classic) {
  const height = cardHeight(badges.length);
  const totalStars = badges.reduce((sum, badge) => sum + badge.stars, 0);
  const totals = `${badges.length} ${badges.length === 1 ? "badge" : "badges"}, ${totalStars} ${totalStars === 1 ? "star" : "stars"}`;
  const handle = `@${truncate(username, 50)}`;

  const identity = fullName
    ? `<text x="${PADDING}" y="88" font-size="30" font-weight="700" fill="${theme.text}">${escapeXml(truncate(fullName, 30))}</text>
    <text x="${PADDING}" y="114" font-size="17" fill="${theme.muted}">${escapeXml(handle)}</text>`
    : `<text x="${PADDING}" y="94" font-size="30" font-weight="700" fill="${theme.text}">${escapeXml(handle)}</text>`;

  const body = badges.length
    ? badges.map((badge, i) => renderBadge(badge, i, theme)).join("")
    : `<text x="${PADDING}" y="${GRID_TOP + 24}" font-size="16" fill="${theme.muted}">No badges earned yet</text>`;

  const gradients = Object.entries(TIERS).map(([name, [top, bottom]]) =>
    `<linearGradient id="tier-${name}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/></linearGradient>`
  ).join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${height}" viewBox="0 0 ${WIDTH} ${height}" role="img" aria-labelledby="card-title" font-family="'Segoe UI', Roboto, Helvetica, Arial, sans-serif">
  <title id="card-title">HackerRank stats for ${escapeXml(username)}: ${escapeXml(totals)}</title>
  <defs>${gradients}<polygon id="star" points="${starPoints(5)}" fill="${STAR_INK}"/></defs>
  <rect x="1" y="1" width="${WIDTH - 2}" height="${height - 2}" rx="18" fill="${theme.bg}" stroke="${theme.border}" stroke-width="2"/>
  <polygon points="${hexPoints(PADDING + 10, 36, 12)}" fill="${theme.mark}"/>
  <path d="M${PADDING + 6} 30v12M${PADDING + 14} 30v12M${PADDING + 6} 36h8" stroke="${theme.bg}" stroke-width="2.4" fill="none"/>
  <text x="${PADDING + 28}" y="41" font-size="15" font-weight="600" fill="${theme.text}">HackerRank</text>
  <text x="${WIDTH - PADDING}" y="41" font-size="15" text-anchor="end" fill="${theme.accent}">${escapeXml(totals)}</text>
  ${identity}
  ${body}
</svg>`;
}

module.exports = { generateCardSVG, escapeXml, cardHeight };
