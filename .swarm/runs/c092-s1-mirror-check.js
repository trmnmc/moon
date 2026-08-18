const london = '░░░█◗'
const samoa = '◖█░░░'

const literalSwap = new Map([['▐', '▌'], ['▌', '▐'], ['▏', '▕'], ['▕', '▏']])
function mirrorLiteral (s) {
  const chars = [...s].map((ch) => literalSwap.get(ch) || ch)
  chars.reverse()
  return chars.join('')
}

const appSwap = new Map([['◖', '◗'], ['◗', '◖'], ['▏', '▕'], ['▕', '▏'], ['▌', '▐'], ['▐', '▌']])
function mirrorApp (s) {
  const chars = [...s].map((ch) => appSwap.get(ch) || ch)
  chars.reverse()
  return chars.join('')
}

console.log('london:', JSON.stringify(london), [...london].map((c) => c.codePointAt(0).toString(16)))
console.log('mirror(london) literal spec transform:', JSON.stringify(mirrorLiteral(london)))
console.log('mirror(london) app-actual transform  :', JSON.stringify(mirrorApp(london)))
console.log('samoa row                             :', JSON.stringify(samoa))
console.log('literal mirror == samoa?', mirrorLiteral(london) === samoa)
console.log('app mirror == samoa?', mirrorApp(london) === samoa)
console.log('samoa === raw london unmirrored (FAIL SIGNATURE)?', samoa === london)
