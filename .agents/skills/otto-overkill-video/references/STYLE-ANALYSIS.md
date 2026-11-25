# Reference analysis — the "unnecessary engineering" niche

Studied frame by frame from the creator walkthrough the user supplied (@ycmarlon, 44.6 s, 576×1024,
30 fps), which shows the reference account `unnecessary.engineering` ("fu*king problems", ~10.9k
followers, 91k likes), its profile grid and several of its clips ("Glasses" 1.7M, "spider" 227k,
"You're drunk as f*ck and want to text your ex", "walk you", "running from the car", "fog up the
second", "buckle in", "in the middle seat"). Whatever language a reference uses, ours are always
**English**.

What we take: the format, pacing, framing grammar and toy-3D look. What we never take: their
character (bald guy, blue T-shirt, jeans), their exact gags or their titles. Our hero is **Otto**.

## 1. Format and structure

| | Reference | Our rule |
|---|---|---|
| Aspect | 9:16 | 1080×1920, 30 fps |
| Length | ~15–30 s | 20–30 s (one gag, no padding) |
| Hook | frame 0 already shows the problem (character mid-situation, caption on screen within 0.3 s) | same: problem visible at frame 0, first caption ≤ 0.4 s |
| Beat | narrator states an everyday problem in 2nd person ("You're drunk and want to text your ex") → hero answers with an absurd over-engineered fix → it "works" with a ridiculous side effect → deadpan button line | Problem → "Normal people would… Not Otto." → overkill build → payoff + collateral damage → button line |
| Cuts | hard cuts every 1–2.5 s, no fancy transitions | hard cuts; one whip-pan allowed per film; camera shake only on impacts |
| Ending | holds on the hero's reaction, no outro card, loops naturally | smug hold 2–3 s, no logo, no "follow" card |

## 2. Narration and captions

- One deadpan male narrator, casual American, slightly fast (≈ 165–180 wpm), mild swearing censored
  in captions (`F*CK`). Pauses of 0.3–1.0 s land the visual gags.
- Captions: **one word at a time**, upper case, heavy geometric sans (Archivo Black-like), white fill
  with a thick black stroke and a hard drop shadow, centred a bit below the middle of the frame.
  Key words flip to **neon yellow-green** (`#e6ff3d`) — nouns of the problem, numbers, the punch word.
- Each word pops in (scale 0.55 → 1, ~0.13 s, back-out ease) exactly on its spoken start.
- Long words shrink, never wrap; everything stays inside the TikTok safe box (x 120–888, y 288–1248).

## 3. Lighting and shadows

- Soft, bright, mostly shadowless "toy diorama" light: big sky/hemisphere fill plus one warm key from
  above-front; soft contact shadows under feet and objects (PCF soft, radius ~4), never hard black.
- Interiors read as daytime-bright even when the story says night (night is told by a window/sky).
- Exteriors in bright daylight in the reference; for a night gag use a blue moon key, emissive
  windows and additive glow sprites, but keep faces readable.
- Special light only for story beats: phone glow (cool blue point light on the face), sparks (white-
  blue flash + flicker), blackout (everything to ~5 %, only the story light stays).

## 4. Materials, surfaces, detail

- Low-poly but smooth: rounded boxes, capsules, spheres; bevels visible on clothes.
- Matte plastic look: roughness 0.7–0.95, metalness 0; slight sheen (0.35–0.45) only on eyes,
  hard hat and phone. No PBR textures; patterns come from flat canvas textures (planks, stripes).
- Detail level: furniture and props are simple primitives with 1–3 parts; the hero and the gag prop
  get the most detail. Background clutter is sparse (negative space around the hero).

## 5. Colour and grade

- Saturated pastel palette, high brightness, low contrast, warm-neutral white balance.
- Walls lilac / mint / peach, floors warm wood, accent props in primary colours. Hero clothing must
  pop against every set (Otto's orange hoodie vs lilac/teal; yellow hard hat).
- Tone mapping that keeps hues (three.js `NeutralToneMapping`, exposure ≈ 1.05). No grain, no LUT.

## 6. Composition and camera

- Hero centred, usually framed head-to-knees or close-up; face in the upper third so the caption
  (lower-middle) never covers it.
- Foreground / midground / background: one foreground object (bed edge, prop) for depth, hero
  midground, wall with 1–2 props as background.
- Angles: slightly low medium shots for the hero, 3/4 high wides to explain space, top-down inserts
  for screens and objects, extreme close-ups for reactions.
- Moves: slow push-ins (3–8 % over the shot), gentle orbits (≤ 40°) on builds, one fast whip-pan
  to reveal distance, tracking shot along the gag object. Ease in/out cubic; no constant-speed moves.
- Lens: 38–52° vertical FOV; wider for room geography, tighter for faces.

## 7. Animation

- Poses snap with anticipation → action → overshoot/settle (spring); hold poses ≥ 0.3 s to read.
- Faces carry the comedy: brows (worried / determined), eyelids (smug half-closed), pupils (shrink on
  shock), mouth (smile ↔ "O"). Blinks every 2–4 s at seeded times.
- Physical gags: objects pop in with squash + spring; impacts get shake + flash + SFX; falling objects
  ease-in (gravity); the hero's whole body squashes on shocks.
- Motion blur is not used; speed is sold by easing and short durations (0.15–0.4 s).

## 8. Sound

- Light, bouncy, quirky music bed at −20 to −24 LUFS under the voice; music **hard-stops** for the
  big punchline beat (silence is a joke), returns softly for the button line.
- SFX on every visible action: pops, clicks, whooshes, zaps, dings, clunks, ambience (crickets).
