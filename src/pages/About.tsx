import React, { useState } from 'react';
import { Shield, Users, Globe, Mail, Phone, CheckCircle2, Send, Search } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

const About: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    setErrorMessage('');

    const wpUrl = (import.meta.env.VITE_WORDPRESS_URL as string || '').replace(/\/$/, '');
    const formId = '20'; 

    if (!wpUrl) {
      setErrorMessage('Configuration error.');
      setStatus('error');
      return;
    }

    const body = new FormData();
    body.append('_wpcf7', formId);
    body.append('_wpcf7_unit_tag', `wpcf7-f${formId}-p1-o1`);
    body.append('your-name', formData.name);
    body.append('your-email', formData.email);
    body.append('your-subject', 'Inquiry from About Page');
    body.append('your-message', formData.message);

    try {
      const response = await fetch(`${wpUrl}/wp-json/contact-form-7/v1/contact-forms/${formId}/feedback`, {
        method: 'POST',
        body: body
      });
      const result = await response.json();

      if (result.status === 'mail_sent') {
        setStatus('success');
        setFormData({ name: '', email: '', message: '' });
        setTimeout(() => setStatus('idle'), 5000);
      } else {
        setStatus('error');
        setErrorMessage(result.message || 'Failed to send.');
      }
    } catch (err) {
      setStatus('error');
      setErrorMessage('Network error.');
    }
  };

  return (
    <div className="pb-32">
      {/* Hero Section */}
      <section className="relative h-[70vh] flex items-center justify-center overflow-hidden bg-surface">
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=1920&auto=format&fit=crop" 
            alt="About TeezMart" 
            className="w-full h-full object-cover opacity-30 scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-surface/20 via-surface/60 to-surface" />
        </div>
        <div className="relative z-10 text-center px-8 max-w-5xl">
          <motion.span 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block text-primary font-label font-bold uppercase tracking-[0.3em] text-[10px] mb-8"
          >
            Our Story
          </motion.span>
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="text-6xl md:text-8xl font-display font-extrabold text-on-surface mb-10 tracking-tight leading-[1.1]"
          >
            Elevating Your <br />
            <span className="text-primary">Mobile Experience</span>
          </motion.h1>
          <motion.p 
            className="text-xl md:text-2xl text-on-surface/40 font-medium leading-relaxed max-w-3xl mx-auto"
          >
            TeezMart was founded on a simple principle: your premium devices deserve premium protection without compromising on style.
          </motion.p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="max-w-7xl mx-auto px-8 lg:px-12 py-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
          <div className="space-y-10">
            <span className="text-primary font-label font-bold uppercase tracking-widest text-[10px] block">Our Purpose</span>
            <h2 className="text-5xl font-display font-extrabold tracking-tight leading-tight">Our Mission</h2>
            <p className="text-on-surface/40 text-xl font-medium leading-relaxed">
              We believe that technology is an extension of your personality. That's why we meticulously curate and design accessories that not only protect your investments but also enhance their aesthetic appeal.
            </p>
            <p className="text-on-surface/40 text-xl font-medium leading-relaxed">
              From ultra-durable armor cases to sleek MagSafe chargers, every product undergoes rigorous testing to ensure it meets the highest standards.
            </p>
            <div className="grid grid-cols-2 gap-12 pt-8">
              <div className="group">
                <h4 className="text-5xl font-display font-extrabold mb-3 tracking-tight group-hover:text-primary transition-colors">10k+</h4>
                <p className="text-[10px] text-on-surface/30 font-label font-bold uppercase tracking-[0.2em]">Happy Customers</p>
              </div>
              <div className="group">
                <h4 className="text-5xl font-display font-extrabold mb-3 tracking-tight group-hover:text-primary transition-colors">500+</h4>
                <p className="text-[10px] text-on-surface/30 font-label font-bold uppercase tracking-[0.2em]">Curated Items</p>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="aspect-square rounded-[60px] overflow-hidden shadow-ambient">
              <img 
                src="https://images.unsplash.com/photo-1616348436168-de43ad0db179?q=80&w=800&auto=format&fit=crop" 
                alt="Expertly Curated Tech" 
                className="w-full h-full object-cover hover:scale-110 transition-transform duration-[2000ms] ease-out"
              />
            </div>
            {/* NEW TRUTHFUL CARD */}
            <div className="absolute -bottom-12 -left-12 bg-white p-10 rounded-[40px] shadow-ambient hidden md:block border border-surface-container-low">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-primary text-white rounded-2xl flex items-center justify-center shadow-ambient">
                  <Search size={32} />
                </div>
                <div>
                  <h4 className="font-display font-extrabold text-lg tracking-tight">Expertly Curated</h4>
                  <p className="text-[10px] text-on-surface/30 font-label font-bold uppercase tracking-widest mt-1">The Best of TeezMart</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="bg-surface-container-low py-32">
        <div className="max-w-7xl mx-auto px-8 lg:px-12">
          <div className="text-center max-w-3xl mx-auto mb-24">
            <span className="text-primary font-label font-bold uppercase tracking-widest text-[10px] mb-6 block">Our Philosophy</span>
            <h2 className="text-5xl font-display font-extrabold tracking-tight mb-8 leading-tight">Our Core Values</h2>
            <p className="text-on-surface/40 text-xl font-medium leading-relaxed">The pillars that define who we are and how we serve our community.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { icon: Shield, title: "Quality First", desc: "We never compromise on materials. Every product is selected to endure." },
              { icon: Users, title: "Customer Centric", desc: "Your satisfaction is our priority. We evolve based on your feedback." },
              { icon: Globe, title: "Curated Design", desc: "We focus on aesthetics that blend seamlessly with your modern lifestyle." }
            ].map((value, i) => (
              <div key={i} className="bg-white p-12 rounded-[50px] shadow-sm hover:shadow-ambient transition-all duration-700 group">
                <div className="w-20 h-20 bg-surface-container-low text-primary rounded-3xl flex items-center justify-center mb-10 group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-500">
                  <value.icon size={36} />
                </div>
                <h3 className="text-2xl font-display font-extrabold mb-6 tracking-tight group-hover:text-primary">{value.title}</h3>
                <p className="text-on-surface/40 text-lg font-medium leading-relaxed">{value.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="max-w-7xl mx-auto px-8 lg:px-12 py-32">
        <div className="bg-surface-container-low rounded-[60px] p-16 md:p-24 flex flex-col lg:flex-row gap-24 items-center relative overflow-hidden shadow-sm">
          <div className="flex-1 space-y-12 relative z-10">
            <span className="text-primary font-label font-bold uppercase tracking-widest text-[10px] block">Connect with Us</span>
            <h2 className="text-5xl font-display font-extrabold tracking-tight leading-tight">Get in Touch</h2>
            <p className="text-on-surface/40 text-xl font-medium leading-relaxed">Have questions about our products? Our team is ready to assist you.</p>
            <div className="space-y-10">
              <div className="flex items-center gap-6 group">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-primary shadow-sm">
                  <Mail size={24} />
                </div>
                <div>
                  <p className="text-[9px] text-on-surface/30 font-label font-bold uppercase tracking-[0.2em] mb-1">Email Us</p>
                  <p className="text-xl font-display font-extrabold tracking-tight">teezmartpk@gmail.com</p>
                </div>
              </div>
              <div className="flex items-center gap-6 group">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-primary shadow-sm">
                  <Phone size={24} />
                </div>
                <div>
                  <p className="text-[9px] text-on-surface/30 font-label font-bold uppercase tracking-[0.2em] mb-1">Call Us</p>
                  <p className="text-xl font-display font-extrabold tracking-tight">+92 (327) 550-1610</p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex-1 w-full relative z-10">
            <form onSubmit={handleSubmit} className="bg-white p-10 rounded-[40px] shadow-ambient space-y-6">
              <input 
                required
                type="text" 
                placeholder="Full Name" 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-6 py-5 bg-surface-container-low border-none rounded-2xl outline-none focus:ring-2 focus:ring-primary/10 font-bold text-lg" 
              />
              <input 
                required
                type="email" 
                placeholder="Email Address" 
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full px-6 py-5 bg-surface-container-low border-none rounded-2xl outline-none focus:ring-2 focus:ring-primary/10 font-bold text-lg" 
              />
              <textarea 
                required
                placeholder="Your Message" 
                value={formData.message}
                onChange={(e) => setFormData({...formData, message: e.target.value})}
                rows={4} 
                className="w-full px-6 py-5 bg-surface-container-low border-none rounded-2xl outline-none focus:ring-2 focus:ring-primary/10 font-bold text-lg resize-none"
              ></textarea>
              {status === 'error' && <p className="text-red-500 text-xs font-bold px-1">{errorMessage}</p>}
              <button 
                disabled={status === 'submitting'}
                className={cn(
                  "btn-primary w-full py-6 text-xl flex items-center justify-center gap-3",
                  status === 'success' && "bg-green-600 hover:bg-green-600"
                )}
              >
                {status === 'submitting' ? '...' : status === 'success' ? <><CheckCircle2 /> Sent</> : <><Send /> Send Message</>}
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;