const test = require("node:test");
const assert = require("node:assert");
const { THEMES, resolveTheme, contrastRatio } = require("./themes");
const { generateCardSVG } = require("./card");

const user = { username: "u", full_name: "U", badges: [{ title: "Python", stars: 5, iconData: "" }, { title: "Java", stars: 3, iconData: "" }] };
const rejects = (query, pattern) => assert.throws(() => resolveTheme(query), (e) => e.status === 400 && pattern.test(e.message));

test("no theme means the classic green card", () => {
  assert.deepStrictEqual(resolveTheme({}), THEMES.classic);
  assert.deepStrictEqual(resolveTheme({ username: "x" }), THEMES.classic);
  assert.ok(generateCardSVG(user).includes('fill="#0F3D2E"'));
  assert.strictEqual(generateCardSVG(user), generateCardSVG(user, resolveTheme({ theme: "classic" })));
});

test("dark and light cards use their own colours, classic ones are gone", () => {
  for (const name of ["dark", "light"]) {
    const svg = generateCardSVG(user, resolveTheme({ theme: name }));
    assert.ok(svg.includes(`fill="${THEMES[name].bg}"`), name);
    assert.ok(!svg.includes("#0F3D2E\" stroke") && !svg.includes('#2C6B53'), name);
  }
});

test("light cards outline the hexagons so silver stays visible on white", () => {
  assert.ok(generateCardSVG(user, resolveTheme({ theme: "light" })).includes('stroke-width="1.5"'));
  assert.ok(!generateCardSVG(user, resolveTheme({ theme: "dark" })).includes('stroke-width="1.5"'));
});

test("unknown themes are rejected, including prototype names and arrays", () => {
  rejects({ theme: "nope" }, /classic, dark, light or custom/);
  rejects({ theme: "__proto__" }, /classic, dark, light or custom/);
  rejects({ theme: "constructor" }, /classic, dark, light or custom/);
  rejects({ theme: ["dark", "light"] }, /classic, dark, light or custom/);
  rejects({ theme: "" }, /classic, dark, light or custom/);
});

test("custom takes four hex colours, with 3-digit expansion", () => {
  const t = resolveTheme({ theme: "custom", bg: "0b1020", text: "FFF", accent: "ffd166", border: "30363d" });
  assert.strictEqual(t.bg, "#0B1020");
  assert.strictEqual(t.text, "#FFFFFF");
  assert.strictEqual(t.accent, "#FFD166");
  assert.strictEqual(t.border, "#30363D");
  assert.match(t.muted, /^#[0-9A-F]{6}$/);
  assert.ok(generateCardSVG(user, t).includes('fill="#0B1020"'));
});

test("custom colours left out fall back to a theme that suits the background", () => {
  assert.strictEqual(resolveTheme({ theme: "custom" }).bg, THEMES.dark.bg);
  const onWhite = resolveTheme({ theme: "custom", bg: "fafafa" });
  assert.strictEqual(onWhite.text, THEMES.light.text);
  assert.ok(contrastRatio(onWhite.text, onWhite.bg) >= 4.5);
  const onBlack = resolveTheme({ theme: "custom", bg: "000" });
  assert.strictEqual(onBlack.text, THEMES.dark.text);
});

test("bad colours are rejected before anything reaches the SVG", () => {
  for (const bad of ["zz", "12", "12345", "1234567", "#fff", "f00\"/><script>", "red", "", ["fff"], { a: 1 }]) {
    rejects({ theme: "custom", bg: bad }, /bg must be a hex colour/);
  }
  rejects({ theme: "custom", accent: "<svg" }, /accent must be a hex colour/);
});

test("colours are ignored unless the theme is custom", () => {
  assert.deepStrictEqual(resolveTheme({ theme: "dark", bg: "zz" }), THEMES.dark);
  assert.deepStrictEqual(resolveTheme({ bg: "f00" }), THEMES.classic);
});

test("every built-in theme is readable (AA, 4.5:1)", () => {
  for (const [name, t] of Object.entries(THEMES)) {
    for (const key of ["text", "muted", "accent"]) {
      assert.ok(contrastRatio(t[key], t.bg) >= 4.5, `${name} ${key} on bg is ${contrastRatio(t[key], t.bg).toFixed(2)}`);
    }
  }
});

test("derived muted text stays readable for custom backgrounds", () => {
  for (const [bg, text] of [["0b1020", "e6edf3"], ["ffffff", "111111"], ["fafafa", "1f2328"], ["000", "fff"]]) {
    const t = resolveTheme({ theme: "custom", bg, text });
    assert.ok(contrastRatio(t.muted, t.bg) >= 4.5, `${bg}/${text} muted is ${contrastRatio(t.muted, t.bg).toFixed(2)}`);
  }
});

test("the page's palette table matches the server themes", () => {
  const html = require("node:fs").readFileSync(require("node:path").join(__dirname, "..", "public", "index.html"), "utf8");
  const page = JSON.parse(html.match(/<script type="application\/json" id="themes">(.*?)<\/script>/s)[1]);
  assert.deepStrictEqual(Object.keys(page), Object.keys(THEMES));
  for (const [name, colors] of Object.entries(page)) {
    for (const key of ["bg", "border", "text", "accent"]) assert.strictEqual(colors[key], THEMES[name][key], `${name}.${key}`);
  }
});
