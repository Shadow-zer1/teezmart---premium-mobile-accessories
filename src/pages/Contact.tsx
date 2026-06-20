import React, { useState } from 'react';
import { Mail, Phone, MapPin, MessageSquare, Send, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

const Contact: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'General Inquiry',
    message: ''
  });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    setErrorMessage('');

    // Access environment variable safely
    const wpUrl = (import.meta.env.VITE_WORDPRESS_URL as string || '').replace(/\/$/, '');

    if (!wpUrl) {
      setErrorMessage('VITE_WORDPRESS_URL is missing in your .env.local file.');
      setStatus('error');
      return;
    }

    // Using the numeric ID from your URL: post=20
    const formId = '20'; 

    // Contact Form 7 expects multipart/form-data
    const body = new FormData();
    body.append('_wpcf7', formId);
    // Using a more standard unit tag format to satisfy CF7 5.8.7+ restrictions
    body.append('_wpcf7_unit_tag', `wpcf7-f${formId}-p1-o1`);
    // Ensure these keys match the tags in your CF7 form editor exactly
    body.append('your-name', formData.name);
    body.append('your-email', formData.email);
    body.append('your-subject', formData.subject);
    body.append('your-message', formData.message);

    try {
      const endpoint = `${wpUrl}/wp-json/contact-form-7/v1/contact-forms/${formId}/feedback`;
      const response = await fetch(endpoint, {
        method: 'POST',
        body: body
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        console.error('Server Error Detail:', errData);
        throw new Error(`Server returned ${response.status}: ${errData.message || 'Unknown'}`);
      }

      const result = await response.json();

      if (result.status === 'mail_sent') {
        setStatus('success');
        setFormData({ name: '', email: '', subject: 'General Inquiry', message: '' });
        setTimeout(() => setStatus('idle'), 5000);
      } else {
        console.error('CF7 Error Status:', result.status, result);
        // If result.status is 'mail_failed', it confirms you need the SMTP setup
        console.error('WordPress Form Error:', result);
        setStatus('error');
        setErrorMessage(result.message || 'There was an issue sending your message. Please try again or contact us directly.');
      }
    } catch (err) {
      console.error('Form Submission Error:', err);
      setStatus('error');
      setErrorMessage('Network error. Please try again later.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-8 lg:px-12 py-24">
      <div className="text-center max-w-3xl mx-auto mb-24">
        <span className="text-primary font-label font-bold uppercase tracking-widest text-[10px] mb-4 block">Get in Touch</span>
        <h1 className="text-5xl md:text-6xl font-display font-extrabold tracking-tight mb-8">Contact Us</h1>
        <p className="text-on-surface/40 text-lg font-medium">Have questions about our premium accessories? Our team is here to help you find the perfect match for your device.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
        {/* Contact Info */}
        <div className="space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              { icon: Phone, title: "Call Us", content: "+92 327 5501610", sub: "Mon-Sat, 9am-6pm", link: "tel:+923275501610" },
              { icon: Mail, title: "Email Us", content: "teezmartpk@gmail.com", sub: "Online support 24/7", link: "mailto:teezmartpk@gmail.com" },
              { icon: MapPin, title: "Visit Us", content: "Shadra, Lahore", sub: "Lahore, Pakistan", link: "https://www.google.com/maps/search/Shadra,+Lahore" },
              { icon: MessageSquare, title: "Live Chat", content: "Available on WhatsApp", sub: "Instant response", link: "https://wa.me/923275501610" } // Assuming the same number for WhatsApp
            ].map((item, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-surface-container-low p-8 rounded-2xl shadow-sm border border-outline-variant/5"
              >
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-6">
                  <item.icon size={24} />
                </div>
                <h3 className="font-display font-bold text-lg mb-2">{item.title}</h3>
                <a href={item.link} target="_blank" rel="noopener noreferrer" className="font-bold text-primary mb-1 hover:underline">
                  {item.content}
                </a>
                <p className="text-xs text-on-surface/40 font-medium">{item.sub}</p>
              </motion.div>
            ))}
          </div>

          <div className="bg-primary text-white p-10 rounded-3xl shadow-ambient overflow-hidden relative">
            <div className="relative z-10">
              <h3 className="text-2xl font-display font-bold mb-4">Store Location</h3>
              <p className="text-white/70 mb-8 max-w-xs">Find us in the heart of Lahore for a hands-on experience with our premium gear.</p>
              <a href="https://www.google.com/maps/search/Shadra,+Lahore" target="_blank" rel="noopener noreferrer" className="bg-white text-primary px-8 py-3 rounded-xl font-bold text-sm hover:bg-surface-container-low transition-colors inline-block">
                Open in Maps 
              </a>
            </div>
            <MapPin size={120} className="absolute -bottom-8 -right-8 text-white/10" />
          </div>
        </div>

        {/* Contact Form */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-surface-container-low p-10 md:p-16 rounded-3xl shadow-sm"
        >
          <h3 className="text-3xl font-display font-extrabold mb-10 tracking-tight">Send a Message</h3>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-label font-bold uppercase tracking-widest text-on-surface/40 px-1">Full Name</label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="John Doe" 
                  className="w-full bg-white px-6 py-4 rounded-xl outline-none border border-outline-variant/10 focus:border-primary/30 transition-all font-medium"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-label font-bold uppercase tracking-widest text-on-surface/40 px-1">Email Address</label>
                <input 
                  type="email" 
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="john@example.com" 
                  className="w-full bg-white px-6 py-4 rounded-xl outline-none border border-outline-variant/10 focus:border-primary/30 transition-all font-medium"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-label font-bold uppercase tracking-widest text-on-surface/40 px-1">Subject</label>
              <select 
                value={formData.subject}
                onChange={(e) => setFormData({...formData, subject: e.target.value})}
                className="w-full bg-white px-6 py-4 rounded-xl outline-none border border-outline-variant/10 focus:border-primary/30 transition-all font-medium appearance-none"
              >
                <option>General Inquiry</option>
                <option>Order Support</option>
                <option>Wholesale</option>
                <option>Feedback</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-label font-bold uppercase tracking-widest text-on-surface/40 px-1">Message</label>
              <textarea 
                rows={5} 
                required
                value={formData.message}
                onChange={(e) => setFormData({...formData, message: e.target.value})}
                placeholder="How can we help you?" 
                className="w-full bg-white px-6 py-4 rounded-xl outline-none border border-outline-variant/10 focus:border-primary/30 transition-all font-medium resize-none"
              ></textarea>
            </div>

            {status === 'error' && (
              <p className="text-red-500 text-xs font-bold px-1">{errorMessage}</p>
            )}

            <button 
              disabled={status === 'submitting'}
              className={cn(
                "btn-primary w-full py-5 flex items-center justify-center gap-3 transition-all",
                status === 'success' && "bg-green-600 hover:bg-green-600"
              )}
            >
              {status === 'submitting' ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : status === 'success' ? (
                <>Sent Successfully <CheckCircle2 size={20} /></>
              ) : (
                <>Send Message <Send size={20} /></>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default Contact;