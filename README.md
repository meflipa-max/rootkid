# 🕶️ ROOTKID — Da script kiddie a white hat

Un gioco **educativo** che insegna l'**ethical hacking** attraverso una carriera: parti dalla tua cameretta come "script kiddie" e, missione dopo missione, diventi un professionista della cybersecurity assunto da aziende sempre più prestigiose — fino a diventare Chief Security Officer di un'agenzia spaziale. 🚀

> Tutto avviene in **laboratori simulati**. Nessun sistema reale è coinvolto. Il gioco insegna esplicitamente l'etica del white hat: usare queste abilità **solo con autorizzazione, solo per proteggere**.

![tech](https://img.shields.io/badge/React-18-61dafb) ![tech](https://img.shields.io/badge/TypeScript-5-3178c6) ![tech](https://img.shields.io/badge/Vite-5-646cff) ![db](https://img.shields.io/badge/backend-nessuno-3dff8f) ![save](https://img.shields.io/badge/salvataggio-localStorage-yellow)

---

## 🎮 Cosa si fa

Un **loop di gioco pensato per durare** decine di sessioni, con contenuti sia scritti a mano sia **generati proceduralmente** (così le sfide non finiscono mai):

- **Carriera a 10 aziende** — Freelance → PizzaByte → Liceo Turing → ShopFast → BancaDigitale → NimbusCloud → MedLife → GovCERT → Nebula → ORBIT. Ognuna con missioni storia, contatti e requisiti (livello, reputazione, certificazioni).
- **12 tipi di mini-sfida**, ognuna insegna un concetto reale:
  | Sfida | Cosa impari |
  |---|---|
  | 🖥️ **Terminale** | comandi Linux veri (`ls`, `cat`, `grep`, `find`, `nmap`, `ssh`), file nascosti, permessi, movimento laterale |
  | 🔐 **Cifrari** | Base64, Cesare, ROT13, XOR, Vigenère, hex, Morse, Atbash |
  | 🔢 **Binario/ASCII** | conversioni binario ↔ decimale ↔ carattere |
  | 🔑 **Password** | robustezza delle password e attacchi a dizionario sugli hash |
  | 🔍 **Code Review** | trova la vulnerabilità nel codice (SQLi, XSS, hardcoded secret, command injection…) |
  | 🌐 **Web Lab** | sfrutta e poi **correggi** SQLi, XSS, IDOR, Path Traversal |
  | 🎣 **Phishing** | riconosci email truffa da quelle legittime e individua l'indizio |
  | 📄 **Log Analysis** | brute force, C2, injection nei log; ricostruisci la timeline di un incidente |
  | 📡 **Reti** | porte/servizi, scansioni nmap, subnetting, modello OSI |
  | ❓ **Quiz** | 90+ domande su 7 aree della sicurezza |
  | ⚖️ **Etica** | dilemmi morali reali del mestiere (con conseguenze sul punteggio etica) |
  | 🎯 **Packet Defense** | mini-gioco arcade: blocca i pacchetti malevoli in tempo reale |
- **Progressione RPG** — livelli, XP, crediti, reputazione, un punteggio **etica**, albero delle 7 abilità.
- **Accademia** (corsi teorici), **Arsenale** (strumenti come nmap, Burp, hashcat, Wireshark… che sbloccano missioni e vantaggi), **Certificazioni** (esami ispirati a Security+, OSCP, GCFA…).
- **Rigiocabilità**: sfida **giornaliera** deterministica con streak 🔥, **bug bounty** procedurali infiniti, **dojo** di allenamento libero, **21 obiettivi** e un **glossario** di 60+ termini da collezionare.

Tutto **single-player**, **senza database**: i progressi vivono nel `localStorage` del browser.

---

## 🚀 Avvio locale

```bash
npm install
npm run dev
```

Poi apri l'indirizzo che stampa Vite (di default `http://localhost:5173`).

Per la build di produzione:

```bash
npm run build
npm run preview
```

---

## ▲ Deploy su Vercel

Il progetto è pronto per Vercel senza configurazione:

1. Vai su [vercel.com/new](https://vercel.com/new) e importa questo repository da GitHub.
2. Vercel rileva automaticamente il preset **Vite**:
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Clicca **Deploy**. Fatto. 🎉

(È incluso un `vercel.json` con il rewrite SPA, ma il gioco è comunque una singola pagina.)

---

## 🧱 Struttura

```
src/
  game/            # logica pura, nessuna dipendenza da React
    content/       # domande, cifrari, phishing, log, code review, aziende, corsi...
    generators/    # generazione procedurale delle sfide
    terminal/      # filesystem virtuale + emulatore di shell
    engine.ts      # stato, livelli, salvataggio, ricompense, obiettivi
    rng.ts         # RNG con seed (sfide giornaliere deterministiche)
    types.ts
  ui/
    challenges/    # un componente per ogni tipo di sfida
    screens/       # dashboard, carriera, accademia, negozio, posta, profilo...
    useGame.ts     # hook di stato + persistenza
  App.tsx
  main.tsx
```

---

## 📚 Nota didattica

ROOTKID è pensato per un ragazzo curioso che vuole capire la sicurezza informatica. Ogni sfida termina con una spiegazione ("Cosa hai imparato") e i concetti sono quelli veri del mestiere. Il messaggio di fondo, ripetuto in tutto il gioco, è che **la differenza tra un white hat e un criminale non è la tecnica, ma l'autorizzazione e l'intenzione di proteggere**.

Buon hacking (etico)! 🧑‍💻
