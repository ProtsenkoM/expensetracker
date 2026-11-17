import {
  Tag,
  ShoppingCart,
  Coffee,
  House,
  Car,
  Heart,
  Briefcase,
} from 'lucide-react';
const icons = {
  tag: Tag,
  'shopping-cart': ShoppingCart,
  cart: ShoppingCart,
  coffee: Coffee,
  home: House,
  car: Car,
  heart: Heart,
  briefcase: Briefcase,
};
export function CategoryIcon({ name }: { name: string }) {
  const Icon = Object.hasOwn(icons, name)
    ? icons[name as keyof typeof icons]
    : Tag;
  return <Icon size={18} aria-hidden="true" />;
}
