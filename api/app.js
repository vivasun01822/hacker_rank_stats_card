const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { fetchHackerrankData } = require("../api/fetchData"); // Your existing function
const { log } = require("console");
const cors = require("cors");

const app = express();
const upload = multer(); // For processing form data

// Middleware to parse form data (urlencoded data)
app.use(express.urlencoded({ extended: true }));

// Middleware to parse JSON data
app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname, "public"))); // Serves static files like CSS, JS, and index.html
app.use("/output", express.static(path.join(__dirname, "output"))); // Serves generated images

// Route: Home Page
app.get("/", (req, res) => {
  const indexFilePath = path.join(__dirname, "..", "public", "index.html");

  // Ensure the file exists before sending
  if (fs.existsSync(indexFilePath)) {
    res.sendFile(indexFilePath);
  } else {
    res.status(404).send("Home page not found");
  }
});


// Route: Generate Card
app.get("/generate-card", cors(), async (req, res) => {

  console.log("url", req.url);

  const { username } = req.query;

  if (!username) {
    return res.status(400).json({ success: false, message: "Username is required" });
  }

  console.log("Generating card for ", username);

  const logoPath = "https://i.postimg.cc/4y1Dpxv4/hackerrank.jpg"

  try {
    // Fetch user data and generate the card
    const userData = await fetchHackerrankData(username);

    // Generate SVG content
    const svgContent = generateGithubCardSVG(userData, logoPath);

    // Return the SVG as responsesrc
    res.setHeader("Content-Type", "image/svg+xml");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.send(svgContent);

  } catch (err) {
    console.error(`Error: ${err.message}`);
    res.status(500).json({ success: false, message: `Failed to generate card: ${err.message}` });
  }
});

// Catch-All: Handle Undefined Routes
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});


function generateGithubCardSVG(data, logoPath) {
  let badgesSVG = "";
  let yOffset = 130; // Starting point for badges
  const cardWidth = 600;
  let cardHeight = 350;
  const badgeSize = 90;
  const logoHeight = 120;
  const badgeGap = 10;

  // Dynamically adjust height for more badges
  if (data.badges.length > 5) {
    let temp = data.badges.length / 5
    cardHeight = cardHeight + (temp * 70);
  }

  // Create the container SVG with rounded corners
  const svgHeader = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${cardWidth}" height="${cardHeight}" viewBox="0 0 ${cardWidth} ${cardHeight}">
        <rect x="0" y="0" width="${cardWidth}" height="${cardHeight}" rx="20" ry="20" fill="#ffffff" stroke="#00ab41" stroke-width="4"/>
    `;

  // Draw the HackerRank logo
  let logoSVG = "";
  if (logoPath) {
    logoSVG = `<image href="${logoPath}" x="20" width="200" height="${logoHeight}" />`;
  }

  // Add user information with a refined font style
  const userInfo = `
      <text x="20" y="${yOffset}" font-family="Arial, sans-serif" font-size="26" font-weight="bold" fill="#333">HackerRank User: ${data.username || "N/A"}</text>
      <text x="20" y="${yOffset + 40}" font-family="Arial, sans-serif" font-size="20" fill="#333">Name: ${data.full_name || "N/A"}</text>
    `;
  yOffset += 90; // Adjust offset after user info

  // Center badges horizontally
  const badgesPerRow = 5; // Set badges per row to 5
  const totalBadgeWidth = badgesPerRow * badgeSize + (badgesPerRow - 1) * badgeGap;
  let xOffset = 20;

  // Draw badges with updated design
  for (let i = 0; i < data.badges.length; i++) {
    const badge = data.badges[i];

    // Generate perfect hexagon with gradient fill and shadows
    const hexCenterX = xOffset + badgeSize / 2;
    const hexCenterY = yOffset + badgeSize / 2;
    const hexRadius = badgeSize / 2;

    const gradient = `url(#grad${i})`;
    const badgeSVG = `
       <defs>
    <linearGradient id="grad${i}" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style="stop-color:${badge.stars >= 5
        ? '#FFD700' // Gold
        : badge.stars >= 3
          ? '#C0C0C0' // Silver
          : '#E57373' // Bronze
      };stop-opacity:1" />
        <stop offset="100%" style="stop-color:#FFFFFF;stop-opacity:1" />
    </linearGradient>
        </defs>

        <g>
          <!-- Hexagon Shape -->
          <polygon points="
            ${hexCenterX},${hexCenterY - hexRadius} 
            ${hexCenterX + hexRadius * Math.sin(Math.PI / 3)},${hexCenterY - hexRadius / 2} 
            ${hexCenterX + hexRadius * Math.sin(Math.PI / 3)},${hexCenterY + hexRadius / 2} 
            ${hexCenterX},${hexCenterY + hexRadius} 
            ${hexCenterX - hexRadius * Math.sin(Math.PI / 3)},${hexCenterY + hexRadius / 2} 
            ${hexCenterX - hexRadius * Math.sin(Math.PI / 3)},${hexCenterY - hexRadius / 2}
          " fill="${gradient}" stroke="#333" stroke-width="2" filter="url(#shadow)"/>

          <!-- Badge Icon -->
          <image href="${badge.icon_url}" x="${xOffset + (badgeSize - badgeSize * 0.30) / 2}" y="${yOffset + (badgeSize - badgeSize * 0.30) / 2 - 5}" width="${badgeSize * 0.30}" height="${badgeSize * 0.30}" />
          
          <!-- Badge Title -->
          <text x="${hexCenterX}" y="${hexCenterY + 15}" font-family="Arial, sans-serif" font-size="9" font-weight="bold" text-anchor="middle" fill="#333">${badge.title}</text>
          
          <!-- Stars -->
          <text x="${hexCenterX}" y="${hexCenterY + 25}" font-family="Arial, sans-serif" font-size="10" text-anchor="middle" fill="#000000">${"★".repeat(badge.stars)}</text>
        </g>
      `;

    badgesSVG += badgeSVG;

    // Update positions
    xOffset += badgeSize + badgeGap;

    // Wrap to the next row if needed
    if ((i + 1) % badgesPerRow === 0) {
      xOffset = 20;
      yOffset += badgeSize + badgeGap; // Move to next row
    }
  }

  // Shadow effect for badges
  const svgFooter = `
      <filter id="shhttps://hacker-rank-stats-card.vercel.app/generate-card?username=samba9274adow" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow dx="2" dy="2" stdDeviation="3" flood-color="#333" />
      </filter>
      </svg>
    `;

  return svgHeader + logoSVG + userInfo + badgesSVG + svgFooter;
}


