import {
  Drumstick,
  Egg,
  Bird,
  Waves,
  Feather,
  Bird as GooseIcon,
  Sparkles,
  Egg as QuailIcon,
  PawPrint
} from 'lucide-react';

/**
 * POULTRY TYPE PERSONALIZATION REGISTRY
 * -------------------------------------
 * Single source of truth for every poultry type PoultryPro supports.
 *
 * The dashboard, flock forms, filters, and records are all generated from this
 * config so that adding a new poultry type in the future only requires adding
 * one entry here — no restructuring of the application.
 *
 * `traits` describes what each type's dashboard focuses on:
 *   eggs      – type has egg-production records & charts
 *   weight    – type tracks bird weight / growth performance
 *   feed      – type tracks feed consumption
 *   salesLabel– default product shown in the Record Sale form
 */
export const POULTRY_TYPES = [
  {
    id: 'broilers',
    label: 'Broilers',
    emoji: '🐔',
    icon: Drumstick,
    // flock.type values that belong to this poultry type
    flockTypes: ['Broiler'],
    traits: { eggs: false, weight: true, feed: true },
    salesProduct: 'Live Birds',
    description: 'Meat birds — focus on weight gain, growth performance and feed conversion.'
  },
  {
    id: 'layers',
    label: 'Layers',
    emoji: '🥚',
    icon: Egg,
    flockTypes: ['Layer'],
    traits: { eggs: true, weight: false, feed: true },
    salesProduct: 'Eggs',
    description: 'Egg production — focus on lay rate, egg quality and feed efficiency.'
  },
  {
    id: 'chicks',
    label: 'Chicks / Chickens',
    emoji: '🐣',
    icon: Bird,
    flockTypes: ['Chick', 'Chicken', 'Pullet'],
    traits: { eggs: false, weight: true, feed: true },
    salesProduct: 'Live Birds',
    description: 'Young birds — focus on brooding, early growth and survival rate.'
  },
  {
    id: 'ducks',
    label: 'Ducks',
    emoji: '🦆',
    icon: Waves,
    flockTypes: ['Duck'],
    traits: { eggs: true, weight: true, feed: true },
    salesProduct: 'Live Birds',
    description: 'Dual-purpose waterfowl — population, eggs where applicable, weight and health.'
  },
  {
    id: 'turkeys',
    label: 'Turkeys',
    emoji: '🦃',
    icon: Feather,
    flockTypes: ['Turkey'],
    traits: { eggs: false, weight: true, feed: true },
    salesProduct: 'Live Birds',
    description: 'Large meat birds — weight, growth, feed and health monitoring.'
  },
  {
    id: 'geese',
    label: 'Geese',
    emoji: '🪿',
    icon: GooseIcon,
    flockTypes: ['Goose'],
    traits: { eggs: true, weight: true, feed: true },
    salesProduct: 'Live Birds',
    description: 'Hardy waterfowl — population, eggs, weight and grazing-based feeding.'
  },
  {
    id: 'guinea-fowl',
    label: 'Guinea Fowl',
    emoji: '🐦',
    icon: Sparkles,
    flockTypes: ['Guinea Fowl'],
    traits: { eggs: true, weight: true, feed: true },
    salesProduct: 'Live Birds',
    description: 'Free-range favourites — population, eggs, weight and hardiness.'
  },
  {
    id: 'quails',
    label: 'Quails',
    emoji: '🐦',
    icon: QuailIcon,
    flockTypes: ['Quail'],
    traits: { eggs: true, weight: false, feed: true },
    salesProduct: 'Quail Eggs',
    description: 'Small, fast-laying birds — population, egg production rate and feed.'
  },
  {
    id: 'other',
    label: 'Other Poultry',
    emoji: '🦚',
    icon: PawPrint,
    flockTypes: ['Other'],
    traits: { eggs: false, weight: true, feed: true },
    salesProduct: 'Live Birds',
    description: 'Any other poultry — general records with weight, feed and health tracking.'
  }
];

export const POULTRY_TYPE_MAP = POULTRY_TYPES.reduce((acc, t) => {
  acc[t.id] = t;
  return acc;
}, {});

/** Resolve a flock.type string (e.g. "Broiler") to its poultry type config. */
export const getPoultryTypeByFlockType = (flockType) =>
  POULTRY_TYPES.find((t) => t.flockTypes.includes(flockType)) || null;

/** Ordered list of bird-type options for flock forms (all types). */
export const ALL_FLOCK_TYPE_OPTIONS = POULTRY_TYPES.flatMap((t) => t.flockTypes);
