from PIL import Image, ImageDraw, ImageFont, ImageFilter
from pathlib import Path
import hashlib, json, random

W,H=415,915
here=Path(__file__).resolve().parent
ose=here.parents[1]
assets=ose/'web-ui'/'src'/'assets'
out=here/'SCREEN_06_SESSION_ACTIVE_CANONICAL_415x915.png'
report=here/'SCREEN_06_SESSION_ACTIVE_BUILD_REPORT.json'

PARCH=(236,218,178); INK=(42,31,23); OX=(116,32,29); MUTED=(111,84,55); PANEL=(243,228,196)
random.seed(6)
img=Image.new('RGB',(W,H),PARCH); px=img.load()
for y in range(H):
    for x in range(W):
        n=random.randint(-5,5); base=px[x,y]
        px[x,y]=tuple(max(0,min(255,c+n)) for c in base)
img=img.filter(ImageFilter.GaussianBlur(0.25)); d=ImageDraw.Draw(img)

fd='/usr/share/fonts/truetype/dejavu'
def F(name,size): return ImageFont.truetype(f'{fd}/{name}',size)
serif=F('DejaVuSerif.ttf',11); serif9=F('DejaVuSerif.ttf',9); serif10=F('DejaVuSerif.ttf',10)
b12=F('DejaVuSerif-Bold.ttf',12); b13=F('DejaVuSerif-Bold.ttf',13); b14=F('DejaVuSerif-Bold.ttf',14); b16=F('DejaVuSerif-Bold.ttf',16)
small=F('DejaVuSans.ttf',7); small8=F('DejaVuSans.ttf',8); smallb8=F('DejaVuSans-Bold.ttf',8)

def asset(name,box):
    im=Image.open(assets/name).convert('RGBA'); x,y,w,h=box
    r=min(w/im.width,h/im.height); nw=max(1,round(im.width*r)); nh=max(1,round(im.height*r))
    im=im.resize((nw,nh),Image.Resampling.LANCZOS); img.paste(im,(x+(w-nw)//2,y+(h-nh)//2),im)
def rr(b,r=5,fill=None,outline=INK,width=1): d.rounded_rectangle(b,radius=r,fill=fill,outline=outline,width=width)
def ln(x1,y1,x2,y2,fill=INK,width=1): d.line((x1,y1,x2,y2),fill=fill,width=width)
def tx(x,y,s,font=serif,fill=INK,anchor=None): d.text((x,y),s,font=font,fill=fill,anchor=anchor)
def wrap(s,font,maxw):
    lines=[]; cur=''
    for w in s.split():
        t=(cur+' '+w).strip()
        if d.textbbox((0,0),t,font=font)[2] <= maxw: cur=t
        else:
            if cur: lines.append(cur)
            cur=w
    if cur: lines.append(cur)
    return lines
def para(b,s,font=serif,fill=INK,spacing=2):
    x,y,w,h=b; yy=y; bb=d.textbbox((0,0),'Ag',font=font); lh=bb[3]-bb[1]
    for line in wrap(s,font,w):
        if yy+lh>y+h: break
        d.text((x,yy),line,font=font,fill=fill); yy+=lh+spacing

# header
asset('001_logo_ose.png',(15,9,101,48)); tx(128,14,'CRIPTA SOB O OUTEIRO',b16); tx(129,40,'SESSÃO ATIVA · Mestre automático',smallb8,OX)
asset('003_icone_configuracoes.png',(366,12,31,31)); ln(15,67,400,67)

# scene context
text_y=78; tx(18,text_y,'CENA',smallb8,OX)
rr((18,90,151,139),5,PANEL); asset('032_icone_porta.png',(23,95,34,34)); tx(61,99,'CORREDOR',b12); tx(61,118,'de pedra · cripta',small8,MUTED)
rr((157,90,231,139),5,PANEL); tx(194,98,'DIA 3',smallb8,OX,'ma'); tx(194,115,'14:20',b13,INK,'ma')
rr((237,90,311,139),5,PANEL); tx(274,98,'CLIMA',smallb8,OX,'ma'); tx(274,116,'NUBLADO',b12,INK,'ma')
rr((317,90,397,139),5,PANEL); asset('008_status_tocha_30m.png',(326,94,37,37)); tx(378,99,'TOCHA',smallb8,OX,'ma'); tx(378,116,'30m',b12,INK,'ma')

# Master narration
 tx=tx
