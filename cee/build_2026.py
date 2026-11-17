import pymupdf as fitz, re, json, os, sys, glob, math
from PIL import Image

SRC_DIR = r'E:\cee\题库\2026高考数学真题'
PDF_ORIG = r'E:\cee\高考数学（1977 - 2025）.pdf'
PDF_OUT = r'E:\cee\高考数学（1977 - 2026）.pdf'
BANK_DIR = r'E:\cee\题库'

PAPERS = [
    dict(file='2026北京卷（数学）.pdf', key='北京卷', title='北京卷', cat='省份卷', qre=r'^[（(](\d{1,2})[)）]'),
    dict(file='2026上海卷（数学）.pdf', key='上海卷', title='上海卷', cat='省份卷', qre=r'^(\d{1,2})\s*[.．、]'),
    dict(file='2026天津卷（数学）.pdf', key='天津卷', title='天津卷', cat='省份卷', qre=r'^(\d{1,2})\s*[.．、]'),
    dict(file='2026新高考全国一卷（数学）.pdf', key='新高考I', title='新高考I', cat='新高考', qre=r'^(\d{1,2})\s*[.．、]'),
    dict(file='2026新高考全国二卷（数学）.pdf', key='新高考II', title='新高考II', cat='新高考', qre=r'^(\d{1,2})\s*[.．、]'),
]
SECTION_RE = re.compile(r'^(?:[一二三四五六七八九十]+\s*、|第\s*[IⅡ]+\s*卷|第\s*[一二]\s*部分|参考公式|本卷共|注意事项)')
PAGENO_RE = re.compile(r'^\d{1,3}$')

def union(g, r):
    g[0] = min(g[0], r[0]); g[1] = min(g[1], r[1])
    g[2] = max(g[2], r[2]); g[3] = max(g[3], r[3])

def parse_paper(cfg):
    path = os.path.join(SRC_DIR, cfg['file'])
    doc = fitz.open(path)
    qre = re.compile(cfg['qre'])
    text_items = []
    drawings = []
    for pno in range(len(doc)):
        page = doc[pno]
        for b in page.get_text('dict')['blocks']:
            if b['type'] == 1:
                drawings.append(dict(page=pno, rect=tuple(b['bbox'])))
                continue
            if b['type'] != 0 or not b['lines']:
                continue
            txt = '\n'.join(''.join(s['text'] for s in l['spans']) for l in b['lines']).strip()
            if not txt:
                continue
            first = ''.join(s['text'] for s in b['lines'][0]['spans']).strip()
            r = tuple(b['bbox'])
            if PAGENO_RE.match(txt) and r[1] > 760:
                continue
            lns = []
            for l in b['lines']:
                lt = ''.join(s['text'] for s in l['spans']).strip()
                if lt: lns.append((tuple(l['bbox']), lt))
            text_items.append(dict(page=pno, rect=r, text=txt, first=first, lines=lns))
        for d in page.get_drawings():
            r = d['rect']
            if r.width >= 0.8 and r.width < 560 and r.height < 800:
                drawings.append(dict(page=pno, rect=(r.x0, r.y0, r.x1, r.y1)))

    # question candidates in raw reading order
    cands = []
    for it in text_items:
        found = None
        for bb, lt in it.get('lines', []):
            m = qre.match(lt)
            if m and bb[0] <= 56:
                found = int(m.group(1)); break
        if found is not None:
            cands.append(dict(page=it['page'], y=it['rect'][1], n=found, item=it))
    chain, last = [], 0
    for c in cands:
        if c['n'] == last + 1 or c['n'] == last + 2:
            chain.append(c); last = c['n']
    nums = [c['n'] for c in chain]

    bounds = [dict(kind='q', n=c['n'], item=c['item']) for c in chain]
    for it in text_items:
        if SECTION_RE.match(it['first'].strip()):
            bounds.append(dict(kind='sec', n=None, item=it))
    bset = {id(b['item']): b for b in bounds}

    # walk text items in raw order
    units = []
    cur = None
    for it in text_items:
        b = bset.get(id(it))
        if b is not None:
            if cur is not None: units.append(cur)
            cur = dict(kind=b['kind'], n=b['n'], items=[it])
            continue
        if cur is None:
            continue
        cur['items'].append(it)
    if cur is not None: units.append(cur)

    # text segments
    for u in units:
        segs = {}
        for it in u['items']:
            p = it['page']
            if p not in segs: segs[p] = list(it['rect'])
            else: union(segs[p], it['rect'])
        u['segs'] = segs
        u['text'] = ' '.join(it['text'] for it in u['items'])[:500]

    # drawing assignment
    for d in drawings:
        p, r = d['page'], d['rect']
        cand = []
        for u in units:
            if p in u['segs']:
                g = u['segs'][p]
                ov = min(g[3], r[3]) - max(g[1], r[1])
                if ov > 0: cand.append((ov, u))
        if cand:
            cand.sort(key=lambda x: -x[0])
            u = cand[0][1]
        else:
            # last unit starting on this page before the drawing
            prev = None
            for u in units:
                ys = [it['rect'][1] for it in u['items'] if it['page'] == p]
                if ys and min(ys) <= r[1]:
                    prev = u
                elif ys and min(ys) > r[1]:
                    break
            if prev is None:
                # continuation from the previous page
                for u in units:
                    if u['items'] and u['items'][0]['page'] < p:
                        prev = u
                    elif u['items'] and u['items'][0]['page'] > p:
                        break
            u = prev
        if u is None: continue
        if p not in u['segs']: u['segs'][p] = list(r)
        else: union(u['segs'][p], r)

    # content top/bottom per page, considering all items/drawings in segs
    for u in units:
        u['segtop'] = {p: g[1] for p, g in u['segs'].items()}
        u['segbot'] = {p: g[3] for p, g in u['segs'].items()}
    # previous-unit boundary per page: next unit's content top
    for i, u in enumerate(units):
        u['prev_top'] = None
        u['next_top'] = None
        if i > 0:
            pu = units[i-1]
            pages = sorted(set(u['segtop']) & set(pu['segs']))
            u['prev_top'] = {p: pu['segs'][p][3] for p in pages}
        if i + 1 < len(units):
            nu = units[i+1]
            pages = sorted(set(u['segtop']) & set(nu['segs']))
            u['next_top'] = {p: nu['segs'][p][1] for p in pages}
    return doc, text_items, units, nums


OUT_W, OUT_H = 1190.55, 841.89
COL_W = 532.8
COL_X = [45.0, 612.8]
TOP_FIRST, TOP_CONT, BOTTOM = 120.0, 60.0, 790.0
UNIT_GAP = 14.0
SEG_GAP = 5.0
SRC_X0, SRC_X1 = 36.0, 566.0
SCALE = COL_W / (SRC_X1 - SRC_X0)
HEADER_FONT = r'C:\Windows\Fonts\simhei.ttf'

def build_pdf(preview=0):
    out = fitz.open(PDF_ORIG)
    docs = []
    all_papers = []
    new_start = len(out) + 1
    header_font = fitz.Font(fontfile=HEADER_FONT)
    for cfg in PAPERS:
        doc, items, units, nums = parse_paper(cfg)
        docs.append(doc)
        # new paper page
        page = out.new_page(width=OUT_W, height=OUT_H)
        pageno = out.page_count
        page.insert_text((OUT_W / 2, 817), str(pageno), fontname='times-roman', fontsize=10.5, color=(0, 0, 0))
        header = '2026 普通高等学校招生考试(%s)' % cfg['title']
        hw = header_font.text_length(header, fontsize=15)
        tw = fitz.TextWriter(page.rect)
        tw.append((COL_X[0] + (COL_W - hw) / 2, 88), header, font=header_font, fontsize=15)
        tw.write_text(page, color=(0, 0, 0))
        paper_first = pageno
        col, y = 0, TOP_FIRST
        qpages = {}
        for u in units:
            segs = sorted(u['segs'].items())
            if not segs:
                continue
            parts = []
            for p, g in segs:
                y0 = max(0.0, g[1] - 1.0)
                y1 = min(doc[p].rect.height, g[3] + 1.0)
                if y1 - y0 < 2:
                    continue
                parts.append((p, y0, y1))
            if not parts:
                continue
            h_nat = sum((y1 - y0) * SCALE for p, y0, y1 in parts) + SEG_GAP * (len(parts) - 1)
            sf = 1.0
            if h_nat > (BOTTOM - TOP_CONT - 2):
                sf = (BOTTOM - TOP_CONT - 2) / h_nat
            h = h_nat * sf
            if y + h > BOTTOM:
                if col == 0:
                    col, y = 1, (TOP_FIRST if pageno == paper_first else TOP_CONT)
                else:
                    page = out.new_page(width=OUT_W, height=OUT_H)
                    pageno = out.page_count
                    page.insert_text((OUT_W / 2, 817), str(pageno), fontname='times-roman', fontsize=10.5, color=(0, 0, 0))
                    col, y = 0, TOP_CONT
            if u['kind'] == 'q':
                qpages[u['n']] = pageno
            for i, (p, y0, y1) in enumerate(parts):
                dw = COL_W * sf
                dh = (y1 - y0) * SCALE * sf
                dx = COL_X[col] + (COL_W - dw) / 2
                dest = fitz.Rect(dx, y, dx + dw, y + dh)
                clip = fitz.Rect(SRC_X0, y0, SRC_X1, y1)
                page.show_pdf_page(dest, doc, p, clip=clip, keep_proportion=True)
                y += dh + SEG_GAP * sf
            y += UNIT_GAP
        all_papers.append(dict(key=cfg['key'], title=cfg['title'], cat=cfg['cat'],
                               pages=[paper_first, pageno], qpages=qpages, nums=nums))
        print('paper', cfg['title'], 'pages', paper_first, '-', pageno, 'questions', len(nums))
        if preview:
            for pv in range(paper_first, pageno + 1):
                pix = out[pv - 1].get_pixmap(matrix=fitz.Matrix(0.75, 0.75), alpha=False)
                pix.save(r'C:\Users\house\AppData\Local\Temp\opencode\prev_%d.png' % pv)
    out.save(PDF_OUT, garbage=3, deflate=True)
    print('saved', PDF_OUT, 'pages', len(out), 'new from', new_start)
    with open(os.path.join(BANK_DIR, '2026_layout.json'), 'w', encoding='utf-8') as f:
        json.dump(dict(papers=all_papers), f, ensure_ascii=False, indent=1)
    for d in docs: d.close()
    out.close()
    return all_papers

def build_bank():
    from PIL import Image
    layout = json.load(open(os.path.join(BANK_DIR, '2026_layout.json'), encoding='utf-8'))
    data_path = os.path.join(BANK_DIR, 'data.js')
    raw = open(data_path, encoding='utf-8').read()
    prefix = 'window.BANK='
    data = json.loads(raw[len(prefix):-1])
    base_papers = len(data['papers'])
    base_qs = len(data['questions'])
    imgdir = os.path.join(BANK_DIR, 'img')

    new_papers = []
    new_qs = []
    qid = base_qs
    for pi, cfg in enumerate(PAPERS):
        doc, items, units, nums = parse_paper(cfg)
        lay = next(x for x in layout['papers'] if x['key'] == cfg['key'])
        qpages = {int(k): v for k, v in lay['qpages'].items()}
        paper_i = base_papers + pi
        qcount = 0
        for u in units:
            if u['kind'] != 'q':
                continue
            segs = []
            for p, g in sorted(u['segs'].items()):
                page = doc[p]
                x0 = max(0.0, g[0] - 4); x1 = min(page.rect.width, g[2] + 4)
                y0 = max(0.0, g[1] - 1); y1 = min(page.rect.height, g[3] + 1)
                if x1 - x0 < 4 or y1 - y0 < 4:
                    continue
                pix = page.get_pixmap(clip=fitz.Rect(x0, y0, x1, y1),
                                      matrix=fitz.Matrix(2.6, 2.6), alpha=False)
                segs.append(Image.frombytes('RGB', (pix.width, pix.height), pix.samples))
            if not segs:
                continue
            trims = []
            for im in segs:
                g = im.convert('L').point(lambda v: 255 if v < 246 else 0)
                bb = g.getbbox()
                if bb:
                    bb = (max(0, bb[0]-6), max(0, bb[1]-6), min(im.width, bb[2]+6), min(im.height, bb[3]+6))
                    im = im.crop(bb)
                trims.append(im)
            if len(trims) == 1:
                im = trims[0]
            else:
                gap = 14
                w = max(x.width for x in trims)
                h = sum(x.height for x in trims) + gap * (len(trims)-1)
                im = Image.new('RGB', (w, h), 'white')
                yy = 0
                for x in trims:
                    im.paste(x, (0, yy)); yy += x.height + gap
            qid += 1
            name = 'q%05d.webp' % qid
            im.save(os.path.join(imgdir, name), 'WEBP', quality=82, method=4)
            new_qs.append(dict(i=qid, p=paper_i, n=u['n'], img=name,
                               w=im.width, h=im.height, pg=qpages[u['n']],
                               t=u['text'][:400]))
            qcount += 1
        new_papers.append(dict(i=paper_i, year=2026, title=cfg['title'],
                               kind='普通高等学校招生考试', name=cfg['title'],
                               cat=cfg['cat'], pages=lay['pages'], q=qcount))
        print('bank', cfg['title'], 'questions', qcount)
    data['papers'].extend(new_papers)
    data['questions'].extend(new_qs)
    data['meta']['total'] = len(data['questions'])
    data['meta']['title'] = '高考数学题库 1977–2026'
    with open(data_path, 'w', encoding='utf-8') as f:
        f.write(prefix)
        json.dump(data, f, ensure_ascii=False, separators=(',', ':'))
        f.write(';')
    print('merged', len(new_qs), 'questions; total', len(data['questions']), 'papers', len(data['papers']))
if __name__ == '__main__':
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == 'pdf':
        build_pdf(preview=(len(sys.argv) > 2))
        sys.exit(0)
    if len(sys.argv) > 1 and sys.argv[1] == 'bank':
        build_bank()
        sys.exit(0)
    for cfg in PAPERS:
        doc, text_items, units, nums = parse_paper(cfg)
        print('====', cfg['title'], 'pages', len(doc), 'text', len(text_items), 'units', len(units), 'N', len(nums), nums[:5], nums[-3:])
        for u in units:
            segs = sorted(u['segs'].items())
            print('  ', u['kind'][:3], u['n'], [(p+1, round(g[1]), round(g[3])) for p, g in segs], repr(u['text'][:32]))
