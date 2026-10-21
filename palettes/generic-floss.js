// Generic 24-color embroidery floss palette (house codes F01-F24).
//
// These are GENERIC codes, not DMC or Anchor numbers, and the RGB values
// are representative screen values only. To work with real floss, map
// these codes to DMC/Anchor numbers with your own conversion table, or
// pass a custom palette in the same shape:
// [{ code, name, rgb: [r, g, b] }] — see README "Bring your own palette".

function hex(h) {
  return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
}

const RAW = [
  ['F01', 'Snow White', '#FAF9F6'],
  ['F02', 'Ecru', '#E8DCC4'],
  ['F03', 'Black', '#1C1C1E'],
  ['F04', 'Charcoal', '#4A4A4F'],
  ['F05', 'Pewter Grey', '#8E8E93'],
  ['F06', 'Christmas Red', '#C1272D'],
  ['F07', 'Scarlet', '#D92323'],
  ['F08', 'Burgundy', '#7B2230'],
  ['F09', 'Baby Pink', '#F6CBD3'],
  ['F10', 'Rose', '#E56B8C'],
  ['F11', 'Coral', '#F4845F'],
  ['F12', 'Tangerine', '#F08A24'],
  ['F13', 'Peach', '#F7B267'],
  ['F14', 'Lemon Yellow', '#F7E463'],
  ['F15', 'Golden Yellow', '#F2B234'],
  ['F16', 'Leaf Green', '#5DA24A'],
  ['F17', 'Forest Green', '#2E6B34'],
  ['F18', 'Sage', '#A9BC9B'],
  ['F19', 'Teal', '#2A8C82'],
  ['F20', 'Sky Blue', '#7EC3EE'],
  ['F21', 'Royal Blue', '#2B5EA7'],
  ['F22', 'Navy', '#22355E'],
  ['F23', 'Purple', '#7B4BA8'],
  ['F24', 'Chocolate Brown', '#6F4E37'],
];

export const genericFloss = RAW.map(([code, name, h]) => ({ code, name, rgb: hex(h) }));
export default genericFloss;
