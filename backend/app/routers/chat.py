from fastapi import APIRouter, Depends, HTTPException, Header, Request
from pydantic import BaseModel
from typing import Optional
from app.services.bedrock import BedrockService
from app.services.dynamodb import DynamoDBService

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    model_id: str = "anthropic.claude-3-sonnet-20240229-v1:0"

def get_bedrock_service():
    return BedrockService()

def get_dynamodb_service():
    return DynamoDBService()

@router.post("/api/chat")
async def chat_api(
    request: Request,
    chat_request: ChatRequest,
    bedrock: BedrockService = Depends(get_bedrock_service),
    dynamodb: DynamoDBService = Depends(get_dynamodb_service)
):
    # Get user ID from Cognito claims (passed by API Gateway/Mangum)
    user_id = "anonymous"
    try:
        event = request.scope.get("aws.event", {})
        claims = event.get("requestContext", {}).get("authorizer", {}).get("claims", {})
        user_id = claims.get("sub", "anonymous")
    except Exception:
        pass

    try:
        response_text = bedrock.invoke_model(chat_request.message, chat_request.model_id)
        dynamodb.save_chat_history(user_id, chat_request.message, response_text)
        return {"message": response_text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/tenant/chat")
async def chat_tenant(
    request: Request,
    chat_request: ChatRequest,
    x_tenant_id: Optional[str] = Header(None, alias="X-Tenant-Id"),
    bedrock: BedrockService = Depends(get_bedrock_service),
    dynamodb: DynamoDBService = Depends(get_dynamodb_service)
):
    # Tenant ID is validated by Lambda Authorizer
    tenant_id = x_tenant_id or "unknown_tenant"
    
    try:
        response_text = bedrock.invoke_model(chat_request.message, chat_request.model_id)
        dynamodb.save_chat_history(f"tenant:{tenant_id}", chat_request.message, response_text, tenant_id)
        return {"message": response_text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
