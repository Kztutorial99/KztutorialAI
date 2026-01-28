# 🤖 Kz.tutorial AI Coding Assistant (Web App)

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-19-blue)
![Supabase](https://img.shields.io/badge/Supabase-Database-green)
![Groq](https://img.shields.io/badge/AI-Llama%203.3-orange)

Aplikasi Web AI Coding Assistant tingkat lanjut yang dibuat dengan **React + TypeScript + Vite**. Aplikasi ini memiliki fitur chat cerdas (Text & Vision), sistem kredit/top-up, gamifikasi (Daily Streak & Referral), serta Dashboard Admin tersembunyi.

---

## 🌟 Fitur Utama

### 🧑‍💻 Fitur Pengguna (User)
1.  **AI Chat Cerdas**:
    *   **Llama 3.1 8B (Instant)**: Untuk chat ringan & cepat (1 Kredit).
    *   **Llama 3.3 70B (Analisis)**: Mode logika mendalam untuk coding kompleks (2 Kredit).
    *   **Mata Dewa (Vision)**: Analisis gambar/screenshot error menggunakan **Llama 4 Scout** (1 Kredit).
    *   **Web Search (Real-time)**: Mencari data terbaru dari internet via Serper API.
2.  **Sistem Ekonomi & Kredit**:
    *   Setiap request memotong kredit.
    *   **Top Up**: Upload bukti transfer (QRIS/PayPal), status pending hingga di-approve Admin.
3.  **Gamifikasi**:
    *   **Daily Check-in**: Absen harian untuk dapat kredit gratis (Bonus di hari ke-7).
    *   **Referral System**: Undang teman, keduanya dapat bonus kredit (+10).
    *   **Fingerprint Security**: Mencegah klaim referral ganda dari device yang sama.
4.  **UI/UX Modern**:
    *   **Terminal Mode**: Tampilan ala hacker (Hijau/Hitam).
    *   **Markdown Support**: Syntax highlighting untuk kode dengan tombol Copy.
    *   **Haptic Feedback**: Getaran saat respon diterima (Mobile).
    *   **Inbox Notifikasi**: Realtime update dari Admin atau sistem.

### 🛡️ Fitur Admin (Hidden)
*   **Akses Rahasia**: Ketik keyword `modeadmin` di chat -> Masukkan PIN `2719`.
*   **API Key Management**: Tambah/Hapus/Rotasi API Key Groq & Serper secara live tanpa restart server.
*   **Approval Top Up**: Terima/Tolak request top-up user.
*   **Broadcast Pesan**: Kirim notifikasi ke semua user atau user tertentu.
*   **System Logs**: Pantau error, aktivitas user, dan kesehatan sistem.
*   **Database View**: Melihat script SQL untuk maintenance.

---

## 🛠️ Teknologi yang Digunakan

*   **Frontend**: React 19, TypeScript, Tailwind CSS.
*   **Backend / BaaS**: Supabase (Auth, Database, Realtime, Storage).
*   **AI Provider**: Groq Cloud (Llama Models).
*   **Search Provider**: Serper.dev (Google Search API).
*   **Icons**: Lucide React.
*   **Utils**: FingerprintJS (Device ID), Canvas Confetti.

---

## 📂 Struktur Folder Project

```text
/
├── index.html              # Entry point HTML (Import maps & Tailwind CDN)
├── index.tsx               # React Root Render
├── App.tsx                 # Main Logic & Routing View
├── types.ts                # TypeScript Interfaces
├── constants.ts            # System Prompts & Secrets (PIN)
├── metadata.json           # App Metadata
│
├── services/
│   ├── supabaseClient.ts   # Koneksi ke Supabase (URL & Key)
│   ├── groqService.ts      # Logic Streaming AI (Groq & Vision)
│   └── serperService.ts    # Logic Google Search
│
├── contexts/
│   └── AuthContext.tsx     # Global State User (Session/Profile)
│
└── components/
    ├── ChatInterface.tsx   # UI Chat Utama
    ├── MarkdownRenderer.tsx# Render Chat & Code Block (Syntax Highlight)
    ├── ImageUpload.tsx     # Handle Input Gambar & Kompresi (Vision)
    ├── SettingsModal.tsx   # Profil, Login, Settings UI
    ├── TopUpModal.tsx      # Form Pembelian Kredit & Upload Bukti
    ├── InboxModal.tsx      # Panel Notifikasi Realtime
    ├── DailyCheckIn.tsx    # Fitur Absen Harian
    ├── ReferralSystem.tsx  # Fitur Kode Undangan & Claim
    ├── LandingPage.tsx     # Halaman Depan (Sebelum Login)
    ├── AdminModal.tsx      # Login Admin (PIN Input)
    └── AdminDashboard.tsx  # Panel Kontrol Admin Lengkap
```

---

## 🗄️ DATABASE SETUP (SUPABASE SQL) - **WAJIB**

Agar aplikasi berjalan, Anda **HARUS** menjalankan query SQL berikut di **Supabase SQL Editor**. Ini akan membuat tabel, fungsi, trigger, dan policy keamanan.

### 1. Setup Tabel & Trigger User

```sql
-- 1. PROFILES (Menyimpan Data User & Kredit)
create table public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  full_name text,
  credits int default 15, -- Modal awal user baru
  referral_code text unique,
  created_at timestamptz default now()
);

-- Trigger: Buat profil otomatis saat User Sign Up
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, referral_code)
  values (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name',
    upper(substring(md5(random()::text) from 1 for 8)) -- Generate random ref code
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. SYSTEM SETTINGS (Simpan API Keys)
create table public.system_settings (
  id int primary key generated by default as identity,
  groq_api_keys text[],
  serper_api_key text
);

-- Insert row pertama (Wajib ada agar Admin Panel jalan)
insert into public.system_settings (groq_api_keys, serper_api_key) 
values (ARRAY[''], '');

-- 3. TOPUP REQUESTS (Transaksi)
create table public.topup_requests (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id),
  amount int not null,
  price int not null,
  currency text default 'IDR',
  payment_method text,
  proof_url text,
  status text default 'pending', -- pending, approved, rejected
  created_at timestamptz default now()
);

-- 4. NOTIFICATIONS (Inbox User)
create table public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id),
  title text,
  message text,
  type text, -- system, payment, admin, promo
  is_read boolean default false,
  created_at timestamptz default now()
);

-- 5. USER STREAKS (Absen Harian)
create table public.user_streaks (
  user_id uuid references public.profiles(id) primary key,
  current_streak int default 0,
  last_claim_at timestamptz
);

-- 6. REFERRALS (Log Referral)
create table public.referrals (
  id uuid default gen_random_uuid() primary key,
  referrer_id uuid references public.profiles(id),
  referee_id uuid references public.profiles(id),
  device_id text, -- Fingerprint Anti Tuyul
  created_at timestamptz default now()
);

-- 7. SYSTEM LOGS (Log Admin & Error)
create table public.system_logs (
    id uuid default gen_random_uuid() primary key,
    level text, 
    action text,
    message text,
    meta jsonb default '{}'::jsonb,
    created_at timestamptz default now()
);

-- 8. API KEY USAGE (Tracking Pemakaian Key)
create table public.api_key_usage (
    id uuid default gen_random_uuid() primary key,
    api_key text unique not null,
    usage_count int default 0,
    last_used_at timestamptz default now()
);
```

### 2. Setup Logic Bisnis (RPC Functions)

```sql
-- A. CLAIM DAILY BONUS
create or replace function claim_daily_bonus()
returns json as $$
declare
  v_user_id uuid;
  v_streak int;
  v_last_claim timestamptz;
  v_bonus int := 1;
begin
  v_user_id := auth.uid();
  
  select current_streak, last_claim_at into v_streak, v_last_claim 
  from public.user_streaks where user_id = v_user_id;

  if not found then
    insert into public.user_streaks (user_id, current_streak, last_claim_at)
    values (v_user_id, 1, now());
    update public.profiles set credits = credits + 1 where id = v_user_id;
    return json_build_object('success', true, 'message', 'Absen hari pertama! +1 Kredit', 'streak', 1, 'bonus', 1);
  end if;

  if v_last_claim::date = now()::date then
    return json_build_object('success', false, 'message', 'Sudah absen hari ini. Kembali besok!');
  end if;

  if v_last_claim::date = (now() - interval '1 day')::date then
    v_streak := v_streak + 1;
  else
    v_streak := 1;
  end if;

  if v_streak % 7 = 0 then v_bonus := 5; end if;

  update public.user_streaks set current_streak = v_streak, last_claim_at = now() where user_id = v_user_id;
  update public.profiles set credits = credits + v_bonus where id = v_user_id;

  return json_build_object('success', true, 'message', 'Absen Berhasil! +' || v_bonus || ' Kredit', 'streak', v_streak, 'bonus', v_bonus);
end;
$$ language plpgsql security definer;

-- B. CLAIM REFERRAL
create or replace function claim_referral(code_input text, device_id_input text)
returns json as $$
declare
  v_user_id uuid;
  v_referrer_id uuid;
begin
  v_user_id := auth.uid();

  select id into v_referrer_id from public.profiles where referral_code = code_input;
  if v_referrer_id = v_user_id then return json_build_object('success', false, 'message', 'Kode sendiri dilarang.'); end if;
  if v_referrer_id is null then return json_build_object('success', false, 'message', 'Kode tidak ditemukan.'); end if;

  if exists (select 1 from public.referrals where referee_id = v_user_id) then
    return json_build_object('success', false, 'message', 'Anda sudah pernah klaim kode.');
  end if;

  -- Cek device id (Optional: Uncomment jika ingin strict)
  -- if exists (select 1 from public.referrals where device_id = device_id_input) then
  --   return json_build_object('success', false, 'message', 'Perangkat ini sudah digunakan.');
  -- end if;

  insert into public.referrals (referrer_id, referee_id, device_id)
  values (v_referrer_id, v_user_id, device_id_input);

  update public.profiles set credits = credits + 10 where id = v_referrer_id;
  update public.profiles set credits = credits + 10 where id = v_user_id;

  insert into public.notifications (user_id, title, message, type)
  values (v_referrer_id, '👥 Referral Berhasil', 'Teman menggunakan kodemu! +10 Kredit.', 'promo');

  return json_build_object('success', true, 'message', 'Kode valid! +10 Kredit untukmu & temanmu.');
end;
$$ language plpgsql security definer;

-- C. ADMIN ACTIONS (Approve/Reject Topup)
create or replace function admin_approve_topup(request_id uuid, target_user_id uuid, credit_amount int) 
returns json as $$
begin
  update public.topup_requests set status = 'approved' where id = request_id;
  update public.profiles set credits = credits + credit_amount where id = target_user_id;
  insert into public.notifications (user_id, title, message, type) 
  values (target_user_id, '✅ Pembayaran Diterima', 'Topup ' || credit_amount || ' kredit berhasil masuk.', 'payment');
  return json_build_object('success', true);
end;
$$ language plpgsql security definer;

create or replace function admin_reject_topup(request_id uuid, target_user_id uuid) 
returns void as $$
begin
  update public.topup_requests set status = 'rejected' where id = request_id;
  insert into public.notifications (user_id, title, message, type) 
  values (target_user_id, '❌ Pembayaran Ditolak', 'Bukti pembayaran tidak valid.', 'payment');
end;
$$ language plpgsql security definer;

-- D. KEY USAGE TRACKER
create or replace function increment_key_usage(key_input text)
returns void as $$
begin
  insert into public.api_key_usage (api_key, usage_count, last_used_at)
  values (key_input, 1, now())
  on conflict (api_key) do update set usage_count = api_key_usage.usage_count + 1, last_used_at = now();
end;
$$ language plpgsql security definer;
```

### 3. Setup Keamanan (RLS Policies) & Storage

Jalankan ini agar data aman:

```sql
-- Enable RLS
alter table public.profiles enable row level security;
alter table public.topup_requests enable row level security;
alter table public.notifications enable row level security;
alter table public.system_settings enable row level security;
alter table public.system_logs enable row level security;

-- Policies (User hanya bisa lihat datanya sendiri)
create policy "User view own profile" on public.profiles for select using (auth.uid() = id);
create policy "User view own requests" on public.topup_requests for select using (auth.uid() = user_id);
create policy "User insert requests" on public.topup_requests for insert with check (auth.uid() = user_id);
create policy "User view own notifs" on public.notifications for select using (auth.uid() = user_id);
create policy "User update own notifs" on public.notifications for update using (auth.uid() = user_id);

-- System Settings & Logs (Buka akses insert log untuk tracking)
create policy "Public read keys" on public.system_settings for select using (true);
create policy "Public insert logs" on public.system_logs for insert with check (true);
create policy "Read logs" on public.system_logs for select using (true);
create policy "Admin update keys" on public.system_settings for update using (true); 
```

**Setup Storage Bucket (Manual di Dashboard Supabase):**
1.  Buat bucket `payment_proofs` (Public: Yes).
2.  Buat bucket `QRIS_PAYMENT` (Public: Yes) -> Upload gambar QRIS Anda dan beri nama `qris.png`.

---

## 🚀 Cara Instalasi & Menjalankan

1.  **Clone Project / Download**.
2.  **Konfigurasi Koneksi Supabase**:
    *   Buka file `services/supabaseClient.ts`.
    *   Ubah `SUPABASE_URL` dan `SUPABASE_ANON_KEY` dengan kredensial project Supabase Anda.
3.  **Jalankan Aplikasi**:
    *   Jika menggunakan terminal, cukup ketik:
        ```bash
        npm install
        npm run dev
        ```
    *   Atau karena project ini menggunakan ES Modules via CDN (lihat `index.html`), Anda bisa langsung menjalankannya dengan `vite`.

---

## 🔑 Cara Menggunakan Mode Admin

Fitur admin tidak memiliki tombol UI agar tidak disalahgunakan user biasa.

1.  Buka aplikasi dan Login.
2.  Di kolom chat, ketik: **`modeadmin`** (tanpa spasi).
3.  Tekan Enter / Kirim.
4.  Akan muncul popup PIN. Masukkan PIN Default: **`2719`**.
5.  **Admin Dashboard** akan terbuka.

### Menu Admin Dashboard:
*   **Monitor**: Melihat status API Key Groq (Latency, Error, Rate Limit). Bisa tambah key baru di sini.
*   **Requests**: Melihat daftar user yang transfer/topup. Anda bisa Approve (kredit masuk otomatis) atau Reject.
*   **History**: Riwayat transaksi yang sudah diproses.
*   **Logs**: Melihat log sistem (siapa yang login, error API, broadcast pesan).
*   **Broadcast**: Kirim pesan notifikasi ke seluruh user (Inbox).

---

## 💡 Info Lainnya

*   **Mengganti PIN Admin**: Ubah `ADMIN_PIN` di file `constants.ts`.
*   **Mengganti Harga**: Ubah constant `PACKAGES` di file `components/TopUpModal.tsx`.
*   **Menambah Model AI**: Logika model ada di `App.tsx` (handleSendMessage) dan `services/groqService.ts`.

**Dibuat oleh**: Kz.tutorial
