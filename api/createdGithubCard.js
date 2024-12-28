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
  const cardWidth = 600; // Fixed card size
  var cardHeight = 350;
  if (data.badges.length > 7){
      cardHeight = 400;
  } 
  const cardPadding = 20;
  const badgeSize = 80; // Reduced hexagon size
  const logoHeight = 100;
  const yOffsetStart = logoHeight + 40;
  let yOffset = yOffsetStart;
  const cornerRadius = 20; // Added corner radius for the card

  const badgesPerRow = Math.floor((cardWidth - cardPadding * 2) / badgeSize);
  const canvas = createCanvas(cardWidth, cardHeight);
  const ctx = canvas.getContext("2d");

  // Set background color with rounded corners
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.moveTo(cornerRadius, 0); // Top-left corner
  ctx.arcTo(0, 0, 0, cardHeight, cornerRadius);
  ctx.arcTo(0, cardHeight, cardWidth, cardHeight, cornerRadius);
  ctx.arcTo(cardWidth, cardHeight, cardWidth, 0, cornerRadius);
  ctx.arcTo(cardWidth, 0, 0, 0, cornerRadius);
  ctx.closePath();
  ctx.fill();

   // Add a 2px light green border
   ctx.lineWidth = 3; // light green border width
   ctx.strokeStyle = "#00ab41"; // light green color
   ctx.stroke(); // Draw the border

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
  ctx.font = "18px sans-serif";
  ctx.fillText(`Badges: `, cardPadding, yOffset);
  yOffset += 20;
  const totalBadgeWidth = badgesPerRow * badgeSize + (badgesPerRow - 1);
  let xOffset = (cardWidth - totalBadgeWidth) / 2;

  // Draw badges
  for (let i = 0; i < data.badges.length; i++) {
    const badge = data.badges[i];

    try {
      // Fetch the badge icon
      const response = await axios.get(badge.icon_url, { responseType: "arraybuffer" });
      const badgeIcon = await loadImage(Buffer.from(response.data));

      // Draw rounded hexagon shape for the badge
      const hexCenterX = xOffset + badgeSize / 2;
      const hexCenterY = yOffset + badgeSize / 2;
      const hexRadius = badgeSize / 2;

      const gradient = ctx.createLinearGradient(hexCenterX, yOffset, hexCenterX, yOffset + badgeSize);
      gradient.addColorStop(0, badge.gradient === "badge-gold-gradient" ? "#FFD700" : "#E57373");
      gradient.addColorStop(1, "#FFFFFF");

      ctx.fillStyle = gradient;
      drawRoundedHexagon(ctx, hexCenterX, hexCenterY, hexRadius, 8); // Smaller corner radius
      ctx.fill();

      // Draw the smaller badge icon
      const iconSize = badgeSize * 0.20; // Reduced icon size (20% of badge size)
      ctx.drawImage(
        badgeIcon,
        xOffset + (badgeSize - iconSize) / 2,
        yOffset + (badgeSize - iconSize) / 2 - 5, // Reduced vertical offset for icon
        iconSize,
        iconSize
      );

      // Insert badge title inside the hexagon
      ctx.font = "bold 8px sans-serif"; // Smaller font size for title
      ctx.fillStyle = "#333";
      ctx.textAlign = "center";
      ctx.fillText(badge.title, hexCenterX, hexCenterY + 12); // Closer to the icon

      // Insert stars inside the hexagon
      const starText = "★".repeat(badge.stars); // Only show the number of stars earned
      ctx.font = "6px sans-serif"; // Adjusted font size for stars
      ctx.fillStyle = "#000000"; // Black stars
      ctx.fillText(starText, hexCenterX, hexCenterY + 20); // Closer to the title

      // Update positions
      xOffset += badgeSize;

      // Wrap to the next row if needed
      if ((i + 1) % badgesPerRow === 0) {
        xOffset = (cardWidth - totalBadgeWidth) / 2;
        yOffset += badgeSize;
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

// Helper function to draw a rounded hexagon
function drawRoundedHexagon(ctx, x, y, radius, cornerRadius) {
  ctx.beginPath();
  for (let i = 0; i <= 6; i++) {
    const angle = (Math.PI / 3) * i;
    const nextAngle = (Math.PI / 3) * (i + 1);

    const startX = x + (radius - cornerRadius) * Math.cos(angle);
    const startY = y + (radius - cornerRadius) * Math.sin(angle);
    const endX = x + (radius - cornerRadius) * Math.cos(nextAngle);
    const endY = y + (radius - cornerRadius) * Math.sin(nextAngle);

    const cornerX = x + radius * Math.cos(angle);
    const cornerY = y + radius * Math.sin(angle);

    ctx.lineTo(startX, startY);
    ctx.arcTo(cornerX, cornerY, endX, endY, cornerRadius);
  }
  ctx.closePath();
}

module.exports = { createGithubCard };
