import React from 'react';
import { RefreshCw, ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react';

const ReturnsPolicy: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-8 lg:px-12 py-24">
      <header className="mb-20">
        <span className="text-primary font-label font-bold uppercase tracking-widest text-[10px] mb-4 block">Satisfaction Guarantee</span>
        <h1 className="text-5xl font-display font-extrabold tracking-tight mb-8">Returns & Refunds</h1>
        <p className="text-on-surface/40 text-lg font-medium leading-relaxed">Your satisfaction is our top priority. If your purchase isn't exactly what you expected, we're here to make it right.</p>
      </header>

      <div className="prose prose-invert max-w-none space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-surface-container-low p-8 rounded-3xl">
            <RefreshCw className="text-primary mb-6" size={32} />
            <h3 className="text-xl font-display font-bold mb-4">7-Day Warranty</h3>
            <p className="text-sm text-on-surface/50 leading-relaxed font-medium">We offer a 7-day checking warranty for all products. If you receive a faulty item, we will replace it or refund you.</p>
          </div>
          <div className="bg-surface-container-low p-8 rounded-3xl">
            <ShieldCheck className="text-primary mb-6" size={32} />
            <h3 className="text-xl font-display font-bold mb-4">Quality Check</h3>
            <p className="text-sm text-on-surface/50 leading-relaxed font-medium">Every return undergoes a quality inspection to ensure the product is in its original condition and packaging.</p>
          </div>
        </div>

        <section>
          <h3 className="text-2xl font-display font-extrabold mb-4 tracking-tight">Eligibility for Returns</h3>
          <ul className="text-on-surface/50 leading-relaxed font-medium space-y-3 list-none p-0">
            <li className="flex gap-3"><CheckCircle2 className="text-primary shrink-0" size={18} /> Item must be in the same condition that you received it.</li>
            <li className="flex gap-3"><CheckCircle2 className="text-primary shrink-0" size={18} /> Must be in original packaging with all tags.</li>
            <li className="flex gap-3"><CheckCircle2 className="text-primary shrink-0" size={18} /> Proof of purchase (Order #) is required.</li>
          </ul>
        </section>

        <section className="bg-primary/5 border border-primary/10 p-10 rounded-3xl">
          <h3 className="text-2xl font-display font-extrabold mb-4 tracking-tight flex items-center gap-3"><AlertCircle className="text-primary" /> Refund Process</h3>
          <p className="text-on-surface/60 leading-relaxed font-medium">
            Once your return is received and inspected, we will notify you of the approval or rejection of your refund. If approved, your refund will be processed via Bank Transfer or Easypaisa within 3-5 business days.
          </p>
        </section>

        <section>
          <h3 className="text-2xl font-display font-extrabold mb-4 tracking-tight">Non-Returnable Items</h3>
          <p className="text-on-surface/50 leading-relaxed font-medium">Items that have been used, items with broken seals (for screen protectors), and items purchased during clearance sales are not eligible for returns unless they arrive damaged.</p>
        </section>
      </div>
    </div>
  );
};

export default ReturnsPolicy;