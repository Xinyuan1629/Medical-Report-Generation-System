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

export default function MedicalReportComponent() {
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
  const [editingField, setEditingField] = useState<string | null>(null)

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
          <Button variant={isEditing ? "default" : "outline"} size="sm" onClick={() => setIsEditing(!isEditing)}>
            {isEditing ? "完成编辑" : "编辑报告"}
          </Button>
          {isEditing && (
            <Button size="sm" onClick={saveReport}>
              保存报告
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Patient Information */}
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

        {/* Exam Description */}
        <div className="space-y-2">
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

        <hr className="border-gray-300" />

        {/* Findings */}
        <div className="space-y-4">
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

        {/* Conclusion */}
        <div className="space-y-2">
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

        {/* Status Badge */}
        <div className="flex justify-between items-center pt-4 border-t">
          <Badge variant={report.conclusion ? "default" : "secondary"}>{report.conclusion ? "已完成" : "待完成"}</Badge>

          {report.createdAt && (
            <span className="text-xs text-gray-500">
              创建时间: {new Date(report.createdAt).toLocaleString("zh-CN")}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
