// agent-run.mjs —— 同一个问题 × 三个场景,原始轨迹留档 results.json
// A 裸模型(没工具):干不干得了活 | B 迷你 Agent:真查不查、数真不真 | C 丢观察 bug:观察不喂回对话会怎样
// 用法: LLM_API_KEY=sk-xxx node agent-run.mjs
//   可选: LLM_BASE_URL(默认 https://api.deepseek.com)、LLM_MODEL(默认 deepseek-chat)
import { writeFileSync, existsSync } from 'node:fs';
import { runAgent, think } from './mini-agent.mjs';

const BASE = (process.env.LLM_BASE_URL ?? 'https://api.deepseek.com').replace(/\/$/, '');
const MODEL = process.env.LLM_MODEL ?? 'deepseek-chat';
const KEY = process.env.LLM_API_KEY ?? process.env.DEEPSEEK_API_KEY;
if (!KEY) { console.error('fail fast: 请设置 LLM_API_KEY'); process.exit(1); }

const QUESTION = '我今晚想去北京奥森公园跑步,帮我看看适不适合?';
const TRUTH = { condition: '小雨', temp_c: 14, wind_kmh: 18, aqi: 42, level: '优' }; // 工具真值=判分唯一依据

// 场景 A:不走 Agent,裸模型直接问(没有任何工具)
async function askBare() {
  const res = await fetch(`${BASE}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY}` },
    body: JSON.stringify({ model: MODEL, messages: [{ role: 'user', content: QUESTION }] }),
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  return (await res.json()).choices[0].message.content;
}

// 场景 C:经典 bug 实录——复用同一个 think,但工具的观察结果故意不喂回对话
async function runDropObservations() {
  const messages = [{ role: 'user', content: QUESTION }];
  for (let step = 1; step <= 8; step++) {
    const msg = await think(messages);
    messages.push(msg);
    if (!msg.tool_calls?.length) return { steps: step, outcome: '收尾' };
    // bug 就在这一行「没写」:act() 的观察结果没有 push 回 messages,模型永远看不到工具返回
  }
}

// 判分三断言(对单次 Agent 轨迹):①真查了 ②数是真的 ③停得下来
function gradeB(r) {
  const checks = {
    真查了: r.tools.length > 0,
    数是真的: r.answer.includes(String(TRUTH.temp_c)) || r.answer.includes(TRUTH.level),
    停得下来: r.steps <= 8,
  };
  return { verdict: Object.values(checks).every(Boolean) ? 'PASS' : 'FAIL', checks };
}

const results = { model: MODEL, time: new Date().toISOString(), question: QUESTION, truth: TRUTH, scenarios: {} };
results.scenarios.A_裸模型 = [];
for (let i = 1; i <= 3; i++) {
  process.stdout.write(`A 裸模型 #${i} ... `);
  const answer = await askBare();
  const gaveTruth = Object.values(TRUTH).some((v) => answer.includes(String(v))); // 三样真值一个都没出现=没干活
  results.scenarios.A_裸模型.push({ run: i, answer, 给出真值: gaveTruth });
  console.log(gaveTruth ? '竟然给了真数据?' : '给不出今晚的真实数据(只能反问/教你自己查)');
  await new Promise((r) => setTimeout(r, 800));
}

results.scenarios.B_迷你Agent = [];
for (let i = 1; i <= 3; i++) {
  process.stdout.write(`B 迷你Agent #${i} ... `);
  const r = await runAgent(QUESTION);
  const g = gradeB(r);
  results.scenarios.B_迷你Agent.push({ run: i, ...r, ...g });
  console.log(`${g.verdict} 工具:[${r.tools.join('→')}] 步数:${r.steps}`);
  await new Promise((r) => setTimeout(r, 800));
}

process.stdout.write('C 丢观察bug ... ');
try {
  const r = await runDropObservations();
  results.scenarios.C_丢观察 = { ...r, verdict: 'FAIL(循环空转,模型拿不到观察结果)' };
  console.log(`${r.steps} 步后收尾(异常)`);
} catch (e) {
  results.scenarios.C_丢观察 = { error: e.message.slice(0, 300), verdict: 'FAIL(丢观察:下一轮 API 直接拒收)' };
  console.log(`第二轮就崩: ${e.message.slice(0, 80)}`);
}

const out = existsSync(new URL('./results.json', import.meta.url)) ? './results.latest.json' : './results.json';
writeFileSync(new URL(out, import.meta.url), JSON.stringify(results, null, 2));
const b = results.scenarios.B_迷你Agent.filter((r) => r.verdict === 'PASS').length;
const a = results.scenarios.A_裸模型.filter((r) => r.给出真值).length;
console.log(`\n完成: A 给出真值 ${a}/3(预期 0) | B 场景 ${b}/3 PASS | C 实录 FAIL → ${out}`);
console.log('（results.json 是视频引用的历史留档,新跑的写在 results.latest.json,别覆盖）');
