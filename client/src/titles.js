// Knight titles earned with total points (50 per correct answer).
export const titles = [
  { name: 'Paž', points: 0 },
  { name: 'Oproda', points: 500 },
  { name: 'Vitez', points: 1500 },
  { name: 'Baron', points: 3000 },
  { name: 'Grof', points: 5000 },
  { name: 'Vojvoda', points: 10000 },
]

export function titleFor(points) {
  const index = titles.findLastIndex(title => points >= title.points)
  return { current: titles[Math.max(index, 0)], next: titles[index + 1] }
}
