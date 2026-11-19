$API = "http://localhost:5000/api"
function Reg($n) { $b = @{ username=$n; email="$n@test.com"; password="password123" } | ConvertTo-Json; try { Invoke-RestMethod -Method Post -Uri "$API/auth/register" -ContentType "application/json" -Body $b | Out-Null } catch {} }
function Login($n) { $b = @{ email="$n@test.com"; password="password123" } | ConvertTo-Json; (Invoke-RestMethod -Method Post -Uri "$API/auth/login" -ContentType "application/json" -Body $b).token }
function Auth($t) { @{ Authorization = "Bearer $t" } }
$A = Login alice; $B = Login bob; $C = Login carol
Write-Host "Ready. Tokens loaded in `$A, `$B and `$C."