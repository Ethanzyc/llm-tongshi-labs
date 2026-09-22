#!/usr/bin/env python3
"""E09.1 素材·查询:query 向量化 → 余弦 top-2 → 拼 prompt → DeepSeek 生成
   对应正篇动手段的 retrieve/model 两步,model 诚实外置(真 API)。"""
import json, os, sys, urllib.request

API_KEY = os.environ["MINIMAX_API_KEY"]
DS_KEY = os.environ["DEEPSEEK_API_KEY"]

def embed(texts, typ):
    req = urllib.request.Request(
        "https://api.minimax.chat/v1/embeddings",
        data=json.dumps({"model": "embo-01", "type": typ, "texts": texts}).encode(),
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {API_KEY}"})
    return json.loads(urllib.request.urlopen(req, timeout=30).read())["vectors"]

def cosine(a, b):
    dot = sum(x*y for x, y in zip(a, b))
    na, nb = sum(x*x for x in a) ** .5, sum(x*x for x in b) ** .5
    return dot / (na * nb)

def ask(q, store, top_k=2):
    qv = embed([q], "query")[0]
    scored = sorted(((cosine(qv, c["vec"]), c) for c in store), reverse=True)[:top_k]
    ctx = "\n---\n".join(c["text"] for _, c in scored)
    prompt = (f"只根据下面的资料回答,资料里没有的信息就直说没有。\n资料:\n{ctx}\n\n问题:{q}")
    req = urllib.request.Request(
        "https://api.deepseek.com/chat/completions",
        data=json.dumps({"model": "deepseek-chat", "messages": [{"role": "user", "content": prompt}]}).encode(),
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {DS_KEY}"})
    ans = json.loads(urllib.request.urlopen(req, timeout=60).read())["choices"][0]["message"]["content"]
    return scored, ans

if __name__ == "__main__":
    store = json.load(open("rag_store.json", encoding="utf-8"))
    q = sys.argv[1]
    scored, ans = ask(q, store)
    print(f"Q: {q}")
    for s, c in scored:
        print(f"  hit {s:.3f}  {c['id']}")
    print(f"A: {ans[:120]}{'…' if len(ans) > 120 else ''}")
