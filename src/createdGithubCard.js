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
  const cardWidth = 600;
  const logoHeight = 80;
  const badgeWidth = 50;
  const spaceBetweenBadges = 20;
  const yOffsetStart = logoHeight + 30;
  let yOffset = yOffsetStart;

  const badgesInRow = Math.floor((cardWidth - 40) / (badgeWidth + spaceBetweenBadges));
  const badgeRows = Math.ceil(data.badges.length / badgesInRow);
  const totalCardHeight = yOffsetStart + badgeRows * (badgeWidth + spaceBetweenBadges + 20) + 180;
  
  // Create a canvas with curved corners
  const canvas = createCanvas(cardWidth, totalCardHeight);
  const ctx = canvas.getContext("2d");

  // Draw a rounded rectangle for the card background
  const cornerRadius = 20;
  ctx.fillStyle = "white";
  ctx.beginPath();
  ctx.moveTo(cornerRadius, 0);
  ctx.arcTo(cardWidth, 0, cardWidth, totalCardHeight, cornerRadius);
  ctx.arcTo(cardWidth, totalCardHeight, 0, totalCardHeight, cornerRadius);
  ctx.arcTo(0, totalCardHeight, 0, 0, cornerRadius);
  ctx.arcTo(0, 0, cardWidth, 0, cornerRadius);
  ctx.closePath();
  ctx.fill();

  // Add a 2px grey border
  ctx.lineWidth = 8;
  ctx.strokeStyle = "#00ab41"; // light green color
  ctx.stroke(); // Draw the border

  // Load and draw the HackerRank logo
  const logo = await loadLocalHackerRankLogo(logoPath);
  if (logo) {
    ctx.drawImage(logo, 20, 20, 200, logoHeight);
  }
  yOffset += 20;

  // Set default font
  ctx.font = "bold 32px sans-serif";
  ctx.fillStyle = "black";

  // Add user info
  ctx.fillText(`HackerRank User: ${data.username}`, 20, yOffset);
  yOffset += 40;
  ctx.font = "16px sans-serif";
  ctx.fillText(`Name: ${data.full_name}`, 20, yOffset);
  yOffset += 60;

  // Add badges section
  ctx.fillText("Badges:", 20, yOffset);
  yOffset += 20; 

  let xOffset = 30;

  for (let i = 0; i < data.badges.length; i++) {
    const badge = data.badges[i];

    if (badge.icon_url !== "N/A") {
      try {
        // Fetch the badge image
        const response = await axios.get(badge.icon_url, { responseType: "arraybuffer" });
        const badgeImage = await loadImage(Buffer.from(response.data));

        // Draw the badge image
        ctx.drawImage(badgeImage, xOffset, yOffset, badgeWidth, badgeWidth);

        // Add badge title with wrapping (updated to be responsive)
        const badgeTitle = badge.title;
        const badgeTitleMaxWidth = badgeWidth; // Max width for the title under the badge
        const lineHeight = 18; // Set the line height for wrapped text
        let currentYOffset = yOffset + badgeWidth + 20; // Starting position for text (below badge image)

        const words = badgeTitle.split(' ');
        let lines = [];
        let currentLine = '';

        // Wrap the text into lines that fit within the badge width
        for (let i = 0; i < words.length; i++) {
          const testLine = currentLine + words[i] + ' ';
          const testWidth = ctx.measureText(testLine).width;

          // Check if the text exceeds the width and create a new line
          if (testWidth > badgeTitleMaxWidth && currentLine.length > 0) {
            lines.push(currentLine); // Push the current line to lines array
            currentLine = words[i] + ' '; // Start a new line
          } else {
            currentLine = testLine; // Continue adding to current line
          }
        }

        lines.push(currentLine); // Push the final line

        // Draw each line of the wrapped badge title
        const donwLine = 5;
        lines.forEach((lineText, index) => {
          // Center the text below the badge image
          ctx.fillText(lineText, xOffset + (badgeWidth - ctx.measureText(lineText).width) / 2, currentYOffset + index * lineHeight);
          currentYOffset += donwLine; // Move down for the next line
        });

        // Update position for next badge
        xOffset += badgeWidth + spaceBetweenBadges;

        // Check if we need to move to the next row of badges
        if ((i + 1) % badgesInRow === 0) {
          xOffset = 20;
          yOffset += badgeWidth + spaceBetweenBadges + (lines.length * lineHeight); // Adjust for wrapped text height
        }

      } catch (err) {
        console.error(`Failed to load badge image for ${badge.title}: ${err.message}`);
      }
    }
  }

  // Save the card as a PNG file
  const buffer = canvas.toBuffer("image/png");
  fs.writeFileSync(outputFile, buffer);
  console.log(`Card saved as ${outputFile}`);
}

module.exports = { createGithubCard };