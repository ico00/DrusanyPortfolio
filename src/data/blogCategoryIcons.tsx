import type { LucideIcon } from "lucide-react";
import {
  Aperture,
  Building2,
  Car,
  Info,
  Lightbulb,
  Luggage,
  Music,
  PawPrint,
  Plane,
  Sparkles,
  Trophy,
} from "lucide-react";
import { BLOG_CATEGORIES } from "./blogCategories";

const SLUG_TO_ICON: Record<string, LucideIcon> = {
  info: Info,
  putovanja: Luggage,
  sport: Trophy,
  koncerti: Music,
  auti: Car,
  kucnecarolije: Sparkles,
  macro: Aperture,
  zivotinje: PawPrint,
  avioni: Plane,
  savjeti: Lightbulb,
  gradovi: Building2,
};

export type BlogCategoryWithIcon = {
  slug: string;
  label: string;
  icon: LucideIcon;
};

/** Top-level blog kategorije s Lucide ikonama (admin dashboard graf, itd.) */
export const BLOG_CATEGORIES_WITH_ICONS: readonly BlogCategoryWithIcon[] =
  BLOG_CATEGORIES.map((c) => ({
    slug: c.slug,
    label: c.label,
    icon: SLUG_TO_ICON[c.slug] ?? Info,
  }));
