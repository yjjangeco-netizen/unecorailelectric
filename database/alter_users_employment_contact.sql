-- 사용자: 재직상태 + 연락처(회사이메일은 기존 email 사용) 컬럼 추가
-- 기존 is_active 는 유지하고(로그인/조회 로직 호환) employment_status 와 동기화한다.
--   재직중/휴가중 → is_active true, 퇴직 → false

alter table public.users add column if not exists employment_status text not null default '재직중';
alter table public.users add column if not exists phone text;
alter table public.users add column if not exists home_address text;
alter table public.users add column if not exists hire_date date;

-- CHECK: 허용값
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'users_employment_status_check'
  ) then
    alter table public.users
      add constraint users_employment_status_check
      check (employment_status in ('재직중', '휴가중', '퇴직'));
  end if;
end $$;

-- 기존 데이터 백필: 비활성 계정은 퇴직 처리
update public.users set employment_status = '퇴직' where is_active = false;
update public.users set employment_status = '재직중' where is_active = true and (employment_status is null or employment_status = '');
