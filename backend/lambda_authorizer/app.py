import os
import boto3

def lambda_handler(event, context):
    print(f"Event: {event}")
    
    headers = event.get('headers', {})
    # Headers might be lower case or upper case depending on the proxy
    tenant_id = headers.get('x-tenant-id') or headers.get('X-Tenant-Id')
    api_key = headers.get('x-api-key') or headers.get('X-Api-Key')
    
    if not tenant_id or not api_key:
        return generate_policy('user', 'Deny', event['methodArn'])

    # Verify against DynamoDB
    dynamodb = boto3.resource('dynamodb')
    table = dynamodb.Table(os.getenv('TABLE_NAME_TENANTS', 'Tenants'))
    
    try:
        response = table.get_item(Key={'TenantId': tenant_id})
        item = response.get('Item')
        
        if item and item.get('ApiKey') == api_key:
            return generate_policy(tenant_id, 'Allow', event['methodArn'])
        else:
            return generate_policy(tenant_id, 'Deny', event['methodArn'])
            
    except Exception as e:
        print(f"Error authorizing: {e}")
        return generate_policy('user', 'Deny', event['methodArn'])

def generate_policy(principal_id, effect, resource):
    auth_response = {}
    auth_response['principalId'] = principal_id
    if effect and resource:
        policy_document = {}
        policy_document['Version'] = '2012-10-17'
        statement = []
        statement_one = {}
        statement_one['Action'] = 'execute-api:Invoke'
        statement_one['Effect'] = effect
        statement_one['Resource'] = resource
        statement.append(statement_one)
        policy_document['Statement'] = statement
        auth_response['policyDocument'] = policy_document
    
    # Optional: Output context keys
    # auth_response['context'] = {
    #     "stringKey": "stringval",
    #     "numberKey": 123,
    #     "booleanKey": True
    # }
    
    return auth_response
