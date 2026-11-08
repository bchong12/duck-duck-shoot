# Duck Duck Shoot

A rubber-ducky tower defense game. Geese waddle down the path holding balloons; place ducks with special powers to pop every balloon before the geese reach the end.

**Play it:** https://duckduckshoot.brandenchong.com

- 6 ducks (Quack Blaster, Bread Bomber, Frost Duck, Laser Duck, Baker Duck, Duck House), each with three upgrade paths
- 4 ponds: Pond Park, Bathtub Bay, Fountain Plaza, Frozen Lake
- 9 kinds of geese, from Little Goose to the Goose Galleon boss
- Easy, Medium, Hard and XTRA HARD (one life)

## How it was made

- Designed in [Purist](https://purist.design): every duck, goose, map and upgrade icon.
- Built with [Freebuff](https://freebuff.com), a free AI coding agent, from the specs in this repo (`SPEC.md`, `SPEC-v2.md`, `SPEC-v3.md`) and `design-reference.png`.

## Run it locally

It's plain HTML, CSS and JavaScript with no build step:

```bash
python3 -m http.server 8137
```

Then open http://localhost:8137.

## Files

- `index.html`, `style.css`, `game.js`: the whole game
- `assets/`: sprites, maps and upgrade icons
- `SPEC*.md`: the specs Freebuff built from

## License

MIT, see [LICENSE](LICENSE).
