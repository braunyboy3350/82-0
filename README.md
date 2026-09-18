# 82–0 Prime Year Edition

A browser basketball drafting game: build a five-player lineup, balance complementary roles, and chase an undefeated season.

**[Play the live game](https://82-0-prime.pages.dev/)**

## Modes

**Era Challenge** is the default. Pick a random era once, then draft all five players from its franchise pools. Each era emphasizes a different mix of scoring, defense, rebounding, and playmaking. Player cards show era fit and roles. The draft disables selections that would leave no legal way to finish all five positions.

**Classic** keeps the original 96 player-season entries, mixed-era draft, one era skip, one team skip, and original win-probability formula. New expansion pools only appear in Era Challenge.

The expansion adds nine player-season entries from the 2011–12 New Orleans Hornets and 2024–25 Utah Jazz, taking Era Challenge to **105 entries across 26 franchise/era pools**. These are featured historical seasons, not necessarily each player's career peak. Existing decade groupings include boundary seasons such as 1959–60.

## How team construction affects results

The original simulation treated every opponent alike and capped even a 100-rated team at a 94% per-game win probability. Era Challenge makes roster quality and opponent strength decisive.

- Base rating: 28% scoring, 27% defense, 22% rebounding, 23% playmaking.
- Era fit: average player rating using the selected era's displayed style.
- Team strength: 60% base rating + 40% era fit + role bonuses.
- Each completed role target adds two strength points: two scorers (SCR 80+), two stoppers (DEF 78+), one rebounder (REB 85+), one creator (PLY 85+). Players may fill multiple roles.
- Win probability: clamp((team strength − opponent strength + 12) / 24, 0, 1). A team at least 12 points stronger wins reliably; close matchups can swing either way.
- Every 82-game fantasy schedule cycles through shuffled opponent pools containing rebuilding teams, league opponents, and contenders. Opponent strength ratings are authored gameplay values, not historical statistical estimates.
- The draft shows projected wins once the lineup is complete. Results show the fit bonus, toughest opponents, and an expandable log of all 82 games.

This is deliberately a fantasy schedule across eras, not a reconstruction of an NBA season. Player and opponent ratings are game design values. The existing roster's historical claims have not received a full statistical audit.

## Run and test

No build step or dependencies are needed. Open `index.html`, or serve this directory:

```sh
python3 -m http.server 8765
```

With Node.js installed, run the deterministic regression and balance checks:

```sh
node test-game.cjs
```

The suite enumerates legal lineups in each era, simulates 7,000 seasons, exercises 1,400 random draft paths, checks era restrictions and duplicate prevention, verifies required weak opponents appear, and checks Classic scoring/odds compatibility.

In the seeded balance run, each era's highest-rated legal lineup went undefeated in 236–1,000 of 1,000 simulated seasons. These are best-lineup results, not the chances of drafting that lineup or the success rate of a typical run. Browser checks covered era selection, a five-player draft, simulation, results, replay, mode switching, and console errors.

## Deployment and rollback

Cloudflare Pages project `82-0-prime` automatically deploys the GitHub `main` branch to the live URL above. Publishing a tested commit on `main` updates the existing site.

The pre-expansion version is preserved on branch `archive/pre-era-challenge-2026-09-18` at commit `7bb82c6ea6261a1b82a0c3300926b1af5cda97a2`. Roll back through Cloudflare's deployment history or restore the previous index.html in a new commit; avoid rewriting Git history.

## Expansion data references

Season PPG/RPG/APG for added players were checked against:
- [2011–12 Hornets player statistics](https://www.landofbasketball.com/stats_by_team/2011_2012_hornets_rs.htm)
- [2024–25 Jazz roster and statistics](https://www.basketball-reference.com/teams/UTA/2025.html)
- [2024–25 Jazz season leaders](https://basketball.realgm.com/nba/teams/Utah-Jazz/29/Rosters/Current/2025)

Ratings, roles, position flexibility, and era weights are gameplay choices rather than official NBA metrics.
