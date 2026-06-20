import React from 'react';
import { Truck, ShieldCheck, Clock, MapPin } from 'lucide-react';

const ShippingPolicy: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-8 lg:px-12 py-24">
      <header className="mb-20">
        <span className="text-primary font-label font-bold uppercase tracking-widest text-[10px] mb-4 block">Deliveries</span>
        <h1 className="text-5xl font-display font-extrabold tracking-tight mb-8">Shipping Policy</h1>
        <p className="text-on-surface/40 text-lg font-medium leading-relaxed">We strive to provide the most reliable and fastest shipping services across Pakistan to ensure your premium accessories reach you safely.</p>
      </header>

      <div className="prose prose-invert max-w-none space-y-12">
        <section className="bg-surface-container-low p-10 rounded-3xl shadow-sm">
          <h2 className="text-2xl font-display font-extrabold mb-6 flex items-center gap-4">
            <Clock className="text-primary" /> Delivery Timelines
          </h2>
          <p className="text-on-surface/60 leading-relaxed font-medium">
            Orders are processed within 24 hours. Estimated delivery times are as follows:
            <ul className="mt-4 list-disc list-inside space-y-2">
              <li>Lahore: 1-2 Business Days</li>
              <li>Major Cities (Karachi, Islamabad, etc.): 2-4 Business Days</li>
              <li>Remote Areas: 5-7 Business Days</li>
            </ul>
          </p>
        </section>

        <section>
          <h3 className="text-2xl font-display font-extrabold mb-4 tracking-tight">Shipping Charges</h3>
          <p className="text-on-surface/50 leading-relaxed font-medium">
            We offer free shipping on all orders over Rs. 5,000. For orders below this amount, a flat shipping fee of Rs. 250 is applied nationwide.
          </p>
        </section>

        <section>
          <h3 className="text-2xl font-display font-extrabold mb-4 tracking-tight">Order Tracking</h3>
          <p className="text-on-surface/50 leading-relaxed font-medium">
            Once your order is shipped, you will receive an SMS and email with your tracking number. You can track your parcel on our logistics partner's website.
          </p>
        </section>

        <section className="border-t border-outline-variant/10 pt-12">
          <h3 className="text-2xl font-display font-extrabold mb-4 tracking-tight">Damaged Shipments</h3>
          <p className="text-on-surface/50 leading-relaxed font-medium">
            If you receive a package that is visibly damaged, please record a video while unboxing. This helps us process replacements quickly through our insurance partners.
          </p>
        </section>
      </div>
    </div>
  );
};

export default ShippingPolicy;