import {
  Megaphone,
  Wheat,
  ShieldCheck,
  Bird,
  Home,
  Shield,
  Landmark,
  Package,
  Pill
} from 'lucide-react';

/**
 * PoultryPro Advertisement Inventory
 * ----------------------------------
 * All ads shown on the landing page are sourced from this file.
 * Ads are restricted to the poultry/agricultural ecosystem: feed
 * manufacturers, hatcheries, vet companies, equipment suppliers,
 * packaging, medication, insurance, agri-finance, farm equipment.
 *
 * To onboard a real advertiser: add an entry here (with their image URL,
 * company name, copy and CTA link) — no page changes needed.
 * Every ad slot renders a "Sponsored" label automatically.
 */

export const AD_CATEGORIES = [
  'Feed & Nutrition',
  'Hatcheries & Chicks',
  'Veterinary & Health',
  'Equipment & Housing',
  'Packaging & Trays',
  'Insurance & Finance',
];

/** Slim banner shown at the very top of the page */
export const TOP_BANNER_AD = {
  id: 'top-banner-001',
  company: 'AgroFeed Nigeria',
  category: 'Feed & Nutrition',
  icon: Megaphone,
  text: 'SPECIAL OFFER: Get 10% off poultry feed this week from selected suppliers.',
  cta: 'Shop Offer',
  href: '#',
  sponsored: true,
};

/** Large sponsored card beside the hero section */
export const HERO_AD = {
  id: 'hero-ad-001',
  company: 'NaijaLayers Feed Mill',
  category: 'Feed & Nutrition',
  icon: Wheat,
  title: 'Premium Layer Feed — Now Available',
  text: 'Give your birds the nutrition they need for better production. Scientifically balanced for stronger shells and higher lay rates.',
  cta: 'Shop Now',
  href: '#',
  sponsored: true,
  highlights: ['Higher lay rate', 'Stronger shells', 'Less waste'],
};

/** Grid of sponsored cards in the dedicated ads section */
export const SPONSORED_CARD_ADS = [
  {
    id: 'ad-feed-001',
    company: 'TopFeeds Ltd',
    category: 'Feed & Nutrition',
    icon: Wheat,
    title: 'Poultry Feed',
    text: 'Premium feed for healthy growth and production at every stage.',
    cta: 'Learn More',
    href: '#',
    sponsored: true,
  },
  {
    id: 'ad-vet-001',
    company: 'VetCare Poultry Services',
    category: 'Veterinary & Health',
    icon: ShieldCheck,
    title: 'Veterinary Care',
    text: 'Professional poultry health products, vaccines and on-farm services.',
    cta: 'Learn More',
    href: '#',
    sponsored: true,
  },
  {
    id: 'ad-chicks-001',
    company: 'Sunrise Hatchery',
    category: 'Hatcheries & Chicks',
    icon: Bird,
    title: 'Day-Old Chicks',
    text: 'Quality broiler & layer chicks from trusted, certified suppliers.',
    cta: 'Learn More',
    href: '#',
    sponsored: true,
  },
  {
    id: 'ad-equip-001',
    company: 'FarmEquip Pro',
    category: 'Equipment & Housing',
    icon: Home,
    title: 'Poultry Equipment',
    text: 'Feeders, drinkers, cages and modern housing equipment for every farm size.',
    cta: 'Learn More',
    href: '#',
    sponsored: true,
  },
];

/** Who advertises on PoultryPro (used in the "Advertise With Us" section) */
export const ADVERTISER_TYPES = [
  { icon: Wheat, label: 'Feed companies' },
  { icon: Bird, label: 'Hatcheries' },
  { icon: ShieldCheck, label: 'Veterinary businesses' },
  { icon: Home, label: 'Equipment suppliers' },
  { icon: Shield, label: 'Insurance companies' },
  { icon: Landmark, label: 'Agricultural financial services' },
  { icon: Package, label: 'Egg tray & packaging suppliers' },
  { icon: Pill, label: 'Poultry medication companies' },
];
