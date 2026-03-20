import type { LucideIcon } from "lucide-react";
import {
  Cat,
  Coffee,
  Home,
  MapPin,
  Music,
  Trophy,
} from "lucide-react";
import { PORTFOLIO_CATEGORIES } from "./portfolioCategories";

const SLUG_TO_ICON: Record<
  (typeof PORTFOLIO_CATEGORIES)[number]["slug"],
  LucideIcon
> = {
  concerts: Music,
  sport: Trophy,
  animals: Cat,
  interiors: Home,
  zagreb: MapPin,
  "food-drink": Coffee,
};

export type PortfolioCategoryWithIcon = {
  slug: (typeof PORTFOLIO_CATEGORIES)[number]["slug"];
  label: (typeof PORTFOLIO_CATEGORIES)[number]["label"];
  icon: LucideIcon;
};

/** Portfolio kategorije s Lucide ikonama (admin dropdown, itd.) */
export const PORTFOLIO_CATEGORIES_WITH_ICONS: readonly PortfolioCategoryWithIcon[] =
  PORTFOLIO_CATEGORIES.map((c) => ({
    slug: c.slug,
    label: c.label,
    icon: SLUG_TO_ICON[c.slug],
  }));
