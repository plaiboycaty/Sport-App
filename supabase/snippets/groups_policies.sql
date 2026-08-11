-- ==========================================================
-- SportSync - Additional RLS Policies & Indices for Groups
-- ==========================================================

-- 1. Bổ sung policy DELETE cho bảng groups (chủ nhóm có quyền xóa nhóm)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'groups' AND policyname = 'groups_delete_owner'
  ) THEN
    CREATE POLICY groups_delete_owner ON public.groups
      FOR DELETE USING (created_by = auth.uid());
  END IF;
END $$;

-- 2. Bổ sung policy SELECT cho phép khám phá / gợi ý nhóm công khai (tương tự tournaments)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'groups' AND policyname = 'groups_select_all'
  ) THEN
    CREATE POLICY groups_select_all ON public.groups
      FOR SELECT USING (true);
  END IF;
END $$;

-- 3. Bổ sung policy DELETE cho group_members (tự rời nhóm hoặc chủ nhóm xóa thành viên)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'group_members' AND policyname = 'group_members_delete'
  ) THEN
    CREATE POLICY group_members_delete ON public.group_members
      FOR DELETE USING (
        user_id = auth.uid() 
        OR EXISTS (
          SELECT 1 FROM public.groups 
          WHERE groups.id = group_members.group_id 
            AND groups.created_by = auth.uid()
        )
      );
  END IF;
END $$;

-- 4. Bổ sung policy INSERT cho group_members khi người dùng tự tham gia nhóm (Join group)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'group_members' AND policyname = 'group_members_insert_self'
  ) THEN
    CREATE POLICY group_members_insert_self ON public.group_members
      FOR INSERT WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- 5. Đảm bảo bảng sports có dữ liệu mẫu nếu chưa có
INSERT INTO public.sports (name, name_en, icon, description, is_active)
VALUES
  ('Bóng đá', 'Football', 'football-outline', 'Môn thể thao vua sân cỏ', true),
  ('Cầu lông', 'Badminton', 'tennisball-outline', 'Đánh cầu đơn và đôi', true),
  ('Pickleball', 'Pickleball', 'tennisball-outline', 'Môn thể thao phối hợp năng động', true),
  ('Tennis', 'Tennis', 'tennisball-outline', 'Quần vợt sân cứng, sân cỏ', true),
  ('Bóng rổ', 'Basketball', 'basketball-outline', 'Bóng rổ 3x3 và 5x5', true),
  ('Chạy bộ', 'Running', 'walk-outline', 'Chạy bộ phong trào và marathon', true),
  ('Gym & Fitness', 'Gym', 'fitness-outline', 'Thể hình và rèn luyện thể lực', true),
  ('Bơi lội', 'Swimming', 'water-outline', 'Bơi cự ly và rèn luyện sức khỏe', true)
ON CONFLICT (name) DO NOTHING;
