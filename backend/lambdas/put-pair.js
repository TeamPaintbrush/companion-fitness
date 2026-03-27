// PUT /pair/{pairId}/{userId}
// Saves one user's workout data to the pair record (upsert).

const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb')
const { marshall } = require('@aws-sdk/util-dynamodb')

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

  const { pairId, userId } = event.pathParameters || {}
  if (!pairId || !userId) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Missing pairId or userId' }) }
  }

  let body
  try {
    body = JSON.parse(event.body || '{}')
  } catch {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Invalid JSON body' }) }
  }

  try {
    await client.send(new PutItemCommand({
      TableName: TABLE,
      Item: marshall({
        pairId,
        userId,
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
