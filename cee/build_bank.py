import pymupdf as fitz
import re, json, sys, os, argparse, bisect
from PIL import Image

PDF = r'e:\cee\高考数学（1977 - 2025）.pdf'
QRE = re.compile(r'^(\d{1,2})\s*[.．、]')
HRE = re.compile(r'^\s*((?:19[7-9]\d|20[0-2]\d))\s*(.+)$')
SECTION_RE = re.compile(r'^(?:[一二三四五六七八九十]+\s*、|附加题)')
PAGE_NO_RE = re.compile(r'^\d{1,5}$')
COL_BOUNDS = (411.0, 780.0)
X_RANGES = ((36, 66), (400, 460), (775, 835))
SCALE = 2.6

def col_of(x):
    return 0 if x < COL_BOUNDS[0] else (1 if x < COL_BOUNDS[1] else 2)

def near_col(x):
    return any(a <= x <= b for a, b in X_RANGES)

def build_pages(doc):
    pages, headers = [], {}
    for pno in range(len(doc)):
        page = doc[pno]
        items = []
        for b in page.get_text('dict')['blocks']:
            if b['type'] == 1:
                items.append(dict(rect=tuple(b['bbox']), text='', kind='img', page=pno))
                continue
            if b['type'] != 0 or not b['lines']:
                continue
            txt = '\n'.join(''.join(s['text'] for s in l['spans']) for l in b['lines']).strip()
            if not txt:
                continue
            bb = tuple(b['bbox'])
            if PAGE_NO_RE.match(txt) and bb[1] > 780:
                continue
            num = None
            for l in b['lines']:
                lt = ''.join(sp['text'] for sp in l['spans']).strip()
                m = QRE.match(lt)
                if m and 1 <= int(m.group(1)) <= 30 and near_col(l['bbox'][0]):
                    num = dict(n=int(m.group(1)), y=l['bbox'][1], y1=l['bbox'][3], x=l['bbox'][0])
                    break
            items.append(dict(rect=bb, text=txt, kind='text', page=pno, num=num))
        for d in page.get_drawings():
            r = d['rect']
            if r.width >= 0.8 and r.height >= 0.8 and r.width < 600 and r.height < 780:
                items.append(dict(rect=(r.x0, r.y0, r.x1, r.y1), text='', kind='draw', page=pno))
        for b in page.get_text('dict')['blocks']:
            if b['type'] != 0 or not b['lines']:
                continue
            first = ''.join(s['text'] for s in b['lines'][0]['spans']).strip()
            m = HRE.match(first)
            if m and ('考试' in first or '高考' in first) and pno > 0:
                headers[pno] = first
                break
        pages.append(items)
    return pages, headers

def parse_header(h):
    m = re.match(r'^\s*(\d{4})\s*(.*?)\s*[（(]([^（()）]*)[)）]\s*$', h)
    if m:
        year, kind, name = int(m.group(1)), m.group(2).strip(), m.group(3).strip()
    else:
        m2 = re.match(r'^\s*(\d{4})\s*(.*)$', h)
        year = int(m2.group(1)); kind = m2.group(2).strip(); name = ''
    title = (name or kind).replace('\u3000', ' ').strip()
    if '新高考' in name: cat = '新高考'
    elif '春季' in kind: cat = '春季'
    elif any(k in name for k in ('全国', '大纲', '课程', '备用', '三南', '苏豫粤', '京、皖', '京蒙皖')):
        cat = '全国卷'
    else: cat = '省份卷'
    return dict(year=year, kind=kind, name=name, title=title, cat=cat)

def union(box, r):
    box[0] = min(box[0], r[0]); box[1] = min(box[1], r[1])
    box[2] = max(box[2], r[2]); box[3] = max(box[3], r[3])

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--out', required=True)
    ap.add_argument('--limit', type=int, default=0)
    ap.add_argument('--start', type=int, default=0)
    ap.add_argument('--scale', type=float, default=SCALE)
    ap.add_argument('--quality', type=int, default=80)
    ap.add_argument('--no-images', action='store_true')
    args = ap.parse_args()

    outdir = os.path.abspath(args.out)
    imgdir = os.path.join(outdir, 'img')
    os.makedirs(imgdir, exist_ok=True)

    doc = fitz.open(PDF)
    pages, headers = build_pages(doc)
    hp = sorted(headers.keys())
    papers = []
    for i, p0 in enumerate(hp):
        if i < args.start: continue
        if args.limit and len(papers) >= args.limit: break
        p1 = hp[i+1] if i+1 < len(hp) else len(doc)
        papers.append(dict(p0=p0, p1=p1, header=headers[p0], **parse_header(headers[p0])))

    report, questions = [], []
    for pi, paper in enumerate(papers):
        p0, p1 = paper['p0'], paper['p1']
        cands = []
        for p in range(p0, p1):
            for ii, it in enumerate(pages[p]):
                if it['kind'] != 'text' or not it.get('num'): continue
                num = it['num']
                cands.append(dict(page=p, idx=ii, n=num['n'], col=col_of(num['x']), y=num['y'], x=num['x']))
        cands.sort(key=lambda c: (c['page'], c['col'], c['y'], c['x']))
        last, accepted = 0, []
        for c in cands:
            if c['n'] > last and c['n'] - last <= 2:
                accepted.append(c); last = c['n']
        nums = [c['n'] for c in accepted]
        if nums != list(range(1, len(nums)+1)):
            report.append('%-46s detected=%s' % (paper['header'], nums))
        anchors = {(c['page'], c['idx']): c for c in accepted}
        for p in range(p0, p1):
            for ii, it in enumerate(pages[p]):
                it['anchor'] = anchors.get((p, ii))

        cur, qgroups = None, {}
        for p in range(p0, p1):
            for it in pages[p]:
                if it['kind'] != 'text': continue
                if it.get('anchor'):
                    if cur is not None: questions.append(cur)
                    a = it['anchor']
                    cur = dict(p=pi, n=a['n'], groups={}, text=[], top_keep=False,
                               anchor=(p, a['col'], it['num']['y'], it['num']['y1']), next=None)
                if cur is None: continue
                if it['rect'][1] < cur['anchor'][2] - 2 and it['rect'][3] > cur['anchor'][2] + 2:
                    cur['top_keep'] = True
                if SECTION_RE.match(it['text'].split('\n')[0]):
                    continue
                key = (p, col_of(it['rect'][0]))
                if key not in cur['groups']: cur['groups'][key] = list(it['rect'])
                else: union(cur['groups'][key], it['rect'])
                if it['text']: cur['text'].append(it['text'].replace('\n', ' '))
        if cur is not None: questions.append(cur)
        for p in range(p0, p1):
            for it in pages[p]: it.pop('anchor', None)

    # link each question to the next anchor of the same paper
    q_by_paper = {}
    for q in questions: q_by_paper.setdefault(q['p'], []).append(q)
    for pi, qs in q_by_paper.items():
        for i, q in enumerate(qs):
            q['next'] = qs[i+1]['anchor'] if i+1 < len(qs) else None

    # assign drawings / images to the question with the greatest vertical overlap,
    # otherwise to the last anchor before them
    qs_by_key = {}
    for q in questions:
        for key, rect in q['groups'].items():
            qs_by_key.setdefault(key, []).append(q)
    anchors_by_paper = {}
    anchor_map = {}
    for q in questions:
        anchors_by_paper.setdefault(q['p'], []).append(q['anchor'])
        anchor_map.setdefault(q['p'], {})[q['anchor']] = q
    for pi in anchors_by_paper:
        anchors_by_paper[pi].sort()

    for pi, paper in enumerate(papers):
        p0, p1 = paper['p0'], paper['p1']
        alist = anchors_by_paper.get(pi, [])
        for p in range(p0, p1):
            for it in pages[p]:
                if it['kind'] == 'text': continue
                r = it['rect']
                c = col_of(r[0])
                key = (p, c)
                best, bestov = None, 0
                for q in qs_by_key.get(key, []):
                    g = q['groups'][key]
                    ov = min(g[3], r[3]) - max(g[1], r[1])
                    if ov > bestov:
                        bestov, best = ov, q
                if best is None:
                    pos = (p, c, r[1])
                    k = bisect.bisect_right(alist, pos) - 1
                    if k >= 0:
                        best = anchor_map.get(pi, {}).get(alist[k])
                if best is None: continue
                if key not in best['groups']: best['groups'][key] = list(r)
                else: union(best['groups'][key], r)

    report.insert(0, 'papers=%d questions=%d nonseq-papers=%d' %
                  (len(papers), len(questions), len(report)))
    print(report[0])
    for r in report[1:9]: print(r)

    if args.no_images: return

    mat = fitz.Matrix(args.scale, args.scale)
    meta_q = []
    for q in questions:
        crops = []
        for (pg, col), rect in sorted(q['groups'].items()):
            page = doc[pg]; pr = page.rect
            x0, y0, x1, y1 = rect
            x0 = max(pr.x0 + 4, x0 - 5); y0 = max(pr.y0 + 4, y0 - 0.3)
            x1 = min(pr.x1 - 4, x1 + 6); y1 = min(pr.y1 - 20, y1 + 6)
            if (not q.get('top_keep')) and q['anchor'] and (pg, col) == q['anchor'][:2]:
                y0 = max(y0, q['anchor'][2] - 0.5)
            if q['next'] and (pg, col) == q['next'][:2]:
                y1 = min(y1, q['next'][2] - 2)
            if x1 - x0 < 8 or y1 - y0 < 8: continue
            pix = page.get_pixmap(clip=fitz.Rect(x0, y0, x1, y1), matrix=mat, alpha=False)
            crops.append(Image.frombytes('RGB', (pix.width, pix.height), pix.samples))
        if not crops: continue
        trims = []
        for im in crops:
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
            w = max(i.width for i in trims); h = sum(i.height for i in trims) + gap*(len(trims)-1)
            im = Image.new('RGB', (w, h), 'white'); yy = 0
            for i in trims:
                im.paste(i, (0, yy)); yy += i.height + gap
        name = 'q%05d.webp' % (len(meta_q)+1)
        im.save(os.path.join(imgdir, name), 'WEBP', quality=args.quality, method=4)
        meta_q.append(dict(i=len(meta_q)+1, p=q['p'], n=q['n'], img=name,
                           w=im.width, h=im.height, pg=sorted(q['groups'])[0][0]+1,
                           t=' '.join(q['text'])[:400]))
        if len(meta_q) % 200 == 0:
            print('rendered', len(meta_q), '/', len(questions), flush=True)

    papers_out = []
    for i, p in enumerate(papers):
        papers_out.append(dict(i=i, year=p['year'], title=p['title'], kind=p['kind'],
                               name=p['name'], cat=p['cat'], pages=[p['p0']+1, p['p1']],
                               q=sum(1 for q in meta_q if q['p'] == i)))
    data = dict(papers=papers_out, questions=meta_q,
                meta=dict(title='高考数学题库 1977–2025', total=len(meta_q)))
    with open(os.path.join(outdir, 'data.js'), 'w', encoding='utf-8') as f:
        f.write('window.BANK=')
        json.dump(data, f, ensure_ascii=False, separators=(',', ':'))
        f.write(';')
    with open(os.path.join(outdir, 'build_report.txt'), 'w', encoding='utf-8') as f:
        f.write('\n'.join(report))
    print('done: questions=%d images=%d' % (len(questions), len(meta_q)))

if __name__ == '__main__':
    main()
