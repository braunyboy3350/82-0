# 82–0 Prime Year Edition

A browser basketball drafting game: build a five-player lineup, balance complementary roles, and chase an undefeated season.

**[Play the live game](https://82-0-prime.pages.dev/)**

## Modes

**Era Challenge** is the default. Pick a random playstyle era once, then draft from all 30 franchises and every featured season. The rolled era changes ratings and role targets; it never filters out teams. Each era emphasizes a different mix of scoring, defense, rebounding, and playmaking. Player cards show era fit and roles. The draft disables selections that would leave no legal way to finish all five positions.

**Classic** keeps the original 96 player-season entries, mixed-era draft, one era skip, one team skip, and original win-probability formula. New expansion pools only appear in Era Challenge.

Era Challenge includes **215 player-season entries across 48 team pools representing all 30 current NBA franchises**, with new pools in every decade from the 1960s through the 2020s. Each spin gives eligible franchises equal weight, then chooses one of that franchise's season pools. This avoids favoring franchises just because they have more featured seasons. A team skip selects another franchise across all player eras.

Cincinnati Royals count toward the Kings franchise; the 2011–12 New Orleans Hornets count toward the Pelicans, separately from Charlotte. Featured historical seasons are not necessarily a player's career peak. Existing decade groupings include boundary seasons such as 1959–60.

## How team construction affects results

The original simulation treated every opponent alike and capped even a 100-rated team at a 94% per-game win probability. Era Challenge makes roster quality and opponent strength decisive.

- Base rating: 28% scoring, 27% defense, 22% rebounding, 23% playmaking.
- Era fit: average player rating using the selected era's displayed style.
- Team strength: 60% base rating + 40% era fit + role bonuses.
- Each completed role target adds two strength points. Thresholds are SCR 80+ for scorers, DEF 78+ for stoppers, REB 85+ for rebounders, and PLY 85+ for creators. Players may fill multiple roles.
- Targets (scorers / stoppers / rebounders / creators): 1960s 1/2/2/1; 1970s 2/1/2/1; 1980s 2/1/1/2; 1990s 2/3/1/1; 2000s 2/2/1/1; 2010s 2/1/1/2; 2020s 2/2/1/2.
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

The suite searches legal lineups among the seven highest independently rated candidates per position, simulates 7,000 elite-lineup seasons, exercises 1,400 random draft paths, checks all 30 franchises remain available in all seven playstyle eras, validates roster data and duplicate/position rules, and checks Classic scoring/odds compatibility.

Each era's best tested lineup went 82–0 in all 1,000 seeded seasons. These are elite-lineup results, not the chances of drafting that lineup or a typical run's success rate. Dominant lineups win reliably; the challenge is assembling them from the expanded pool. The test harness is dependency-free and can also run in a JavaScript runtime with a document initialization stub.

## Deployment and rollback

Cloudflare Pages project `82-0-prime` automatically deploys the GitHub `main` branch to the live URL above. Publishing a tested commit on `main` updates the existing site.

The pre-expansion version is preserved on branch `archive/pre-era-challenge-2026-09-18` at commit `7bb82c6ea6261a1b82a0c3300926b1af5cda97a2`. Roll back through Cloudflare's deployment history or restore the previous index.html in a new commit; avoid rewriting Git history.

## Reference game comparison

The official [82-0 rules](https://www.82-0.com/how-to-play) describe seven decades (1960s–2020s), a team/decade slot machine, and decade-average statistics. Prime retains its own featured-season ratings, position rules, and simulation. The original site's public rules and observed draft UI did not expose a complete team count; this release covers all 30 current NBA franchises without claiming an independently verified exact pool match.

## Expansion data references

See [ROSTER_SOURCES.md](ROSTER_SOURCES.md) for the 22 additional team-pool sources. Initial rebuilding-team sources:
- [2011–12 Hornets player statistics](https://www.landofbasketball.com/stats_by_team/2011_2012_hornets_rs.htm)
- [2024–25 Jazz roster and statistics](https://www.basketball-reference.com/teams/UTA/2025.html)
- [2024–25 Jazz season leaders](https://basketball.realgm.com/nba/teams/Utah-Jazz/29/Rosters/Current/2025)

Ratings, roles, position flexibility, and era weights are gameplay choices rather than official NBA metrics.
