from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pathlib import Path

from app.config import get_settings
from app.database import Database

from app.routers import auth as auth_router
from app.routers import customer as customer_router
from app.routers import shopkeeper as shopkeeper_router
from app.routers import admin as admin_router
from app.routers import notifications as notifications_router
from app.routers import uploads as uploads_router
from app.routers import support as support_router

settings = get_settings()

@asynccontextmanager
async def lifespan(app: FastAPI):
    Database.connect()
    yield
    Database.close()

app = FastAPI(
    title=settings.APP_NAME,
    description=settings.APP_DESCRIPTION,
    version=settings.APP_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    print("VALIDATION ERROR:", exc.errors())
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors()}
    )

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail, "message": str(exc.detail)}
    )

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    import traceback
    print("UNHANDLED EXCEPTION:", traceback.format_exc())
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal Server Error: {str(exc)}"}
    )

# ─── CORS Middleware ─────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Static Uploads Directory ────────────────────────────────────────────────
try:
    static_dir = Path("static/uploads")
    static_dir.mkdir(parents=True, exist_ok=True)
    if Path("static").exists():
        app.mount("/static", StaticFiles(directory="static"), name="static")
except Exception as e:
    print(f"Warning: Could not create or mount static directory: {e}")

# ─── Include Routers ──────────────────────────────────────────────────────────
app.include_router(auth_router.router, prefix="/api")
app.include_router(customer_router.router, prefix="/api")
app.include_router(shopkeeper_router.router, prefix="/api")
app.include_router(admin_router.router, prefix="/api")
app.include_router(notifications_router.router, prefix="/api")
app.include_router(uploads_router.router, prefix="/api")
app.include_router(support_router.router, prefix="/api")


# ─── Lifecycle Events (migrated to lifespan handler) ───────────────────────


# ─── Root & Health Endpoints ──────────────────────────────────────────────────

@app.get("/")
async def root():
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "description": settings.APP_DESCRIPTION,
        "docs": "/docs",
        "status": "running ✅",
    }


@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "database": "connected" if Database.db is not None else "disconnected"
    }

