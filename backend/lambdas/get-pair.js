// GET /pair/{pairId}
// Returns both users' records for a pair so each device can get its partner's data.

const { DynamoDBClient, QueryCommand } = require('@aws-sdk/client-dynamodb')
const { unmarshall } = require('@aws-sdk/util-dynamodb')

const client = new DynamoDBClient({})
const TABLE  = process.env.TABLE_NAME || 'companion-fitness-pairs'

const CORS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET,PUT,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
}

exports.handler = async (event) => {
  // Preflight
  if (event.requestContext?.http?.method === 'OPTIONS') {
    return { statusCode: 200, headers: CORS, body: '' }
  }

  const pairId = event.pathParameters?.pairId
  if (!pairId) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Missing pairId' }) }
  }

  try {
    const result = await client.send(new QueryCommand({
      TableName: TABLE,
      KeyConditionExpression: 'pairId = :p',
      ExpressionAttributeValues: { ':p': { S: pairId } }
    }))

    const items = (result.Items || []).map(item => unmarshall(item))
    return { statusCode: 200, headers: CORS, body: JSON.stringify(items) }
  } catch (err) {
    console.error('[get-pair] error:', err)
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: 'Internal error' }) }
  }
}
