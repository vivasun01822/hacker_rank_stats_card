const { createCanvas, loadImage } = require("canvas");
const fs = require("fs");
const axios = require("axios");

// Load the HackerRank logo
async function loadLocalHackerRankLogo(logoPath) {
  if (fs.existsSync(logoPath)) {
    return await loadImage(logoPath);
  } else {
    console.error(`Logo file not found at ${logoPath}`);
    return null;
  }
}

// Create a GitHub-style card
async function createGithubCard(data, logoPath, outputFile) {
  const cardWidth = 600; // Fixed attractive size
  const cardHeight = 300; // Fixed height
  const cardPadding = 20;
  const badgeSize = 60; // Smaller badge size
  const badgeSpacing = 30;
  const logoHeight = 60;
  const yOffsetStart = logoHeight + 40;
  let yOffset = yOffsetStart;

  const badgesPerRow = Math.floor((cardWidth - cardPadding * 2) / (badgeSize + badgeSpacing));
  const rowsNeeded = Math.ceil(data.badges.length / badgesPerRow);

  const canvas = createCanvas(cardWidth, cardHeight);
  const ctx = canvas.getContext("2d");

  // Set background color
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, cardWidth, cardHeight);

  // Draw the HackerRank logo
  const logo = await loadLocalHackerRankLogo(logoPath);
  if (logo) {
    ctx.drawImage(logo, cardPadding, cardPadding, 200, logoHeight);
  }

  // Add user information
  ctx.font = "bold 22px sans-serif";
  ctx.fillStyle = "#333";
  ctx.fillText(`HackerRank User: ${data.username || "N/A"}`, cardPadding, yOffset);
  yOffset += 35;

  ctx.font = "18px sans-serif";
  ctx.fillText(`Name: ${data.full_name || "N/A"}`, cardPadding, yOffset);
  yOffset += 40;

  // Center badges horizontally
  const totalBadgeWidth = badgesPerRow * badgeSize + (badgesPerRow - 1) * badgeSpacing;
  let xOffset = (cardWidth - totalBadgeWidth) / 2;

  // Draw badges
  for (let i = 0; i < data.badges.length; i++) {
    const badge = data.badges[i];

    try {
      // Fetch the badge icon
      const response = await axios.get(badge.icon_url, { responseType: "arraybuffer" });
      const badgeIcon = await loadImage(Buffer.from(response.data));

      // Draw hexagon shape for the badge
      const hexCenterX = xOffset + badgeSize / 2;
      const hexCenterY = yOffset + badgeSize / 2;
      const hexRadius = badgeSize / 2;

      const gradient = ctx.createLinearGradient(hexCenterX, yOffset, hexCenterX, yOffset + badgeSize);
      gradient.addColorStop(0, badge.gradient === "badge-gold-gradient" ? "#FFD700" : "#E57373");
      gradient.addColorStop(1, "#FFFFFF");

      ctx.fillStyle = gradient;
      drawHexagon(ctx, hexCenterX, hexCenterY, hexRadius);
      ctx.fill();

      // Draw the badge icon
      const iconSize = badgeSize * 0.5;
      ctx.drawImage(
        badgeIcon,
        xOffset + (badgeSize - iconSize) / 2,
        yOffset + (badgeSize - iconSize) / 2 - 5,
        iconSize,
        iconSize
      );

      // Draw the badge title
      ctx.font = "bold 14px sans-serif";
      ctx.fillStyle = "#333";
      ctx.textAlign = "center";
      ctx.fillText(badge.title, hexCenterX, yOffset + badgeSize + 15);

      // Draw stars
      const starText = "★".repeat(badge.stars) + "☆".repeat(5 - badge.stars);
      ctx.font = "14px sans-serif";
      ctx.fillStyle = "#FFD700";
      ctx.fillText(starText, hexCenterX, yOffset + badgeSize + 35);

      // Update positions
      xOffset += badgeSize + badgeSpacing;

      // Wrap to the next row if needed
      if ((i + 1) % badgesPerRow === 0) {
        xOffset = (cardWidth - totalBadgeWidth) / 2;
        yOffset += badgeSize + badgeSpacing + 40;
      }
    } catch (err) {
      console.error(`Error loading badge: ${err.message}`);
    }
  }

  // Save the card as a PNG file
  const buffer = canvas.toBuffer("image/png");
  fs.writeFileSync(outputFile, buffer);
  console.log(`Card saved as ${outputFile}`);
}

// Helper function to draw a hexagon
function drawHexagon(ctx, x, y, radius) {
  ctx.beginPath();
  for (let i = 0; i <= 6; i++) {
    const angle = (Math.PI / 3) * i;
    ctx.lineTo(x + radius * Math.cos(angle), y + radius * Math.sin(angle));
  }
  ctx.closePath();
}

module.exports = { createGithubCard };
