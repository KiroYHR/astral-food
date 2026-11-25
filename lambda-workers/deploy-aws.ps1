param(
  [string]$Region = "ap-southeast-1",
  [string]$QueueName = "astralfood-orders-queue",
  [string]$FunctionName = "astralfood-order-processor",
  [string]$RoleName = "astralfood-order-processor-role",
  [string]$SenderEmail = "",
  [string]$InvoiceBucket = ""
)

$ErrorActionPreference = "Stop"

Write-Host "=== AstralFood TV2: Deploy Unified Lambda Worker (SQS -> S3 PDF + SES Email) ===" -ForegroundColor Cyan

# 1. Kiem tra AWS CLI & Account ID
$AccountId = (aws sts get-caller-identity --query Account --output text).Trim()
if (-not $AccountId) {
  throw "Khong lay duoc AWS Account ID. Hay chay 'aws configure' truoc."
}
Write-Host "[1/6] AWS Account ID: $AccountId | Region: $Region" -ForegroundColor Green

if (-not $InvoiceBucket) {
  $InvoiceBucket = "astralfood-invoices-$AccountId"
}
if (-not $SenderEmail) {
  $SenderEmail = Read-Host "Nhap dia chi Email gui thong bao qua Amazon SES (VD: vuhuyduc1234dn@gmail.com)"
}

# 2. Tao S3 Bucket luu hoa don PDF (astralfood-invoices-<account-id>)
Write-Host "[2/6] Kiem tra/Tao S3 Bucket: $InvoiceBucket ..." -ForegroundColor Yellow
$bucketCheck = aws s3api head-bucket --bucket $InvoiceBucket 2>&1
if ($LASTEXITCODE -ne 0) {
  aws s3api create-bucket `
    --bucket $InvoiceBucket `
    --region $Region `
    --create-bucket-configuration LocationConstraint=$Region | Out-Null
  Write-Host "      Da tao S3 bucket: $InvoiceBucket" -ForegroundColor Green
} else {
  Write-Host "      S3 bucket da ton tai: $InvoiceBucket" -ForegroundColor Green
}

# 3. Verify Email gui tren Amazon SES
Write-Host "[3/6] Gui yeu cau xac minh email tren Amazon SES: $SenderEmail ..." -ForegroundColor Yellow
aws ses verify-email-identity --email-address $SenderEmail --region $Region | Out-Null
Write-Host "      Da gui email xac minh SES. Vui long mo hop thu '$SenderEmail' va bam link Verify!" -ForegroundColor Cyan

# 4. Dong goi ZIP cho order-processor
Write-Host "[4/6] Cai dat dependencies va dong goi order-processor.zip ..." -ForegroundColor Yellow
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$WorkerDir = Join-Path $ScriptDir "order-processor"
$ZipPath = Join-Path $ScriptDir "order-processor.zip"

Push-Location $WorkerDir
npm install --omit=dev
if (Test-Path $ZipPath) { Remove-Item $ZipPath -Force }
Compress-Archive -Path "index.js","normalizeOrder.js","invoiceService.js","notificationService.js","package.json","node_modules" -DestinationPath $ZipPath -Force
Pop-Location
Write-Host "      Da dong goi: $ZipPath" -ForegroundColor Green

# 5. Tao IAM Execution Role & gan quyen toi thieu (Logs + SQS + S3 PutObject + SES SendEmail)
Write-Host "[5/6] Cau hinh IAM Role: $RoleName ..." -ForegroundColor Yellow
$TrustPolicy = @{
  Version = "2012-10-17"
  Statement = @(
    @{
      Effect = "Allow"
      Principal = @{ Service = "lambda.amazonaws.com" }
      Action = "sts:AssumeRole"
    }
  )
} | ConvertTo-Json -Depth 5 -Compress

$RoleArn = (aws iam get-role --role-name $RoleName --query "Role.Arn" --output text 2>$null)
if (-not $RoleArn) {
  $RoleArn = (aws iam create-role --role-name $RoleName --assume-role-policy-document $TrustPolicy --query "Role.Arn" --output text).Trim()
  aws iam attach-role-policy --role-name $RoleName --policy-arn "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole" | Out-Null
  Start-Sleep -Seconds 8
}

$QueueArn = "arn:aws:sqs:${Region}:${AccountId}:${QueueName}"
$InlinePolicy = @{
  Version = "2012-10-17"
  Statement = @(
    @{
      Effect = "Allow"
      Action = @("sqs:ReceiveMessage", "sqs:DeleteMessage", "sqs:GetQueueAttributes")
      Resource = $QueueArn
    },
    @{
      Effect = "Allow"
      Action = @("s3:PutObject")
      Resource = "arn:aws:s3:::${InvoiceBucket}/invoices/*"
    },
    @{
      Effect = "Allow"
      Action = @("ses:SendEmail", "ses:SendRawEmail")
      Resource = "*"
    }
  )
} | ConvertTo-Json -Depth 5 -Compress

aws iam put-role-policy `
  --role-name $RoleName `
  --policy-name "astralfood-order-processor-inline-policy" `
  --policy-document $InlinePolicy | Out-Null
Write-Host "      IAM Role san sang: $RoleArn" -ForegroundColor Green

# 6. Deploy Lambda & gan SQS Trigger (ReportBatchItemFailures)
Write-Host "[6/6] Deploy AWS Lambda: $FunctionName va gan trigger SQS: $QueueName ..." -ForegroundColor Yellow
$EnvVars = "Variables={INVOICE_S3_BUCKET=$InvoiceBucket,SENDER_EMAIL=$SenderEmail}"

$fnExists = aws lambda get-function --function-name $FunctionName --region $Region 2>$null
if ($LASTEXITCODE -ne 0) {
  aws lambda create-function `
    --function-name $FunctionName `
    --runtime nodejs20.x `
    --role $RoleArn `
    --handler index.handler `
    --timeout 30 `
    --memory-size 256 `
    --zip-file "fileb://$ZipPath" `
    --environment $EnvVars `
    --region $Region | Out-Null
} else {
  aws lambda update-function-code `
    --function-name $FunctionName `
    --zip-file "fileb://$ZipPath" `
    --region $Region | Out-Null
  aws lambda wait function-updated --function-name $FunctionName --region $Region
  aws lambda update-function-configuration `
    --function-name $FunctionName `
    --timeout 30 `
    --memory-size 256 `
    --environment $EnvVars `
    --region $Region | Out-Null
}

$ExistingMapping = aws lambda list-event-source-mappings `
  --function-name $FunctionName `
  --event-source-arn $QueueArn `
  --region $Region `
  --query "EventSourceMappings[0].UUID" `
  --output text

if (-not $ExistingMapping -or $ExistingMapping -eq "None") {
  aws lambda create-event-source-mapping `
    --function-name $FunctionName `
    --event-source-arn $QueueArn `
    --batch-size 10 `
    --function-response-types ReportBatchItemFailures `
    --region $Region | Out-Null
  Write-Host "      Da gan SQS Trigger (ReportBatchItemFailures) cho $FunctionName" -ForegroundColor Green
} else {
  Write-Host "      SQS Trigger da ton tai (UUID: $ExistingMapping)" -ForegroundColor Green
}

Write-Host "`n=== HOAN TAT DEPLOY TV2 ===" -ForegroundColor Cyan
Write-Host "Hay cap nhat bien moi truong tren Backend (EC2/Render/.env):" -ForegroundColor White
Write-Host "  INVOICE_S3_BUCKET=$InvoiceBucket" -ForegroundColor Green
