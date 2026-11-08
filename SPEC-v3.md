# Duck Duck Shoot: rename and new start screen

## Rename

The game is now called **Duck Duck Shoot**: page title, title screen, HUD, win/lose
screens, anywhere "Duck Pond Defense" appears. Keep saved best scores working.

## Start screen

Make it feel like a real game's front door:

- **Background:** the Pond Park map, slightly blurred and darkened at the edges, drifting
  very slowly. A few geese with balloons waddle along the track behind everything, and the
  ducks bob gently. Purely decorative: nothing can be clicked there.
- **Logo:** `assets/logo.png` (transparent PNG, 1200×760), big and centered in the upper
  half, about 620 px wide at 1440×900. It drops in with a little bounce on load and then
  floats gently up and down.
- **Difficulty buttons,** in a row under the logo, each a chunky rounded button in the same
  outlined game style as Start Round (thick dark outline, bottom shadow that presses down
  on click, lift on hover):

| Button | Color | Subtitle | Rounds | Lives | Duck prices | Extra |
|---|---|---|---|---|---|---|
| Easy | green | 40 rounds · 150 lives | 40 | 150 | ×0.85 | |
| Medium | yellow | 80 rounds · 100 lives | 80 | 100 | ×1 | |
| Hard | orange | 120 rounds · 50 lives | 120 | 50 | ×1.1 | |
| **XTRA HARD** | red, slightly bigger, with a pulsing glow | 120 rounds · 1 life | 120 | 1 | ×1.25 | geese 20% faster, every goose carries 1 extra balloon, a Goose Galleon also on round 60 |

- Picking a difficulty goes to the map select (the four map cards), where each card shows
  the best round reached on that difficulty. A Back button returns to the start screen.
- Bottom of the start screen: a sound on/off toggle at the left and small text at the
  right: "Made with Freebuff".
- Show the chosen difficulty as a small colored tag next to the round counter in the HUD.
