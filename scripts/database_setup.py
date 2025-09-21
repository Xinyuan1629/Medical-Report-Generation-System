import sqlite3
from datetime import datetime

def create_database():
    """Create SQLite database for medical report system"""
    conn = sqlite3.connect('medical_reports.db')
    cursor = conn.cursor()
    
    # Create patients table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS patients (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            gender TEXT NOT NULL,
            age INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Create reports table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS reports (
            id TEXT PRIMARY KEY,
            patient_id INTEGER,
            exam_number TEXT UNIQUE NOT NULL,
            exam_date TEXT NOT NULL,
            clinical_diagnosis TEXT,
            exam_description TEXT,
            findings TEXT,
            conclusion TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (patient_id) REFERENCES patients (id)
        )
    ''')
    
    # Create flowcharts table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS flowcharts (
            id TEXT PRIMARY KEY,
            report_id TEXT,
            nodes_data TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (report_id) REFERENCES reports (id)
        )
    ''')
    
    # Create analysis_data table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS analysis_data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            report_id TEXT,
            metrics TEXT,
            labels TEXT,
            analysis_result TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (report_id) REFERENCES reports (id)
        )
    ''')
    
    # Create images table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS images (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            report_id TEXT,
            image_path TEXT NOT NULL,
            image_type TEXT,
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (report_id) REFERENCES reports (id)
        )
    ''')
    
    # Insert sample data
    cursor.execute('''
        INSERT OR IGNORE INTO patients (name, gender, age) 
        VALUES ('张三', '男', 45)
    ''')
    
    cursor.execute('''
        INSERT OR IGNORE INTO patients (name, gender, age) 
        VALUES ('李四', '女', 38)
    ''')
    
    conn.commit()
    conn.close()
    
    print("Database created successfully!")
    print("Tables created: patients, reports, flowcharts, analysis_data, images")

if __name__ == "__main__":
    create_database()
