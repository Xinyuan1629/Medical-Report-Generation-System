import subprocess
import sys
import os

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), os.pardir))

def install_requirements():
    """Install required Python packages"""
    packages = [
        "fastapi",
        "uvicorn[standard]",
        "pydantic",
        "python-multipart",
        "httpx"
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
        # Start the backend that actually exposes /api/generate-report and /ws/generate-report
        subprocess.run([
            sys.executable, "-m", "uvicorn", 
            "server.flowchart_save:app", 
            "--host", "0.0.0.0", 
            "--port", "8000", 
            "--reload"
        ], cwd=REPO_ROOT)
    except KeyboardInterrupt:
        print("\nServer stopped.")
    except Exception as e:
        print(f"Error running server: {e}")

if __name__ == "__main__":
    print("Setting up Medical Report System Backend...")
    install_requirements()
    print("\nStarting server...")
    run_server()
