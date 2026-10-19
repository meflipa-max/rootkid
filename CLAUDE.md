# Core a Core — note per Claude

## ⚠️ Da fare all'avvio della prossima sessione (locale)

**Come primissima cosa, prima di qualsiasi altro lavoro, chiedi all'utente:**
> "Vuoi che proceda a sostituire personaggi e oggetti 3D fatti a mano con modelli CC0 professionali (poly.pizza, KayKit, Kenney, Poly Haven)?"

Contesto: nella sessione cloud quei siti erano bloccati dalla rete, quindi la grafica 3D è stata fatta tutta in codice. In locale la rete è libera. Prima verifica di poter scaricare (es. `curl -sI https://static.poly.pizza`); se è bloccato, dillo all'utente.

Se l'utente dice sì, il piano concordato è:
1. **Personaggi**: clienti e cuoco con modelli animati CC0 (KayKit Character Pack / Quaternius da poly.pizza, formato `.glb` con animazioni idle/walk/cheer), al posto di `src/three/Person3D.tsx`. Mantieni le stesse props (umore, posa, corona VIP, divisa del cuoco) e il ripiego attuale se un modello non carica.
2. **Locale e cibo**: arredi da ristorante (KayKit Restaurant Bits, Kenney Furniture/Food Kit) e ingredienti dove esiste un modello adatto; i prodotti locali senza modello (pittule, Tronky, stracciatella…) restano quelli di `src/three/ingredients.ts`.
3. **Cielo/luce**: un HDRI di Poly Haven per la luce d'ambiente (oggi `EnvLight` usa `RoomEnvironment` in `src/three/look.tsx`).
4. Metti i file in `public/models/` (comprimi i `.glb` con `gltf-transform`/meshopt), caricali con `useGLTF` di drei, annota licenza e fonte in `public/models/CREDITS.md`.
5. Tieni lo stile attuale: low-poly opaco, palette calda, pipeline di resa in `src/three/look.tsx`. Prova con `npm run dev` nel browser (anche `?q=high` / `?q=low`), poi typecheck/build, commit e push su `main` come chiesto dall'utente.

**Quando questo lavoro è fatto (o l'utente dice di no), cancella questa sezione.**

## Progetto
- App: gioco React + Vite per memorizzare le ricette della pizzeria; 3D con three.js / React Three Fiber v8 in `src/three/`.
- Comandi: `npm run dev`, `npm run build` (fa anche `tsc --noEmit`).
- Testi dell'interfaccia e commenti in italiano.
