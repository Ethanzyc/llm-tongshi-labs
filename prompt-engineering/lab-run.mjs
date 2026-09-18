// 实操实验：V0/V1/V2 三版提示词 × 同批测试题 × 多遍采样，原始输出留档 results.json
// 用法: LLM_API_KEY=sk-xxx node lab-run.mjs
//   可选: LLM_BASE_URL（默认 https://api.deepseek.com）、LLM_MODEL（默认 deepseek-chat）
// 提示词与测试材料都在本目录文件里，改完重跑即可。
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const KEY = process.env.LLM_API_KEY ?? process.env.DEEPSEEK_API_KEY;
if (!KEY) {
  console.error('fail fast: 请设置 LLM_API_KEY（或 DEEPSEEK_API_KEY）');
  process.exit(1);
}
const BASE = (process.env.LLM_BASE_URL ?? 'https://api.deepseek.com').replace(/\/$/, '');
const MODEL = process.env.LLM_MODEL ?? 'deepseek-chat';

const read = (f) => readFileSync(new URL(f, import.meta.url), 'utf8').trim();
const MATERIAL = read('./complaints.txt');
const V = { V0: read('./prompts/v0.txt'), V1: read('./prompts/v1.txt'), V2: read('./prompts/v2.txt') };
// 失败对照：V1 删掉格式段（模拟「随手改了一句」没跑回归）
V['V1删格式'] = V.V1.split('\n').filter((l) => !l.startsWith('格式')).join('\n');

const RUNS = { V0: 3, V1: 3, V2: 3, V1删格式: 2 };

async function callLLM(prompt) {
  const res = await fetch(`${BASE}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY}` },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: 'user', content: `${prompt}\n\n——\n用户投诉原文：\n${MATERIAL}` }],
    }),
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return { text: data.choices[0].message.content, usage: data.usage };
}

const results = { model: MODEL, time: new Date().toISOString(), runs: [] };
for (const [name, prompt] of Object.entries(V)) {
  for (let i = 1; i <= RUNS[name]; i++) {
    process.stdout.write(`${name} #${i} ... `);
    try {
      const { text, usage } = await callLLM(prompt);
      results.runs.push({ version: name, run: i, output: text, total_tokens: usage.total_tokens });
      console.log(`ok (${usage.total_tokens} tok)`);
    } catch (e) {
      console.log(`FAIL: ${e.message}`);
      results.runs.push({ version: name, run: i, error: e.message });
    }
    await new Promise((r) => setTimeout(r, 800));
  }
}
const out = existsSync(new URL('./results.json', import.meta.url)) ? './results.latest.json' : './results.json';
writeFileSync(new URL(out, import.meta.url), JSON.stringify(results, null, 2));
console.log(`\n完成: ${results.runs.filter((r) => !r.error).length}/${results.runs.length} 次成功 → ${out}`);
console.log('（results.json 是视频引用的历史留档，新跑的写在 results.latest.json，别覆盖）');
