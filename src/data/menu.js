// Flavor colors are PLACEHOLDERS (guesses). TODO: replace each hex with a color sampled from a photo of the real syrup in a clear cup.
// All flavor colors stay in this file only.
export const BASES = [
  { id: 'sala',      name: 'Sala',          hex: '#C81D3E', local: true,  blurb: 'A deep red base.' },      // TODO: confirm color (red?) and write a real tasting line
  { id: 'passion',   name: 'Passion Fruit', hex: '#F2A22C', local: true,  blurb: 'A golden, tangy base.' }, // TODO: tasting line
  { id: 'kiwi',      name: 'Kiwi',          hex: '#7CC242', local: false, blurb: 'A bright green base.' },  // TODO: tasting line
  { id: 'blueberry', name: 'Blueberry',     hex: '#4B4BC8', local: false, blurb: 'A deep blue base.' },     // TODO: tasting line
];
export const TOPS = [
  { id: 'pomelo',     name: 'Pomelo',     hex: '#F6A7B8', local: true,  blurb: 'A soft pink top.' },    // TODO: tasting lines for all tops
  { id: 'grape',      name: 'Grape',      hex: '#7A3EA1', local: false, blurb: 'A rich purple top.' },
  { id: 'dalandan',   name: 'Dalandan',   hex: '#F5832A', local: true,  blurb: 'A citrus orange top.' },
  { id: 'mango',      name: 'Mango',      hex: '#FFC233', local: true,  blurb: 'A sunny gold top.' },
  { id: 'strawberry', name: 'Strawberry', hex: '#F0465C', local: true,  blurb: 'A red-pink top.' },
  { id: 'melon',      name: 'Melon',      hex: '#93DC7E', local: true,  blurb: 'A fresh green top.' },   // TODO: confirm green melon, not cantaloupe
];

// Layer rule. 'base': the base syrup ends at the bottom and the poured top ends above it.
// 'top': the poured syrup sinks to the bottom.
// ASSUMPTION: default 'base' (matches the Sunrise and Dawn photos). TODO: owner confirms Trip to Baguio, whose photo shows the red top at the bottom.
export const DEFAULT_LAYERING = 'base';

// Dawn is base Blueberry + top Melon (the study writes it "Melon + Blueberry").
export const SIGNATURES = [
  { id: 'sunrise', name: 'Sunrise',        base: 'sala',      top: 'mango',      line: 'Red sala, then gold mango.',                       story: 'Red into gold.',                layering: 'base' },
  { id: 'dawn',    name: 'Dawn',           base: 'blueberry', top: 'melon',      line: 'Blueberry and melon. Blue going green.',           story: 'Deep blue meeting soft green.', layering: 'base' },
  { id: 'baguio',  name: 'Trip to Baguio', base: 'kiwi',      top: 'strawberry', line: 'Kiwi and strawberry. Pine green with a red rush.', story: 'Green with a red rush.',        layering: 'top' }  // ASSUMPTION: matches the owner's Trip to Baguio images (red at the bottom). TODO: confirm.,
];

export const byId = (list, id) => list.find((x) => x.id === id);
export const getBase = (id) => byId(BASES, id);
export const getTop = (id) => byId(TOPS, id);
export const findSignature = (base, top) => SIGNATURES.find((s) => s.base === base && s.top === top);
export const comboName = (base, top) => findSignature(base, top)?.name ?? 'Your Way';
export const TOTAL_COMBOS = BASES.length * TOPS.length;
