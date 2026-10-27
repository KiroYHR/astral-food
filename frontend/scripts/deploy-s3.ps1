<#
.SYNOPSIS
    Script tự động Build và Triển khai Frontend AstralFood lên Amazon S3 & CloudFront CDN.
.DESCRIPTION
    1. Chạy npm run build (tsc -b && vite build) để sinh thư mục dist/
    2. Đồng bộ tệp lên S3 Bucket: aws s3 sync dist/ s3://$BucketName --delete --region ap-southeast-1
    3. Tự động xóa cache CloudFront: aws cloudfront create-invalidation --distribution-id $DistributionId --paths "/*"
.PARAMETER BucketName
    Tên S3 Bucket lưu trữ Static Website (mặc định: "astralfood-frontend")
.PARAMETER DistributionId
    ID phân phối CloudFront CDN (tùy chọn)
.PARAMETER Region
    Khu vực AWS (mặc định: "ap-southeast-1" - Singapore)
.PARAMETER SkipBuild
    Bỏ qua bước build nếu đã build trước đó
.EXAMPLE
    .\deploy-s3.ps1 -BucketName "astralfood-frontend" -DistributionId "E12345EXAMPLE"
#>

[CmdletBinding()]
param (
    [string]$BucketName = "astralfood-frontend",
    [string]$DistributionId = "",
    [string]$Region = "ap-southeast-1",
    [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host "  🚀 ASTRALFOOD FRONTEND - S3 & CLOUDFRONT DEPLOYMENT SCRIPT" -ForegroundColor Yellow
Write-Host "  Role: TV3 - Frontend & UI/UX Lead" -ForegroundColor Green
Write-Host "  Target: Amazon S3 (s3://$BucketName) | Region: $Region" -ForegroundColor White
Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Điều hướng về thư mục frontend
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$FrontendRoot = Split-Path -Parent $ScriptDir
Set-Location $FrontendRoot

# 2. Kiểm tra các công cụ yêu cầu
Write-Host "🔍 [1/4] Kiểm tra môi trường & công cụ..." -ForegroundColor Yellow

if (-not (Get-Command "npm" -ErrorAction SilentlyContinue)) {
    Write-Error "❌ LỖI: Không tìm thấy lệnh 'npm'. Vui lòng cài đặt Node.js trước khi tiếp tục."
    exit 1
}

if (-not (Get-Command "aws" -ErrorAction SilentlyContinue)) {
    Write-Error "❌ LỖI: Không tìm thấy AWS CLI ('aws'). Vui lòng cài đặt AWS CLI từ: https://aws.amazon.com/cli/"
    exit 1
}

# Kiểm tra xác thực AWS credentials
Write-Host "   -> Đang kiểm tra cấu hình tài khoản AWS (ap-southeast-1)..." -ForegroundColor Gray
try {
    $callerIdentity = aws sts get-caller-identity --output json 2>&1 | ConvertFrom-Json
    Write-Host "   ✅ Đã đăng nhập AWS thành công!" -ForegroundColor Green
    Write-Host "      - Account: $($callerIdentity.Account)" -ForegroundColor Gray
    Write-Host "      - ARN:     $($callerIdentity.Arn)" -ForegroundColor Gray
} catch {
    Write-Warning "⚠️ CẢNH BÁO: Chưa cấu hình hoặc phiên AWS credentials hết hạn."
    Write-Warning "   Vui lòng chạy 'aws configure' để nhập AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY và Region 'ap-southeast-1'."
    $confirm = Read-Host "Bạn có muốn tiếp tục chạy thử bước Build không? (y/N)"
    if ($confirm -ne 'y' -and $confirm -ne 'Y') {
        exit 1
    }
}

# 3. Chạy quá trình Build (TypeScript + Vite)
if (-not $SkipBuild) {
    Write-Host ""
    Write-Host "🔨 [2/4] Đang đóng gói ứng dụng (npm run build)..." -ForegroundColor Yellow
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Error "❌ LỖI: Quá trình build thất bại! Vui lòng sửa lỗi TypeScript/Vite trước khi deploy."
        exit 1
    }
    Write-Host "   ✅ Build thành công! Thư mục dist/ đã sẵn sàng." -ForegroundColor Green
} else {
    Write-Host "⏩ [2/4] Bỏ qua bước build (-SkipBuild)." -ForegroundColor Gray
}

# Đảm bảo thư mục dist/ tồn tại
if (-not (Test-Path "$FrontendRoot\dist\index.html")) {
    Write-Error "❌ LỖI: Không tìm thấy file $FrontendRoot\dist\index.html! Hãy chạy lại mà không dùng -SkipBuild."
    exit 1
}

# 4. Đồng bộ tệp lên Amazon S3
Write-Host ""
Write-Host "☁️  [3/4] Đồng bộ hóa tệp lên Amazon S3 (s3://$BucketName)..." -ForegroundColor Yellow
$syncCommand = "aws s3 sync dist/ `"s3://$BucketName`" --delete --region $Region"
Write-Host "   -> Lệnh: $syncCommand" -ForegroundColor Gray

aws s3 sync dist/ "s3://$BucketName" --delete --region $Region

if ($LASTEXITCODE -ne 0) {
    Write-Error "❌ LỖI: Không thể đồng bộ tệp lên S3 bucket '$BucketName'. Hãy kiểm tra quyền Bucket Policy hoặc S3 Bucket Name."
    exit 1
}
Write-Host "   ✅ Đồng bộ S3 hoàn tất thành công!" -ForegroundColor Green

# 5. Xóa Cache CloudFront (Invalidation)
Write-Host ""
Write-Host "⚡ [4/4] Làm mới bộ nhớ đệm CloudFront CDN..." -ForegroundColor Yellow

if ([string]::IsNullOrWhiteSpace($DistributionId)) {
    Write-Host "   ℹ️ Chưa cung cấp CloudFront Distribution ID (-DistributionId)." -ForegroundColor DarkYellow
    Write-Host "      Nếu bạn đã tạo CloudFront, hãy truyền tham số để xóa cache tự động:" -ForegroundColor Gray
    Write-Host "      .\scripts\deploy-s3.ps1 -BucketName `"$BucketName`" -DistributionId `"E12345EXAMPLE`"" -ForegroundColor Cyan
} else {
    Write-Host "   -> Đang tạo Invalidation cho Distribution ID: $DistributionId..." -ForegroundColor Gray
    $invalidationOutput = aws cloudfront create-invalidation --distribution-id $DistributionId --paths "/*" --output json 2>&1 | ConvertFrom-Json
    
    if ($LASTEXITCODE -eq 0 -and $invalidationOutput.Invalidation.Id) {
        Write-Host "   ✅ Đã tạo Invalidation thành công!" -ForegroundColor Green
        Write-Host "      - Invalidation ID: $($invalidationOutput.Invalidation.Id)" -ForegroundColor Cyan
        Write-Host "      - Status:          $($invalidationOutput.Invalidation.Status)" -ForegroundColor Gray
    } else {
        Write-Warning "⚠️ Không thể tạo CloudFront Invalidation. Vui lòng kiểm tra lại ID phân phối."
    }
}

# 6. Tổng kết
Write-Host ""
Write-Host "==================================================================" -ForegroundColor Green
Write-Host "  🎉 TRIỂN KHAI THÀNH CÔNG HẠ TẦNG FRONTEND ASTRALFOOD!" -ForegroundColor Green
Write-Host "==================================================================" -ForegroundColor Green
Write-Host "  🌐 S3 Website Endpoint: http://$BucketName.s3-website-$Region.amazonaws.com" -ForegroundColor Cyan
if (-not [string]::IsNullOrWhiteSpace($DistributionId)) {
    Write-Host "  🛡️ CloudFront CDN:       Kiểm tra URL phân phối trong AWS CloudFront Console" -ForegroundColor Cyan
}
Write-Host "  ⏱️ Hoàn tất lúc:          $(Get-Date -Format 'dd/MM/yyyy HH:mm:ss')" -ForegroundColor Gray
Write-Host "==================================================================" -ForegroundColor Green
Write-Host ""
