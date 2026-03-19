-- Cấu trúc DB cho dự án Đánh giá Nhân viên (PostgreSQL)

-- 1. Bảng Chi Nhánh
CREATE TABLE IF NOT EXISTS public.branches (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Bảng Phòng Ban (Có ràng buộc khóa ngoại tới Chi nhánh)
CREATE TABLE IF NOT EXISTS public.departments (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  branch_id INTEGER REFERENCES public.branches(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Bảng Người dùng hệ thống (Admin/Phân quyền)
CREATE TABLE IF NOT EXISTS public.users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'USER',
  department_id INTEGER REFERENCES public.departments(id) ON DELETE SET NULL,
  branch_id INTEGER REFERENCES public.branches(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_active_at TIMESTAMP WITH TIME ZONE,
  session_id VARCHAR(255)
);

-- 4. Bảng Nhân Viên (Để được đánh giá)
CREATE TABLE IF NOT EXISTS public.employees (
  id SERIAL PRIMARY KEY,
  employee_code VARCHAR(50) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  cccd VARCHAR(20),
  department_id INTEGER REFERENCES public.departments(id) ON DELETE SET NULL,
  branch_id INTEGER REFERENCES public.branches(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT TRUE,
  is_resigned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
  updated_by INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMP WITH TIME ZONE
);

-- 5. Bảng Lý do đánh giá (Lý do mất hoặc được nhận sao)
CREATE TABLE IF NOT EXISTS public.reasons (
  id SERIAL PRIMARY KEY,
  stars INTEGER NOT NULL,
  reason_text TEXT NOT NULL,
  department_id INTEGER REFERENCES public.departments(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Bảng Đánh giá Daily
CREATE TABLE IF NOT EXISTS public.evaluations (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER REFERENCES public.employees(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  stars INTEGER NOT NULL,
  reason_ids INTEGER[], -- Lưu dạng Array các ID của Reasons
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(employee_id, date) -- Mỗi nhân viên chỉ có 1 record đánh giá mỗi ngày (Upsert)
);

-- DỮ LIỆU MẪU BAN ĐẦU (SEED DATA)
-- Tất cả mật khẩu mặc định: Admin@123

-- 3 tài khoản mẫu cho 3 vai trò
INSERT INTO public.users (username, password, full_name, role) VALUES
  ('admin',   '$2b$10$qwMrm1FlLQ9aLlb2GVF/buykJXz9vyAboGJ8jQJaiuq1dlGZlffzW', 'Super Admin',   'SUPER_ADMIN'),
  ('manager', '$2b$10$qwMrm1FlLQ9aLlb2GVF/buykJXz9vyAboGJ8jQJaiuq1dlGZlffzW', 'Quản lý mẫu',  'ADMIN'),
  ('staff',   '$2b$10$qwMrm1FlLQ9aLlb2GVF/buykJXz9vyAboGJ8jQJaiuq1dlGZlffzW', 'Nhân viên mẫu', 'USER')
ON CONFLICT (username) DO NOTHING;

-- 7. Phân quyền (Roles & Permissions)
CREATE TABLE IF NOT EXISTS public.roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT
);

CREATE TABLE IF NOT EXISTS public.permissions (
  id SERIAL PRIMARY KEY,
  module VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL,
  name VARCHAR(100) NOT NULL,
  UNIQUE(module, action)
);

CREATE TABLE IF NOT EXISTS public.role_permissions (
  role_id INTEGER REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_id INTEGER REFERENCES public.permissions(id) ON DELETE CASCADE,
  PRIMARY KEY(role_id, permission_id)
);

-- Seed Roles
INSERT INTO public.roles (name, description) VALUES
('SUPER_ADMIN', 'Quản trị viên cấp cao nhất'),
('ADMIN', 'Quản trị viên chi nhánh'),
('USER', 'Nhân viên thông thường')
ON CONFLICT (name) DO NOTHING;

-- Seed Permissions for 'employees', 'branches', 'departments', 'reasons', 'users', 'evaluations', 'reports'
DO $$
DECLARE
   mod TEXT;
   act TEXT;
   perm_name TEXT;
BEGIN
   FOR mod IN SELECT * FROM unnest(ARRAY['employees', 'branches', 'departments', 'reasons', 'users', 'evaluations', 'reports']) LOOP
      FOR act IN SELECT * FROM unnest(ARRAY['view', 'create', 'edit', 'delete']) LOOP
          -- mapping action to name manually roughly
          perm_name := CASE act 
             WHEN 'view' THEN 'Xem danh sách ' || mod
             WHEN 'create' THEN 'Thêm ' || mod
             WHEN 'edit' THEN 'Sửa ' || mod
             WHEN 'delete' THEN 'Xoá ' || mod
          END;
          INSERT INTO permissions (module, action, name) VALUES (mod, act, perm_name) ON CONFLICT DO NOTHING;
      END LOOP;
   END LOOP;
END
$$;


