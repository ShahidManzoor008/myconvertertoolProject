import SEO from '../utils/SEO.jsx';
import { motion } from 'framer-motion';

const About = () => {
  const seoData = {
    title: 'About MyConverterTool - Pro Online Developer Utilities',
    description: 'Discover the mission behind ConverterPro. We build professional-grade, free online tools to empower developers and creators worldwide.',
    keywords: 'about converterpro, mission, vision, free developer tools, productivity suite',
    canonicalUrl: '/about',
    ogType: 'website',
  };

  return (
    <div className="pb-24">
      <SEO seoData={seoData} />

      {/* Hero */}
      <section className="text-center py-20 bg-blue-600 rounded-[3rem] text-white overflow-hidden relative mb-24">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-200 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />
        </div>

        <div className="relative z-10 px-4">
          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-5xl md:text-7xl font-black tracking-tighter mb-6"
          >
            Built for <span className="text-blue-200">Builders</span>
          </motion.h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto font-medium">
            Empowering the world's creators with professional-grade tools that just work. No friction, no cost.
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center mb-32">
          <div data-aos="fade-right">
            <h2 className="text-4xl font-black mb-8 leading-tight">
              Our <span className="text-blue-600">Mission</span> to Simplify the Web
            </h2>
            <div className="space-y-6 text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
              <p>
                ConverterPro was born out of a simple observation: the web is full of tools, but very few are both professional and truly accessible. Most "free" tools are cluttered with ads, have hidden limits, or require unnecessary registrations.
              </p>
              <p>
                We decided to change that. Our mission is to provide a clean, secure, and blazing-fast suite of utilities that developers and professionals can rely on every single day.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4" data-aos="fade-left">
            <StatCard label="Monthly Users" value="10K+" />
            <StatCard label="Tools Available" value="15+" />
            <StatCard label="Avg. Speed" value="~200ms" />
            <StatCard label="Cost to You" value="$0.00" />
          </div>
        </div>

        {/* Values */}
        <section data-aos="fade-up" className="bg-slate-50 dark:bg-slate-900/50 rounded-[3rem] p-12 md:p-20 border border-slate-200 dark:border-slate-800">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-black uppercase tracking-widest text-blue-600 mb-2">Our Values</h2>
            <p className="text-slate-500 font-bold">The principles that guide every tool we build.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <ValueItem 
              icon="security" 
              title="Privacy First" 
              desc="Your data is processed and never stored. What you convert stays with you."
            />
            <ValueItem 
              icon="speed" 
              title="Blazing Fast" 
              desc="Optimized backend ensures your conversions happen in milliseconds, not minutes."
            />
            <ValueItem 
              icon="stars" 
              title="Pro Quality" 
              desc="We don't settle for 'good enough'. Our tools output precise, industry-standard results."
            />
          </div>
        </section>
      </div>
    </div>
  );
};

const StatCard = ({ label, value }) => (
  <div className="p-8 glass-card text-center">
    <div className="text-3xl font-black text-blue-600 mb-1">{value}</div>
    <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">{label}</div>
  </div>
);

const ValueItem = ({ icon, title, desc }) => (
  <div className="text-center">
    <div className="w-16 h-16 rounded-2xl bg-blue-600/10 text-blue-600 flex items-center justify-center mx-auto mb-6">
      <span className="material-icons text-3xl">{icon}</span>
    </div>
    <h3 className="text-xl font-bold mb-4">{title}</h3>
    <p className="text-slate-500 leading-relaxed">{desc}</p>
  </div>
);

export default About;