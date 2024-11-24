const { createGithubCard } = require("./createdGithubCard");
const { fetchHackerrankData } = require("./fetchData");

(async () => {
  const username = "ShariarHossain"; // Replace with actual HackerRank username
  const logoPath = "assets/hackerrank.jpg";
  const outputFile = `output/${username}_hackerrank_card.png`;

  try {
    const userData = await fetchHackerrankData(username);
    await createGithubCard(userData, logoPath, outputFile);
  } catch (err) {
    console.error(`Error: ${err.message}`);
  }
})();
