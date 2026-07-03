import pg from "pg";
const { Pool } = pg;
const pool = new Pool({ connectionString: "postgres://postgres:postgres@localhost:5432/pucar" });
const caseId = process.argv[2];
const tables = await pool.query(
  "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename"
);
console.log("tables:", tables.rows.map(r => r.tablename));

const r = await pool.query(
  'SELECT id, created_by, status, lifecycle_status FROM "case" WHERE id = $1',
  [caseId]
);
console.log("case row:", JSON.stringify(r.rows, null, 2));

const u = await pool.query('SELECT id, email FROM "user" LIMIT 5');
console.log("users:", JSON.stringify(u.rows, null, 2));

await pool.end();
