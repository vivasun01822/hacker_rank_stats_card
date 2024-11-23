const axios = require("axios");
const cheerio = require("cheerio");

// Fetch user profile data from HackerRank
async function fetchHackerrankData(username) {
  const url = `https://www.hackerrank.com/${username}`;
  const headers = {
    "User-Agent": process.env.HACKERRANK_CARD_USER_AGENT || "HackerRankCardApp"
  };

  try {
    // Fetch the HTML page
    const response = await axios.get(url, { headers });
    if (response.status !== 200) {
      throw new Error("User not found or request failed");
    }

    const $ = cheerio.load(response.data);

    // Extract profile name from the title
    const title = $("title").text().trim();
    const profileName = title.includes(" - ") ? title.split(" - ")[0] : "N/A";

    // Extract badges
    const badges = [];
    $(".hacker-badge").each((_, element) => {
      const badgeElement = $(element);

      // Badge title
      const badgeTitle = badgeElement.find(".badge-title").text().trim() || "N/A";

      // Badge icon URL
      const badgeIcon = badgeElement.find(".badge-icon");
      const badgeIconUrl = badgeIcon.attr("href") || "N/A";
      // Extract the badge gradient (e.g., bronze gradient)
      const badgeGradient = badgeElement.find("linearGradient").attr("id") || "N/A";

      // Extract the number of stars for the badge
      const starCount = badgeElement.find(".badge-star").length || 0;

      // Append badge details
      badges.push({
        title: badgeTitle,
        icon_url: badgeIconUrl,
        gradient: badgeGradient,
        stars: starCount
      });
    });

    // Return structured data
    return {
      username,
      full_name: profileName,
      badges
    };
  } catch (error) {
    console.error(`Error fetching data for ${username}: ${error.message}`);
    throw error;
  }
}

module.exports = { fetchHackerrankData };
