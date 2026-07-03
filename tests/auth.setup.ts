import { test as setup, expect } from "@playwright/test";
import fs from "fs";
import path from "path";

const TEST_EMAIL = "test-staff@court.gov.in";
const TEST_PASSWORD = "court123";
const AUTH_FILE = path.resolve("tests/.auth/staff.json");

setup("authenticate staff user", async ({ request }) => {
  fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true });

  const response = await request.post("/api/auth/sign-in/email", {
    data: { email: TEST_EMAIL, password: TEST_PASSWORD },
  });

  expect(
    response.ok(),
    `Staff login failed: ${await response.text()}`
  ).toBeTruthy();

  const state = await request.storageState();
  fs.writeFileSync(AUTH_FILE, JSON.stringify(state, null, 2));
});
