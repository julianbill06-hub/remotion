# quirky pizzicato loop, 104 BPM, writes music.wav of given length
import numpy as np, wave, sys
SR=48000; out=sys.argv[1]; L=float(sys.argv[2]); cut=float(sys.argv[3]) if len(sys.argv)>3 else 1e9
bpm=104; beat=60/bpm; N=int(SR*L); mix=np.zeros(N)
def note(freq,start,dur,amp,kind="pluck"):
    s=int(start*SR); n=int(dur*SR); 
    if s>=N: return
    n=min(n,N-s); tt=np.arange(n)/SR
    if kind=="pluck": x=(np.sin(2*np.pi*freq*tt)+0.3*np.sin(4*np.pi*freq*tt))*np.exp(-tt*9)
    elif kind=="bass": x=np.sin(2*np.pi*freq*tt)*np.exp(-tt*4)*(1-np.exp(-tt*300))
    elif kind=="tick": x=np.random.default_rng(int(start*1000)).standard_normal(n)*np.exp(-tt*60)
    mix[s:s+n]+=amp*x
hz=lambda m:440*2**((m-69)/12)
mel=[72,None,76,79, 77,None,74,None, 72,74,76,None, 79,77,76,74]
bass=[48,55,53,55]
t=0;i=0
while t<L:
    bar=int(t/(beat*4))
    m=mel[i%16]
    if m: note(hz(m+(0 if bar%2==0 else -2)),t,0.4,0.18)
    if i%4==0: note(hz(bass[(i//4)%4]),t,beat*0.9,0.32,"bass")
    if i%2==1: note(0,t,0.05,0.05,"tick")
    t+=beat/2;i+=1
tt=np.arange(N)/SR
# hard stop at cut (power outage gag)
mix[int(cut*SR):]=0
mix/=np.max(np.abs(mix))+1e-9; mix*=0.8
s=(mix*32767).astype(np.int16); st=np.stack([s,s],1)
with wave.open(out,"wb") as w: w.setnchannels(2);w.setsampwidth(2);w.setframerate(SR);w.writeframes(st.tobytes())
