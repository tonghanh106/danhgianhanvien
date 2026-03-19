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
  department_id INTEGER REFERENCES public.departments(id) ON DELETE SET NULL,
  branch_id INTEGER REFERENCES public.branches(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
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
INSERT INTO public.branches (id, name) VALUES (1, 'Trụ sở chính (Hà Nội)') ON CONFLICT DO NOTHING;

INSERT INTO public.departments (id, name, branch_id) VALUES 
  (1, 'Phòng IT', 1),
  (2, 'Phòng Kế Toán', 1) 
ON CONFLICT DO NOTHING;

-- Mật khẩu mặc định là: Admin@123 (bcrypt hash)
INSERT INTO public.users (username, password, full_name, role, branch_id, department_id) 
VALUES ('admin', '$2b$10$qwMrm1FlLQ9aLlb2GVF/buykJXz9vyAboGJ8jQJaiuq1dlGZlffzW', 'Super Admin', 'SUPER_ADMIN', 1, 1) 
ON CONFLICT (username) DO NOTHING;
