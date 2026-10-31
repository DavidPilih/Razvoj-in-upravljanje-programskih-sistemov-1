// Knight titles follow ELO (everyone starts at 1000), so a title can also be lost.
export const titles = [
  { name: 'Paž', rating: 0 },
  { name: 'Oproda', rating: 1050 },
  { name: 'Vitez', rating: 1150 },
  { name: 'Baron', rating: 1300 },
  { name: 'Grof', rating: 1500 },
  { name: 'Vojvoda', rating: 1750 },
]

export function titleFor(rating) {
  const index = titles.findLastIndex(title => rating >= title.rating)
  return { current: titles[Math.max(index, 0)], next: titles[index + 1] }
}
