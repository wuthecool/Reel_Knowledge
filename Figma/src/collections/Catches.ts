import type { CollectionConfig } from 'payload'

export const Catches: CollectionConfig = {
  slug: 'catches',
  admin: {
    useAsTitle: 'fishName',
    defaultColumns: ['fishName', 'rarity', 'points', 'createdAt'],
  },
  access: {
    create: () => true,
    read: () => true,
    update: () => false,
    delete: () => false,
  },
  fields: [
    { name: 'playerToken', type: 'text', required: true, index: true },
    { name: 'fishName', type: 'text', required: true },
    {
      name: 'rarity',
      type: 'select',
      required: true,
      options: ['common', 'rare', 'epic', 'legendary'],
    },
    { name: 'points', type: 'number', required: true, min: 0 },
    { name: 'threshold', type: 'number', required: true, min: 1 },
  ],
}
