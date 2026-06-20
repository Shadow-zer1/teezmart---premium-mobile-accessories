import { cn } from "@/lib/utils";
import React, { useState } from "react";
import { Link } from "react-router-dom";

export interface BentoGridProps {
  className?: string;
  children?: React.ReactNode;
}

export interface BentoGridItemProps {
  className?: string;
  title?: React.ReactNode;
  description?: React.ReactNode; // RESTORED
  header?: React.ReactNode;
  icon?: React.ReactNode;
  subPills?: React.ReactNode;
  label?: string;
  href?: string;
  isSub?: boolean;
  isHero?: boolean;
}

// 1.Same exact scaling for Mobile and Desktop
export const getDynamicPositioning = (type: 'hero' | 'parent' | 'sub' | string) => {
  if (type === "hero") return "col-span-2 row-span-2"; // Massive 2x2 Anchor
  if (type === "parent") return "col-span-2 row-span-1"; // Wide 2x1 blocks
  return "col-span-1 row-span-1"; // 1x1 Sub-module fillers
};

export const BentoGrid = ({ className, children }: BentoGridProps) => {
  return (
    <div
      className={cn(
        "mx-auto grid max-w-7xl grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 grid-flow-dense auto-rows-[minmax(250px,auto)]",
        className
      )}
    >
      {children}
    </div>
  );
};

export const BentoGridItem = ({
  className,
  title,
  description, // RESTORED
  header,
  icon,
  subPills,
  label,
  href = "#",
  isSub,
  isHero,
}: BentoGridItemProps) => {
  const[mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const isExternalLink = href.startsWith("http") || href.startsWith("mailto:");
  const Component = isExternalLink ? "a" : Link;
  const linkProps = isExternalLink 
    ? { href, target: "_blank", rel: "noopener noreferrer" } 
    : { to: href };

  // Calculate coordinates for BOTH Mouse and Mobile Touch
  const handleMove = (clientX: number, clientY: number, currentTarget: EventTarget & HTMLElement) => {
    const rect = currentTarget.getBoundingClientRect();
    setMousePos({
      x: (clientX - rect.left) / rect.width - 0.5,
      y: (clientY - rect.top) / rect.height - 0.5,
    });
  };

  return (
    <Component
      {...linkProps}
      onMouseMove={(e) => handleMove(e.clientX, e.clientY, e.currentTarget)}
      onTouchMove={(e) => handleMove(e.touches[0].clientX, e.touches[0].clientY, e.currentTarget)}
      onMouseLeave={() => setMousePos({ x: 0, y: 0 })}
      onTouchEnd={() => setMousePos({ x: 0, y: 0 })}
      className={cn(
        // THE BLUE AESTHETIC & 3D WRAPPER
        "group relative flex flex-col justify-end w-full rounded-[2rem] overflow-hidden",
        "bg-surface-container border border-white/5 shadow-ambient",
        "transition-all duration-700 ease-out hover:-translate-y-2",
        "hover:shadow-[0_30px_60px_-15px_rgba(59,130,246,0.25)] hover:border-blue-500/40", 
        "transform-gpu [transform-style:preserve-3d]", // Enables true 3D stacking context
        isHero ? "min-h-[400px] md:min-h-[600px]" : "min-h-[250px] md:min-h-[300px]",
        className
      )}
    >
      {/* Background Image Layer (Receives Glide Physics) */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {React.isValidElement(header)
          ? React.cloneElement(header as React.ReactElement<{ mousePos: { x: number, y: number } }>, { mousePos })
          : header}
      </div>

      {/* Visual Overlays - Tech Gradient */}
      <div
        className={cn(
          "absolute inset-0 z-10 bg-gradient-to-t via-black/50 to-transparent transition-opacity duration-500 group-hover:via-blue-950/60",
          isSub ? "from-black/95 opacity-90" : "from-black/90 opacity-90 group-hover:from-blue-950/95"
        )}
      />

      {/* Badge Layer - Technical Precision (Pushed massively forward in 3D space) */}
      {label && (
        <div className="absolute top-6 left-6 z-20 pointer-events-none[transform:translateZ(40px)]">
          <span className="bg-blue-500/10 backdrop-blur-md border border-blue-500/30 text-blue-100 text-[10px] px-4 py-1.5 rounded-full font-bold uppercase tracking-widest shadow-[0_0_20px_rgba(59,130,246,0.3)]">
            {label}
          </span>
        </div>
      )}

      {/* Content Area - Floating violently above the image */}
      <div
        className={cn(
          "relative z-20 w-full p-6 md:p-8 flex flex-col gap-3 pointer-events-none transition-transform duration-700 ease-out",
          "group-hover:-translate-y-4[transform:translateZ(60px)]", // EXTREME PHYSICAL LIFT
          isSub && "p-5"
        )}
      >
        <div className="flex items-center gap-4">
          {!isSub && icon && (
            <div className="w-12 h-12 md:w-14 md:h-14 bg-blue-500/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-blue-500/20 text-blue-400 shrink-0 group-hover:scale-110 group-hover:bg-blue-500/20 group-hover:text-blue-300 transition-all duration-500 shadow-[0_0_15px_rgba(59,130,246,0)] group-hover:shadow-[0_0_25px_rgba(59,130,246,0.3)]">
              {icon}
            </div>
          )}
          <h3
            className={cn(
              "font-display font-extrabold text-white tracking-tight leading-tight group-hover:text-blue-50 transition-colors duration-500",
              isHero ? "text-4xl md:text-6xl" : isSub ? "text-xl md:text-2xl" : "text-3xl md:text-4xl"
            )}
          >
            {title}
          </h3>
        </div>

        {/* 2. DESCRIPTION RESTORED & ALWAYS VISIBLE */}
        {description && (
          <p
            className={cn(
              "text-white/70 font-medium leading-relaxed transition-all duration-500 group-hover:text-white/90 block",
              // Line clamp ensures long text doesn't break the tight grid layout
              isHero ? "text-lg max-w-xl line-clamp-3" : "text-sm max-w-[95%] line-clamp-2" 
            )}
          >
            {description}
          </p>
        )}

        {subPills && (
          <div className="flex flex-wrap gap-2 mt-3 opacity-0 group-hover:opacity-100 translate-y-6 group-hover:translate-y-0 transition-all duration-700 ease-out">
            {subPills}
          </div>
        )}

        <div className="mt-2 flex items-center gap-2 text-blue-400/60 text-[11px] font-bold uppercase tracking-widest group-hover:text-blue-400 transition-colors duration-500">
          {isSub ? "Explore Module" : "Activate Collection"}
        </div>
      </div>
    </Component>
  );
};