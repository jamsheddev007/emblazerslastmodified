import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";
import { eq, and } from "drizzle-orm";

const connectionString = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;
const isSupabase = !!process.env.SUPABASE_DATABASE_URL;
const hasPgParams = process.env.PGHOST && process.env.PGUSER && process.env.PGPASSWORD;

if (!connectionString && !hasPgParams) {
  throw new Error(
    "DATABASE_URL, SUPABASE_DATABASE_URL, or PG* environment variables must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool(
  connectionString
    ? {
        connectionString,
        ssl: isSupabase ? { rejectUnauthorized: false } : undefined,
      }
    : {
        host: process.env.PGHOST,
        port: parseInt(process.env.PGPORT || "5432", 10),
        user: process.env.PGUSER,
        password: process.env.PGPASSWORD,
        database: process.env.PGDATABASE || "postgres",
        ssl: { rejectUnauthorized: false },
      }
);
export const db = drizzle(pool, { schema });

const DEFAULT_ACCOUNTS = [
  { accountCode: "1001", accountName: "Cash", accountType: "Asset" },
  { accountCode: "1002", accountName: "Bank", accountType: "Asset" },
  { accountCode: "1003", accountName: "Accounts Receivable", accountType: "Asset" },
  { accountCode: "2001", accountName: "Accounts Payable", accountType: "Liability" },
  { accountCode: "3001", accountName: "Capital/Equity", accountType: "Equity" },
  { accountCode: "4001", accountName: "Fee Income", accountType: "Income" },
  { accountCode: "4002", accountName: "Admission Income", accountType: "Income" },
  { accountCode: "4003", accountName: "POS Income", accountType: "Income" },
  { accountCode: "4004", accountName: "Hostel Income", accountType: "Income" },
  { accountCode: "4005", accountName: "Library Income", accountType: "Income" },
  { accountCode: "5001", accountName: "Salary Expense", accountType: "Expense" },
  { accountCode: "5002", accountName: "Utilities Expense", accountType: "Expense" },
  { accountCode: "5003", accountName: "Maintenance Expense", accountType: "Expense" },
  { accountCode: "5004", accountName: "Supplies Expense", accountType: "Expense" },
  { accountCode: "5005", accountName: "Transport Expense", accountType: "Expense" },
  { accountCode: "5006", accountName: "Events Expense", accountType: "Expense" },
  { accountCode: "5007", accountName: "Marketing Expense", accountType: "Expense" },
  { accountCode: "5008", accountName: "IT Expense", accountType: "Expense" },
  { accountCode: "5009", accountName: "Miscellaneous Expense", accountType: "Expense" },
];

export async function seedAccountsForBranch(branchId: number): Promise<void> {
  try {
    const now = new Date().toISOString();
    for (const acc of DEFAULT_ACCOUNTS) {
      const existing = await db
        .select()
        .from(schema.chartOfAccountsTable)
        .where(
          and(
            eq(schema.chartOfAccountsTable.accountCode, acc.accountCode),
            eq(schema.chartOfAccountsTable.branchId, branchId)
          )
        );
      if (existing.length === 0) {
        await db.insert(schema.chartOfAccountsTable).values({
          ...acc,
          level: 1,
          openingBalance: 0,
          currentBalance: 0,
          isSystemAccount: true,
          isActive: true,
          createdAt: now,
          branchId,
        });
      }
    }
    console.log(`Default chart of accounts seeded for branch ${branchId}`);
  } catch (err) {
    console.error(`Failed to seed accounts for branch ${branchId}:`, err);
  }
}

export async function seedDefaultAccounts(): Promise<void> {
  try {
    const existing = await db.select().from(schema.chartOfAccountsTable);
    if (existing.length > 0) return;

    await db.insert(schema.chartOfAccountsTable).values(
      DEFAULT_ACCOUNTS.map((acc) => ({
        ...acc,
        level: 1,
        openingBalance: 0,
        currentBalance: 0,
        isSystemAccount: true,
        isActive: true,
        createdAt: new Date().toISOString(),
      }))
    );
    console.log("Default chart of accounts seeded successfully");
  } catch (err) {
    console.error("Failed to seed default accounts:", err);
  }
}

export async function seedModuleUsers(): Promise<void> {
  try {
    const bcrypt = await import("bcryptjs");
    const existing = await db.select().from(schema.moduleUsers);
    if (existing.length > 0) return;

    const { moduleUserCredentials } = schema;
    const entries = Object.entries(moduleUserCredentials) as [string, { email: string; password: string; role: string; name: string }][];

    for (const [mod, creds] of entries) {
      const passwordHash = await bcrypt.hash(creds.password, 10);
      await db.insert(schema.moduleUsers).values({
        module: mod,
        email: creds.email,
        passwordHash,
        name: creds.name,
        role: creds.role,
      });
    }
    console.log("Module users seeded successfully");
  } catch (err) {
    console.error("Failed to seed module users:", err);
  }
}

async function runSchemaMigrations(): Promise<void> {
  try {
    await pool.query(`ALTER TABLE finance_vouchers ADD COLUMN IF NOT EXISTS source_module text;`);
  } catch (err) {
    console.warn("Schema migration warning (non-fatal):", (err as Error).message);
  }
  try {
    await pool.query(`ALTER TABLE schools ADD COLUMN IF NOT EXISTS expiry_date text;`);
  } catch (err) {
    console.warn("expiry_date migration warning (non-fatal):", (err as Error).message);
  }
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS vendor_payments (
        id SERIAL PRIMARY KEY,
        vendor_id TEXT NOT NULL,
        vendor_name TEXT NOT NULL,
        amount REAL NOT NULL,
        description TEXT NOT NULL,
        payment_date TEXT NOT NULL,
        voucher_id TEXT,
        branch_id INTEGER,
        created_at TEXT NOT NULL
      );
    `);
  } catch (err) {
    console.warn("vendor_payments table migration warning (non-fatal):", (err as Error).message);
  }
  const legacyCOAEntries = [
    { code: "1003", name: "Accounts Receivable", type: "Asset" },
    { code: "4003", name: "POS Income", type: "Income" },
    { code: "4004", name: "Hostel Income", type: "Income" },
    { code: "4005", name: "Library Income", type: "Income" },
    { code: "2001", name: "Accounts Payable", type: "Liability" },
  ];
  for (const e of legacyCOAEntries) {
    try {
      await pool.query(
        `INSERT INTO chart_of_accounts (account_code, account_name, account_type, is_active, created_at)
         VALUES ($1, $2, $3, true, NOW()::text)
         ON CONFLICT (account_code) DO NOTHING;`,
        [e.code, e.name, e.type]
      );
    } catch (err) {
      console.warn(`COA ${e.code} migration warning (non-fatal):`, (err as Error).message);
    }
  }
}

export async function connectDB(): Promise<void> {
  try {
    const client = await pool.connect();
    client.release();
    const label = process.env.SUPABASE_DATABASE_URL ? " (Supabase)" : "";
    console.log(`PostgreSQL connected successfully${label}`);
    dbConnected = true;
    await runSchemaMigrations();
    await seedModuleUsers();
    await seedDefaultAccounts();
  } catch (error) {
    console.error("PostgreSQL connection error:", error);
    process.exit(1);
  }
}

let dbConnected = false;

export function isDBConnected(): boolean {
  return dbConnected;
}

export function setDBConnected(val: boolean): void {
  dbConnected = val;
}
