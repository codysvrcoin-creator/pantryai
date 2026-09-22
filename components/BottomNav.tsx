"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Home, BookOpen, CalendarDays, Refrigerator, ShoppingCart, ChefHat } from "lucide-react";

const TABS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/recipes", label: "Recipes", icon: BookOpen },
  { href: "/week", label: "Week", icon: CalendarDays },
  { href: "/pantry", label: "Pantry", icon: Refrigerator },
  { href: "/shopping", label: "Shopping", icon: ShoppingCart },
  { href: "/cook", label: "Cook", icon: ChefHat },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 glass border-t border-border pb-safe">
      <ul className="flex items-stretch justify-between px-2">
        {TABS.map((tab) => {
          const active = pathname === tab.href;
          const Icon = tab.icon;
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                className="relative flex flex-col items-center justify-center gap-0.5 py-2 tap-target"
              >
                {active && (
                  <motion.div
                    layoutId="bottomnav-indicator"
                    className="absolute -top-[1px] h-0.5 w-8 rounded-full bg-primary"
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  />
                )}
                <motion.div whileTap={{ scale: 0.85 }}>
                  <Icon
                    size={22}
                    strokeWidth={active ? 2.4 : 1.8}
                    className={active ? "text-primary" : "text-muted-foreground"}
                  />
                </motion.div>
                <span
                  className={`text-[10px] font-medium ${
                    active ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {tab.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
