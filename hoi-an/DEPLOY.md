# Phố Hội Đèn Lồng (/hoian) — PREVIEW ONLY, not deployed

Build:   sh hoi-an/build.sh   -> index.html (live /api) + preview.html (mock data)
Shots:   cd hoi-an && OUT=shots SHOTS=overview,room3,lobby,roof node shot.js
Video:   cd hoi-an && node video.js <out.mp4>   (frames kept in concepts/love-hotel/preview/frames)

Deploy later (after CEO approval):
1. cp hoi-an/index.html cf/public/hoian-v2.html (asset name versioned to bust edge cache; worker maps /hoian to it)
2. cp hoi-an/deploy/worker.js cf/worker.js   (only diff: adds /hoian -> /hoian.html route; Hồ Gươm stays default "/")
3. Optional: add a "🏮 Phố Hội" button to cf/public/index.html, space.html, candy.html next to #btn-theme2
4. bash cf/deploy.sh
5. Check /hoian after login, and that / still serves Hồ Gươm.
