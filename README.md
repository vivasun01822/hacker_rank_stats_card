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
- The card has its own background, so it reads on both light and dark GitHub pages.

## Themes

Pick a theme on the site and the copied code already includes it. To add one by hand, put `&theme=` after the username:

| Theme | Look | Add to the link |
| --- | --- | --- |
| Classic (default) | Dark green card | nothing |
| Dark | Neutral dark card | `&theme=dark` |
| Light | White card with a thin hexagon outline | `&theme=light` |
| Custom | Your own colours | `&theme=custom&bg=…&text=…&accent=…&border=…` |

Custom colours are hex codes with 3 or 6 digits and **no `#`**: `bg` is the background, `text` the main text, `accent` the badge and star totals line, and `border` the card outline. Leave one out and a matching default is used. A softer text colour for your username is worked out for you.

```markdown
![HackerRank stats](https://hacker-rank-stats-card.vercel.app/generate-card?username=YOUR_USERNAME&theme=custom&bg=0b1020&text=e6edf3&accent=ffd166&border=5b6ee1)
```

Keep text and accent at least 4.5:1 against the background so the card stays readable. The site warns you when a custom pair is too low. Badge metals (gold, silver, bronze) look the same in every theme.

## Troubleshooting

| What you see | What to do |
| --- | --- |
| "No HackerRank profile found" | Use the name from your profile link, `hackerrank.com/profile/<name>`. Check the spelling. |
| "Usernames can only contain letters, numbers, dots, hyphens and underscores" | Remove spaces and special characters from the username. |
| "Theme must be classic, dark, light or custom" | Check the spelling after `&theme=`. |
| "bg must be a hex colour…" (or `text`, `accent`, `border`) | Use 3 or 6 hex digits without `#`, like `0d1117`. |
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

`GET /generate-card?username=<name>[&theme=classic|dark|light|custom][&bg=&text=&accent=&border=]`

Colour parameters are only used when `theme=custom`.

| Status | Response |
| --- | --- |
| 200 | The card as `image/svg+xml`, cached for 4 hours |
| 400 | JSON `{ "success": false, "message": "..." }`: username missing or invalid, unknown theme, or a bad colour |
| 404 | JSON message: no HackerRank profile with that name |
| 502 | JSON message: HackerRank did not respond |

## Project layout

| Path | What it does |
| --- | --- |
| `public/index.html` | The page: form, live preview, copy buttons |
| `api/app.js` | Express server and routes |
| `api/fetchData.js` | Validates the username, reads the HackerRank profile and badge icons |
| `api/card.js` | Draws the SVG card |
| `api/themes.js` | Theme colours, custom colour checks and contrast helper |
| `api/*.test.js` | Unit tests (`node:test`) |
| `.github/workflows/ci.yml` | Checks every pull request into `main` |
| `vercel.json` | Vercel deployment config |

## Contributing

1. Branch from `develop` and make your change.
2. Run `npm test` and start the app to try it.
3. Open a pull request into `main`. The `ci` check installs, tests and starts the app, and it must pass before merging.

## Good to know

This project reads HackerRank's public profile pages. It is unofficial and not affiliated with HackerRank, so a change on their side can break it.

Made by [MD. Shariar Hossain Sun](https://github.com/sun01822). Open source and free to use.
