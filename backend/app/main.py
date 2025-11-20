import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum
from dotenv import load_dotenv

# Load environment variables if local
if os.getenv("IS_LOCAL"):
    load_dotenv()

from app.routers import chat

app = FastAPI()

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mock Authentication Middleware for Local Development
@app.middleware("http")
async def mock_auth_middleware(request: Request, call_next):
    if os.getenv("IS_LOCAL"):
        # Mock Cognito User
        request.scope["aws.event"] = {
            "requestContext": {
                "authorizer": {
                    "claims": {
                        "sub": "local-user-id",
                        "email": "local@example.com",
                        "cognito:username": "localuser"
                    }
                }
            }
        }
    response = await call_next(request)
    return response

app.include_router(chat.router)

@app.get("/")
def read_root():
    return {"Hello": "World"}

handler = Mangum(app)
