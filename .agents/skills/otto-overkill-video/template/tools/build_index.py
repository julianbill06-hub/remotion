# Builds index.html: 3D stage canvas + one-word captions + audio mix.
import json, html, os, sys
P = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
cfg = json.load(open(os.path.join(P, "episode.json")))
words = json.load(open(os.path.join(P, "assets/words.json")))
DUR = cfg["duration"]
HL = set(w.upper() for w in cfg["highlight"])
spans = []; tws = []
for i, w in enumerate(words):
    txt = w["w"].strip(".,?!").upper()
    nxt = max(0.1, words[i+1]["s"] - 0.03) if i+1 < len(words) else DUR
    start = max(0.1, w["s"] - 0.03)
    end = min(nxt - 0.01, max(w["e"] + 0.25, start + 0.22)) if nxt - w["e"] < 0.6 else w["e"] + 0.3
    end = min(end, nxt - 0.01) if i+1 < len(words) else min(end, DUR)
    dur = round(end - start, 3)
    cls = "w hl" if txt.strip("'") in HL or txt in HL else "w"
    spans.append(f'<div id="cap{i}" class="clip capw" data-start="{start:.3f}" data-duration="{dur}" data-track-index="5"><span class="{cls}" id="capt{i}" style="font-size:{min(128, int(640/(0.8*max(1,len(txt)))))}px">{html.escape(txt)}</span></div>')
    tws.append(f'tl.fromTo("#capt{i}",{{scale:0.55,y:26}},{{scale:1,y:0,duration:0.13,ease:"back.out(3)"}},{start:.3f});')
audio = []
for i, a in enumerate(cfg["audio"]):
    attrs = f'id="{a["id"]}" class="clip" src="{a["src"]}" data-start="{a["start"]}" data-track-index="{a["lane"]}" data-volume="{a.get("vol",1)}"'
    import wave as _w
    _f=_w.open(os.path.join(P,a["src"])); flen=_f.getnframes()/_f.getframerate(); _f.close()
    d=min(a.get("dur",flen), flen, DUR-a["start"])
    attrs += f' data-duration="{d:.3f}"'
    if "fadeIn" in a: attrs += f' data-fade-in="{a["fadeIn"]}"'
    if "fadeOut" in a: attrs += f' data-fade-out="{a["fadeOut"]}"'
    audio.append(f"<audio {attrs}></audio>")
doc = f'''<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=1080, height=1920" />
<script src="assets/lib/gsap.min.js"></script>
<style>
  :root {{ --ink:#ffffff; --hl:{cfg["hlColor"]}; --stroke:#0d0b12; }}
  * {{ margin:0; padding:0; box-sizing:border-box; }}
  html, body {{ width:1080px; height:1920px; overflow:hidden; background:#cfbdea; }}
  #root {{ position:relative; width:1080px; height:1920px; overflow:hidden; }}
  #stage {{ position:absolute; left:0; top:0; width:1080px; height:1920px; }}
  #caps {{ position:absolute; left:0; top:0; width:1080px; height:1920px; pointer-events:none; z-index:10; }}
  .capw {{ position:absolute; left:0; width:1080px; top:1010px; text-align:center; overflow:visible; }}
  .w {{ display:inline-block; font-family:"Archivo Black", sans-serif; font-size:128px; line-height:1; letter-spacing:-1px;
        color:var(--ink); -webkit-text-stroke:14px var(--stroke); paint-order:stroke fill;
        text-shadow:0 10px 0 rgba(0,0,0,0.35); transform-origin:50% 60%; }}
  .w.hl {{ color:var(--hl); }}
</style>
</head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-duration="{DUR}" data-width="1080" data-height="1920">
  <canvas id="stage" class="clip" data-start="0" data-duration="{DUR}" data-track-index="0" width="1080" height="1920"></canvas>
  <div id="caps" data-track-kind="captions">
    {chr(10).join("    "+s for s in spans)}
  </div>
  {chr(10).join("  "+a for a in audio)}
</div>
<script>
  const tl = gsap.timeline({{ paused: true }});
  {chr(10).join("  "+t for t in tws)}
  window.__timelines["main"] = tl;
</script>
<script type="module" src="assets/{cfg["scene"]}"></script>
</body>
</html>
'''
open(os.path.join(P, "index.html"), "w").write(doc)
print("ok", len(words), "words")
