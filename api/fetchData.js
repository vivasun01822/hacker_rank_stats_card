const axios = require("axios");
const cheerio = require("cheerio");
const fs = require('fs');
const path = require('path');

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
    // const badgeIconMap = new Map();
    const badgeElements = $(".hacker-badge").toArray();
    for (const element of badgeElements) {
      const badgeElement = $(element);

      // Badge title
      const badgeTitle = badgeElement.find(".badge-title").text().trim() || "N/A";

      // Badge icon URL
      const badgeIcon = badgeElement.find(".badge-icon");
      const badgeIconUrl = badgeIcon.attr("href") || "N/A";

      // get the image and store the badge with name like "10_days_of_javascript"
      const badgeIconName = badgeIconUrl.split("/").pop().split(".")[0];
      const publicDir = path.join(__dirname, '/hacker_rank_stats_card/public');
      const imagePath = path.join(publicDir, `${badgeIconName}.svg`);

      // Ensure the public directory exists
      if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
      }

      try {
        // Download and save the image
        const imageResponse = await axios.get(badgeIconUrl, { responseType: 'arraybuffer' });
        fs.writeFileSync(imagePath, imageResponse.data);
      } catch (error) {
        console.error(`Error downloading image for badge ${badgeTitle}: ${error.message}`);
      }

      // Extract the gradient from the 'fill' attribute in the <path> element
      const badgePath = badgeElement.find("path");
      const badgeGradient = badgePath.attr("fill")?.match(/url\(#(.+)\)/)?.[1] || "N/A";

      // Extract the number of stars for the badge
      const starCount = badgeElement.find(".badge-star").length || 0;

      // Append badge details
      badges.push({
        title: badgeTitle,
        icon_url: badgeIconUrl,
        gradient: badgeGradient,
        stars: starCount,
        imagePath: imagePath,
      });

    }

    // Sort badges by stars in descending order
    badges.sort((a, b) => b.stars - a.stars);

    // Return structured data
    return {
      username,
      full_name: profileName,
      badges,
    };
  } catch (error) {
    throw new Error(`Failed to fetch HackerRank data: ${error.message}`);
  }
}

module.exports = { fetchHackerrankData };
