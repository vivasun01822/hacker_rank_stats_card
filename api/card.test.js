const test = require("node:test");
const assert = require("node:assert");
const { generateCardSVG, escapeXml, cardHeight } = require("./card");
const { isValidUsername, isProfilePath, parseFullName } = require("./fetchData");

const badge = (title = "Python", stars = 3) => ({ title, stars, iconData: "" });
const badges = (count) => Array.from({ length: count }, () => badge());

test("escapes markup in every user-controlled value", () => {
  const svg = generateCardSVG({
    username: "a&b",
    full_name: `<script>alert("x")</script>`,
    badges: [badge("C & <C++>")],
  });
  assert.ok(!svg.includes("<script>"));
  assert.ok(!svg.includes("C & "));
  assert.ok(svg.includes("&lt;script&gt;"));
  assert.ok(svg.includes("@a&amp;b"));
});

test("escapeXml removes control characters XML cannot hold", () => {
  assert.strictEqual(escapeXml("a\x01b'"), "ab&apos;");
});

test("height adds a row only when a row overflows", () => {
  assert.strictEqual(cardHeight(1), cardHeight(5));
  assert.ok(cardHeight(6) > cardHeight(5));
  assert.strictEqual(cardHeight(6), cardHeight(10));
  assert.ok(cardHeight(11) > cardHeight(10));
});

test("last badge row fits inside the card", () => {
  const svg = generateCardSVG({ username: "u", full_name: "U", badges: badges(11) });
  const height = Number(svg.match(/ height="(\d+)"/)[1]);
  const lastTitleY = Math.max(...[...svg.matchAll(/<text [^>]*y="([\d.]+)"/g)].map((m) => Number(m[1])));
  assert.ok(lastTitleY < height, `${lastTitleY} should be above ${height}`);
});

test("zero badges shows the empty message and valid totals", () => {
  const svg = generateCardSVG({ username: "u", full_name: "U", badges: [] });
  assert.ok(svg.includes("No badges earned yet"));
  assert.ok(svg.includes("0 badges, 0 stars"));
});

test("singular totals read correctly", () => {
  const svg = generateCardSVG({ username: "u", full_name: "U", badges: [badge("C", 1)] });
  assert.ok(svg.includes("1 badge, 1 star"));
});

test("missing name promotes the handle and drops the name row", () => {
  const svg = generateCardSVG({ username: "someone", full_name: "", badges: [] });
  assert.ok(svg.includes('font-size="30" font-weight="700" fill="#F6FAF6">@someone'));
  assert.ok(!svg.includes("N/A"));
});

test("long names are truncated", () => {
  const svg = generateCardSVG({ username: "u", full_name: "x".repeat(80), badges: [] });
  assert.ok(svg.includes("…"));
  assert.ok(!svg.includes("x".repeat(31)));
});

test("username validation blocks path and markup characters", () => {
  for (const good of ["samba9274", "a.b-c_d", "_x"]) assert.ok(isValidUsername(good), good);
  for (const bad of ["", "../x", "..", "a<b", "a/b", "a b", "x".repeat(65), ["a"], undefined]) {
    assert.ok(!isValidUsername(bad), String(bad));
  }
});

test("only a final /profile/ path counts as a real user", () => {
  assert.ok(isProfilePath("/profile/samba9274"));
  for (const path of ["/contests", "/dashboard", "/nobody", "/profile/", "/profile/a/b", undefined]) {
    assert.ok(!isProfilePath(path), String(path));
  }
});

test("full name comes from the title, and is empty when absent", () => {
  assert.strictEqual(parseFullName("Yash Eksambekar - samba9274 | HackerRank", "SAMBA9274"), "Yash Eksambekar");
  assert.strictEqual(parseFullName("Anne-Marie - Smith - am | HackerRank", "am"), "Anne-Marie - Smith");
  assert.strictEqual(parseFullName("someone | HackerRank", "someone"), "");
});
