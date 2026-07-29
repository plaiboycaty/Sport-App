SET check_function_bodies = false;
DROP EXTENSION pg_net;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT DELETE, INSERT, SELECT, UPDATE ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT, USAGE ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON ROUTINES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT DELETE, INSERT, SELECT, UPDATE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT, USAGE ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON ROUTINES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT DELETE, INSERT, SELECT, UPDATE ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT, USAGE ON SEQUENCES TO service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON ROUTINES TO service_role;
CREATE TYPE public.friend_request_status AS ENUM ('pending', 'accepted', 'rejected');
CREATE TYPE public.group_role AS ENUM ('owner', 'member');
CREATE TYPE public.match_status AS ENUM ('scheduled', 'live', 'completed', 'cancelled', 'walkover', 'postponed');
CREATE TYPE public.match_type AS ENUM ('room', 'tournament');
CREATE TYPE public.notification_type AS ENUM ('friend', 'match', 'tournament', 'group', 'session');
CREATE TYPE public.pairing_mode AS ENUM ('auto', 'manual');
CREATE TYPE public.tournament_format AS ENUM ('round_robin', 'knockout', 'group_knockout');
CREATE TYPE public.tournament_status AS ENUM ('draft', 'registration', 'in_progress', 'completed', 'cancelled');
CREATE TYPE public.tournament_visibility AS ENUM ('public', 'invite_only');
CREATE FUNCTION public.accept_friend_request(request_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
declare
    req record;
begin
    -- Lấy thông tin request
    select * into req from friend_requests where id = request_id and status = 'pending'
    for update;

    if not found then
        raise exception 'Friend request not found or already processed';
    end if;

    -- Chỉ receiver mới được accept
    if req.receiver_id <> auth.uid() then
        raise exception 'Only the receiver can accept this request';
    end if;

    -- Tạo friendships 2 chiều
    insert into friendships (user_id, friend_id) values
        (req.sender_id, req.receiver_id),
        (req.receiver_id, req.sender_id);

    -- Cập nhật trạng thái request
    update friend_requests set status = 'accepted', updated_at = now()
    where id = request_id;

    -- Thông báo cho sender
    insert into notifications (user_id, type, title, body, data)
    values (
        req.sender_id,
        'friend',
        'Kết bạn thành công',
        (select full_name from profiles where id = req.receiver_id) || ' đã chấp nhận lời mời kết bạn của bạn',
        jsonb_build_object('friend_id', req.receiver_id)
    );
end;
$function$;
GRANT ALL ON FUNCTION public.accept_friend_request(uuid) TO anon;
GRANT ALL ON FUNCTION public.accept_friend_request(uuid) TO authenticated;
GRANT ALL ON FUNCTION public.accept_friend_request(uuid) TO service_role;
CREATE FUNCTION public.finish_match(match_id_param uuid, home_score integer, away_score integer, winner text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
declare
    match_rec record;
    tourn_rec record;
    next_round_rec record;
    winner_player_id uuid;
    winner_side text;
    next_match_id uuid;
begin
    select * into match_rec from matches where id = match_id_param for update;

    if not found then
        raise exception 'Match not found';
    end if;

    -- Kiểm tra trạng thái trận: chỉ cho phép kết thúc trận đang scheduled hoặc live
    if match_rec.status not in ('scheduled', 'live') then
        raise exception 'Cannot finish match with status: %', match_rec.status;
    end if;

    -- Kiểm tra quyền dựa trên loại trận
    if match_rec.match_type = 'tournament' then
        -- Tournament: chỉ BTC
        if not exists (
            select 1 from tournament_organizers
            where tournament_id = match_rec.tournament_id and user_id = auth.uid()
        ) then
            raise exception 'Only tournament organizers can finish a match';
        end if;
    elsif match_rec.match_type = 'room' then
        -- Room: chỉ chủ phòng
        if not exists (
            select 1 from rooms where id = match_rec.room_id and created_by = auth.uid()
        ) then
            raise exception 'Only room host can finish a match';
        end if;
    end if;

    -- Xác định winner nếu chưa được chỉ định
    if winner is null then
        if home_score > away_score then
            winner := 'home';
        elsif away_score > home_score then
            winner := 'away';
        else
            winner := 'draw';
        end if;
    end if;

    -- Cập nhật match status
    update matches set
        status = 'completed',
        started_at = coalesce(started_at, now()),
        ended_at = now()
    where id = match_id_param;

    -- Cập nhật is_winner cho match_players
    update match_players set
        is_winner = (team_side = winner),
        score = case when team_side = 'home' then home_score else away_score end
    where match_id = match_id_param;

    -- Ghi hoặc cập nhật kết quả
    insert into match_results (match_id, winner_team, home_total_score, away_total_score)
    values (match_id_param, winner, home_score, away_score)
    on conflict (match_id)
    do update set
        winner_team = excluded.winner_team,
        home_total_score = excluded.home_total_score,
        away_total_score = excluded.away_total_score,
        updated_at = now();

    -- === KNOCKOUT BRACKET: tự động tạo match vòng sau ===
    if match_rec.match_type = 'tournament' and match_rec.tournament_id is not null then
        select * into tourn_rec from tournaments where id = match_rec.tournament_id;

        if tourn_rec.format = 'knockout' and match_rec.tournament_round_id is not null then
            select tr2.id, tr2.round_number into next_round_rec
            from tournament_rounds tr2
            where tr2.tournament_id = match_rec.tournament_id
              and tr2.round_number = (
                  select round_number + 1
                  from tournament_rounds
                  where id = match_rec.tournament_round_id
              );

            if found and winner != 'draw' then
                -- Tính round_position cho vòng sau
                select id into next_match_id
                from matches
                where tournament_id = match_rec.tournament_id
                  and tournament_round_id = next_round_rec.id
                  and round_position = floor(match_rec.round_position / 2);

                if not found then
                    insert into matches (
                        match_type, status, sport_id,
                        tournament_id, tournament_round_id,
                        round_position, match_order, created_by
                    ) values (
                        'tournament', 'scheduled',
                        match_rec.sport_id,
                        match_rec.tournament_id, next_round_rec.id,
                        floor(match_rec.round_position / 2),
                        next_round_rec.round_number * 100 + floor(match_rec.round_position / 2),
                        match_rec.created_by
                    )
                    returning id into next_match_id;
                end if;

                -- Thêm winner(s) vào match vòng sau
                if next_match_id is not null then
                    if tourn_rec.team_size = 1 then
                        -- SOLO: thêm 1 player thắng
                        select player_id into winner_player_id
                        from match_players
                        where match_id = match_id_param and team_side = winner;

                        insert into match_players (match_id, player_id, team_side)
                        values (
                            next_match_id,
                            winner_player_id,
                            case when floor(match_rec.round_position / 2)::int % 2 = 0
                                 then 'home' else 'away'
                            end
                        )
                        on conflict (match_id, player_id) do nothing;
                    else
                        -- TEAM: thêm tất cả thành viên của đội thắng
                        insert into match_players (match_id, player_id, team_side, team_name)
                        select
                            next_match_id,
                            mp.player_id,
                            case when floor(match_rec.round_position / 2)::int % 2 = 0
                                 then 'home' else 'away'
                            end,
                            mp.team_name
                        from match_players mp
                        where mp.match_id = match_id_param
                          and mp.team_side = winner
                        on conflict (match_id, player_id) do nothing;
                    end if;
                end if;
            end if;
        end if;
    end if;
end;
$function$;
GRANT ALL ON FUNCTION public.finish_match(uuid, integer, integer, text) TO anon;
GRANT ALL ON FUNCTION public.finish_match(uuid, integer, integer, text) TO authenticated;
GRANT ALL ON FUNCTION public.finish_match(uuid, integer, integer, text) TO service_role;
CREATE FUNCTION public.generate_friend_code()
 RETURNS text
 LANGUAGE plpgsql
AS $function$
declare
    chars  text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    result text;
    exists boolean := true;
begin
    loop
        result := '';
        for i in 1..6 loop
            result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
        end loop;
        select count(*) > 0 into exists from profiles where friend_code = result;
        exit when not exists;
    end loop;
    return result;
end;
$function$;
GRANT ALL ON FUNCTION public.generate_friend_code() TO anon;
GRANT ALL ON FUNCTION public.generate_friend_code() TO authenticated;
GRANT ALL ON FUNCTION public.generate_friend_code() TO service_role;
CREATE FUNCTION public.generate_knockout_bracket(tournament_id_param uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
declare
    tourn_rec record;
    participant_ids uuid[];
    participant_ct int;
    next_pow2 int;
    bye_count int;
    total_rounds int;
    r int;
    match_count int := 0;
    pos int := 0;
    match_id_val uuid;
    teams_in_round int;
    round_0_id uuid;
    round_1_id uuid;
    p_rec record;
begin
    -- Lấy thông tin giải
    select * into tourn_rec from tournaments where id = tournament_id_param;
    if not found then
        raise exception 'Tournament not found';
    end if;

    -- Kiểm tra format
    if tourn_rec.format != 'knockout' then
        raise exception 'This function is only for knockout tournaments';
    end if;

    -- Lấy danh sách participant đã approved
    if tourn_rec.team_size = 1 then
        -- SOLO: lấy player_id
        select array_agg(player_id order by seed asc nulls last, created_at asc)
        into participant_ids
        from tournament_participants
        where tournament_id = tournament_id_param
          and status = 'approved'
          and participant_type = 'solo';
    else
        -- TEAM: lấy participant id
        select array_agg(id order by seed asc nulls last, created_at asc)
        into participant_ids
        from tournament_participants
        where tournament_id = tournament_id_param
          and status = 'approved'
          and participant_type = 'team';
    end if;

    participant_ct := array_length(participant_ids, 1);
    if participant_ct is null or participant_ct < 2 then
        raise exception 'Need at least 2 approved participants';
    end if;

    -- Tính toán bracket
    next_pow2 := power(2, ceil(ln(participant_ct)::numeric / ln(2)::numeric))::int;
    bye_count := next_pow2 - participant_ct;
    total_rounds := ceil(ln(participant_ct)::numeric / ln(2)::numeric)::int;

    -- Tạo các vòng đấu
    if bye_count > 0 then
        insert into tournament_rounds (tournament_id, round_number, name, stage)
        values (tournament_id_param, 0, 'Vòng loại', 'knockout');
    end if;

    for r in 1..total_rounds loop
        insert into tournament_rounds (tournament_id, round_number, name, stage)
        values (
            tournament_id_param, r,
            case
                when r = total_rounds then 'Chung kết'
                when r = total_rounds - 1 then 'Bán kết'
                when r = total_rounds - 2 then 'Tứ kết'
                when r = total_rounds - 3 then 'Vòng 1/8'
                else 'Vòng ' || r
            end,
            'knockout'
        );
    end loop;

    -- === XỬ LÝ BYE / TẠO VÒNG 1 ===
    select id into round_1_id
    from tournament_rounds
    where tournament_id = tournament_id_param and round_number = 1;

    -- Helper: INSERT match_players cho 1 participant (solo hoặc team)
    -- Sử dụng hàm lồng nhau bằng cách tách logic

    if bye_count > 0 then
        select id into round_0_id
        from tournament_rounds
        where tournament_id = tournament_id_param and round_number = 0;

        teams_in_round := participant_ct - bye_count;
        pos := 0;
        match_count := 0;

        for i in 1..teams_in_round loop
            if i % 2 = 1 then
                insert into matches (
                    match_type, status, sport_id,
                    tournament_id, tournament_round_id,
                    round_position, match_order, created_by
                ) values (
                    'tournament', 'scheduled',
                    tourn_rec.sport_id,
                    tournament_id_param, round_0_id,
                    pos, match_count, tourn_rec.created_by
                )
                returning id into match_id_val;

                -- Thêm home team/player
                if tourn_rec.team_size = 1 then
                    insert into match_players (match_id, player_id, team_side)
                    values (match_id_val, participant_ids[bye_count + i], 'home');
                else
                    select * into p_rec from tournament_participants where id = participant_ids[bye_count + i];
                    insert into match_players (match_id, player_id, team_side, team_name)
                    select match_id_val, tm.player_id, 'home', p_rec.team_name
                    from team_members tm where tm.participant_id = p_rec.id;
                end if;

                -- Thêm away team/player
                if bye_count + i + 1 <= participant_ct then
                    if tourn_rec.team_size = 1 then
                        insert into match_players (match_id, player_id, team_side)
                        values (match_id_val, participant_ids[bye_count + i + 1], 'away');
                    else
                        select * into p_rec from tournament_participants where id = participant_ids[bye_count + i + 1];
                        insert into match_players (match_id, player_id, team_side, team_name)
                        select match_id_val, tm.player_id, 'away', p_rec.team_name
                        from team_members tm where tm.participant_id = p_rec.id;
                    end if;
                end if;

                pos := pos + 1;
                match_count := match_count + 1;
            end if;
        end loop;
    else
        match_count := 0;

        for i in 1..participant_ct loop
            if i % 2 = 1 then
                insert into matches (
                    match_type, status, sport_id,
                    tournament_id, tournament_round_id,
                    round_position, match_order, created_by
                ) values (
                    'tournament', 'scheduled',
                    tourn_rec.sport_id,
                    tournament_id_param, round_1_id,
                    (i - 1) / 2, match_count, tourn_rec.created_by
                )
                returning id into match_id_val;

                -- Thêm home team/player
                if tourn_rec.team_size = 1 then
                    insert into match_players (match_id, player_id, team_side)
                    values (match_id_val, participant_ids[i], 'home');
                else
                    select * into p_rec from tournament_participants where id = participant_ids[i];
                    insert into match_players (match_id, player_id, team_side, team_name)
                    select match_id_val, tm.player_id, 'home', p_rec.team_name
                    from team_members tm where tm.participant_id = p_rec.id;
                end if;

                -- Thêm away team/player
                if i + 1 <= participant_ct then
                    if tourn_rec.team_size = 1 then
                        insert into match_players (match_id, player_id, team_side)
                        values (match_id_val, participant_ids[i + 1], 'away');
                    else
                        select * into p_rec from tournament_participants where id = participant_ids[i + 1];
                        insert into match_players (match_id, player_id, team_side, team_name)
                        select match_id_val, tm.player_id, 'away', p_rec.team_name
                        from team_members tm where tm.participant_id = p_rec.id;
                    end if;
                end if;

                match_count := match_count + 1;
            end if;
        end loop;
    end if;

    update tournaments set status = 'in_progress'
    where id = tournament_id_param;
end;
$function$;
GRANT ALL ON FUNCTION public.generate_knockout_bracket(uuid) TO anon;
GRANT ALL ON FUNCTION public.generate_knockout_bracket(uuid) TO authenticated;
GRANT ALL ON FUNCTION public.generate_knockout_bracket(uuid) TO service_role;
CREATE FUNCTION public.generate_round_robin(tournament_id_param uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
declare
    tourn_rec record;
    round_rec record;
    participant_ids uuid[];
    match_idx int := 0;
    match_id_val uuid;
    p1_rec record;
    p2_rec record;
begin
    -- Lấy thông tin giải
    select * into tourn_rec from tournaments where id = tournament_id_param;
    if not found then
        raise exception 'Tournament not found';
    end if;

    -- Kiểm tra format
    if tourn_rec.format != 'round_robin' then
        raise exception 'This function is only for round_robin tournaments';
    end if;

    -- Tạo round
    insert into tournament_rounds (tournament_id, round_number, name, stage)
    values (tournament_id_param, 1, 'Vòng bảng', 'group')
    returning id into round_rec;

    if tourn_rec.team_size = 1 then
        -- ===== SOLO: lấy player_id =====
        select array_agg(player_id order by seed nulls last, created_at)
        into participant_ids
        from tournament_participants
        where tournament_id = tournament_id_param
          and status = 'approved'
          and participant_type = 'solo';

        if array_length(participant_ids, 1) is null or array_length(participant_ids, 1) < 2 then
            raise exception 'Need at least 2 approved solo participants';
        end if;

        for i in 1..array_length(participant_ids, 1) loop
            for j in i+1..array_length(participant_ids, 1) loop
                insert into matches (
                    match_type, status, sport_id,
                    tournament_id, tournament_round_id,
                    match_order, created_by
                ) values (
                    'tournament', 'scheduled',
                    tourn_rec.sport_id,
                    tournament_id_param, round_rec.id,
                    match_idx, tourn_rec.created_by
                )
                returning id into match_id_val;

                insert into match_players (match_id, player_id, team_side) values
                    (match_id_val, participant_ids[i], 'home'),
                    (match_id_val, participant_ids[j], 'away');

                match_idx := match_idx + 1;
            end loop;
        end loop;
    else
        -- ===== TEAM: lấy participant id, thêm team_members =====
        select array_agg(id order by seed nulls last, created_at)
        into participant_ids
        from tournament_participants
        where tournament_id = tournament_id_param
          and status = 'approved'
          and participant_type = 'team';

        if array_length(participant_ids, 1) is null or array_length(participant_ids, 1) < 2 then
            raise exception 'Need at least 2 approved team participants';
        end if;

        for i in 1..array_length(participant_ids, 1) loop
            for j in i+1..array_length(participant_ids, 1) loop
                -- Lấy thông tin 2 đội
                select * into p1_rec from tournament_participants where id = participant_ids[i];
                select * into p2_rec from tournament_participants where id = participant_ids[j];

                insert into matches (
                    match_type, status, sport_id,
                    tournament_id, tournament_round_id,
                    match_order, created_by
                ) values (
                    'tournament', 'scheduled',
                    tourn_rec.sport_id,
                    tournament_id_param, round_rec.id,
                    match_idx, tourn_rec.created_by
                )
                returning id into match_id_val;

                -- Home team: thêm tất cả thành viên
                insert into match_players (match_id, player_id, team_side, team_name)
                select match_id_val, tm.player_id, 'home', p1_rec.team_name
                from team_members tm
                where tm.participant_id = p1_rec.id;

                -- Away team: thêm tất cả thành viên
                insert into match_players (match_id, player_id, team_side, team_name)
                select match_id_val, tm.player_id, 'away', p2_rec.team_name
                from team_members tm
                where tm.participant_id = p2_rec.id;

                match_idx := match_idx + 1;
            end loop;
        end loop;
    end if;

    -- Cập nhật trạng thái giải
    update tournaments set status = 'in_progress'
    where id = tournament_id_param;
end;
$function$;
GRANT ALL ON FUNCTION public.generate_round_robin(uuid) TO anon;
GRANT ALL ON FUNCTION public.generate_round_robin(uuid) TO authenticated;
GRANT ALL ON FUNCTION public.generate_round_robin(uuid) TO service_role;
CREATE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
    insert into public.profiles (id, email, full_name)
    values (
        new.id,
        new.email,
        coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1))
    );
    return new;
end;
$function$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
GRANT ALL ON FUNCTION public.handle_new_user() TO anon;
GRANT ALL ON FUNCTION public.handle_new_user() TO authenticated;
GRANT ALL ON FUNCTION public.handle_new_user() TO service_role;
CREATE FUNCTION public.handle_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
    new.updated_at = now();
    return new;
end;
$function$;
GRANT ALL ON FUNCTION public.handle_updated_at() TO anon;
GRANT ALL ON FUNCTION public.handle_updated_at() TO authenticated;
GRANT ALL ON FUNCTION public.handle_updated_at() TO service_role;
CREATE FUNCTION public.remove_friend(target_friend_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
begin
    delete from friendships
    where (user_id = auth.uid() and friend_id = target_friend_id)
       or (user_id = target_friend_id and friend_id = auth.uid());

    if not found then
        raise exception 'Friendship not found';
    end if;
end;
$function$;
GRANT ALL ON FUNCTION public.remove_friend(uuid) TO anon;
GRANT ALL ON FUNCTION public.remove_friend(uuid) TO authenticated;
GRANT ALL ON FUNCTION public.remove_friend(uuid) TO service_role;
CREATE FUNCTION public.rls_auto_enable()
 RETURNS event_trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$function$;
GRANT ALL ON FUNCTION public.rls_auto_enable() TO anon;
GRANT ALL ON FUNCTION public.rls_auto_enable() TO authenticated;
GRANT ALL ON FUNCTION public.rls_auto_enable() TO service_role;
CREATE TABLE public.friend_requests (id uuid DEFAULT gen_random_uuid() NOT NULL, sender_id uuid NOT NULL, receiver_id uuid NOT NULL, status public.friend_request_status DEFAULT 'pending'::public.friend_request_status NOT NULL, created_at timestamp with time zone DEFAULT now() NOT NULL, updated_at timestamp with time zone DEFAULT now() NOT NULL);
COMMENT ON TABLE public.friend_requests IS 'Lời mời kết bạn - có trạng thái pending/accepted/rejected';
ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friend_requests ADD CONSTRAINT check_not_self CHECK (sender_id <> receiver_id);
ALTER TABLE public.friend_requests ADD CONSTRAINT friend_requests_pkey PRIMARY KEY (id);
ALTER TABLE public.friend_requests ADD CONSTRAINT friend_requests_sender_id_receiver_id_key UNIQUE (sender_id, receiver_id);
GRANT ALL ON public.friend_requests TO anon;
GRANT ALL ON public.friend_requests TO authenticated;
GRANT ALL ON public.friend_requests TO service_role;
CREATE INDEX idx_friend_requests_status ON public.friend_requests (status);
CREATE INDEX idx_friend_requests_receiver ON public.friend_requests (receiver_id);
CREATE INDEX idx_friend_requests_sender ON public.friend_requests (sender_id);
CREATE POLICY friend_requests_insert ON public.friend_requests FOR INSERT WITH CHECK ((sender_id = auth.uid()));
CREATE POLICY friend_requests_select_related ON public.friend_requests FOR SELECT USING (((sender_id = auth.uid()) OR (receiver_id = auth.uid())));
CREATE POLICY friend_requests_update_receiver ON public.friend_requests FOR UPDATE USING ((receiver_id = auth.uid()));
CREATE TABLE public.friendships (id uuid DEFAULT gen_random_uuid() NOT NULL, user_id uuid NOT NULL, friend_id uuid NOT NULL, created_at timestamp with time zone DEFAULT now() NOT NULL);
COMMENT ON TABLE public.friendships IS 'Quan hệ bạn bè hai chiều đã được xác nhận';
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ADD CONSTRAINT check_not_self_friend CHECK (user_id <> friend_id);
ALTER TABLE public.friendships ADD CONSTRAINT friendships_pkey PRIMARY KEY (id);
ALTER TABLE public.friendships ADD CONSTRAINT friendships_user_id_friend_id_key UNIQUE (user_id, friend_id);
GRANT ALL ON public.friendships TO anon;
GRANT ALL ON public.friendships TO authenticated;
GRANT ALL ON public.friendships TO service_role;
CREATE INDEX idx_friendships_user ON public.friendships (user_id);
CREATE INDEX idx_friendships_friend ON public.friendships (friend_id);
CREATE POLICY friendships_delete_self ON public.friendships FOR DELETE USING (((user_id = auth.uid()) OR (friend_id = auth.uid())));
CREATE POLICY friendships_select_self ON public.friendships FOR SELECT USING (((user_id = auth.uid()) OR (friend_id = auth.uid())));
CREATE TABLE public.group_members (id uuid DEFAULT gen_random_uuid() NOT NULL, group_id uuid NOT NULL, user_id uuid NOT NULL, role public.group_role DEFAULT 'member'::public.group_role NOT NULL, joined_at timestamp with time zone DEFAULT now() NOT NULL);
COMMENT ON TABLE public.group_members IS 'Thành viên trong nhóm với vai trò';
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ADD CONSTRAINT group_members_group_id_user_id_key UNIQUE (group_id, user_id);
ALTER TABLE public.group_members ADD CONSTRAINT group_members_pkey PRIMARY KEY (id);
GRANT ALL ON public.group_members TO anon;
GRANT ALL ON public.group_members TO authenticated;
GRANT ALL ON public.group_members TO service_role;
CREATE INDEX idx_group_members_group ON public.group_members (group_id);
CREATE INDEX idx_group_members_user ON public.group_members (user_id);
CREATE POLICY group_members_select_self ON public.group_members FOR SELECT USING (((user_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.group_members gm
  WHERE ((gm.group_id = group_members.group_id) AND (gm.user_id = auth.uid()))))));
CREATE TABLE public.groups (id uuid DEFAULT gen_random_uuid() NOT NULL, name text NOT NULL, sport_id uuid, avatar_url text, created_by uuid NOT NULL, created_at timestamp with time zone DEFAULT now() NOT NULL, updated_at timestamp with time zone DEFAULT now() NOT NULL);
CREATE POLICY group_members_insert ON public.group_members FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.groups
  WHERE ((groups.id = group_members.group_id) AND (groups.created_by = auth.uid())))));
COMMENT ON TABLE public.groups IS 'Nhóm chơi thể thao - do Player tạo';
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ADD CONSTRAINT groups_pkey PRIMARY KEY (id);
ALTER TABLE public.group_members ADD CONSTRAINT group_members_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;
GRANT ALL ON public.groups TO anon;
GRANT ALL ON public.groups TO authenticated;
GRANT ALL ON public.groups TO service_role;
CREATE INDEX idx_groups_created_by ON public.groups (created_by);
CREATE TRIGGER set_groups_updated_at BEFORE UPDATE ON public.groups FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE POLICY groups_insert ON public.groups FOR INSERT WITH CHECK ((created_by = auth.uid()));
CREATE POLICY groups_select_member ON public.groups FOR SELECT USING (((EXISTS ( SELECT 1
   FROM public.group_members
  WHERE ((group_members.group_id = groups.id) AND (group_members.user_id = auth.uid())))) OR (created_by = auth.uid())));
CREATE POLICY groups_update_owner ON public.groups FOR UPDATE USING ((created_by = auth.uid()));
CREATE TABLE public.match_players (id uuid DEFAULT gen_random_uuid() NOT NULL, match_id uuid NOT NULL, player_id uuid NOT NULL, team_side text NOT NULL, team_name text, is_winner boolean, score integer DEFAULT 0 NOT NULL);
COMMENT ON TABLE public.match_players IS 'Người chơi trong trận - 2 người cho 1v1, nhiều hơn cho đồng đội';
ALTER TABLE public.match_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_players ADD CONSTRAINT match_players_match_id_player_id_key UNIQUE (match_id, player_id);
ALTER TABLE public.match_players ADD CONSTRAINT match_players_pkey PRIMARY KEY (id);
ALTER TABLE public.match_players ADD CONSTRAINT match_players_team_side_check CHECK (team_side = ANY (ARRAY['home'::text, 'away'::text]));
GRANT ALL ON public.match_players TO anon;
GRANT ALL ON public.match_players TO authenticated;
GRANT ALL ON public.match_players TO service_role;
CREATE INDEX idx_match_players_match ON public.match_players (match_id);
CREATE INDEX idx_match_players_player ON public.match_players (player_id);
CREATE TABLE public.match_results (id uuid DEFAULT gen_random_uuid() NOT NULL, match_id uuid NOT NULL, winner_team text, home_total_score integer DEFAULT 0 NOT NULL, away_total_score integer DEFAULT 0 NOT NULL, set_details jsonb, created_at timestamp with time zone DEFAULT now() NOT NULL, updated_at timestamp with time zone DEFAULT now() NOT NULL);
COMMENT ON TABLE public.match_results IS 'Kết quả chính thức của trận đấu - cập nhật trực tiếp khi kết thúc';
COMMENT ON COLUMN public.match_results.set_details IS 'Chi tiết từng set/game dạng JSON array';
ALTER TABLE public.match_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_results ADD CONSTRAINT match_results_match_id_key UNIQUE (match_id);
ALTER TABLE public.match_results ADD CONSTRAINT match_results_pkey PRIMARY KEY (id);
ALTER TABLE public.match_results ADD CONSTRAINT match_results_winner_team_check CHECK (winner_team = ANY (ARRAY['home'::text, 'away'::text, 'draw'::text]));
GRANT ALL ON public.match_results TO anon;
GRANT ALL ON public.match_results TO authenticated;
GRANT ALL ON public.match_results TO service_role;
CREATE TRIGGER set_match_results_updated_at BEFORE UPDATE ON public.match_results FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TABLE public.matches (id uuid DEFAULT gen_random_uuid() NOT NULL, match_type public.match_type NOT NULL, status public.match_status DEFAULT 'scheduled'::public.match_status NOT NULL, sport_id uuid NOT NULL, scheduled_at timestamp with time zone, location text, tournament_id uuid, tournament_round_id uuid, room_id uuid, best_of integer DEFAULT 1, duration_minutes integer, round_position integer, match_order integer, created_by uuid NOT NULL, walkover_winner_id uuid, cancellation_reason text, started_at timestamp with time zone, ended_at timestamp with time zone, created_at timestamp with time zone DEFAULT now() NOT NULL, updated_at timestamp with time zone DEFAULT now() NOT NULL);
COMMENT ON TABLE public.matches IS 'Trận đấu - unified cho cả room và tournament';
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ADD CONSTRAINT matches_pkey PRIMARY KEY (id);
ALTER TABLE public.match_players ADD CONSTRAINT match_players_match_id_fkey FOREIGN KEY (match_id) REFERENCES public.matches(id) ON DELETE CASCADE;
ALTER TABLE public.match_results ADD CONSTRAINT match_results_match_id_fkey FOREIGN KEY (match_id) REFERENCES public.matches(id) ON DELETE CASCADE;
GRANT ALL ON public.matches TO anon;
GRANT ALL ON public.matches TO authenticated;
GRANT ALL ON public.matches TO service_role;
CREATE INDEX idx_matches_status ON public.matches (status);
CREATE INDEX idx_matches_live ON public.matches (status) WHERE status = 'live'::public.match_status;
CREATE INDEX idx_matches_type ON public.matches (match_type);
CREATE INDEX idx_matches_tournament ON public.matches (tournament_id);
CREATE INDEX idx_matches_room ON public.matches (room_id);
CREATE INDEX idx_matches_scheduled ON public.matches (scheduled_at) WHERE status = 'scheduled'::public.match_status;
CREATE INDEX idx_matches_sport ON public.matches (sport_id);
CREATE INDEX idx_matches_knockout ON public.matches (tournament_id, tournament_round_id, round_position);
CREATE INDEX idx_matches_order ON public.matches (match_order);
CREATE TRIGGER set_matches_updated_at BEFORE UPDATE ON public.matches FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE POLICY matches_insert ON public.matches FOR INSERT WITH CHECK ((created_by = auth.uid()));
CREATE TABLE public.notification_preferences (id uuid DEFAULT gen_random_uuid() NOT NULL, user_id uuid NOT NULL, type public.notification_type NOT NULL, is_enabled boolean DEFAULT true NOT NULL, updated_at timestamp with time zone DEFAULT now() NOT NULL);
COMMENT ON TABLE public.notification_preferences IS 'Người dùng bật/tắt từng loại thông báo';
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ADD CONSTRAINT notification_preferences_pkey PRIMARY KEY (id);
ALTER TABLE public.notification_preferences ADD CONSTRAINT notification_preferences_user_id_type_key UNIQUE (user_id, type);
GRANT ALL ON public.notification_preferences TO anon;
GRANT ALL ON public.notification_preferences TO authenticated;
GRANT ALL ON public.notification_preferences TO service_role;
CREATE TRIGGER set_notification_preferences_updated_at BEFORE UPDATE ON public.notification_preferences FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TABLE public.notifications (id uuid DEFAULT gen_random_uuid() NOT NULL, user_id uuid NOT NULL, type public.notification_type NOT NULL, title text NOT NULL, body text, data jsonb, is_read boolean DEFAULT false NOT NULL, read_at timestamp with time zone, created_at timestamp with time zone DEFAULT now() NOT NULL);
COMMENT ON TABLE public.notifications IS 'Thông báo hệ thống đến người dùng';
COMMENT ON COLUMN public.notifications.data IS 'JSON payload chứa ID các thực thể liên quan';
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);
GRANT ALL ON public.notifications TO anon;
GRANT ALL ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
CREATE INDEX idx_notifications_unread ON public.notifications (user_id) WHERE is_read = false;
CREATE INDEX idx_notifications_user ON public.notifications (user_id, created_at DESC);
CREATE INDEX idx_notifications_unread_count ON public.notifications (user_id, is_read) WHERE is_read = false;
CREATE POLICY notifications_select_self ON public.notifications FOR SELECT USING ((user_id = auth.uid()));
CREATE POLICY notifications_update_self ON public.notifications FOR UPDATE USING ((user_id = auth.uid()));
CREATE TABLE public.profiles (id uuid NOT NULL, email text NOT NULL, full_name text NOT NULL, avatar_url text, skill_level text, friend_code text DEFAULT public.generate_friend_code() NOT NULL, created_at timestamp with time zone DEFAULT now() NOT NULL, updated_at timestamp with time zone DEFAULT now() NOT NULL);
COMMENT ON TABLE public.profiles IS 'Thông tin mở rộng của người dùng, liên kết với auth.users';
COMMENT ON COLUMN public.profiles.skill_level IS 'Trình độ: beginner/intermediate/advanced/professional';
COMMENT ON COLUMN public.profiles.friend_code IS 'Mã kết bạn 6 ký tự, tự sinh, không đổi';
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_friend_code_key UNIQUE (friend_code);
ALTER TABLE public.profiles ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);
ALTER TABLE public.friend_requests ADD CONSTRAINT friend_requests_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.friend_requests ADD CONSTRAINT friend_requests_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.friendships ADD CONSTRAINT friendships_friend_id_fkey FOREIGN KEY (friend_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.friendships ADD CONSTRAINT friendships_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.group_members ADD CONSTRAINT group_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.groups ADD CONSTRAINT groups_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE RESTRICT;
ALTER TABLE public.match_players ADD CONSTRAINT match_players_player_id_fkey FOREIGN KEY (player_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.matches ADD CONSTRAINT matches_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE RESTRICT;
ALTER TABLE public.matches ADD CONSTRAINT matches_walkover_winner_id_fkey FOREIGN KEY (walkover_winner_id) REFERENCES public.profiles(id);
ALTER TABLE public.notification_preferences ADD CONSTRAINT notification_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_skill_level_check CHECK (skill_level = ANY (ARRAY['beginner'::text, 'intermediate'::text, 'advanced'::text, 'professional'::text]));
GRANT ALL ON public.profiles TO anon;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
CREATE INDEX idx_profiles_email ON public.profiles (email);
CREATE INDEX idx_profiles_friend_code ON public.profiles (friend_code);
CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE POLICY profiles_insert_self ON public.profiles FOR INSERT WITH CHECK ((id = auth.uid()));
CREATE POLICY profiles_no_delete ON public.profiles FOR DELETE USING (false);
CREATE POLICY profiles_select_all ON public.profiles FOR SELECT USING (true);
CREATE POLICY profiles_update_self ON public.profiles FOR UPDATE USING ((auth.uid() = id));
CREATE TABLE public.room_members (id uuid DEFAULT gen_random_uuid() NOT NULL, room_id uuid NOT NULL, user_id uuid NOT NULL, joined_at timestamp with time zone DEFAULT now() NOT NULL);
COMMENT ON TABLE public.room_members IS 'Người tham gia phòng chơi';
ALTER TABLE public.room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_members ADD CONSTRAINT room_members_pkey PRIMARY KEY (id);
ALTER TABLE public.room_members ADD CONSTRAINT room_members_room_id_user_id_key UNIQUE (room_id, user_id);
ALTER TABLE public.room_members ADD CONSTRAINT room_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
GRANT ALL ON public.room_members TO anon;
GRANT ALL ON public.room_members TO authenticated;
GRANT ALL ON public.room_members TO service_role;
CREATE INDEX idx_room_members_user ON public.room_members (user_id);
CREATE INDEX idx_room_members_room ON public.room_members (room_id);
CREATE POLICY room_members_insert_invited ON public.room_members FOR INSERT WITH CHECK ((user_id = auth.uid()));
CREATE POLICY room_members_select_self ON public.room_members FOR SELECT USING ((user_id = auth.uid()));
CREATE TABLE public.rooms (id uuid DEFAULT gen_random_uuid() NOT NULL, name text NOT NULL, sport_id uuid NOT NULL, pairing_mode public.pairing_mode DEFAULT 'auto'::public.pairing_mode NOT NULL, players_per_team integer DEFAULT 1 NOT NULL, status text DEFAULT 'open'::text NOT NULL, created_by uuid NOT NULL, created_at timestamp with time zone DEFAULT now() NOT NULL, updated_at timestamp with time zone DEFAULT now() NOT NULL);
CREATE POLICY match_players_insert_room_host ON public.match_players FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM (public.matches m
     JOIN public.rooms r ON ((r.id = m.room_id)))
  WHERE ((m.id = match_players.match_id) AND (m.match_type = 'room'::public.match_type) AND (r.created_by = auth.uid())))));
COMMENT ON TABLE public.rooms IS 'Phòng chơi - chủ phòng tạo, mời người chơi, chọn môn, ghép cặp tự động hoặc thủ công';
COMMENT ON COLUMN public.rooms.pairing_mode IS 'auto: tự ghép vòng tròn, manual: chủ phòng tự chọn cặp';
COMMENT ON COLUMN public.rooms.players_per_team IS 'Số người mỗi đội: 1 cho 1v1, 2 cho đôi, v.v.';
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ADD CONSTRAINT rooms_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE RESTRICT;
ALTER TABLE public.rooms ADD CONSTRAINT rooms_pkey PRIMARY KEY (id);
ALTER TABLE public.matches ADD CONSTRAINT fk_matches_room FOREIGN KEY (room_id) REFERENCES public.rooms(id) ON DELETE SET NULL;
ALTER TABLE public.room_members ADD CONSTRAINT room_members_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.rooms(id) ON DELETE CASCADE;
ALTER TABLE public.rooms ADD CONSTRAINT rooms_status_check CHECK (status = ANY (ARRAY['open'::text, 'playing'::text, 'closed'::text]));
GRANT ALL ON public.rooms TO anon;
GRANT ALL ON public.rooms TO authenticated;
GRANT ALL ON public.rooms TO service_role;
CREATE INDEX idx_rooms_created_by ON public.rooms (created_by);
CREATE INDEX idx_rooms_sport ON public.rooms (sport_id);
CREATE TRIGGER set_rooms_updated_at BEFORE UPDATE ON public.rooms FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE POLICY rooms_insert ON public.rooms FOR INSERT WITH CHECK ((created_by = auth.uid()));
CREATE POLICY rooms_select_member ON public.rooms FOR SELECT USING (((created_by = auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.room_members
  WHERE ((room_members.room_id = rooms.id) AND (room_members.user_id = auth.uid()))))));
CREATE POLICY rooms_update_host ON public.rooms FOR UPDATE USING ((created_by = auth.uid()));
CREATE TABLE public.score_events (id uuid DEFAULT gen_random_uuid() NOT NULL, match_id uuid NOT NULL, scored_by uuid NOT NULL, team_side text NOT NULL, event_type text DEFAULT 'score'::text NOT NULL, description text, set_number integer DEFAULT 1 NOT NULL, home_score_at_event integer, away_score_at_event integer, created_at timestamp with time zone DEFAULT now() NOT NULL);
ALTER PUBLICATION supabase_realtime ADD TABLE public.match_players, TABLE public.match_results, TABLE public.matches, TABLE public.notifications, TABLE public.rooms, TABLE public.score_events;
COMMENT ON TABLE public.score_events IS 'Chi tiết từng điểm ghi được (live scoring)';
ALTER TABLE public.score_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.score_events ADD CONSTRAINT score_events_event_type_check CHECK (event_type = ANY (ARRAY['score'::text, 'foul'::text, 'penalty'::text, 'timeout'::text, 'yellow_card'::text, 'red_card'::text, 'set_end'::text, 'match_end'::text, 'other'::text]));
ALTER TABLE public.score_events ADD CONSTRAINT score_events_match_id_fkey FOREIGN KEY (match_id) REFERENCES public.matches(id) ON DELETE CASCADE;
ALTER TABLE public.score_events ADD CONSTRAINT score_events_pkey PRIMARY KEY (id);
ALTER TABLE public.score_events ADD CONSTRAINT score_events_scored_by_fkey FOREIGN KEY (scored_by) REFERENCES public.profiles(id);
ALTER TABLE public.score_events ADD CONSTRAINT score_events_team_side_check CHECK (team_side = ANY (ARRAY['home'::text, 'away'::text]));
GRANT ALL ON public.score_events TO anon;
GRANT ALL ON public.score_events TO authenticated;
GRANT ALL ON public.score_events TO service_role;
CREATE INDEX idx_score_events_team ON public.score_events (match_id, team_side);
CREATE INDEX idx_score_events_match ON public.score_events (match_id);
CREATE INDEX idx_score_events_recent ON public.score_events (match_id, created_at DESC);
CREATE POLICY score_events_delete_room_host ON public.score_events FOR DELETE USING ((EXISTS ( SELECT 1
   FROM (public.matches m
     JOIN public.rooms r ON ((r.id = m.room_id)))
  WHERE ((m.id = score_events.match_id) AND (m.match_type = 'room'::public.match_type) AND (r.created_by = auth.uid())))));
CREATE POLICY score_events_delete_self ON public.score_events FOR DELETE USING ((scored_by = auth.uid()));
CREATE POLICY score_events_insert_room_host ON public.score_events FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM (public.matches m
     JOIN public.rooms r ON ((r.id = m.room_id)))
  WHERE ((m.id = score_events.match_id) AND (m.match_type = 'room'::public.match_type) AND (r.created_by = auth.uid()) AND (m.status = 'live'::public.match_status)))));
CREATE TABLE public.sports (id uuid DEFAULT gen_random_uuid() NOT NULL, name text NOT NULL, name_en text, icon text, description text, is_active boolean DEFAULT true NOT NULL, created_at timestamp with time zone DEFAULT now() NOT NULL);
COMMENT ON TABLE public.sports IS 'Danh mục môn thể thao';
ALTER TABLE public.sports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sports ADD CONSTRAINT sports_name_key UNIQUE (name);
ALTER TABLE public.sports ADD CONSTRAINT sports_pkey PRIMARY KEY (id);
ALTER TABLE public.groups ADD CONSTRAINT groups_sport_id_fkey FOREIGN KEY (sport_id) REFERENCES public.sports(id) ON DELETE SET NULL;
ALTER TABLE public.matches ADD CONSTRAINT matches_sport_id_fkey FOREIGN KEY (sport_id) REFERENCES public.sports(id) ON DELETE RESTRICT;
ALTER TABLE public.rooms ADD CONSTRAINT rooms_sport_id_fkey FOREIGN KEY (sport_id) REFERENCES public.sports(id) ON DELETE RESTRICT;
GRANT ALL ON public.sports TO anon;
GRANT ALL ON public.sports TO authenticated;
GRANT ALL ON public.sports TO service_role;
CREATE POLICY sports_select_all ON public.sports FOR SELECT USING (true);
CREATE TABLE public.team_members (id uuid DEFAULT gen_random_uuid() NOT NULL, participant_id uuid NOT NULL, player_id uuid NOT NULL, role text DEFAULT 'member'::text NOT NULL, joined_at timestamp with time zone DEFAULT now() NOT NULL);
COMMENT ON TABLE public.team_members IS 'Thành viên của đội trong giải đấu đồng đội';
COMMENT ON COLUMN public.team_members.role IS 'captain: đội trưởng (trùng với captain_id trong tournament_participants), member: thành viên';
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ADD CONSTRAINT team_members_participant_id_player_id_key UNIQUE (participant_id, player_id);
ALTER TABLE public.team_members ADD CONSTRAINT team_members_pkey PRIMARY KEY (id);
ALTER TABLE public.team_members ADD CONSTRAINT team_members_player_id_fkey FOREIGN KEY (player_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.team_members ADD CONSTRAINT team_members_role_check CHECK (role = ANY (ARRAY['captain'::text, 'member'::text]));
GRANT ALL ON public.team_members TO anon;
GRANT ALL ON public.team_members TO authenticated;
GRANT ALL ON public.team_members TO service_role;
CREATE INDEX idx_team_members_participant ON public.team_members (participant_id);
CREATE INDEX idx_team_members_player ON public.team_members (player_id);
CREATE TABLE public.tournament_organizers (id uuid DEFAULT gen_random_uuid() NOT NULL, tournament_id uuid NOT NULL, user_id uuid NOT NULL, can_manage_matches boolean DEFAULT true NOT NULL, can_manage_participants boolean DEFAULT true NOT NULL, can_manage_schedule boolean DEFAULT true NOT NULL, created_at timestamp with time zone DEFAULT now() NOT NULL);
CREATE POLICY match_players_insert_tournament_organizer ON public.match_players FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM (public.matches m
     JOIN public.tournament_organizers torg ON ((torg.tournament_id = m.tournament_id)))
  WHERE ((m.id = match_players.match_id) AND (m.match_type = 'tournament'::public.match_type) AND (torg.user_id = auth.uid())))));
CREATE POLICY match_results_select_related ON public.match_results FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.matches m
  WHERE ((m.id = match_results.match_id) AND ((m.created_by = auth.uid()) OR (EXISTS ( SELECT 1
           FROM public.match_players
          WHERE ((match_players.match_id = m.id) AND (match_players.player_id = auth.uid())))) OR (EXISTS ( SELECT 1
           FROM public.tournament_organizers torg
          WHERE ((torg.tournament_id = m.tournament_id) AND (torg.user_id = auth.uid())))) OR (EXISTS ( SELECT 1
           FROM public.room_members rm
          WHERE ((rm.room_id = m.room_id) AND (rm.user_id = auth.uid())))) OR (m.status = ANY (ARRAY['live'::public.match_status, 'completed'::public.match_status])))))));
CREATE POLICY matches_update_participant ON public.matches FOR UPDATE USING ((((match_type = 'tournament'::public.match_type) AND (EXISTS ( SELECT 1
   FROM public.tournament_organizers
  WHERE ((tournament_organizers.tournament_id = matches.tournament_id) AND (tournament_organizers.user_id = auth.uid()))))) OR ((match_type = 'room'::public.match_type) AND (EXISTS ( SELECT 1
   FROM public.rooms
  WHERE ((rooms.id = matches.room_id) AND (rooms.created_by = auth.uid())))))));
CREATE POLICY score_events_delete_organizer ON public.score_events FOR DELETE USING ((EXISTS ( SELECT 1
   FROM (public.matches m
     JOIN public.tournament_organizers torg ON ((torg.tournament_id = m.tournament_id)))
  WHERE ((m.id = score_events.match_id) AND (torg.user_id = auth.uid())))));
CREATE POLICY score_events_insert_organizer ON public.score_events FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM (public.matches m
     JOIN public.tournament_organizers torg ON ((torg.tournament_id = m.tournament_id)))
  WHERE ((m.id = score_events.match_id) AND (torg.user_id = auth.uid()) AND (m.status = 'live'::public.match_status)))));
CREATE POLICY score_events_select_match_participant ON public.score_events FOR SELECT USING (((EXISTS ( SELECT 1
   FROM public.match_players
  WHERE ((match_players.match_id = score_events.match_id) AND (match_players.player_id = auth.uid())))) OR (EXISTS ( SELECT 1
   FROM (public.matches m
     JOIN public.room_members rm ON ((rm.room_id = m.room_id)))
  WHERE ((m.id = score_events.match_id) AND (rm.user_id = auth.uid())))) OR (EXISTS ( SELECT 1
   FROM (public.matches m
     JOIN public.tournament_organizers torg ON ((torg.tournament_id = m.tournament_id)))
  WHERE ((m.id = score_events.match_id) AND (torg.user_id = auth.uid())))) OR (EXISTS ( SELECT 1
   FROM public.matches
  WHERE ((matches.id = score_events.match_id) AND (matches.status = ANY (ARRAY['live'::public.match_status, 'completed'::public.match_status])))))));
COMMENT ON TABLE public.tournament_organizers IS 'Ban tổ chức giải đấu - có quyền quản lý';
ALTER TABLE public.tournament_organizers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_organizers ADD CONSTRAINT tournament_organizers_pkey PRIMARY KEY (id);
ALTER TABLE public.tournament_organizers ADD CONSTRAINT tournament_organizers_tournament_id_user_id_key UNIQUE (tournament_id, user_id);
ALTER TABLE public.tournament_organizers ADD CONSTRAINT tournament_organizers_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
GRANT ALL ON public.tournament_organizers TO anon;
GRANT ALL ON public.tournament_organizers TO authenticated;
GRANT ALL ON public.tournament_organizers TO service_role;
CREATE POLICY tournament_organizers_select ON public.tournament_organizers FOR SELECT USING (true);
CREATE TABLE public.tournament_participants (id uuid DEFAULT gen_random_uuid() NOT NULL, tournament_id uuid NOT NULL, participant_type text NOT NULL, player_id uuid, team_name text, captain_id uuid, status text DEFAULT 'pending'::text NOT NULL, seed integer, group_index integer, registered_at timestamp with time zone DEFAULT now() NOT NULL, approved_at timestamp with time zone);
CREATE POLICY match_players_select_related ON public.match_players FOR SELECT USING (((player_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.matches m
  WHERE ((m.id = match_players.match_id) AND ((m.created_by = auth.uid()) OR (EXISTS ( SELECT 1
           FROM public.tournament_organizers torg
          WHERE ((torg.tournament_id = m.tournament_id) AND (torg.user_id = auth.uid())))) OR (EXISTS ( SELECT 1
           FROM public.room_members rm
          WHERE ((rm.room_id = m.room_id) AND (rm.user_id = auth.uid())))) OR (EXISTS ( SELECT 1
           FROM public.rooms r
          WHERE ((r.id = m.room_id) AND (r.created_by = auth.uid())))) OR (EXISTS ( SELECT 1
           FROM public.tournament_participants tp
          WHERE ((tp.tournament_id = m.tournament_id) AND (tp.player_id = auth.uid())))) OR (EXISTS ( SELECT 1
           FROM (public.team_members tm
             JOIN public.tournament_participants tp ON ((tp.id = tm.participant_id)))
          WHERE ((tp.tournament_id = m.tournament_id) AND (tm.player_id = auth.uid())))) OR (m.status = ANY (ARRAY['live'::public.match_status, 'completed'::public.match_status]))))))));
CREATE POLICY matches_select_participant ON public.matches FOR SELECT USING (((EXISTS ( SELECT 1
   FROM public.match_players
  WHERE ((match_players.match_id = matches.id) AND (match_players.player_id = auth.uid())))) OR (created_by = auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.tournament_organizers
  WHERE ((tournament_organizers.tournament_id = matches.tournament_id) AND (tournament_organizers.user_id = auth.uid())))) OR (EXISTS ( SELECT 1
   FROM public.room_members
  WHERE ((room_members.room_id = matches.room_id) AND (room_members.user_id = auth.uid())))) OR (EXISTS ( SELECT 1
   FROM (public.team_members tm
     JOIN public.tournament_participants tp ON ((tp.id = tm.participant_id)))
  WHERE ((tp.tournament_id = matches.tournament_id) AND (tm.player_id = auth.uid())))) OR (status = ANY (ARRAY['live'::public.match_status, 'completed'::public.match_status]))));
CREATE POLICY team_members_insert_captain ON public.team_members FOR INSERT WITH CHECK (((EXISTS ( SELECT 1
   FROM public.tournament_participants
  WHERE ((tournament_participants.id = team_members.participant_id) AND (tournament_participants.captain_id = auth.uid())))) OR (EXISTS ( SELECT 1
   FROM public.tournament_organizers
  WHERE ((tournament_organizers.tournament_id = ( SELECT tp2.tournament_id
           FROM public.tournament_participants tp2
          WHERE (tp2.id = team_members.participant_id))) AND (tournament_organizers.user_id = auth.uid()))))));
CREATE POLICY team_members_select_self ON public.team_members FOR SELECT USING (((player_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.tournament_participants tp
  WHERE ((tp.id = team_members.participant_id) AND (tp.captain_id = auth.uid())))) OR (EXISTS ( SELECT 1
   FROM public.tournament_organizers
  WHERE ((tournament_organizers.tournament_id = ( SELECT tp2.tournament_id
           FROM public.tournament_participants tp2
          WHERE (tp2.id = team_members.participant_id))) AND (tournament_organizers.user_id = auth.uid()))))));
COMMENT ON TABLE public.tournament_participants IS 'Đội/người tham gia giải đấu - unified cho solo và team';
COMMENT ON COLUMN public.tournament_participants.participant_type IS 'solo: cá nhân, team: đồng đội';
COMMENT ON COLUMN public.tournament_participants.team_name IS 'Tên đội (chỉ cho team)';
COMMENT ON COLUMN public.tournament_participants.captain_id IS 'Đội trưởng (chỉ cho team)';
COMMENT ON COLUMN public.tournament_participants.seed IS 'Hạt giống xếp hạng';
ALTER TABLE public.tournament_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_participants ADD CONSTRAINT check_participant_type CHECK (participant_type = 'solo'::text AND player_id IS NOT NULL AND team_name IS NULL AND captain_id IS NULL OR participant_type = 'team'::text AND player_id IS NULL AND team_name IS NOT NULL AND captain_id IS NOT NULL);
ALTER TABLE public.tournament_participants ADD CONSTRAINT tournament_participants_captain_id_fkey FOREIGN KEY (captain_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.tournament_participants ADD CONSTRAINT tournament_participants_participant_type_check CHECK (participant_type = ANY (ARRAY['solo'::text, 'team'::text]));
ALTER TABLE public.tournament_participants ADD CONSTRAINT tournament_participants_pkey PRIMARY KEY (id);
ALTER TABLE public.team_members ADD CONSTRAINT team_members_participant_id_fkey FOREIGN KEY (participant_id) REFERENCES public.tournament_participants(id) ON DELETE CASCADE;
ALTER TABLE public.tournament_participants ADD CONSTRAINT tournament_participants_player_id_fkey FOREIGN KEY (player_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.tournament_participants ADD CONSTRAINT tournament_participants_status_check CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text]));
GRANT ALL ON public.tournament_participants TO anon;
GRANT ALL ON public.tournament_participants TO authenticated;
GRANT ALL ON public.tournament_participants TO service_role;
CREATE UNIQUE INDEX uq_tp_solo ON public.tournament_participants (tournament_id, player_id) WHERE participant_type = 'solo'::text AND player_id IS NOT NULL;
CREATE INDEX idx_tournament_participants_type ON public.tournament_participants (participant_type);
CREATE INDEX idx_tournament_participants_status ON public.tournament_participants (status);
CREATE INDEX idx_tournament_participants_tournament ON public.tournament_participants (tournament_id);
CREATE INDEX idx_tournament_participants_approved ON public.tournament_participants (tournament_id) WHERE status = 'approved'::text;
CREATE UNIQUE INDEX uq_tp_team ON public.tournament_participants (tournament_id, team_name) WHERE participant_type = 'team'::text AND team_name IS NOT NULL;
CREATE POLICY tournament_participants_insert ON public.tournament_participants FOR INSERT WITH CHECK ((((participant_type = 'solo'::text) AND (player_id = auth.uid())) OR ((participant_type = 'team'::text) AND (captain_id = auth.uid()))));
CREATE POLICY tournament_participants_select ON public.tournament_participants FOR SELECT USING (true);
CREATE TABLE public.tournament_rounds (id uuid DEFAULT gen_random_uuid() NOT NULL, tournament_id uuid NOT NULL, round_number integer NOT NULL, name text, stage text, created_at timestamp with time zone DEFAULT now() NOT NULL);
COMMENT ON TABLE public.tournament_rounds IS 'Các vòng đấu trong giải';
ALTER TABLE public.tournament_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_rounds ADD CONSTRAINT tournament_rounds_pkey PRIMARY KEY (id);
ALTER TABLE public.matches ADD CONSTRAINT matches_tournament_round_id_fkey FOREIGN KEY (tournament_round_id) REFERENCES public.tournament_rounds(id) ON DELETE SET NULL;
ALTER TABLE public.tournament_rounds ADD CONSTRAINT tournament_rounds_stage_check CHECK (stage = ANY (ARRAY['group'::text, 'knockout'::text]));
ALTER TABLE public.tournament_rounds ADD CONSTRAINT tournament_rounds_tournament_id_round_number_key UNIQUE (tournament_id, round_number);
GRANT ALL ON public.tournament_rounds TO anon;
GRANT ALL ON public.tournament_rounds TO authenticated;
GRANT ALL ON public.tournament_rounds TO service_role;
CREATE TABLE public.tournaments (id uuid DEFAULT gen_random_uuid() NOT NULL, name text NOT NULL, sport_id uuid NOT NULL, description text, location text, start_date date NOT NULL, end_date date NOT NULL, registration_deadline date, format public.tournament_format DEFAULT 'round_robin'::public.tournament_format NOT NULL, visibility public.tournament_visibility DEFAULT 'public'::public.tournament_visibility NOT NULL, status public.tournament_status DEFAULT 'draft'::public.tournament_status NOT NULL, max_teams integer, min_teams integer, team_size integer DEFAULT 1 NOT NULL, prize_first text, prize_second text, prize_third text, points_win integer DEFAULT 3 NOT NULL, points_draw integer DEFAULT 1 NOT NULL, points_loss integer DEFAULT 0 NOT NULL, group_count integer DEFAULT 0, created_by uuid NOT NULL, created_at timestamp with time zone DEFAULT now() NOT NULL, updated_at timestamp with time zone DEFAULT now() NOT NULL);
COMMENT ON TABLE public.tournaments IS 'Giải đấu thể thao - do Player (BTC) tạo. team_size: 1 = solo, 2+ = đồng đội';
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournaments ADD CONSTRAINT check_tournament_dates CHECK (end_date >= start_date);
ALTER TABLE public.tournaments ADD CONSTRAINT tournaments_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE RESTRICT;
ALTER TABLE public.tournaments ADD CONSTRAINT tournaments_pkey PRIMARY KEY (id);
ALTER TABLE public.matches ADD CONSTRAINT matches_tournament_id_fkey FOREIGN KEY (tournament_id) REFERENCES public.tournaments(id) ON DELETE CASCADE;
ALTER TABLE public.tournament_organizers ADD CONSTRAINT tournament_organizers_tournament_id_fkey FOREIGN KEY (tournament_id) REFERENCES public.tournaments(id) ON DELETE CASCADE;
ALTER TABLE public.tournament_participants ADD CONSTRAINT tournament_participants_tournament_id_fkey FOREIGN KEY (tournament_id) REFERENCES public.tournaments(id) ON DELETE CASCADE;
ALTER TABLE public.tournament_rounds ADD CONSTRAINT tournament_rounds_tournament_id_fkey FOREIGN KEY (tournament_id) REFERENCES public.tournaments(id) ON DELETE CASCADE;
ALTER TABLE public.tournaments ADD CONSTRAINT tournaments_sport_id_fkey FOREIGN KEY (sport_id) REFERENCES public.sports(id) ON DELETE RESTRICT;
GRANT ALL ON public.tournaments TO anon;
GRANT ALL ON public.tournaments TO authenticated;
GRANT ALL ON public.tournaments TO service_role;
CREATE INDEX idx_tournaments_created_by ON public.tournaments (created_by);
CREATE INDEX idx_tournaments_status ON public.tournaments (status);
CREATE INDEX idx_tournaments_sport ON public.tournaments (sport_id);
CREATE TRIGGER set_tournaments_updated_at BEFORE UPDATE ON public.tournaments FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE POLICY tournaments_insert ON public.tournaments FOR INSERT WITH CHECK ((created_by = auth.uid()));
CREATE POLICY tournaments_select_all ON public.tournaments FOR SELECT USING (true);
CREATE POLICY tournaments_update_organizer ON public.tournaments FOR UPDATE USING (((created_by = auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.tournament_organizers
  WHERE ((tournament_organizers.tournament_id = tournaments.id) AND (tournament_organizers.user_id = auth.uid()))))));
CREATE TABLE public.user_sports (id uuid DEFAULT gen_random_uuid() NOT NULL, user_id uuid NOT NULL, sport_id uuid NOT NULL, created_at timestamp with time zone DEFAULT now() NOT NULL);
COMMENT ON TABLE public.user_sports IS 'Môn thể thao người dùng yêu thích / muốn chơi';
ALTER TABLE public.user_sports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sports ADD CONSTRAINT fk_user_sports_sport FOREIGN KEY (sport_id) REFERENCES public.sports(id) ON DELETE CASCADE;
ALTER TABLE public.user_sports ADD CONSTRAINT user_sports_pkey PRIMARY KEY (id);
ALTER TABLE public.user_sports ADD CONSTRAINT user_sports_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.user_sports ADD CONSTRAINT user_sports_user_id_sport_id_key UNIQUE (user_id, sport_id);
GRANT ALL ON public.user_sports TO anon;
GRANT ALL ON public.user_sports TO authenticated;
GRANT ALL ON public.user_sports TO service_role;
CREATE VIEW public.player_stats WITH (security_invoker=true) AS WITH match_stats AS (
         SELECT mp.player_id,
            m.sport_id,
            count(*) AS total,
            count(*) FILTER (WHERE (mp.is_winner = true)) AS wins,
            count(*) FILTER (WHERE ((mp.is_winner = false) AND (EXISTS ( SELECT 1
                   FROM public.match_players mp2
                  WHERE ((mp2.match_id = mp.match_id) AND (mp2.is_winner = true)))))) AS losses,
            count(*) FILTER (WHERE ((m.status = 'completed'::public.match_status) AND (NOT (EXISTS ( SELECT 1
                   FROM public.match_players mp2
                  WHERE ((mp2.match_id = mp.match_id) AND (mp2.is_winner = true))))))) AS draws
           FROM (public.match_players mp
             JOIN public.matches m ON ((m.id = mp.match_id)))
          WHERE (m.status = 'completed'::public.match_status)
          GROUP BY mp.player_id, m.sport_id
        ), player_totals AS (
         SELECT match_stats.player_id,
            sum(match_stats.total) AS total_matches,
            sum(match_stats.wins) AS total_wins,
            sum(match_stats.losses) AS total_losses,
            sum(match_stats.draws) AS total_draws
           FROM match_stats
          GROUP BY match_stats.player_id
        )
 SELECT pt.player_id,
    COALESCE(pt.total_matches, (0)::numeric) AS total_matches,
    COALESCE(pt.total_wins, (0)::numeric) AS total_wins,
    COALESCE(pt.total_losses, (0)::numeric) AS total_losses,
    COALESCE(pt.total_draws, (0)::numeric) AS total_draws,
        CASE
            WHEN (pt.total_matches > (0)::numeric) THEN round(((100.0 * pt.total_wins) / pt.total_matches), 1)
            ELSE (0)::numeric
        END AS win_percentage,
    COALESCE(jsonb_object_agg(COALESCE(s.name, 'unknown'::text), jsonb_build_object('total', ms.total, 'wins', ms.wins, 'losses', ms.losses, 'draws', ms.draws, 'win_rate',
        CASE
            WHEN (ms.total > 0) THEN round(((100.0 * (ms.wins)::numeric) / (ms.total)::numeric), 1)
            ELSE (0)::numeric
        END)) FILTER (WHERE (s.name IS NOT NULL)), '{}'::jsonb) AS stats_by_sport
   FROM ((player_totals pt
     LEFT JOIN match_stats ms ON ((ms.player_id = pt.player_id)))
     LEFT JOIN public.sports s ON ((s.id = ms.sport_id)))
  GROUP BY pt.player_id, pt.total_matches, pt.total_wins, pt.total_losses, pt.total_draws;
COMMENT ON VIEW public.player_stats IS 'Thống kê tổng hợp cho mỗi người chơi';
GRANT ALL ON public.player_stats TO anon;
GRANT ALL ON public.player_stats TO authenticated;
GRANT ALL ON public.player_stats TO service_role;
CREATE VIEW public.tournament_standings WITH (security_invoker=true) AS WITH tournament_config AS (
         SELECT tournaments.id,
            tournaments.points_win,
            tournaments.points_draw,
            tournaments.points_loss,
            tournaments.team_size
           FROM public.tournaments
        ), team_scores AS (
         SELECT match_players.match_id,
            match_players.team_side,
            sum(match_players.score) AS team_total
           FROM public.match_players
          GROUP BY match_players.match_id, match_players.team_side
        ), match_counts AS (
         SELECT m.tournament_id,
            mp.team_side,
            mp.team_name,
            mp.player_id,
                CASE
                    WHEN (tc.team_size = 1) THEN (mp.player_id)::text
                    ELSE mp.team_name
                END AS group_key,
            count(DISTINCT m.id) FILTER (WHERE (m.status = 'completed'::public.match_status)) AS total_matches,
            count(DISTINCT m.id) FILTER (WHERE (mp.is_winner = true)) AS wins,
            count(DISTINCT m.id) FILTER (WHERE ((mp.is_winner = false) AND (EXISTS ( SELECT 1
                   FROM public.match_players mp2
                  WHERE ((mp2.match_id = mp.match_id) AND (mp2.is_winner = true)))))) AS losses,
            count(DISTINCT m.id) FILTER (WHERE ((m.status = 'completed'::public.match_status) AND (NOT (EXISTS ( SELECT 1
                   FROM public.match_players mp2
                  WHERE ((mp2.match_id = mp.match_id) AND (mp2.is_winner = true))))))) AS draws,
            COALESCE(sum(mp.score), (0)::bigint) AS total_score_for,
            COALESCE(sum(opp.team_total), (0)::numeric) AS total_score_against
           FROM (((public.matches m
             JOIN public.match_players mp ON ((mp.match_id = m.id)))
             JOIN tournament_config tc ON ((tc.id = m.tournament_id)))
             LEFT JOIN team_scores opp ON (((opp.match_id = mp.match_id) AND (opp.team_side <> mp.team_side))))
          WHERE (m.tournament_id IS NOT NULL)
          GROUP BY m.tournament_id, tc.team_size, tc.points_win, tc.points_draw, tc.points_loss, mp.team_side, mp.team_name, mp.player_id
        )
 SELECT mc.tournament_id,
        CASE
            WHEN (max(tc2.team_size) = 1) THEN max((mc.player_id)::text)
            ELSE max(mc.team_name)
        END AS participant_name,
    mc.team_name,
    mc.team_side,
    max(mc.total_matches) AS total_matches,
    max(mc.wins) AS wins,
    max(mc.draws) AS draws,
    max(mc.losses) AS losses,
    (((max(mc.wins) * max(tc2.points_win)) + (max(mc.draws) * max(tc2.points_draw))) + (max(mc.losses) * max(tc2.points_loss))) AS points,
    ((max(mc.total_score_for))::numeric - max(mc.total_score_against)) AS goal_difference,
    max(mc.total_score_for) AS goals_scored,
    rank() OVER (PARTITION BY mc.tournament_id ORDER BY ((max(mc.wins) * max(tc2.points_win)) + (max(mc.draws) * max(tc2.points_draw))) DESC, ((max(mc.total_score_for))::numeric - max(mc.total_score_against)) DESC, (max(mc.total_score_for)) DESC) AS rank
   FROM (match_counts mc
     JOIN tournament_config tc2 ON ((tc2.id = mc.tournament_id)))
  GROUP BY mc.tournament_id, mc.group_key, mc.team_name, mc.team_side;
COMMENT ON VIEW public.tournament_standings IS 'Bảng xếp hạng realtime cho mỗi giải đấu';
GRANT ALL ON public.tournament_standings TO anon;
GRANT ALL ON public.tournament_standings TO authenticated;
GRANT ALL ON public.tournament_standings TO service_role;
CREATE EVENT TRIGGER ensure_rls ON ddl_command_end WHEN TAG IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO') EXECUTE FUNCTION public.rls_auto_enable();