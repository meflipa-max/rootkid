# Core a Core

Gioco mobile-first per memorizzare le ricette della pizzeria (hamburger, insalatone, focacce, pizze dolci, friggitoria).

## Grafica 3D
Stile "giocattolo low-poly": tutto è modellato in codice con three.js / React Three Fiber (`src/three/`), quindi stessa mano per ogni oggetto, anche per i prodotti locali che non esistono nei pacchetti di modelli.

- **Ingredienti 3D** (`ingredients.ts`): un modello per ogni ingrediente, più le basi dei piatti (panino, focaccia, ciotola, pizza, cestino). Le icone in tutta l'app sono render di questi modelli (`thumbs.ts`).
- **Il locale** (`Pizzeria.tsx`): stanza, strada al tramonto che diventa sera durante il turno, e ogni miglioria come oggetto vero (forno con le fiamme, cassa, frigo, campanello, orologio, mensola, garzone, piante, quadri, luci, insegna al neon, tavolini fuori).
- **Turno** (`Stage3D.tsx`): i clienti entrano dalla porta, aspettano, battono il piede se hanno fretta; trascini gli ingredienti sul piatto e cadono rimbalzando; il piatto pronto vola dal cliente e saltano fuori le monete. Il telefono inclinato muove la camera.
- **Home** (`Diorama.tsx`): il locale in miniatura da girare col dito; tocchi un oggetto (o un "+") per migliorarlo e lo vedi comparire.
- Senza WebGL il gioco torna da solo alla versione 2D.

## Il turno
Un cuoco animato, una pizzeria al tramonto (che diventa sera man mano che arrivano i clienti) e 8 clienti da servire prima che perdano la pazienza.

- **Aiuti che si ritirano**: piatto nuovo → ricetta visibile; dopo un errore → la ricetta si vede finché non metti il primo ingrediente (*memorizza!*); poi solo icone, poi solo il numero, infine niente (punti ×3 "a memoria").
- **Rivincita** 🔁: se sbagli un piatto, torna un paio di clienti dopo (punti ×1.5). Richiamo a breve distanza subito dopo il feedback.
- **Cliente indeciso** 🤔: ti dice gli ingredienti e tu riconosci il piatto (richiamo nel verso opposto).
- **Cliente VIP** 👑, **mance** e **FEVER** 🔥 (combo ×5 → punti ×1.5): ricompense variabili per tenere alta la motivazione.
- **Feedback che insegna**: se metti un ingrediente sbagliato ti dice in quale piatto va; gli ingredienti che confondi tornano apposta come distrattori.
- **Fine turno**: stelle, punteggio che rotola, monete e la tua memoria piatto per piatto (tacche che si accendono).

## Studio
- **Ripetizione dilazionata (Leitner)**: 5 livelli per piatto. Oltre il livello 2 si sale solo quando il ripasso è "maturo" (1, 2, 4, 8 giorni): la padronanza misura la memoria a lungo termine, non la ripetizione nella stessa sessione.
- **Ripasso** 🧠: prima i piatti in scadenza, poi i più deboli.
- **Ricettario**: schede da girare con il numero di voci da ricordare, gli ingredienti che dimentichi più spesso e "non confonderlo con…" il piatto più simile. L'autovalutazione non porta oltre il livello 2.

## Meta-gioco
- **Missioni giornaliere** (3 al giorno) con monete e **forziere a sorpresa** quando le completi tutte.
- **Costruisci**: forno, cassa, insegna, frigo, campanello, mise en place, garzone, cronometro, e decorazioni visibili nella scena (luci, bandierine, piante, tavolini).
- **Guardaroba**, livelli, serie di giorni, obiettivo giornaliero.
- **Statistiche** e **Impostazioni** (modifica ricette, suoni, vibrazione, backup JSON).

Dati salvati in `localStorage`. Le ricette di partenza sono in `src/lib/data.ts`.

```
npm install
npm run dev
npm run build
```
