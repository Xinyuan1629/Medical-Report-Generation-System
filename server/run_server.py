import subprocess
import sys
import os

def install_requirements():
    """Install required Python packages"""
    packages = [
        "fastapi",
        "uvicorn[standard]",
        "pydantic",
        "python-multipart",
        "sqlite3"
    ]
    
    for package in packages:
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install", package])
            print(f"✓ Installed {package}")
        except subprocess.CalledProcessError:
            print(f"✗ Failed to install {package}")

def run_server():
    """Run the FastAPI server"""
    try:
        # First create the database
        exec(open('scripts/database_setup.py').read())
        
        # Then run the server
        subprocess.run([
            sys.executable, "-m", "uvicorn", 
            "scripts.backend_api:app", 
            "--host", "0.0.0.0", 
            "--port", "8000", 
            "--reload"
        ])
    except KeyboardInterrupt:
        print("\nServer stopped.")
    except Exception as e:
        print(f"Error running server: {e}")

if __name__ == "__main__":
    print("Setting up Medical Report System Backend...")
    install_requirements()
    print("\nStarting server...")
    run_server()
