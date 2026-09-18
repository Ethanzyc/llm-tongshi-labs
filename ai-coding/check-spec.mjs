// check-spec.mjs —— 验收跑器:对一份实现逐条跑规格里的 7 条验收用例,红绿灯。
// 用法: node check-spec.mjs <实现文件.mjs>
import { pathToFileURL } from 'node:url';

export const CASES = [
  { input: 'a,b,c', expect: ['a', 'b', 'c'], label: '基础三段' },
  { input: '"a,b",c', expect: ['a,b', 'c'], label: '引号内逗号' },
  { input: '"say ""hi""",x', expect: ['say "hi"', 'x'], label: '双写转义' },
  { input: 'a,,b', expect: ['a', '', 'b'], label: '空字段' },
  { input: 'one', expect: ['one'], label: '单字段' },
  { input: '"multi,tag",ok,"last"', expect: ['multi,tag', 'ok', 'last'], label: '混合引号' },
  { input: ',,', expect: ['', '', ''], label: '全空字段' },
];

export async function checkImpl(file) {
  let mod;
  try {
    mod = await import(pathToFileURL(file).href);
  } catch (e) {
    return { mounted: false, reason: `加载失败: ${String(e.message).slice(0, 120)}`, results: [], passCount: 0 };
  }
  const fn = mod.parseCsvLine;
  if (typeof fn !== 'function') {
    return { mounted: false, reason: `未按契约导出 parseCsvLine(实际导出: ${Object.keys(mod).join(',') || '无'})`, results: [], passCount: 0 };
  }
  const results = CASES.map((c) => {
    let got;
    try {
      got = fn(c.input);
    } catch (e) {
      got = `抛异常: ${String(e.message).slice(0, 60)}`;
    }
    return { label: c.label, input: c.input, expect: c.expect, got, pass: JSON.stringify(got) === JSON.stringify(c.expect) };
  });
  return { mounted: true, reason: '', results, passCount: results.filter((r) => r.pass).length };
}

// 直接命令行调用:node check-spec.mjs <file>
if (process.argv[1] && process.argv[1].endsWith('check-spec.mjs')) {
  const file = process.argv[2];
  if (!file) { console.error('用法: node check-spec.mjs <实现文件.mjs>'); process.exit(1); }
  const r = await checkImpl(file);
  if (!r.mounted) { console.log(`挂载失败: ${r.reason}`); process.exit(2); }
  for (const x of r.results) console.log(`${x.pass ? '✓' : '✗'} ${x.label}  ${x.pass ? '' : `got=${JSON.stringify(x.got)}`}`);
  console.log(`${r.passCount}/${CASES.length} 通过`);
  process.exit(r.passCount === CASES.length ? 0 : 3);
}
