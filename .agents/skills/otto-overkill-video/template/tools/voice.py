"""Voiceover for an Otto Overkill episode.

Usage: python3 tools/voice.py lines.json assets/ [--provider auto|elevenlabs|edge] [--voice ID] [--length 23]

lines.json = [[start_seconds, "Line of narration."], ...]
Writes assets/voice.wav (all lines placed at their start times) and assets/words.json
([{"w","s","e","line"}] in absolute seconds) for the one-word captions.

Providers
- elevenlabs: used when ELEVENLABS_API_KEY is set (or a network secret for api.elevenlabs.io
  is saved on the cloud environment). Uses /with-timestamps for word timings.
- edge: Microsoft Edge neural voices via edge-tts (pip install edge-tts), word boundaries included.
  Default voice en-US-AndrewNeural at +6% rate (casual, deadpan narrator).
"""
import asyncio, base64, json, os, ssl, subprocess, sys, urllib.request

ELEVEN_DEFAULT = "pNInz6obpgDQGcFmaJgB"  # "Adam" - deep, casual male narrator
EDGE_DEFAULT = "en-US-AndrewNeural"


def ca_ctx():
    for p in ("/root/.ccr/ca-bundle.crt", os.environ.get("SSL_CERT_FILE", "")):
        if p and os.path.exists(p):
            return ssl.create_default_context(cafile=p)
    return ssl.create_default_context()


def eleven(text, voice, out):
    key = os.environ.get("ELEVENLABS_API_KEY", "proxy-injected")
    req = urllib.request.Request(
        f"https://api.elevenlabs.io/v1/text-to-speech/{voice}/with-timestamps",
        data=json.dumps({"text": text, "model_id": "eleven_multilingual_v2",
                         "voice_settings": {"stability": 0.45, "similarity_boost": 0.8, "style": 0.35}}).encode(),
        headers={"xi-api-key": key, "Content-Type": "application/json"})
    d = json.load(urllib.request.urlopen(req, context=ca_ctx(), timeout=120))
    open(out + ".mp3", "wb").write(base64.b64decode(d["audio_base64"]))
    a = d["alignment"]
    words, cur, s = [], "", None
    for ch, cs, ce in zip(a["characters"], a["character_start_times_seconds"], a["character_end_times_seconds"]):
        if ch.isspace():
            if cur:
                words.append({"w": cur, "s": s, "e": prev_e})
            cur, s = "", None
        else:
            if s is None:
                s = cs
            cur += ch
            prev_e = ce
    if cur:
        words.append({"w": cur, "s": s, "e": prev_e})
    return words


def edge(text, voice, out, rate="+6%"):
    import edge_tts, edge_tts.communicate as c
    c._SSL_CTX = ca_ctx()

    async def run():
        com = edge_tts.Communicate(text, voice, rate=rate, boundary="WordBoundary")
        words = []
        with open(out + ".mp3", "wb") as f:
            async for ch in com.stream():
                if ch["type"] == "audio":
                    f.write(ch["data"])
                elif ch["type"] == "WordBoundary":
                    words.append({"w": ch["text"], "s": ch["offset"] / 1e7, "e": (ch["offset"] + ch["duration"]) / 1e7})
        return words
    return asyncio.run(run())


def main():
    args = sys.argv[1:]
    lines = json.load(open(args[0]))
    outdir = args[1]
    opt = lambda k, d: args[args.index(k) + 1] if k in args else d
    provider = opt("--provider", "auto")
    length = float(opt("--length", "0"))
    if provider == "auto":
        provider = "elevenlabs" if os.environ.get("ELEVENLABS_API_KEY") else "edge"
    voice = opt("--voice", ELEVEN_DEFAULT if provider == "elevenlabs" else EDGE_DEFAULT)
    os.makedirs(os.path.join(outdir, "vo"), exist_ok=True)
    words, inputs, filt = [], [], []
    for i, (t, txt) in enumerate(lines):
        base = os.path.join(outdir, "vo", f"l{i}")
        ws = eleven(txt, voice, base) if provider == "elevenlabs" else edge(txt, voice, base)
        for w in ws:
            words.append({"w": w["w"], "s": round(w["s"] + t, 3), "e": round(w["e"] + t, 3), "line": i})
        inputs += ["-i", base + ".mp3"]
        ms = int(t * 1000)
        filt.append(f"[{i}:a]adelay={ms}|{ms}[a{i}]")
    mix = "".join(f"[a{i}]" for i in range(len(lines))) + f"amix=inputs={len(lines)}:normalize=0"
    if length:
        mix += f",apad=whole_dur={length}"
    filt.append(mix + "[o]")
    subprocess.run(["ffmpeg", "-v", "error", "-y", *inputs, "-filter_complex", ";".join(filt), "-map", "[o]",
                    "-ar", "48000", "-ac", "2", os.path.join(outdir, "voice.wav")], check=True)
    json.dump(words, open(os.path.join(outdir, "words.json"), "w"))
    print(f"{provider}: {len(words)} words; last ends at {words[-1]['e']:.2f}s")
    for w in words:
        print(f"{w['s']:6.2f}-{w['e']:6.2f} {w['w']}")


if __name__ == "__main__":
    main()
