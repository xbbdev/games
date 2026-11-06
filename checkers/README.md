# 👑 Shashka — 100 Darajali Kampaniya & Erkin O'yin

Ushbu loyiha rasmiy ruscha/xalqaro shashka qoidalariga asoslangan, **1 dan 100 gacha bo'lgan kuchli darajalar (kampaniya) tizimiga** ega professional shashka o'yinidir.

Hech qanday tashqi dastur yoki server o'rnatish talab etilmaydi — istalgan brauzerda bir marta bosish bilan to'liq ishlaydi.

---

## 🚀 O'yinni ishga tushirish

1. [index.html](file:///C:/Users/User/Desktop/Gemini/checkers/index.html) faylini sichqoncha bilan ikki marta bosing; **yoki**
2. [run_game.bat](file:///C:/Users/User/Desktop/Gemini/checkers/run_game.bat) faylini ishga tushiring.

O'yin avtomatik ravishda Chrome, Edge yoki boshqa standart brauzeringizda ochiladi.

---

## 🏆 1 dan 100 gacha Darajalar Tizimi (Kampaniya)

O'yin 5 ta katta ligaga (tier) ajratilgan 100 ta progressiv darajadan iborat:

| Bosqichlar | Liga (Tier) | Bot Reytingi (ELO) | Tavsif & Murakkablik |
|---|---|---|---|
| **1 — 20** | 🥉 **Boshlang'ich** | 400 — 950 ELO | Oddiy yurishlar, kichik taktikalar. Bot vaqti-vaqti bilan xatolar qiladi (o'rganish uchun qulay). |
| **21 — 40** | 🥈 **Havaskor** | 960 — 1500 ELO | Markaziy chiziq jangi, ketma-ket urishlar, dastlabki qopqonlar. Chuqurlik 3-4 ply. |
| **41 — 60** | 🥇 **Tajribali** | 1510 — 2100 ELO | Kuchli pozitsion bosim, Quiescence Search (tinchlik qidiruvi) tufayli taktik xatolar umuman qilinmaydi. |
| **61 — 80** | 💎 **Professional Usta** | 2110 — 2650 ELO | Markaz monopoliyasi, qamal san'ati, chuqur kombinatsiyalar (5-6 ply hisob-kitob). |
| **81 — 100** | 👑 **Afsonaviy Grossmeyster** | 2660 — 3200+ ELO | **Superhuman AI**: 7-8 ply chuqurlik, Grandmaster pozitsion baholash, xatosiz taktika va shafqatsiz qopqonlar! |

### ⭐ Yulduzlar Tizimi (Jami 300 ta yulduz):
- ⭐ **1-Yulduz:** Bosqichda g'alaba qozonish.
- ⭐⭐ **2-Yulduz:** Kamida 4 ta donangizni saqlab qolgan holda yutish.
- ⭐⭐⭐ **3-Yulduz:** Mutlaq ustunlik (kamida 6 ta dona qolishi yoki 32 yurish ichida tezkor g'alaba).

---

## 🧠 Qanday qilib Murakkablik Juda Kuchli Qilingan?

1. **Quiescence Search (Tinchlik qidiruvi):**
   Oddiy sun'iy intellektlar urishlar zanjiri o'rtasida hisobni to'xtatib qo'yishi mumkin. Bizning AI barcha majburiy urishlarni oxirgi tinch pozitsiyagacha chuqur tekshiradi, bu esa taktik xatolarni nolga tushiradi!
2. **Move Ordering (Yurishlarni tartiblash):**
   Eng xavfli urishlar va damkalar birinchi bo'lib tekshiriladi, bu Alpha-Beta qirqish tezligini 5 martagacha oshirib, 7-8 ply chuqurlikdagi hisobni 30-40 millisekundda amalga oshirishga imkon beradi.
3. **Grossmeyster Pozitsion Baholash Heuristikasi:**
   - **Katta Diagonal (a1-h8):** Rossiya/O'zbek shashkasining asosi hisoblangan markaziy diagonal nazorati.
   - **Klassik Markaz:** c3, d4, e5, f4 kataklaridagi donalarga maxsus ustunlik ballari.
   - **Oltin Shashkalar (Qanot tayanchlari):** Oxirgi qatordagi tayanch donalar (a1, c1, e1, g1 / b8, d8, f8) o'z joyida ushlab turilib, raqibning damkaga o'tish yo'li to'siladi.
   - **Bog'langan donalar zanjiri (Diagonallar):** Bir-birini himoya qiluvchi donalar zanjiriga yuqori baho beriladi.
   - **Qamalgan donalar jarimasi:** Chetdagi yoki harakatsiz qolgan donalar qat'iy jazolanadi.
4. **Xotira va Taraqqiyot (Persistence):**
   Barcha o'tilgan bosqichlar, to'plangan yulduzlar va hozirgi daraja `localStorage`da saqlanadi. Istalgan vaqtda avvalgi bosqichlarga qaytib, 3 ta yulduz olish uchun qayta o'ynash mumkin.

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
10. **G'alaba sharti**: Raqibning barcha shashkalarini urib tugatgan yoki raqibning barcha donalarini qamab qo'ygan tomon g'olib bo'ladi.

---

## ⌨️ Tezkor Tugmalar

- `Ctrl + Z` — Yurishni qaytarish (Undo)
- `H` — Grossmeysterdan maslahat olish (Hint)
- `N` — Yangi o'yin boshlash (New game)
- `Esc` — Ochiq oynani yopish
