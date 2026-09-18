// run-experiment.mjs —— 同一个功能 × 三种做法,原始代码与判分明细留档 results.json
// A 裸一句话需求 ×3:拿到代码就交 | B 全规格 ×3:契约+规则+验收全给 | C 缺接口契约的规格 ×1:看会塌哪一环
// 用法: LLM_API_KEY=sk-xxx node run-experiment.mjs
//   可选: LLM_BASE_URL(默认 https://api.deepseek.com)、LLM_MODEL(默认 deepseek-chat)
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { checkImpl, CASES } from './check-spec.mjs';

const BASE = (process.env.LLM_BASE_URL ?? 'https://api.deepseek.com').replace(/\/$/, '');
const MODEL = process.env.LLM_MODEL ?? 'deepseek-chat';
const KEY = process.env.LLM_API_KEY ?? process.env.DEEPSEEK_API_KEY;
if (!KEY) { console.error('fail fast: 请设置 LLM_API_KEY'); process.exit(1); }

const read = (f) => readFileSync(new URL(f, import.meta.url), 'utf8').trim();
const PROMPTS = { A: read('./prompts/a.txt'), B: read('./prompts/b.txt'), C: read('./prompts/c.txt') };
const RUNS = { A: 3, B: 3, C: 1 };

async function callLLM(prompt) {
  const res = await fetch(`${BASE}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY}` },
    body: JSON.stringify({ model: MODEL, messages: [{ role: 'user', content: prompt }], temperature: 0.7 }),
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  const text = (await res.json()).choices[0].message.content;
  const m = text.match(/```(?:javascript|js)?\s*([\s\S]*?)```/);
  return m ? m[1] : text; // 没有代码围栏就当整段是代码,交给验收跑器暴露问题
}

const results = { model: MODEL, time: new Date().toISOString(), cases: CASES.length, scenarios: {} };
mkdirSync(new URL('./runs/', import.meta.url), { recursive: true });

for (const [name, prompt] of Object.entries(PROMPTS)) {
  results.scenarios[name] = [];
  for (let i = 1; i <= RUNS[name]; i++) {
    process.stdout.write(`${name} #${i} ... `);
    const code = await callLLM(prompt);
    const file = new URL(`./runs/${name}_${i}.mjs`, import.meta.url).pathname;
    writeFileSync(file, code);
    const r = await checkImpl(file);
    results.scenarios[name].push({ run: i, file: `runs/${name}_${i}.mjs`, code, ...r });
    console.log(r.mounted ? `${r.passCount}/${CASES.length} 通过` : `挂载失败(${r.reason.slice(0, 40)})`);
    await new Promise((ok) => setTimeout(ok, 800));
  }
}

const out = existsSync(new URL('./results.json', import.meta.url)) ? './results.latest.json' : './results.json';
writeFileSync(new URL(out, import.meta.url), JSON.stringify(results, null, 2));
const sum = Object.entries(results.scenarios).map(([k, v]) => `${k}:${v.map((r) => (r.mounted ? r.passCount : '挂载失败')).join('/')}`).join('  ');
console.log(`\n完成 → ${out}\n通过数  ${sum}`);
console.log('（results.json 是视频引用的历史留档,新跑的写在 results.latest.json,别覆盖）');
