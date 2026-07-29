-- Thêm policy DELETE cho friend_requests - sender có thể thu hồi lời mời
CREATE POLICY friend_requests_delete_sender ON public.friend_requests
  FOR DELETE USING (sender_id = auth.uid());