const axios = require("axios");
const cheerio = require("cheerio");

const TIMEOUT_MS = 8000;
const USERNAME_PATTERN = /^[A-Za-z0-9_][\w.-]{0,63}$/;

function httpError(status, message) {
  return Object.assign(new Error(message), { status });
}

function isValidUsername(username) {
  return typeof username === "string" && USERNAME_PATTERN.test(username);
}

// HackerRank answers 200 for everything: unknown names and site routes like "contests" are
// redirected away from /profile/<name>, so only real users end up on a /profile/ path.
function isProfilePath(path) {
  return /^\/profile\/[^/]+$/.test(path ?? "");
}

// Real titles look like "Full Name - username | HackerRank".
function parseFullName(title, username) {
  const separator = title.toLowerCase().lastIndexOf(` - ${username.toLowerCase()} |`);
  return separator > 0 ? title.slice(0, separator).trim() : "";
}

async function fetchIcon(url, title) {
  if (!url?.startsWith("https://")) return "";
  try {
    const { data } = await axios.get(url, { responseType: "arraybuffer", timeout: TIMEOUT_MS });
    return `data:image/svg+xml;base64,${Buffer.from(data).toString("base64")}`;
  } catch (error) {
    console.error(`Error downloading icon for badge ${title}: ${error.message}`);
    return "";
  }
}

async function fetchHackerrankData(username) {
  if (!isValidUsername(username)) {
    throw httpError(400, "Usernames can only contain letters, numbers, dots, hyphens and underscores.");
  }

  let response;
  try {
    response = await axios.get(`https://www.hackerrank.com/profile/${encodeURIComponent(username)}`, {
      headers: { "User-Agent": process.env.HACKERRANK_CARD_USER_AGENT || "HackerRankCardApp" },
      timeout: TIMEOUT_MS,
    });
  } catch (error) {
    if (error.response?.status === 404) throw notFound(username);
    throw httpError(502, "HackerRank didn't respond. Try again in a minute.");
  }

  if (!isProfilePath(response.request?.path)) throw notFound(username);

  const $ = cheerio.load(response.data);

  const badges = await Promise.all($(".hacker-badge").toArray().map(async (element) => {
    const badge = $(element);
    const title = badge.find(".badge-title").text().trim() || "Badge";
    return {
      title,
      iconData: await fetchIcon(badge.find(".badge-icon").attr("href"), title),
      stars: badge.find(".badge-star").length,
    };
  }));

  badges.sort((a, b) => b.stars - a.stars);

  return { username, full_name: parseFullName($("title").text().trim(), username), badges };
}

function notFound(username) {
  return httpError(404, `No HackerRank profile found for "${username}". Check the spelling in your profile URL.`);
}

module.exports = { fetchHackerrankData, isValidUsername, isProfilePath, parseFullName };
