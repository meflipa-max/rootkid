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
- [x] **Campanello onesto**: suona quando sul piatto c'è il numero giusto di ingredienti, *giusto o
      sbagliato*, con un attimo per ripensarci. Solo dove il numero è visibile.
- [x] **Copiare non fa salire**: con la ricetta visibile (piatto nuovo) o il flash la risposta è
      "studio": nessuna tacca. Il piatto torna **2 clienti dopo** senza ricetta (primo richiamo vero) e,
      se va bene, **a fine turno**. Tolto l'aiuto "icone" (era copiare dai disegni).
- [x] **Aiuto = non lo sapevo**: premere Aiuto conta come errore lieve e il piatto torna nel turno.
- [x] **Massimo 2 piatti nuovi per turno** (3 se se ne conoscono pochissimi); prima i più ordinati.
- [x] **Messaggio di livello vero** (niente promesse finte).
- [x] Messaggio una tantum: "memoria più precisa" (le tacche gonfiate possono scendere).

### Passo 2 — Il gioco capisce quanto sai un piatto
- [x] **Voto della risposta** (Non lo sapevi / Studio / Difficile / Bene / Facile) da: aiuto visibile,
      Aiuto premuto, ingredienti tolti e rimessi, tempo rispetto al proprio solito, grandezza del
      bancone, modalità, ordine di montaggio.
- [x] **FSRS** (`src/lib/fsrs.ts`, formule FSRS-4.5 con i pesi di default): per piatto stabilità,
      difficoltà, probabilità di ricordarlo adesso. Decide quando un piatto è da ripassare.
      Le tacche (0–5) restano come **fase**: dicono cosa hai dimostrato; FSRS dice quanto è fresco.
- [x] **Difficoltà automatica verso l'85%**: dentro il turno, se va tutto liscio tolgo un aiuto, se
      va male ne do uno; con un piatto poco fresco (probabilità bassa) un aiuto in più. Si vede
      ("Stai andando forte: tolgo un aiuto").
- [x] **Fase mostrata subito**: "Diavola → A memoria!" durante il turno, con suono suo.

### Passo 3 — Fasi del piatto = modalità diverse
Fasi (tacche): 0 Nuovo · 1 Riconosci · 2 Ricorda · 3 A memoria · 4 Distingui · 5 Oro.
- [x] Nuovo: cartolina "Nuovo piatto!" con ingredienti distintivi in evidenza e il perché; ricetta visibile.
- [x] Riconosci: bancone piccolo, numero visibile.
- [x] Ricorda: bancone largo, niente numero; a volte **"Cosa manca?"** (o "cosa c'è tra X e Y" nei panini).
- [x] A memoria: dispensa intera (soglia spostata da 4 a 3: col campanello onesto il numero nascosto non
      è più legato alla dispensa).
- [x] Distingui: arriva **in coppia col piatto simile** (Esagerato/Esagerato Pollo, le due Italiana…).
- [x] Oro: compare di rado; in vetrina **si impolvera** quando è da ripassare.
- [x] **Base rossa** (pomodoro + fior di latte) come pezzo unico: tessera sul bancone delle pizze e
      gruppo nelle ricette mostrate.

### Passo 4 — La ricetta come al lavoro
- [x] **Montaggio in ordine** (hamburger e focacce): si serve **chiudendo il panino**; ordine giusto =
      bonus "Montato come al banco!" e risposta più forte; ordine sbagliato non è errore, solo una nota.
- [x] **Pizza in due tempi**: prepari → **Inforna** → aggiungi quello che va all'uscita → Servi.
      Un ingrediente nel tempo sbagliato è errore di procedura (lieve, non fa perdere vite).
- [x] **La tua postazione**: ogni ingrediente sempre nello stesso posto del banco (niente rimescolamento);
      disposizione modificabile in Impostazioni. **Mise en place** diventa "banco in ordine"
      (ricerca su ogni bancone, etichette dei ripiani), non toglie più ingredienti sbagliati.
- [x] **Friggitoria**: si contano i pezzi mettendoli nel cestino uno alla volta.
- [x] Sfida scritta: per i panini gli spazi mostrano la posizione (dal basso).

### Passo 5 — Livelli con un senso e ricompense legate all'imparare
- [x] **Sblocchi per livello** (solo con piatti nella fase giusta): Lv2 Tavolo da due · Lv3 Varianti
      ("Diavola senza olive") · Lv4 Asporto al telefono (la comanda sparisce) · Lv5 Controllo qualità
      (trova l'errore di Giuseppe) · Lv6 Sabato sera (turno lungo, tutto mischiato).
- [x] Ogni livello: forziere + messaggio con lo sblocco vero.
- [x] **Titolo legato ai piatti saputi** (fase ≥ 3), non all'XP.
- [x] **Momenti-trofeo**: primo piatto a memoria, piatto d'oro (cerimonia), piatto recuperato.
- [x] **Puntata "Sicuro!"**: ×2 se giusto, si perde di più se sbagliato; calibrazione nelle Statistiche.
- [x] **"Quasi! 4 su 5"** quando si sbaglia di poco.
- [x] **Missioni sulla memoria**: porta piatti alla fase dopo, rinfresca piatti impolverati, riscatta
      un piatto sbagliato ieri, monta panini come al banco.

### Passo 6 — Collegare l'app ai turni veri
- [x] **"Stasera ho fatto…"**: diario dei piatti fatti al lavoro; il giorno dopo il gioco li chiede.
- [x] **"Prima del turno"**: riscaldamento sui più ordinati e su quelli da ripassare.
- [x] **La tua foto** del piatto (IndexedDB) nel Ricettario e negli errori.
- [x] **Il perché**: una riga per ricetta scritta dall'utente, mostrata quando serve.
- [x] Editor ricette: ordine (su/giù), dopo il forno, si ordina spesso, perché, foto.

### Passo 7 — Ricettario e gesti
- [x] **"Immagina di montarlo"**: il film mentale guidato, uno strato alla volta.
- [x] **Gesti facoltativi** (impostazione, spenta di partenza): spalmare la salsa con un giro del dito,
      spolverare il grana. Mai obbligatori.

### Alla fine
- [x] Prova nel browser (Playwright) dei flussi principali; aggiornare README e CLAUDE.md.

## Stato al 26 ottobre 2026

Tutti i passi sono fatti e provati nel browser (2D e 3D, con un bot che gioca turni interi giusti e sbagliati,
un salvataggio "avanzato" per gli sblocchi, e controlli diretti su giudizio del piatto e FSRS).

Controllo finale contro tutta la conversazione: mancavano il suono della fase che sale e la nota "al banco va così"
per i panini giusti ma montati in un altro ordine; aggiunti. In più: pulsante per condividere il gioco
(WhatsApp, menu del telefono, copia link) in home e nelle Impostazioni.

Da fare con l'utente, non nel codice:
- **Controllare le bozze** (Impostazioni → Ricette, piatti con l'icona a strati): ordine dei panini e uscita dal forno.
- Sistemare **la propria postazione** (Impostazioni → La tua postazione).
- Prova su telefono vero: foto dalla fotocamera, gesti col dito, velocità del 3D.

Idee rimaste fuori (possibili passi futuri): classifica fra colleghi (serve un server), umore dei clienti sui modelli 3D.

## Dove sta cosa
- Voti e fasi: `store.tsx` (`record`), `lib/mastery.ts` (fasi, `ripe`, `isDue`), `lib/fsrs.ts`.
- Turno: `screens/Game.tsx` (`planFor` = aiuto per fase/freschezza/difficoltà, `spawn`, `success`, `fail`),
  tipi e schermate di contorno in `screens/GameParts.tsx`.
- Giudizio del piatto (ordine, forno, pezzi): `lib/plate.ts`. Ordini speciali: `lib/orders.ts`. Postazione: `lib/station.ts`.
- Livelli e titoli: `lib/levels.ts`. Diario del turno vero: `lib/real.ts`. Foto: `lib/photos.ts` (IndexedDB).
- Ricetta "come al lavoro" (base rossa, forno/uscita, strati): `components/Recipe.tsx`.

## Note per chi riprende
- Lavoro fatto sul branch `ccr-cc268492-2dm3k4` della sessione cloud e unito in `main` il 26 ottobre 2026.
- Il salvataggio resta `v: 1`; i campi nuovi sono facoltativi e la migrazione è in `store.tsx`
  (`MENU_VERSION` per le ricette).

---

# Piano 2 (26 ottobre 2026): ingredienti riconoscibili e ingredienti uniti

Richiesta: rifare gli ingredienti che si confondono o ingannano (Blender dove serve) e poter dire al gioco
"questi due sono la stessa cosa, tieni questo". Ogni passo: build pulita, commit, push su `main`.

Principio: un disegno aiuta a ricordare solo se è **diverso dagli altri** e **assomiglia a quello che si vede al banco**.

### Passo A — Unire due ingredienti (Impostazioni → Ingredienti)
- [x] Tocchi un ingrediente → "Sostituisci con…" → scegli quello da tenere → vedi i piatti toccati → confermi.
- [x] Cambia tutte le ricette, le statistiche (dimenticati/confusi) e la postazione; il nome tolto non torna più
      (alias dell'utente salvati, applicati anche agli aggiornamenti del menu e alla lista ingredienti delle pizze).

### Passo B — Blender
- [x] Installare Blender nella sessione (pacchetto `bpy` o binario ufficiale).
- [x] Script `tools/ingredients.py`: modella in codice Blender gli ingredienti organici e li esporta in un solo
      `public/models/ingredients/ingredients.glb` (nodi con il nome della chiave).
- [x] Nel gioco: il file si carica all'avvio in una cache sincrona; `buildIng` usa il modello se c'è, altrimenti il
      disegno in codice di oggi. Le icone si rifanno quando arriva il file.

### Passo C — Ingredienti da rifare (Blender)
- [x] Latticini: fior di latte, Bufala DOP (più grande e lucida), burrata (sacchetto col nodo), stracciatella (filante).
- [x] Funghi: champignon (funghi/freschi), misti, porcini (cappello scuro e gambo grosso), porcini panati fritti.
- [x] Creme: ciotolina con crema e un segno suo (zucca, zucchine, cacio e pepe col pepe, gorgonzola venato,
      radicchio e speck, funghi, pesto, pistacchio, San Marzano, pelato giallo); glassa in bottiglietta.
- [x] Salumi: salamino (fettine piccole a coppetta), spianata (fette grandi ovali), capocollo (marezzato), speck
      (fetta con cotenna), crudo (nastro col grasso), cotto (fetta rosa chiaro), pancetta a dadini, pancetta coppata
      (arrotolata), guanciale croccante, salsiccia sbriciolata, salsiccia di Norcia.
- [x] Verdure: friarielli, cicoria, spinaci, peperoncino (curvo col picciolo), pomodorini scattarisciati.
- [x] Fritti e patate: pittule irregolari, panzerotto a mezzaluna, patate al forno a spicchi, patate saltate a cubetti.
- [x] Panini: kebab (falde sottili), pulled pork (sfilacciato scuro).

### Passo D — Ritocchi in codice
- [x] Grana e Parmigiano diversi; salse in bottiglia con etichette diverse (boscaiola, caesar, maionese, burger).
- [x] Contrasto per cipolla, mandorle, scaglie; pizze intere inquadrate più da vicino nelle icone.

### Passo E — Verifica
- [x] Fogli con tutte le icone prima/dopo, partita di prova, build, push su `main`.

### Fatto anche (richieste durante il lavoro)
- [x] Panzerotti di patate fatti come crocchette di patate (stesso modello delle crocchette della friggitoria).
- [x] Salsiccia "a ruota", cruda, col grasso a scaglie (la tipologia usata in pizzeria); la salsiccia di Norcia a catenella.
- [x] Insalatone: gli ingredienti finivano sepolti dentro la ciotola; ora stanno sopra e l'icona guarda dall'alto.
- [x] Salse con un segno diverso sull'etichetta; creme spalmate sulla pizza con il loro segno (pepe, venature, semi).

Peso: `ingredients.glb` circa 850 kB (meshopt), si scarica una volta e resta in cache con gli altri modelli.

---

# Piano 3 (26 ottobre 2026): i miei banchi, poi costruzione e 3D

### A — Categorie ("I miei banchi")
- [x] Impostazioni (e benvenuto): scegli le categorie che fai al lavoro; di partenza tutte.
- [x] Il filtro della home parte dai tuoi banchi e si ricorda.
- [x] Titolo, "Menu a memoria", piatti impolverati, Statistiche, Prima del turno e Sabato sera contano i tuoi banchi
      (le altre categorie restano allenabili e contano come bonus).
- [x] Missioni: niente missioni impossibili (panini a chi non fa panini); missione "3 categorie in un turno" per chi ne fa più d'una.
- [x] Allarme dimenticanze: "Hai N piatti da ripassare in altre categorie" anche col filtro su una categoria.
- [x] Statistiche: copertura per categoria (mai visti, in corso, a memoria).
- [x] Con più categorie, i piatti nuovi arrivano a rotazione fra le categorie.

### B — Costruzione e 3D
- [x] Divise del Guardaroba applicate a Giuseppe (berretto e maglietta; "Classico" = Giuseppe vero).
- [x] Momento dell'acquisto: la camera vola sull'oggetto, coriandoli, applauso, cosa cambia. (`Fly` in `Diorama.tsx`, `bought` in Home)
- [x] Obiettivo sempre in vista: "Prossimo: … mancano N monete" con la barra; a fine turno le monete ci volano dentro.
  (`goalOf` in `build.ts`, `GoalCard` in Home, `EndGoal` in GameParts; "Punta" nel foglio Costruisci = `save.goal`)
- [x] Il locale cresce con la memoria: angoli dei banchi (pizze, piastra, friggitoria, insalate) con le vaschette dei
  loro ingredienti che si riempiono coi piatti a memoria (d'oro quando sono tutti), posto segnato a terra per i miei banchi
  ancora vuoti, parete dei piatti d'oro (impolverati quando sono da ripassare), festa con la camera quando cambia qualcosa
  (`lib/growth.ts`, `three/Growth.tsx`, `save.seenGrowth`), legenda toccabile sotto il diorama.
- [x] Migliorie che si vedono nel turno (tavolini = mance più ricche, insegna = più VIP, forno = "cotta giusta" +monete,
  piante/quadri/luci = mance più frequenti). Funzioni in `lib/stars.ts`, descrizioni in `build.ts`.
- [x] Stelle del locale (1–5) con sblocchi; il critico gastronomico. Le stelle vogliono migliorie **e** piatti a memoria
  (`STARS` in `lib/stars.ts`); si vedono in Home, nel foglio Costruisci e sull'insegna; festa quando salgono. Il critico
  (da 3★, una volta per turno, solo piatti già a memoria) paga bene se il piatto è fatto bene senza correzioni.
- [x] Sorprese: il fornitore con pezzi rari a fine turno (più turni senza, più è probabile), set "Angolo trattoria"
  (mandolino + monete), offerta del giorno (`dealOf`/`priceOf`). `lib/rare.ts`, `three/Rare.tsx`.
- [x] Arredi di stagione (Halloween 20 ott–3 nov: zucche e luci arancio; Natale 1 dic–6 gen: albero e luci) e
  "Rinnova il locale" quando è tutto costruito (migliorie da zero, pareti nuove, +10% monete per sempre, stelle tenute).
