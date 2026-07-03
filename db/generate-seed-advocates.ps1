# generate-seed-advocates.ps1
# Reads the SWECOURTIS advocate_t snapshot and writes db/seed-advocates.sql
#
# Usage:
#   .\db\generate-seed-advocates.ps1 [-SourceSql <path>]
#
# Defaults to the 01-06-2026 snapshot. Output always goes to db/seed-advocates.sql.

param(
    [string]$SourceSql = "D:\kamba\deltaxy\pucar\swecourtis\sqlfiles\advocate_t_01-06-2026.sql"
)

$TENANT_ID  = "kl"
$COURT_ID   = "default-court"
$OUT        = Join-Path $PSScriptRoot "seed-advocates.sql"

$COLS = @(
    "adv_code","adv_name","ladv_name","adv_reg","display","address",
    "laddress","email","adv_sex","adv_mobile","adv_phone","adv_phone1",
    "off_add","loff_add","dist_code","taluka_code","village_code",
    "village1_code","village2_code","town_code","ward_code","adv_fax",
    "date_birth","debarred","pincode","dist_code_res","taluka_code_res",
    "village_code_res","village1_code_res","village2_code_res",
    "town_code_res","ward_code_res","status","frequent","adv_full_name",
    "adv_seniority","adv_gender","state_id_res","uid","advocate_type",
    "ori_adv_code","ori_adv_bar","adv_desig_from_date","state_id","amd",
    "create_modify","differently_abled","cis_adv_bar_reg_no"
)
$colIndex = @{}
for ($i = 0; $i -lt $COLS.Count; $i++) { $colIndex[$COLS[$i]] = $i }

function Parse-Values([string]$valStr) {
    $tokens = [System.Collections.Generic.List[object]]::new()
    $i = 0
    $s = $valStr.Trim()
    while ($i -lt $s.Length) {
        while ($i -lt $s.Length -and ($s[$i] -eq ',' -or $s[$i] -eq ' ')) { $i++ }
        if ($i -ge $s.Length) { break }
        if ($s[$i] -eq "'") {
            $i++  # skip opening quote
            $val = [System.Text.StringBuilder]::new()
            while ($i -lt $s.Length) {
                if ($s[$i] -eq "'" -and ($i+1) -lt $s.Length -and $s[$i+1] -eq "'") {
                    $null = $val.Append("'"); $i += 2
                } elseif ($s[$i] -eq "'") {
                    $i++; break
                } else {
                    $null = $val.Append($s[$i]); $i++
                }
            }
            $tokens.Add($val.ToString())
        } else {
            $val = [System.Text.StringBuilder]::new()
            while ($i -lt $s.Length -and $s[$i] -ne ',') { $null = $val.Append($s[$i]); $i++ }
            $raw = $val.ToString().Trim()
            if ($raw.ToUpper() -eq 'NULL') { $tokens.Add($null) } else { $tokens.Add($raw) }
        }
    }
    return $tokens
}

function Esc([string]$v) {
    if ($null -eq $v) { return 'NULL' }
    return "'" + $v.Replace("'", "''") + "'"
}

$lines = [System.IO.File]::ReadAllLines($SourceSql)
$rows  = [System.Collections.Generic.List[object[]]]::new()

foreach ($line in $lines) {
    if (-not $line.StartsWith("INSERT INTO advocate_t")) { continue }
    if ($line -match 'VALUES\((.+)\);?\s*$') {
        $tokens = Parse-Values $Matches[1]
        $arr = @($tokens)
        if ($arr.Count -eq $COLS.Count) {
            $rows.Add($arr)
        }
    }
}

Write-Host "Parsed $($rows.Count) rows from $(Split-Path $SourceSql -Leaf)"

$sb = [System.Text.StringBuilder]::new()
$null = $sb.AppendLine("-- Advocate seed data generated from SWECOURTIS advocate_t snapshot")
$null = $sb.AppendLine("-- Source: $(Split-Path $SourceSql -Leaf)")
$null = $sb.AppendLine("-- Generated: $(Get-Date -Format 'yyyy-MM-dd')")
$null = $sb.AppendLine("-- Run after schema.sql: psql -d pucar -f db/seed-advocates.sql")
$null = $sb.AppendLine("")
$null = $sb.AppendLine("BEGIN;")
$null = $sb.AppendLine("")
$null = $sb.AppendLine("-- Truncate existing seed data (re-runnable)")
$null = $sb.AppendLine("DELETE FROM advocate  WHERE tenant_id = '$TENANT_ID' AND additional_details->>'source' = 'swecourtis';")
$null = $sb.AppendLine("DELETE FROM individual WHERE tenant_id = '$TENANT_ID' AND additional_details->>'source' = 'swecourtis';")
$null = $sb.AppendLine("")

$inserted = 0
$skipped  = 0

foreach ($t in $rows) {
    $barNumber = if ($null -ne $t[$colIndex['cis_adv_bar_reg_no']]) { $t[$colIndex['cis_adv_bar_reg_no']] } else { $t[$colIndex['adv_reg']] }
    $name      = if ($null -ne $t[$colIndex['adv_full_name']] -and $t[$colIndex['adv_full_name']] -ne '') { $t[$colIndex['adv_full_name']] } else { $t[$colIndex['adv_name']] }

    if ([string]::IsNullOrWhiteSpace($barNumber) -or [string]::IsNullOrWhiteSpace($name)) {
        $skipped++
        continue
    }

    $genderCode = $t[$colIndex['adv_gender']]
    $sexCode    = $t[$colIndex['adv_sex']]
    $gender = if ($genderCode -eq 'F') { 'FEMALE' } elseif ($genderCode -eq 'M') { 'MALE' } elseif ($sexCode -eq '2') { 'FEMALE' } else { 'MALE' }

    $mobile = $t[$colIndex['adv_mobile']]
    if ($null -eq $mobile) { $mobile = $t[$colIndex['adv_phone']] }
    if ($null -eq $mobile) { $mobile = $t[$colIndex['adv_phone1']] }

    $email  = $t[$colIndex['email']]
    $dob    = $t[$colIndex['date_birth']]
    $status = if ($t[$colIndex['debarred']] -eq 'Y') { 'INACTIVE' } else { 'ACTIVE' }

    $indId = "swec_" + $t[$colIndex['adv_code']]   # stable deterministic ID from adv_code

    $null = $sb.AppendLine("INSERT INTO individual (id, tenant_id, given_name, mobile_number, email, date_of_birth, gender, additional_details, created_at, updated_at)")
    $null = $sb.AppendLine("  VALUES ($(Esc $indId), $(Esc $TENANT_ID), $(Esc $name), $(Esc $mobile), $(Esc $email), $(if ($null -eq $dob) { 'NULL' } else { "'" + $dob + "'" }), $(Esc $gender), '{""source"":""swecourtis""}', 0, 0)")
    $null = $sb.AppendLine("  ON CONFLICT (id) DO UPDATE SET given_name = EXCLUDED.given_name, mobile_number = EXCLUDED.mobile_number,")
    $null = $sb.AppendLine("    email = EXCLUDED.email, date_of_birth = EXCLUDED.date_of_birth, gender = EXCLUDED.gender, updated_at = 0;")
    $null = $sb.AppendLine("")
    $null = $sb.AppendLine("INSERT INTO advocate (id, tenant_id, individual_id, bar_registration_number, status, additional_details, created_at, updated_at)")
    $null = $sb.AppendLine("  VALUES ($(Esc "adv_$($t[$colIndex['adv_code']])"), $(Esc $TENANT_ID), $(Esc $indId), $(Esc $barNumber), $(Esc $status), '{""source"":""swecourtis""}', 0, 0)")
    $null = $sb.AppendLine("  ON CONFLICT (tenant_id, bar_registration_number) DO UPDATE SET")
    $null = $sb.AppendLine("    individual_id = EXCLUDED.individual_id, status = EXCLUDED.status, updated_at = 0;")
    $null = $sb.AppendLine("")

    $inserted++
}

$null = $sb.AppendLine("COMMIT;")

[System.IO.File]::WriteAllText($OUT, $sb.ToString(), [System.Text.Encoding]::UTF8)
Write-Host "Written: $OUT"
Write-Host "Rows: $inserted inserted, $skipped skipped"
