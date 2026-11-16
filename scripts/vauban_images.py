import json, math, io, urllib.request, urllib.parse, sys
from PIL import Image, ImageDraw
from pyproj import Transformer
UA={'User-Agent':'IArchitect-demo/0.1'}
def get(u, raw=False):
    with urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=60) as r:
        b=r.read(); return b if raw else json.loads(b)
out=sys.argv[1]
g=get('https://data.geopf.fr/geocodage/search?limit=1&q='+urllib.parse.quote('24 Rue Gambetta 59000 Lille'))['features'][0]
clon,clat=g['geometry']['coordinates']; print(g['properties']['label'],g['properties']['score'],clat,clon)
# plan de situation carré 1000 px, ~ 1:5000 (Plan IGN v2) + repère
t=Transformer.from_crs(4326,2154,always_xy=True); x,y=t.transform(clon,clat)
half=350  # m
W=1000
def wms(lay,fmt):
    u=('https://data.geopf.fr/wms-r/wms?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&CRS=EPSG:2154&STYLES=&LAYERS=%s&FORMAT=%s&WIDTH=%d&HEIGHT=%d&BBOX=%f,%f,%f,%f'%(lay,fmt,W,W,x-half,y-half,x+half,y+half))
    return Image.open(io.BytesIO(get(u,True))).convert('RGBA')
base=wms('GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2','image/png')
d=ImageDraw.Draw(base); c=W/2
for r,col in [(34,(132,191,64,90)),(14,(46,89,107,255))]: d.ellipse([c-r,c-r,c+r,c+r],fill=col)
d.ellipse([c-6,c-6,c+6,c+6],fill=(255,255,255,255))
base.convert('RGB').save(out+'/situation.jpg',quality=90)
# Panoramax : vue qui regarde l'adresse
dd=0.0006
pics=get('https://api.panoramax.xyz/api/search?limit=100&bbox=%f,%f,%f,%f'%(clon-dd,clat-dd,clon+dd,clat+dd)).get('features',[])
def brg(a,b):
    y_=math.sin(math.radians(b[0]-a[0]))*math.cos(math.radians(b[1])); x_=math.cos(math.radians(a[1]))*math.sin(math.radians(b[1]))-math.sin(math.radians(a[1]))*math.cos(math.radians(b[1]))*math.cos(math.radians(b[0]-a[0]))
    return (math.degrees(math.atan2(y_,x_))+360)%360
def dist(a,b): return math.hypot((b[0]-a[0])*111320*math.cos(math.radians(a[1])),(b[1]-a[1])*110540)
cand=[]
for f in pics:
    co=f['geometry']['coordinates']; az=f['properties'].get('view:azimuth')
    if az is None: continue
    di=dist(co,(clon,clat)); de=abs((brg(co,(clon,clat))-az+180)%360-180)
    if 8<=di<=60 and de<=40: cand.append((de+di/3,di,de,f))
cand.sort(key=lambda t:t[0]); print(len(pics),'photos',len(cand),'candidates')
for i,(sc,di,de,f) in enumerate(cand[:3]):
    open(out+f'/facade_{i}.jpg','wb').write(get(f['assets']['hd']['href'],True))
    p=f['properties']; print(i,round(di),round(de),p.get('datetime','')[:10],p.get('license'),(p.get('providers') or [{}])[0].get('name',''),f['id'])
