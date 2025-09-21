"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Upload, Mic, Eye, BarChart3 } from "lucide-react"
import MedicalReportComponent from "./medical-report-component"
import FlowchartBuilder from "./flowchart-builder"

interface AnalysisData {
  diseaseProbs: { name: string; probability: number; color: string }[]
  patientMetrics: { label: string; value: number; max: number }[]
}

export default function MedicalReportSystem() {
  const [inputText, setInputText] = useState("")
  const [highlightedNode, setHighlightedNode] = useState<string | null>(null)
  const [selectedParagraph, setSelectedParagraph] = useState<string | null>(null)
  const [showDecisionDetails, setShowDecisionDetails] = useState(false)
  const [analysisData, setAnalysisData] = useState<AnalysisData>({
    diseaseProbs: [
      { name: "肝脏囊肿", probability: 0.85, color: "#ef4444" },
      { name: "肝血管瘤", probability: 0.12, color: "#f97316" },
      { name: "肝癌", probability: 0.03, color: "#eab308" },
    ],
    patientMetrics: [
      { label: "肝功能", value: 0.8, max: 1 },
      { label: "血压", value: 0.6, max: 1 },
      { label: "血糖", value: 0.9, max: 1 },
      { label: "胆固醇", value: 0.7, max: 1 },
      { label: "炎症指标", value: 0.5, max: 1 },
      { label: "肿瘤标志物", value: 0.8, max: 1 },
    ],
  })

  const radarChartRef = useRef<HTMLCanvasElement>(null)
  const probChartRef = useRef<HTMLCanvasElement>(null)

  const handleReportGeneration = (nodeId: string, paragraphId: string) => {
    setHighlightedNode(nodeId)
    setSelectedParagraph(paragraphId)

    // Simulate AI thinking process with sequential highlighting
    setTimeout(() => setHighlightedNode(null), 2000)
  }

  const handleDecisionNodeClick = (nodeId: string, decisionData: any) => {
    setShowDecisionDetails(true)
    console.log("[v0] Decision node clicked:", nodeId, decisionData)
  }

  const handleSubmit = () => {
    if (inputText.trim()) {
      console.log("Submitting:", inputText)
      handleReportGeneration("decision", "diagnosis-section")
      setInputText("")
    }
  }

  const drawRadarChart = () => {
    const canvas = radarChartRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const radius = 80

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw radar chart background
    ctx.strokeStyle = "#e5e7eb"
    ctx.lineWidth = 1

    // Draw concentric circles
    for (let i = 1; i <= 5; i++) {
      ctx.beginPath()
      ctx.arc(centerX, centerY, (radius * i) / 5, 0, 2 * Math.PI)
      ctx.stroke()
    }

    // Draw axes with labels
    const axes = analysisData.patientMetrics.length
    const labels = analysisData.patientMetrics.map((m) => m.label)

    for (let i = 0; i < axes; i++) {
      const angle = (i * 2 * Math.PI) / axes - Math.PI / 2
      const x = centerX + radius * Math.cos(angle)
      const y = centerY + radius * Math.sin(angle)

      ctx.beginPath()
      ctx.moveTo(centerX, centerY)
      ctx.lineTo(x, y)
      ctx.stroke()

      // Draw labels
      ctx.fillStyle = "#374151"
      ctx.font = "10px sans-serif"
      ctx.textAlign = "center"
      const labelX = centerX + (radius + 15) * Math.cos(angle)
      const labelY = centerY + (radius + 15) * Math.sin(angle)
      ctx.fillText(labels[i], labelX, labelY)
    }

    // Draw data polygon
    ctx.strokeStyle = "#3b82f6"
    ctx.fillStyle = "rgba(59, 130, 246, 0.2)"
    ctx.lineWidth = 2

    ctx.beginPath()
    for (let i = 0; i < axes; i++) {
      const angle = (i * 2 * Math.PI) / axes - Math.PI / 2
      const value = analysisData.patientMetrics[i].value * radius
      const x = centerX + value * Math.cos(angle)
      const y = centerY + value * Math.sin(angle)

      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    }
    ctx.closePath()
    ctx.fill()
    ctx.stroke()

    // Draw data points
    ctx.fillStyle = "#3b82f6"
    for (let i = 0; i < axes; i++) {
      const angle = (i * 2 * Math.PI) / axes - Math.PI / 2
      const value = analysisData.patientMetrics[i].value * radius
      const x = centerX + value * Math.cos(angle)
      const y = centerY + value * Math.sin(angle)

      ctx.beginPath()
      ctx.arc(x, y, 4, 0, 2 * Math.PI)
      ctx.fill()
    }
  }

  const drawProbabilityChart = () => {
    const canvas = probChartRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const barHeight = 25
    const barSpacing = 35
    const maxWidth = canvas.width - 100

    analysisData.diseaseProbs.forEach((disease, index) => {
      const y = index * barSpacing + 20
      const barWidth = disease.probability * maxWidth

      // Draw bar
      ctx.fillStyle = disease.color
      ctx.fillRect(20, y, barWidth, barHeight)

      // Draw label
      ctx.fillStyle = "#374151"
      ctx.font = "12px sans-serif"
      ctx.textAlign = "left"
      ctx.fillText(disease.name, 25, y + 17)

      // Draw percentage
      ctx.textAlign = "right"
      ctx.fillText(`${(disease.probability * 100).toFixed(1)}%`, canvas.width - 10, y + 17)
    })
  }

  useEffect(() => {
    drawRadarChart()
    drawProbabilityChart()
  }, [analysisData])

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">3.3.2 图文排版</h1>
        <p className="text-gray-600">
          报告生成界面分为左侧的流程图，中间的文字报告和右侧的多模态可视对比，下方则为交互编辑的对话框。
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Left Panel - Flowchart */}
        <div className="lg:col-span-1">
          <FlowchartBuilder
            highlightedNode={highlightedNode}
            onDecisionClick={handleDecisionNodeClick}
            onNodeSelect={setSelectedParagraph}
          />
        </div>

        {/* Center Panel - Medical Report */}
        <div className="lg:col-span-1">
          <MedicalReportComponent highlightedParagraph={selectedParagraph} onParagraphClick={setSelectedParagraph} />
        </div>

        {/* Right Panel - Analysis and Comparison */}
        <div className="lg:col-span-1 space-y-6">
          {/* Disease Probability Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <BarChart3 className="w-6 h-6 mr-2" />
                疾病概率分析
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 rounded-lg p-4 h-32 flex items-center justify-center mb-4">
                <canvas ref={probChartRef} width="280" height="120" className="max-w-full max-h-full" />
              </div>
              <Button size="sm" variant="outline" className="w-full bg-transparent">
                <Eye className="w-4 h-4 mr-2" />
                查看详细分析
              </Button>
            </CardContent>
          </Card>

          {/* Patient Metrics Radar Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  ></path>
                </svg>
                患者指标雷达图
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 rounded-lg p-4 h-48 flex items-center justify-center mb-4">
                <canvas ref={radarChartRef} width="200" height="200" className="max-w-full max-h-full" />
              </div>
              <Button size="sm" variant="outline" className="w-full bg-transparent">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  ></path>
                </svg>
                生成分析
              </Button>
            </CardContent>
          </Card>

          {/* Image Comparison */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  ></path>
                </svg>
                多模态图像对比
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="space-y-1">
                  <p className="text-xs text-gray-600">患者影像</p>
                  {[1, 2].map((i) => (
                    <div key={i} className="aspect-square bg-gray-900 rounded-lg overflow-hidden relative">
                      <img
                        src={`/medical-ultrasound-scan-.jpg?height=120&width=120&query=patient ultrasound scan ${i}`}
                        alt={`Patient scan ${i}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-1 right-1 bg-blue-500 text-white text-xs px-1 rounded">患者</div>
                    </div>
                  ))}
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-600">标准对照</p>
                  {[3, 4].map((i) => (
                    <div key={i} className="aspect-square bg-gray-900 rounded-lg overflow-hidden relative">
                      <img
                        src={`/medical-ultrasound-scan-.jpg?height=120&width=120&query=standard reference ultrasound ${i}`}
                        alt={`Reference scan ${i}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-1 right-1 bg-green-500 text-white text-xs px-1 rounded">标准</div>
                    </div>
                  ))}
                </div>
              </div>

              <Button size="sm" variant="outline" className="w-full bg-transparent">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  ></path>
                </svg>
                AI辅助对比分析
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Decision Details Modal */}
      {showDecisionDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-96 max-h-96 overflow-y-auto">
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

      {/* Bottom Input Panel */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <Button size="sm" variant="outline">
              <Upload className="w-4 h-4" />
            </Button>

            <Input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="请输入想修改的内容"
              className="flex-1"
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />

            <Button size="sm" variant="outline" onClick={handleSubmit}>
              <Mic className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
