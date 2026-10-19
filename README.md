# Core a Core

Gioco mobile-first per memorizzare le ricette della pizzeria (hamburger, insalatone, focacce, pizze dolci, friggitoria).

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
