# Core a Core — note per Claude

## Progetto
- App: gioco React + Vite per memorizzare le ricette della pizzeria; 3D con three.js / React Three Fiber v8 in `src/three/`.
- Comandi: `npm run dev`, `npm run build` (fa anche `tsc --noEmit`).
- Testi dell'interfaccia e commenti in italiano.
- Git: si lavora sempre su `main`, niente branch separati.

## PWA e accessibilità — 20 ottobre 2026

- Impostazioni nuove in `Settings`: `text` (1/2/3, applicata come `data-text` su `<html>`), `calm`, `setup`.
  Chi non ha ancora fatto la scelta vede il benvenuto (`components/Welcome.tsx`).
- **Le dimensioni dei caratteri in `styles.css` sono in `rem`**: quelle nuove vanno scritte in rem, se no
  non seguono la grandezza scelta. Minimo 13 px (0.8125rem).
- Service worker con `registerType: 'prompt'`: l'aggiornamento lo applica `src/lib/pwa.ts` quando nessuno
  lo trattiene; se si aggiunge una schermata dove un ricaricamento farebbe perdere qualcosa, usare
  `useHoldUpdate(true)` lì dentro.
- Da provare su un telefono vero: installazione su Android (pulsante) e iPhone (passi da Safari).

## Dispensa e sfida scritta — 21 ottobre 2026

- Il bancone dipende dalla scatola di Leitner (`trayLevelFor`): ≥4 = dispensa, ed è lo stesso livello in cui
  sparisce il conteggio (hint `none`). Se si cambia una soglia, cambiare anche l'altra.
- Il riconoscimento del testo scritto è `matchIngredient` in `src/lib/pantry.ts`; i ripiani sono regole a
  parole chiave (`RULES`): un ingrediente nuovo che finisce in "Altro" va aggiunto lì.

## Modelli CC0 — stato al 19 ottobre 2026

Nella sessione cloud i siti degli asset erano bloccati, quindi la grafica 3D era tutta in codice.
In locale la rete è libera: personaggi e arredi ora vengono da pacchetti CC0. Fonti, licenze e
come rigenerare i file: **`public/models/CREDITS.md`**.

### Fatto

- **Pipeline** `tools/prepare-models.mjs`: alleggerisce i `.glb` (animazioni inutili via, texture
  incorporata, geometria quantizzata) e riduce l'HDRI. I pacchetti originali **non** stanno nel
  repo: si riscaricano a mano, le istruzioni sono in CREDITS.md. Serve `@gltf-transform/*`, già
  fra le devDependencies.
- **Personaggi** (`src/three/Person3D.tsx`): Kenney Mini Characters, 12 varianti riggate in
  `public/models/characters/`. Il modello si sceglie dall'aspetto del cliente (stesso aspetto ⇒
  sempre lo stesso modello). Le animazioni stanno solo in `character-male-a.glb` e si riusano su
  tutti, perché lo scheletro è identico. Le pose del gioco sono mappate sulle animazioni del
  pacchetto nella tabella `CLIP`. I modelli vengono riportati all'altezza `TALL` misurandoli a
  runtime. Cappello da cuoco, grembiule e corona VIP restano quelli disegnati a mano e si
  agganciano alle ossa `head` e `torso` con `createPortal`.
- **Ripiego**: la versione fatta a mano è ora `src/three/PersonMesh.tsx`. `Person3D` la mostra
  mentre i modelli caricano e ci resta per sempre se il caricamento fallisce (c'è un error
  boundary). Stesse props di prima, le chiamate nel resto del gioco non sono cambiate.
- **Luce** (`src/three/look.tsx`): `EnvLight` parte con il `RoomEnvironment` di prima e passa
  all'HDRI di Poly Haven appena arriva; se l'HDRI non si carica resta il ripiego. La mappa cotta
  è in cache per renderer (`WeakMap`), così i tre Canvas non la rifanno ogni volta.
- **Arredo** (`src/three/Kit.tsx` + `Pizzeria.tsx`): componente `Kit` che carica un modello, lo
  centra, lo appoggia a terra e lo porta all'altezza chiesta, con `spare` = l'oggetto disegnato a
  mano come ripiego. Usato per le sedie del dehors, le piante e il frigo.

### Da riprendere

1. **Guardare bene la resa** con il browser largo: nell'ultima sessione le schermate erano troppo
   piccole per giudicare. Da controllare in particolare il **frigo** (sembra un parallelepipedo
   bianco slavato) e la **pianta** (sembra un cactus: forse `pottedPlant` non è il pezzo giusto,
   nel Furniture Kit ci sono alternative). Se stonano, meglio tornare al ripiego fatto a mano:
   basta togliere il `Kit` e lasciare il contenuto di `spare`.
2. **Sedie del dehors**: verificare l'orientamento (`rotation={[0, s * Math.PI * 0.5, 0]}`), non è
   stato possibile vederle da vicino.
3. **Cappello e grembiule del cuoco**: le posizioni (`position={[0, 0.3, -0.02]}` sulla testa,
   `[0, -0.04, 0.17]` sul torso) sono a occhio, da rifinire guardando il cuoco grande nel
   Guardaroba (Home → Guardaroba).
4. **Umore dei clienti**: i modelli hanno la faccia dipinta, quindi `mood` non cambia più
   l'espressione — ora si legge solo dalla posa e dal fumetto. Se si vuole recuperare, si può
   scambiare la texture o mettere un'icona sopra la testa.
5. **Ingredienti**: *non* sostituiti, ed è una scelta. `buildIng` in `src/three/ingredients.ts` è
   sincrono e lo usano piatto, anteprime e layout; passare ai `.glb` vorrebbe dire renderlo
   asincrono e toccare il cuore del gioco. In più metà del menu è roba locale (pittule, Tronky,
   stracciatella…) che nei pacchetti non esiste. Se un giorno si vuole fare, serve una cache
   precaricata e sincrona, non `useGLTF`.
6. **Prova su telefono** (`?q=low`) e misura del peso: i personaggi sono ~120 kB l'uno.

### Attenzione

- Il server di sviluppo di Vite va riavviato dopo un `npm install`: la scheda del browser rimasta
  aperta dalla sessione prima mostra errori finti (“Invalid hook call”, due copie di React) finché
  non si apre una scheda nuova.
