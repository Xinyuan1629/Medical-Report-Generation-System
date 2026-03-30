# 交互式医疗报告生成系统

本项目是一个前后端分离的医学报告生成平台，围绕 超声影像 + 流程图推理 + 结构化报告 三个核心模块构建。

系统目标：

1. 将图像分析、医学逻辑推理、文本报告生成串成统一工作流。
2. 支持交互式流程图编辑与节点级别可解释生成。
3. 让最终结论与建议以结构化格式呈现，而不是不可控大段文本。

---

## 目录结构

```text
app/
components/
	flowchart-builder.tsx           # 模块1：流程图编辑与可视化
	medical-report-system.tsx       # 三模块总控编排页
	medical-report-component.tsx    # 模块3：报告生成与结构化展示
	layout/
lib/
	api.ts                          # 前端 API 封装
public/
	svg/                            # 系统图标资源
server/
	flowchart_save.py               # 后端主服务（FastAPI + WebSocket）
	flowcharts.json                 # 流程图模板持久化
```

---

## 技术栈

- 前端：Next.js 14 + React 18 + TypeScript + Tailwind
- 后端：FastAPI + WebSocket + httpx
- 多模态模型：Qwen-VL（图像分析）
- 文本模型：Qwen-Plus（节点级报告生成）

---

## 快速启动

### 1) 启动后端

```bash
uvicorn server.flowchart_save:app --reload --host 0.0.0.0 --port 8000
```

### 2) 启动前端

```bash
npm install
npm run dev
```

默认前端调用地址为：

- http://127.0.0.1:8000

可通过环境变量覆盖：

```bash
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

---

## 三个核心模块（代码层 + 应用层）

## 模块一：智能诊断流程图（Flowchart）

对应代码：

- `components/flowchart-builder.tsx`

代码层实现：

1. 使用 Canvas 渲染节点与连线，支持 start/process/decision/end 四类节点。
2. 支持节点新增、删除、模板导入、流程图保存。
3. 通过 `onFlowchartChange` 回调将当前流程图实时同步给父组件。
4. 决策节点携带 `decisionData`，用于解释推理依据。

应用层价值：

1. 将医学诊断流程显式化，减少黑盒感。
2. 让医生可以“先定流程，再让 AI 按流程说话”。
3. 生成时逐节点高亮，用户可跟踪每一步推理。

---

## 模块二：诊断图像对比分析（Image Compare + VLM）

对应代码：

- `components/medical-report-system.tsx`
- `lib/api.ts`
- `server/flowchart_save.py` 中 `/api/analyze-image`

代码层实现：

1. 支持上传患者影像（base64）并展示标准对照图。
2. 前端调用 `analyzeImage(images)` 发送到后端。
3. 后端通过 Qwen-VL 生成医学影像描述，返回结构化文本。
4. 分析结果回灌到报告模块，驱动 findings 与临床诊断更新。

应用层价值：

1. 把图像结论自动转化为可读医学描述。
2. 形成“影像证据 -> 流程判断 -> 报告结论”的闭环。
3. 减少人工录入重复劳动，提高报告一致性。

---

## 模块三：AI 报告生成与结构化展示（Report Studio）

对应代码：

- `components/medical-report-component.tsx`
- `server/flowchart_save.py` 中 `/ws/generate-report` 与 `/api/generate-report`

代码层实现：

1. WebSocket 主链路：按节点流式生成，实时回传 node_json / node / done。
2. REST 兜底链路：当 WebSocket 异常时降级到 `/api/generate-report`。
3. 后端要求模型返回节点级 key-value（KV）JSON，并做容错解析。
4. 前端将每个节点结果渲染为“节点小标题 + 结论 + 依据”。
5. 个性化建议仅取结束节点（end）的 suggestions，避免建议重复。

应用层价值：

1. 报告不再是一大段文本，而是可追溯到节点的分段结论。
2. 结论来源清晰，便于审阅、追责和再编辑。
3. 建议集中在最终风险节点，临床阅读效率更高。

---

## 多智能体运用（当前实现与可扩展方向）

本项目采用 节点编排式多智能体 思路：虽然底层模型可复用同一大模型，但在职责上已拆分为多个“角色智能体”。

当前已实现的角色拆分：

1. 影像分析智能体（Vision Agent）
	 - 接口：`/api/analyze-image`
	 - 任务：将超声图像转化为医学描述证据。

2. 流程节点推理智能体（Node Reasoning Agent）
	 - 接口：`/ws/generate-report` 或 `/api/generate-report`
	 - 任务：针对每个流程节点生成结构化结论。

3. 结构化输出约束智能体（Schema Guard Agent）
	 - 位置：后端 `KV_OUTPUT_FORMAT` + `_normalize_node_kv`
	 - 任务：把模型输出约束并规范到可消费的 key-value 格式。

4. 报告汇总智能体（Report Aggregation Agent）
	 - 位置：前端 `buildConclusionAndSuggestions`
	 - 任务：汇总节点结论并提取最终建议（仅 end 节点）。

可扩展方向：

1. 将不同节点映射到不同专科模型（如影像、风险、建议）。
2. 增加“质控智能体”，对节点结果进行一致性校验。
3. 增加“审阅智能体”，生成可审计的证据链摘要。

---

## 关键接口

流程图相关：

- `POST /api/flowcharts` 保存流程图
- `GET /api/flowcharts` 获取流程图列表
- `GET /api/flowcharts/{name}` 获取单个流程图
- `DELETE /api/flowcharts/{name}` 删除流程图

图像与报告相关：

- `POST /api/analyze-image` 图像分析
- `POST /api/generate-report` 节点级报告生成（REST）
- `WS /ws/generate-report` 节点级报告生成（流式）
- `POST /api/reports` 保存报告

---

## 典型业务流程

1. 在流程图模块创建或导入诊断流程。
2. 上传患者影像并执行 AI 对比分析。
3. 点击 AI 智能生成，系统按节点逐步推理。
4. 前端同步高亮节点并展示节点级结论。
5. 最终在建议模块展示结束节点个性化建议。
6. 医生编辑/确认后保存报告。

---

## 注意事项

1. 生产环境请勿在代码中硬编码 API Key，建议通过环境变量注入。
2. 建议为 `/api/generate-report` 增加鉴权、限流与审计日志。
3. 医疗场景建议引入人工复核环节，模型结果不应直接替代临床诊断。

---

## License

仅用于学习、科研与内部演示。医疗实际应用请结合合规与临床规范进行二次开发与验证。
