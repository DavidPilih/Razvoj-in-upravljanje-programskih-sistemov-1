// "+16 ELO" / "-5 ELO"
export function formatElo(change) {
  return `${change > 0 ? '+' : ''}${change} ELO`
}
