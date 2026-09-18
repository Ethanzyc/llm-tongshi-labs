// 回归判分：同批测试题多次采样，断言 类别/情绪等级/处理优先级 三字段逐条一致
// 用法: node check-regression.mjs  → 读 results.json，输出每版判定
import { readFileSync } from 'node:fs';

const results = JSON.parse(readFileSync(new URL('./results.json', import.meta.url), 'utf8'));

const FIELD_KEYS = ['类别', '情绪等级', '处理优先级'];
let exitCode = 0;

for (const version of [...new Set(results.runs.map((r) => r.version))]) {
  const runs = results.runs.filter((r) => r.version === version && !r.error);
  const parsed = runs.map((r, i) => {
    const m = r.output.match(/\[[\s\S]*\]/);
    if (!m) return { i, error: '未找到 JSON' };
    try {
      const arr = JSON.parse(m[0].replace(/```json|```/g, ''));
      return { i, items: new Map(arr.map((it) => [it.id, it])) };
    } catch {
      return { i, error: 'JSON 解析失败' };
    }
  });

  console.log(`\n== ${version}（${runs.length} 遍）`);
  if (parsed.some((p) => p.error)) {
    console.log(`  ❌ FAIL: ${parsed.filter((p) => p.error).map((p) => `第${p.i + 1}遍 ${p.error}`).join('；')}`);
    exitCode = 1;
    continue;
  }
  const ids = [...parsed[0].items.keys()];
  let pass = true;
  for (const id of ids) {
    for (const key of FIELD_KEYS) {
      const values = parsed.map((p) => p.items.get(id)?.[key]);
      if (new Set(values).size > 1) {
        console.log(`  ❌ 第 ${id} 条 ${key} 漂移: ${values.map((v, i) => `第${i + 1}遍=${v}`).join(' / ')}`);
        pass = false;
      }
    }
  }
  if (pass) console.log('  ✅ PASS: 三字段逐条一致');
}
process.exit(exitCode);
