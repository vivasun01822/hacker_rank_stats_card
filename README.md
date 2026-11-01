# HackerRank Stats Card

Show your HackerRank badges on your GitHub profile. Enter a username, get a card, paste one line into your README.

![HackerRank stats card example](https://hacker-rank-stats-card.vercel.app/generate-card?username=samba9274)

Live site: https://hacker-rank-stats-card.vercel.app

## Add a card to your GitHub profile

1. Open the site and enter your HackerRank username. You can also paste your profile link.
2. Check the preview, then press **Copy Markdown**.
3. Paste it into your profile `README.md` on GitHub and commit.

Prefer to write it yourself? Replace `YOUR_USERNAME` with your HackerRank username:

```markdown
[![HackerRank stats](https://hacker-rank-stats-card.vercel.app/generate-card?username=YOUR_USERNAME)](https://www.hackerrank.com/profile/YOUR_USERNAME)
```

Or in HTML:

```html
<a href="https://www.hackerrank.com/profile/YOUR_USERNAME"><img src="https://hacker-rank-stats-card.vercel.app/generate-card?username=YOUR_USERNAME" alt="HackerRank stats" width="600"></a>
```

## What the card shows

- Your name and username, with your total badges and stars.
- One hexagon per badge, with its stars and title. The metal shows how far you got: **gold** for 5 or more stars, **silver** for 3 to 4, **bronze** for 1 to 2.
- The card works on light and dark GitHub themes.

## Troubleshooting

| What you see | What to do |
| --- | --- |
| "No HackerRank profile found" | Use the name from your profile link, `hackerrank.com/profile/<name>`. Check the spelling. |
| "Usernames can only contain letters, numbers, dots, hyphens and underscores" | Remove spaces and special characters from the username. |
| "HackerRank didn't respond" | HackerRank is slow or down. Try again in a minute. |
| A broken image in your README | The username in the link is probably misspelled. Open the link in a browser to see the message. |
| New badges don't show up | Cards are cached for 4 hours. Wait and refresh. |
| The card has no badges | Your HackerRank profile must be public, and you need at least one badge. |

## Run it on your computer

You need [Node.js](https://nodejs.org) 18 or newer (CI uses 22).

```bash
npm ci
npm start      # http://localhost:3000
npm test       # unit tests
```

The server listens on port 3000.

## API

`GET /generate-card?username=<name>`

| Status | Response |
| --- | --- |
| 200 | The card as `image/svg+xml`, cached for 4 hours |
| 400 | JSON `{ "success": false, "message": "..." }`: username missing or has invalid characters |
| 404 | JSON message: no HackerRank profile with that name |
| 502 | JSON message: HackerRank did not respond |

## Project layout

| Path | What it does |
| --- | --- |
| `public/index.html` | The page: form, live preview, copy buttons |
| `api/app.js` | Express server and routes |
| `api/fetchData.js` | Validates the username, reads the HackerRank profile and badge icons |
| `api/card.js` | Draws the SVG card |
| `api/card.test.js` | Unit tests (`node:test`) |
| `.github/workflows/ci.yml` | Checks every pull request into `main` |
| `vercel.json` | Vercel deployment config |

## Contributing

1. Branch from `develop` and make your change.
2. Run `npm test` and start the app to try it.
3. Open a pull request into `main`. The `ci` check installs, tests and starts the app, and it must pass before merging.

## Good to know

This project reads HackerRank's public profile pages. It is unofficial and not affiliated with HackerRank, so a change on their side can break it.

Made by [MD. Shariar Hossain Sun](https://github.com/sun01822). Open source and free to use.
