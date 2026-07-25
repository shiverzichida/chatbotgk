# Arsitektur Produk Chatbot Gizi Kebugaran

Dokumen ini merinci arsitektur yang cocok untuk produk chatbot gizi kebugaran berbasis RAG dengan pola kerja: pemrosesan PDF dilakukan di komputer lokal, sedangkan aplikasi produksi berjalan di Vercel dan Supabase.[cite:108][cite:93]

## Tujuan Sistem

Arsitektur ini ditujukan untuk membuat chatbot gizi kebugaran yang dapat menjawab pertanyaan berdasarkan sumber dokumen sendiri, terutama buku PDF, lalu menampilkan jawaban yang cepat dan dapat dilacak ke halaman atau bagian sumber.[cite:21][cite:84]

Sistem dirancang agar proses berat seperti OCR, parsing PDF, chunking, dan embedding tidak dijalankan di Vercel. Pendekatan ini lebih aman untuk workload dokumen besar karena Vercel cocok untuk frontend, API ringan, auth flow, dan streaming response, sedangkan pemrosesan PDF berat lebih baik dipisah dari layer serverless.[cite:88][cite:93][cite:89][cite:101]

## Prinsip Arsitektur

Prinsip utamanya adalah memisahkan tiga lapisan kerja:

- Lapisan ingest lokal untuk upload PDF, OCR, chunking, dan embedding.[cite:108][cite:111]
- Lapisan data cloud di Supabase untuk auth, storage metadata, Postgres, dan pgvector similarity search.[cite:91][cite:108][cite:116]
- Lapisan aplikasi di Vercel untuk Next.js frontend, chat UX, retrieval orchestration, dan integrasi ke LLM seperti Groq.[cite:88][cite:93]

Dengan pola ini, buku PDF tidak diperlakukan sebagai prompt statis. Buku diperlakukan sebagai knowledge base terindeks yang dapat dicari kembali saat user mengajukan pertanyaan.[cite:21][cite:56][cite:68]

## Gambaran Umum Arsitektur

### Komponen utama

| Komponen | Peran | Lokasi |
|---------|------|--------|
| Next.js App | UI chat, dashboard, auth, API ringan, streaming jawaban | Vercel [cite:88][cite:93] |
| Supabase Auth | Login, session, role admin/user | Supabase [cite:91] |
| Supabase Postgres + pgvector | Simpan metadata dokumen, chunk, embedding, progress user | Supabase [cite:108][cite:111] |
| Supabase Storage | Simpan file sumber atau arsip dokumen bila diperlukan | Supabase [cite:87][cite:91] |
| Local Ingestion Worker | OCR, parsing, chunking, embedding, upsert ke database | Komputer lokal [cite:108][cite:111] |
| Groq API | Menyusun jawaban akhir dengan latency rendah | Cloud LLM layer [cite:41] |

### Alur tingkat tinggi

1. Admin menjalankan script lokal untuk memproses buku PDF.[cite:108][cite:111]
2. Script membaca PDF; bila scan, jalankan OCR terlebih dahulu.[cite:21][cite:1]
3. Hasil teks dipecah menjadi chunk semantik atau per bab/subbab, bukan fixed-size secara buta.[cite:18][cite:66]
4. Script menghasilkan embedding untuk tiap chunk lalu mengirim metadata dan vector ke Supabase pgvector.[cite:108][cite:111]
5. Aplikasi Next.js di Vercel menerima pertanyaan user dan menjalankan similarity search ke Supabase.[cite:93][cite:108]
6. Chunk yang relevan dikirim ke Groq untuk menyusun jawaban akhir dengan sitasi sumber.[cite:41][cite:84]
7. User menerima jawaban yang cepat, ter-grounded, dan lebih transparan.[cite:84][cite:76]

## Kenapa Arsitektur Ini Cocok

Kombinasi Vercel dan Supabase sudah umum dipakai untuk aplikasi Next.js dengan vector search dan auth, sehingga cocok untuk layer produk dan antarmuka user.[cite:88][cite:91][cite:93]

Di sisi lain, workload PDF besar tidak ideal dipaksa masuk ke serverless function karena ada batas payload dan potensi masalah kompatibilitas parsing dokumen. Karena itu, pemrosesan dokumen besar lebih aman dijalankan di mesin lokal atau worker terpisah.[cite:89][cite:101]

Untuk domain kesehatan dan kebugaran, jawaban yang dikaitkan ke sumber dokumen juga lebih disarankan karena meningkatkan transparansi dan membantu mengurangi halusinasi model.[cite:84][cite:78][cite:82]

## Detail Layer 1: Ingestion Lokal

Layer ini berjalan di komputer lokal dan hanya dipakai admin atau operator sistem. Fungsinya adalah mengubah buku PDF menjadi data siap-cari di vector database.[cite:108][cite:111]

### Tugas utama ingestion lokal

- Memilih file PDF sumber.
- Menentukan apakah PDF digital atau scan.
- Menjalankan OCR bila diperlukan.
- Menormalkan teks.
- Melakukan chunking.
- Membuat embedding.
- Melakukan insert atau upsert ke Supabase.[cite:21][cite:108][cite:111]

### Kenapa lokal

Pemrosesan lokal memberi kontrol penuh pada kualitas OCR, pembersihan teks, dan struktur chunk. Pendekatan ini juga menghindari beban serverless yang tidak perlu pada Vercel.[cite:89][cite:101][cite:108]

### Rekomendasi pipeline lokal

1. **Input PDF**: satu buku PDF atau beberapa dokumen tambahan.
2. **Document check**: identifikasi apakah file berisi teks digital atau hanya hasil scan.
3. **OCR/parsing**: bila digital, ekstrak teks langsung; bila scan, gunakan OCR yang mendukung multi-page parsing.[cite:1][cite:21]
4. **Cleaning**: hapus header/footer berulang, nomor halaman yang mengganggu, artefak OCR, dan karakter rusak.
5. **Semantic chunking**: pecah berdasarkan bab, subbab, heading, atau blok logis.[cite:18][cite:66]
6. **Metadata tagging**: tambahkan page number, section title, chapter title, source file, urutan chunk, dan topik nutrisi/fitness.
7. **Embedding**: gunakan satu model embedding yang konsisten untuk semua data.
8. **Upsert ke Supabase**: kirim isi chunk, metadata, dan vector ke tabel pgvector.[cite:108][cite:111]

### Aturan chunking yang disarankan

Untuk buku, hindari chunking buta berdasarkan jumlah karakter saja. Chunk berbasis struktur bab atau semantic boundaries lebih baik karena menjaga keterkaitan konteks dan biasanya meningkatkan kualitas retrieval.[cite:18][cite:66][cite:69]

Pedoman praktis:

- Usahakan chunk menyimpan satu ide utama.
- Simpan overlap kecil antar-chunk untuk menjaga kesinambungan konteks.
- Jangan campurkan dua topik yang berbeda dalam satu chunk bila bisa dipisahkan.
- Selalu simpan metadata halaman dan judul bagian agar sitasi mudah dibuat.[cite:66][cite:69]

## Detail Layer 2: Supabase

Supabase menjadi pusat data aplikasi. Bagian ini menyimpan data pengguna, data progres, dokumen terindeks, dan vector untuk similarity search.[cite:91][cite:108][cite:116]

### Fungsi Supabase dalam sistem

- Authentication dan authorization.[cite:91]
- PostgreSQL untuk relational data.[cite:108]
- pgvector untuk embedding dan vector similarity search.[cite:108][cite:111]
- Storage untuk file sumber bila PDF asli ingin tetap tersedia di cloud.[cite:87][cite:91]

### Tabel inti yang disarankan

#### 1. `documents`

Menyimpan dokumen sumber.

| Kolom | Tipe | Fungsi |
|------|------|--------|
| id | uuid | Primary key |
| title | text | Nama dokumen |
| source_file | text | Nama file atau path storage |
| language | text | Bahasa dokumen |
| total_pages | integer | Jumlah halaman |
| status | text | uploaded, processed, failed |
| created_at | timestamptz | Timestamp |

#### 2. `document_chunks`

Menyimpan potongan teks dan metadata.

| Kolom | Tipe | Fungsi |
|------|------|--------|
| id | uuid | Primary key |
| document_id | uuid | Relasi ke documents |
| chunk_index | integer | Urutan chunk |
| content | text | Isi chunk |
| page_start | integer | Halaman awal |
| page_end | integer | Halaman akhir |
| chapter_title | text | Judul bab |
| section_title | text | Judul subbagian |
| topic_tags | text[] | Tag topik |
| embedding | vector | Embedding pgvector |
| created_at | timestamptz | Timestamp |

#### 3. `profiles`

Menyimpan profil dasar user.

| Kolom | Tipe | Fungsi |
|------|------|--------|
| id | uuid | User id |
| full_name | text | Nama |
| gender | text | Jenis kelamin |
| birth_date | date | Tanggal lahir |
| height_cm | numeric | Tinggi badan |
| weight_kg | numeric | Berat badan awal |
| goal_type | text | fat_loss, muscle_gain, maintenance |
| activity_level | text | Tingkat aktivitas |
| created_at | timestamptz | Timestamp |

#### 4. `progress_logs`

Menyimpan perubahan progres user.

| Kolom | Tipe | Fungsi |
|------|------|--------|
| id | uuid | Primary key |
| user_id | uuid | Relasi ke profile |
| weight_kg | numeric | Berat saat log |
| body_fat_pct | numeric | Opsional |
| calories_target | numeric | Target kalori |
| protein_target_g | numeric | Target protein |
| training_notes | text | Catatan latihan |
| logged_at | timestamptz | Waktu input |

#### 5. `chat_sessions` dan `chat_messages`

Menyimpan histori chat untuk continuity dan audit internal.

### Search function

Buat SQL function atau RPC untuk similarity search berdasarkan embedding query. Supabase mendukung penyimpanan embedding dan vector similarity search langsung di Postgres melalui pgvector.[cite:108][cite:111]

## Detail Layer 3: Aplikasi Vercel

Vercel dipakai untuk menjalankan Next.js App Router sebagai frontend utama dan API ringan. Ini cocok untuk login, chat UI, dashboard, dan streaming jawaban.[cite:88][cite:93]

### Yang dijalankan di Vercel

- Landing page dan halaman app.
- Auth callback dan session handling.
- Chat interface.
- Retrieval orchestration.
- Prompt composition.
- Streaming response dari model.
- Admin dashboard ringan untuk melihat status dokumen dan user.[cite:88][cite:93]

### Yang tidak dijalankan di Vercel

- OCR multi-page berat.
- Parsing PDF besar.
- Batch embedding dokumen besar.
- Job indexing panjang.[cite:89][cite:101]

## Detail Layer 4: Groq API

Groq dipakai untuk generasi jawaban akhir karena unggul pada inferensi cepat dan model tertentu memiliki biaya yang rendah untuk workload chat.[cite:41]

### Peran Groq dalam sistem

- Menerima pertanyaan user.
- Menerima context dari hasil retrieval.
- Menyusun jawaban natural dalam bahasa Indonesia.
- Menjaga jawaban singkat, relevan, dan grounded ke konteks sumber.[cite:41][cite:84]

### Yang tidak dilakukan Groq

- Groq tidak dipakai untuk OCR.
- Groq tidak dipakai untuk menyimpan knowledge.
- Groq tidak menjadi pengganti vector DB.

Ia hanya menjadi lapisan reasoning dan answer synthesis setelah retrieval dilakukan.[cite:41][cite:108]

## Flow Operasional End-to-End

### Flow ingest admin

1. Admin menyiapkan buku PDF di komputer lokal.
2. Menjalankan script ingest lokal.
3. Sistem membaca PDF dan menentukan mode parsing/OCR.
4. Sistem membersihkan teks dan membagi chunk.
5. Sistem membuat embedding.
6. Sistem melakukan upsert ke tabel dokumen dan chunk di Supabase.
7. Dokumen ditandai siap dipakai.[cite:21][cite:108][cite:111]

### Flow chat user

1. User login ke aplikasi.
2. User mengirim pertanyaan, misalnya tentang protein, cutting, recovery, atau meal timing.
3. App membentuk query embedding dan mencari chunk paling relevan di Supabase.[cite:93][cite:108]
4. App mengambil konteks tambahan dari profil dan progres user bila diperlukan.
5. App menyusun prompt untuk Groq berisi pertanyaan, konteks dokumen, dan aturan jawaban.
6. Groq menyusun jawaban akhir.
7. Aplikasi menampilkan jawaban plus sumber halaman atau section terkait.[cite:41][cite:84]

## Guardrails dan Aturan Jawaban

Untuk domain gizi kebugaran, chatbot sebaiknya tidak menjawab seperti dokter umum tanpa batas. Pendekatan yang lebih aman adalah membuat jawaban selalu berbasis sumber, transparan, dan menyatakan saat jawaban berasal dari general knowledge atau ketika informasi tidak ditemukan.[cite:84][cite:83][cite:85]

### Aturan sistem yang disarankan

- Jawab hanya dari sumber bila mode “strict source” aktif.
- Bila sumber tidak ditemukan, katakan tidak ditemukan di dokumen.
- Bedakan saran edukatif dari saran medis klinis.
- Tampilkan sitasi halaman atau section.
- Tambahkan disclaimer bahwa sistem ini untuk edukasi kebugaran dan nutrisi, bukan diagnosis medis.[cite:84][cite:76][cite:83]

### Contoh aturan prompt system

- Jangan membuat angka baru bila tidak ada di konteks.
- Jangan menjawab seolah-olah dokter bila pertanyaan klinis berat.
- Bila konteks tidak cukup, minta klarifikasi atau nyatakan keterbatasan.
- Prioritaskan jawaban yang singkat, jelas, dan bisa diverifikasi dari sumber.

## Desain Produk MVP

MVP sebaiknya fokus pada fitur yang benar-benar membuktikan value produk, bukan langsung terlalu luas.[cite:17][cite:22]

### Fitur MVP yang disarankan

- Login user dan role admin/user.[cite:91]
- Upload dan indexing dokumen oleh admin dari komputer lokal.[cite:108]
- Chat AI dengan citation.[cite:21][cite:84]
- Profil user dan target kebugaran.
- Progress log sederhana.
- Riwayat chat.
- Fallback saat jawaban tidak ada di sumber.[cite:84]

### Fitur fase berikutnya

- Meal planner.
- Integrasi progress foto atau body measurement.
- Integrasi perangkat wearable.
- Multi-document library.
- Panel evaluasi kualitas jawaban.

## Struktur Folder yang Disarankan

### Next.js app

```text
app/
  (marketing)/
  dashboard/
  chat/
  admin/
  api/
components/
lib/
  supabase/
  rag/
  groq/
```

### Worker lokal Python

```text
ingestion/
  ingest_pdf.py
  ocr.py
  parser.py
  chunker.py
  embedder.py
  upsert_supabase.py
  config.py
```

Pemisahan ini membantu menjaga batas yang jelas antara aplikasi produksi dan pipeline ingest dokumen.[cite:93][cite:108]

## Skema Prompting yang Disarankan

### Input ke LLM

Prompt ke model sebaiknya berisi empat bagian:

1. Peran chatbot.
2. Aturan jawaban.
3. Konteks retrieval dari dokumen.
4. Konteks user seperti goal dan progres bila relevan.[cite:84][cite:17]

### Contoh struktur

- System: Anda adalah asisten gizi kebugaran berbasis dokumen.
- Rules: Jawab hanya berdasarkan konteks; jika tidak ada, katakan tidak ditemukan.
- Context: potongan chunk terpilih + metadata halaman.
- User state: berat badan, target, aktivitas, progres terbaru.
- User question: pertanyaan asli.

## Operasional dan Pemeliharaan

### Re-index dokumen

Setiap kali buku direvisi atau ada dokumen baru, admin cukup menjalankan ulang script lokal. Sistem kemudian melakukan upsert berdasarkan `document_id` atau versi dokumen.[cite:108][cite:111]

### Quality control

Sebelum meng-upload hasil embedding, lakukan pemeriksaan pada:

- kualitas OCR,
- kesalahan pemenggalan chunk,
- metadata halaman,
- konsistensi embedding model.[cite:21][cite:66][cite:108]

### Observability dasar

Pantau setidaknya:

- jumlah query harian,
- hit rate retrieval,
- jawaban tanpa sumber,
- latency Groq,
- error search function,
- konsumsi token.[cite:41][cite:95]

## Risiko dan Mitigasi

| Risiko | Dampak | Mitigasi |
|-------|--------|----------|
| OCR jelek | Retrieval buruk | Gunakan OCR lebih baik, review manual sampel halaman [cite:21][cite:1] |
| Chunking buruk | Jawaban tidak nyambung | Gunakan chapter-aware atau semantic chunking [cite:18][cite:66] |
| Semua proses dipaksa ke Vercel | Timeout dan limit serverless | Pindahkan ingest ke komputer lokal [cite:89][cite:101] |
| Jawaban health terlalu bebas | Risiko trust dan safety | Gunakan strict grounding, citation, disclaimer [cite:84][cite:83][cite:85] |
| Embedding tidak konsisten | Search rusak | Gunakan satu model embedding yang tetap [cite:108] |

## Roadmap Implementasi

### Fase 1: Fondasi

- Setup Next.js di Vercel.[cite:88]
- Setup Supabase project dan pgvector.[cite:108][cite:91]
- Buat auth dan role admin/user.[cite:91]
- Buat schema database inti.

### Fase 2: Ingestion lokal

- Buat script lokal untuk parse PDF.
- Tambahkan OCR untuk dokumen scan.[cite:1][cite:21]
- Tambahkan chunking semantik.[cite:18][cite:66]
- Tambahkan embedding dan upsert ke Supabase.[cite:108][cite:111]

### Fase 3: Chat RAG

- Buat similarity search RPC di Supabase.[cite:108]
- Integrasikan Groq ke route handler chat.[cite:41]
- Tampilkan jawaban dan citation di UI.[cite:84]

### Fase 4: Personalization

- Tambahkan profil user.
- Tambahkan log progres.
- Gunakan konteks profil pada prompt saat relevan.

### Fase 5: Hardening

- Tambahkan logging dan analytics.
- Tambahkan evaluasi kualitas jawaban.
- Tambahkan fallback dan penanganan error yang lebih baik.

## Keputusan Arsitektur Final

Keputusan yang paling sesuai untuk kebutuhan ini adalah:

- **Frontend dan produk web**: Next.js di Vercel.[cite:88][cite:93]
- **Backend data**: Supabase Auth, Postgres, pgvector, dan Storage.[cite:91][cite:108]
- **Ingestion dokumen**: dijalankan lokal di komputer sendiri, bukan di Vercel.[cite:89][cite:101]
- **LLM jawaban**: Groq untuk latency cepat.[cite:41]
- **Knowledge source**: buku PDF dan dokumen Anda sendiri, bukan prompt statis.[cite:21][cite:56]

Arsitektur ini paling seimbang antara biaya, kontrol, skalabilitas, dan kualitas jawaban. Ia juga cocok untuk berkembang dari satu buku PDF menjadi library knowledge base yang lebih besar tanpa harus mengubah fondasi utama sistem.[cite:93][cite:108][cite:116]
