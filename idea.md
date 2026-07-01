# Rancangan Web App AI untuk Pendidikan (Dasar hingga Universitas)


## A. Pendahuluan

Web app AI pendidikan ini dirancang untuk melayani empat kelompok pengguna dengan kepakaran dan kebutuhan berbeda:

| Pengguna | Kebutuhan Utama |
|----------|----------------|
| Murid SD/SMP | Pemahaman konsep dasar, latihan interaktif, motivasi belajar |
| Siswa SMA | Persiapan ujian, pendalaman materi, eksplorasi minat |
| Mahasiswa | Riset akademik, pemahaman mendalam, kolaborasi, persiapan karir |
| Guru SD-SMA | Perencanaan pembelajaran, grading, analisis kemajuan siswa |
| Dosen | Riset, pembuatan soal, analisis kelas, publikasi |

Selain fitur yang telah disebutkan (chat, project folder, subject agent, koreksi ujian dengan filter identitas), berikut adalah usulan fasilitas tambahan yang dapat diimplementasikan.


## B. Fasilitas Tambahan yang Diusulkan

### 1. Adaptive Learning Pathway (Jalur Belajar Adaptif)

Sistem secara otomatis menyusun jalur belajar personal berdasarkan performa, kecepatan belajar, dan gaya belajar pengguna. Mirip dengan konsep NextLearn yang menggunakan *Progressive Content Unlocking* dan rekomendasi konten yang disesuaikan dengan performa learner, serta Adaptive Learning System (ALS) yang menyediakan *personalised learning pathway* dengan rekomendasi sumber belajar dan soal latihan berdasarkan kesiapan siswa.

**Fitur:**
- *Knowledge Tracing* real-time untuk melacak penguasaan konsep
- Rekomendasi materi berikutnya secara adaptif
- *Daily Goal Tracking* dan *Study Streaks* untuk motivasi
- Dashboard visual kemajuan belajar per konsep/mata kuliah

### 2. Intelligent Tutoring System (Sistem Tutor Cerdas)

Berbeda dengan chat biasa, tutor ini memiliki *pedagogical logic* yang mengatur bagaimana AI memberikan bimbingan—bukan sekadar menjawab pertanyaan, tetapi membimbing pengguna menemukan jawaban sendiri.

**Fitur:**
- *Socratic questioning* untuk menggiring siswa berpikir kritis
- *Scaffolded hints* (petunjuk bertahap) sesuai tingkat pemahaman
- Mode *explain like I'm 5* hingga *expert-level discussion* yang dapat disesuaikan
- Multimodal interaction (teks, suara, dan audio)

### 3. AI-Powered Assessment & Grading Suite

**a. Automated Essay Scoring dengan Feedback Mendetail**
- Analisis struktur tulisan, koherensi, tata bahasa, dan originalitas
- Memberikan feedback spesifik per paragraf/kalimat (seperti Annotated Feedback Assistant yang memberikan *targeted feedback embedded within responses via annotation cards*)

**b. Smart Quiz & Soal Generator**
- Generate soal pilihan ganda, esai, dan uraian dari materi yang diunggah
- Soal dapat disesuaikan dengan tingkat kesulitan (Bloom's Taxonomy)
- Dukungan untuk berbagai format: multiple-choice, short-answer, fill-in-the-blank

**c. Proctoring & Anti-Cheating Ringan**
- Deteksi kejanggalan pola jawaban
- Verifikasi identitas bertahap (bukan hanya di ujian)

### 4. Learning Analytics Dashboard

**Untuk Pendidik (Guru/Dosen):**
- Ringkasan penguasaan konsep per siswa/kelas
- Identifikasi siswa yang membutuhkan intervensi
- Analisis sentimen dari interaksi siswa dengan AI
- Laporan otomatis yang bisa diekspor

**Untuk Murid/Mahasiswa:**
- Visualisasi progress belajar per mata pelajaran/mata kuliah
- Perbandingan performa dengan rata-rata kelas (anonim)
- Prediksi nilai berdasarkan performa saat ini

### 5. Collaborative Workspace

- **Shared Project Folder**: Kolaborasi real-time dalam project kelompok
- **Peer Review System**: Siswa/mahasiswa bisa saling mereview tugas dengan bimbingan AI
- **Group Study Room**: Diskusi kelompok dengan AI sebagai fasilitator
- **Version Control** untuk dokumen akademik (skripsi, makalah, dll.)

### 6. Research & Academic Writing Assistant (Khusus Mahasiswa/Dosen)

- **Literatur Review Assistant**: Bantu pencarian dan summarisasi jurnal akademik
- **Citation & Reference Manager**: Format sitasi otomatis (APA, MLA, IEEE, dll.)
- **Plagiarism Checker** terintegrasi
- **Structure & Outline Generator** untuk skripsi/tesis/disertasi
- **Data Analysis Support**: Bantu interpretasi data statistik

### 7. Lesson Planning & Curriculum Designer (Khusus Guru/Dosen)

Seperti Authoring Copilot (ACP) yang mendukung perencanaan pembelajaran dengan menghasilkan modul, bagian, aktivitas, dan komponen berdasarkan input guru:
- Generate RPP (Rencana Pelaksanaan Pembelajaran) otomatis
- Saran aktivitas pembelajaran yang sesuai kurikulum
- Penyesuaian konten untuk diferensiasi pembelajaran
- Align dengan standar kurikulum nasional/internasional

### 8. Multilingual & Accessibility Support

- Dukungan bahasa Indonesia, Inggris, dan bahasa daerah
- Text-to-speech dan speech-to-text untuk siswa dengan kebutuhan khusus
- Mode baca mudah (*simplified text*) untuk siswa berkebutuhan khusus
- Terjemahan konten belajar secara real-time

### 9. Gamification & Engagement Features

- *Badges* dan *achievements* untuk pencapaian belajar
- Leaderboard (per kelas/sekolah/universitas) yang sehat
- *Learning Streaks* dan tantangan harian
- Mode kompetitif antar kelompok belajar

### 10. Career & University Preparation (Khusus SMA/Mahasiswa)

- **University Match Recommender**: Rekomendasi universitas berdasarkan minat dan performa
- **Career Path Simulator**: Simulasi jalur karir berdasarkan mata kuliah yang diambil
- **Portfolio Builder**: Bantu mahasiswa membangun portofolio akademik dan profesional
- **Interview Preparation**: Simulasi wawancara kerja/beasiswa dengan AI

### 11. Offline & Mobile-First Mode

- Sinkronisasi konten untuk diakses offline
- Progressive Web App (PWA) untuk pengalaman seperti aplikasi native
- Notifikasi push untuk pengingat belajar dan deadline


## C. Model AI: Kebijakan Pemilihan & Filter

### C.1. Arsitektur Pemilihan Model

Pengguna dapat memilih model AI yang ingin digunakan (misal: GPT-4, Claude, Gemini, Llama, atau model lokal), namun dengan mekanisme filter sebagai berikut:

```
┌─────────────────────────────────────────────────────────┐
│                   USER REQUEST                          │
└─────────────────────┬───────────────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────────────┐
│         LAYER 1: IDENTITY & ROLE VERIFICATION           │
│  (Murid/Siswa/Mahasiswa/Guru/Dosen - dengan filter      │
│   identitas untuk akses fitur tertentu)                 │
└─────────────────────┬───────────────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────────────┐
│      LAYER 2: MODEL AVAILABILITY POLICY ENGINE          │
│  - Cek daftar model yang diizinkan oleh institusi       │
│  - Sesuaikan model dengan tingkat pengguna              │
│  - Terapkan batasan usage (kuota, waktu, dll.)          │
└─────────────────────┬───────────────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────────────┐
│         LAYER 3: CONTENT SAFETY FILTER (Input)          │
│  - Filter prompt sebelum dikirim ke model eksternal     │
│  - Deteksi konten berbahaya, PII, prompt injection      │
└─────────────────────┬───────────────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────────────┐
│              EXTERNAL AI MODEL                          │
│  (Model pilihan user yang telah lolos filter)           │
└─────────────────────┬───────────────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────────────┐
│         LAYER 4: CONTENT SAFETY FILTER (Output)         │
│  - Filter respons AI sebelum ditampilkan ke user        │
│  - Klasifikasi keamanan konten (Safe/Content Guidance/  │
│    Highly Sensitive/Toxic)                              │
└─────────────────────────────────────────────────────────┘
```

### C.2. Kebijakan Model (Policy Filter)

Setiap institusi (sekolah/universitas) dapat mendefinisikan kebijakan model mereka sendiri melalui *admin dashboard*:

| Parameter Kebijakan | Deskripsi |
|---------------------|-----------|
| **Whitelist Model** | Daftar model AI yang diizinkan (misal: hanya GPT-4 dan Llama) |
| **Blacklist Model** | Model yang dilarang karena alasan keamanan/data privacy |
| **Age-Appropriate Restriction** | Murid SD hanya bisa akses model dengan safety rating tinggi |
| **Usage Quota** | Batas penggunaan per pengguna per hari/minggu |
| **Data Residency** | Model harus memproses data di server dengan yurisdiksi tertentu |
| **Logging & Audit** | Semua interaksi dengan model eksternal harus tercatat |

Institusi perlu memiliki *framework* sendiri untuk mengevaluasi AI tools terhadap nilai-nilai mereka, bukan sekadar mewarisi prioritas vendor.

### C.3. Mekanisme Filter Percakapan (Pre-Send Filtering)

Sebelum percakapan dikirim ke model AI eksternal, terdapat beberapa lapisan filter:

#### a. Dual-LLM Security Architecture

Menggunakan dua model secara berurutan: **LLM-1 sebagai security filter** yang menganalisis query incoming untuk ancaman, dan **LLM-2** yang menghasilkan respons edukasional hanya setelah validasi. Pendekatan ini memisahkan *content moderation* dari *response generation*.

#### b. Prompt-Level Content Filtering

Filter berbasis aturan dan AI untuk mendeteksi:
- **Konten berbahaya**: kekerasan, ujaran kebencian, konten seksual, self-harm
- **Prompt injection**: upaya menyisipkan instruksi berbahaya yang mencoba mengubah perilaku model
- **PII (Personally Identifiable Information)**: nomor identitas, alamat, nomor telepon
- **Topik terlarang** sesuai kebijakan institusi

#### c. Klasifikasi Kontekstual

Seperti yang diterapkan Aila, konten diklasifikasikan ke dalam kategori:
1. **Safe** - Sepenuhnya aman
2. **Content Guidance** - Memerlukan penanganan hati-hati (14 sub-kategori seperti aktivitas praktik berisiko, konten RSHE, dll.)
3. **Highly Sensitive** - Sangat sensitif, memerlukan persetujuan pendidik
4. **Toxic** - Diblokir sepenuhnya

#### d. Human-in-the-Loop untuk Kasus Ambigu

Untuk konten dengan skor keyakinan rendah dari filter otomatis, sistem akan:
1. Menahan pesan untuk review manual
2. Memberi notifikasi ke pendidik/admin
3. Mengizinkan pelepasan setelah persetujuan manual

#### e. System Prompt Engineering

Setiap model diberikan *system prompt* khusus yang membatasi perilaku model agar sesuai dengan konteks pendidikan. Misalnya, model yang sama di dalam platform akan merespons berbeda dibandingkan di luar platform karena adanya instruksi tersembunyi yang mendefinisikan peran, perilaku, dan batasan model.

#### f. Anonymisasi Data

Sebelum dikirim ke model eksternal, semua data yang dapat mengidentifikasi pengguna (nama, ID, dll.) di-anonimisasi.


## D. Ringkasan Arsitektur Keseluruhan

```
┌─────────────────────────────────────────────────────────────────┐
│                    WEB APP AI PENDIDIKAN                        │
├─────────────────────────────────────────────────────────────────┤
│  FRONTEND (Role-Based UI)                                      │
│  ├── Murid/Siswa: Belajar, Latihan, Tutor, Game               │
│  ├── Mahasiswa: Riset, Kolaborasi, Karir, Writing Assistant   │
│  ├── Guru: Planning, Grading, Analytics, Kelas                │
│  └── Dosen: Riset, Publikasi, Analisis Lanjutan               │
├─────────────────────────────────────────────────────────────────┤
│  FITUR INTI                                                    │
│  ├── Chat (dengan persona & konteks)                          │
│  ├── Project Folder (personal & kolaboratif)                  │
│  ├── Subject Agent (per mata pelajaran/kuliah)                │
│  ├── Koreksi Ujian (dengan filter identitas)                  │
│  ├── Adaptive Learning Pathway                                │
│  ├── Intelligent Tutoring System                              │
│  ├── Assessment & Grading Suite                               │
│  ├── Learning Analytics Dashboard                             │
│  ├── Collaborative Workspace                                  │
│  ├── Research & Writing Assistant                             │
│  ├── Lesson Planning & Curriculum Designer                    │
│  ├── Multilingual & Accessibility                             │
│  ├── Gamification                                             │
│  └── Career & University Preparation                          │
├─────────────────────────────────────────────────────────────────┤
│  POLICY & SECURITY LAYER                                       │
│  ├── Identity & Role Verification                             │
│  ├── Model Availability Policy Engine                         │
│  ├── Pre-Send Filter (Dual-LLM, Prompt Filter, PII Redaction) │
│  ├── Post-Send Filter (Output Moderation)                    │
│  ├── Human-in-the-Loop Review                                 │
│  └── Audit Log & Compliance                                   │
├─────────────────────────────────────────────────────────────────┤
│  AI MODEL GATEWAY                                             │
│  ├── Model Registry (terdaftar & lolos policy)               │
│  ├── Load Balancer & Rate Limiter                             │
│  └── Cost & Usage Tracker                                     │
└─────────────────────────────────────────────────────────────────┘
```