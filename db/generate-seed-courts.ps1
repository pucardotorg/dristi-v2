# generate-seed-courts.ps1
# Writes db/seed-courts.sql with the court lookup rows required by the app.
#
# Usage:
#   .\db\generate-seed-courts.ps1 [-TenantId <tenant>]
#
# Output always goes to db/seed-courts.sql.

param(
    [string]$TenantId = "kl"
)

$OUT = Join-Path $PSScriptRoot "seed-courts.sql"

$courts = @(
    [pscustomobject]@{
        Id        = "klcourt001"
        Name      = "24x7 ON Court Chandigarh"
        Code      = "KLCOURT001"
        CourtType = "MAGISTRATE"
        Address   = "Chandigarh"
    },
    [pscustomobject]@{
        Id        = "default-court"
        Name      = "24x7 ON Court Chandigarh"
        Code      = "DEFAULT-COURT"
        CourtType = "MAGISTRATE"
        Address   = "Chandigarh"
    },
    [pscustomobject]@{
        Id        = "klcourt002"
        Name      = "Chief Judicial Magistrate Chandigarh"
        Code      = "KLCOURT002"
        CourtType = "MAGISTRATE"
        Address   = "Chandigarh"
    },
    [pscustomobject]@{
        Id        = "klcourt003"
        Name      = "District Court Mohali"
        Code      = "KLCOURT003"
        CourtType = "DISTRICT"
        Address   = "Mohali, Punjab"
    }
)

function Esc([string]$v) {
    if ($null -eq $v) { return 'NULL' }
    return "'" + $v.Replace("'", "''") + "'"
}

$sb = [System.Text.StringBuilder]::new()
$null = $sb.AppendLine("-- Court seed data generated for pucar-drishti-v2")
$null = $sb.AppendLine("-- Generated: $(Get-Date -Format 'yyyy-MM-dd')")
$null = $sb.AppendLine("-- Run after schema.sql: psql -d pucar -f db/seed-courts.sql")
$null = $sb.AppendLine("")
$null = $sb.AppendLine("BEGIN;")
$null = $sb.AppendLine("")
$null = $sb.AppendLine("-- Re-runnable court lookup seed. Does not delete rows because cases may reference courts.")
$null = $sb.AppendLine("")

foreach ($court in $courts) {
    $detailsJson = '{"source":"seed-courts"}'

    $null = $sb.AppendLine("INSERT INTO court (id, tenant_id, name, code, court_type, address, is_active, additional_details, created_at, updated_at)")
    $null = $sb.AppendLine("  VALUES ($(Esc $court.Id), $(Esc $TenantId), $(Esc $court.Name), $(Esc $court.Code), $(Esc $court.CourtType), $(Esc $court.Address), true, $(Esc $detailsJson), 0, 0)")
    $null = $sb.AppendLine("  ON CONFLICT (id) DO UPDATE SET")
    $null = $sb.AppendLine("    tenant_id = EXCLUDED.tenant_id,")
    $null = $sb.AppendLine("    name = EXCLUDED.name,")
    $null = $sb.AppendLine("    code = EXCLUDED.code,")
    $null = $sb.AppendLine("    court_type = EXCLUDED.court_type,")
    $null = $sb.AppendLine("    address = EXCLUDED.address,")
    $null = $sb.AppendLine("    is_active = EXCLUDED.is_active,")
    $null = $sb.AppendLine("    additional_details = EXCLUDED.additional_details,")
    $null = $sb.AppendLine("    updated_at = 0;")
    $null = $sb.AppendLine("")
}

$null = $sb.AppendLine("COMMIT;")

[System.IO.File]::WriteAllText($OUT, $sb.ToString(), [System.Text.Encoding]::UTF8)
Write-Host "Written: $OUT"
Write-Host "Rows: $($courts.Count) courts"
