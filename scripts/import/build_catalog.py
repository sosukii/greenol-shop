"""Собирает src/data/catalog.json из products.json (результат parse_products.py) и скачанных страниц.
Источник данных — действующий магазин greenolwemidas.ru. Запуск: python3 -I build_catalog.py <ref_dir> <out.json>"""
import json, re, sys, html, glob, os
ref, out = sys.argv[1], sys.argv[2]
P = json.load(open(f'{ref}/products.json'))
pages = f'{ref}/pages/'
def rd(n): return open(pages + n, encoding='utf-8').read()
def txt(h): return html.unescape(re.sub(r'<[^>]+>', '', h or '')).replace('\xa0', ' ').strip()

CAT_TITLES = {'АВТОМАСЛА': 'Автомасла', '⭐ МОТОРНЫЕ МАСЛА⭐': 'Моторные масла', 'ПРИСАДКИ В БЕНЗИН': 'Присадки в бензин',
              'НАБОРЫ ДЛЯ КОМПЛЕКСНОЙ ОБРАБОТКИ': 'Наборы для комплексной обработки', 'ТОТЕК': 'Тотек'}
cats = {}
for f in sorted(glob.glob(pages + 'categories__*.html')):
    slug = os.path.basename(f)[12:-5]; s = open(f, encoding='utf-8').read()
    title = txt(re.search(r'<h1[^>]*>(.*?)</h1>', s, re.S).group(1))
    cats[slug] = {'id': slug, 'slug': slug, 'title': CAT_TITLES.get(title, title), 'rawTitle': title, 's': s}
by_raw = {c['rawTitle']: c['id'] for c in cats.values()}
out_cats = []
for c in cats.values():
    m = re.search(r'(<div data-bread-crumbs.*?</div>\s*</div>\s*</div>)', c['s'], re.S)
    names = re.findall(r'<span itemprop="name">(.*?)</span>', m.group(1)) if m else []
    names = [html.unescape(n) for n in names if n not in ('Главная', 'Каталог')]
    parent = by_raw.get(names[-1]) if names else None
    out_cats.append({'id': c['id'], 'slug': c['slug'], 'title': c['title'], 'parentId': parent})

def slugs(n): return set(re.findall(r'/products/([^"?/]+)', rd(n)))
member = {}
for c in cats.values():
    for sl in slugs('categories__' + c['id'] + '.html'): member.setdefault(sl, []).append(c['id'])
best, new = slugs('productlist__best.html'), slugs('productlist__new.html')

def brand_of(p):
    n = p['name'].upper()
    return 'totek' if ('ТОТЕК' in n or 'TOTEK' in n) else 'greenol'

def num(w):
    try: return float(str(w).replace(',', '.'))
    except: return None

products = []
for p in P.values():
    last = p['crumbs'][-1][0].rsplit('/', 1)[-1] if len(p['crumbs']) > 2 else None
    if last not in cats: last = 'avtokhimiya'
    desc = [b for b in p['desc'] if b['text'] != p['name']]
    offers = []
    for o in p['offers']:
        offers.append({'sku': o['sku'], 'label': o['size'], 'price': o['price'], 'inStock': o['inStock']})
    first = desc[0]['text'] if desc else p['name']
    products.append({
        'id': p['slug'], 'slug': p['slug'], 'title': p['name'], 'brand': brand_of(p), 'categoryIds': sorted(set([last] + member.get(p['slug'], []))),
        'summary': (first[:157].rsplit(' ', 1)[0] + '…') if len(first) > 160 else first,
        'description': desc, 'images': [i for i, _ in p['images']], 'offers': offers,
        'hit': p['slug'] in best, 'isNew': p['slug'] in new,
    })
data = {'brands': [{'id': 'greenol', 'title': 'Greenol'}, {'id': 'totek', 'title': 'Тотек'}], 'categories': out_cats, 'products': products}
json.dump(data, open(out, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
import collections
print(len(products), collections.Counter(i for p in products for i in p['categoryIds']), collections.Counter(p['brand'] for p in products))
