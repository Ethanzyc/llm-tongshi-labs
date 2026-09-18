# llm-tongshi-labs · 大模型通识 实操代码仓库

「大模型通识」系列（B站/抖音/视频号/小红书 @疯了再说）的**配套实操代码**：每支实操番外的真实脚本、提示词、测试材料与原始输出都放在这里——视频里跑的什么，仓库里就是什么。

## 目录

| 目录 | 对应内容 | 状态 |
|---|---|---|
| [`prompt-engineering/`](prompt-engineering/) | 《大模型通识04番外｜提示词工程实操》：V0/V1/V2 三版提示词 × 同批测试题 × 多遍采样 + 回归判分 | ✅ 可复跑 |

后续实验随番外更新（Hooks 防线 / Skills / Subagent / MCP 最小服务…）。

## 通用约定

- **真跑真测**：所有 `results*.json` 都是真实调用留档（含模型名与日期），视频引用的数字与文件逐字一致，不做示意图。
- **可换模型**：脚本走 OpenAI 兼容接口，`LLM_BASE_URL` / `LLM_MODEL` / `LLM_API_KEY` 三个环境变量即可换任意厂商复跑——欢迎自己验证「换个模型还漂不漂」。
- **环境**：Node 18+（用了内置 `fetch`），无第三方依赖。

## 快速开始

```bash
export LLM_API_KEY=sk-xxx        # 必填；LLM_BASE_URL / LLM_MODEL 可选
cd prompt-engineering
node lab-run.mjs                 # 三版提示词 × 4 条投诉 × 各 3 遍
node check-regression.mjs        # 回归判分：三字段逐条一致性断言
```

## License

[MIT](LICENSE)
