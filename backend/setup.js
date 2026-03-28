/**
 * Companion Fitness — AWS Infrastructure Setup
 * Run once: cd backend && npm install && node setup.js
 *
 * Creates:
 *   - DynamoDB table (companion-fitness-pairs)
 *   - IAM role for Lambda
 *   - Two Lambda functions (get-pair, put-pair)
 *   - HTTP API Gateway with routes
 *
 * Writes VITE_API_URL to ../.env when done.
 */

const { DynamoDBClient, CreateTableCommand, DescribeTableCommand } = require('@aws-sdk/client-dynamodb')
const { IAMClient, CreateRoleCommand, AttachRolePolicyCommand, GetRoleCommand } = require('@aws-sdk/client-iam')
const { LambdaClient, CreateFunctionCommand, UpdateFunctionCodeCommand, GetFunctionCommand, AddPermissionCommand } = require('@aws-sdk/client-lambda')
const {
  ApiGatewayV2Client,
  CreateApiCommand,
  CreateIntegrationCommand,
  CreateRouteCommand,
  CreateStageCommand,
  CreateAuthorizerCommand
} = require('@aws-sdk/client-apigatewayv2')
const { STSClient, GetCallerIdentityCommand } = require('@aws-sdk/client-sts')
const AdmZip = require('adm-zip')
const fs   = require('fs')
const path = require('path')

// ── Config ──────────────────────────────────────────────────────────────────
const REGION      = process.env.AWS_REGION || 'us-east-1'
const TABLE       = 'companion-fitness-pairs'
const ROLE_NAME   = 'companion-fitness-lambda-role'
const GET_FN      = 'companion-fitness-get-pair'
const PUT_FN      = 'companion-fitness-put-pair'
const API_NAME    = 'companion-fitness-api'
const COGNITO_USER_POOL_ID = process.env.COGNITO_USER_POOL_ID || ''
const COGNITO_CLIENT_ID    = process.env.COGNITO_CLIENT_ID || ''
const USE_JWT_AUTH         = !!(COGNITO_USER_POOL_ID && COGNITO_CLIENT_ID)

const dynamo = new DynamoDBClient({ region: REGION })
const iam    = new IAMClient({ region: REGION })
const lambda = new LambdaClient({ region: REGION })
const apigw  = new ApiGatewayV2Client({ region: REGION })
const sts    = new STSClient({ region: REGION })

const sleep = ms => new Promise(r => setTimeout(r, ms))

// ── DynamoDB ─────────────────────────────────────────────────────────────────
async function ensureTable() {
  process.stdout.write('DynamoDB table... ')
  try {
    await dynamo.send(new CreateTableCommand({
      TableName:            TABLE,
      BillingMode:          'PAY_PER_REQUEST',
      KeySchema:            [{ AttributeName: 'pairId', KeyType: 'HASH' }, { AttributeName: 'userId', KeyType: 'RANGE' }],
      AttributeDefinitions: [{ AttributeName: 'pairId', AttributeType: 'S' }, { AttributeName: 'userId', AttributeType: 'S' }]
    }))
    // Wait for ACTIVE
    for (let i = 0; i < 20; i++) {
      const { Table } = await dynamo.send(new DescribeTableCommand({ TableName: TABLE }))
      if (Table.TableStatus === 'ACTIVE') break
      await sleep(2000)
    }
    console.log('created ✓')
  } catch (e) {
    if (e.name === 'ResourceInUseException') console.log('already exists ✓')
    else throw e
  }
}

// ── IAM Role ─────────────────────────────────────────────────────────────────
async function ensureRole() {
  process.stdout.write('IAM role... ')
  try {
    const { Role } = await iam.send(new GetRoleCommand({ RoleName: ROLE_NAME }))
    console.log('already exists ✓')
    return Role.Arn
  } catch {}

  const trust = JSON.stringify({
    Version: '2012-10-17',
    Statement: [{ Effect: 'Allow', Principal: { Service: 'lambda.amazonaws.com' }, Action: 'sts:AssumeRole' }]
  })
  const { Role } = await iam.send(new CreateRoleCommand({ RoleName: ROLE_NAME, AssumeRolePolicyDocument: trust }))
  await iam.send(new AttachRolePolicyCommand({ RoleName: ROLE_NAME, PolicyArn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole' }))
  await iam.send(new AttachRolePolicyCommand({ RoleName: ROLE_NAME, PolicyArn: 'arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess' }))
  console.log('created ✓ (waiting 10s for propagation...)')
  await sleep(10000)
  return Role.Arn
}

// ── Lambda ───────────────────────────────────────────────────────────────────
function zipFile(filename) {
  const zip = new AdmZip()
  zip.addLocalFile(path.join(__dirname, 'lambdas', filename))
  return zip.toBuffer()
}

async function deployLambda(name, filename, roleArn) {
  process.stdout.write(`Lambda ${name}... `)
  const ZipFile = zipFile(filename)
  const env     = { Variables: { TABLE_NAME: TABLE } }

  try {
    await lambda.send(new GetFunctionCommand({ FunctionName: name }))
    await lambda.send(new UpdateFunctionCodeCommand({ FunctionName: name, ZipFile }))
    console.log('updated ✓')
  } catch {
    await lambda.send(new CreateFunctionCommand({
      FunctionName: name,
      Runtime:      'nodejs18.x',
      Role:         roleArn,
      Handler:      filename.replace('.js', '') + '.handler',
      Code:         { ZipFile },
      Environment:  env,
      Timeout:      15,
      MemorySize:   128
    }))
    console.log('created ✓')
  }
  const { Configuration } = await lambda.send(new GetFunctionCommand({ FunctionName: name }))
  return Configuration.FunctionArn
}

// ── API Gateway ───────────────────────────────────────────────────────────────
async function setupApi(getFnArn, putFnArn, accountId) {
  process.stdout.write('API Gateway... ')
  const { ApiId, ApiEndpoint } = await apigw.send(new CreateApiCommand({
    Name:            API_NAME,
    ProtocolType:    'HTTP',
    CorsConfiguration: {
      AllowOrigins: ['*'],
      AllowMethods: ['GET', 'PUT', 'OPTIONS'],
      AllowHeaders: ['Content-Type', 'Authorization', 'x-pair-secret']
    }
  }))
  console.log('created ✓')

  let authorizerId = null
  if (USE_JWT_AUTH) {
    const issuer = `https://cognito-idp.${REGION}.amazonaws.com/${COGNITO_USER_POOL_ID}`
    const auth = await apigw.send(new CreateAuthorizerCommand({
      ApiId,
      Name: 'companion-fitness-cognito-jwt',
      AuthorizerType: 'JWT',
      IdentitySource: ['$request.header.Authorization'],
      JwtConfiguration: {
        Issuer: issuer,
        Audience: [COGNITO_CLIENT_ID]
      }
    }))
    authorizerId = auth.AuthorizerId
  }

  // Grant API Gateway permission to invoke each Lambda
  for (const [fnName, fnArn] of [[GET_FN, getFnArn], [PUT_FN, putFnArn]]) {
    try {
      await lambda.send(new AddPermissionCommand({
        FunctionName: fnName,
        StatementId:  `apigw-${ApiId}`,
        Action:       'lambda:InvokeFunction',
        Principal:    'apigateway.amazonaws.com',
        SourceArn:    `arn:aws:execute-api:${REGION}:${accountId}:${ApiId}/*/*`
      }))
    } catch (e) {
      if (!e.message?.includes('already exists')) throw e
    }
  }

  // Integrations
  const getInteg = await apigw.send(new CreateIntegrationCommand({ ApiId, IntegrationType: 'AWS_PROXY', IntegrationUri: getFnArn, PayloadFormatVersion: '2.0' }))
  const putInteg = await apigw.send(new CreateIntegrationCommand({ ApiId, IntegrationType: 'AWS_PROXY', IntegrationUri: putFnArn, PayloadFormatVersion: '2.0' }))

  // Routes
  await apigw.send(new CreateRouteCommand({
    ApiId,
    RouteKey: 'GET /pair/{pairId}',
    Target: `integrations/${getInteg.IntegrationId}`,
    AuthorizationType: USE_JWT_AUTH ? 'JWT' : 'NONE',
    AuthorizerId: authorizerId || undefined
  }))
  await apigw.send(new CreateRouteCommand({
    ApiId,
    RouteKey: 'PUT /pair/{pairId}/{userId}',
    Target: `integrations/${putInteg.IntegrationId}`,
    AuthorizationType: USE_JWT_AUTH ? 'JWT' : 'NONE',
    AuthorizerId: authorizerId || undefined
  }))

  // Auto-deploy stage
  await apigw.send(new CreateStageCommand({ ApiId, StageName: '$default', AutoDeploy: true }))

  return ApiEndpoint
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n🚀  Companion Fitness — AWS Setup')
  console.log(`    Region: ${REGION}\n`)

  try {
    const { Account: accountId } = await sts.send(new GetCallerIdentityCommand({}))
    console.log(`    Account: ${accountId}\n`)

    await ensureTable()
    const roleArn  = await ensureRole()
    const getFnArn = await deployLambda(GET_FN, 'get-pair.js', roleArn)
    const putFnArn = await deployLambda(PUT_FN, 'put-pair.js', roleArn)
    const apiUrl   = await setupApi(getFnArn, putFnArn, accountId)

    // Write .env to project root
    const envPath = path.join(__dirname, '..', '.env')
    fs.writeFileSync(envPath, `VITE_API_URL=${apiUrl}\n`)

    console.log('\n✅  Done!\n')
    console.log(`    API URL  : ${apiUrl}`)
    console.log(`    Saved to : .env\n`)
    console.log('Next steps:')
    console.log('  1. Go to GitHub repo → Settings → Secrets and variables → Actions')
    console.log(`  2. Add secret  VITE_API_URL  =  ${apiUrl}`)
    console.log('  3. Add secret  VITE_BASE_URL  =  /companion-fitness/')
    if (USE_JWT_AUTH) {
      console.log('  4. Configure frontend to provide Cognito ID token in localStorage key companion-fitness-id-token')
      console.log('  5. Push to GitHub — Actions will build and deploy to Pages automatically\n')
    } else {
      console.log('  4. (Optional) Re-run setup with COGNITO_USER_POOL_ID and COGNITO_CLIENT_ID to enable JWT auth')
      console.log('  5. Push to GitHub — Actions will build and deploy to Pages automatically\n')
    }
  } catch (err) {
    console.error('\n❌  Setup failed:', err.message)
    console.error(err)
    process.exit(1)
  }
}

main()
