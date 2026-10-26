# Piano: apprendimento più efficace e più divertente

Scritto il 25 ottobre 2026 dopo due ragionamenti con l'utente (campanello che suggerisce, livelli che non
cambiano niente, memoria del lavoro vero). Si lavora un passo alla volta: **ogni passo finisce con
`npm run build` pulito, un commit e un push**, e qui si spunta la casella. Se una sessione si interrompe,
si riparte dal primo passo non spuntato.

## Principi (valgono per ogni scelta)

1. Un ordine prova la memoria solo se la risposta **non è sullo schermo**. Quello che si fa con l'aiuto
   è studio e conta come studio.
2. Il gioco punta a circa **85% di ordini giusti**: sopra annoia e non insegna, sotto scoraggia.
3. Le migliorie comprano **comodità e spettacolo, mai risposte**.
4. Salire di livello **cambia il lavoro**, non solo il numero.
5. La ricetta nell'app ha **la stessa struttura che ha al lavoro**: ordine di montaggio, forno e uscita,
   posti fissi sul banco. E l'app si collega ai turni veri.

## Dati da far controllare all'utente (bozze mie)

- Ordine di montaggio di hamburger e focacce (dal basso verso l'alto): bozza in `data.ts`, segnata da
  controllare (`draft`).
- Ingredienti delle pizze che vanno **dopo il forno**: bozza in `data.ts` (`AFTER_OVEN`), da controllare.
- Disposizione del banco: di partenza per ripiani, l'utente la cambia in Impostazioni → La tua postazione.
- Piatti più ordinati: li segna l'utente (editor) e crescono da soli col diario del turno vero.

## Passi

### Passo 1 — Correzioni piccole, effetto grande
- [ ] **Campanello onesto**: suona quando sul piatto c'è il numero giusto di ingredienti, *giusto o
      sbagliato*, con un attimo per ripensarci. Solo dove il numero è visibile.
- [ ] **Copiare non fa salire**: con la ricetta visibile (piatto nuovo) o il flash la risposta è
      "studio": nessuna tacca. Il piatto torna **2 clienti dopo** senza ricetta (primo richiamo vero) e,
      se va bene, **a fine turno**. Tolto l'aiuto "icone" (era copiare dai disegni).
- [ ] **Aiuto = non lo sapevo**: premere Aiuto conta come errore lieve e il piatto torna nel turno.
- [ ] **Massimo 2 piatti nuovi per turno** (3 se se ne conoscono pochissimi); prima i più ordinati.
- [ ] **Messaggio di livello vero** (niente promesse finte).
- [ ] Messaggio una tantum: "memoria più precisa" (le tacche gonfiate possono scendere).

### Passo 2 — Il gioco capisce quanto sai un piatto
- [ ] **Voto della risposta** (Non lo sapevi / Studio / Difficile / Bene / Facile) da: aiuto visibile,
      Aiuto premuto, ingredienti tolti e rimessi, tempo rispetto al proprio solito, grandezza del
      bancone, modalità, ordine di montaggio.
- [ ] **FSRS** (`src/lib/fsrs.ts`, formule FSRS-4.5 con i pesi di default): per piatto stabilità,
      difficoltà, probabilità di ricordarlo adesso. Decide quando un piatto è da ripassare.
      Le tacche (0–5) restano come **fase**: dicono cosa hai dimostrato; FSRS dice quanto è fresco.
- [ ] **Difficoltà automatica verso l'85%**: dentro il turno, se va tutto liscio tolgo un aiuto, se
      va male ne do uno; con un piatto poco fresco (probabilità bassa) un aiuto in più. Si vede
      ("Stai andando forte: tolgo un aiuto").
- [ ] **Fase mostrata subito**: "Diavola → A memoria!" durante il turno, con suono suo.

### Passo 3 — Fasi del piatto = modalità diverse
Fasi (tacche): 0 Nuovo · 1 Riconosci · 2 Ricorda · 3 A memoria · 4 Distingui · 5 Oro.
- [ ] Nuovo: cartolina "Nuovo piatto!" con ingredienti distintivi in evidenza e il perché; ricetta visibile.
- [ ] Riconosci: bancone piccolo, numero visibile.
- [ ] Ricorda: bancone largo, niente numero; a volte **"Cosa manca?"** (o "cosa c'è tra X e Y" nei panini).
- [ ] A memoria: dispensa intera (soglia spostata da 4 a 3: col campanello onesto il numero nascosto non
      è più legato alla dispensa).
- [ ] Distingui: arriva **in coppia col piatto simile** (Esagerato/Esagerato Pollo, le due Italiana…).
- [ ] Oro: compare di rado; in vetrina **si impolvera** quando è da ripassare.
- [ ] **Base rossa** (pomodoro + fior di latte) come pezzo unico: tessera sul bancone delle pizze e
      gruppo nelle ricette mostrate.

### Passo 4 — La ricetta come al lavoro
- [ ] **Montaggio in ordine** (hamburger e focacce): si serve **chiudendo il panino**; ordine giusto =
      bonus "Montato come al banco!" e risposta più forte; ordine sbagliato non è errore, solo una nota.
- [ ] **Pizza in due tempi**: prepari → **Inforna** → aggiungi quello che va all'uscita → Servi.
      Un ingrediente nel tempo sbagliato è errore di procedura (lieve, non fa perdere vite).
- [ ] **La tua postazione**: ogni ingrediente sempre nello stesso posto del banco (niente rimescolamento);
      disposizione modificabile in Impostazioni. **Mise en place** diventa "banco in ordine"
      (ricerca su ogni bancone, etichette dei ripiani), non toglie più ingredienti sbagliati.
- [ ] **Friggitoria**: si contano i pezzi mettendoli nel cestino uno alla volta.
- [ ] Sfida scritta: per i panini gli spazi mostrano la posizione (dal basso).

### Passo 5 — Livelli con un senso e ricompense legate all'imparare
- [ ] **Sblocchi per livello** (solo con piatti nella fase giusta): Lv2 Tavolo da due · Lv3 Varianti
      ("Diavola senza olive") · Lv4 Asporto al telefono (la comanda sparisce) · Lv5 Controllo qualità
      (trova l'errore di Giuseppe) · Lv6 Sabato sera (turno lungo, tutto mischiato).
- [ ] Ogni livello: forziere + messaggio con lo sblocco vero.
- [ ] **Titolo legato ai piatti saputi** (fase ≥ 3), non all'XP.
- [ ] **Momenti-trofeo**: primo piatto a memoria, piatto d'oro (cerimonia), piatto recuperato.
- [ ] **Puntata "Sicuro!"**: ×2 se giusto, si perde di più se sbagliato; calibrazione nelle Statistiche.
- [ ] **"Quasi! 4 su 5"** quando si sbaglia di poco.
- [ ] **Missioni sulla memoria**: porta piatti alla fase dopo, rinfresca piatti impolverati, riscatta
      un piatto sbagliato ieri, monta panini come al banco.

### Passo 6 — Collegare l'app ai turni veri
- [ ] **"Stasera ho fatto…"**: diario dei piatti fatti al lavoro; il giorno dopo il gioco li chiede.
- [ ] **"Prima del turno"**: riscaldamento sui più ordinati e su quelli da ripassare.
- [ ] **La tua foto** del piatto (IndexedDB) nel Ricettario e negli errori.
- [ ] **Il perché**: una riga per ricetta scritta dall'utente, mostrata quando serve.
- [ ] Editor ricette: ordine (su/giù), dopo il forno, si ordina spesso, perché, foto.

### Passo 7 — Ricettario e gesti
- [ ] **"Immagina di montarlo"**: il film mentale guidato, uno strato alla volta.
- [ ] **Gesti facoltativi** (impostazione, spenta di partenza): spalmare la salsa con un giro del dito,
      spolverare il grana. Mai obbligatori.

### Alla fine
- [ ] Prova nel browser (Playwright) dei flussi principali; aggiornare README e CLAUDE.md.

## Note per chi riprende
- Branch di lavoro della sessione cloud: `ccr-cc268492-2dm3k4` (CLAUDE.md dice `main`: unire a fine lavoro).
- Il salvataggio resta `v: 1`; i campi nuovi sono facoltativi e la migrazione è in `store.tsx`
  (`MENU_VERSION` per le ricette).
