#!/usr/bin/env python3
"""E09.1 真跑留档:两正一反对照实验 → results.json"""
import json
from query import ask, embed, cosine

store = json.load(open("rag_store.json", encoding="utf-8"))
EXPERIMENTS = [
    {"tag": "命中-无理由退货", "q": "商品不想要了,七天之内能退吗?"},
    {"tag": "命中-运费谁出", "q": "质量问题退货,运费谁承担?"},
    {"tag": "落空-无关问题", "q": "今天股票行情怎么样?"},
]
results = []
for e in EXPERIMENTS:
    scored, ans = ask(e["q"], store)
    results.append({"tag": e["tag"], "q": e["q"],
                    "hits": [{"score": round(s, 4), "id": c["id"]} for s, c in scored],
                    "answer": ans})
    print(f"[{e['tag']}] top1={scored[0][0]:.3f} → {ans[:60]}…")
json.dump(results, open("results.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("results.json 留档完成")
