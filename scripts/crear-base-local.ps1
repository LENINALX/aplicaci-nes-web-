$ErrorActionPreference = 'Stop'
$projectDir = Split-Path -Parent $PSScriptRoot
$envPath = Join-Path $projectDir '.env'
$psql = 'C:\Program Files\PostgreSQL\17\bin\psql.exe'

if (!(Test-Path -LiteralPath $psql)) { throw 'No se encontró PostgreSQL 17. Revisa la ruta de psql en este script.' }
if (Test-Path -LiteralPath $envPath) { throw 'Ya existe .env. Revisa su configuración antes de crear otra base; no se sobrescribió.' }

# La contraseña del administrador solo se utiliza durante esta ejecución.
$adminPassword = Read-Host 'Contraseña del usuario postgres de tu instalación' -AsSecureString
$passwordPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($adminPassword)
$previousPassword = $env:PGPASSWORD
$previousTimeout = $env:PGCONNECT_TIMEOUT

function Invoke-LocalSql([string]$sql, [string]$database = 'postgres', [string]$user = 'postgres') {
    $output = $sql | & $psql -X -w -h localhost -p 5432 -U $user -d $database -v ON_ERROR_STOP=1 -t -A -f -
    if ($LASTEXITCODE -ne 0) { throw 'PostgreSQL rechazó la operación. Revisa el mensaje anterior.' }
    return $output
}

try {
    $env:PGPASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($passwordPointer)
    $env:PGCONNECT_TIMEOUT = '5'
    $existing = Invoke-LocalSql "SELECT 'usuario' FROM pg_roles WHERE rolname = 'auto_body' UNION ALL SELECT 'base' FROM pg_database WHERE datname = 'auto_body_ops';"
    if ($existing) {
        throw 'Ya existe auto_body o auto_body_ops. No se modificó nada; revisa esos recursos antes de continuar.'
    }

    $appPassword = [Guid]::NewGuid().ToString('N') + [Guid]::NewGuid().ToString('N')
    Invoke-LocalSql "CREATE ROLE auto_body LOGIN PASSWORD '$appPassword';" | Out-Null
    Invoke-LocalSql 'CREATE DATABASE auto_body_ops OWNER auto_body;' | Out-Null

    $env:PGPASSWORD = $appPassword
    @(
        'NODE_ENV=development'
        'PORT=3000'
        'DB_HOST=localhost'
        'DB_PORT=5432'
        'DB_USER=auto_body'
        "DB_PASS=$appPassword"
        'DB_NAME=auto_body_ops'
        'DB_SYNC=true'
    ) | Set-Content -LiteralPath $envPath -Encoding ascii

    $connection = Invoke-LocalSql 'SELECT current_database() || '' / '' || current_user;' 'auto_body_ops' 'auto_body'
    Write-Host "Conexión verificada: $connection"
    Write-Host 'Base creada y configuración guardada en .env (excluido de Git).'
    Write-Host 'Ahora puedes ejecutar: npm run start:dev'
} finally {
    $env:PGPASSWORD = $previousPassword
    $env:PGCONNECT_TIMEOUT = $previousTimeout
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($passwordPointer)
    $adminPassword.Dispose()
}
