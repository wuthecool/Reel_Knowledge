'use server'

import config from '@/payload.config'
import { getPayload } from 'payload'

export type InventoryCatch = {
  id: string | number
  fishName: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  points: number
  caughtAt: string
}

const validToken = (value: string) => /^[a-zA-Z0-9-]{16,80}$/.test(value)

export async function getInventory(playerToken: string): Promise<InventoryCatch[]> {
  if (!validToken(playerToken)) return []
  const payload = await getPayload({ config })
  const result = await payload.find({
    collection: 'catches',
    overrideAccess: false,
    where: { playerToken: { equals: playerToken } },
    limit: 50,
    sort: '-createdAt',
  })
  return result.docs.map((doc) => ({
    id: doc.id,
    fishName: doc.fishName,
    rarity: doc.rarity,
    points: doc.points,
    caughtAt: doc.createdAt,
  }))
}

export async function saveCatch(input: {
  playerToken: string
  fishName: string
  rarity: InventoryCatch['rarity']
  points: number
  threshold: number
}): Promise<InventoryCatch | null> {
  if (
    !validToken(input.playerToken) ||
    !input.fishName ||
    input.fishName.length > 80 ||
    !['common', 'rare', 'epic', 'legendary'].includes(input.rarity) ||
    !Number.isInteger(input.points) ||
    !Number.isInteger(input.threshold) ||
    input.points < 0 ||
    input.points > 200 ||
    input.threshold < 1 ||
    input.threshold > 200
  ) return null

  const payload = await getPayload({ config })
  const doc = await payload.create({
    collection: 'catches',
    overrideAccess: false,
    data: input,
  })
  return {
    id: doc.id,
    fishName: doc.fishName,
    rarity: doc.rarity,
    points: doc.points,
    caughtAt: doc.createdAt,
  }
}
