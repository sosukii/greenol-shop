import re, json, os, html, glob
D='/private/tmp/claude-501/ref/pages/'
def rd(n): return open(D+n,encoding='utf-8').read()
def txt(h):
    h=re.sub(r'<script.*?</script>|<style.*?</style>','',h,flags=re.S)
    h=re.sub(r'<br\s*/?>','\n',h)
    h=re.sub(r'</(p|div|li|h[1-6]|tr)>','\n',h)
    h=re.sub(r'<[^>]+>','',h)
    h=html.unescape(h).replace('\xa0',' ')
    return '\n'.join(l.strip() for l in h.split('\n') if l.strip())
def blocks(h):
    """HTML -> list of {t:'p'|'h'|'li', text}"""
    h=re.sub(r'<script.*?</script>|<style.*?</style>','',h,flags=re.S)
    out=[]
    for m in re.finditer(r'<(p|h[1-6]|li)[^>]*>(.*?)</\1>',h,flags=re.S):
        t=txt(m.group(2)).replace('\n',' ').strip()
        if t: out.append({'t':'li' if m.group(1)=='li' else ('h' if m.group(1)[0]=='h' else 'p'),'text':t})
    return out
def grab(pat,s,flags=re.S):
    m=re.search(pat,s,flags); return m.group(1) if m else None

products={}
for f in sorted(glob.glob(D+'products__*.html')):
    s=rd(os.path.basename(f)); slug=os.path.basename(f)[10:-5]
    i=s.find('itemtype=https://schema.org/Product'); b=s[i:]
    name=html.unescape(grab(r'<h1[^>]*itemprop=name[^>]*>(.*?)</h1>',b)).strip()
    crumbs=[]
    bc=grab(r'(<div data-bread-crumbs.*?</div>\s*</div>\s*</div>)',b)
    for m in re.finditer(r'<a class="breads-item-link[^>]*href="([^"]+)"[^>]*>\s*<span itemprop="name">(.*?)</span>',bc or ''):
        crumbs.append((m.group(1),html.unescape(m.group(2))))
    brand=grab(r'itemprop="brand".*?<meta itemprop="name" content="([^"]*)"',b)
    sizes=grab(r'data-sizes="(\[.*?\])"',b)
    sizes={x['SizeId']:x['SizeName'] for x in json.loads(html.unescape(sizes))} if sizes else {}
    offers=[]
    for m in re.finditer(r'<div itemprop="offers" itemscope itemtype="https://schema.org/Offer">(.*?)</div>',b,re.S):
        o=m.group(1)
        sid=grab(r'\?size=(\d+)',o)
        offers.append({'sku':grab(r'itemprop="sku" content="([^"]*)"',o),'price':int(float(grab(r'itemprop="price" content="([^"]*)"',o))),
            'inStock':'InStock' in (grab(r'itemprop="availability" href="([^"]*)"',o) or ''),
            'size':sizes.get(int(sid)) if sid else None})
    if not offers:
        offers=[{'sku':grab(r'itemprop="sku" content="([^"]*)"',b),'price':int(float(grab(r'itemprop="price" content="([^"]*)"',b) or 0)),
            'inStock':'InStock' in (grab(r'itemprop="availability" href="([^"]*)"',b) or ''),'size':None}]
    desc=grab(r'itemprop="description"[^>]*>(.*?)</div>\s*<div class="tab-content details-tabs-properties"',b)
    props=grab(r'details-tabs-properties"[^>]*>(.*?)<div class="tab-content details-tabs-videos"',b)
    imgs=[]
    for m in re.finditer(r"https://greenolwemidas\.ru/pictures/product/(?:big|middle)/(\d+)_(?:big|middle)\.(\w+)",b):
        k=(m.group(1),m.group(2))
        if k not in imgs: imgs.append(k)
    weight=grab(r'details-weight.*?details-param-value[^>]*>\s*(.*?)</div>',b)
    products[slug]={'slug':slug,'name':name,'crumbs':crumbs,'brand':brand,'offers':offers,'desc':blocks(desc or ''),
        'props':blocks(props or '') ,'propsText':txt(props or ''),'images':imgs,'weight':txt(weight or '') if weight else None,
        'metaDesc':grab(r'<meta name="description" content="([^"]*)"',s)}
json.dump(products,open('/private/tmp/claude-501/ref/products.json','w'),ensure_ascii=False,indent=1)
print(len(products))
for p in list(products.values())[:3]: print(json.dumps(p,ensure_ascii=False)[:1200]); print()
import collections
print(collections.Counter(len(p['images']) for p in products.values()))
print(collections.Counter(len(p['offers']) for p in products.values()))
print(sum(1 for p in products.values() if p['propsText']), 'with props')
print(set(c[1] for p in products.values() for c in p['crumbs']))
