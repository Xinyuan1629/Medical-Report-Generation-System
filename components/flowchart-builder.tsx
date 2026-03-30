"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getFlowchartByName, getFlowcharts, saveFlowchart as saveFlowchartApi } from "@/lib/api"

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
  onFlowchartChange?: (flowchart: { name?: string; nodes: FlowchartNode[] }) => void
}

export default function FlowchartBuilder({
  highlightedNode,
  onDecisionClick,
  onNodeSelect,
  onFlowchartChange,
}: FlowchartBuilderProps) {
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
  const [flowchartName, setFlowchartName] = useState("默认流程图")
  const [templateNames, setTemplateNames] = useState<string[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState("")

  const refreshTemplates = async () => {
    try {
      const charts = (await getFlowcharts()) as Array<{ name?: string }>
      const names = charts
        .map((chart) => chart.name)
        .filter((name): name is string => typeof name === "string" && name.trim().length > 0)
      setTemplateNames(names)
      if (!selectedTemplate && names.length > 0) {
        setSelectedTemplate(names[0])
      }
    } catch (error) {
      console.error("Error loading flowchart templates:", error)
    }
  }

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
        return "#53b5c2"
      case "process":
        return "#79d19f" // cyan
      case "decision":
        return "#a28fcc" // purple
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
    const name = flowchartName.trim()
    if (!name) {
      alert("请先输入流程图名称")
      return
    }

    try {
      await saveFlowchartApi(name, nodes)
      alert("流程图保存成功")
      await refreshTemplates()
    } catch (error) {
      console.error("Error saving flowchart:", error)
      alert("保存失败")
    }
  }

  const importTemplateFlowchart = async () => {
    if (!selectedTemplate) {
      alert("请先选择模板")
      return
    }

    try {
      const chart = (await getFlowchartByName(selectedTemplate)) as { name?: string; nodes?: FlowchartNode[] }
      if (!Array.isArray(chart.nodes)) {
        alert("模板数据格式错误")
        return
      }
      setNodes(chart.nodes)
      setSelectedNode(null)
      if (chart.name) {
        setFlowchartName(chart.name)
      }
      alert("模板导入成功")
    } catch (error) {
      console.error("Error importing flowchart template:", error)
      alert("模板导入失败")
    }
  }

  const loadFlowchart = () => {
    const fileInput = document.createElement("input")
    fileInput.type = "file"
    fileInput.accept = ".json"
    fileInput.onchange = (e: any) => {
      const file = e.target.files[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (event: any) => {
          try {
            const data = JSON.parse(event.target.result)
            setNodes(data)
            alert("流程图加载成功")
          } catch (error) {
            alert("文件格式错误")
          }
        }
        reader.readAsText(file)
      }
    }
    fileInput.click()
  }

  const exportFlowchart = () => {
    const dataStr = JSON.stringify(nodes, null, 2)
    const blob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `flowchart-${Date.now()}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const clearFlowchart = () => {
    if (confirm("确认要清空所有节点吗？")) {
      setNodes([])
      setSelectedNode(null)
    }
  }

  useEffect(() => {
    drawFlowchart()
  }, [nodes, selectedNode, highlightedNode])

  useEffect(() => {
    refreshTemplates()
  }, [])

  useEffect(() => {
    onFlowchartChange?.({
      name: flowchartName.trim() || undefined,
      nodes,
    })
  }, [flowchartName, nodes, onFlowchartChange])

  return (
    <Card className="w-full h-full flex flex-col border-0 shadow-[0_12px_28px_rgba(15,23,42,0.16)]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl font-bold">
          <img src="/svg/flow.svg" alt="流程图标" className="h-8 w-8" />
          智能诊断流程图</CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col overflow-hidden">
        {/* Canvas 绘图区域 - 可滚动 */}
        <div className="flex-1 rounded-lg overflow-auto bg-white mb-4 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.35)]">
          <canvas
            ref={canvasRef}
            width={400}
            height={600}
            className="cursor-pointer min-w-full min-h-full"
            onClick={handleCanvasClick}
          />
        </div>

        {/* 模板与工具区 */}
        <div className="mb-4 rounded-xl bg-[#dcdfe3] p-3 shadow-sm">
          {/* 第一行：名称输入 + 保存 */}
          <div className="mb-3 flex gap-2">
            <Input
              className="h-8 flex-1 rounded-md border border-slate-300 bg-white px-3 text-sm"
              value={flowchartName}
              onChange={(e) => setFlowchartName(e.target.value)}
              placeholder="输入流程图名称"
              /*className="flex-1 bg-white"*/
            />
            <Button size="sm" onClick={saveFlowchart} title="保存到 server/flowcharts.json"
              className="w-20">保存</Button>
          </div>

          {/* 第二行：模版选择 + 导入 */}
          <div className="mb-3 flex gap-2">
            <select
              className="h-8 flex-1 rounded-md border border-slate-300 bg-white px-3 text-sm"
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
            >
              {templateNames.length === 0 && <option value="">暂无模板</option>}
              {templateNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
            <Button size="sm" onClick={importTemplateFlowchart} disabled={!selectedTemplate} title="导入选中的模版"
              className="w-20 h-8">
              导入
            </Button>
          </div>

          {/* 第三行：添加节点按钮 */}
          <div className="mb-2 grid grid-cols-3 gap-2">
            <Button size="sm" variant="outline" onClick={() => addNode("start")} title="添加开始节点">开始</Button>
            <Button size="sm" variant="outline" onClick={() => addNode("process")} title="添加处理节点">处理</Button>
            <Button size="sm" variant="outline" onClick={() => addNode("decision")} title="添加判断节点">判断</Button>
          </div>

          {/* 第四行：操作按钮 */}
          <div className="grid grid-cols-3 gap-2">
            <Button size="sm" variant="destructive" onClick={deleteSelectedNode} disabled={!selectedNode} title="删除选中节点">删除</Button>
            <Button size="sm" variant="outline" onClick={clearFlowchart} title="清空所有节点">清空</Button>
            <Button size="sm" variant="outline" onClick={() => addNode("end")} title="添加结束节点">结束</Button>
          </div>
        </div>

        {/* 选中节点信息 */}
        {selectedNode && (
          <div className="p-3 bg-blue-50 rounded-lg text-sm">
            <p className="font-medium">已选择: {nodes.find((n) => n.id === selectedNode)?.label}</p>
            {nodes.find((n) => n.id === selectedNode)?.type === "decision" && (
              <p className="text-xs text-gray-600 mt-1">这是一个判断节点</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
