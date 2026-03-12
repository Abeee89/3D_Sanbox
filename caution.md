# Plan: 3D Physics Sandbox - React.js Migration

## TL;DR
Migrasi aplikasi 3D Hand Physics Sandbox dari vanilla HTML/JS ke React.js. Aplikasi ini menggunakan Three.js untuk rendering 3D, Cannon.js untuk simulasi fisika, dan MediaPipe Hands untuk hand tracking via webcam. Pendekatan: modular component architecture dengan custom hooks untuk integrasi library 3D.

## Struktur Proyek

```
mediapipe-sandbox/
├── public/
├── src/
│   ├── components/
│   │   ├── Canvas3D.jsx           # Container Three.js renderer
│   │   ├── WebcamPreview.jsx      # Preview webcam + hand landmarks
│   │   ├── ControlPanel.jsx       # Panel shape selector & reset
│   │   ├── InstructionsPanel.jsx  # Panel instruksi gestur
│   │   ├── LoadingScreen.jsx      # Loading screen
│   │   └── StatsDisplay.jsx       # FPS counter
│   ├── hooks/
│   │   ├── useThreeScene.js       # Setup Three.js (scene, camera, renderer)
│   │   ├── usePhysicsWorld.js     # Setup Cannon.js world
│   │   ├── useHandTracking.js     # MediaPipe Hands integration
│   │   └── useGameLoop.js         # Animation loop dengan physics update
│   ├── utils/
│   │   ├── objectFactory.js       # Spawn logic (box, sphere, cylinder)
│   │   └── gestureHandler.js      # Gesture detection (pinch, open hands)
│   ├── styles/
│   │   └── App.css                # Styling (dark theme)
│   ├── App.jsx                    # Root component
│   └── main.jsx                   # Entry point
├── package.json
└── vite.config.js
```

## Steps

### Phase 1: Project Setup
1. Inisialisasi proyek React dengan Vite (`npm create vite@latest mediapipe-sandbox -- --template react`)
2. Install dependencies:
   - `three` - 3D rendering
   - `cannon-es` - Physics engine (ES module version of Cannon.js)
   - `@mediapipe/hands` - Hand tracking
   - `@mediapipe/camera_utils` - Webcam utilities
   - `@mediapipe/drawing_utils` - Drawing hand landmarks
3. Setup struktur folder sesuai arsitektur di atas

### Phase 2: Core Hooks Implementation
4. Buat `useThreeScene.js` - mengelola Three.js scene, camera, renderer, lights, ground plane, dan grid helper. Return refs dan cleanup function. (*parallel dengan step 5*)
5. Buat `usePhysicsWorld.js` - setup Cannon.js world dengan gravity, broadphase, ground body. Return world ref dan step function. (*parallel dengan step 4*)
6. Buat `useHandTracking.js` - inisialisasi MediaPipe Hands, camera stream, dan callback untuk landmarks. Return hand positions dan gesture state.
7. Buat `useGameLoop.js` - menggabungkan physics step dan render loop menggunakan `requestAnimationFrame`. Sync physics bodies dengan Three.js meshes.

### Phase 3: Utility Functions
8. Buat `objectFactory.js` - fungsi untuk membuat physics body + mesh (box, sphere, cylinder) dengan parameter posisi dan warna random. (*parallel dengan step 9*)
9. Buat `gestureHandler.js` - fungsi untuk mendeteksi gestur (pinch, two-hands-open) dari MediaPipe landmarks. (*parallel dengan step 8*)

### Phase 4: Components Implementation
10. Buat `Canvas3D.jsx` - render Three.js canvas, menggunakan hooks dari Phase 2. Handle resize events.
11. Buat `WebcamPreview.jsx` - menampilkan preview webcam dengan overlay hand landmarks (mirrored).
12. Buat `ControlPanel.jsx` - tombol shape selector (Kubus/Bola/Silinder) dan Reset Scene. (*parallel dengan step 13, 14*)
13. Buat `InstructionsPanel.jsx` - panel instruksi gestur statis. (*parallel dengan step 12, 14*)
14. Buat `StatsDisplay.jsx` - tampilkan FPS realtime. (*parallel dengan step 12, 14*)
15. Buat `LoadingScreen.jsx` - loading overlay dengan spinner.

### Phase 5: State Management & Integration
16. Implementasi state di `App.jsx`:
    - `activeShape` (box/sphere/cylinder)
    - `objects` (array of {mesh, body})
    - `isLoading`
    - `grabbedObject`
17. Wire up semua komponen di `App.jsx` - pass props dan callbacks untuk shape selection, reset, spawn, grab/release.
18. Implementasi logika interaksi:
    - Two-hands-open → spawn object
    - Pinch → grab nearest object
    - Release pinch → release object

### Phase 6: Styling & Polish
19. Port CSS dari main.html ke App.css (dark theme, glassmorphism panels)
20. Responsive layout testing

### Phase 7: Testing & Optimization
21. Test hand tracking dengan webcam
22. Optimize performance (limit max objects, cleanup off-screen objects)
23. Final integration testing

## Relevant Files
- [main.html](main.html) — source code yang akan di-port, berisi semua logika Three.js, Cannon.js, dan MediaPipe

## Verification
1. Jalankan `npm run dev` dan pastikan aplikasi berjalan tanpa error di console
2. Verifikasi webcam preview muncul dengan hand landmark overlay
3. Test spawn object dengan gestur dua tangan terbuka
4. Test grab object dengan gestur cubit
5. Test reset scene button
6. Verifikasi physics simulation (objek jatuh, collision dengan ground)
7. Verifikasi FPS counter terupdate realtime

## Decisions
- **Vite vs Create React App**: Menggunakan Vite untuk build tool yang lebih cepat
- **cannon-es vs cannon.js**: Menggunakan cannon-es (ESM version) untuk kompatibilitas module modern
- **State Management**: Menggunakan React state biasa (useState/useRef), tidak perlu Redux karena scope aplikasi terbatas
- **Component Library**: Tidak menggunakan UI library, styling manual untuk mempertahankan tampilan original

## Further Considerations
1. **TypeScript**: Apakah ingin menggunakan TypeScript untuk type safety? Rekomendasi: Ya untuk proyek production, opsional untuk pembelajaran.
2. **React Three Fiber**: Alternatif menggunakan `@react-three/fiber` untuk integrasi Three.js yang lebih "React-way". Trade-off: lebih idiomatic tapi kurva belajar lebih tinggi.
3. **Deployment**: Perlu setup deployment (Vercel/Netlify)? HTTPS required untuk akses webcam.
