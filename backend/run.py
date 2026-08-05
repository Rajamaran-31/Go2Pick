import uvicorn

if __name__ == "__main__":
    # Disable reload on Windows to prevent the uvicorn watchfiles reloader from hanging
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=False)
