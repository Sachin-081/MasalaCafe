
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.database import Base, engine
from app.config import settings
from app.models.user import User
from app.models.category import Category
from app.models.menu import MenuItem
from app.models.order import Order, OrderItem
from app.models.inventory import InventoryStock, InventoryMovement
from app.models.account_deletion import AccountDeletionRequest
from app.routes.auth import router as auth_router
from app.routes.categories import router as categories_router
from app.routes.menu import router as menu_router
from app.routes.orders import router as orders_router
from app.routes.inventory import router as inventory_router
from app.routes.analytics import router as analytics_router
from app.routes.account_deletion import router as account_deletion_router



@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="MasalaCafe API",
    description="Backend API for the MasalaCafe Canteen Management System",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register authentication endpoints
app.include_router(auth_router)
app.include_router(categories_router)
app.include_router(menu_router)
app.include_router(orders_router)
app.include_router(inventory_router)
app.include_router(analytics_router)
app.include_router(account_deletion_router)

@app.get("/")
def home():
    return {
        "message": "Welcome to MasalaCafe API!",
        "status": "running",
    }


@app.get("/health")
def health_check():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
    except SQLAlchemyError as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "status": "unhealthy",
                "database": "disconnected",
            },
        ) from error

    return {
        "status": "healthy",
        "database": "connected",
    }
