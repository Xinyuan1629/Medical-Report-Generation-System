
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"
/**
 * 保存流程图
 */
export async function saveFlowchart(name: string, nodes: any[]) {
  const res = await fetch(`${API_URL}/api/flowcharts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, nodes }),
  })

  if (!res.ok) {
    throw new Error(`保存失败: ${res.status}`)
  }
  return await res.json()
}

/**
 * 获取所有流程图
 */
export async function getFlowcharts() {
  const res = await fetch(`${API_URL}/api/flowcharts`)
  if (!res.ok) {
    throw new Error(`获取流程图失败: ${res.status}`)
  }
  return await res.json()
}

/**
 * 根据名称获取单个流程图
 */
export async function getFlowchartByName(name: string) {
  const res = await fetch(`${API_URL}/api/flowcharts/${encodeURIComponent(name)}`)
  if (!res.ok) {
    throw new Error(`获取流程图失败: ${res.status}`)
  }
  return await res.json()
}

/**
 * 删除流程图
 */
export async function deleteFlowchart(name: string) {
  const res = await fetch(`${API_URL}/api/flowcharts/${encodeURIComponent(name)}`, {
    method: "DELETE",
  })
  if (!res.ok) {
    throw new Error(`删除失败: ${res.status}`)
  }
  return await res.json()
}

/**
 * 下载流程图 JSON（返回 JSON 对象）
 */
export async function downloadFlowchart(name: string) {
  const res = await fetch(`${API_URL}/api/flowcharts/${encodeURIComponent(name)}/download`)
  if (!res.ok) {
    throw new Error(`下载失败: ${res.status}`)
  }
  return await res.json()
}

/**
 * 生成诊断报告（流式 or 普通）
 */
export async function generateReport(patientInfo: any, flowchart: any) {
  const res = await fetch(`${API_URL}/api/generate-report`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ patientInfo, flowchart }),
  })

  if (!res.ok) {
    throw new Error(`生成报告失败: ${res.status}`)
  }
  return await res.json()
}

/**
 * 分析医学图像（使用 Qwen-VL 多模态模型）
 * @param images - base64 编码的图像数组 (data:image/xxx;base64,xxx 格式)
 * @param prompt - 可选的自定义提示词
 */
export async function analyzeImage(images: string[], prompt?: string) {
  const res = await fetch(`${API_URL}/api/analyze-image`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ images, prompt }),
  })

  if (!res.ok) {
    const errorText = await res.text()
    throw new Error(`图像分析失败: ${res.status} - ${errorText}`)
  }
  return await res.json()
}
