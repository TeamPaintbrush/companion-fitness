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
  'Access-Control-Allow-Headers': 'Content-Type,Authorization,x-pair-secret'
}

function getHeader(event, key) {
  const headers = event.headers || {}
  return headers[key] || headers[key.toLowerCase()] || ''
}

exports.handler = async (event) => {
  // Preflight
  if (event.requestContext?.http?.method === 'OPTIONS') {
    return { statusCode: 200, headers: CORS, body: '' }
  }

  const pairId = event.pathParameters?.pairId
  const pairSecret = getHeader(event, 'x-pair-secret')
  if (!pairId) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Missing pairId' }) }
  }
  if (!pairSecret) {
    return { statusCode: 401, headers: CORS, body: JSON.stringify({ error: 'Missing pair secret' }) }
  }

  try {
    const result = await client.send(new QueryCommand({
      TableName: TABLE,
      KeyConditionExpression: 'pairId = :p',
      ExpressionAttributeValues: { ':p': { S: pairId } }
    }))

    const items = (result.Items || []).map(item => unmarshall(item))
    if (items.length > 0) {
      const savedSecret = items[0].pairSecret || ''
      if (!savedSecret || savedSecret !== pairSecret) {
        return { statusCode: 403, headers: CORS, body: JSON.stringify({ error: 'Invalid pair secret' }) }
      }
    }

    const sanitized = items.map(({ pairSecret: _pairSecret, ...rest }) => rest)
    return { statusCode: 200, headers: CORS, body: JSON.stringify(sanitized) }
  } catch (err) {
    console.error('[get-pair] error:', err)
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: 'Internal error' }) }
  }
}
