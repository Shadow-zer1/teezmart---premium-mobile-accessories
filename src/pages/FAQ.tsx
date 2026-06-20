import React, { useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

const FAQItem: React.FC<{ question: string; answer: string }> = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-outline-variant/10">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-8 flex items-center justify-between text-left group"
      >
        <span className="text-xl font-display font-extrabold tracking-tight group-hover:text-primary transition-colors">{question}</span>
        <div className={cn(
          "w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center transition-all duration-500",
          isOpen ? "bg-primary text-white rotate-180" : "text-on-surface/30"
        )}>
          <ChevronDown size={20} />
        </div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <p className="pb-8 text-on-surface/50 font-medium leading-relaxed max-w-3xl">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const FAQ: React.FC = () => {
  const faqs = [
    {
      category: "Orders & Shipping",
      items: [
        { question: "How long will it take for my order to arrive?", answer: "Delivery usually takes 2-5 business days depending on your location. We process orders within 24 hours of confirmation." },
        { question: "Do you offer international shipping?", answer: "Currently, we only ship within Pakistan. We are working on expanding our reach to international customers soon." },
        { question: "Can I track my order?", answer: "Yes, once your order is dispatched, you will receive a tracking number via email and SMS to monitor your shipment." }
      ]
    },
    {
      category: "Returns & Refunds",
      items: [
        { question: "What is your return policy?", answer: "We offer a 7-day checking warranty. If the product is damaged or not as described, you can return it within 7 days of delivery." },
        { question: "How do I start a return process?", answer: "Please contact our support team via WhatsApp or email with your order number and photos of the product." }
      ]
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-8 lg:px-12 py-24">
      <div className="text-center max-w-3xl mx-auto mb-24">
        <span className="text-primary font-label font-bold uppercase tracking-widest text-[10px] mb-4 block">Help Center</span>
        <h1 className="text-5xl md:text-6xl font-display font-extrabold tracking-tight mb-8">Frequently Asked Questions</h1>
        <div className="relative max-w-xl mx-auto">
          <input type="text" placeholder="Search for answers..." className="w-full bg-surface-container-low pl-14 pr-6 py-5 rounded-2xl outline-none focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all font-medium" />
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-on-surface/30" size={20} />
        </div>
      </div>

      <div className="max-w-4xl mx-auto space-y-20">
        {faqs.map((group, i) => (
          <div key={i}>
            <h2 className="text-sm font-label font-bold uppercase tracking-[0.3em] text-primary mb-10">{group.category}</h2>
            <div className="border-t border-outline-variant/10">
              {group.items.map((faq, j) => <FAQItem key={j} {...faq} />)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FAQ;