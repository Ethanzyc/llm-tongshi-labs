// mini-agent.mjs —— 五十行代码,写一个会自己干活的迷你 Agent
// 循环只做三件事:想(模型决策) → 动(调工具拿真数据) → 看(观察结果接着想);
// 模型不再要工具,就收尾作答;步数上限是保险丝,防循环收不住。
// 用法: LLM_API_KEY=sk-xxx node mini-agent.mjs

const BASE = (process.env.LLM_BASE_URL ?? 'https://api.deepseek.com').replace(/\/$/, '');
const MODEL = process.env.LLM_MODEL ?? 'deepseek-chat';
const KEY = process.env.LLM_API_KEY ?? process.env.DEEPSEEK_API_KEY;
if (!KEY) { console.error('fail fast: 请设置 LLM_API_KEY'); process.exit(1); }

// 本地工具:真实可跑、返回确定数据(演示自带事实源)
const TOOLS = {
  get_weather: {
    description: '查询某城市实时天气',
    parameters: { city: { type: 'string', description: '城市名' } },
    call: ({ city }) => ({ city, condition: '小雨', temp_c: 14, wind_kmh: 18 }),
  },
  get_air_quality: {
    description: '查询某城市空气质量',
    parameters: { city: { type: 'string', description: '城市名' } },
    call: ({ city }) => ({ city, aqi: 42, level: '优' }),
  },
};
const toolSpecs = Object.entries(TOOLS).map(([name, t]) => ({
  type: 'function',
  function: { name, description: t.description,
    parameters: { type: 'object', properties: t.parameters, required: Object.keys(t.parameters) } },
}));
export { toolSpecs };

// 想:把对话交给模型,带上工具清单,由它决定下一步
export async function think(messages) {
  const res = await fetch(`${BASE}/chat/completions`, { method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY}` },
    body: JSON.stringify({ model: MODEL, messages, tools: toolSpecs }) });
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  return (await res.json()).choices[0].message;
}

// 动:执行模型点名的工具,把观察结果喂回对话
function act(toolCalls) {
  return toolCalls.map((c) => ({ role: 'tool', tool_call_id: c.id,
    content: JSON.stringify(TOOLS[c.function.name].call(JSON.parse(c.function.arguments))) }));
}

// 主循环:想 → 动 → 看,直到模型不再要工具(收尾判断);maxSteps 是保险丝
export async function runAgent(question, { maxSteps = 8, system = '' } = {}) {
  const messages = [
    ...(system ? [{ role: 'system', content: system }] : []),
    { role: 'user', content: question },
  ];
  const trace = [];
  for (let step = 1; step <= maxSteps; step++) {
    const msg = await think(messages);
    messages.push(msg);
    if (!msg.tool_calls?.length) return { answer: msg.content, tools: trace, steps: step };
    trace.push(...msg.tool_calls.map((c) => c.function.name));
    messages.push(...act(msg.tool_calls));
  }
  throw new Error(`跑了 ${maxSteps} 步还没收尾:保险丝触发,强停`);
}
