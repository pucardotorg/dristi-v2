import { test, expect } from "@playwright/test";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const SCRIPT_NAME = "cheque_cis_bridge_template.sh";

function findScriptViaPowerShell(): string {
  const repoRoot = path.resolve(process.cwd());
  const command =
    `Get-ChildItem -Path '${repoRoot}' -Recurse -Filter '${SCRIPT_NAME}' | Select-Object -ExpandProperty FullName`;
  const output = execSync(`powershell.exe -Command "${command}"`, {
    encoding: "utf-8",
  }).trim();

  if (!output) {
    throw new Error(`Could not find ${SCRIPT_NAME} via PowerShell`);
  }
  return output.split(/\r?\n/)[0];
}

test.describe("Step 5 — Bridge script file mode", () => {
  test("script exists and supports INPUT_JSON / OUTPUT_JSON mode", () => {
    const scriptPath = findScriptViaPowerShell();
    expect(fs.existsSync(scriptPath)).toBeTruthy();

    const content = fs.readFileSync(scriptPath, "utf-8");

    expect(content).toContain("INPUT_JSON=");
    expect(content).toContain("OUTPUT_JSON=");
    expect(content).toContain("FILE_MODE");
    expect(content).toContain('cp "$INPUT_JSON" "$PENDING_JSON"');
    expect(content).toContain("json.dump(results, fh,");
    expect(content).toContain("MODERN_PULL_URL");
    expect(content).toContain("MODERN_CALLBACK_URL");
  });
});
