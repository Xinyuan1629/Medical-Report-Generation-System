from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import json
import os
import asyncio
import httpx
import logging
import uuid
import re
from datetime import datetime
from fastapi import WebSocket, WebSocketDisconnect

# 加载 .env 文件中的环境变量
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass  # python-dotenv 未安装，请手动设置环境变量或运行: pip install python-dotenv

logging.basicConfig(level=logging.INFO)

app = FastAPI()

# 内置基础提示词：与流程图一起组成最终 prompt
BASE_PROMPT = (
    "你是一个医学报告生成助手。请基于给定流程图与患者信息，"
    "生成严谨、清晰、结构化的中文医学报告文本。"
    "根据结点决策信息，简洁分析。"
    "最后针对患者情况提出个性化建议，不需要综合评估。只有给出建议时才可以出现“建议”一词。\n\n"
    "重要要求：\n"
    "1. 不要重复输出患者基本信息（姓名、性别、年龄、身高、体重、BMI等），这些信息已经在报告头部显示\n"
    "2. 不要生成报告标题或格式化头部\n"
    "3. 直接输出当前节点的分析内容\n"
    "4. 结束节点需给出详细的诊断结论和建议\n"
)

KV_OUTPUT_FORMAT = (
    "输出格式要求(必须严格遵守)：\n"
    "1. 只输出一个 JSON 对象，不要输出 markdown，不要输出解释文字\n"
    "2. 字段必须包含: node_id, node_label, node_type, summary, evidence, conclusion, suggestions\n"
    "3. 只有结束节点(end)允许填写 suggestions；其它节点 suggestions 必须为空数组\n"
    "4. suggestions 必须是字符串数组；没有建议时返回空数组\n"
    "4. 所有字段值使用中文\n"
    "JSON 模板如下：\n"
    "{\n"
    "  \"node_id\": \"当前节点id\",\n"
    "  \"node_label\": \"当前节点名称\",\n"
    "  \"node_type\": \"start/process/decision/end\",\n"
    "  \"summary\": \"该节点摘要\",\n"
    "  \"evidence\": \"判断依据\",\n"
    "  \"conclusion\": \"该节点结论\",\n"
    "  \"suggestions\": [\"建议1\", \"建议2\"]\n"
    "}\n"
)


def _extract_json_object(text: str):
    if not text:
        return None

    stripped = text.strip()
    try:
        obj = json.loads(stripped)
        if isinstance(obj, dict):
            return obj
    except Exception:
        pass

    fenced = re.search(r"```(?:json)?\s*(\{[\s\S]*\})\s*```", stripped)
    if fenced:
        candidate = fenced.group(1)
        try:
            obj = json.loads(candidate)
            if isinstance(obj, dict):
                return obj
        except Exception:
            pass

    start = stripped.find("{")
    end = stripped.rfind("}")
    if start != -1 and end != -1 and end > start:
        candidate = stripped[start:end + 1]
        try:
            obj = json.loads(candidate)
            if isinstance(obj, dict):
                return obj
        except Exception:
            return None
    return None


def _extract_field_loose(text: str, field: str):
    """Best-effort field extraction for malformed JSON-like model outputs."""
    if not text:
        return ""

    # Match: "field": "..." (supports escaped quotes in content)
    m = re.search(rf'"{field}"\s*:\s*"((?:\\.|[^"\\])*)"', text, flags=re.DOTALL)
    if not m:
        return ""

    raw = m.group(1)
    try:
        # Decode common JSON escapes
        return bytes(raw, "utf-8").decode("unicode_escape").strip()
    except Exception:
        return raw.strip()


def _extract_suggestions_loose(text: str):
    if not text:
        return []

    # Match: "suggestions": [ ... ]
    m = re.search(r'"suggestions"\s*:\s*\[([\s\S]*?)\]', text)
    if not m:
        return []

    inner = m.group(1)
    items = re.findall(r'"((?:\\.|[^"\\])*)"', inner)
    out = []
    for it in items:
        try:
            val = bytes(it, "utf-8").decode("unicode_escape").strip()
        except Exception:
            val = it.strip()
        if val:
            out.append(val)
    return out


def _normalize_node_kv(raw_text: str, node: dict):
    parsed = _extract_json_object(raw_text) or {}
    suggestions = parsed.get("suggestions", [])
    if isinstance(suggestions, str):
        suggestions = [suggestions]
    if not isinstance(suggestions, list):
        suggestions = []

    # If strict JSON parsing failed, try loose extraction from malformed JSON-like text.
    if not parsed and raw_text:
        parsed = {
            "node_id": _extract_field_loose(raw_text, "node_id"),
            "node_label": _extract_field_loose(raw_text, "node_label"),
            "node_type": _extract_field_loose(raw_text, "node_type"),
            "summary": _extract_field_loose(raw_text, "summary"),
            "evidence": _extract_field_loose(raw_text, "evidence"),
            "conclusion": _extract_field_loose(raw_text, "conclusion"),
            "suggestions": _extract_suggestions_loose(raw_text),
        }
        suggestions = parsed.get("suggestions", [])

    node_id = str(parsed.get("node_id") or node.get("id") or "")
    node_label = str(parsed.get("node_label") or node.get("label") or node_id)
    node_type = str(parsed.get("node_type") or node.get("type") or "")
    summary = str(parsed.get("summary") or "").strip()
    evidence = str(parsed.get("evidence") or "").strip()
    conclusion = str(parsed.get("conclusion") or "").strip()

    if not summary and raw_text:
        summary = raw_text.strip().split("\n")[0][:120]
    if not conclusion and raw_text:
        # Avoid showing full JSON blob when parsing is imperfect.
        if raw_text.strip().startswith("{") and '"node_id"' in raw_text:
            conclusion = ""
        else:
            conclusion = raw_text.strip()

    normalized_suggestions = [str(s).strip() for s in suggestions if str(s).strip()]
    if node_type != "end":
        normalized_suggestions = []

    return {
        "nodeId": node_id,
        "nodeLabel": node_label,
        "nodeType": node_type,
        "summary": summary,
        "evidence": evidence,
        "conclusion": conclusion,
        "suggestions": normalized_suggestions,
        "rawText": (raw_text or "").strip(),
    }

# CORS - 允许本地前端访问（根据需要调整 origins）
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(__file__)
FLOWCHART_FILE = os.path.join(BASE_DIR, "flowcharts.json")
REPO_DIR = os.path.abspath(os.path.join(BASE_DIR, os.pardir))
DEFAULT_MODEL_DIR = os.path.join(REPO_DIR, "CL", "models")
DEFAULT_IMAGE_DIR = os.path.join(REPO_DIR, "CL", "image")

# 确保存储文件存在
if not os.path.exists(FLOWCHART_FILE):
    with open(FLOWCHART_FILE, "w", encoding="utf-8") as f:
        json.dump([], f, ensure_ascii=False, indent=2)

reports_db = {}


@app.post('/api/reports')
async def create_report(request: Request):
    data = await request.json()
    report_id = str(uuid.uuid4())
    saved = {
        **data,
        "id": report_id,
        "createdAt": datetime.now().isoformat(),
    }
    reports_db[report_id] = saved
    return saved

#fail
@app.post("/api/flowcharts")
async def save_flowchart(request: Request):
    data = await request.json()
    name = data.get("name")
    nodes = data.get("nodes")

    if not name or not nodes:
        return JSONResponse({"error": "缺少流程图名称或节点数据"}, status_code=400)

    # 读取已有数据
    with open(FLOWCHART_FILE, "r", encoding="utf-8") as f:
        charts = json.load(f)

    # 检查是否已存在同名流程图 → 覆盖
    existing = next((c for c in charts if c["name"] == name), None)
    if existing:
        existing["nodes"] = nodes
    else:
        charts.append({"name": name, "nodes": nodes})

    # 写回文件
    with open(FLOWCHART_FILE, "w", encoding="utf-8") as f:
        json.dump(charts, f, ensure_ascii=False, indent=2)

    return {"message": "流程图保存成功", "name": name}


@app.get("/api/flowcharts")
async def list_flowcharts():
    with open(FLOWCHART_FILE, "r", encoding="utf-8") as f:
        charts = json.load(f)
    return charts


@app.get("/api/flowcharts/{name}")
async def get_flowchart(name: str):
    with open(FLOWCHART_FILE, "r", encoding="utf-8") as f:
        charts = json.load(f)
    chart = next((c for c in charts if c["name"] == name), None)
    if not chart:
        return JSONResponse({"error": "未找到流程图"}, status_code=404)
    return chart


@app.get("/api/flowcharts/{name}/download")
async def download_flowchart(name: str):
    with open(FLOWCHART_FILE, "r", encoding="utf-8") as f:
        charts = json.load(f)
    chart = next((c for c in charts if c["name"] == name), None)
    if not chart:
        return JSONResponse({"error": "未找到流程图"}, status_code=404)
    # 返回带附件头的 JSON，方便前端直接下载
    headers = {"Content-Disposition": f'attachment; filename="{name}.json"'}
    return JSONResponse(content=chart, headers=headers)


@app.delete("/api/flowcharts/{name}")
async def delete_flowchart(name: str):
    with open(FLOWCHART_FILE, "r", encoding="utf-8") as f:
        charts = json.load(f)
    idx = next((i for i, c in enumerate(charts) if c.get("name") == name), None)
    if idx is None:
        return JSONResponse({"error": "未找到流程图"}, status_code=404)
    # 删除并写回
    charts.pop(idx)
    with open(FLOWCHART_FILE, "w", encoding="utf-8") as f:
        json.dump(charts, f, ensure_ascii=False, indent=2)
    return {"message": "删除成功", "name": name}


# ==================== 图像分析 API ====================
# 使用 Qwen-VL 多模态视觉模型分析医学图像
MEDICAL_IMAGE_PROMPT = """你是一位专业的超声影像诊断医师。请仔细分析这张医学超声图像，并按照以下标准格式生成简洁的检查报告描述：

请按照以下结构描述：
1. **器官形态**：描述器官的形态、体积、包膜、边缘等
2. **实质回声**：描述回声的特征（均匀/不均匀、增强/减弱、颗粒状等）
3. **管道结构**：描述管道结构的显示情况（门静脉、肝静脉等）
4. **占位性病变**：描述是否存在占位性病变
5. **脂肪肝变分等级**：如果是肝脏超声图像，请根据回声特征判断脂肪肝变分等级（0-3级）

请用专业、严谨的医学术语描述，格式参考：
• 肝脏形态饱满，体积轻度增大（或正常），包膜光滑，边缘锐利。
• 肝实质回声弥漫性增强，呈细颗粒状，前场回声减弱，后场回声减弱，深部肝脏显示不清。
• 肝内管道结构（门静脉、肝静脉）显示模糊，管壁回声增强。
• 肝内未见明显占位性病变。
• 脂肪肝变分等级：2级脂肪肝。

如果图像不是医学超声图像，请说明无法识别。
结尾不要加入任何总结类话语，只针对以上几条逐一分析"""


@app.post('/api/analyze-image')
async def analyze_image(request: Request):
    """使用 Qwen-VL 多模态模型分析医学图像并生成报告描述
    
    Request JSON:
    - images: list of base64 encoded images (data:image/xxx;base64,xxx format)
    - prompt: optional custom prompt
    """
    body = await request.json()
    images = body.get('images', [])
    custom_prompt = body.get('prompt', '')
    
    if not images:
        return JSONResponse({'error': '请提供至少一张图像'}, status_code=400)
    
    api_key = os.environ.get("DASHSCOPE_API_KEY")
    if not api_key:
        return JSONResponse({'error': '请设置 DASHSCOPE_API_KEY 环境变量'}, status_code=500)
    
    # 使用 qwen-vl-plus多模态模型
    model_name = "qwen-vl-plus"
    url = "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    
    # 构建多模态消息内容
    content = []
    for img in images:
        # 支持 base64 格式的图片
        if img.startswith('data:image'):
            content.append({
                "type": "image_url",
                "image_url": {"url": img}
            })
        elif img.startswith('http'):
            content.append({
                "type": "image_url", 
                "image_url": {"url": img}
            })
    
    # 添加文本提示
    prompt_text = custom_prompt if custom_prompt else MEDICAL_IMAGE_PROMPT
    content.append({
        "type": "text",
        "text": prompt_text
    })
    
    payload = {
        "model": model_name,
        "messages": [
            {
                "role": "user",
                "content": content
            }
        ],
        "temperature": 0.2,
        "max_tokens": 1024,
    }
    
    logging.info(f"\n{'='*50}\n图像分析使用模型: {model_name} (Qwen-VL)\n{'='*50}")
    
    async with httpx.AsyncClient(timeout=120) as client:
        try:
            r = await client.post(url, headers=headers, json=payload)
            logging.info(f"Qwen-VL API response status: {r.status_code}")
            
            if r.status_code != 200:
                logging.error(f"Qwen-VL API error: {r.status_code} {r.text}")
                return JSONResponse({
                    'error': f'Qwen-VL API 错误: {r.status_code}',
                    'detail': r.text
                }, status_code=500)
            
            data = r.json()
            result_text = data["choices"][0]["message"]["content"]
            
            return {
                'success': True,
                'model': model_name,
                'description': result_text,
                'message': '图像分析完成'
            }
            
        except Exception as e:
            logging.exception("Qwen-VL API call failed")
            return JSONResponse({
                'error': f'图像分析失败: {str(e)}'
            }, status_code=500)


# fail 直接生成报告
@app.post('/api/generate-report')
async def generate_report(request: Request):
    """Generate report by reading flowchart nodes and calling AI per node.
    Request JSON should contain either `name` (to load saved flowchart) or `flowchart` object.
    Optionally include `model_config` to pass to AI.
    """
    body = await request.json() # 异步方法，暂停但不会阻塞整个程序
    name = body.get('name')
    flowchart = body.get('flowchart')
    model_config = body.get('model_config', {})
    patient_info = body.get('patientInfo')  # 患者基本信息（姓名、年龄、性别等）
    image_analysis_result = body.get('imageAnalysisResult', '')  # 图像分析结论
    extra_prompt = body.get('prompt')

    if not flowchart and not name:
        return JSONResponse({'error': '需要提供 flowchart 或 name'}, status_code=400)

    if name:
        # load from saved file
        with open(FLOWCHART_FILE, 'r', encoding='utf-8') as f:
            charts = json.load(f)
        chart = next((c for c in charts if c.get('name') == name), None)
        if not chart:
            return JSONResponse({'error': '未找到流程图'}, status_code=404)
        flowchart = chart

    nodes = flowchart.get('nodes', [])

    def build_final_prompt(node: dict | None) -> str:
        parts = [BASE_PROMPT]
        if extra_prompt:
            parts.append(f"附加指令:\n{extra_prompt}")
        
        # 添加患者基本信息
        if patient_info:
            patient_info_str = "患者基本信息:\n"
            if isinstance(patient_info, dict):
                for key, value in patient_info.items():
                    key_cn = {
                        'name': '姓名', 'gender': '性别', 'age': '年龄',
                        'height': '身高(cm)', 'weight': '体重(kg)', 'bmi': 'BMI',
                        'clinicalDiagnosis': '临床诊断'
                    }.get(key, key)
                    patient_info_str += f"- {key_cn}: {value}\n"
            else:
                patient_info_str += str(patient_info)
            parts.append(patient_info_str)
        
        # 添加图像分析结论（肝脏超声描述）
        if image_analysis_result:
            parts.append(f"肝脏图像分析结论（超声检查描述）:\n{image_analysis_result}")
        
        parts.append(f"流程图:\n{json.dumps(flowchart, ensure_ascii=False)}")
        
        if node:
            node_type = node.get('type', '')
            node_label = node.get('label', '')
            parts.append(f"当前节点:\n{json.dumps(node, ensure_ascii=False)}")
            
            # 根据节点类型给出不同的生成指导
            if node_type == 'start':
                parts.append(f"这是流程开始节点'{node_label}'，请生成检查开始的引导语，如：'开始进行肝脏超声检查分析...'")
            elif node_type == 'end':
                parts.append(f"这是流程结束节点'{node_label}'，请综合以上所有信息（患者BMI、超声图像特征、流程图判断结果），生成一段完整的诊断结论和建议。包括：1)诊断结果 2)病情分析 3)治疗/生活建议。不要只写一句话，要详细讨论。")
            elif node_type == 'decision':
                parts.append(f"这是判断节点'{node_label}'，请根据患者信息和图像分析结果，说明该节点的判断依据和结果。例如：'根据XXX指标，判断为XXX...'")
            elif node_type == 'process':
                parts.append(f"这是处理节点'{node_label}'，请说明该步骤的具体内容和结果。")
            else:
                parts.append(f"请根据节点'{node_label}'的功能，生成相应的报告内容。")
            if node_type != 'end':
                parts.append("当前节点不是结束节点：suggestions 必须返回空数组 []。")
        else:
            parts.append("请综合以上患者信息、图像分析结论和流程图逻辑，生成完整的医学诊断报告。报告应包含检查描述、影像学特征分析和诊断结论。")
        parts.append(KV_OUTPUT_FORMAT)
        return "\n\n".join(parts)
    
    async def call_qwen(prompt: str) -> str:
        model_name = "qwen-plus"
        logging.info(f"\n{'='*50}\n当前使用模型: {model_name} (DashScope/Qwen)\n{'='*50}")
        
        api_key = os.environ.get("DASHSCOPE_API_KEY")
        if not api_key:
            raise RuntimeError("请设置 DASHSCOPE_API_KEY 环境变量")

        # 使用 OpenAI 兼容接口（推荐）
        url = "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }

        payload = {
            "model": "qwen-plus",
            "messages": [
                {"role": "system", "content": "你是一个医学报告生成助手。"},
                {"role": "user", "content": prompt},
            ],
            "temperature": 0.2,
            "max_tokens": 512,
        }

        async with httpx.AsyncClient(timeout=120) as client:
            try:
                r = await client.post(url, headers=headers, json=payload)
                logging.info(f"Qwen API response status: {r.status_code}")
                if r.status_code != 200:
                    logging.error(f"Qwen API error: {r.status_code} {r.text}")
                    return f"[ERROR] Qwen API returned {r.status_code}: {r.text}"
                data = r.json()
                # OpenAI 兼容格式的响应
                return data["choices"][0]["message"]["content"]
            except Exception as e:
                logging.exception("Qwen API call failed")
                return f"[ERROR] Qwen API call failed: {str(e)}"


    # Simple AI POST request helper (uses REST API)
    async def call_openai(prompt: str) -> str:
        # Prefer model_config, fall back to environment variables
        api_key = model_config.get('api_key') or os.environ.get('AZURE_OPENAI_KEY')
        endpoint = model_config.get('azure_endpoint') or os.environ.get('AZURE_OPENAI_ENDPOINT')
        deployment = model_config.get('deployment') or os.environ.get('AZURE_OPENAI_DEPLOYMENT') or 'gpt-4o-mini'
        api_version = model_config.get('api_version') or os.environ.get('AZURE_OPENAI_API_VERSION') or '2025-01-01-preview'

        if not api_key or not endpoint:
            logging.info('No Azure OpenAI credentials provided; using DEMO fallback for prompt preview')
            return f"[DEMO] Generated text for prompt: {prompt[:120]}"

        url = f"{endpoint}/openai/deployments/{deployment}/chat/completions?api-version={api_version}"
        headers = {
            'api-key': api_key,
            'Content-Type': 'application/json'
        }
        payload = {
            'messages': [
                {'role': 'system', 'content': '你是一个医学报告生成助手。'},
                {'role': 'user', 'content': prompt}
            ],
            'max_tokens': model_config.get('max_tokens', 512),
            'temperature': model_config.get('temperature', 0.2)
        }

        async with httpx.AsyncClient(timeout=60.0) as client:
            r = await client.post(url, headers=headers, json=payload)
            if r.status_code != 200:
                logging.error('OpenAI API error %s %s', r.status_code, r.text)
                return f"[ERROR] OpenAI returned {r.status_code}: {r.text}"
            resp = r.json()
            # Extract simple reply text (depends on API shape)
            try:
                return resp['choices'][0]['message']['content']
            except Exception:
                return json.dumps(resp)

    results = []
    model_used = "qwen-plus"
    # iterate nodes sequentially and call model
    for node in nodes:
        prompt = build_final_prompt(node)
        text = await call_qwen(prompt)
        kv = _normalize_node_kv(text, node)
        results.append({'id': node.get('id'), 'text': text, 'kv': kv})

    logging.info(f"报告生成完成，使用模型: {model_used}")
    return {
        'name': flowchart.get('name', ''),
        'nodes': results,
        'model': model_used,
        'summary': f'生成完成 (模型: {model_used})'
    }

# 实时 流式生成医学报告
# 持久连接、逐点处理、实时推送
@app.websocket('/ws/generate-report')
async def websocket_generate_report(ws: WebSocket):
    await ws.accept()
    try:
        text = await ws.receive_text()
        payload = json.loads(text)
        name = payload.get('name')
        model_config = payload.get('model_config', {})
        patient_info = payload.get('patientInfo')  # 患者基本信息
        image_analysis_result = payload.get('imageAnalysisResult', '')  # 图像分析结论
        extra_prompt = payload.get('prompt')
        flowchart = payload.get('flowchart')  # 支持直接传入 flowchart 对象

        if name:
            # 从 flowcharts.json 里查找
            with open(FLOWCHART_FILE, 'r', encoding='utf-8') as f:
                charts = json.load(f)
            flowchart = next((c for c in charts if c.get('name') == name), None)
            if not flowchart:
                await ws.send_text(json.dumps({'type': 'error', 'message': '未找到流程图'}))
                await ws.close()
                return
        elif not flowchart:
            # 既没有 name 也没有 flowchart
            await ws.send_text(json.dumps({'type': 'error', 'message': '需要提供流程图名称或数据'}))
            await ws.close()
            return

        nodes = flowchart.get('nodes', [])

        def build_final_prompt(node: dict | None) -> str:
            parts = [BASE_PROMPT]
            if extra_prompt:
                parts.append(f"附加指令:\n{extra_prompt}")
            
            # 添加患者基本信息
            if patient_info:
                patient_info_str = "患者基本信息:\n"
                if isinstance(patient_info, dict):
                    for key, value in patient_info.items():
                        key_cn = {
                            'name': '姓名', 'gender': '性别', 'age': '年龄',
                            'height': '身高(cm)', 'weight': '体重(kg)', 'bmi': 'BMI',
                            'clinicalDiagnosis': '临床诊断'
                        }.get(key, key)
                        patient_info_str += f"- {key_cn}: {value}\n"
                else:
                    patient_info_str += str(patient_info)
                parts.append(patient_info_str)
            
            # 添加图像分析结论（肝脏超声描述）
            if image_analysis_result:
                parts.append(f"肝脏图像分析结论（超声检查描述）:\n{image_analysis_result}")
            
            parts.append(f"流程图:\n{json.dumps(flowchart, ensure_ascii=False)}")
            
            if node:
                node_type = node.get('type', '')
                node_label = node.get('label', '')
                parts.append(f"当前节点:\n{json.dumps(node, ensure_ascii=False)}")
                
                # 根据节点类型给出不同的生成指导
                if node_type == 'start':
                    parts.append(f"这是流程开始节点'{node_label}'，请生成检查开始的引导语，如：'开始进行肝脏超声检查分析...'")
                elif node_type == 'end':
                    parts.append(f"这是流程结束节点'{node_label}'，请综合以上所有信息（患者BMI、超声图像特征、流程图判断结果），生成一段完整的诊断结论和建议。包括：1)诊断结果 2)病情分析 3)治疗/生活建议。不要只写一句话，要详细讨论。")
                elif node_type == 'decision':
                    parts.append(f"这是判断节点'{node_label}'，请根据患者信息和图像分析结果，说明该节点的判断依据和结果。例如：'根据XXX指标，判断为XXX...'")
                elif node_type == 'process':
                    parts.append(f"这是处理节点'{node_label}'，请说明该步骤的具体内容和结果。")
                else:
                    parts.append(f"请根据节点'{node_label}'的功能，生成相应的报告内容。")
                if node_type != 'end':
                    parts.append("当前节点不是结束节点：suggestions 必须返回空数组 []。")
            else:
                parts.append("请综合以上患者信息、图像分析结论和流程图逻辑，生成完整的医学诊断报告。报告应包含检查描述、影像学特征分析和诊断结论。")
            parts.append(KV_OUTPUT_FORMAT)
            return "\n\n".join(parts)

        async def call_qwen_ws(prompt: str) -> str:
            """使用 Qwen API 生成报告（WebSocket 版本）"""
            model_name = "qwen-plus"
            logging.info(f"\n{'='*50}\n[WebSocket] 当前使用模型: {model_name} (DashScope/Qwen)\n{'='*50}")
            
            api_key = os.environ.get("DASHSCOPE_API_KEY")
            if not api_key:
                logging.error('请设置 DASHSCOPE_API_KEY 环境变量')
                return "[ERROR] 请设置 DASHSCOPE_API_KEY 环境变量"

            # 使用 OpenAI 兼容接口
            url = "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions"
            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            }
            payload = {
                "model": "qwen-plus",
                "messages": [
                    {"role": "system", "content": "你是一个医学报告生成助手。"},
                    {"role": "user", "content": prompt},
                ],
                "temperature": model_config.get('temperature', 0.2),
                "max_tokens": model_config.get('max_tokens', 512),
            }

            async with httpx.AsyncClient(timeout=120.0) as client:
                try:
                    r = await client.post(url, headers=headers, json=payload)
                    logging.info(f"Qwen WS API response status: {r.status_code}")
                    if r.status_code != 200:
                        logging.error(f"Qwen WS API error: {r.status_code} {r.text}")
                        return f"[ERROR] Qwen API returned {r.status_code}: {r.text}"
                    resp = r.json()
                    return resp['choices'][0]['message']['content']
                except Exception as e:
                    logging.exception("Qwen WS API call failed")
                    return f"[ERROR] Qwen API call failed: {str(e)}"

        # sequentially process nodes and push results
        for node in nodes:
            # Notify front-end about the node JSON so it can highlight immediately
            try:
                await ws.send_text(json.dumps({'type': 'node_json', 'id': node.get('id'), 'node': node}))
            except Exception:
                logging.exception('Failed to send node_json')

            # small pause to allow front-end to update highlight before generation starts
            await asyncio.sleep(0.05)

            prompt = build_final_prompt(node)
            text_out = await call_qwen_ws(prompt)
            kv = _normalize_node_kv(text_out, node)
            msg = {'type':'node','id':node.get('id'),'text':text_out,'node':node, 'kv': kv}
            await ws.send_text(json.dumps(msg))
            # small delay between nodes
            await asyncio.sleep(0.1)

        await ws.send_text(json.dumps({'type':'done'}))
        await ws.close()

    except WebSocketDisconnect:
        return
