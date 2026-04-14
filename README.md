# Azure Neural Lipsync Avatar

Aplikasi avatar 3D interaktif berbasis web yang menggunakan **Azure Cognitive Services Speech SDK** untuk Text-to-Speech (TTS) dengan animasi lipsync real-time. 

## Deskripsi

Aplikasi ini mengintegrasikan:

- **Azure TTS** — sintesis suara menggunakan voice `en-US-GuyNeural`
- **Viseme streaming** — Azure mengembalikan data viseme (ID 0–21) yang disinkronkan dengan audio
- **3D Avatar (Ready Player Me)** — avatar dirender menggunakan React Three Fiber dengan morph targets untuk animasi mulut
- **VAS Evaluation** — alat evaluasi otomatis untuk mengukur akurasi lipsync menggunakan metrik **Viseme Accuracy Score (VAS)**

## Arsitektur

```text
Browser (React + R3F)          Express Server (Node.js)
┌─────────────────────┐        ┌────────────────────────────┐
│  TypingBox (input)  │──────▶│  /api/tts                  │
│  Avatar (3D render) │◀──────│  Azure Speech SDK           │
│  VASEvaluation      │       │  - Visemes (header)         │
│  useLipsyncStore    │       │  - Word Boundaries (header) │
└─────────────────────┘       │  - Audio WAV (body)         │
                               └────────────────────────────┘
```

### Alur Data

1. User memasukkan teks di `TypingBox`
2. Request dikirim ke Express server (`localhost:3002/api/tts`)
3. Server memanggil Azure Speech SDK dengan SSML (termasuk `<bookmark>` per kata)
4. Azure mengembalikan:
   - **Audio WAV** — disimpan dalam response body
   - **Visemes** — array `[timeMs, visemeId]` dikirim via response header
   - **Word Boundaries** — timestamp per kata via response header
5. Browser memutar audio dan menganimasikan morph targets avatar secara real-time berdasarkan timestamp viseme

## Struktur Proyek

```text
azure/
├── server/
│   └── tts.js              # Express server — Azure TTS endpoint
├── src/
│   ├── App.jsx             # Root component, routing antar halaman
│   ├── components/
│   │   ├── Avatar.jsx      # 3D avatar dengan animasi viseme
│   │   ├── Experience.jsx  # Scene R3F (environment + avatar)
│   │   ├── TypingBox.jsx   # Input teks + kontrol audio
│   │   └── VASEvaluationAzure.jsx  # Halaman evaluasi VAS
│   ├── store/
│   │   └── useLipsyncStore.js  # Zustand store — state management TTS
│   └── data/
│       └── azurePhonemeVisemeMap.js  # Mapping fonem → viseme ID (ground truth)
├── public/
│   ├── models/             # File GLTF avatar Ready Player Me
│   └── textures/           # Tekstur background scene
├── .env.local              # Konfigurasi API key (tidak di-commit)
├── vite.config.js
└── package.json
```

## Prasyarat

- **Node.js** v18 atau lebih baru
- **Akun Azure** dengan layanan **Azure Cognitive Services Speech** aktif
- Azure Speech API Key dan Region

## Instalasi

```bash
# Clone repository
git clone <repo-url>
cd azure

# Install dependencies
npm install
# atau
yarn install
```

## Konfigurasi

Buat file `.env.local` di root proyek:

```env
AZURE_SPEECH_KEY=your_azure_speech_api_key_here
AZURE_SPEECH_REGION=your_azure_region_here
```

Contoh region: `southeastasia`, `eastus`, `westeurope`

## Menjalankan Aplikasi

```bash
# Jalankan client (Vite) dan server (Express) secara bersamaan
npm run dev

# Atau jalankan terpisah
npm run dev:client   # Vite dev server — http://localhost:5173
npm run dev:server   # Express TTS server — http://localhost:3002
```

Buka browser di `http://localhost:5173`

## Build untuk Produksi

```bash
npm run build
npm run preview
```

## Cara Penggunaan

### Halaman Avatar (Utama)

1. Ketik teks di input box di bagian bawah layar
2. Tekan **Enter** atau klik tombol **Send**
3. Avatar akan berbicara dengan animasi lipsync sinkron
4. Klik **Stop** untuk menghentikan audio
5. Klik **Download All** untuk mengunduh bundel JSON berisi:

   - Data audio (WAV dalam base64)
   - Data viseme lengkap dengan detail fonem
   - Metrik performa (TTP, RTF)

### Halaman VAS Evaluation

Klik tombol **VAS Evaluation** di pojok kanan atas untuk membuka halaman evaluasi.

1. Masukkan teks script (atau klik **Load from Last Generate**)
2. Klik **Analyze VAS**
3. Sistem akan menghitung skor VAS berdasarkan perbandingan:
   - **Expected viseme** — dari tabel fonem ground truth (`azurePhonemeVisemeMap`)
   - **Detected viseme** — dari data viseme yang dikembalikan Azure, di-slice per kata menggunakan word boundary

**Formula VAS:**

```text
VAS = (Jumlah Viseme Benar / Total Viseme yang Dapat Dievaluasi) × 100%
```

Interpretasi skor:

- **≥ 80%** — Baik (hijau)
- **60–79%** — Cukup (kuning)
- **< 60%** — Kurang (merah)

## Metrik Performa

Setiap sesi TTS mengukur dan mencatat:

| Metrik  | Deskripsi                                                                     |
| ------- | ----------------------------------------------------------------------------- |
| **TTP** | Time to Produce — waktu dari request dikirim hingga audio diterima (ms)       |
| **LEN** | Durasi audio berdasarkan timestamp viseme terakhir (ms)                       |
| **RTF** | Real-Time Factor — `TTP / LEN`, nilai < 1 berarti lebih cepat dari real-time |

Log metrik ditampilkan di browser console:

```text
[RTF] TTP: 842.30 ms | LEN: 3200.00 ms | RTF: 0.2632
```

## Mapping Viseme Azure

Azure Speech SDK menggunakan 22 viseme ID (0–21):

| ID  | Contoh Fonem     | Contoh Kata     |
| --- | ---------------- | --------------- |
| 0   | Silence          | —               |
| 1   | ae, schwa, uh    | bat, about, but |
| 2   | ah               | father          |
| 4   | eh, oo (short)   | bed, book       |
| 6   | y, ee, ih        | yes, see, bit   |
| 15  | s, z             | sit, zoo        |
| 21  | p, b, m          | pat, bat, mat   |
| ... | ...              | ...             |

Referensi lengkap: [Azure Viseme Documentation](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/how-to-speech-synthesis-viseme)

## Teknologi yang Digunakan

| Teknologi                        | Kegunaan                              |
| -------------------------------- | ------------------------------------- |
| React 19                         | UI framework                          |
| React Three Fiber + Three.js     | Rendering 3D avatar                   |
| @react-three/drei                | Helper 3D (Environment, useGLTF, dll) |
| Zustand                          | State management                      |
| Azure Cognitive Services Speech  | TTS + viseme generation               |
| Express.js                       | Backend server proxy ke Azure         |
| Tailwind CSS v4                  | Styling                               |
| Vite                             | Build tool & dev server               |

## Catatan Pengembangan

- Avatar menggunakan model **Ready Player Me** format GLTF dengan morph targets standar (`viseme_PP`, `viseme_FF`, dll)
- Animasi viseme menggunakan `THREE.MathUtils.lerp` untuk transisi yang halus antar morph target

