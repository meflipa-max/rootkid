# Modelli e luce — fonti e licenze

Tutto quello che sta in questa cartella è **CC0** (pubblico dominio): si può usare, modificare e
ridistribuire anche in progetti commerciali, senza chiedere permesso e senza obbligo di credito.
I crediti qui sotto ci sono lo stesso, perché è giusto così.

| Cartella | Pacchetto | Autore | Licenza |
|---|---|---|---|
| `characters/` | [Mini Characters](https://kenney.nl/assets/mini-characters) | [Kenney](https://kenney.nl) | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) |
| `furniture/` | [Furniture Kit](https://kenney.nl/assets/furniture-kit) | [Kenney](https://kenney.nl) | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) |
| `ingredients/` | fatti per questo gioco con Blender (`tools/ingredients.py`) | Core a Core | come il resto del gioco |
| `hdri/` | [Artist Workshop](https://polyhaven.com/a/artist_workshop) | Oliksiy Yakovlyev · [Poly Haven](https://polyhaven.com) | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) |

## Cosa è stato fatto ai file

I pacchetti originali pesano molto più del necessario, quindi non vengono copiati così come sono:
li passa `tools/prepare-models.mjs`, che per ogni modello

- tiene solo le 9 animazioni che il gioco fa partire (le originali sono 32);
- lascia le animazioni **solo** in `character-male-a.glb`: le 12 varianti hanno lo stesso
  scheletro, quindi quelle animazioni valgono per tutti e non vanno duplicate;
- incorpora la texture dentro al `.glb` (negli originali è un file a parte);
- unisce i vertici doppi, butta via quello che non serve e **quantizza** la geometria
  (`KHR_mesh_quantization`, three lo legge senza bisogno di decoder esterni).

L'HDRI passa da 1024×512 a 256×128 e viene riscritto in RGBE: serve solo come luce riflessa e
viene comunque sfocato dal PMREM, quindi la resa non cambia (luminanza media entro lo 0,3%).

Risultato: **1,7 MB** in tutto al posto di 4,7 MB, e i personaggi si scaricano uno alla volta,
solo quando compaiono.

## Rifare la preparazione

I pacchetti originali non stanno nel repo. Per rigenerare `public/models/`:

1. scarica e scompatta in una cartella qualsiasi:
   - `https://kenney.nl/assets/mini-characters` → `kenney_mini-characters/`
   - `https://kenney.nl/assets/furniture-kit` → `kenney_furniture-kit/`
   - `https://polyhaven.com/a/artist_workshop` (HDR 1k) → `artist_workshop_1k.hdr`
2. `node tools/prepare-models.mjs <quella-cartella>`

Se aggiungi un pacchetto, mettilo nella tabella qui sopra.

## Giuseppe (il cuoco)

`characters/giuseppe.glb` è fatto in Blender a partire da `character-male-a.glb` (stesso scheletro,
quindi usa le stesse animazioni): berretto girato all'indietro (calotta aderente, cuciture, visiera dietro,
fascetta a bottoncini sulla fronte), occhiali, barba e baffi in 3D, maglietta bianca e pantaloni a quadretti.
Per rigenerarlo:

    blender -b --python tools/giuseppe.py -- public/models/characters/character-male-a.glb giuseppe.raw.glb
    node tools/pack-ingredients.mjs giuseppe.raw.glb public/models/characters/giuseppe.glb --solo-quantize


## Ingredienti (Blender)

`ingredients/ingredients.glb` non viene da un pacchetto: è modellato **in codice** da `tools/ingredients.py`
(latticini, funghi, creme, salumi, verdure cotte, fritti, patate, kebab e pulled pork, formaggi duri).
Un oggetto per ingrediente; `<nome>__layer` è la versione bassa da mettere su pizza e panini.
Per rigenerarlo:

    pip install bpy                     # Blender come modulo Python (oppure: blender -b --python …)
    python tools/ingredients.py public/models/ingredients/ingredients.raw.glb
    node tools/pack-ingredients.mjs public/models/ingredients/ingredients.raw.glb public/models/ingredients/ingredients.glb

Il file `.raw.glb` non va nel repo: serve solo come passaggio intermedio.
