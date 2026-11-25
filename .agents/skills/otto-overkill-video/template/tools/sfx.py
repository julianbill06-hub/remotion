import numpy as np, wave, sys, os
SR=48000
out=sys.argv[1]; os.makedirs(out,exist_ok=True)
rng=np.random.default_rng(7)
def save(name,x):
    x=np.clip(x,-1,1); s=(x*32767).astype(np.int16)
    st=np.stack([s,s],1)
    with wave.open(f"{out}/{name}.wav","wb") as w:
        w.setnchannels(2);w.setsampwidth(2);w.setframerate(SR);w.writeframes(st.tobytes())
def t(d): return np.arange(int(SR*d))/SR
def env(n,a=0.005,r=0.1):
    e=np.ones(n);A=int(a*SR);e[:A]=np.linspace(0,1,A)
    tt=np.arange(n)/SR; return e*np.exp(-tt/r)
# pop / snap
d=t(0.18); f=900*np.exp(-d*25)+300
save("pop", 0.7*np.sin(2*np.pi*np.cumsum(f)/SR)*env(len(d),0.001,0.04) + 0.25*rng.standard_normal(len(d))*env(len(d),0.0005,0.008))
# click plug
d=t(0.25); save("plug", 0.8*rng.standard_normal(len(d))*env(len(d),0.0005,0.012)+0.5*np.sin(2*np.pi*140*d)*env(len(d),0.001,0.05))
# whoosh
d=t(0.6); n=rng.standard_normal(len(d)); 
from numpy.fft import rfft, irfft
sh=np.sin(np.pi*d/0.6)**2
# simple bandpass sweep via moving average differences
y=np.zeros_like(n); a=0
for i in range(len(n)):
    k=0.02+0.25*sh[i]; a+=k*(n[i]-a); y[i]=a
save("whoosh",0.9*y*sh/np.max(np.abs(y)))
# zap / spark
d=t(0.9); buzz=np.sign(np.sin(2*np.pi*(120+40*np.sin(2*np.pi*9*d))*d))*0.35
cr=rng.standard_normal(len(d))*(rng.random(len(d))<0.08)
save("zap",(buzz*0.6+cr*0.9)*env(len(d),0.002,0.35))
# ding (battery up)
d=t(1.0); save("ding",0.5*(np.sin(2*np.pi*1318*d)+0.5*np.sin(2*np.pi*1976*d))*env(len(d),0.002,0.3))
# power down: falling hum
d=t(1.6); f=110*np.exp(-d*1.6); ph=2*np.pi*np.cumsum(f)/SR
x=(np.sin(ph)+0.4*np.sin(2*ph)+0.2*np.sin(3*ph))*np.clip(1-d/1.6,0,1)**1.5*0.6
save("powerdown",x)
# clunk (breaker)
d=t(0.35); save("clunk",(0.9*np.sin(2*np.pi*70*d)+0.5*rng.standard_normal(len(d))*np.exp(-d*80))*env(len(d),0.001,0.07))
# crickets
d=t(5.0); ch=np.sin(2*np.pi*4300*d)*((np.sin(2*np.pi*28*d)>0.3)*(np.sin(2*np.pi*0.9*d)>0.1))
save("crickets",0.12*ch)
# boing (head shake / comedic)
d=t(0.5); f=300+120*np.sin(2*np.pi*14*d)*np.exp(-d*5)
save("boing",0.5*np.sin(2*np.pi*np.cumsum(f)/SR)*env(len(d),0.003,0.18))
# crunch (eating fries / burger)
d=t(0.22); n=rng.standard_normal(len(d)); g=(rng.random(len(d))<0.25)
save("crunch",0.6*n*g*env(len(d),0.001,0.06))
# alarm siren (2 s, two-tone)
d=t(2.0); f=np.where((d*4)%1<0.5,880,660); save("alarm",0.35*np.sign(np.sin(2*np.pi*np.cumsum(f)/SR))*np.clip(1-d/2.2,0,1))
# laser on
d=t(0.6); f=200+2400*d; save("laser",0.35*np.sin(2*np.pi*np.cumsum(f)/SR)*env(len(d),0.005,0.4))
# glass dome thunk
d=t(0.5); save("dome",(0.6*np.sin(2*np.pi*520*d)+0.4*np.sin(2*np.pi*1310*d))*env(len(d),0.001,0.15)+0.4*np.sin(2*np.pi*90*d)*env(len(d),0.001,0.08))
# lock click
d=t(0.15); save("lock",0.8*rng.standard_normal(len(d))*env(len(d),0.0005,0.006)+0.4*np.sin(2*np.pi*2200*d)*env(len(d),0.001,0.02))
# steam hiss
d=t(1.2); save("steam",0.25*rng.standard_normal(len(d))*np.sin(np.pi*d/1.2))
