# Videos: always use the Lemo-Opuscar skill

For **every new video** (Video, Film, Short, Reel, TikTok, Explainer, Animation, Werbespot, neue Folge …)
use the `lemo-opuscar` skill (`.claude/skills/lemo-opuscar/SKILL.md`) and follow its library
(`$LIB/AGENTS.md`, `DIRECTOR.md`, `TECHNIQUE.md`, the chosen `styles/<slug>/STYLE.md`).

- No style named? Suggest 2–3 fitting styles from the library and link the gallery:
  https://lemomo-ai.github.io/lemo-opuscar/
- When a series skill is also requested (e.g. a TikTok series episode), that skill decides story,
  format, length and series rules; pick the Opuscar style that fits the series look and produce the
  film with the Opuscar workflow.
- Talk to the user in German unless they write in another language.
- Vertical platforms (TikTok, Reels, Shorts): render 1080×1920 unless the user asks otherwise.
- Not for plain editing, trimming or converting existing video files.
