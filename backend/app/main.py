
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.database import Base, engine
from app.models.user import User
from app.models.category import Category
from app.models.menu import MenuItem
from app.models.order import Order, OrderItem
from app.routes.auth import router as auth_router
from app.routes.categories import router as categories_router
from app.routes.menu import router as menu_router
from app.routes.orders import router as orders_router



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

# Register authentication endpoints
app.include_router(auth_router)
app.include_router(categories_router)
app.include_router(menu_router)
app.include_router(orders_router)

@app.get("/")
def home():
    return {
        "message": "Welcome to MasalaCafe API!",
        "status": "running",
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "database": "connected",
    }
