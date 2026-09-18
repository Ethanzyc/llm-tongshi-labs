# agent-basics · 五十行写一个会自己干活的迷你 Agent

对应视频：《大模型通识05番外｜实操：五十行写个迷你 Agent》（父集 E05 Agent 基础）。

## 文件

| 文件 | 内容 |
|---|---|
| [`mini-agent.mjs`](mini-agent.mjs) | 迷你 Agent 本体：`think（模型决策）→ act（执行工具）→ 看（观察喂回）` 主循环 + 收尾判断 + 步数保险丝，核心实现 47 行 |
| [`agent-run.mjs`](agent-run.mjs) | 三场景实验：A 裸模型（没工具）/ B 迷你 Agent / C 丢观察 bug，原始轨迹留档 `results.json` |
| [`results.json`](results.json) | 2026-09-18 deepseek-chat 实跑留档（7 次调用，视频引用数字与此逐字一致） |

## 三个场景说的一件事

- **A 裸模型**：没有工具，模型三遍全部「我没法实时查询」——知识都在，没长手，给不出今晚的答案。
- **B 迷你 Agent**：同一个问题，三遍都是 `get_weather → get_air_quality` 两步收尾，答案里的天气/空气质量全是工具真值——模型自己决定调什么、调完自己收尾。
- **C 丢观察 bug**：工具结果不喂回对话，第二轮 API 直接 400 拒收——循环的每一环都要接牢。

## 快速开始

```bash
export LLM_API_KEY=sk-xxx        # 必填；LLM_BASE_URL / LLM_MODEL 可选
cd agent-basics
node mini-agent.mjs              # 直接跑一次主循环（文件底部有示例调用）
node agent-run.mjs               # 三场景 × 真跑，写 results.latest.json
```

## 通用约定

- **真跑真测**：`results.json` 是真实调用留档（含模型名与时间戳），视频引用与文件逐字一致。
- **可换模型**：走 OpenAI 兼容接口，`LLM_BASE_URL` / `LLM_MODEL` / `LLM_API_KEY` 三个环境变量换任意厂商复跑。
- **环境**：Node 18+（内置 `fetch`），无第三方依赖。
