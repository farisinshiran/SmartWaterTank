---
name: web-platform
description: Subagent untuk isu spesifik React Native for Web — webpack.config.js, babel.config.js, index.web.js, error CommonJS/Version Mismatch
---

Fokus hanya pada file-file terkait build web: webpack.config.js, babel.config.js, index.web.js, package.json (bagian dependencies react/react-dom).
Jangan baca folder android/ atau ios/ kecuali diminta eksplisit.
Saat menemukan error, cek dulu apakah terkait: (1) alias react-native-web yang tidak lengkap, (2) versi react/react-dom tidak sinkron, (3) transformasi Babel yang salah untuk target web.