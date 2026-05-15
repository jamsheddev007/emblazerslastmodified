CREATE TABLE "accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"balance" real DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "activity_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"module" text NOT NULL,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text,
	"entity_name" text,
	"description" text NOT NULL,
	"user_id" text,
	"user_email" text,
	"metadata" jsonb,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "applicants" (
	"id" serial PRIMARY KEY NOT NULL,
	"vacancy_id" text NOT NULL,
	"vacancy_title" text NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"cnic" text NOT NULL,
	"address" text,
	"qualification" text NOT NULL,
	"experience" text NOT NULL,
	"expected_salary" real,
	"applied_date" text NOT NULL,
	"status" text DEFAULT 'New' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attendance_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" text NOT NULL,
	"target_type" text NOT NULL,
	"student_id" text,
	"staff_id" text,
	"entity_name" text NOT NULL,
	"class_name" text,
	"section" text,
	"status" text NOT NULL,
	"marked_by" text,
	"remarks" text,
	"marked_at" text,
	"updated_at" text
);
--> statement-breakpoint
CREATE TABLE "book_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" text
);
--> statement-breakpoint
CREATE TABLE "book_issues" (
	"id" serial PRIMARY KEY NOT NULL,
	"book_id" text NOT NULL,
	"book_title" text NOT NULL,
	"accession_no" text NOT NULL,
	"member_id" text NOT NULL,
	"member_name" text NOT NULL,
	"member_type" text NOT NULL,
	"class" text,
	"section" text,
	"issue_date" text NOT NULL,
	"due_date" text NOT NULL,
	"return_date" text,
	"fine" real DEFAULT 0 NOT NULL,
	"fine_paid" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'Issued' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "books" (
	"id" serial PRIMARY KEY NOT NULL,
	"accession_no" text NOT NULL,
	"title" text NOT NULL,
	"author" text NOT NULL,
	"category" text NOT NULL,
	"isbn" text NOT NULL,
	"edition" text,
	"publisher" text,
	"total_copies" integer DEFAULT 1 NOT NULL,
	"available_copies" integer DEFAULT 1 NOT NULL,
	"status" text DEFAULT 'Available' NOT NULL,
	CONSTRAINT "books_accession_no_unique" UNIQUE("accession_no")
);
--> statement-breakpoint
CREATE TABLE "challans" (
	"id" serial PRIMARY KEY NOT NULL,
	"challan_no" text NOT NULL,
	"student_id" text NOT NULL,
	"student_name" text NOT NULL,
	"class" text NOT NULL,
	"section" text NOT NULL,
	"academic_session" text NOT NULL,
	"period" text NOT NULL,
	"fee_structure_id" text,
	"fee_heads" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"total_amount" real NOT NULL,
	"discount_id" text,
	"discount_name" text,
	"discount_amount" real DEFAULT 0 NOT NULL,
	"late_fee" real DEFAULT 0 NOT NULL,
	"adjustments" real DEFAULT 0 NOT NULL,
	"net_amount" real NOT NULL,
	"paid_amount" real DEFAULT 0 NOT NULL,
	"balance_amount" real NOT NULL,
	"due_date" text NOT NULL,
	"issue_date" text NOT NULL,
	"status" text DEFAULT 'Pending' NOT NULL,
	"installment_plan_id" text,
	"installment_number" integer,
	"created_at" text NOT NULL,
	CONSTRAINT "challans_challan_no_unique" UNIQUE("challan_no")
);
--> statement-breakpoint
CREATE TABLE "chart_of_accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"account_code" text NOT NULL,
	"account_name" text NOT NULL,
	"account_type" text NOT NULL,
	"parent_account_id" text,
	"level" integer DEFAULT 1 NOT NULL,
	"description" text,
	"opening_balance" real DEFAULT 0 NOT NULL,
	"current_balance" real DEFAULT 0 NOT NULL,
	"is_system_account" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" text NOT NULL,
	CONSTRAINT "chart_of_accounts_account_code_unique" UNIQUE("account_code")
);
--> statement-breakpoint
CREATE TABLE "counters" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"value" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "counters_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "curriculums" (
	"id" serial PRIMARY KEY NOT NULL,
	"class" text NOT NULL,
	"subject" text NOT NULL,
	"topics" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"assigned_teachers" jsonb DEFAULT '[]'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "date_sheets" (
	"id" serial PRIMARY KEY NOT NULL,
	"exam_name" text NOT NULL,
	"exam_type" text NOT NULL,
	"class" text NOT NULL,
	"start_date" text NOT NULL,
	"end_date" text NOT NULL,
	"entries" jsonb DEFAULT '[]'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "discount_rules" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"value" real NOT NULL,
	"category" text NOT NULL,
	"applicable_classes" jsonb,
	"applicable_fee_heads" jsonb,
	"valid_from" text NOT NULL,
	"valid_to" text,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "drivers" (
	"id" serial PRIMARY KEY NOT NULL,
	"driver_id" text,
	"name" text NOT NULL,
	"cnic" text NOT NULL,
	"contact" text NOT NULL,
	"address" text,
	"license_number" text NOT NULL,
	"license_expiry" text NOT NULL,
	"experience" integer NOT NULL,
	"vehicle_id" text,
	"route_id" text,
	"salary" real NOT NULL,
	"status" text DEFAULT 'Active' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exam_results" (
	"id" serial PRIMARY KEY NOT NULL,
	"exam_id" text NOT NULL,
	"student_id" text NOT NULL,
	"student_name" text NOT NULL,
	"class" text NOT NULL,
	"subject" text NOT NULL,
	"marks_obtained" real NOT NULL,
	"max_marks" real NOT NULL,
	"grade" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exams" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"term" text NOT NULL,
	"class_range" text NOT NULL,
	"start_date" text NOT NULL,
	"end_date" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" serial PRIMARY KEY NOT NULL,
	"expense_id" text NOT NULL,
	"date" text NOT NULL,
	"category" text NOT NULL,
	"subcategory" text,
	"description" text NOT NULL,
	"vendor_id" text,
	"vendor_name" text,
	"amount" real NOT NULL,
	"payment_mode" text NOT NULL,
	"transaction_ref" text,
	"invoice_no" text,
	"invoice_date" text,
	"account_id" text,
	"account_name" text,
	"status" text DEFAULT 'Pending' NOT NULL,
	"approved_by" text,
	"paid_by" text,
	"notes" text,
	"attachments" jsonb,
	"created_at" text NOT NULL,
	CONSTRAINT "expenses_expense_id_unique" UNIQUE("expense_id")
);
--> statement-breakpoint
CREATE TABLE "fee_structures" (
	"id" serial PRIMARY KEY NOT NULL,
	"structure_id" text NOT NULL,
	"name" text NOT NULL,
	"academic_session" text NOT NULL,
	"class" text NOT NULL,
	"description" text,
	"fee_heads" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"total_amount" real NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" text NOT NULL,
	CONSTRAINT "fee_structures_structure_id_unique" UNIQUE("structure_id")
);
--> statement-breakpoint
CREATE TABLE "fee_vouchers" (
	"id" serial PRIMARY KEY NOT NULL,
	"voucher_id" text NOT NULL,
	"student_id" text NOT NULL,
	"student_name" text NOT NULL,
	"class" text NOT NULL,
	"section" text NOT NULL,
	"month" text NOT NULL,
	"fee_heads" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"total_amount" real NOT NULL,
	"discount" real DEFAULT 0 NOT NULL,
	"fine" real DEFAULT 0 NOT NULL,
	"net_amount" real NOT NULL,
	"paid_amount" real DEFAULT 0 NOT NULL,
	"due_date" text NOT NULL,
	"status" text DEFAULT 'Unpaid' NOT NULL,
	"payment_history" jsonb DEFAULT '[]'::jsonb NOT NULL,
	CONSTRAINT "fee_vouchers_voucher_id_unique" UNIQUE("voucher_id")
);
--> statement-breakpoint
CREATE TABLE "finance_vouchers" (
	"id" serial PRIMARY KEY NOT NULL,
	"voucher_id" text NOT NULL,
	"voucher_number" text NOT NULL,
	"type" text NOT NULL,
	"date" text NOT NULL,
	"entries" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"total_debit" real NOT NULL,
	"total_credit" real NOT NULL,
	"narration" text NOT NULL,
	"reference" text,
	"status" text DEFAULT 'Draft' NOT NULL,
	"created_by" text NOT NULL,
	"posted_by" text,
	"posted_at" text,
	"cancelled_by" text,
	"cancelled_at" text,
	"created_at" text NOT NULL,
	CONSTRAINT "finance_vouchers_voucher_id_unique" UNIQUE("voucher_id")
);
--> statement-breakpoint
CREATE TABLE "hostel_fees" (
	"id" serial PRIMARY KEY NOT NULL,
	"resident_id" text NOT NULL,
	"student_name" text NOT NULL,
	"month" text NOT NULL,
	"amount" real NOT NULL,
	"status" text DEFAULT 'Unpaid' NOT NULL,
	"paid_date" text
);
--> statement-breakpoint
CREATE TABLE "hostel_residents" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" text NOT NULL,
	"student_name" text NOT NULL,
	"class" text NOT NULL,
	"room_id" text NOT NULL,
	"room_number" text NOT NULL,
	"bed_number" integer NOT NULL,
	"join_date" text NOT NULL,
	"status" text DEFAULT 'Active' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hostel_rooms" (
	"id" serial PRIMARY KEY NOT NULL,
	"hostel_name" text NOT NULL,
	"room_number" text NOT NULL,
	"bed_count" integer NOT NULL,
	"occupied_beds" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'Available' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "installment_plans" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"number_of_installments" integer NOT NULL,
	"installments" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"applicable_classes" jsonb,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "journal_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"journal_no" text NOT NULL,
	"date" text NOT NULL,
	"description" text NOT NULL,
	"entries" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"total_debit" real NOT NULL,
	"total_credit" real NOT NULL,
	"status" text DEFAULT 'Draft' NOT NULL,
	"created_by" text,
	"approved_by" text,
	"created_at" text NOT NULL,
	CONSTRAINT "journal_entries_journal_no_unique" UNIQUE("journal_no")
);
--> statement-breakpoint
CREATE TABLE "late_fee_rules" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"value" real NOT NULL,
	"grace_period_days" integer NOT NULL,
	"max_late_fee" real,
	"applicable_classes" jsonb,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ledger_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"entry_no" text NOT NULL,
	"date" text NOT NULL,
	"account_id" text NOT NULL,
	"account_code" text NOT NULL,
	"account_name" text NOT NULL,
	"description" text NOT NULL,
	"reference_type" text NOT NULL,
	"reference_id" text,
	"reference_no" text,
	"debit" real DEFAULT 0 NOT NULL,
	"credit" real DEFAULT 0 NOT NULL,
	"balance" real DEFAULT 0 NOT NULL,
	"created_by" text,
	"created_at" text NOT NULL,
	CONSTRAINT "ledger_entries_entry_no_unique" UNIQUE("entry_no")
);
--> statement-breakpoint
CREATE TABLE "library_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"member_id" text NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"contact" text NOT NULL,
	"reference_id" text NOT NULL,
	CONSTRAINT "library_members_member_id_unique" UNIQUE("member_id")
);
--> statement-breakpoint
CREATE TABLE "module_users" (
	"id" serial PRIMARY KEY NOT NULL,
	"module" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"name" text DEFAULT 'Admin' NOT NULL,
	"role" text DEFAULT 'admin' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"module" text NOT NULL,
	"priority" text DEFAULT 'medium' NOT NULL,
	"read" boolean DEFAULT false NOT NULL,
	"link" text,
	"created_at" text NOT NULL,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"receipt_no" text NOT NULL,
	"challan_id" text NOT NULL,
	"challan_no" text NOT NULL,
	"student_id" text NOT NULL,
	"student_name" text NOT NULL,
	"amount" real NOT NULL,
	"payment_mode" text NOT NULL,
	"transaction_ref" text,
	"bank_name" text,
	"cheque_no" text,
	"cheque_date" text,
	"payment_date" text NOT NULL,
	"received_by" text NOT NULL,
	"notes" text,
	"type" text DEFAULT 'Payment' NOT NULL,
	"status" text DEFAULT 'Completed' NOT NULL,
	"created_at" text NOT NULL,
	CONSTRAINT "payments_receipt_no_unique" UNIQUE("receipt_no")
);
--> statement-breakpoint
CREATE TABLE "payrolls" (
	"id" serial PRIMARY KEY NOT NULL,
	"staff_id" text NOT NULL,
	"staff_name" text NOT NULL,
	"designation" text NOT NULL,
	"department" text NOT NULL,
	"month" text NOT NULL,
	"basic_salary" real NOT NULL,
	"allowances" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"deductions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"gross_salary" real NOT NULL,
	"net_salary" real NOT NULL,
	"status" text DEFAULT 'Unpaid' NOT NULL,
	"paid_date" text
);
--> statement-breakpoint
CREATE TABLE "pos_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"item_code" text NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"price" real NOT NULL,
	"stock" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "pos_items_item_code_unique" UNIQUE("item_code")
);
--> statement-breakpoint
CREATE TABLE "questions" (
	"id" serial PRIMARY KEY NOT NULL,
	"subject" text NOT NULL,
	"class" text NOT NULL,
	"type" text NOT NULL,
	"prompt" text NOT NULL,
	"options" jsonb,
	"correct_answer" text NOT NULL,
	"marks" integer DEFAULT 1 NOT NULL,
	"difficulty" text
);
--> statement-breakpoint
CREATE TABLE "quiz_attempts" (
	"id" serial PRIMARY KEY NOT NULL,
	"quiz_id" text NOT NULL,
	"quiz_title" text NOT NULL,
	"student_id" text NOT NULL,
	"student_name" text NOT NULL,
	"class" text NOT NULL,
	"section" text,
	"answers" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"score" real NOT NULL,
	"max_score" real NOT NULL,
	"auto_graded" boolean DEFAULT true NOT NULL,
	"status" text DEFAULT 'Submitted' NOT NULL,
	"submitted_at" text
);
--> statement-breakpoint
CREATE TABLE "quizzes" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"class" text NOT NULL,
	"section" text,
	"subject" text NOT NULL,
	"term" text,
	"total_marks" real NOT NULL,
	"time_limit" integer,
	"questions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"assigned_by" text,
	"status" text DEFAULT 'Draft' NOT NULL,
	"created_at" text
);
--> statement-breakpoint
CREATE TABLE "routes" (
	"id" serial PRIMARY KEY NOT NULL,
	"route_id" text,
	"route_code" text NOT NULL,
	"route_name" text NOT NULL,
	"stops" jsonb DEFAULT '[]'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sales" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_no" text NOT NULL,
	"date" text NOT NULL,
	"customer" text NOT NULL,
	"items" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"grand_total" real NOT NULL,
	CONSTRAINT "sales_invoice_no_unique" UNIQUE("invoice_no")
);
--> statement-breakpoint
CREATE TABLE "staff" (
	"id" serial PRIMARY KEY NOT NULL,
	"staff_id" text NOT NULL,
	"name" text NOT NULL,
	"gender" text NOT NULL,
	"dob" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"address" text NOT NULL,
	"designation" text NOT NULL,
	"department" text NOT NULL,
	"campus" text NOT NULL,
	"employment_type" text NOT NULL,
	"status" text DEFAULT 'Active' NOT NULL,
	"joining_date" text NOT NULL,
	"basic_salary" real NOT NULL,
	"payment_mode" text NOT NULL,
	"photo" text,
	CONSTRAINT "staff_staff_id_unique" UNIQUE("staff_id")
);
--> statement-breakpoint
CREATE TABLE "student_portal_accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" text NOT NULL,
	"student_name" text NOT NULL,
	"class_name" text NOT NULL,
	"section" text NOT NULL,
	"password_hash" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_first_login" boolean DEFAULT true NOT NULL,
	"last_login" text,
	"created_at" text,
	CONSTRAINT "student_portal_accounts_student_id_unique" UNIQUE("student_id")
);
--> statement-breakpoint
CREATE TABLE "student_quiz_attempts" (
	"id" serial PRIMARY KEY NOT NULL,
	"quiz_id" text NOT NULL,
	"student_id" text NOT NULL,
	"student_name" text NOT NULL,
	"class_name" text NOT NULL,
	"section" text NOT NULL,
	"answers" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"total_marks_obtained" real DEFAULT 0 NOT NULL,
	"total_marks" real NOT NULL,
	"percentage" real DEFAULT 0 NOT NULL,
	"grade" text DEFAULT 'F' NOT NULL,
	"is_passed" boolean DEFAULT false NOT NULL,
	"time_taken_minutes" real DEFAULT 0 NOT NULL,
	"submitted_at" text
);
--> statement-breakpoint
CREATE TABLE "student_transports" (
	"id" serial PRIMARY KEY NOT NULL,
	"allocation_id" text,
	"student_id" text NOT NULL,
	"student_name" text NOT NULL,
	"class" text NOT NULL,
	"section" text NOT NULL,
	"route_id" text NOT NULL,
	"route_name" text NOT NULL,
	"stop_name" text NOT NULL,
	"pickup_time" text NOT NULL,
	"drop_time" text NOT NULL,
	"monthly_fee" real NOT NULL,
	"start_date" text NOT NULL,
	"end_date" text,
	"vehicle_id" text,
	"status" text DEFAULT 'Active' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "students" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" text NOT NULL,
	"name" text NOT NULL,
	"gender" text NOT NULL,
	"dob" text NOT NULL,
	"parent_name" text NOT NULL,
	"parent_contact" text NOT NULL,
	"parent_email" text,
	"father_cnic" text,
	"mother_cnic" text,
	"address" text NOT NULL,
	"class" text NOT NULL,
	"section" text NOT NULL,
	"previous_school" text,
	"previous_class" text,
	"admission_date" text NOT NULL,
	"status" text DEFAULT 'Active' NOT NULL,
	"photo" text,
	"notes" text,
	"bform" text NOT NULL,
	CONSTRAINT "students_student_id_unique" UNIQUE("student_id")
);
--> statement-breakpoint
CREATE TABLE "teacher_assignments" (
	"id" serial PRIMARY KEY NOT NULL,
	"staff_id" text NOT NULL,
	"staff_name" text NOT NULL,
	"staff_email" text NOT NULL,
	"class_name" text NOT NULL,
	"section" text NOT NULL,
	"subject" text NOT NULL,
	"assigned_by" text NOT NULL,
	"date_assigned" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" text
);
--> statement-breakpoint
CREATE TABLE "teacher_auth_passwords" (
	"id" serial PRIMARY KEY NOT NULL,
	"staff_id" text NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" text,
	CONSTRAINT "teacher_auth_passwords_staff_id_unique" UNIQUE("staff_id")
);
--> statement-breakpoint
CREATE TABLE "teacher_contents" (
	"id" serial PRIMARY KEY NOT NULL,
	"staff_id" text NOT NULL,
	"teacher_name" text NOT NULL,
	"class_name" text NOT NULL,
	"section" text NOT NULL,
	"subject" text NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"content_type" text NOT NULL,
	"file_data" text DEFAULT '' NOT NULL,
	"file_name" text DEFAULT '' NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"created_at" text
);
--> statement-breakpoint
CREATE TABLE "teacher_quizzes" (
	"id" serial PRIMARY KEY NOT NULL,
	"staff_id" text NOT NULL,
	"teacher_name" text NOT NULL,
	"class_name" text NOT NULL,
	"section" text NOT NULL,
	"subject" text NOT NULL,
	"title" text NOT NULL,
	"instructions" text DEFAULT '' NOT NULL,
	"time_limit_minutes" integer DEFAULT 30 NOT NULL,
	"start_date_time" text NOT NULL,
	"end_date_time" text NOT NULL,
	"passing_marks" real NOT NULL,
	"total_marks" real NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"questions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" text
);
--> statement-breakpoint
CREATE TABLE "timetables" (
	"id" serial PRIMARY KEY NOT NULL,
	"class" text NOT NULL,
	"section" text NOT NULL,
	"slots" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vacancies" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"department" text NOT NULL,
	"designation" text NOT NULL,
	"positions" integer NOT NULL,
	"employment_type" text NOT NULL,
	"salary_range" text,
	"qualifications" text NOT NULL,
	"experience" text NOT NULL,
	"description" text NOT NULL,
	"last_date" text NOT NULL,
	"status" text DEFAULT 'Open' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vehicles" (
	"id" serial PRIMARY KEY NOT NULL,
	"vehicle_id" text,
	"registration_number" text NOT NULL,
	"type" text NOT NULL,
	"capacity" integer NOT NULL,
	"model" text NOT NULL,
	"make" text NOT NULL,
	"year" integer NOT NULL,
	"driver_id" text,
	"driver_name" text,
	"route_id" text,
	"route_name" text,
	"status" text DEFAULT 'Active' NOT NULL,
	"insurance_expiry" text NOT NULL,
	"fitness_expiry" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vendors" (
	"id" serial PRIMARY KEY NOT NULL,
	"vendor_id" text NOT NULL,
	"name" text NOT NULL,
	"contact_person" text,
	"phone" text NOT NULL,
	"email" text,
	"address" text NOT NULL,
	"category" text NOT NULL,
	"bank_name" text,
	"account_no" text,
	"tax_id" text,
	"status" text DEFAULT 'Active' NOT NULL,
	"created_at" text NOT NULL,
	CONSTRAINT "vendors_vendor_id_unique" UNIQUE("vendor_id")
);
