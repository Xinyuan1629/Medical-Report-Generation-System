"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface FlowchartNode {
  id: string
  type: "start" | "process" | "decision" | "end"
  x: number
  y: number
  width: number
  height: number
  label: string
  connections: string[]
  decisionData?: {
    criteria: string[]
    patientData: Record<string, any>
    reasoning: string[]
  }
}

interface FlowchartBuilderProps {
  highlightedNode?: string | null
  onDecisionClick?: (nodeId: string, decisionData: any) => void
  onNodeSelect?: (paragraphId: string) => void
}

export default function FlowchartBuilder({ highlightedNode, onDecisionClick, onNodeSelect }: FlowchartBuilderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [nodes, setNodes] = useState<FlowchartNode[]>([
    {
      id: "start",
      type: "start",
      x: 150,
      y: 20,
      width: 60,
      height: 60,
      label: "开始检查",
      connections: ["process1", "process2"],
    },
    {
      id: "process1",
      type: "process",
      x: 50,
      y: 120,
      width: 80,
      height: 50,
      label: "超声扫描",
      connections: ["decision"],
    },
    {
      id: "process2",
      type: "process",
      x: 220,
      y: 120,
      width: 80,
      height: 50,
      label: "血液检测",
      connections: ["decision"],
    },
    {
      id: "decision",
      type: "decision",
      x: 125,
      y: 220,
      width: 100,
      height: 60,
      label: "病变判断",
      connections: ["process3"],
      decisionData: {
        criteria: ["肝脏形态", "血流信号", "回声特征"],
        patientData: {
          morphology: "异常",
          bloodFlow: "减弱",
          echoPattern: "不均匀",
        },
        reasoning: ["检测到肝脏囊性病变", "排除恶性肿瘤可能", "确认为良性囊肿"],
      },
    },
    {
      id: "process3",
      type: "process",
      x: 125,
      y: 320,
      width: 80,
      height: 50,
      label: "生成报告",
      connections: ["end"],
    },
    {
      id: "end",
      type: "end",
      x: 150,
      y: 420,
      width: 60,
      height: 60,
      label: "完成诊断",
      connections: [],
    },
  ])

  const [selectedNode, setSelectedNode] = useState<string | null>(null)

  const drawFlowchart = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw connections first
    ctx.strokeStyle = "#666"
    ctx.lineWidth = 2

    nodes.forEach((node) => {
      node.connections.forEach((connectionId) => {
        const targetNode = nodes.find((n) => n.id === connectionId)
        if (targetNode) {
          const startX = node.x + node.width / 2
          const startY = node.y + node.height
          const endX = targetNode.x + targetNode.width / 2
          const endY = targetNode.y

          if (highlightedNode === node.id || highlightedNode === targetNode.id) {
            ctx.strokeStyle = "#3b82f6"
            ctx.lineWidth = 3
          } else {
            ctx.strokeStyle = "#666"
            ctx.lineWidth = 2
          }

          ctx.beginPath()
          ctx.moveTo(startX, startY)
          ctx.lineTo(endX, endY)
          ctx.stroke()

          // Draw arrow
          const angle = Math.atan2(endY - startY, endX - startX)
          const arrowLength = 10
          ctx.beginPath()
          ctx.moveTo(endX, endY)
          ctx.lineTo(
            endX - arrowLength * Math.cos(angle - Math.PI / 6),
            endY - arrowLength * Math.sin(angle - Math.PI / 6),
          )
          ctx.moveTo(endX, endY)
          ctx.lineTo(
            endX - arrowLength * Math.cos(angle + Math.PI / 6),
            endY - arrowLength * Math.sin(angle + Math.PI / 6),
          )
          ctx.stroke()
        }
      })
    })

    // Draw nodes
    nodes.forEach((node) => {
      const isSelected = selectedNode === node.id
      const isHighlighted = highlightedNode === node.id

      let fillColor = getNodeColor(node.type)
      let strokeColor = "#666"
      let lineWidth = 1

      if (isHighlighted) {
        fillColor = "#3b82f6"
        strokeColor = "#1d4ed8"
        lineWidth = 4
        // Add glow effect
        ctx.shadowColor = "#3b82f6"
        ctx.shadowBlur = 10
      } else if (isSelected) {
        fillColor = "#3b82f6"
        strokeColor = "#1d4ed8"
        lineWidth = 3
      }

      ctx.fillStyle = fillColor
      ctx.strokeStyle = strokeColor
      ctx.lineWidth = lineWidth

      if (node.type === "start" || node.type === "end") {
        // Draw circle
        ctx.beginPath()
        ctx.arc(node.x + node.width / 2, node.y + node.height / 2, node.width / 2, 0, 2 * Math.PI)
        ctx.fill()
        ctx.stroke()
      } else if (node.type === "decision") {
        // Draw diamond
        ctx.beginPath()
        ctx.moveTo(node.x + node.width / 2, node.y)
        ctx.lineTo(node.x + node.width, node.y + node.height / 2)
        ctx.lineTo(node.x + node.width / 2, node.y + node.height)
        ctx.lineTo(node.x, node.y + node.height / 2)
        ctx.closePath()
        ctx.fill()
        ctx.stroke()

        if (node.decisionData) {
          ctx.fillStyle = "#ef4444"
          ctx.beginPath()
          ctx.arc(node.x + node.width - 8, node.y + 8, 4, 0, 2 * Math.PI)
          ctx.fill()
        }
      } else {
        // Draw rectangle
        ctx.fillRect(node.x, node.y, node.width, node.height)
        ctx.strokeRect(node.x, node.y, node.width, node.height)
      }

      // Reset shadow
      ctx.shadowBlur = 0

      // Draw label
      ctx.fillStyle = isSelected || isHighlighted ? "#fff" : "#000"
      ctx.font = "12px sans-serif"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillText(node.label, node.x + node.width / 2, node.y + node.height / 2)
    })
  }

  const getNodeColor = (type: string) => {
    switch (type) {
      case "start":
      case "end":
        return "#fbbf24" // yellow
      case "process":
        return "#a7f3d0" // cyan
      case "decision":
        return "#c084fc" // purple
      default:
        return "#e5e7eb" // gray
    }
  }

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    // Find clicked node
    const clickedNode = nodes.find(
      (node) => x >= node.x && x <= node.x + node.width && y >= node.y && y <= node.y + node.height,
    )

    if (clickedNode) {
      setSelectedNode(clickedNode.id)

      if (clickedNode.type === "decision" && clickedNode.decisionData && onDecisionClick) {
        onDecisionClick(clickedNode.id, clickedNode.decisionData)
      }

      if (onNodeSelect) {
        const paragraphMap: Record<string, string> = {
          start: "patient-info",
          process1: "examination-method",
          process2: "lab-results",
          decision: "diagnosis-section",
          process3: "report-generation",
          end: "conclusion",
        }
        onNodeSelect(paragraphMap[clickedNode.id] || "")
      }
    } else {
      setSelectedNode(null)
    }
  }

  const addNode = (type: FlowchartNode["type"]) => {
    const newNode: FlowchartNode = {
      id: `node_${Date.now()}`,
      type,
      x: 150,
      y: 150,
      width: type === "start" || type === "end" ? 60 : type === "decision" ? 100 : 80,
      height: type === "start" || type === "end" ? 60 : type === "decision" ? 60 : 50,
      label: `新${type}`,
      connections: [],
    }

    setNodes((prev) => [...prev, newNode])
    setSelectedNode(newNode.id)
  }

  const deleteSelectedNode = () => {
    if (!selectedNode) return

    setNodes((prev) => prev.filter((node) => node.id !== selectedNode))
    setSelectedNode(null)
  }

  const saveFlowchart = async () => {
    try {
      const response = await fetch("/api/flowcharts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(nodes),
      })

      if (response.ok) {
        console.log("Flowchart saved successfully")
      }
    } catch (error) {
      console.error("Error saving flowchart:", error)
    }
  }

  useEffect(() => {
    drawFlowchart()
  }, [nodes, selectedNode, highlightedNode])

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>智能诊断流程图</span>
          <div className="flex space-x-2">
            <Button size="sm" variant="outline" onClick={() => addNode("start")}>
              开始
            </Button>
            <Button size="sm" variant="outline" onClick={() => addNode("process")}>
              处理
            </Button>
            <Button size="sm" variant="outline" onClick={() => addNode("decision")}>
              判断
            </Button>
            <Button size="sm" variant="outline" onClick={() => addNode("end")}>
              结束
            </Button>
            {selectedNode && (
              <Button size="sm" variant="destructive" onClick={deleteSelectedNode}>
                删除
              </Button>
            )}
            <Button size="sm" onClick={saveFlowchart}>
              保存
            </Button>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent>
        <canvas
          ref={canvasRef}
          width={400}
          height={500}
          className="border border-gray-300 rounded-lg cursor-pointer"
          onClick={handleCanvasClick}
        />

        {selectedNode && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm font-medium">已选择节点: {nodes.find((n) => n.id === selectedNode)?.label}</p>
            {nodes.find((n) => n.id === selectedNode)?.type === "decision" && (
              <div className="mt-2 text-xs text-gray-600">
                <p>点击查看决策逻辑详情</p>
              </div>
            )}
          </div>
        )}

        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center text-xs text-gray-600">
            <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
            <span>红点表示可查看决策逻辑的判断节点</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
