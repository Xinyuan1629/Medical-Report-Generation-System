"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Upload, Mic } from "lucide-react"
import MedicalReportComponent from "./medical-report-component"
import FlowchartBuilder from "./flowchart-builder"

export default function MedicalReportSystem() {
  const [inputText, setInputText] = useState("")
  const radarChartRef = useRef<HTMLCanvasElement>(null)

  const handleSubmit = () => {
    if (inputText.trim()) {
      console.log("Submitting:", inputText)
      // Here you would typically send the input to your backend API
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

    // Clear canvas
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

    // Draw axes
    const axes = 6
    for (let i = 0; i < axes; i++) {
      const angle = (i * 2 * Math.PI) / axes - Math.PI / 2
      const x = centerX + radius * Math.cos(angle)
      const y = centerY + radius * Math.sin(angle)

      ctx.beginPath()
      ctx.moveTo(centerX, centerY)
      ctx.lineTo(x, y)
      ctx.stroke()
    }

    // Draw data polygon
    ctx.strokeStyle = "#3b82f6"
    ctx.fillStyle = "rgba(59, 130, 246, 0.2)"
    ctx.lineWidth = 2

    const dataPoints = [0.8, 0.6, 0.9, 0.7, 0.5, 0.8] // Sample data

    ctx.beginPath()
    for (let i = 0; i < axes; i++) {
      const angle = (i * 2 * Math.PI) / axes - Math.PI / 2
      const value = dataPoints[i] * radius
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
      const value = dataPoints[i] * radius
      const x = centerX + value * Math.cos(angle)
      const y = centerY + value * Math.sin(angle)

      ctx.beginPath()
      ctx.arc(x, y, 4, 0, 2 * Math.PI)
      ctx.fill()
    }
  }

  useEffect(() => {
    drawRadarChart()
  }, [])

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
          <FlowchartBuilder />
        </div>

        {/* Center Panel - Medical Report */}
        <div className="lg:col-span-1">
          <MedicalReportComponent />
        </div>

        {/* Right Panel - Analysis and Comparison */}
        <div className="lg:col-span-1 space-y-6">
          {/* Visual Analysis */}
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
                可视分析
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Radar Chart */}
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
                图像对比
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Image Grid */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="aspect-square bg-gray-900 rounded-lg overflow-hidden">
                    <img
                      src={`/medical-ultrasound-scan-.jpg?height=120&width=120&query=medical ultrasound scan ${i}`}
                      alt={`Medical scan ${i}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
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
                查看详情
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

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
