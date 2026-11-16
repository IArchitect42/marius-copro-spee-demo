"""Aligne les couleurs/rayons/polices du proto sur THE DAM (ds-marius). Usage: python3 -I ds_align.py fichier.tsx"""
import re, sys, math
DS = """neutral-50 #FBFBFB|neutral-100 #F2F3F4|neutral-200 #ECEEEE|neutral-300 #E4E6E7|neutral-400 #DEE1E2|neutral-500 #D6D9DB|neutral-600 #C3C5C7|neutral-700 #989A9B|neutral-800 #767778|neutral-900 #5A5B5C|
primary-50 #EAEEF0|primary-100 #BECCD1|primary-200 #9FB3BB|primary-300 #73909C|primary-400 #587A89|primary-500 #2E596B|primary-600 #2A5161|primary-700 #213F4C|primary-800 #19313B|primary-900 #13252D|
secondary-50 #F3F9EC|secondary-100 #D9EBC4|secondary-200 #C6E2A7|secondary-300 #ADD47F|secondary-400 #9DCC66|secondary-500 #84BF40|secondary-600 #78AE3A|secondary-700 #5E882D|secondary-800 #496923|secondary-900 #37501B|
red-50 #FBEAEA|red-75 #EDAAAA|red-100 #E58686|red-200 #DA5252|red-300 #D32F2F|red-400 #942121|red-500 #811D1D|
orange-50 #FEF2E6|orange-75 #FBC996|orange-100 #F9B36B|orange-200 #F7922B|orange-300 #F57C00|orange-400 #AC5700|orange-500 #954C00|
green-50 #EBF4EC|green-75 #ADD1AF|green-100 #8CBD8E|green-200 #5AA15D|green-300 #388E3C|green-400 #27632A|green-500 #225725|
blue-50 #E6F3FA|blue-75 #97CEEC|blue-100 #6CBAE4|blue-200 #2D9CD9|blue-300 #0288D1|blue-400 #015F92|blue-500 #01537F|
purple-50 #F7E6FF|purple-75 #DE96FF|purple-100 #D06BFF|purple-200 #BC2BFF|purple-300 #AE00FF|purple-400 #7A00B3|purple-500 #6A009C|
TMO #C9E0F0|MO #F7EBB7|INT #C9C9E5|SUP #FAC9B4|White #FFFFFF|Black #000000"""
pal = [x.strip().split() for x in DS.replace("\n","").split("|")]
def lab(h):
    h=h.lstrip("#"); h="".join(c*2 for c in h) if len(h)==3 else h
    rgb=[int(h[i:i+2],16)/255 for i in (0,2,4)]
    rgb=[((c+0.055)/1.055)**2.4 if c>0.04045 else c/12.92 for c in rgb]
    x=(rgb[0]*.4124+rgb[1]*.3576+rgb[2]*.1805)/.95047; y=rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722; z=(rgb[0]*.0193+rgb[1]*.1192+rgb[2]*.9505)/1.08883
    f=lambda t: t**(1/3) if t>0.008856 else 7.787*t+16/116
    return (116*f(y)-16, 500*(f(x)-f(y)), 200*(f(y)-f(z)))
PL=[(n,h,lab(h)) for n,h in pal]
cache={k:v for k,v in {'#2563EB':'#2E596B','#1D4ED8':'#2A5161','#1E40AF':'#213F4C','#3B82F6':'#587A89','#60A5FA':'#73909C','#6366F1':'#7A00B3','#8B5CF6':'#AE00FF','#F5F3FF':'#F7E6FF','#FAF5FF':'#F7E6FF','#C4B5FD':'#DE96FF','#DDD6FE':'#F7E6FF','#1E3A8A':'#19313B'}.items()}
def nearest(h):
    k=h.upper()
    if k not in cache:
        L=lab(h); cache[k]=min(PL,key=lambda p: sum((a-b)**2 for a,b in zip(L,p[2])))[1]
    return cache[k]
p=sys.argv[1]; s=open(p,encoding="utf-8").read()
s=re.sub(r'#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b(?![0-9a-fA-F])', lambda m: nearest(m.group(0)), s)
R={"5px":"4px","6px":"4px","7px":"4px","9px":"8px","10px":"8px","11px":"8px","14px":"16px","3px":"2px"}
s=re.sub(r'borderRadius:"(\d+px)"', lambda m: f'borderRadius:"{R.get(m.group(1),m.group(1))}"', s)
s=re.sub(r'fontFamily:"(Georgia,serif|\'Inter\',[^"]*|Inter,sans-serif)"','fontFamily:"Inter,sans-serif"',s)
s=s.replace('fontFamily:"Montserrat, sans-serif"','fontFamily:"Montserrat,sans-serif"')
open(p,"w",encoding="utf-8").write(s)
print({k:v for k,v in sorted(cache.items())})
