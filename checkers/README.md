# 👑 Shashka (O'zbekcha / Ruscha Qoidalar)

Ushbu loyiha to'liq rasmiy shashka qoidalariga asoslangan zamonaviy, chiroyli va qulay veb-o'yindir. Hech qanday qo'shimcha dastur o'rnatish talab etilmaydi — istalgan brauzerda bir marta bosish bilan ishlaydi.

---

## 🚀 O'yinni ishga tushirish

1. `index.html` faylini sichqoncha bilan ikki marta bosing (yoki `run_game.bat` faylini ishga tushiring).
2. O'yin avtomatik ravishda standart brauzeringizda (Chrome, Edge, Firefox, Opera va h.k.) ochiladi.

---

## ✨ Imkoniyatlar va Xususiyatlar

- 🤖 **Sun'iy intellekt (Bot) ga qarshi o'ynash**:
  - **Oson (Boshlovchi)** — erkin va sodda yurishlar.
  - **O'rtacha (Havaskor)** — pozitsion baholash bilan o'ynaydi.
  - **Qiyin (Usta)** — Minimax va Alpha-Beta qirqish algoritmlari bilan chuqur hisoblaydi.
- 👥 **2 O'yinchi (Do'st bilan bir kompyuterda o'ynash)** rejimi.
- 🎨 **3 xil dizayn mavzusi**:
  - *Yog'och (Klassik)* — sayqallangan yog'och taxta va realistik shashkalar.
  - *Qorong'u (Dark Luxury)* — qora va tillarang zamonaviy dizayn.
  - *Zamonaviy (Emerald)* — toza va sokin zumrad rangli dizayn.
- 💡 **Sun'iy intellektdan maslahat (Hint)** — istalgan vaziyatda eng to'g'ri yurishni ko'rsatib beradi (`H` tugmasi).
- ↩️ **Yurishni qaytarish (Undo)** — xato yurishni ortga qaytarish (`Ctrl+Z`).
- 🔊 **O'rnatilgan realistik ovozlar** — Web Audio API orqali donalar urilishi, siljishi, damka bo'lishi va g'alaba fanfari (internet talab qilmaydi).
- 📜 **Yurishlar tarixi** — rasmiy shashka notatsiyasida barcha yurishlar qayd etib boriladi (masalan: `c3-d4`, `d4:f6:h8`).
- 🔃 **Doskani burish** — oqlar yoki qoralar tomonidan qarash.
- 📱 **Moslashuvchan (Responsive)** — kompyuter, noutbuk, planshet va smartfonlarda to'liq moslashadi.

---

## 📜 Shashka O'yini Qoidalari

1. **Doska va donalar**: 8x8 doskada faqat to'q (qora) kataklarda o'ynaladi. Har bir o'yinchida 12 tadan shashka bo'ladi. Har doim birinchi bo'lib Oqlar yuradi.
2. **Oddiy dona yurishi**: Oddiy shashka diagonal (qiya) bo'ylab faqat oldinga 1 katak suriladi.
3. **Oddiy dona urishi**: Raqib shashkasi ustidan sakrab bo'sh katakka o'tadi. Urish **OLDINGA ham, ORQAGA ham** ruxsat etiladi!
4. **Urish majburiy (Majburiy urish)**: Agar doskada birorta donada urish imkoni bo'lsa, o'yinchi boshqa oddiy yurish qila olmaydi — **urish shart**!
5. **Ketma-ket urish (Multi-jump)**: Dona raqib shashkasini urib tushgan joyidan yana boshqa donani ura olsa, o'sha yurishning o'zidayoq sakrashni oxirigacha davom ettiradi.
6. **Damkaga (Qirolichaga) aylanish**: Shashka raqib tomonidagi oxirgi qatorga yetib borsa, u Damkaga aylanadi (ustida oltin toj 👑 paydo bo'ladi).
7. **Urish jarayonida Damka bo'lish**: Agar oddiy shashka ketma-ket urish vaqtida oxirgi qatorga borsa va u yerdan yangi damka sifatida yana urish imkoni bo'lsa, u **darhol damkaga aylanadi** va shu yurishning o'zida damka sifatida urishni davom ettiradi!
8. **Uchadigan Damka**: Damka butun diagonal bo'ylab istalgan bo'sh katakka ucha oladi. Shuningdek, uzoqdagi raqib donasini sakrab urib, undan keyingi istalgan bo'sh katakka qo'nishi mumkin.
9. **Turkcha zarba qoidasi**: Urilgan barcha donalar butun ko'p martalik urish tugagachgina doskadan olinadi. Bitta yurish davomida bir xil dona ustidan ikki marta sakrab o'tish taqiqlanadi.
10. **G'alaba sharti**: Raqibning barcha shashkalarini urib tugatgan yoki raqibning barcha donalarini qamab (yurish imkoni qoldirmay) qo'ygan tomon g'olib bo'ladi.

---

## ⌨️ Tezkor Tugmalar

- `Ctrl + Z` — Yurishni qaytarish (Undo)
- `H` — Maslahat olish (Hint)
- `N` — Yangi o'yin boshlash (New game)
- `Esc` — Ochiq oynani (modal) yopish
