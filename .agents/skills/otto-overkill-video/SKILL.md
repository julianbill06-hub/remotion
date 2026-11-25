---
name: otto-overkill-video
description: Produce a new English TikTok/Reels/Shorts episode of "Otto Overkill" — a toy-like 3D character (Otto, orange hoodie, yellow hard hat, ginger mustache) solving everyday problems with absurdly over-engineered fixes. Built in code with the HyperFrames plugin (HTML + Three.js → MP4), narrator voice (ElevenLabs or Edge TTS) and one-word pop captions. Use for "new Otto episode", "neues Overkill-Video", "unnecessary engineering video", or any video in this niche.
---

# Otto Overkill — episode skill

Series format modelled on the "unnecessary engineering" niche (see `references/STYLE-ANALYSIS.md`,
the frame-by-frame study of the reference videos). Videos are always **English**, even when the user
writes German. Talk to the user in German.

Do **not** copy the reference creator's character, titles or exact gags. Every episode stars Otto
and has its own problem and its own overkill solution.

## Otto (the bible)

- Chunky toy proportions: big round head, rounded torso, capsule limbs, white sneakers.
- Orange hoodie (`#ff7a2e`) with white drawstrings and kangaroo pocket, navy pants, ginger hair,
  **ginger handlebar mustache**, big glossy cartoon eyes with lids and thick brows.
- **Yellow hard hat** = "engineering mode". He puts it on (drop + squash + clunk) the moment he
  decides to over-engineer. That beat is in every episode ("…Not Otto.").
- Never speaks. Acts with brows, lids, pupils, mouth and squash. Ends every episode smug.
- Built by `makeOtto()` / `pose()` in `template/assets/otto-kit.js`. Reuse it; don't redesign him.

## Mia (Otto's girlfriend, recurring)

Same toy build without mustache and hat: teal hoodie (`#43b9a8`), purple pants, dark-brown hair with
ponytail and pink scrunchie, eyelashes. `makeOtto({ pal: {...}, mustache: false, hat: false,
longHair: true, lashes: true })` — exact values in `episodes/ep02/ep02.js`. She is the "unnecessarily
mad" counterpart: arms crossed, angry brows, steam puffs. Never mean-spirited; the joke is on Otto.

## Topics people relate to

Pick everyday frustrations with a clear "normal fix" (the user wants relatable stories, e.g. the
girlfriend getting unnecessarily mad). Don't reuse the reference account's own gags (drunk-texting
the ex, the spider, glasses). Ideas, unused unless listed in `episodes/`:

- ✔ Ep 1 — phone at 1 %, charger across the room.
- ✔ Ep 2 — girlfriend "isn't hungry", then eats your fries (Mia).
- ✔ Ep 3 — "Where do you want to eat?" — "Anything." — says no to everything (restaurant wheel, 47 spins, 2 a.m. pizza).
- She asks "Do I look fat in this?" (Otto builds a 47-compliment answering robot; it says the wrong one).
- She steals the blanket every night (blanket on a winch / bolted to the bed).
- Group chat left on read; she sees "typing…" for 5 minutes (Otto builds a message-approval committee).
- Alarm clock: snooze nine times (Otto's alarm fires him out of bed with a catapult).
- Roommate eats your yogurt (labelled yogurt in a safe with fingerprint scanner).
- Socks always lose their partner (sock-tracking GPS system).
- Wi-Fi dead in one corner of the flat (40 m of router cable through the whole house).
- Can't open the pickle jar (hydraulic press).
- Forgot her birthday; reminder system with 600 alarms.

## Episode formula (20–30 s)

1. **Hook (0–3 s)** — 2nd-person problem, visible at frame 0. "You're in bed. Your phone is at one percent."
2. **Normal fix (≈ 2 s)** — "Normal people would just …" (show it's trivial).
3. **Turn (≈ 1 s)** — "Not Otto." Hard hat on.
4. **Overkill build (4–6 s)** — concrete numbers ("seven chargers", "twelve meter cable"); pops per part.
5. **It works (2–3 s)** — tiny result ("Two percent.").
6. **Collateral damage (3–4 s)** — huge side effect ("the whole street? Lights out."); music hard-stops.
7. **Button (2–3 s)** — deadpan line ("Totally worth it."), smug hold, natural loop.

Write narration as timed lines `[[start, "text"], …]` with 0.3–1.0 s gaps where visual gags land.

## Production (HyperFrames plugin)

The HyperFrames skills (`hyperframes`, `hyperframes-cli`, `media-use`, `hyperframes-registry`) are
installed in `.claude/skills/`. Run the CLI as
`node <repo>/.claude/skills/hyperframes/scripts/plugin-cli.mjs <command>` from the episode folder.
Read `hyperframes/SKILL.md` contract once per session (paused timelines, deterministic `hf-seek`).

1. **Project**: `cp -r template <name>`; `npm i three gsap` somewhere temporary and copy
   `three/build/three.module.min.js` and `gsap/dist/gsap.min.js` into `<name>/assets/lib/`
   (no CDN at render time).
2. **Script** → `lines.json`. Get the user's OK on the premise only if they asked to choose; otherwise go.
3. **Voice**: `python3 tools/voice.py lines.json assets/ --length <sec>` → `assets/voice.wav` +
   `assets/words.json`. ElevenLabs when a key is available (ask once with the credential form for
   `api.elevenlabs.io`, header `xi-api-key`); otherwise Edge TTS `en-US-AndrewNeural` (+6 %).
4. **Sound**: `python3 tools/sfx.py assets/sfx` (pop, plug, whoosh, zap, ding, powerdown, clunk,
   crickets, boing) and `python3 tools/music.py assets/music.wav <len> <hardStopSec>`; a second short
   loop for the button line. Place every SFX in `episode.json` → `audio` on a visible action.
5. **Scene**: write `assets/epNN.js` (see `episodes/ep01/ep01.js` as the worked example): sets
   built from primitives, Otto posed per shot, one `render(t)` with a shot table and `cam()` moves,
   `window.addEventListener("hf-seek", e => render(e.detail.time))`. Pure function of `t` only:
   seeded `hash()`, no `Math.random`, no clocks.
6. **Index**: fill `episode.json` (duration, scene file, highlight words, audio), then
   `python3 tools/build_index.py` → `index.html` (canvas + one-word caption clips + audio mix).
7. **Look**: `lint`, then `snapshot --at <one time per shot>` and read the contact sheet. Fix:
   faces cropped by the frame, the subject hidden behind Otto, screens upside down (set `camera.up`),
   caption covering the key object. Repeat until every shot reads in one second.
8. **Gate**: `check` → 0 errors; `outside_safe_zone` on captions must be fixed (long words shrink
   automatically in `build_index.py`).
9. **Render**: `render --quality looks -o renders/<name>.mp4` (~7 min for 23 s on software GL; run
   in the background). Verify with `ffprobe` (1080×1920, duration) and a 1.5 fps contact sheet.

## Look rules (from the reference study)

Bright soft toy-diorama light, pastel saturated sets, matte plastic materials, hero centred with the
face in the upper third, captions lower-middle (top ≈ 1010 px), hard cuts every 1–2.5 s, slow
push-ins, one whip-pan max, shake + flash only on impacts, faces do the comedy. Details and numbers:
`references/STYLE-ANALYSIS.md`.

## Delivery

Give the user the MP4 path, the narration text, and the TikTok caption plus YouTube Shorts title and
description written by the rules in `references/POSTING.md` (examples for every episode there; add
the new episode's copy to that file). Say which voice was used.
