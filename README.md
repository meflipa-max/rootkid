# PizzaMaster

Gioco mobile-first per memorizzare le ricette della pizzeria (hamburger, insalatone, focacce, pizze dolci, friggitoria).

- **Turno di servizio**: un cuoco 2D animato, clienti che entrano e ordinano, tu prepari il piatto a memoria prima che si spazientiscano (8 clienti, 3 vite, combo, monete, stelle).
- **Aiuti adattivi**: sui piatti nuovi vedi la ricetta, poi solo le icone, poi solo il numero, infine niente (punti ×3 "a memoria"). Se sbagli, gli aiuti tornano.
- **Guardaroba**: spendi le monete per nuove divise del cuoco.
- **Ricettario**: schede da girare per ripassare.
- **Statistiche**: padronanza per piatto e categoria, ingredienti dimenticati più spesso, turno sui punti deboli.
- **Impostazioni**: modifica/aggiungi/elimina ricette, suoni, vibrazione, obiettivo giornaliero, backup JSON.

Dati salvati in `localStorage`. Le ricette di partenza sono in `src/lib/data.ts`.

```
npm install
npm run dev
npm run build
```
