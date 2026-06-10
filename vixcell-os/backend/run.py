import argparse
import uvicorn
import os

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Vixcell AI OS Backend Runner")
    parser.add_argument(
        "--host", 
        type=str, 
        default=os.getenv("VIXCELL_HOST", "127.0.0.1"), 
        help="Host interface to bind to"
    )
    parser.add_argument(
        "--port", 
        type=int, 
        default=int(os.getenv("VIXCELL_PORT", 8000)), 
        help="Port to run the server on"
    )
    parser.add_argument(
        "--reload", 
        action="store_true", 
        default=os.getenv("VIXCELL_RELOAD", "False").lower() in ("true", "1", "yes"), 
        help="Enable uvicorn auto-reload for development"
    )
    
    args = parser.parse_args()
    
    print(f"Starting Vixcell AI OS Backend on http://{args.host}:{args.port}")
    
    uvicorn.run(
        "app.main:app", 
        host=args.host, 
        port=args.port, 
        reload=args.reload
    )
