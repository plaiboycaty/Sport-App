-- ==============================================================================
-- SCRIPT SỬA TRIỆT ĐỂ LỖI ĐỆ QUY VÔ HẠN (INFINITE RECURSION - MÃ LỖI 42P17)
-- BẢNG: public.groups & public.group_members
-- ==============================================================================
-- HÃY COPY TOÀN BỘ SCRIPT NÀY VÀ CHẠY TRONG SUPABASE SQL EDITOR -> BẤM RUN
-- ==============================================================================

-- BƯỚC 1: XÓA TOÀN BỘ CÁC POLICY HIỆN CÓ TRÊN 2 BẢNG (TỰ ĐỘNG QUÉT VÀ DROP HẾT)
DO $$
DECLARE
    pol RECORD;
BEGIN
    -- Xóa tất cả policies trên group_members
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'group_members'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.group_members', pol.policyname);
    END LOOP;

    -- Xóa tất cả policies trên groups
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'groups'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.groups', pol.policyname);
    END LOOP;
END $$;

-- BƯỚC 2: TẠO HÀM KIỂM TRA CHỦ NHÓM (SECURITY DEFINER - KHÔNG KÍCH HOẠT RLS ĐỆ QUY)
CREATE OR REPLACE FUNCTION public.is_group_creator(p_group_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.groups
    WHERE id = p_group_id AND created_by = p_user_id
  );
$$;

-- BƯỚC 3: THIẾT LẬP RLS CHO BẢNG public.groups
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

-- 3.1. Cho phép xem danh sách nhóm (USING true hoàn toàn không gây đệ quy)
CREATE POLICY "groups_select_all" ON public.groups
  FOR SELECT
  USING (true);

-- 3.2. Cho phép người dùng đăng nhập tạo nhóm mới (phải là chính mình)
CREATE POLICY "groups_insert_self" ON public.groups
  FOR INSERT
  WITH CHECK (created_by = auth.uid());

-- 3.3. Chỉ chủ nhóm được chỉnh sửa nhóm
CREATE POLICY "groups_update_owner" ON public.groups
  FOR UPDATE
  USING (created_by = auth.uid());

-- 3.4. Chỉ chủ nhóm được xóa nhóm
CREATE POLICY "groups_delete_owner" ON public.groups
  FOR DELETE
  USING (created_by = auth.uid());


-- BƯỚC 4: THIẾT LẬP RLS CHO BẢNG public.group_members
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

-- 4.1. Cho phép xem danh sách thành viên nhóm (USING true hoàn toàn triệt tiêu đệ quy)
CREATE POLICY "group_members_select_all" ON public.group_members
  FOR SELECT
  USING (true);

-- 4.2. Cho phép tự tham gia nhóm HOẶC chủ nhóm thêm bạn bè
CREATE POLICY "group_members_insert_policy" ON public.group_members
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid() 
    OR public.is_group_creator(group_id, auth.uid())
  );

-- 4.3. Cho phép tự rời nhóm HOẶC chủ nhóm gỡ thành viên
CREATE POLICY "group_members_delete_policy" ON public.group_members
  FOR DELETE
  USING (
    user_id = auth.uid() 
    OR public.is_group_creator(group_id, auth.uid())
  );

-- 4.4. Cập nhật role trong nhóm
CREATE POLICY "group_members_update_policy" ON public.group_members
  FOR UPDATE
  USING (
    user_id = auth.uid() 
    OR public.is_group_creator(group_id, auth.uid())
  );


-- BƯỚC 5: TẠO HÀM RPC TẠO NHÓM ĐỒNG BỘ ATOMIC (TRÁNH LỖI PHÂN QUYỀN VÀ MẠNG)
CREATE OR REPLACE FUNCTION public.create_sport_group(
  p_name text,
  p_sport_id uuid DEFAULT NULL,
  p_avatar_url text DEFAULT NULL,
  p_member_ids uuid[] DEFAULT ARRAY[]::uuid[]
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_group_id uuid;
  v_uid uuid;
  v_member_id uuid;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Bạn chưa đăng nhập!';
  END IF;

  -- 1. Chèn nhóm mới
  INSERT INTO public.groups (name, sport_id, avatar_url, created_by)
  VALUES (p_name, p_sport_id, p_avatar_url, v_uid)
  RETURNING id INTO v_group_id;

  -- 2. Chèn chủ nhóm vào group_members
  INSERT INTO public.group_members (group_id, user_id, role)
  VALUES (v_group_id, v_uid, 'owner')
  ON CONFLICT (group_id, user_id) DO NOTHING;

  -- 3. Chèn các thành viên bạn bè nếu có
  IF p_member_ids IS NOT NULL AND array_length(p_member_ids, 1) > 0 THEN
    FOREACH v_member_id IN ARRAY p_member_ids
    LOOP
      IF v_member_id IS NOT NULL AND v_member_id <> v_uid THEN
        INSERT INTO public.group_members (group_id, user_id, role)
        VALUES (v_group_id, v_member_id, 'member')
        ON CONFLICT (group_id, user_id) DO NOTHING;
      END IF;
    END LOOP;
  END IF;

  RETURN v_group_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_sport_group(text, uuid, text, uuid[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_sport_group(text, uuid, text, uuid[]) TO anon;
GRANT EXECUTE ON FUNCTION public.create_sport_group(text, uuid, text, uuid[]) TO service_role;


-- BƯỚC 6: CẤP QUYỀN BẢNG VÀ INSERT MÔN THỂ THAO MẪU
GRANT ALL ON public.groups TO authenticated;
GRANT ALL ON public.groups TO anon;
GRANT ALL ON public.groups TO service_role;

GRANT ALL ON public.group_members TO authenticated;
GRANT ALL ON public.group_members TO anon;
GRANT ALL ON public.group_members TO service_role;

INSERT INTO public.sports (id, name, name_en, icon, is_active)
VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Cầu lông', 'Badminton', 'tennisball-outline', true),
  ('a0000000-0000-0000-0000-000000000002', 'Bóng đá', 'Football', 'football-outline', true),
  ('a0000000-0000-0000-0000-000000000003', 'Pickleball', 'Pickleball', 'tennisball-outline', true),
  ('a0000000-0000-0000-0000-000000000004', 'Tennis', 'Tennis', 'tennisball-outline', true),
  ('a0000000-0000-0000-0000-000000000005', 'Chạy bộ', 'Running', 'walk-outline', true),
  ('a0000000-0000-0000-0000-000000000006', 'Bóng rổ', 'Basketball', 'basketball-outline', true),
  ('a0000000-0000-0000-0000-000000000007', 'Gym & Fitness', 'Gym & Fitness', 'fitness-outline', true),
  ('a0000000-0000-0000-0000-000000000008', 'Bơi lội', 'Swimming', 'water-outline', true)
ON CONFLICT DO NOTHING;
