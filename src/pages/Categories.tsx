import React, { useMemo, useEffect, useRef } from 'react';
import { 
    Smartphone, Zap, ShieldCheck, Magnet,
    Headphones, Watch, Laptop, Gamepad2, Cable, 
    Home, Camera, BatteryCharging, Box, ScanLine 
} from 'lucide-react';
import { motion, useInView, useSpring, useMotionValue, useTransform } from 'motion/react';
import { useWooCategories } from '../hooks/useWooProducts';
import { BentoGrid, BentoGridItem, getDynamicPositioning } from "@/components/ui/bento-grid";

// --- Helpers ---
const decodeHTML = (html: string) => {
    if (!html || typeof document === 'undefined') return html || '';
    const txt = document.createElement('textarea');
    txt.innerHTML = html;
    return txt.value;
};

const stripHtml = (html: string) => html.replace(/<[^>]*>?/gm, '').trim();

// FOOLPROOF DESCRIPTION LOGIC
const getSmartDescription = (item: DisplayItem) => {
    if (item.description) {
        const cleanText = stripHtml(decodeHTML(item.description));
        if (cleanText.length > 0) return cleanText; 
    }
    return `Discover our premium selection of ${decodeHTML(item.name)}. Engineered for performance and curated for your lifestyle.`;
};

// UNIQUE ICONS ENGINE
const getIcon = (slug: string) => {
    const s = slug.toLowerCase();
    if (s.includes('iphone') || s.includes('samsung') || s.includes('pixel') || s.includes('phone')) return <Smartphone size={26} />;
    if (s.includes('charger') || s.includes('adapter')) return <Zap size={26} />;
    if (s.includes('screen') || s.includes('protect') || s.includes('case')) return <ShieldCheck size={26} />;
    if (s.includes('magsafe') || s.includes('magnetic')) return <Magnet size={26} />;
    if (s.includes('audio') || s.includes('headphone') || s.includes('earbud') || s.includes('airpod')) return <Headphones size={26} />;
    if (s.includes('watch') || s.includes('wearable') || s.includes('band')) return <Watch size={26} />;
    if (s.includes('laptop') || s.includes('macbook') || s.includes('pc')) return <Laptop size={26} />;
    if (s.includes('game') || s.includes('console') || s.includes('playstation')) return <Gamepad2 size={26} />;
    if (s.includes('cable') || s.includes('wire') || s.includes('usb')) return <Cable size={26} />;
    if (s.includes('smart') || s.includes('home')) return <Home size={26} />;
    if (s.includes('camera') || s.includes('lens')) return <Camera size={26} />;
    if (s.includes('powerbank') || s.includes('battery')) return <BatteryCharging size={26} />;
    
    return <Box size={26} />; 
};

interface DisplayItem {
    id: number;
    name: string;
    slug: string;
    description: string;
    image?: { src: string } | null;
    parent: number;
    count: number;
    type: 'hero' | 'parent' | 'sub';
    typeIndex?: number;
}

interface ParallaxCardImageProps {
    src?: string | null;
    alt: string;
    mousePos?: { x: number; y: number };
}

const StaggeredContainer: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, amount: 0.1 });
    
    return (
        <motion.div
            ref={ref}
            initial="hidden"
            animate={isInView ? 'visible' : 'hidden'}
            variants={{ 
                hidden: { opacity: 0 }, 
                visible: { opacity: 1, transition: { staggerChildren: 0.15 } } 
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
};

const childVariants = {
    hidden: { opacity: 0, y: 120, scale: 0.8, rotateX: 20, z: -100 },
    visible: { 
        opacity: 1, 
        y: 0, 
        scale: 1, 
        rotateX: 0, 
        z: 0,
        transition: { type: "spring", damping: 20, stiffness: 80, mass: 1 } 
    },
};

const ParallaxCardImage: React.FC<ParallaxCardImageProps> = ({ src, alt, mousePos }) => {
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    useEffect(() => {
        if (mousePos) {
            x.set(mousePos.x);
            y.set(mousePos.y);
        }
    }, [mousePos, x, y]);

    const springConfig = { damping: 30, stiffness: 60, mass: 2.5 };
    const xSpring = useSpring(x, springConfig);
    const ySpring = useSpring(y, springConfig);

    const translateX = useTransform(xSpring, [-0.5, 0.5], ["80px", "-80px"]);
    const translateY = useTransform(ySpring,[-0.5, 0.5],["80px", "-80px"]);

    return (
        <div className="absolute inset-0 w-full h-full overflow-hidden bg-[#0A0A0A]">
            {src ? (
                <motion.img
                    src={src}
                    alt={alt}
                    style={{
                        x: translateX,
                        y: translateY,
                        scale: 1.3, 
                    }}
                    // REMOVED THE BLACK/WHITE FILTER HERE! It is now 100% opacity and vibrant.
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 ease-out"
                    referrerPolicy="no-referrer"
                />
            ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-transparent flex items-center justify-center">
                    <Box className="w-24 h-24 text-blue-500/10" />
                </div>
            )}
        </div>
    );
};

const Categories: React.FC = () => {
    const { categories, isLoading } = useWooCategories();

    const allDisplayItems = useMemo(() => {
        if (!categories) return[];
        const filtered = categories.filter(cat => !['uncategorized', 'uncategorised'].includes(cat.name.toLowerCase()));
        const hero = filtered.find(cat => cat.slug.includes('all') && cat.parent === 0);
        const parents = filtered.filter(cat => cat.parent === 0 && cat.id !== hero?.id).sort((a, b) => b.count - a.count);
        
        const result: DisplayItem[] =[];
        if (hero) result.push({ ...hero, type: 'hero' } as DisplayItem);
        
        parents.forEach((parent, pi) => {
            result.push({ ...parent, type: 'parent', typeIndex: pi } as DisplayItem);
            filtered.filter(cat => Number(cat.parent) === Number(parent.id))
                .sort((a, b) => b.count - a.count)
                .forEach(sub => result.push({ ...sub, type: 'sub' } as DisplayItem));
        });
        return result;
    }, [categories]);

    return (
        <div className="bg-surface overflow-hidden min-h-screen pt-24 pb-48 flex justify-center">
            <div className="w-[90%] max-w-[1800px] relative z-10">
                
                <header className="max-w-4xl mb-20 md:mb-32 space-y-8">
                    <motion.span 
                        initial={{ opacity: 0, scale: 0.8, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 font-label font-bold uppercase tracking-widest text-[9px] shadow-[0_0_15px_rgba(59,130,246,0.1)]"
                    >
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                        TeezMart Atrium Collections
                    </motion.span>
                    
                     <motion.h1 
                        initial={{ opacity: 0, filter: "blur(10px)", y: 30 }}
                        animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                        className="text-5xl md:text-7xl font-display font-extrabold tracking-tight leading-[1.05] text-primary text-b"
                    >
                        Modular Architecture. <br className="hidden md:block"/> 
                        <span className="text-on-surface/40">Curated for Your Lifestyle.</span>
                    </motion.h1>
                </header>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 min-h-[40vh] gap-8">
                        <div className="relative w-40 h-40 flex items-center justify-center">
                            <motion.div 
                                animate={{ rotate: 360 }} 
                                transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                                className="absolute inset-0 rounded-full border-t-2 border-blue-500/50 border-r-2 border-transparent"
                            />
                            <motion.div 
                                animate={{ rotate: -360 }} 
                                transition={{ repeat: Infinity, duration: 2.5, ease: "linear" }}
                                className="absolute inset-6 rounded-full border-b-2 border-blue-400/80 border-l-2 border-transparent"
                            />
                            <ScanLine className="w-12 h-12 text-blue-400 animate-pulse" />
                        </div>
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ repeat: Infinity, duration: 1.5, repeatType: "reverse" }}
                            className="text-blue-400/80 font-mono text-xs md:text-sm tracking-[0.4em] uppercase"
                        >
                            Initializing Core...
                        </motion.div>
                    </div>
                ) : (
                    <StaggeredContainer>
                        <BentoGrid>
                            {allDisplayItems.map((item) => (
                                <motion.div
                                    key={item.id}
                                    variants={childVariants}
                                    className={getDynamicPositioning(item.type)}
                                >
                                    <BentoGridItem
                                        isHero={item.type === 'hero'}
                                        isSub={item.type === 'sub'}
                                        label={item.type === 'hero' ? 'Anchor Collection' : item.type === 'sub' ? 'Module' : 'Collection'}
                                        title={decodeHTML(item.name)}
                                        description={getSmartDescription(item)}
                                        href={`/shop?category=${item.id}`}
                                        icon={getIcon(item.slug)}
                                        header={<ParallaxCardImage src={item.image?.src} alt={item.name} />}
                                    />
                                </motion.div>
                            ))}
                        </BentoGrid>
                    </StaggeredContainer>
                )}
            </div>
        </div>
    );
};

export default Categories;