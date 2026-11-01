const express = require("express");
const path = require("path");
const fs = require("fs");
const { fetchHackerrankData } = require("../api/fetchData");
const { generateCardSVG } = require("../api/card");
const { resolveTheme } = require("../api/themes");
const cors = require("cors");

const app = express();

// Middleware to parse form data (urlencoded data)
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Middleware to parse JSON data
app.use(express.json());


// Route: Home Page
app.get("/", (_, res) => {
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
  const { username } = req.query;

  if (!username) {
    return res.status(400).json({ success: false, message: "Enter a HackerRank username." });
  }

  try {
    const theme = resolveTheme(req.query); // cheap, so bad themes fail before HackerRank is called
    const userData = await fetchHackerrankData(username);

    res.setHeader("Content-Type", "image/svg+xml");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cache-Control", "public, max-age=14400");
    res.send(generateCardSVG(userData, theme));
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ success: false, message: err.message });
    }
    console.error(`Error: ${err.message}`);
    res.status(500).json({ success: false, message: "Couldn't generate the card. Try again in a minute." });
  }
});

// Catch-All: Handle Undefined Routes
app.use((_, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
