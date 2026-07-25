# Panduan Penggunaan Script Ingestion OCR / PDF ke Supabase

Script `ingest_ocr.py` dirancang untuk memproses dokumen PDF (baik yang berupa teks digital yang bisa diblok maupun hasil scan/gambar) dan mengunggahnya secara otomatis ke database Supabase Anda untuk dijadikan basis pengetahuan chatbot AI.

---

## 📋 Persyaratan Sistem

Pastikan Anda telah menginstal **Python 3** di komputer Anda.

### 1. Instalasi Dependensi Dasar (Cepat & Ringan)
Untuk PDF digital biasa yang teksnya bisa diblok/disalin, Anda cukup menggunakan parser teks standar dengan menginstal:
```bash
pip install supabase pypdf
```

### 2. Instalasi Dependensi OCR (Untuk Gambar / PDF Hasil Scan)
Jika buku PDF Anda berupa gambar hasil scan kamera atau scanner, instal library OCR berikut:
```bash
pip install paddleocr paddlepaddle PyMuPDF Pillow numpy
```
*Catatan: Pada sistem Windows, proses instalasi PaddleOCR mungkin membutuhkan compiler Visual Studio C++ build tools.*

---

## 🚀 Cara Menjalankan Script

1. Pastikan file `.env.local` di folder `web` sudah berisi variabel berikut:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://okyqjbojxtylnuqaewyx.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUz... (Service Role Key Anda)
   ```
2. Jalankan perintah berikut di terminal Anda (posisi di folder `web`):

### Contoh A: Ekstraksi Teks Standar (Default Fallback)
```bash
python ingest_ocr.py --pdf "path/to/buku_gizi.pdf" --chapter "Bab 1: Pengenalan Nutrisi"
```

### Contoh B: Ekstraksi OCR (Bila dependensi OCR sudah lengkap)
Script akan mendeteksi library `paddleocr` secara otomatis. Jika terpasang, script akan memproses setiap halaman PDF secara visual (OCR) sebelum memotong teks dan mengunggahnya.

---

## ⚙️ Cara Kerja Script
1. **Membaca Kredensial:** Script membaca `.env.local` untuk berinteraksi langsung dengan Supabase secara aman.
2. **Ekstraksi Halaman:** PDF dibaca halaman-demi-halaman (baik teks biasa atau OCR visual).
3. **Chunking Teks:** Teks panjang dipotong menjadi potongan berukuran ~800 karakter dengan overlap ~150 karakter untuk menjaga keutuhan makna kalimat.
4. **Penyimpanan DB:** Mengunggah hasil potongan ke tabel `document_chunks` lengkap dengan metadata bab (`chapter_title`) dan halaman awal (`page_start`).
