"use client"; 

import React, { useRef, useState } from "react";
import { motion } from "framer-motion";

export interface NavItem {
  label: string;
  href?: string;
}

export interface NavHeaderProps {
  items?: NavItem[];
  onItemClick?: (label: string, href?: string) => void;
  className?: string;
  theme?: "dark" | "light";
}

function NavHeader({
  items,
  onItemClick,
  className = "",
  theme = "dark",
}: NavHeaderProps = {}) {
  const [position, setPosition] = useState({
    left: 0,
    width: 0,
    opacity: 0,
  });
  const [hoveredLabel, setHoveredLabel] = useState<string | null>(null);

  // Default parameters matching TrueRide previous landing page navigation
  const defaultItems: NavItem[] = [
    { label: "The Crisis", href: "#problem" },
    { label: "5 Risk Categories", href: "#categories" },
    { label: "Architecture", href: "#pipeline" },
    { label: "Auth & Fraud Model", href: "#auth-framework" },
    { label: "9 Mission Scenarios", href: "#scenarios" },
    { label: "Worker-First Charter", href: "#ethics" },
  ];

  const navItems = items || defaultItems;

  const containerClasses =
    theme === "dark"
      ? `relative mx-auto flex w-fit items-center rounded-full border border-[#30363D] bg-[#161B22]/95 backdrop-blur-md p-1 shadow-lg shadow-black/40 ${className}`
      : `relative mx-auto flex w-fit items-center rounded-full border-2 border-black bg-white p-1 shadow-md ${className}`;

  return (
    <ul
      className={containerClasses}
      onMouseLeave={() => {
        setHoveredLabel(null);
        setPosition((pv) => ({ ...pv, opacity: 0 }));
      }}
    >
      {navItems.map((item) => (
        <Tab
          key={item.label}
          label={item.label}
          theme={theme}
          isHovered={hoveredLabel === item.label}
          setPosition={setPosition}
          setHoveredLabel={setHoveredLabel}
          onClick={() => {
            if (onItemClick) {
              onItemClick(item.label, item.href);
            } else if (item.href && typeof window !== "undefined") {
              const el = document.querySelector(item.href);
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }
          }}
        >
          {item.label}
        </Tab>
      ))}

      <Cursor position={position} theme={theme} />
    </ul>
  );
}

const Tab = ({
  children,
  label,
  theme,
  isHovered,
  setPosition,
  setHoveredLabel,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  theme: "dark" | "light";
  isHovered: boolean;
  setPosition: any;
  setHoveredLabel: (val: string | null) => void;
  onClick?: () => void;
}) => {
  const ref = useRef<HTMLLIElement>(null);

  const tabClasses =
    theme === "dark"
      ? `relative z-10 block cursor-pointer px-3 py-1.5 text-[11px] xl:text-xs uppercase font-bold font-mono transition-colors duration-150 select-none ${
          isHovered ? "text-[#17191B]" : "text-[#8B949E] hover:text-[#F1F5F9]"
        }`
      : "relative z-10 block cursor-pointer px-3 py-1.5 text-xs uppercase text-white mix-blend-difference md:px-5 md:py-3 md:text-base font-bold font-mono transition-transform active:scale-95 select-none";

  return (
    <li
      ref={ref}
      onClick={onClick}
      onMouseEnter={() => {
        if (!ref.current) return;

        const { width } = ref.current.getBoundingClientRect();
        setHoveredLabel(label);
        setPosition({
          width,
          opacity: 1,
          left: ref.current.offsetLeft,
        });
      }}
      className={tabClasses}
    >
      {children}
    </li>
  );
};

const Cursor = ({
  position,
  theme,
}: {
  position: any;
  theme: "dark" | "light";
}) => {
  const cursorClasses =
    theme === "dark"
      ? "absolute z-0 top-1 h-7 rounded-full bg-[#FFD900] shadow-[0_0_14px_rgba(255,217,0,0.35)] pointer-events-none"
      : "absolute z-0 top-1 h-7 rounded-full bg-black md:h-12 pointer-events-none";

  return (
    <motion.li
      animate={position}
      className={cursorClasses}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
    />
  );
};

export { NavHeader, Tab, Cursor };
export default NavHeader;
