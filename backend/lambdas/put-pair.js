// PUT /pair/{pairId}/{userId}
// Saves one user's workout data to the pair record (upsert).

const { DynamoDBClient, PutItemCommand, QueryCommand } = require('@aws-sdk/client-dynamodb')
const { marshall } = require('@aws-sdk/util-dynamodb')

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

  const { pairId, userId } = event.pathParameters || {}
  const pairSecret = getHeader(event, 'x-pair-secret')
  if (!pairId || !userId) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Missing pairId or userId' }) }
  }
  if (!pairSecret) {
    return { statusCode: 401, headers: CORS, body: JSON.stringify({ error: 'Missing pair secret' }) }
  }

  let body
  try {
    body = JSON.parse(event.body || '{}')
  } catch {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Invalid JSON body' }) }
  }

  try {
    const existing = await client.send(new QueryCommand({
      TableName: TABLE,
      KeyConditionExpression: 'pairId = :p',
      ExpressionAttributeValues: { ':p': { S: pairId } },
      Limit: 1
    }))

    if ((existing.Items || []).length > 0) {
      const first = existing.Items[0]
      const existingSecret = first?.pairSecret?.S || ''
      if (!existingSecret || existingSecret !== pairSecret) {
        if (userId === 'user0') {
          return { statusCode: 409, headers: CORS, body: JSON.stringify({ error: 'Pair code already in use' }) }
        }
        return { statusCode: 403, headers: CORS, body: JSON.stringify({ error: 'Invalid pair secret' }) }
      }
    } else if (userId !== 'user0') {
      // Pair must be initialized by creator first to prevent accidental wrong-secret pair creation.
      return { statusCode: 409, headers: CORS, body: JSON.stringify({ error: 'Pair not initialized' }) }
    }

    await client.send(new PutItemCommand({
      TableName: TABLE,
      Item: marshall({
        pairId,
        userId,
        pairSecret,
        workouts:    body.workouts    || {},
        userProfile: body.userProfile || {},
        challenge:   body.challenge   || {},
        updatedAt:   Date.now()
      }, { removeUndefinedValues: true })
    }))

    return { statusCode: 200, headers: CORS, body: JSON.stringify({ ok: true }) }
  } catch (err) {
    console.error('[put-pair] error:', err)
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: 'Internal error' }) }
  }
}
