const HEX = /^(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;
const CUSTOM_KEYS = ["bg", "text", "accent", "border"];
const NAMES = "classic, dark, light or custom";

// bg/border/text/muted/accent/mark colour the card; badge metals stay fixed in every theme.
const THEMES = {
  classic: { bg: "#0F3D2E", border: "#2C6B53", text: "#F6FAF6", muted: "#A9C9B8", accent: "#E9BE5A", mark: "#2EC866", hexStroke: null },
  dark: { bg: "#0D1117", border: "#30363D", text: "#F0F6FC", muted: "#8B949E", accent: "#E3B341", mark: "#2EC866", hexStroke: null },
  light: { bg: "#FFFFFF", border: "#D0D7DE", text: "#1F2328", muted: "#59636E", accent: "#8A5A00", mark: "#1BA94C", hexStroke: "#8E9194" },
};

function badRequest(message) {
  return Object.assign(new Error(message), { status: 400 });
}

const channels = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

function luminance(hex) {
  const [r, g, b] = channels(hex).map((c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

// ratio of `top` over `bottom`, as #RRGGBB
function mix(top, bottom, ratio) {
  const [t, b] = [channels(top), channels(bottom)];
  return "#" + t.map((c, i) => Math.round(c * ratio + b[i] * (1 - ratio)).toString(16).padStart(2, "0")).join("").toUpperCase();
}

function parseHex(key, value) {
  if (typeof value !== "string" || !HEX.test(value)) {
    throw badRequest(`${key} must be a hex colour like 0d1117 (3 or 6 digits, no #).`);
  }
  const full = value.length === 3 ? [...value].map((c) => c + c).join("") : value;
  return `#${full.toUpperCase()}`;
}

function resolveTheme(query = {}) {
  const name = query.theme === undefined ? "classic" : query.theme;
  if (name !== "custom") {
    if (typeof name !== "string" || !Object.hasOwn(THEMES, name)) throw badRequest(`Theme must be ${NAMES}.`);
    return { ...THEMES[name] };
  }

  const given = {};
  for (const key of CUSTOM_KEYS) if (query[key] !== undefined) given[key] = parseHex(key, query[key]);

  // Colours the user leaves out come from the light or dark theme, whichever suits their background.
  const base = THEMES[luminance(given.bg ?? THEMES.dark.bg) > 0.4 ? "light" : "dark"];
  const theme = { ...base, ...given };
  theme.muted = mix(theme.text, theme.bg, 0.7);
  theme.hexStroke = luminance(theme.bg) > 0.4 ? mix(theme.text, theme.bg, 0.45) : null;
  theme.mark = luminance(theme.bg) > 0.4 ? THEMES.light.mark : THEMES.dark.mark;
  return theme;
}

module.exports = { THEMES, resolveTheme, contrastRatio, mix };
