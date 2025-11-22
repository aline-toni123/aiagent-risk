import { sqliteTable, integer, text, real, index, foreignKey } from 'drizzle-orm/sqlite-core';

// Auth tables for better-auth
export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" })
    .notNull(),
  image: text("image"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", {
    mode: "timestamp",
  }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", {
    mode: "timestamp",
  }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }),
  updatedAt: integer("updated_at", { mode: "timestamp" }),
});

// Risk Assessment Tables
export const riskAssessments = sqliteTable('risk_assessments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  applicantName: text('applicant_name').notNull(),
  creditScore: integer('credit_score').notNull(),
  income: real('income').notNull(),
  debtToIncomeRatio: real('debt_to_income_ratio').notNull(),
  employmentHistory: text('employment_history'),
  aiScore: integer('ai_score').notNull(),
  riskLevel: text('risk_level').notNull(), // 'low', 'medium', 'high', 'critical'
  analysisSummary: text('analysis_summary').notNull(),
  createdAt: text('created_at').notNull(),
}, (table) => ({
  userIdIdx: index('risk_assessments_user_id_idx').on(table.userId),
}));

export const riskReports = sqliteTable('risk_reports', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  assessmentId: integer('assessment_id').notNull().references(() => riskAssessments.id, { onDelete: 'cascade' }),
  reportSummary: text('report_summary').notNull(),
  pdfUrl: text('pdf_url'),
  generatedAt: text('generated_at').notNull(),
}, (table) => ({
  userIdIdx: index('risk_reports_user_id_idx').on(table.userId),
  assessmentIdIdx: index('risk_reports_assessment_id_idx').on(table.assessmentId),
}));

export const riskAlerts = sqliteTable('risk_alerts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  assessmentId: integer('assessment_id').references(() => riskAssessments.id, { onDelete: 'set null' }),
  type: text('type').notNull(), // 'fraud', 'default', 'compliance', 'anomaly'
  severity: text('severity').notNull(), // 'low', 'medium', 'high', 'critical'
  message: text('message').notNull(),
  isRead: integer('is_read', { mode: 'boolean' }).notNull().default(false),
  isResolved: integer('is_resolved', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull(),
}, (table) => ({
  userIdIdx: index('risk_alerts_user_id_idx').on(table.userId),
  assessmentIdIdx: index('risk_alerts_assessment_id_idx').on(table.assessmentId),
}));

// Finance Hub Tables

export const accounts = sqliteTable('accounts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  plaidAccountId: text('plaid_account_id'),
  name: text('name').notNull(),
  institution: text('institution'),
  type: text('type').notNull(), // "checking" | "savings" | "credit" | "brokerage" | "loan"
  last4: text('last4'),
  balance: real('balance').notNull().default(0),
  currency: text('currency').notNull().default('USD'),
  connected: integer('connected', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  userIdIdx: index('accounts_user_id_idx').on(table.userId),
}));

export const categories = sqliteTable('categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }), // NULL for global categories
  name: text('name').notNull(),
  parentId: integer('parent_id'),
  icon: text('icon'),
}, (table) => ({
  userIdIdx: index('categories_user_id_idx').on(table.userId),
  parentFk: foreignKey({
    columns: [table.parentId],
    foreignColumns: [table.id],
  }),
}));

export const rules = sqliteTable('rules', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  pattern: text('pattern').notNull(),
  categoryId: integer('category_id').notNull().references(() => categories.id),
  priority: integer('priority').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  userIdIdx: index('rules_user_id_idx').on(table.userId),
  priorityIdx: index('rules_priority_idx').on(table.priority),
}));

export const transactions = sqliteTable('transactions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  accountId: integer('account_id').notNull().references(() => accounts.id, { onDelete: 'cascade' }),
  date: integer('date', { mode: 'timestamp' }).notNull(),
  amount: real('amount').notNull(),
  description: text('description').notNull(),
  merchant: text('merchant'),
  type: text('type').notNull(), // "debit" | "credit"
  categoryId: integer('category_id').references(() => categories.id),
  pending: integer('pending', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  userIdIdx: index('transactions_user_id_idx').on(table.userId),
  accountIdIdx: index('transactions_account_id_idx').on(table.accountId),
  dateIdx: index('transactions_date_idx').on(table.date),
}));

export const budgets = sqliteTable('budgets', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  categoryId: integer('category_id').notNull().references(() => categories.id),
  month: integer('month').notNull(),
  year: integer('year').notNull(),
  amount: real('amount').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  userIdIdx: index('budgets_user_id_idx').on(table.userId),
  monthYearIdx: index('budgets_month_year_idx').on(table.month, table.year),
}));

export const goals = sqliteTable('goals', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  targetAmount: real('target_amount').notNull(),
  currentAmount: real('current_amount').notNull().default(0),
  deadline: integer('deadline', { mode: 'timestamp' }),
  categoryId: integer('category_id').references(() => categories.id),
  status: text('status').notNull().default('active'), // "active" | "completed" | "paused"
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  userIdIdx: index('goals_user_id_idx').on(table.userId),
  statusIdx: index('goals_status_idx').on(table.status),
}));

export const alerts = sqliteTable('alerts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // "overspend" | "cashflow" | "bill" | "unusual" | "goal"
  severity: text('severity').notNull(), // "info" | "warning" | "critical"
  message: text('message').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  read: integer('read', { mode: 'boolean' }).notNull().default(false),
}, (table) => ({
  userIdIdx: index('alerts_user_id_idx').on(table.userId),
  readIdx: index('alerts_read_idx').on(table.read),
}));

// User Settings Table
export const userSettings = sqliteTable('user_settings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').notNull().unique().references(() => user.id, { onDelete: 'cascade' }),
  emailNotifications: integer('email_notifications', { mode: 'boolean' }).notNull().default(true),
  themePreference: text('theme_preference').notNull().default('system'), // 'light' | 'dark' | 'system'
  riskThreshold: integer('risk_threshold').notNull().default(700),
  createdAt: text('created_at').notNull(),
}, (table) => ({
  userIdIdx: index('user_settings_user_id_idx').on(table.userId),
}));