export const TINTS = ["mint", "peach", "sky", "lilac", "lemon", "coral", "teal"] as const
export type Tint = (typeof TINTS)[number]

export function tintFor(index: number): Tint {
  return TINTS[index % TINTS.length]
}
