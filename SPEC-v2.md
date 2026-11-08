# Duck Pond Defense v2: content pack

Build this on top of the current game. Keep everything that works today (look, sound,
upgrades, icons). New art is already in `assets/`.

## 1. Balance and stats

- Laser Duck stays as strong as it is but costs **1100** (was 600). It's the premium duck
  you save up for.
- Bread Bomber attacks a bit faster: cooldown 1.55 s → **1.25 s**.
- Every duck card and the selected-duck box show four stat bars, scaled against the
  strongest duck: **Pops/sec** (balloons popped per second against one goose),
  **Pierce** (geese per shot), **Range** and **Speed** (shots per second). Under the bars,
  small badges for specials: "Sees ghosts", "Pops foil", "Slows", "Splash", "Makes crumbs",
  "Buffs ducks".
- Hovering an upgrade previews its change on the bars, e.g. "Pops/sec 3.3 → 3.8".

## 2. Maps and difficulty

After the title screen, a **map select** screen: four map cards (thumbnail, name, best
round reached), then a difficulty choice:

| Difficulty | Rounds | Lives | Start crumbs | Duck prices |
|---|---|---|---|---|
| Easy | 40 | 150 | 650 | ×0.85 |
| Medium | 80 | 100 | 650 | ×1 |
| Hard | 120 | 1 | 650 | ×1.1 |

Save the best round per map and difficulty in localStorage.

All map images are 1536×1024 and scale exactly like `map.png`. Tracks are polylines in
map pixels. Draw a faint debug overlay of the track while developing, check that geese walk
on the drawn path, and adjust points if needed.

**Pond Park**: `assets/map.png`, the current track.

**Bathtub Bay**: `assets/maps/map-bathtub.png`. The tub is the "pond" (no placing on it).
```
[[-40,285],[150,290],[205,340],[205,480],[195,600],[220,700],[290,780],[390,800],
 [480,760],[500,680],[475,580],[470,460],[500,350],[570,270],[700,240],[820,240],
 [950,265],[1050,330],[1100,440],[1110,580],[1140,680],[1220,710],[1300,690],
 [1355,600],[1360,460],[1390,370],[1450,355],[1576,355]]
```

**Fountain Plaza**: `assets/maps/map-plaza.png`. The fountain and buildings are not placeable.
```
[[-40,315],[150,320],[240,370],[270,460],[280,580],[330,680],[410,710],[500,680],
 [545,580],[560,420],[600,250],[680,150],[800,135],[920,160],[1000,240],[1050,370],
 [1100,500],[1170,570],[1260,570],[1360,520],[1450,495],[1576,495]]
```

**Frozen Lake**: `assets/maps/map-frozen.png`. Geese walk the upper icy trail; the frozen
lake and the lower trail are scenery (no placing on the lake). Geese on ice slide: 10% faster.
```
[[-40,470],[150,490],[250,550],[330,560],[375,500],[355,420],[305,330],[310,210],
 [400,130],[530,125],[620,175],[690,240],[800,280],[900,235],[1000,175],[1140,170],
 [1250,235],[1295,345],[1250,465],[1170,555],[1160,650],[1230,725],[1400,755],[1576,740]]
```

## 3. New geese

| Goose | Sprite | Balloons | Speed | First round | Notes |
|---|---|---|---|---|---|
| Skater Goose | goose-skater | 2 | very fast | 15 | |
| Mother Goose | goose-mother | 4 | slow | 25 | every 3 s lays an egg on the track that hatches a Little goose (max 4 per Mother) |
| Rainbow Goose | goose-rainbow | 8 | medium | 35 | draw all 8 balloons; each pop removes one color |
| **Goose Galleon** | goose-galleon | 400 | crawling | 80, 100, 120 | the huge boss ship, about 260 px wide; big health bar at the top of the screen; when it pops, 3 Goose Balloon Bosses drop out at its spot |

The Goose Balloon Boss now also appears on rounds 50, 60 and 70. After round 40, every
round adds a few more geese and 1% speed so rounds 41–120 keep getting harder. Show a
"Galleon incoming!" warning banner one round before each Galleon.

## 4. New ducks

The panel grows to six cards (3 rows × 2). Keep it fitting the panel at 1440×900.

### Baker Duck: `duck-baker.png`, cost 550

Doesn't attack. During a round it bakes a loaf (`crumb-loaf.png`) every 6 s worth 15 crumbs.
The loaf hops out and lands next to the Baker; click it to collect (a little "+15" pop and
crumb sound). Uncollected loaves are collected automatically when the round ends.

- **Bigger Oven** (`skills/baker-bigger-oven.png`): +5 crumbs per loaf per tier.
- **Crumb Cart** (`skills/baker-crumb-cart.png`): tier 1 auto-collects loaves; each tier after
  adds +10% to everything collected.
- **Bakery Chain** (`skills/baker-bakery-chain.png`): bakes 12% faster per tier; tier 5 also pays
  +100 crumbs at the end of each round.

### Duck House: `duck-house.png`, cost 800

Doesn't attack. Ducks within 140 px fire 15% faster and get +10% range (show the aura as a soft
warm circle and a tiny house badge on buffed ducks).

- **Drills** (`skills/house-drills.png`): +6% attack speed to the aura per tier.
- **Lookout** (`skills/house-lookout.png`): +12 aura radius per tier; from tier 2, ducks in the
  aura can see Ghost Geese.
- **Supplies** (`skills/house-supplies.png`): ducks and upgrades bought inside the aura cost 5%
  less per tier; from tier 3, ducks in the aura can pop foil.

Same upgrade rules as the other ducks (one path past tier 2, one other path at most to 2).
