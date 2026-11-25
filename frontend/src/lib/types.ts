export interface User {
  id: number;
  username: string;
  role: "admin" | "librarian";
  created_at: string;
}

export interface Category {
  id: number;
  name: string;
}

export interface Book {
  id: number;
  category_id: number;
  category_name?: string;
  title: string;
  total_qty: number;
  available_qty: number;
}

export interface BookUpdate {
  title?: string;
  category_id?: number;
  total_qty?: number;
}

export interface BookDropdownItem {
  id: number;
  title: string;
  category_id: number;
  category_name?: string | null;
  available_qty: number;
  is_available: boolean;
}

export interface LookupItem {
  id: number;
  name: string;
}

export interface LookupsResponse {
  education_types: LookupItem[];
  education_forms: LookupItem[];
  specialties: LookupItem[];
  courses: LookupItem[];
  groups: LookupItem[];
}

export interface Student {
  id: number;
  full_name: string;
  birth_date?: string | null;
  phone?: string | null;
  education_type_id?: number | null;
  education_type_name?: string | null;
  education_form_id?: number | null;
  education_form_name?: string | null;
  specialty_id?: number | null;
  specialty_name?: string | null;
  course_id?: number | null;
  course_name?: string | null;
  group_id?: number | null;
  group_name?: string | null;
  major?: string;
  group?: string;
  borrow_count: number;
  has_overdue: boolean;
  active_borrows_count: number;
  created_at: string;
}

export interface StudentUpdate {
  full_name?: string;
  birth_date?: string | null;
  phone?: string | null;
  education_type_id?: number | null;
  education_type_name?: string | null;
  education_form_id?: number | null;
  education_form_name?: string | null;
  specialty_id?: number | null;
  specialty_name?: string | null;
  course_id?: number | null;
  course_name?: string | null;
  group_id?: number | null;
  group_name?: string | null;
}

export interface StudentImportError {
  row_number: number;
  reason: string;
}

export interface StudentImportSummary {
  processed: number;
  added: number;
  updated: number;
  failed: number;
  errors: StudentImportError[];
}

export interface StaffMember {
  id: number;
  full_name: string;
  department: string;
  phone: string;
  borrow_count: number;
  has_overdue: boolean;
  active_borrows_count: number;
  created_at: string;
}

export interface BorrowerOption {
  id: number;
  borrower_type: "student" | "staff";
  full_name: string;
  identifier: string;
  phone?: string | null;
  has_overdue?: boolean;
}

export interface Borrowing {
  id: number;
  book_id: number;
  book_title: string;
  category_name?: string;
  borrower_type: "student" | "staff";
  borrower_id: number;
  borrower_name: string;
  borrower_phone?: string;
  issue_date: string;
  due_date: string;
  return_date?: string | null;
  returned_at?: string | null;
  status: "active" | "overdue" | "returned";
}

export interface BorrowingBatchCreate {
  student_id: number;
  phone?: string | null;
  book_ids: number[];
}

export interface BorrowingCountsSummary {
  all: number;
  active: number;
  overdue: number;
  returned_7d: number;
  full_history: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface CategoryStats {
  category_id: number;
  category_name: string;
  total_qty: number;
  available_qty: number;
  borrowed_qty: number;
}

export interface DashboardSummary {
  total_books: number;
  total_available: number;
  total_borrowed: number;
  total_overdue: number;
  total_students: number;
  total_staff: number;
  categories: CategoryStats[];
}
