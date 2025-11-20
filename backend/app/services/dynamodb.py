import boto3
import os
import time
from typing import Optional, Dict, Any

class DynamoDBService:
    def __init__(self):
        self.dynamodb = boto3.resource(
            'dynamodb',
            region_name=os.getenv('REGION_NAME', 'ap-northeast-1')
        )
        self.tenants_table = self.dynamodb.Table(os.getenv('TABLE_NAME_TENANTS', 'Tenants'))
        self.history_table = self.dynamodb.Table(os.getenv('TABLE_NAME_CHAT_HISTORY', 'ChatHistory'))

    def get_tenant(self, api_key: str) -> Optional[Dict[str, Any]]:
        try:
            # Assuming API Key is the partition key or we query by GSI
            # For simplicity, let's assume we scan or query. 
            # Ideally, API Key should be an index.
            # Here we assume a GSI on ApiKey if TenantId is PK.
            # Or if ApiKey is PK. Let's assume ApiKey is PK for lookup for now or we scan.
            # Better: TenantId (PK), ApiKey (Attribute). 
            # But for auth, we need to look up by ApiKey.
            # Let's assume we have a GSI 'ApiKeyIndex'
            
            response = self.tenants_table.scan(
                FilterExpression=boto3.dynamodb.conditions.Attr('ApiKey').eq(api_key)
            )
            items = response.get('Items', [])
            if items:
                return items[0]
            return None
        except Exception as e:
            print(f"Error getting tenant: {e}")
            return None

    def save_chat_history(self, user_id: str, message: str, response: str, tenant_id: Optional[str] = None):
        try:
            item = {
                'UserId': user_id,
                'Timestamp': int(time.time()),
                'Message': message,
                'Response': response
            }
            if tenant_id:
                item['TenantId'] = tenant_id
            
            self.history_table.put_item(Item=item)
        except Exception as e:
            print(f"Error saving chat history: {e}")
            # Non-blocking error
            pass
