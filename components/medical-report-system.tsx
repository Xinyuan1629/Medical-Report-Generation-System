"use client"

import { useState, useRef, type ChangeEvent } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Upload, Mic, Eye, MessageCircle, X, Brain, Loader2 } from "lucide-react"
import MedicalReportComponent from "./medical-report-component"
import FlowchartBuilder from "./flowchart-builder"
import AppLayout from "./layout/app-layout"
import { analyzeImage } from "@/lib/api"

interface AIThinkingStep {
  id: string
  title: string
  content: string
  status: "pending" | "processing" | "completed"
}

export default function MedicalReportSystem() {
  const [inputText, setInputText] = useState("")
  const [highlightedNode, setHighlightedNode] = useState<string | null>(null)
  const [selectedParagraph, setSelectedParagraph] = useState<string | null>(null)
  const [showDecisionDetails, setShowDecisionDetails] = useState(false)
  const [showAIDialog, setShowAIDialog] = useState(false)
  const [aiThinking, setAiThinking] = useState<AIThinkingStep[]>([])
  const [isAIProcessing, setIsAIProcessing] = useState(false)
  const [aiResponse, setAiResponse] = useState("")

  const [patientImages, setPatientImages] = useState<(string | null)[]>([null, null])
  const [flowchartData, setFlowchartData] = useState<{ name?: string; nodes: any[] }>({ nodes: [] })
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false)
  const [imageAnalysisResult, setImageAnalysisResult] = useState<string>("")
  const fileInputRefs: Array<React.RefObject<HTMLInputElement>> = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)]

  const triggerFileInput = (index: number) => {
    const ref = fileInputRefs[index]
    if (ref && ref.current) {
      ref.current.click()
    }
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files && e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string | null
      setPatientImages((prev) => {
        const copy = [...prev]
        copy[index] = result
        return copy
      })
    }
    reader.readAsDataURL(file)
  }

  const removeImage = (index: number) => {
    setPatientImages((prev) => {
      const copy = [...prev]
      copy[index] = null
      return copy
    })
    // clear input value so same file can be re-uploaded if needed
    const ref = fileInputRefs[index]
    if (ref && ref.current) ref.current.value = ''
  }

  // 处理图像分析
  const handleImageAnalysis = async () => {
    // 过滤出有效的图像
    const validImages = patientImages.filter((img): img is string => img !== null)

    if (validImages.length === 0) {
      alert("请先上传至少一张患者影像")
      return
    }

    setIsAnalyzingImage(true)
    setImageAnalysisResult("")

    try {
      const result = await analyzeImage(validImages)

      if (result.success) {
        setImageAnalysisResult(result.description)
      } else {
        setImageAnalysisResult(`分析失败: ${result.error || '未知错误'}`)
      }
    } catch (error) {
      console.error("图像分析失败:", error)
      setImageAnalysisResult(`分析失败: ${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setIsAnalyzingImage(false)
    }
  }

  const simulateAIThinking = async (userInput: string) => {
    setIsAIProcessing(true)
    setAiResponse("")

    const thinkingSteps: AIThinkingStep[] = [
      {
        id: "1",
        title: "分析用户输入",
        content: `正在分析用户请求: "${userInput}"`,
        status: "pending",
      },
      {
        id: "2",
        title: "检索医学知识库",
        content: "搜索相关的医学文献和诊断标准...",
        status: "pending",
      },
      {
        id: "3",
        title: "结合患者数据",
        content: "整合患者的检查结果和病史信息...",
        status: "pending",
      },
      {
        id: "4",
        title: "生成诊断建议",
        content: "基于分析结果生成专业的医学建议...",
        status: "pending",
      },
    ]

    setAiThinking(thinkingSteps)

    for (let i = 0; i < thinkingSteps.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 1500))

      setAiThinking((prev) =>
        prev.map((step, index) => ({
          ...step,
          status: index === i ? "processing" : index < i ? "completed" : "pending",
        })),
      )

      await new Promise((resolve) => setTimeout(resolve, 1000))

      setAiThinking((prev) =>
        prev.map((step, index) => ({
          ...step,
          status: index <= i ? "completed" : "pending",
        })),
      )
    }

    await new Promise((resolve) => setTimeout(resolve, 500))
    setAiResponse(
      `基于您的请求"${userInput}"，我已经分析了患者的超声检查结果。根据影像学特征和临床数据，建议进一步观察肝脏囊肿的变化情况，并建议3个月后复查。同时建议患者注意饮食调节，避免高脂食物。`,
    )
    setIsAIProcessing(false)
  }

  const handleReportGeneration = (nodeId: string, paragraphId: string) => {
    setHighlightedNode(nodeId)
    setSelectedParagraph(paragraphId)

    setTimeout(() => setHighlightedNode(null), 2000)
  }

  const handleDecisionNodeClick = (nodeId: string, decisionData: any) => {
    setShowDecisionDetails(true)
    console.log("[v0] Decision node clicked:", nodeId, decisionData)
  }

  const handleSubmit = async () => {
    if (inputText.trim()) {
      setShowAIDialog(true)
      await simulateAIThinking(inputText)
      handleReportGeneration("decision", "diagnosis-section")
      setInputText("")
    }
  }

  const closeAIDialog = () => {
    setShowAIDialog(false)
    setAiThinking([])
    setAiResponse("")
    setIsAIProcessing(false)
  }

  return (
    <AppLayout
      title="交互式医疗报告生成系统"
      subtitle="左侧为流程图和影像对比分析，右侧为医疗报告生成。"
    >
      {/* 三栏布局：流程图 / 图像对比 / 报告 */}
      <div className="flex gap-4 mb-6 items-stretch h-[700px]">
        {/* 流程图 */}
        <div className="w-1/3 h-full">
          <FlowchartBuilder
            highlightedNode={highlightedNode}
            onDecisionClick={handleDecisionNodeClick}
            onNodeSelect={setSelectedParagraph}
          /*onFlowchartChange={setFlowchartData}*/
          />
        </div>

        {/* 诊断图像对比 */}
        <div className="w-1/3 h-full">
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle className="text-xl font-bold">
                诊断图像对比
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col overflow-hidden">
              <div className="grid grid-cols-2 gap-2 mb-4 flex-1 overflow-y-auto">
                <div className="space-y-1">
                  <p className="text-xs text-gray-600">患者影像</p>
                  <div className="grid grid-cols-1 gap-2">
                    {[0, 1].map((i) => (
                      <div key={i} className="aspect-square rounded-lg overflow-hidden relative">
                        <input
                          ref={fileInputRefs[i]}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileChange(e as ChangeEvent<HTMLInputElement>, i)}
                        />
                        {patientImages[i] ? (
                          <>
                            <div className="w-full h-full bg-gray-900">
                              <img src={patientImages[i] as string} alt={`Patient scan ${i + 1}`} className="w-full h-full object-cover" />
                            </div>
                            <div className="absolute top-2 right-2">
                              <button onClick={() => removeImage(i)} className="bg-white/90 text-red-600 text-sm px-2 py-0.5 rounded">删除</button>
                            </div>
                          </>
                        ) : (
                          <button onClick={() => triggerFileInput(i)} className="w-full h-full flex flex-col items-center justify-center text-ink-muted border border-dashed border-[color-mix(in_srgb,var(--brand-iris)_30%,var(--brand-cream))] bg-[color-mix(in_srgb,var(--brand-cream)_85%,white)]">
                            <div className="w-12 h-12 rounded-full border-2 border-[color-mix(in_srgb,var(--brand-iris)_30%,var(--brand-cream))] flex items-center justify-center">+</div>
                            <div className="text-xs mt-2">上传</div>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-ink-muted">标准对照</p>
                  <div className="grid grid-cols-1 gap-2">
                    {[3, 4].map((i) => (
                      <div key={i} className="aspect-square bg-gray-900 rounded-lg overflow-hidden relative">
                        <img
                          src={`/medical-ultrasound-scan-${i}.jpg`}
                          alt={`Reference scan ${i}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-1 right-1 bg-[var(--brand-iris)] text-white text-xs px-1 rounded">标准</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <Button
                size="sm"
                variant="outline"
                className="w-full bg-transparent border-[var(--brand-iris)] text-[var(--brand-iris)] hover:bg-[color-mix(in_srgb,var(--brand-iris)_15%,transparent)]"
                onClick={handleImageAnalysis}
                disabled={isAnalyzingImage || patientImages.every(img => img === null)}
              >
                {isAnalyzingImage ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    分析中...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      ></path>
                    </svg>
                    AI辅助对比分析
                  </>
                )}
              </Button>

              {/* AI分析结果内联显示 */}
              {(isAnalyzingImage || imageAnalysisResult) && (
                <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-slate-700 flex items-center">
                      <Eye className="w-4 h-4 mr-1.5 text-[var(--brand-iris)]" />
                      AI分析结果
                    </h4>
                    {imageAnalysisResult && !isAnalyzingImage && (
                      <button
                        onClick={() => setImageAnalysisResult("")}
                        className="text-xs text-slate-400 hover:text-slate-600"
                      >
                        清除
                      </button>
                    )}
                  </div>
                  {isAnalyzingImage ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="w-5 h-5 animate-spin text-[var(--brand-iris)] mr-2" />
                      <span className="text-sm text-slate-500">正在分析...</span>
                    </div>
                  ) : (
                    <div className="text-sm text-slate-700 leading-relaxed max-h-40 overflow-y-auto">
                      <div
                        dangerouslySetInnerHTML={{
                          __html: imageAnalysisResult
                            .replace(/^###\s*(.+)$/gm, '<strong class="block mt-2 mb-1">$1</strong>')
                            .replace(/^##\s*(.+)$/gm, '<strong class="block mt-2 mb-1">$1</strong>')
                            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                            .replace(/^[\-\*•]\s*/gm, '')
                            .replace(/^\d+\.\s*/gm, '')
                            .split('\n')
                            .filter(line => line.trim())
                            .map(line => `<p class="mb-1">${line}</p>`)
                            .join('')
                        }}
                      />
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 报告生成 */}
        <div className="flex-1 h-full">
          <MedicalReportComponent
            flowchart={flowchartData}
            highlightedParagraph={selectedParagraph}
            onParagraphClick={setSelectedParagraph}
            imageAnalysisResult={imageAnalysisResult}
          />
        </div>
      </div>

      {showDecisionDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-96 max-h-96 overflow-y-auto panel-surface">
            <CardHeader>
              <CardTitle>决策逻辑详情</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">患者数据</h4>
                  <div className="text-sm space-y-1">
                    <p>肝脏形态: 异常</p>
                    <p>血流信号: 减弱</p>
                    <p>回声特征: 不均匀</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">判断过程</h4>
                  <div className="text-sm space-y-1">
                    <p>1. 检测到肝脏囊性病变</p>
                    <p>2. 排除恶性肿瘤可能</p>
                    <p>3. 确认为良性囊肿</p>
                  </div>
                </div>
                <Button onClick={() => setShowDecisionDetails(false)} className="w-full">
                  关闭
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}


      {showAIDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-hidden panel-surface">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center">
                <Brain className="w-6 h-6 mr-2 text-[var(--brand-iris)]" />
                AI 诊断助手
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={closeAIDialog}>
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="overflow-y-auto">
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium mb-4 text-ink-muted">AI 思考过程</h3>
                  <div className="space-y-3">
                    {aiThinking.map((step) => (
                      <div key={step.id} className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-1">
                          {step.status === "completed" && (
                            <div className="w-6 h-6 bg-[var(--brand-iris)] rounded-full flex items-center justify-center">
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M5 13l4 4L19 7"
                                ></path>
                              </svg>
                            </div>
                          )}
                          {step.status === "processing" && (
                            <div className="w-6 h-6 bg-[var(--brand-lilac)] rounded-full flex items-center justify-center">
                              <Loader2 className="w-4 h-4 text-white animate-spin" />
                            </div>
                          )}
                          {step.status === "pending" && <div className="w-6 h-6 bg-[color-mix(in_srgb,var(--brand-cream)_70%,var(--brand-mist))] rounded-full"></div>}
                        </div>
                        <div className="flex-1">
                          <h4
                            className={`font-medium ${step.status === "completed" ? "text-[var(--brand-iris)]" : step.status === "processing" ? "text-[var(--brand-lilac)]" : "text-ink-muted"}`}
                          >
                            {step.title}
                          </h4>
                          <p
                            className={`text-sm ${step.status === "completed" ? "text-[var(--brand-iris)]" : step.status === "processing" ? "text-[var(--brand-lilac)]" : "text-ink-muted"}`}
                          >
                            {step.content}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {aiResponse && (
                  <div className="border-t pt-4">
                    <h3 className="font-medium mb-3 text-ink-muted">AI 分析结果</h3>
                    <div className="panel-soft rounded-lg p-4">
                      <p className="text-foreground leading-relaxed">{aiResponse}</p>
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <Button variant="outline" onClick={closeAIDialog}>
                    关闭
                  </Button>
                  {aiResponse && (
                    <Button
                      onClick={() => {
                        closeAIDialog()
                      }}
                    >
                      应用建议
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="fixed bottom-6 right-6">
        <div className="flex flex-col items-end space-y-3">
          <div className="flex items-center space-x-2 rounded-full shadow-lg border px-4 py-2 min-w-80 panel-surface">
            <Button size="sm" variant="ghost">
              <Upload className="w-4 h-4" />
            </Button>
            <Input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="请输入您的问题或指令..."
              className="border-0 focus-visible:ring-0 bg-transparent"
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
            <Button size="sm" variant="ghost">
              <Mic className="w-4 h-4" />
            </Button>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!inputText.trim()}
            className="rounded-full w-14 h-14 bg-[var(--brand-iris)] hover:bg-[color-mix(in_srgb,var(--brand-iris)_80%,black)] shadow-lg"
          >
            <MessageCircle className="w-6 h-6" />
          </Button>
        </div>
      </div>
    </AppLayout>
  )
}
