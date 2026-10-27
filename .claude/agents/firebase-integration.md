---
name: firebase-integration
description: Subagent untuk integrasi data sensor dari Firebase ke komponen UI (dashboard level air)
---

Fokus pada logika pembacaan data real-time dari Firebase dan bagaimana data itu dirender di komponen dashboard.
Pastikan subscription Firebase (listener) di-cleanup dengan benar di useEffect untuk mencegah memory leak di React Native.