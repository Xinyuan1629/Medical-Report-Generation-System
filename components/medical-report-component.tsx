"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"

interface PatientInfo {
  name: string
  gender: string
  age: number
  height: number  // 身高（cm）
  weight: number  // 体重（kg）
  bmi: string     // BMI（根据身高体重自动计算）
  clinicalDiagnosis: string  // 临床诊断（由结论自动填充）
}

interface MedicalReport {
  id?: string
  patientInfo: PatientInfo
  examDescription: string
  findings: string[]
  conclusion: string
  suggestions: string  // 建议模块
  createdAt?: string
}

interface MedicalReportComponentProps {
  flowchart: {
    name?: string
    nodes: Array<{
      id: string
      type: string
      label: string
      decisionData?: any
    }>
  }
  highlightedParagraph?: string | null
  onParagraphClick?: (paragraphId: string) => void
  imageAnalysisResult?: string  // 图像分析结果，用于更新 findings
}

export default function MedicalReportComponent({
  flowchart,
  highlightedParagraph,
  onParagraphClick,
  imageAnalysisResult,
}: MedicalReportComponentProps) {
  const [report, setReport] = useState<MedicalReport>({
    patientInfo: {
      name: "XXX",
      gender: "男/女",
      age: 0,
      height: 170,   // 默认身高 cm
      weight: 70,    // 默认体重 kg
      bmi: "24.22",  // 默认BMI
      clinicalDiagnosis: "待诊断",  // 由结论自动填充
    },
    examDescription: "超声检查描述",
    findings: [
      "肝脏形态饱满，体积轻度增大（或正常），包膜光滑，边缘锐利。",
      "肝实质回声弥漫性增强，呈细颗粒状，前场回声减弱，后场回声减弱，深部肝脏显示不清。",
      "肝内管道结构（门静脉、肝静脉）显示模糊，管壁回声增强。",
      "肝内未见明显占位性病变。",
      "彩色多普勒血流显像（CDFI）：肝内血流信号显示减少，门静脉血流速度正常（可补充具体数值，如XX cm/s）。",
    ],
    conclusion: "",
    suggestions: "",  // 建议初始为空
  })

  const [isEditing, setIsEditing] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState("")
  const [isConclusionCollapsed, setIsConclusionCollapsed] = useState(false)  // 结论收起状态

  // 将 Markdown 转换为 HTML（保留样式效果）
  const markdownToHtml = (text: string): string => {
    return text
      // 转换标题 ### -> <strong>
      .replace(/^###\s*(.+)$/gm, '<strong class="text-base font-semibold block mt-2">$1</strong>')
      .replace(/^##\s*(.+)$/gm, '<strong class="text-lg font-semibold block mt-3">$1</strong>')
      .replace(/^#\s*(.+)$/gm, '<strong class="text-xl font-bold block mt-3">$1</strong>')
      // 转换加粗 **text** -> <strong>
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/__(.+?)__/g, '<strong>$1</strong>')
      // 转换斜体 *text* -> <em>
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/_(.+?)_/g, '<em>$1</em>')
      // 转换行内代码 `code` -> <code>
      .replace(/`(.+?)`/g, '<code class="bg-[color-mix(in_srgb,var(--brand-cream)_75%,white)] px-1 rounded">$1</code>')
      // 移除项目符号但保留内容
      .replace(/^[\-\*•]\s*/gm, '')
      // 移除数字列表符号但保留内容
      .replace(/^\d+\.\s*/gm, '')
      // 换行转为 <br>
      .replace(/\n/g, '<br/>')
      .trim()
  }

  // 清理 Markdown 用于存储到 findings 数组（保留文本内容）
  const cleanMarkdownForStorage = (text: string): string => {
    return text
      .replace(/^#{1,6}\s*/gm, '')
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/__(.+?)__/g, '$1')
      .replace(/\*(.+?)\*/g, '$1')
      .replace(/_(.+?)_/g, '$1')
      .replace(/`(.+?)`/g, '$1')
      .replace(/^[\-\*•]\s*/gm, '')
      .replace(/^\d+\.\s*/gm, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  }

  // 当图像分析结果变化时，更新检查发现 (findings) 和临床诊断
  useEffect(() => {
    if (imageAnalysisResult && imageAnalysisResult.trim() && !imageAnalysisResult.startsWith('[ERROR]')) {
      // 清理 Markdown 格式用于存储
      const cleanedResult = cleanMarkdownForStorage(imageAnalysisResult)
      
      // 将分析结果按行分割，过滤空行，生成 findings 数组
      const lines = cleanedResult
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        // 过滤掉标题类行（如"肝脏："这样的单独标题）
        .filter(line => line.length > 5 || !line.endsWith('：'))
      
      // 提取脂肪肝变分等级作为临床诊断
      let fattyLiverGrade = ""
      const gradePatterns = [
        /脂肪肝变分等级[：:]\s*(.+)/i,
        /脂肪肝分级[：:]\s*(.+)/i,
        /(\d+级脂肪肝)/i,
        /(轻度|中度|重度)脂肪肝/i,
      ]
      
      for (const line of lines) {
        for (const pattern of gradePatterns) {
          const match = line.match(pattern)
          if (match) {
            // 去掉标点符号
            fattyLiverGrade = (match[1] || match[0]).replace(/[。，、；：！？.,;:!?]/g, '').trim()
            break
          }
        }
        if (fattyLiverGrade) break
      }
      
      if (lines.length > 0) {
        setReport(prev => ({
          ...prev,
          findings: lines,
          // 如果提取到脂肪肝等级，更新临床诊断
          ...(fattyLiverGrade ? {
            patientInfo: {
              ...prev.patientInfo,
              clinicalDiagnosis: fattyLiverGrade,
            }
          } : {})
        }))
      }
    }
  }, [imageAnalysisResult])

  // 计算BMI的函数
  const calculateBMI = (height: number, weight: number): string => {
    if (height <= 0 || weight <= 0) return "0.00"
    const heightInMeters = height / 100
    const bmi = weight / (heightInMeters * heightInMeters)
    return bmi.toFixed(2)
  }

  // 当身高或体重变化时，自动计算BMI
  useEffect(() => {
    const { height, weight } = report.patientInfo
    const newBmi = calculateBMI(height, weight)
    if (newBmi !== report.patientInfo.bmi) {
      setReport(prev => ({
        ...prev,
        patientInfo: {
          ...prev.patientInfo,
          bmi: newBmi,
        },
      }))
    }
  }, [report.patientInfo.height, report.patientInfo.weight])

  // 当结论变化时，自动填充临床诊断
  useEffect(() => {
    if (report.conclusion && report.conclusion.trim()) {
      // 提取结论中的关键诊断信息作为临床诊断
      // 简化处理：取结论的前50个字符或第一句话
      let diagnosis = report.conclusion.trim()
      // 尝试提取第一句话
      const firstSentence = diagnosis.match(/^[^。！？\n]+[。！？]?/)
      if (firstSentence) {
        diagnosis = firstSentence[0]
      }
      // 限制长度
      if (diagnosis.length > 50) {
        diagnosis = diagnosis.substring(0, 50) + "..."
      }
      
      setReport(prev => ({
        ...prev,
        patientInfo: {
          ...prev.patientInfo,
          clinicalDiagnosis: diagnosis,
        },
      }))
    }
  }, [report.conclusion])

  // const paragraphSections = {
  //   "patient-info": "患者信息",
  //   "examination-method": "检查方法",
  //   "lab-results": "实验室结果",
  //   "diagnosis-section": "诊断发现",
  //   "report-generation": "报告生成",
  //   conclusion: "结论",
  // }

  const getParagraphClass = (sectionId: string) => {
    const baseClass = "transition-all duration-300 cursor-pointer rounded-lg"
    if (highlightedParagraph === sectionId) {
      return `${baseClass} panel-highlight pl-4 shadow-md`
    }
    return `${baseClass} hover:bg-[color-mix(in_srgb,var(--brand-cream)_70%,white)]`
  }

  const handleParagraphClick = (sectionId: string) => {
    if (onParagraphClick) {
      onParagraphClick(sectionId)
    }
  }

  // 调用真实 Qwen API 生成报告
  const generateAIReport = async () => {
    setIsGenerating(true)
    setGenerationProgress("正在连接服务器...")

    // 检查 flowchart 是否存在
    if (!flowchart || !flowchart.nodes || flowchart.nodes.length === 0) {
      setGenerationProgress("错误：没有流程图数据，请先创建或加载流程图")
      setIsGenerating(false)
      return
    }

    try {
      const base = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"
      const wsUrl = base.replace(/^http/, "ws") + "/ws/generate-report"
      
      const ws = new WebSocket(wsUrl)
      
      ws.onopen = () => {
        setGenerationProgress("已连接，正在发送请求...")
        // 开始生成前清空结论和建议
        setReport(prev => ({ ...prev, conclusion: "", suggestions: "" }))
        
        // 发送流程图数据 - 如果有 name 就用 name，否则发送整个 flowchart
        const payload: any = {
          model_config: {
            temperature: 0.2,
            max_tokens: 512,
          },
          // 添加患者基本信息
          patientInfo: report.patientInfo,
          // 添加图像分析结论
          imageAnalysisResult: imageAnalysisResult || "",
        }
        
        if (flowchart?.name) {
          payload.name = flowchart.name
        } else if (flowchart?.nodes && flowchart.nodes.length > 0) {
          // 直接发送 flowchart 对象
          payload.flowchart = flowchart
        } else {
          setGenerationProgress("错误：没有流程图数据")
          setIsGenerating(false)
          ws.close()
          return
        }
        
        ws.send(JSON.stringify(payload))
      }

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data)
          
          if (msg.type === "error") {
            setGenerationProgress(`错误: ${msg.message}`)
            setIsGenerating(false)
            ws.close()
            return
          }
          
          if (msg.type === "node_json") {
            // 节点开始处理
            if (onParagraphClick && msg.id) {
              onParagraphClick(msg.id)
            }
            setGenerationProgress(`正在生成节点: ${msg.node?.label || msg.id}...`)
          }
          
          if (msg.type === "node") {
            // 节点生成完成
            if (onParagraphClick && msg.id) {
              onParagraphClick(msg.id)
            }
            
            // 累积所有节点的结果
            setReport(prev => {
              const newReport = { ...prev }
              if (msg.text && !msg.text.startsWith("[ERROR]")) {
                const nodeLabel = msg.node?.label || msg.id
                
                // 检查是否包含建议内容，用多种关键词匹配
                const suggestionPatterns = [
                  /建议如下[：:]([\s\S]*)/,
                  /诊疗建议[：:]([\s\S]*)/,
                  /治疗建议[：:]([\s\S]*)/,
                  /生活建议[：:]([\s\S]*)/,
                  /(\d+[.、]\s*建议[\s\S]*)/,
                  /(建议：[\s\S]*)/,
                ]
                
                let suggestionText = ""
                let conclusionText = msg.text
                
                // 尝试匹配建议内容
                for (const pattern of suggestionPatterns) {
                  const match = msg.text.match(pattern)
                  if (match) {
                    suggestionText = match[0]
                    conclusionText = msg.text.replace(match[0], "").trim()
                    break
                  }
                }
                
                // 如果没匹配到但包含"建议"关键词，尝试从"建议"开始截取
                if (!suggestionText && msg.text.includes("建议")) {
                  const suggestionIndex = msg.text.indexOf("建议")
                  // 往前找一个换行符或句号作为分割点
                  let startIndex = suggestionIndex
                  for (let i = suggestionIndex - 1; i >= 0; i--) {
                    if (msg.text[i] === '\n' || msg.text[i] === '。' || msg.text[i] === '：' || msg.text[i] === ':') {
                      startIndex = i + 1
                      break
                    }
                    if (suggestionIndex - i > 10) break // 最多往前找10个字符
                  }
                  suggestionText = msg.text.substring(startIndex).trim()
                  conclusionText = msg.text.substring(0, startIndex).trim()
                }
                
                // 添加结论部分
                if (conclusionText) {
                  const separator = newReport.conclusion ? "\n\n" : ""
                  newReport.conclusion = (newReport.conclusion || "") + separator + `【${nodeLabel}】\n${conclusionText}`
                }
                
                // 添加建议部分
                if (suggestionText) {
                  const suggestionSeparator = newReport.suggestions ? "\n\n" : ""
                  newReport.suggestions = (newReport.suggestions || "") + suggestionSeparator + suggestionText
                }
              }
              return newReport
            })
            
            setGenerationProgress(`节点 ${msg.id} 生成完成`)
          }

          if (msg.type === "done") {
            setIsGenerating(false)
            setGenerationProgress("生成完成！")
            setTimeout(() => setGenerationProgress(""), 2000)
            ws.close()
          }
        } catch (e) {
          console.error("解析消息失败:", e)
        }
      }
      
      ws.onerror = (error) => {
        console.error("WebSocket 错误:", error)
        setGenerationProgress("连接错误，尝试使用 REST API...")
        ws.close()
        // 降级到 REST API
        generateAIReportRest()
      }
      
      ws.onclose = () => {
        if (isGenerating) {
          setIsGenerating(false)
        }
      }
      
    } catch (error) {
      console.error("生成报告失败:", error)
      setGenerationProgress("生成失败")
      setIsGenerating(false)
    }
  }
  
  // REST API 降级方案
  const generateAIReportRest = async () => {
    try {
      const base = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"
      const payload: any = {
        model_config: { temperature: 0.2, max_tokens: 512 },
        // 添加患者基本信息
        patientInfo: report.patientInfo,
        // 添加图像分析结论
        imageAnalysisResult: imageAnalysisResult || "",
      }
      
      if (flowchart?.name) {
        payload.name = flowchart.name
      } else if (flowchart?.nodes) {
        payload.flowchart = flowchart
      } else {
        setGenerationProgress("错误：没有流程图数据")
        setIsGenerating(false)
        return
      }
      
      const resp = await fetch(`${base}/api/generate-report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      
      if (!resp.ok) {
        throw new Error(await resp.text())
      }
      
      const data = await resp.json()
      
      // 更新报告
      if (data.nodes && data.nodes.length > 0) {
        const generatedText = data.nodes.map((n: any) => n.text).join("\n\n")
        setReport(prev => ({
          ...prev,
          conclusion: generatedText,
        }))
      }
      
      setGenerationProgress(`生成完成 (模型: ${data.model || "qwen-plus"})`)
      setTimeout(() => setGenerationProgress(""), 3000)
      
    } catch (error) {
      console.error("REST API 失败:", error)
      setGenerationProgress("生成失败")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleFieldEdit = (field: string, value: string) => {
    if (field.startsWith("patientInfo.")) {
      const subField = field.split(".")[1]
      setReport((prev) => ({
        ...prev,
        patientInfo: {
          ...prev.patientInfo,
          [subField]: value,
        },
      }))
    } else {
      setReport((prev) => ({
        ...prev,
        [field]: value,
      }))
    }
  }

  const handleFindingEdit = (index: number, value: string) => {
    setReport((prev) => ({
      ...prev,
      findings: prev.findings.map((finding, i) => (i === index ? value : finding)),
    }))
  }

  const addFinding = () => {
    setReport((prev) => ({
      ...prev,
      findings: [...prev.findings, "新的检查发现..."],
    }))
  }

  const removeFinding = (index: number) => {
    setReport((prev) => ({
      ...prev,
      findings: prev.findings.filter((_, i) => i !== index),
    }))
  }

  const saveReport = async () => {
    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(report),
      })

      if (response.ok) {
        const savedReport = await response.json()
        setReport(savedReport)
        setIsEditing(false)
        console.log("Report saved successfully")
      }
    } catch (error) {
      console.error("Error saving report:", error)
    }
  }

  return (
    <Card className="w-full h-full panel-surface flex flex-col">
      <CardHeader>
        <CardTitle className="text-xl font-bold">超声医学检查报告</CardTitle>
        <div className="flex justify-end space-x-2">
          <Button variant="outline" size="sm" onClick={generateAIReport} disabled={isGenerating}>
            {isGenerating ? "AI生成中..." : "AI智能生成"}
          </Button>
          <Button variant={isEditing ? "default" : "outline"} size="sm" onClick={() => setIsEditing(!isEditing)}>
            {isEditing ? "完成编辑" : "编辑报告"}
          </Button>
          {isEditing && (
            <Button size="sm" onClick={saveReport}>
              保存报告
            </Button>
          )}
        </div>
        {isGenerating && (
          <div className="mt-2 p-2 panel-soft rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[var(--brand-iris)]"></div>
              <span className="text-sm text-[var(--brand-iris)]">{generationProgress}</span>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-6 flex-1 overflow-y-auto pr-2">
        {/* Patient Information */}
        <div className={getParagraphClass("patient-info")} onClick={() => handleParagraphClick("patient-info")}>
          <div className="grid grid-cols-2 gap-4 p-4 panel-soft rounded-lg">
            <div className="space-y-2">
              <label className="text-sm font-medium">姓名：</label>
              {isEditing ? (
                <Input
                  value={report.patientInfo.name}
                  onChange={(e) => handleFieldEdit("patientInfo.name", e.target.value)}
                  className="h-8"
                />
              ) : (
                <span>{report.patientInfo.name}</span>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">性别：</label>
              {isEditing ? (
                <Input
                  value={report.patientInfo.gender}
                  onChange={(e) => handleFieldEdit("patientInfo.gender", e.target.value)}
                  className="h-8"
                />
              ) : (
                <span>{report.patientInfo.gender}</span>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">年龄：</label>
              {isEditing ? (
                <Input
                  type="number"
                  value={report.patientInfo.age}
                  onChange={(e) => handleFieldEdit("patientInfo.age", e.target.value)}
                  className="h-8"
                />
              ) : (
                <span>{report.patientInfo.age}岁</span>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">身高：</label>
              {isEditing ? (
                <Input
                  type="number"
                  value={report.patientInfo.height}
                  onChange={(e) => handleFieldEdit("patientInfo.height", e.target.value)}
                  className="h-8"
                  placeholder="cm"
                />
              ) : (
                <span>{report.patientInfo.height} cm</span>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">体重：</label>
              {isEditing ? (
                <Input
                  type="number"
                  value={report.patientInfo.weight}
                  onChange={(e) => handleFieldEdit("patientInfo.weight", e.target.value)}
                  className="h-8"
                  placeholder="kg"
                />
              ) : (
                <span>{report.patientInfo.weight} kg</span>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">BMI：</label>
              <span className={`font-medium ${
                parseFloat(report.patientInfo.bmi) < 18.5 ? 'text-[var(--brand-iris)]' :
                parseFloat(report.patientInfo.bmi) < 24 ? 'text-[var(--brand-lilac)]' :
                parseFloat(report.patientInfo.bmi) < 28 ? 'text-[var(--brand-mist)]' : 'text-[var(--brand-iris)]'
              }`}>
                {report.patientInfo.bmi}
                {parseFloat(report.patientInfo.bmi) < 18.5 && ' (偏瘦)'}
                {parseFloat(report.patientInfo.bmi) >= 18.5 && parseFloat(report.patientInfo.bmi) < 24 && ' (正常)'}
                {parseFloat(report.patientInfo.bmi) >= 24 && parseFloat(report.patientInfo.bmi) < 28 && ' (超重)'}
                {parseFloat(report.patientInfo.bmi) >= 28 && ' (肥胖)'}
              </span>
            </div>

            {/* <div className="space-y-2 col-span-2">
              <label className="text-sm font-medium">临床诊断：</label>
              <span className="text-gray-700">{report.patientInfo.clinicalDiagnosis || "由结论自动填充"}</span>
              <span className="text-xs text-gray-400 ml-2">(自动根据结论生成)</span>
            </div> */}
          </div>
        </div>

        {/* Exam Description */}
        <div
          className={getParagraphClass("examination-method")}
          onClick={() => handleParagraphClick("examination-method")}
        >
          <div className="space-y-2 p-3 rounded-lg">
            <label className="text-sm font-medium text-center block">
              {isEditing ? (
                <Input
                  value={report.examDescription}
                  onChange={(e) => handleFieldEdit("examDescription", e.target.value)}
                  className="text-center font-medium"
                />
              ) : (
                report.examDescription
              )}
            </label>
          </div>
        </div>

        <hr className="border-[color-mix(in_srgb,var(--brand-iris)_25%,var(--brand-cream))]" />

        {/* Findings */}
        <div
          className={getParagraphClass("diagnosis-section")}
          onClick={() => handleParagraphClick("diagnosis-section")}
        >
          <div className="space-y-4 p-3 rounded-lg">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">肝脏图像分析：</h3>
              {isEditing && (
                <Button size="sm" variant="outline" onClick={addFinding}>
                  添加发现
                </Button>
              )}
            </div>

            <div className="space-y-3">
              {report.findings.map((finding, index) => (
                <div key={index} className="flex items-start">
                  <div className="flex-1">
                    {isEditing ? (
                      <div className="flex items-center space-x-2">
                        <Textarea
                          value={finding}
                          onChange={(e) => handleFindingEdit(index, e.target.value)}
                          className="text-sm min-h-[60px]"
                        />
                        <Button size="sm" variant="destructive" onClick={() => removeFinding(index)}>
                          删除
                        </Button>
                      </div>
                    ) : (
                      <div 
                        className="text-sm leading-relaxed space-y-1"
                        dangerouslySetInnerHTML={{ __html: markdownToHtml(finding) }}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Conclusion - 带收起展开功能 */}
        <div className={getParagraphClass("conclusion")} onClick={() => handleParagraphClick("conclusion")}>
          <div className="space-y-2 p-3 rounded-lg">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">结论：</label>
              {report.conclusion && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsConclusionCollapsed(!isConclusionCollapsed)
                  }}
                  className="h-6 px-2 text-xs"
                >
                  {isConclusionCollapsed ? "展开 ▼" : "收起 ▲"}
                </Button>
              )}
            </div>
            {isEditing ? (
              <Textarea
                value={report.conclusion}
                onChange={(e) => handleFieldEdit("conclusion", e.target.value)}
                placeholder="请输入检查结论..."
                className="min-h-[80px]"
              />
            ) : (
              <div className={`p-3 panel-soft rounded-lg transition-all duration-300 relative ${isConclusionCollapsed ? 'max-h-20 overflow-hidden' : ''}`}>
                <div 
                  className="text-sm whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{ __html: markdownToHtml(report.conclusion || "待填写结论...") }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Suggestions - 建议模块 */}
        <div className={getParagraphClass("suggestions")} onClick={() => handleParagraphClick("suggestions")}>
          <div className="space-y-2 p-3 rounded-lg">
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-[var(--brand-iris)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <label className="text-sm font-medium text-[var(--brand-iris)]">诊疗建议：</label>
            </div>
            {isEditing ? (
              <Textarea
                value={report.suggestions}
                onChange={(e) => handleFieldEdit("suggestions", e.target.value)}
                placeholder="请输入诊疗建议..."
                className="min-h-[80px]"
              />
            ) : (
              <div className="p-3 panel-accent rounded-lg">
                <div 
                  className="text-sm text-foreground whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{ __html: markdownToHtml(report.suggestions || "暂无建议，点击「AI智能生成」自动生成诊疗建议...") }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex justify-between items-center pt-4 border-t">
          <Badge variant={report.conclusion ? "default" : "secondary"}>{report.conclusion ? "已完成" : "待完成"}</Badge>

          {report.createdAt && (
            <span className="text-xs text-gray-500">
              创建时间: {new Date(report.createdAt).toLocaleString("zh-CN")}
            </span>
          )}
        </div>

        <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
          <div className="flex items-start space-x-2">
            <svg className="w-4 h-4 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
            <div className="text-xs text-yellow-700">
              <p className="font-medium mb-1">交互提示：</p>
              <ul className="space-y-1">
                <li>• 点击报告段落可在流程图中定位对应节点</li>
                <li>• 点击流程图判断节点可查看AI决策逻辑</li>
                <li>• AI根据每个节点判断和推理生成报告过程会在流程图同步高亮</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
