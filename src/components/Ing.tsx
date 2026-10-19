import type { ReactNode } from 'react';
import { hasWebGL, useDishThumb, useThumb } from '../three/thumbs';

/** Illustrazioni degli ingredienti: ognuno ha forma e colori propri, così si riconoscono a colpo d'occhio. */

const KEYS: [RegExp, string][] = [
  // pizze: prima le creme e i nomi composti, che altrimenti finirebbero sull'ingrediente sbagliato
  [/crema di zucca/, 'czucca'],
  [/crema di zucchine/, 'czucchine'],
  [/cacio e pepe/, 'ccacio'],
  [/crema (al|di) gorgonzola/, 'cgorgo'],
  [/crema di radicchio/, 'cradicchio'],
  [/pesto/, 'pesto'],
  [/glassa|balsamico/, 'balsamico'],
  [/san marzano/, 'smarzano'],
  [/pelato giallo/, 'pgiallo'],
  [/anelli/, 'anelli'],
  [/crocchett/, 'crocchette'],
  [/panzerott/, 'calzoncini'],
  [/chips di zucchine|julienne di zucchine|zucchine (impanate|fritte)/, 'zuccfritte'],
  [/prosciutto cotto|\bcotto\b/, 'cotto'],
  [/salamino|spianata/, 'salame'],
  [/salsiccia/, 'salsiccia'],
  [/speck/, 'speck'],
  [/mortadella/, 'mortadella'],
  [/capocollo/, 'capocollo'],
  [/pancetta|guanciale/, 'pancetta'],
  [/polpett/, 'polpette'],
  [/gamber/, 'gamberetti'],
  [/salmon/, 'salmone'],
  [/acciug|alici/, 'acciughe'],
  [/capperi/, 'capperi'],
  [/carciof/, 'carciofi'],
  [/melanzan/, 'melanzane'],
  [/peperoni\b/, 'peperoni'],
  [/zucchin/, 'zucchine'],
  [/friariell|cicori|spinaci/, 'verdure'],
  [/radicchio/, 'radicchio'],
  [/basilico/, 'basilico'],
  [/\bnoci\b/, 'noci'],
  [/mandorl/, 'mandorle'],
  [/burrata/, 'burrata'],
  [/bufala/, 'mozz'],
  [/emmenthal|emmental/, 'emmenthal'],
  [/gorgonzola/, 'gorgonzola'],
  [/provola/, 'scamorza'],
  [/cipolla(?! croccante)/, 'cipolla'],
  [/veggie/, 'veggie'],
  [/kebab/, 'kebab'],
  [/condiment/, 'condimenti'],
  [/w[uü]rstel/, 'wurstel'],
  [/cipolla croccante/, 'croccante'],
  [/\bolio\b/, 'olio'],
  [/kinder|bueno/, 'kinder'],
  [/granella/, 'granella'],
  [/scaglie|cioccolato bianco/, 'scaglie'],
  [/guacamole/, 'guac'],
  [/boscaiola/, 'bosc'],
  [/bbq/, 'bbq'],
  [/salsa (ham)?burger/, 'sburger'],
  [/cesar|caesar/, 'cesar'],
  [/maionese|mayo/, 'mayo'],
  [/funghi/, 'funghi'],
  [/bocconcini/, 'nuggets'],
  [/cotoletta/, 'cotoletta'],
  [/pollo/, 'tenders'],
  [/hamburger/, 'patty'],
  [/pulled/, 'pulled'],
  [/bacon/, 'bacon'],
  [/crudo|prosciutto/, 'crudo'],
  [/bresaola/, 'bresaola'],
  [/porchetta/, 'porchetta'],
  [/tonno/, 'tonno'],
  [/cheddar/, 'cheddar'],
  [/stracciatella/, 'stracc'],
  [/scamorza/, 'scamorza'],
  [/mozz|fior di latte/, 'mozz'],
  [/grana|parmigiano/, 'grana'],
  [/valeriana/, 'valeriana'],
  [/rucola/, 'rucola'],
  [/insalata|lattuga/, 'insalata'],
  [/secchi/, 'secchi'],
  [/pomodorini/, 'pomodorini'],
  [/pomodor/, 'pomodoro'],
  [/peperoncino/, 'peperoncino'],
  [/frigitell/, 'frigitelli'],
  [/cipolla/, 'anelli'],
  [/olive/, 'olive'],
  [/patatine/, 'patatine'],
  [/patate/, 'patate'],
  [/bianca/, 'nutbianca'],
  [/nutella/, 'nutella'],
  [/nocciol/, 'nocciola'],
  [/pistacchi/, 'pistacchio'],
  [/tronky/, 'tronky'],
  [/crocchett/, 'crocchette'],
  [/calzon|panzerott/, 'calzoncini'],
  [/pittul/, 'pittule'],
  [/arancin/, 'arancini'],
];

export const keyOf = (name: string) => {
  const s = name.toLowerCase();
  for (const [re, k] of KEYS) if (re.test(s)) return k;
  return '';
};

/** Gradienti condivisi: montato una sola volta nella pagina. */
export function IngDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden>
      <defs>
        <linearGradient id="iGloss" x1="0" x2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".5" />
          <stop offset=".45" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="iPatty" cx=".45" cy=".35">
          <stop offset="0" stopColor="#8f4e2d" />
          <stop offset=".7" stopColor="#5b2e19" />
          <stop offset="1" stopColor="#3f1f10" />
        </radialGradient>
        <radialGradient id="iVeg" cx=".45" cy=".35">
          <stop offset="0" stopColor="#9aa64a" />
          <stop offset=".7" stopColor="#6b7a30" />
          <stop offset="1" stopColor="#4a5622" />
        </radialGradient>
        <radialGradient id="iFry" cx=".4" cy=".35">
          <stop offset="0" stopColor="#ffe08a" />
          <stop offset=".55" stopColor="#f0a838" />
          <stop offset="1" stopColor="#b86a17" />
        </radialGradient>
        <radialGradient id="iAranc" cx=".4" cy=".35">
          <stop offset="0" stopColor="#ffc56b" />
          <stop offset=".6" stopColor="#e68a24" />
          <stop offset="1" stopColor="#a8560f" />
        </radialGradient>
        <radialGradient id="iTom" cx=".38" cy=".35">
          <stop offset="0" stopColor="#ff7a63" />
          <stop offset=".6" stopColor="#e0301f" />
          <stop offset="1" stopColor="#a8170c" />
        </radialGradient>
        <linearGradient id="iLeaf" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#b6e86a" />
          <stop offset="1" stopColor="#5aa332" />
        </linearGradient>
        <linearGradient id="iDLeaf" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5fae3e" />
          <stop offset="1" stopColor="#2c6b1f" />
        </linearGradient>
        <linearGradient id="iCheese" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffc24f" />
          <stop offset="1" stopColor="#ec8410" />
        </linearGradient>
        <radialGradient id="iMozz" cx=".38" cy=".32">
          <stop offset="0" stopColor="#fff" />
          <stop offset=".6" stopColor="#f3f0e6" />
          <stop offset="1" stopColor="#d3cdb9" />
        </radialGradient>
        <linearGradient id="iScam" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f1c77a" />
          <stop offset="1" stopColor="#b26f27" />
        </linearGradient>
        <linearGradient id="iCeramic" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#cfd5dd" />
        </linearGradient>
        <linearGradient id="iTin" x1="0" x2="1">
          <stop offset="0" stopColor="#8a939c" />
          <stop offset=".4" stopColor="#eef1f4" />
          <stop offset="1" stopColor="#7d8690" />
        </linearGradient>
        <linearGradient id="iChili" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ff5a3c" />
          <stop offset="1" stopColor="#b3120a" />
        </linearGradient>
        <linearGradient id="iPepper" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8fd650" />
          <stop offset="1" stopColor="#3f8a1e" />
        </linearGradient>
      </defs>
    </svg>
  );
}

const sh = <ellipse cx="32" cy="57" rx="21" ry="3.5" fill="#000" opacity=".2" />;

const crumbs = (pts: [number, number][], c = '#c47a22') => pts.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="1.1" fill={i % 3 ? c : '#ffe9a8'} />);

const bottle = (body: string, cap: string, label: string, ink: string) => (
  <>
    {sh}
    <path d="M26 21 L28 12 H36 L38 21Z" fill={cap} />
    <rect x="30.5" y="4" width="3" height="9" rx="1.5" fill={cap} />
    <rect x="19" y="20" width="26" height="37" rx="8" fill={body} />
    <rect x="19" y="20" width="26" height="37" rx="8" fill="url(#iGloss)" />
    <rect x="20" y="32" width="24" height="13" rx="2" fill="#fff" opacity=".94" />
    <text x="32" y="41.5" fontSize={label.length > 5 ? 5.2 : label.length > 4 ? 6 : 8} fontWeight="900" textAnchor="middle" fill={ink} fontFamily="Arial, sans-serif">{label}</text>
  </>
);

const bowl = (content: string, top: ReactNode) => (
  <>
    {sh}
    <ellipse cx="32" cy="34" rx="25" ry="10" fill={content} />
    {top}
    <path d="M7 34 Q9 56 32 56 Q55 56 57 34 Q57 40 32 43 Q7 40 7 34Z" fill="url(#iCeramic)" />
    <path d="M7 34 Q9 56 32 56 Q55 56 57 34" fill="none" stroke="#b7bec8" strokeWidth="1" />
  </>
);

const jar = (content: string, label: string, ink: string) => (
  <>
    {sh}
    <rect x="15" y="20" width="34" height="37" rx="7" fill={content} />
    <rect x="15" y="20" width="34" height="37" rx="7" fill="url(#iGloss)" />
    <rect x="14" y="11" width="36" height="11" rx="3" fill="#fbfbfb" stroke="#d5d8dd" />
    <rect x="16" y="31" width="32" height="13" rx="2" fill="#fff" />
    <text x="32" y="40.5" fontSize={label.length > 6 ? 5.6 : 7} fontWeight="900" textAnchor="middle" fill={ink} fontFamily="Arial, sans-serif">{label}</text>
  </>
);

const leafRot = (d: string, fill: string, rib: string, angles: number[], cx = 32, cy = 54) =>
  angles.map((a, i) => (
    <g key={i} transform={`rotate(${a} ${cx} ${cy})`}>
      <path d={d} fill={fill} />
      <path d={`M${cx} ${cy} L${cx} 16`} stroke={rib} strokeWidth="1.3" opacity=".8" />
    </g>
  ));

const ART: Record<string, () => ReactNode> = {
  kebab: () => (
    <>
      {sh}
      <rect x="31" y="6" width="2.4" height="52" rx="1.2" fill="#9aa0a8" />
      <path d="M32 12 Q50 14 48 26 Q54 34 46 42 Q52 52 32 54 Q12 52 18 42 Q10 34 16 26 Q14 14 32 12Z" fill="#8d4a26" />
      {['M20 22 Q32 26 44 22', 'M17 32 Q32 37 47 32', 'M19 42 Q32 47 45 42'].map((d, i) => <path key={i} d={d} stroke="#c97b45" strokeWidth="3" fill="none" strokeLinecap="round" />)}
      <path d="M22 18 Q26 40 24 52" stroke="#5c2c12" strokeWidth="2" opacity=".5" fill="none" />
    </>
  ),
  condimenti: () => (
    <>
      {sh}
      {[[17, '#d9481e'], [32, '#f7e6a0'], [47, '#4f1f12']].map(([x, c], i) => (
        <g key={i}>
          <rect x={(x as number) - 7} y="24" width="14" height="32" rx="5" fill={c as string} />
          <rect x={(x as number) - 7} y="24" width="14" height="32" rx="5" fill="url(#iGloss)" />
          <rect x={(x as number) - 2.5} y="12" width="5" height="12" rx="2" fill={i === 1 ? '#e8c43a' : '#333'} />
          <rect x={(x as number) - 5} y="34" width="10" height="9" rx="1.5" fill="#fff" opacity=".9" />
        </g>
      ))}
    </>
  ),
  wurstel: () => (
    <>
      {sh}
      {[24, 40].map((y, i) => (
        <g key={i}>
          <rect x="6" y={y - 7} width="52" height="14" rx="7" fill="#d9766a" />
          <rect x="6" y={y - 7} width="52" height="14" rx="7" fill="url(#iGloss)" />
          {[16, 26, 36, 46].map((x) => <path key={x} d={`M${x} ${y - 6} L${x + 4} ${y + 6}`} stroke="#a64a40" strokeWidth="1.6" opacity=".6" />)}
        </g>
      ))}
    </>
  ),
  croccante: () => (
    <>
      {sh}
      {['M10 46 Q20 30 30 44', 'M18 50 Q30 24 44 46', 'M28 52 Q40 28 54 48', 'M14 40 Q24 22 36 34', 'M30 36 Q42 18 52 36', 'M20 52 Q34 40 50 52', 'M8 50 Q22 44 34 50'].map((d, i) => (
        <path key={i} d={d} stroke={i % 2 ? '#e2a03a' : '#f0be5a'} strokeWidth="4.2" fill="none" strokeLinecap="round" />
      ))}
    </>
  ),
  olio: () => (
    <>
      {sh}
      <path d="M26 20 L27 10 H37 L38 20 Q46 26 46 38 V52 Q46 57 41 57 H23 Q18 57 18 52 V38 Q18 26 26 20Z" fill="#7aa32a" />
      <path d="M26 20 L27 10 H37 L38 20 Q46 26 46 38 V52 Q46 57 41 57 H23 Q18 57 18 52 V38 Q18 26 26 20Z" fill="url(#iGloss)" />
      <rect x="27" y="5" width="10" height="7" rx="2" fill="#2f2f2f" />
      <rect x="21" y="36" width="22" height="13" rx="2" fill="#f5efd2" />
      <text x="32" y="45.5" fontSize="7" fontWeight="900" textAnchor="middle" fill="#55702c" fontFamily="Arial, sans-serif">OLIO</text>
    </>
  ),
  kinder: () => (
    <>
      {sh}
      <g transform="rotate(-14 32 34)">
        <rect x="6" y="22" width="48" height="19" rx="3" fill="#f3ead2" />
        <rect x="6" y="22" width="48" height="6" fill="#3b6fb6" />
        <text x="30" y="37" fontSize="7" fontWeight="900" textAnchor="middle" fill="#7a4a1e" fontFamily="Arial, sans-serif">BUENO</text>
      </g>
      <g transform="rotate(10 46 46)">
        <rect x="32" y="39" width="22" height="13" rx="2" fill="#5a2d14" />
        <rect x="34" y="42" width="18" height="2" fill="#f4dca0" />
        <rect x="34" y="47" width="18" height="2" fill="#f4dca0" />
      </g>
    </>
  ),
  granella: () =>
    bowl(
      '#e9c98c',
      [[18, 31], [26, 34], [34, 30], [42, 34], [48, 31], [22, 28], [38, 36], [30, 37]].map(([x, y], i) => (
        <rect key={i} x={x} y={y} width="5" height="4" rx="1.2" fill={i % 2 ? '#c88a44' : '#a8691f'} transform={`rotate(${i * 25} ${x} ${y})`} />
      )),
    ),
  scaglie: () => (
    <>
      {sh}
      {[[16, 40, -20], [28, 32, 15], [40, 42, -8], [24, 48, 30], [46, 32, 22], [34, 24, -30], [14, 28, 10]].map(([x, y, r], i) => (
        <path key={i} d={`M${x} ${y} l9 -3 l3 6 l-7 5 l-6 -2z`} fill={i % 2 ? '#fffdf5' : '#f4eedb'} stroke="#d8cfb4" strokeWidth=".8" transform={`rotate(${r} ${x} ${y})`} />
      ))}
    </>
  ),
  patty: () => (
    <>
      {sh}
      <ellipse cx="32" cy="40" rx="25" ry="11" fill="#3a1c0e" />
      <ellipse cx="32" cy="35" rx="25" ry="11" fill="url(#iPatty)" />
      <path d="M15 32 H49 M13 37 H51" stroke="#2a1208" strokeWidth="2.4" strokeLinecap="round" opacity=".75" />
      {crumbs([[22, 29], [38, 30], [30, 41], [44, 40], [18, 40]], '#b5683a')}
    </>
  ),
  veggie: () => (
    <>
      {sh}
      <ellipse cx="32" cy="40" rx="25" ry="11" fill="#3d4a1a" />
      <ellipse cx="32" cy="35" rx="25" ry="11" fill="url(#iVeg)" />
      {[[20, 32, '#f39c34'], [30, 30, '#c9e86a'], [40, 34, '#f39c34'], [26, 38, '#e4f2a0'], [44, 39, '#c9e86a'], [35, 41, '#f6b24a'], [16, 36, '#e4f2a0']].map(([x, y, c], i) => (
        <circle key={i} cx={x as number} cy={y as number} r="1.7" fill={c as string} />
      ))}
    </>
  ),
  pulled: () => (
    <>
      {sh}
      <path d="M7 50 Q12 28 32 25 Q52 28 57 50Z" fill="#6e3519" />
      {['M11 48 Q19 34 30 39', 'M18 50 Q28 30 44 37', 'M28 49 Q40 33 53 44', 'M15 42 Q25 30 36 31', 'M33 34 Q44 27 51 38', 'M22 46 Q32 38 40 44', 'M38 48 Q46 40 54 47'].map((d, i) => (
        <path key={i} d={d} fill="none" stroke={i % 2 ? '#a85c32' : '#c97b45'} strokeWidth="2.6" strokeLinecap="round" />
      ))}
      <path d="M20 36 Q32 30 44 35" stroke="#7a1e0c" strokeWidth="3" opacity=".45" fill="none" strokeLinecap="round" />
    </>
  ),
  cotoletta: () => (
    <>
      {sh}
      <path d="M7 37 Q9 21 30 21 Q53 19 57 34 Q59 50 34 51 Q9 53 7 37Z" fill="url(#iFry)" />
      {crumbs([[16, 31], [24, 27], [34, 26], [44, 28], [50, 35], [20, 41], [30, 37], [40, 42], [48, 44], [14, 38], [27, 46], [36, 33]])}
    </>
  ),
  nuggets: () => (
    <>
      {sh}
      {[[20, 42, 12, 10], [42, 43, 13, 10], [31, 28, 12, 10]].map(([x, y, rx, ry], i) => (
        <g key={i}>
          <path d={`M${x - rx} ${y} Q${x - rx} ${y - ry} ${x} ${y - ry} Q${x + rx + 2} ${y - ry + 1} ${x + rx} ${y + 1} Q${x + rx - 1} ${y + ry} ${x} ${y + ry} Q${x - rx - 1} ${y + ry - 1} ${x - rx} ${y}Z`} fill="url(#iFry)" />
          {crumbs([[x - 4, y - 3], [x + 4, y - 4], [x + 2, y + 3], [x - 5, y + 4]])}
        </g>
      ))}
    </>
  ),
  tenders: () => (
    <>
      {sh}
      <rect x="8" y="22" width="44" height="14" rx="7" fill="url(#iFry)" transform="rotate(-14 30 29)" />
      <rect x="14" y="38" width="42" height="14" rx="7" fill="url(#iFry)" transform="rotate(-6 35 45)" />
      {crumbs([[15, 33], [24, 28], [34, 25], [43, 22], [22, 46], [32, 44], [42, 43], [50, 41], [28, 31]])}
    </>
  ),
  bacon: () => (
    <>
      {sh}
      {[0, 16].map((dy, i) => (
        <g key={i} transform={`translate(0 ${dy})`}>
          <path d="M5 22 Q15 14 25 22 T45 22 T59 20 L59 30 Q49 36 39 30 T19 30 T5 32Z" fill="#b8352c" />
          <path d="M6 27 Q16 20 26 27 T46 27 T58 25" stroke="#f7cdb8" strokeWidth="3" fill="none" />
          <path d="M6 31 Q16 25 26 31 T46 31 T58 29" stroke="#8c1f18" strokeWidth="1.4" fill="none" opacity=".6" />
        </g>
      ))}
    </>
  ),
  crudo: () => (
    <>
      {sh}
      <path d="M6 42 Q12 18 32 16 Q53 18 58 38 Q52 52 32 50 Q14 53 6 42Z" fill="#e17f86" />
      <path d="M6 42 Q12 18 32 16 Q53 18 58 38" stroke="#fde9e2" strokeWidth="4.5" fill="none" />
      <path d="M14 40 Q26 28 46 34 M18 46 Q30 38 50 42" stroke="#f2adb1" strokeWidth="1.6" fill="none" />
      <path d="M30 50 Q36 38 52 36 Q56 44 48 49 Q40 52 30 50Z" fill="#cc5e68" opacity=".7" />
    </>
  ),
  bresaola: () => (
    <>
      {sh}
      {[[22, 30], [42, 32], [31, 44]].map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="13" fill="#7e1424" stroke="#a63142" strokeWidth="1.6" />
          <path d={`M${x - 7} ${y - 3} Q${x} ${y - 6} ${x + 6} ${y + 1}`} stroke="#c25563" strokeWidth="1" fill="none" opacity=".7" />
        </g>
      ))}
    </>
  ),
  porchetta: () => (
    <>
      {sh}
      <circle cx="32" cy="33" r="23" fill="#7d3f17" />
      <circle cx="32" cy="33" r="18" fill="#f0c4ab" />
      <path d="M32 33 a3 3 0 1 1 3 3 a6 6 0 1 1 -6 -6 a9 9 0 1 1 9 9 a12 12 0 1 1 -12 -12" stroke="#c6896a" strokeWidth="2" fill="none" />
      {[[26, 26], [38, 30], [30, 40], [40, 39], [24, 35]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="1.2" fill="#4f8a2a" />)}
      <circle cx="32" cy="33" r="23" fill="none" stroke="#5a2a0e" strokeWidth="2" />
    </>
  ),
  tonno: () => (
    <>
      {sh}
      <path d="M11 31 V45 Q32 57 53 45 V31Z" fill="url(#iTin)" />
      <ellipse cx="32" cy="31" rx="21" ry="8" fill="#c9cfd6" />
      <ellipse cx="32" cy="31" rx="18" ry="6" fill="#e5c3a2" />
      {[[24, 30], [32, 28], [40, 31], [28, 33], [36, 33]].map(([x, y], i) => <ellipse key={i} cx={x} cy={y} rx="3.5" ry="2" fill={i % 2 ? '#f3dcc5' : '#d4a081'} />)}
      <path d="M11 38 Q32 48 53 38" stroke="#c8202a" strokeWidth="4" fill="none" />
    </>
  ),
  cheddar: () => (
    <>
      {sh}
      <path d="M10 18 H52 V44 Q48 52 44 46 Q40 52 36 46 H10Z" fill="url(#iCheese)" />
      <path d="M52 18 L42 18 L52 28Z" fill="#c96a0a" opacity=".55" />
      <rect x="10" y="18" width="42" height="28" fill="url(#iGloss)" opacity=".5" />
    </>
  ),
  mozz: () => (
    <>
      {sh}
      <circle cx="23" cy="38" r="15" fill="url(#iMozz)" />
      <circle cx="43" cy="35" r="13" fill="url(#iMozz)" />
      <ellipse cx="18" cy="32" rx="4" ry="2.5" fill="#fff" />
      <ellipse cx="39" cy="30" rx="3.5" ry="2" fill="#fff" />
    </>
  ),
  stracc: () =>
    bowl(
      '#f8f5ec',
      ['M14 32 Q22 28 30 33', 'M26 30 Q34 26 44 31', 'M36 34 Q44 30 52 33', 'M18 36 Q30 32 40 37'].map((d, i) => (
        <path key={i} d={d} stroke="#e0d8c4" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      )),
    ),
  scamorza: () => (
    <>
      {sh}
      <path d="M32 11 Q36 11 36 17 Q51 25 51 41 Q51 57 32 57 Q13 57 13 41 Q13 25 28 17 Q28 11 32 11Z" fill="url(#iScam)" />
      <path d="M27 18 Q32 21 37 18 M27 15 Q32 18 37 15" stroke="#f6ead0" strokeWidth="1.6" fill="none" />
      <ellipse cx="23" cy="36" rx="4" ry="7" fill="#fff" opacity=".35" />
    </>
  ),
  grana: () => (
    <>
      {sh}
      <path d="M6 42 L46 20 L58 28 L18 52Z" fill="#f4df96" />
      <path d="M18 52 L58 28 L58 36 L18 58Z" fill="#e2c063" />
      <path d="M6 42 L18 52 L18 58 L6 49Z" fill="#c99a3c" />
      <path d="M46 20 L58 28 L58 36" stroke="#b9862e" strokeWidth="3" fill="none" />
      {[[20, 40], [28, 36], [36, 31], [24, 45], [34, 40], [42, 33], [30, 46]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r=".9" fill="#d3b061" />)}
    </>
  ),
  insalata: () => (
    <>
      {sh}
      <path d="M32 56 Q6 52 8 30 Q12 12 32 10 Q52 12 56 30 Q58 52 32 56Z" fill="url(#iLeaf)" />
      <path d="M32 56 Q14 48 16 32 Q20 18 32 18 Q44 18 48 32 Q50 48 32 56Z" fill="#c9f08a" opacity=".75" />
      {['M32 56 L32 18', 'M32 46 L18 30', 'M32 46 L46 30', 'M32 38 L22 22', 'M32 38 L42 22'].map((d, i) => (
        <path key={i} d={d} stroke="#eefbd8" strokeWidth="1.4" opacity=".9" />
      ))}
      <path d="M8 30 Q12 12 32 10 Q52 12 56 30" stroke="#7cc04a" strokeWidth="2" strokeDasharray="3 2" fill="none" />
    </>
  ),
  valeriana: () => (
    <>
      {sh}
      {[0, 51, 102, 153, 204, 255, 306].map((a, i) => (
        <g key={i} transform={`rotate(${a} 32 34)`}>
          <ellipse cx="32" cy="21" rx="6.5" ry="11" fill="url(#iDLeaf)" />
          <path d="M32 34 L32 14" stroke="#9fd97a" strokeWidth="1" />
        </g>
      ))}
      <circle cx="32" cy="34" r="4" fill="#8ccf5c" />
    </>
  ),
  rucola: () => (
    <>
      {sh}
      {leafRot(
        'M32 54 L30 44 Q22 44 24 38 Q17 36 22 30 Q16 26 22 22 Q20 14 28 14 Q30 8 34 12 Q40 10 40 18 Q46 20 42 26 Q48 30 42 34 Q46 40 38 40 Q36 46 34 44Z',
        '#3d8a2a',
        '#a6d47a',
        [-30, 0, 30],
      )}
    </>
  ),
  pomodoro: () => (
    <>
      {sh}
      <circle cx="32" cy="33" r="23" fill="#c9241a" />
      <circle cx="32" cy="33" r="19" fill="#f04a35" />
      {[0, 90, 180, 270].map((a) => (
        <g key={a} transform={`rotate(${a} 32 33)`}>
          <ellipse cx="32" cy="22" rx="6" ry="7" fill="#ff8a6e" />
          <circle cx="30.5" cy="22" r="1.1" fill="#f8e5a0" />
          <circle cx="33.5" cy="24" r="1.1" fill="#f8e5a0" />
        </g>
      ))}
      <circle cx="32" cy="33" r="4" fill="#ffb7a3" />
    </>
  ),
  pomodorini: () => (
    <>
      {sh}
      {[[20, 40], [43, 41], [31, 26]].map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="12" fill="url(#iTom)" />
          <path d={`M${x} ${y - 13} l2 3 l4 -1 l-3 3 l2 3 l-5 -2 l-5 2 l2 -3 l-3 -3 l4 1z`} fill="#3f8a2a" />
          <ellipse cx={x - 4} cy={y - 3} rx="3" ry="2" fill="#fff" opacity=".45" />
        </g>
      ))}
    </>
  ),
  secchi: () => (
    <>
      {sh}
      {[
        'M8 34 Q12 22 24 24 Q32 28 28 38 Q20 46 10 42Z',
        'M30 24 Q42 16 52 24 Q58 34 48 40 Q36 42 32 34Z',
        'M18 44 Q28 36 40 42 Q46 52 34 55 Q20 56 18 44Z',
      ].map((d, i) => (
        <g key={i}>
          <path d={d} fill="#861815" />
          <path d={d} fill="none" stroke="#5a0c0c" strokeWidth="1.2" strokeDasharray="4 3" />
        </g>
      ))}
      <path d="M14 30 Q18 27 22 29 M36 24 Q42 21 46 25 M26 46 Q30 43 36 46" stroke="#d9473a" strokeWidth="1.6" fill="none" opacity=".8" />
    </>
  ),
  peperoncino: () => (
    <>
      {sh}
      <path d="M15 21 Q9 36 24 47 Q37 57 54 52 Q41 46 33 38 Q23 28 23 19Z" fill="url(#iChili)" />
      <path d="M15 21 Q15 12 22 11 Q20 16 23 19" stroke="#3c8a2a" strokeWidth="4" strokeLinecap="round" fill="none" />
      <path d="M17 28 Q19 38 28 44" stroke="#ffb1a1" strokeWidth="1.8" fill="none" opacity=".7" strokeLinecap="round" />
    </>
  ),
  frigitelli: () => (
    <>
      {sh}
      {[0, 14].map((dy, i) => (
        <g key={i} transform={`translate(${i * 4} ${dy})`}>
          <path d="M10 22 Q30 15 50 28 Q57 34 52 38 Q34 33 12 30 Q5 26 10 22Z" fill="url(#iPepper)" />
          <path d="M10 22 Q6 18 4 20" stroke="#2d6b16" strokeWidth="3" strokeLinecap="round" fill="none" />
          <path d="M16 23 Q30 20 44 27" stroke="#c9f08a" strokeWidth="1.3" fill="none" opacity=".8" />
        </g>
      ))}
    </>
  ),
  anelli: () => (
    <>
      {sh}
      {[[22, 40], [42, 40], [32, 26]].map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="11" fill="none" stroke="url(#iFry)" strokeWidth="8" />
          <circle cx={x} cy={y} r="7" fill="none" stroke="#f6f0d8" strokeWidth="1.2" opacity=".7" />
          {crumbs([[x - 8, y - 6], [x + 7, y - 7], [x + 9, y + 5], [x - 6, y + 9]])}
        </g>
      ))}
    </>
  ),
  olive: () => (
    <>
      {sh}
      {[[20, 40, -20], [42, 40, 15], [31, 26, -5]].map(([x, y, r], i) => (
        <g key={i} transform={`rotate(${r} ${x} ${y})`}>
          <ellipse cx={x} cy={y} rx="9" ry="12" fill="#2b1a2e" />
          <ellipse cx={x - 3} cy={y - 4} rx="2.5" ry="4" fill="#7a6680" opacity=".8" />
        </g>
      ))}
    </>
  ),
  patate: () => (
    <>
      {sh}
      {[
        'M8 44 L22 30 L30 40 L18 52Z',
        'M24 50 L32 30 L42 36 L36 54Z',
        'M38 46 L46 26 L56 34 L50 50Z',
        'M16 34 L26 18 L34 26 L24 38Z',
      ].map((d, i) => (
        <g key={i}>
          <path d={d} fill="#e2a03a" />
          <path d={d} fill="url(#iGloss)" opacity=".6" />
        </g>
      ))}
      {['M20 24 l4 -2', 'M40 30 l3 3', 'M14 46 l4 1', 'M44 44 l3 -3'].map((d, i) => <path key={i} d={d} stroke="#2f6b1f" strokeWidth="1.6" strokeLinecap="round" />)}
    </>
  ),
  patatine: () => (
    <>
      {sh}
      {[16, 22, 28, 34, 40, 46].map((x, i) => (
        <rect key={i} x={x} y={10 + (i % 3) * 4} width="5" height="30" rx="1.5" fill={i % 2 ? '#f7c948' : '#f2b632'} transform={`rotate(${(i - 2.5) * 5} ${x} 40)`} />
      ))}
      <path d="M12 30 H52 L47 57 H17Z" fill="#d62f2f" />
      <path d="M12 30 H52 L51 35 H13Z" fill="#a51f1f" />
      <path d="M26 42 Q32 50 38 42" stroke="#ffd24a" strokeWidth="3" fill="none" strokeLinecap="round" />
    </>
  ),
  funghi: () =>
    bowl(
      '#b88d63',
      <>
        <path d="M22 32 Q22 24 30 24 Q38 24 38 32Z" fill="#7a4e2c" />
        <rect x="28" y="31" width="4" height="5" rx="1" fill="#ead6b6" />
        <path d="M38 33 Q38 28 43 28 Q48 28 48 33Z" fill="#8a5a36" />
        {[[16, 34], [50, 35], [34, 37]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="1" fill="#3f7a22" />)}
      </>,
    ),
  bosc: () =>
    bowl(
      '#ecc0a6',
      <>
        <path d="M16 32 Q16 27 21 27 Q26 27 26 32Z" fill="#7a4e2c" />
        <path d="M38 31 Q38 26 43 26 Q48 26 48 31Z" fill="#7a4e2c" />
        {[[30, 30], [34, 35], [24, 36], [44, 35]].map(([x, y], i) => <rect key={i} x={x} y={y} width="4" height="3.5" rx=".8" fill="#e5788a" />)}
        {[[28, 36], [40, 32]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="1.8" fill="#6db33f" />)}
      </>,
    ),
  guac: () =>
    bowl(
      '#86b23e',
      <>
        {[[18, 32], [26, 35], [36, 31], [44, 34], [30, 29], [22, 29], [40, 36]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="2.4" fill="#6f9a2e" />)}
        {[[24, 31], [38, 34], [46, 31]].map(([x, y], i) => <rect key={i} x={x} y={y} width="3" height="3" rx=".6" fill="#e03b2a" />)}
        {[[32, 34], [17, 35]].map(([x, y], i) => <rect key={i} x={x} y={y} width="3" height="2" rx=".6" fill="#f4f1e1" />)}
      </>,
    ),
  mayo: () => bottle('#f7e6a0', '#e8c43a', 'MAYO', '#b08a12'),
  sburger: () => bottle('#ef855a', '#d9481e', 'BURGER', '#c2410c'),
  bbq: () => bottle('#4f1f12', '#222', 'BBQ', '#5a2414'),
  cesar: () => bottle('#eee7cf', '#6a8a3a', 'CAESAR', '#55702c'),
  nutella: () => jar('#3b1d0e', 'NUTELLA', '#c8102e'),
  nutbianca: () => jar('#f1e7d2', 'BIANCA', '#8a6a3a'),
  nocciola: () => (
    <>
      {sh}
      {[[20, 42], [42, 42], [31, 26]].map(([x, y], i) => (
        <g key={i}>
          <path d={`M${x} ${y - 13} Q${x + 12} ${y - 6} ${x + 11} ${y + 4} Q${x} ${y + 12} ${x - 11} ${y + 4} Q${x - 12} ${y - 6} ${x} ${y - 13}Z`} fill="#93531f" />
          <path d={`M${x - 11} ${y + 2} Q${x} ${y + 12} ${x + 11} ${y + 2} Q${x} ${y + 6} ${x - 11} ${y + 2}Z`} fill="#d9b07a" />
          <ellipse cx={x - 4} cy={y - 5} rx="2.5" ry="4" fill="#c27a3c" opacity=".8" />
        </g>
      ))}
    </>
  ),
  pistacchio: () =>
    bowl(
      '#a3c35a',
      <>
        {[[22, 30, -20], [40, 31, 25]].map(([x, y, r], i) => (
          <g key={i} transform={`rotate(${r} ${x} ${y})`}>
            <ellipse cx={x} cy={y} rx="6" ry="4" fill="#e9d9b5" />
            <ellipse cx={x} cy={y} rx="3.6" ry="2.6" fill="#7fb03a" />
          </g>
        ))}
      </>,
    ),
  tronky: () => (
    <>
      {sh}
      <g transform="rotate(-12 32 34)">
        <rect x="6" y="24" width="40" height="18" rx="3" fill="#d61f26" />
        <rect x="6" y="30" width="40" height="5" fill="#ffd24a" />
        <text x="26" y="34.2" fontSize="5" fontWeight="900" textAnchor="middle" fill="#d61f26" fontFamily="Arial, sans-serif">TRONKY</text>
        <path d="M6 24 l-3 2 v14 l3 2 M46 24 l3 2 v14 l-3 2" stroke="#a0161b" strokeWidth="1.5" fill="none" />
      </g>
      <g transform="rotate(10 50 46)">
        <rect x="40" y="38" width="18" height="12" rx="2" fill="#5a2d14" />
        {[40.5, 43, 45.5].map((y) => <rect key={y} x="41" y={y} width="16" height="1.3" fill="#e8c88e" />)}
      </g>
    </>
  ),
  crocchette: () => (
    <>
      {sh}
      <rect x="6" y="20" width="36" height="15" rx="7.5" fill="url(#iFry)" transform="rotate(-10 24 27)" />
      <rect x="20" y="36" width="36" height="15" rx="7.5" fill="url(#iFry)" transform="rotate(8 38 43)" />
      <ellipse cx="55" cy="46" rx="4" ry="7" fill="#f8e7b0" transform="rotate(8 38 43)" />
      {crumbs([[14, 28], [22, 24], [32, 22], [28, 42], [38, 44], [46, 46], [18, 30]])}
    </>
  ),
  calzoncini: () => (
    <>
      {sh}
      {[[0, 0], [10, 14]].map(([dx, dy], i) => (
        <g key={i} transform={`translate(${dx - 4} ${dy - 4})`}>
          <path d="M8 40 Q8 18 30 18 Q52 18 52 40Z" fill="url(#iFry)" />
          <path d="M9 40 H51" stroke="#c98226" strokeWidth="4" strokeDasharray="2.5 2" />
          {crumbs([[20, 28], [32, 25], [42, 30]])}
        </g>
      ))}
    </>
  ),
  pittule: () => (
    <>
      {sh}
      {[[19, 43, 12], [43, 42, 12], [31, 27, 12], [33, 45, 8]].map(([x, y, r], i) => (
        <g key={i}>
          <path d={`M${x - r} ${y} Q${x - r - 1} ${y - r + 2} ${x - 3} ${y - r} Q${x + 2} ${y - r - 2} ${x + r - 2} ${y - r + 3} Q${x + r + 2} ${y} ${x + r - 1} ${y + 4} Q${x + 3} ${y + r + 1} ${x - 2} ${y + r - 1} Q${x - r} ${y + r - 2} ${x - r} ${y}Z`} fill="url(#iFry)" />
          <circle cx={x - 3} cy={y - 4} r="2.5" fill="#fff3c4" opacity=".7" />
        </g>
      ))}
    </>
  ),
  arancini: () => (
    <>
      {sh}
      {[[19, 44], [43, 44], [31, 28]].map(([x, y], i) => (
        <g key={i}>
          <path d={`M${x} ${y - 14} Q${x + 12} ${y - 2} ${x + 10} ${y + 6} Q${x} ${y + 13} ${x - 10} ${y + 6} Q${x - 12} ${y - 2} ${x} ${y - 14}Z`} fill="url(#iAranc)" />
          {crumbs([[x - 4, y - 2], [x + 3, y - 6], [x + 5, y + 4], [x - 3, y + 6], [x, y]], '#a8560f')}
        </g>
      ))}
    </>
  ),
};

function Fallback({ name }: { name: string }) {
  return (
    <>
      {sh}
      <circle cx="32" cy="34" r="22" fill="url(#iCeramic)" stroke="#b7bec8" />
      <text x="32" y="41" fontSize="20" fontWeight="900" textAnchor="middle" fill="#6b6385" fontFamily="Arial, sans-serif">
        {name.trim().slice(0, 2).toUpperCase()}
      </text>
    </>
  );
}

/** "3 crocchette" -> disegno della crocchetta + badge "×3"; "8 pezzi" -> badge numerico. */
export function IngSvg({ name, className = '' }: { name: string; className?: string }) {
  const m = name.trim().match(/^(\d+(?:\/\d+)?)\s+(.+)$/);
  const count = m ? m[1] : null;
  const base = m ? m[2] : name;
  const key = keyOf(base);
  const onlyCount = count && /^pezz/i.test(base);
  return (
    <svg viewBox="0 0 64 64" className={`ing ${className}`} role="img" aria-label={name}>
      {onlyCount ? (
        <>
          {sh}
          <circle cx="32" cy="32" r="24" fill="#ffd24a" stroke="#e0a800" strokeWidth="3" />
          <text x="32" y="38" fontSize={count!.length > 2 ? 16 : 22} fontWeight="900" textAnchor="middle" fill="#5a3b00" fontFamily="Arial, sans-serif">{count}</text>
          <text x="32" y="50" fontSize="8" fontWeight="900" textAnchor="middle" fill="#5a3b00" fontFamily="Arial, sans-serif">PZ</text>
        </>
      ) : (
        <>
          {ART[key] ? ART[key]() : <Fallback name={base} />}
          {count && (
            <g>
              <rect x={64 - (count.length * 6 + 12)} y="0" width={count.length * 6 + 12} height="17" rx="8.5" fill="#1a1030" stroke="#ffd24a" strokeWidth="1.5" />
              <text x={64 - (count.length * 6 + 12) / 2} y="12.5" fontSize="11" fontWeight="900" textAnchor="middle" fill="#ffd24a" fontFamily="Arial, sans-serif">×{count}</text>
            </g>
          )}
        </>
      )}
    </svg>
  );
}

/** icona dell'ingrediente: render del modello 3D se c'è WebGL, altrimenti il disegno SVG */
export function Ing({ name, className = '' }: { name: string; className?: string }) {
  return hasWebGL() ? <Ing3D name={name} className={className} /> : <IngSvg name={name} className={className} />;
}

function Ing3D({ name, className }: { name: string; className: string }) {
  const url = useThumb(name);
  return url ? <img className={`ing ${className}`} src={url} alt="" draggable={false} /> : <span className={`ing ing-wait ${className}`} />;
}

/** il piatto finito in 3D (senza WebGL: l'icona della categoria) */
export function DishPic({ dish, className = '' }: { dish: { ingredients: string[]; category: string }; className?: string }) {
  if (!hasWebGL()) return <IngSvg name={CAT_FALLBACK[dish.category] ?? dish.ingredients[0] ?? ''} className={`dish ${className}`} />;
  return <DishPic3D dish={dish} className={className} />;
}

const CAT_FALLBACK: Record<string, string> = { hamburger: 'hamburger', insalatone: 'insalata', focacce: 'cotoletta', classiche: 'pomodoro', speciali: 'funghi porcini', dolci: 'nutella', fritti: 'patatine' };

function DishPic3D({ dish, className }: { dish: { ingredients: string[]; category: string }; className: string }) {
  const url = useDishThumb(dish.ingredients, dish.category);
  return url ? <img className={`ing dish ${className}`} src={url} alt="" draggable={false} /> : <span className={`ing dish ing-wait ${className}`} />;
}
