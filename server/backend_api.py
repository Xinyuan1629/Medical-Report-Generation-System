from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import json
import uuid
from datetime import datetime

app = FastAPI(title="Medical Report System API")

# Enable CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Data models
class PatientInfo(BaseModel):
    name: str
    gender: str
    age: int
    exam_number: str
    exam_date: str
    clinical_diagnosis: str

class MedicalReport(BaseModel):
    id: Optional[str] = None
    patient_info: PatientInfo
    exam_description: str
    findings: List[str]
    conclusion: str
    created_at: Optional[datetime] = None

class FlowchartNode(BaseModel):
    id: str
    type: str
    position: dict
    data: dict

class AnalysisData(BaseModel):
    metrics: List[float]
    labels: List[str]

# In-memory storage (replace with database in production)
reports_db = {}
flowcharts_db = {}

@app.get("/")
async def root():
    return {"message": "Medical Report System API"}

@app.post("/api/reports", response_model=MedicalReport)
async def create_report(report: MedicalReport):
    """Create a new medical report"""
    report.id = str(uuid.uuid4())
    report.created_at = datetime.now()
    reports_db[report.id] = report
    return report

@app.get("/api/reports/{report_id}", response_model=MedicalReport)
async def get_report(report_id: str):
    """Get a specific medical report"""
    if report_id not in reports_db:
        raise HTTPException(status_code=404, detail="Report not found")
    return reports_db[report_id]

@app.get("/api/reports", response_model=List[MedicalReport])
async def list_reports():
    """List all medical reports"""
    return list(reports_db.values())

@app.put("/api/reports/{report_id}", response_model=MedicalReport)
async def update_report(report_id: str, report: MedicalReport):
    """Update a medical report"""
    if report_id not in reports_db:
        raise HTTPException(status_code=404, detail="Report not found")
    
    report.id = report_id
    reports_db[report_id] = report
    return report

@app.delete("/api/reports/{report_id}")
async def delete_report(report_id: str):
    """Delete a medical report"""
    if report_id not in reports_db:
        raise HTTPException(status_code=404, detail="Report not found")
    
    del reports_db[report_id]
    return {"message": "Report deleted successfully"}

@app.post("/api/flowcharts")
async def save_flowchart(nodes: List[FlowchartNode]):
    """Save flowchart configuration"""
    flowchart_id = str(uuid.uuid4())
    flowcharts_db[flowchart_id] = {
        "id": flowchart_id,
        "nodes": nodes,
        "created_at": datetime.now()
    }
    return {"id": flowchart_id, "message": "Flowchart saved successfully"}

@app.get("/api/flowcharts/{flowchart_id}")
async def get_flowchart(flowchart_id: str):
    """Get flowchart configuration"""
    if flowchart_id not in flowcharts_db:
        raise HTTPException(status_code=404, detail="Flowchart not found")
    return flowcharts_db[flowchart_id]

@app.post("/api/analysis")
async def generate_analysis(data: AnalysisData):
    """Generate analysis visualization data"""
    # This would typically involve complex medical data analysis
    # For demo purposes, we'll return processed data
    
    processed_metrics = []
    for metric in data.metrics:
        # Apply some processing logic
        processed_value = min(max(metric * 1.1, 0), 1)  # Normalize between 0-1
        processed_metrics.append(processed_value)
    
    return {
        "processed_metrics": processed_metrics,
        "labels": data.labels,
        "analysis_summary": "Analysis completed successfully",
        "recommendations": [
            "Monitor patient condition regularly",
            "Consider follow-up examination",
            "Review medication if necessary"
        ]
    }

@app.post("/api/process-input")
async def process_user_input(input_data: dict):
    """Process user input for report modification"""
    user_input = input_data.get("text", "")
    
    # This would typically involve NLP processing
    # For demo purposes, we'll return a simple response
    
    response = {
        "processed_input": user_input,
        "suggestions": [
            f"Modify report section based on: {user_input}",
            "Update flowchart accordingly",
            "Regenerate analysis if needed"
        ],
        "action_type": "modify_report"
    }
    
    return response

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
