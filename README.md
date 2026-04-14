# Rhubarb Lipsync — 3D Avatar Lip Sync

Aplikasi web 3D yang menampilkan avatar berbicara secara real-time dengan animasi bibir yang disinkronkan menggunakan **Rhubarb Lip Sync**, **Azure TTS**, dan model avatar **ReadyPlayerMe**.

---

## Fitur

- **3D Avatar Real-time** — Avatar 3D berbasis ReadyPlayerMe dengan animasi viseme yang halus menggunakan lerp.
- **Lip Sync Otomatis** — Teks dikonversi ke audio (Azure TTS) lalu dianalisis oleh Rhubarb untuk menghasilkan data viseme.
- **Metrik RTF** — Menampilkan Time-to-Play (TTP), durasi audio, dan Real-Time Factor (RTF) setelah setiap generasi.
- **Download Output** — Unduh bundle JSON berisi data audio dan viseme (format Rhubarb).
- **VAS Evaluation** — Halaman evaluasi untuk mengukur akurasi pemetaan fonem ke viseme menggunakan skor VAS (Viseme Accuracy Score).

---

## Teknologi

| Komponen       | Teknologi                          |
| -------------- | ---------------------------------- |
| Frontend       | React, Vite, Tailwind CSS          |
| 3D Rendering   | Three.js, React Three Fiber, Drei  |
| Avatar         | ReadyPlayerMe (format GLB)         |
| TTS            | Azure Cognitive Services Speech    |
| Lip Sync       | Rhubarb Lip Sync 1.14.0            |
| State Management | Zustand                          |

---

## Cara Kerja

1. User mengetik teks di kotak input.
2. Backend `/api/rhubarb` memanggil Azure TTS untuk generate audio WAV.
3. Audio WAV diproses oleh `rhubarb.exe` untuk menghasilkan data mouth cues (viseme timing).
4. Frontend memainkan audio dan menganimasikan morph target avatar sesuai timing viseme.
5. Viseme Rhubarb (A–X) dipetakan ke morph target ReadyPlayerMe (`viseme_PP`, `viseme_aa`, dll.).

---

## Mapping Viseme

| Rhubarb | Fonem      | ReadyPlayerMe  |
| ------- | ---------- | -------------- |
| A       | M, B, P    | `viseme_PP`    |
| B       | Consonants | `viseme_kk`    |
| C       | E, EH      | `viseme_E`     |
| D       | A, I, AI   | `viseme_aa`    |
| E       | O          | `viseme_O`     |
| F       | U, OO      | `viseme_U`     |
| G       | F, V       | `viseme_FF`    |
| H       | L          | `viseme_nn`    |
| X       | REST       | `viseme_sil`   |

---

## Instalasi

```bash
npm install
npm run dev
```

Pastikan backend `/api/rhubarb` tersedia dan `rhubarb.exe` ada di direktori `Rhubarb-Lip-Sync-1.14.0-Windows/`.

---

## Evaluasi VAS

Halaman **VAS Evaluation** membandingkan viseme yang dihasilkan Rhubarb dengan ekspektasi fonem dari skrip teks.

**Formula:**

```text
VAS = (Jumlah Viseme yang Benar / Total Viseme) × 100
```

- Skor >= 80% — Hijau (akurasi tinggi)
- Skor 60–79% — Kuning (cukup)
- Skor < 60%  — Merah (perlu perbaikan)

---

## Struktur Proyek

```
src/
├── App.jsx                     # Root app, routing antara avatar & evaluasi
├── components/
│   ├── Avatar.jsx              # Komponen 3D avatar dengan animasi viseme
│   ├── Experience.jsx          # Scene Three.js (avatar + background)
│   ├── TypingBox.jsx           # Input teks, tombol generate/stop, metrik RTF
│   └── VASEvaluation.jsx       # Halaman evaluasi akurasi lip sync
├── store/
│   └── useLipsyncStore.js      # Zustand store: speak, stop, download
└── data/
    └── phonemeVisemeMap.js     # Peta fonem -> viseme untuk evaluasi VAS
```



