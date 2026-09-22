#!/usr/bin/env python3
"""E09.1 素材·入库:切块 → MiniMax embo-01 真向量化 → rag_store.json
   对应正篇 E09 动手段的 split/embed/store 三步,本次用真 embedding API。"""
import json, os, glob, urllib.request

API_KEY = os.environ["MINIMAX_API_KEY"]
WIN, OVERLAP = 200, 40          # 小语料微缩口径:窗口 200 字,相邻重合 40 字

def split(text, win=WIN, overlap=OVERLAP):          # ① 切块:定长窗口+相邻重合
    step = win - overlap
    return [text[i:i+win] for i in range(0, len(text), step) if text[i:i+win].strip()]

def embed(texts, typ):                              # ② 向量化:MiniMax embo-01(真 API)
    req = urllib.request.Request(
        "https://api.minimax.chat/v1/embeddings",
        data=json.dumps({"model": "embo-01", "type": typ, "texts": texts}).encode(),
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {API_KEY}"})
    d = json.loads(urllib.request.urlopen(req, timeout=30).read())
    assert d["base_resp"]["status_code"] == 0, d["base_resp"]
    return d["vectors"]

chunks = []
for path in sorted(glob.glob("corpus/*.md")):
    text = open(path, encoding="utf-8").read().strip()
    for i, c in enumerate(split(text)):
        chunks.append({"id": f"{os.path.basename(path)}#{i}", "text": c})
print(f"切块:3 篇 → {len(chunks)} 块(窗口 {WIN},重合 {OVERLAP})")

vecs = embed([c["text"] for c in chunks], "db")
for c, v in zip(chunks, vecs):
    c["vec"] = v
json.dump(chunks, open("rag_store.json", "w", encoding="utf-8"), ensure_ascii=False)
print(f"入库:embeddings.json 写出,{len(chunks)} 条 × {len(vecs[0])} 维向量(embo-01)")
