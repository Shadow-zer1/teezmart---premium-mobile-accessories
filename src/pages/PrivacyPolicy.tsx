import React from 'react';
import { Shield } from 'lucide-react';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-8 lg:px-12 py-24">
      <header className="mb-20">
        <Shield className="text-primary mb-8" size={48} />
        <h1 className="text-5xl font-display font-extrabold tracking-tight mb-8">Privacy Policy</h1>
        <p className="text-on-surface/40 text-lg font-medium leading-relaxed">Your privacy is important to us. This policy outlines how TeezMart handles your data and ensures your security during your shopping experience.</p>
      </header>

      <div className="prose prose-invert max-w-none space-y-16">
        <section>
          <h2 className="text-2xl font-display font-extrabold mb-6 tracking-tight">Information We Collect</h2>
          <p className="text-on-surface/50 leading-relaxed font-medium">
            When you visit TeezMart, we collect certain information about your device, your interaction with the site, and information necessary to process your purchases. We may also collect additional information if you contact us for customer support.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-display font-extrabold mb-6 tracking-tight">How We Use Your Data</h2>
          <p className="text-on-surface/50 leading-relaxed font-medium">
            We use your personal information to provide our services to you, which includes: offering products for sale, processing payments, shipping and fulfillment of your order, and keeping you up to date on new products and offers.
          </p>
        </section>

        <section className="bg-surface-container-low p-10 rounded-3xl">
          <h2 className="text-2xl font-display font-extrabold mb-6 tracking-tight">Data Security</h2>
          <p className="text-on-surface/60 leading-relaxed font-medium">
            We implement a variety of security measures to maintain the safety of your personal information. Your personal information is contained behind secured networks and is only accessible by a limited number of persons who have special access rights to such systems.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-display font-extrabold mb-6 tracking-tight">Cookies</h2>
          <p className="text-on-surface/50 leading-relaxed font-medium">
            Our site uses cookies to help remember and process the items in your shopping cart, understand and save your preferences for future visits, and compile aggregate data about site traffic.
          </p>
        </section>

        <footer className="text-on-surface/30 text-sm font-medium pt-12 border-t border-outline-variant/10">
          Last updated: April 2026. For any questions regarding this policy, please contact us at privacy@teezmart.com.
        </footer>
      </div>
    </div>
  );
};

export default PrivacyPolicy;