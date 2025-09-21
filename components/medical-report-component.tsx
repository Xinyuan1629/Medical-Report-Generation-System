"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"

interface PatientInfo {
  name: string
  gender: string
  age: number
  examNumber: string
  examDate: string
  clinicalDiagnosis: string
}

interface MedicalReport {
  id?: string
  patientInfo: PatientInfo
  examDescription: string
  findings: string[]
  conclusion: string
  createdAt?: string
}

interface MedicalReportComponentProps {
  highlightedParagraph?: string | null
  onParagraphClick?: (paragraphId: string) => void
}

export default function MedicalReportComponent({
  highlightedParagraph,
  onParagraphClick,
}: MedicalReportComponentProps) {
  const [report, setReport] = useState<MedicalReport>({
    patientInfo: {
      name: "XXX",
      gender: "男/女",
      age: 0,
      examNumber: "XXXXXX",
      examDate: "2024年XX月XX日",
      clinicalDiagnosis: "肥胖/高血压/糖尿病/无症状",
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
  })

  const [isEditing, setIsEditing] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState("")

  const paragraphSections = {
    "patient-info": "患者信息",
    "examination-method": "检查方法",
    "lab-results": "实验室结果",
    "diagnosis-section": "诊断发现",
    "report-generation": "报告生成",
    conclusion: "结论",
  }

  const getParagraphClass = (sectionId: string) => {
    const baseClass = "transition-all duration-300 cursor-pointer"
    if (highlightedParagraph === sectionId) {
      return `${baseClass} bg-blue-100 border-l-4 border-blue-500 pl-4 shadow-md`
    }
    return `${baseClass} hover:bg-gray-50`
  }

  const handleParagraphClick = (sectionId: string) => {
    if (onParagraphClick) {
      onParagraphClick(sectionId)
    }
  }

  const generateAIReport = async () => {
    setIsGenerating(true)
    const steps = [
      "分析患者基本信息...",
      "处理超声检查数据...",
      "评估血液检测结果...",
      "执行AI诊断判断...",
      "生成医疗报告...",
      "完成报告生成",
    ]

    for (let i = 0; i < steps.length; i++) {
      setGenerationProgress(steps[i])
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Trigger paragraph highlighting during generation
      if (onParagraphClick) {
        const sectionIds = [
          "patient-info",
          "examination-method",
          "lab-results",
          "diagnosis-section",
          "report-generation",
          "conclusion",
        ]
        onParagraphClick(sectionIds[i])
      }
    }

    // Update report with AI generated content
    setReport((prev) => ({
      ...prev,
      conclusion:
        "超声检查提示：肝脏弥漫性病变，考虑脂肪肝可能。建议：1. 控制饮食，减少脂肪摄入；2. 适当运动；3. 定期复查肝功能；4. 必要时进一步检查。",
      patientInfo: {
        ...prev.patientInfo,
        name: "张三",
        gender: "男",
        age: 45,
        examNumber: "US202412001",
        examDate: "2024年12月20日",
      },
    }))

    setIsGenerating(false)
    setGenerationProgress("")
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
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
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
          <div className="mt-2 p-2 bg-blue-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm text-blue-600">{generationProgress}</span>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Patient Information */}
        <div className={getParagraphClass("patient-info")} onClick={() => handleParagraphClick("patient-info")}>
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
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
              <label className="text-sm font-medium">检查号：</label>
              {isEditing ? (
                <Input
                  value={report.patientInfo.examNumber}
                  onChange={(e) => handleFieldEdit("patientInfo.examNumber", e.target.value)}
                  className="h-8"
                />
              ) : (
                <span>{report.patientInfo.examNumber}</span>
              )}
            </div>

            <div className="space-y-2 col-span-2">
              <label className="text-sm font-medium">检查日期：</label>
              {isEditing ? (
                <Input
                  value={report.patientInfo.examDate}
                  onChange={(e) => handleFieldEdit("patientInfo.examDate", e.target.value)}
                  className="h-8"
                />
              ) : (
                <span>{report.patientInfo.examDate}</span>
              )}
            </div>

            <div className="space-y-2 col-span-2">
              <label className="text-sm font-medium">临床诊断：</label>
              {isEditing ? (
                <Input
                  value={report.patientInfo.clinicalDiagnosis}
                  onChange={(e) => handleFieldEdit("patientInfo.clinicalDiagnosis", e.target.value)}
                  className="h-8"
                />
              ) : (
                <span>{report.patientInfo.clinicalDiagnosis}</span>
              )}
            </div>
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

        <hr className="border-gray-300" />

        {/* Findings */}
        <div
          className={getParagraphClass("diagnosis-section")}
          onClick={() => handleParagraphClick("diagnosis-section")}
        >
          <div className="space-y-4 p-3 rounded-lg">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">肝脏：</h3>
              {isEditing && (
                <Button size="sm" variant="outline" onClick={addFinding}>
                  添加发现
                </Button>
              )}
            </div>

            <ul className="space-y-3">
              {report.findings.map((finding, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <span className="text-sm mt-1">•</span>
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
                      <span className="text-sm">{finding}</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Conclusion */}
        <div className={getParagraphClass("conclusion")} onClick={() => handleParagraphClick("conclusion")}>
          <div className="space-y-2 p-3 rounded-lg">
            <label className="text-sm font-medium">结论：</label>
            {isEditing ? (
              <Textarea
                value={report.conclusion}
                onChange={(e) => handleFieldEdit("conclusion", e.target.value)}
                placeholder="请输入检查结论..."
                className="min-h-[80px]"
              />
            ) : (
              <div className="p-3 bg-blue-50 rounded-lg">
                <span className="text-sm">{report.conclusion || "待填写结论..."}</span>
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
                <li>• 流程图节点高亮时对应报告段落会同步高亮</li>
                <li>• 点击流程图判断节点可查看AI决策逻辑</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
