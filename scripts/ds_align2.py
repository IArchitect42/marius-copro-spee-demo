"""2e passe DS (ds-marius) : échelle typo THE DAM, graisses, Scale d'espacement, Block Wrapper, libellés."""
import re, sys
p=sys.argv[1]; s=open(p,encoding="utf-8").read()
FS={8:10,9:10,11:12,13:14,15:16,17:20,18:20,19:20,22:24,26:24,32:36,40:48}
s=re.sub(r'fontSize:"(\d+)px"',lambda m:f'fontSize:"{FS.get(int(m.group(1)),int(m.group(1)))}px"',s)
s=re.sub(r'fontWeight:(800|900)\b','fontWeight:700',s)
s=re.sub(r'fontWeight:"(800|900)"','fontWeight:700',s)
# Block Wrapper Read Only : neutral-50, bordure neutral-600, rayon 8
s=re.sub(r'background:"#FFFFFF",border:"1px solid #EAEEF0",borderRadius:"(8|12|16)px"','background:"#FBFBFB",border:"1px solid #C3C5C7",borderRadius:"8px"',s)
# Scale d'espacement
SC=[0,2,4,8,12,16,24,32,40,48,56,64,96]
def near(v):
    return min(SC,key=lambda x:(abs(x-v),-x))
def fix(m):
    vals=m.group(2)
    vals=re.sub(r'(\d+)px',lambda n:f'{near(int(n.group(1)))}px',vals)
    return f'{m.group(1)}:"{vals}"'
s=re.sub(r'\b(padding|paddingTop|paddingBottom|paddingLeft|paddingRight|margin|marginTop|marginBottom|marginLeft|marginRight|gap|rowGap|columnGap)\s*:\s*"([^"]*px[^"]*)"',fix,s)
# letterSpacing hors DS ; capitales réservées aux sous-titres de menu
s=re.sub(r',?\s*letterSpacing:"[^"]*"','',s)
s=re.sub(r',?\s*textTransform:"uppercase"','',s)
open(p,"w",encoding="utf-8").write(s)
