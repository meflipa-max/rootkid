# Core a Core

Gioco mobile-first per memorizzare le ricette della pizzeria (hamburger, insalatone, focacce, pizze dolci, friggitoria).

## Comodo per tutti
- **Primo avvio**: si sceglie la grandezza del testo (normale, grande, molto grande) e il ritmo (*con calma* o *più veloce*). Tutto si cambia poi da Impostazioni, in alto.
- **Testo**: tutte le dimensioni dei caratteri sono in `rem` e seguono la scelta (`html[data-text]` in `styles.css`); con "molto grande" il bancone passa a 3 colonne. Contrasto più alto per i testi secondari, pulsanti di almeno 44–48 px, etichette scritte accanto alle icone (Pausa, Svuota, Esci).
- **Ritmo tranquillo**: clienti pazienti quasi il doppio, arrivi più distanziati, niente fretta che cresce col livello.
- **Come si gioca**: nei primi 3 turni il locale apre solo dopo aver letto le istruzioni in 4 passi.

## Condividi
- **Fai giocare i colleghi** (in home e nelle Impostazioni, `components/Share.tsx`): WhatsApp con un messaggio già pronto, il menu di condivisione del telefono (se c'è) e "Copia il link".

## App installabile (PWA)
- `vite-plugin-pwa` genera manifest e service worker: il gioco funziona anche offline (modelli e font in cache).
- **Installazione** (`src/lib/pwa.ts`, `src/components/Install.tsx`): su Chrome/Android il pulsante "Installa il gioco" usa `beforeinstallprompt`; su iPhone/iPad mostra i passi da Safari. L'invito sta in home (con "Non ora" che lo rimanda di 3 giorni) e sempre nelle Impostazioni.
- **Sempre aggiornata**: controlla se c'è una versione nuova all'avvio, quando si torna sull'app e ogni 30 minuti, e la applica da sola ricaricando la pagina, ma mai durante un turno o mentre si modifica una ricetta (`useHoldUpdate`).
- Icone in `public/` (`favicon.svg` è il disegno di partenza).

## Ingredienti fatti in Blender
Quelli che disegnati in codice si confondevano (latticini bianchi, funghi, creme, salumi, verdure cotte, fritti, patate, kebab e pulled pork, Grana e Parmigiano) sono modellati in Blender con `tools/ingredients.py` e caricati da `src/three/models.ts`; se il file non arriva resta il disegno in codice. Come rigenerarli: `public/models/CREDITS.md`.

## I miei banchi
Nel benvenuto e nelle Impostazioni si scelgono le categorie che si fanno al lavoro. Il filtro della home parte da lì e si ricorda; titolo, "Menu a memoria", statistiche, missioni, Prima del turno e Sabato sera contano solo i tuoi banchi, le altre categorie restano allenabili. Se il filtro è su una categoria, un avviso ricorda i piatti da ripassare nelle altre; le Statistiche mostrano la copertura per categoria; con più categorie i piatti nuovi arrivano a rotazione.

## Piatti fuori menu
Un piatto che non si fa più si spegne nella sua ricetta (Impostazioni → Ricette → "In menu"): resta salvato con le statistiche ma non compare in turni, ripassi, Ricettario e conteggi. "Rimetti" lo riporta in menu.

## Ingredienti uniti
Due nomi per la stessa cosa (es. mozzarella e fior di latte)? Impostazioni → Ingredienti → tocca quello da togliere e scegli quale usare. Cambiano ricette, statistiche e postazione; l'unione resta ricordata.

## Grafica 3D
Stile "giocattolo low-poly": tutto è modellato in codice con three.js / React Three Fiber (`src/three/`), quindi stessa mano per ogni oggetto, anche per i prodotti locali che non esistono nei pacchetti di modelli.

- **Ingredienti 3D** (`ingredients.ts`): un modello per ogni ingrediente, più le basi dei piatti (panino, focaccia, ciotola, pizza, cestino). Le icone in tutta l'app sono render di questi modelli (`thumbs.ts`).
- **Il locale** (`Pizzeria.tsx`): stanza, strada al tramonto che diventa sera durante il turno, e ogni miglioria come oggetto vero (forno con le fiamme, cassa, frigo, campanello, orologio, mensola, garzone, piante, quadri, luci, insegna al neon, tavolini fuori).
- **Turno** (`Stage3D.tsx`): i clienti entrano dalla porta, aspettano, battono il piede se hanno fretta; trascini gli ingredienti sul piatto e cadono rimbalzando; il piatto pronto vola dal cliente e saltano fuori le monete. Il telefono inclinato muove la camera.
- **Home** (`Diorama.tsx`): il locale in miniatura da girare col dito; tocchi un oggetto (o un "+") per migliorarlo e lo vedi comparire.
- **Resa** (`look.tsx`): luce d'ambiente generata in locale, tone mapping "Neutral", ombre morbide, occlusione ambientale, bagliore su lampade e fuoco, vignettatura e una leggera correzione colore. Se il telefono non regge passa da solo alla qualità bassa (senza effetti); `?q=high` o `?q=low` nell'indirizzo la forzano.
- **Mondo** (`World.tsx`): isola galleggiante con acqua e schiuma sulla riva, cielo dipinto con sole e nuvole, alberi, sentiero, lampioni che si accendono la sera, pontile con la barca.
- Senza WebGL il gioco torna da solo alla versione 2D.

## Come il gioco capisce quanto sai
- **Voto della risposta**: copiare dalla ricetta è studio (non fa salire), Aiuto vuol dire "non lo sapevo", correzioni o
  lentezza = difficile, risposta pulita = bene, pulita e veloce in dispensa o con la puntata = facile.
- **Fasi del piatto**: Nuovo → Riconosci → Ricorda → A memoria → Distingui → Oro. Ogni fase è un modo diverso di
  presentarlo (cartolina del piatto nuovo, numero visibile, "cosa manca?", dispensa, coppia col piatto simile).
- **FSRS** (`lib/fsrs.ts`): per ogni piatto la probabilità di ricordarlo adesso; decide i ripassi, l'aiuto e la
  vetrina che si impolvera.
- **Difficoltà automatica**: punta a circa l'85% di ordini giusti, e lo dice ("Stai andando forte", "Ti do una mano").
- **Richiami**: un piatto studiato torna due clienti dopo senza ricetta, e di nuovo a fine turno.

## Come al lavoro
- **Panini montati dal basso** e serviti chiudendo il panino; **pizze** infornate e completate all'uscita;
  **friggitoria** a pezzi contati nel cestino; **base rossa** (pomodoro + fior di latte) come pezzo unico.
- **La tua postazione**: ogni ingrediente sempre nello stesso posto del banco, sistemabile in Impostazioni.
- **Il turno vero**: segni i piatti fatti al lavoro e il giorno dopo il gioco te li chiede. **Prima del turno**:
  riscaldamento sui più ordinati. **Foto** e **perché** di ogni ricetta. **Immagina di montarlo** nel Ricettario.
- **Gesti** facoltativi: spalmare con un giro del dito, spolverare con tre tocchi.

## Il turno
Un cuoco animato, una pizzeria al tramonto (che diventa sera man mano che arrivano i clienti) e 8 clienti da servire prima che perdano la pazienza.

- **Aiuti che si ritirano** con la fase del piatto: ricetta visibile (studio), poi solo il numero, infine niente (punti ×3 "a memoria").
- **Livelli che cambiano il lavoro**: Tavolo da due, Varianti, Asporto al telefono, Controllo qualità, Sabato sera. Il titolo dipende dai piatti che sai.
- **Puntata "Sicuro!"** (×2 o -100), **"Quasi! 4 su 5"**, momenti-trofeo (primo a memoria, piatto d'oro, recuperato), missioni sulla memoria.
- **Rivincita** 🔁: se sbagli un piatto, torna un paio di clienti dopo (punti ×1.5). Richiamo a breve distanza subito dopo il feedback.
- **Cliente indeciso** 🤔: ti dice gli ingredienti e tu riconosci il piatto (richiamo nel verso opposto).
- **Cliente VIP** 👑, **mance** e **FEVER** 🔥 (combo ×5 → punti ×1.5): ricompense variabili per tenere alta la motivazione.
- **Feedback che insegna**: se metti un ingrediente sbagliato ti dice in quale piatto va; gli ingredienti che confondi tornano apposta come distrattori.
- **Fine turno**: stelle, punteggio che rotola, monete e la tua memoria piatto per piatto (tacche che si accendono).

## Studio
- **Bancone che cresce con la memoria** (`trayFor` in `questions.ts`): piatto nuovo → giusti + pochi sbagliati; 2–3 tacche → il doppio dei distrattori, presi dai piatti simili; 4–5 tacche → la **dispensa intera** della categoria (pizze classiche e speciali insieme, max 36 voci), divisa in ripiani (`lib/pantry.ts`) e con la ricerca scrivendo. La friggitoria non arriva alla dispensa.
- **Sfida scritta** (Ricettario → Scrivi a memoria, `screens/Write.tsx`): solo il nome del piatto, gli ingredienti si scrivono. Perdona maiuscole, accenti, "di"/"e" e piccoli errori di battitura; le quantità devono essere esatte. Un ingrediente vero ma sbagliato è un errore, una parola sconosciuta no. Risposta perfetta = 2 tacche.
- **Coerenza con le migliorie**: comprano comodità, mai risposte. La Mise en place mette in ordine il banco (ricerca ed etichette); il Campanello serve quando il numero torna, giusto o sbagliato; la dispensa dà 12 s di tempo in più (e Forno, Garzone, Cronometro si sommano).
- **Ripetizione dilazionata**: oltre la fase 2 si sale solo dopo un'attesa (1, 2, 4, 8 giorni); quando ripassare lo decide FSRS.
- **Ripasso** 🧠: prima i piatti in scadenza, poi i più deboli.
- **Ricettario**: schede da girare con il numero di voci da ricordare, gli ingredienti che dimentichi più spesso e "non confonderlo con…" il piatto più simile. L'autovalutazione non porta oltre il livello 2.

## Meta-gioco
- **Missioni giornaliere** (3 al giorno) con monete e **forziere a sorpresa** quando le completi tutte.
- **Costruisci**: forno, cassa, insegna, frigo, campanello, mise en place, garzone, cronometro, e decorazioni visibili nella scena (luci, bandierine, piante, tavolini) che nel turno portano mance e VIP. Comprando, la camera vola sull'oggetto. Prossimo acquisto sempre in vista, offerta del giorno, set "Angolo trattoria", pezzi rari del fornitore, addobbi di stagione e "Rinnova il locale".
- **Il locale cresce con la memoria**: angoli dei banchi che si riempiono coi piatti a memoria, parete dei piatti d'oro (impolverati se da ripassare), stelle del locale (servono migliorie *e* memoria) e il critico gastronomico da 3 stelle.
- **Guardaroba**, livelli, serie di giorni, obiettivo giornaliero.
- **Statistiche** e **Impostazioni** (modifica ricette, suoni, vibrazione, backup JSON).

Dati salvati in `localStorage`. Le ricette di partenza sono in `src/lib/data.ts`.

```
npm install
npm run dev
npm run build
```
