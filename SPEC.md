# Duck Pond Defense

A browser tower defense game. Rubber-ducky heroes protect their pond from geese who are
trying to carry balloons past it. Nobody gets hurt: ducks pop balloons, and a goose with
no balloons left honks and flaps away.

`design-reference.png` is the target look for the game screen. Match it.

## Tech

- Plain `index.html` + `style.css` + `game.js`, HTML5 canvas, no build step, no frameworks.
  Opening `index.html` (or `npx serve .`) must run the game.
- Font: Lilita One from Google Fonts, white with a thick dark outline for all HUD text.
- Art is in `assets/` (transparent PNGs, about 256px):
  - `map.png` (1536×1024), the background
  - ducks: `duck-quack.png`, `duck-bread.png`, `duck-frost.png`, `duck-laser.png`
  - geese: `goose-small.png`, `goose.png`, `goose-honker.png`, `goose-ghost.png`, `goose-boss.png`

## Layout (1440×900, scale to fit the window)

- Map fills the left 1350×900 (the map image scaled by 1350/1536). The right 270px is a
  brown side panel drawn over the map's right edge, exactly like the design reference.
- Top-left of the map: `Round 7 / 40` in big outlined text.
- Side panel, top to bottom: lives (heart) and crumbs (croissant) in a dark box; "Ducks"
  label; a 2×2 grid of duck cards (sprite, name, price); the selected duck's upgrade box
  (three paths, five pips each, price of the next tier); a big green "Start Round" button;
  a small 1×/2× speed toggle.

## The track

Geese walk this polyline, in `map.png` pixel coordinates (multiply by 1350/1536 for screen):

```
[[-40,225],[150,225],[195,245],[212,320],[212,500],[235,575],[295,622],[370,642],
 [420,675],[440,750],[465,830],[530,868],[610,870],[670,848],[692,790],[690,730],
 [660,650],[590,575],[515,505],[488,420],[505,330],[565,255],[650,225],[730,222],
 [810,220],[890,185],[960,145],[1040,135],[1125,160],[1185,230],[1205,330],
 [1212,430],[1255,500],[1340,525],[1440,520],[1576,518]]
```

Ducks can't be placed within 45 screen px of the track, on the pond, or on top of another
duck. While placing, show the duck under the cursor with its range circle (white, see-through),
tinted red where placement is invalid.

## Geese (enemies)

Each balloon a goose carries is one layer. A hit pops one balloon (+1 crumb). Fewer
balloons means a lighter goose: it walks faster. When the last balloon pops, the goose
honks (a little "HONK!" pop-up) and flies off the top of the screen. If a goose reaches
the end with balloons left, you lose that many lives.

| Goose | Sprite | Balloons | Speed | Notes |
|---|---|---|---|---|
| Little goose | goose-small | 1 | fast | |
| Goose | goose | 3 | medium | |
| Honker | goose-honker | 2 foil | slow | foil balloons only pop from Bread Bomber splash or Laser Duck |
| Ghost Goose | goose-ghost | 2 | medium | hidden: only Laser Duck (or Ghost Vision upgrades) can target it |
| Goose Balloon Boss | goose-boss | 40 | very slow | when beaten, releases 6 Geese at its spot |

Draw the balloons above each goose as small colored circles with strings so the count is
readable at a glance. Sprites are about 56 px tall on screen, the boss about 120 px.

## Ducks (towers)

| Duck | Sprite | Cost | Range | Attack |
|---|---|---|---|---|
| Quack Blaster | duck-quack | 200 | 120 | sonic ring that pops up to 3 balloons in a line, fast |
| Bread Bomber | duck-bread | 450 | 150 | lobbed baguette, splash pops 1 balloon on every goose within 50 px |
| Frost Duck | duck-frost | 300 | 110 | frost puff slows geese in range by 50% for 2 s, pops 1 balloon |
| Laser Duck | duck-laser | 600 | 220 | thin red beam, very fast, sees Ghost Geese, pops foil |

Ducks turn (flip) to face their target. Clicking a placed duck selects it: show its range
and its upgrades in the panel, plus a Sell button (70% back).

### Upgrades

Each duck has three paths with five tiers. Only one path can go past tier 2, and only one
other path can be upgraded at all (so a duck can be at most 5/2/0). Tier costs:
duck cost × 0.5, 1, 2, 4, 8. Make each path do something visible (range ring grows,
attack gets bigger or colored, sprite gets a small badge with the tier number).

- Quack Blaster: Louder (more pierce) · Rapid Quacks (fire rate) · Echo (rings bounce)
- Bread Bomber: Bigger Loaves (splash) · Sourdough Volley (fire rate) · Foil Cutter (pops foil, bonus vs Honker)
- Frost Duck: Deep Freeze (longer slow) · Blizzard (range) · Icicles (pops 2)
- Laser Duck: Wider Beam · Ghost Vision (nearby ducks see ghosts) · Overcharge (beam pierces 3)

## Rounds

40 rounds. Start with 650 crumbs and 100 lives. Round 1 is 10 Little geese; mix in Geese
from round 3, Honkers from 8, Ghost Geese from 12, and a Boss on rounds 20, 30 and 40.
Each round gives +100 crumbs when cleared. Start Round begins the next wave; nothing
spawns before that. Show "Round cleared!" and "Victory" / "The geese got through" screens.

## Feel

- Little juice everywhere: balloons pop with a tiny burst of confetti in the balloon's
  color, ducks squash a little when they fire, geese waddle (bob up and down).
- Cards in the panel lift on hover and grey out when you can't afford them.
- Title screen first: the map blurred behind, "Duck Pond Defense" in big outlined text,
  the four ducks on the left, the boss on the right, a Play button.
