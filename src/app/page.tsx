"use client";

import { useState, useEffect } from 'react';
import { BookOpen, Mic, Stethoscope, ChevronRight, Menu, X, Star, Download } from 'lucide-react';
import Link from 'next/link';
import MededuLogo from '@/components/MededuLogo';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    setInstallPrompt(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-cyan-900 selection:text-white">
      {/* Navbar */}
      <nav className="fixed top-0 inset-x-0 bg-slate-950/70 backdrop-blur-xl z-50 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3">
              <MededuLogo size={40} className="shadow-lg shadow-emerald-500/20" />
              <span className="font-bold text-xl text-white tracking-tight">MedEduAI</span>
            </div>

            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-sm font-semibold text-slate-300 hover:text-cyan-400 transition-colors">Features</a>
              <a href="#how-it-works" className="text-sm font-semibold text-slate-300 hover:text-cyan-400 transition-colors">How it Works</a>
              <a href="#testimonials" className="text-sm font-semibold text-slate-300 hover:text-cyan-400 transition-colors">Testimonials</a>
              <Link href="/blog" className="text-sm font-semibold text-slate-300 hover:text-cyan-400 transition-colors">Blog</Link>
              <Link href="/login" className="px-6 py-2.5 bg-white/10 border border-white/20 text-white rounded-xl text-sm font-bold hover:bg-white/20 transition-all backdrop-blur-sm shadow-lg shadow-black/20">
                Log In
              </Link>
            </div>

            <button className="md:hidden text-white" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex flex-col pt-32 pb-20 overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat bg-fixed"
          style={{ backgroundImage: `url('/futuristic.png')` }}
        >
          {/* Overlay to ensure text readability */}
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px]"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex-grow flex flex-col justify-center items-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-950/60 border border-cyan-700/50 text-cyan-300 text-sm font-semibold mb-8 backdrop-blur-md shadow-lg shadow-cyan-900/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            Next-Gen Medical Education
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight mb-8 leading-[1.15] max-w-4xl drop-shadow-2xl">
            Master Medicine with <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 line-clamp-none">AI Intelligence</span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed drop-shadow-md font-medium">
            The all-in-one web portal for MBBS, BDS, and Nursing students. Experience personalized viva simulations, AI-generated structured notes, and smart case presentations.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-4 w-full max-w-lg mx-auto">
            <Link 
              href="/login"
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-2xl text-lg font-bold hover:shadow-lg hover:shadow-cyan-500/30 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2"
            >
              Explore MedEduAI
              <ChevronRight className="w-5 h-5" />
            </Link>
            {installPrompt && (
              <button
                onClick={handleInstall}
                className="w-full sm:w-auto px-8 py-4 bg-white/10 border border-white/20 text-white rounded-2xl text-lg font-bold hover:bg-white/20 hover:shadow-lg hover:shadow-white/10 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2 backdrop-blur-sm"
              >
                <Download className="w-5 h-5" />
                Install App
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 relative bg-slate-950 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight">Empowering the Medical Future</h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-lg">Tools built specifically for the demanding workflow of modern medical students and leading university teachers.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<BookOpen className="w-6 h-6" />}
              title="LMS Creator Intel"
              description="AI automatically generates structured topic notes tailored precisely to university examination marking patterns."
              color="cyan"
            />
            <FeatureCard
              icon={<Mic className="w-6 h-6" />}
              title="Viva Simulator"
              description="Voice-based interactive oral exams with instant, structured feedback on your terminology and confidence."
              color="blue"
            />
            <FeatureCard
              icon={<Stethoscope className="w-6 h-6" />}
              title="Case Presenter"
              description="Upload rough case summaries and let our AI restructure them into perfect clinical flow formats."
              color="indigo"
            />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24 bg-slate-900 border-y border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-3xl md:text-5xl font-bold mb-16 text-white tracking-tight">How MedEduAI Works</h2>
          <div className="grid md:grid-cols-3 gap-12">
            {[
              { step: '1', title: 'Choose Role', desc: 'Login easily to dynamically load the student or teacher interface tailored to your needs.' },
              { step: '2', title: 'Select Module', desc: 'From grading scripts to taking a simulated viva exam, navigate seamlessly via our modern sidebar.' },
              { step: '3', title: 'Master Your Output', desc: 'Securely extract perfectly formatted outputs backed by the latest AI Models.' }
            ].map((item, i) => (
              <div key={i} className="relative group">
                <div className="w-20 h-20 bg-slate-800/80 backdrop-blur-sm border border-white/10 rounded-2xl flex items-center justify-center text-3xl font-black text-transparent bg-clip-text bg-gradient-to-br from-cyan-400 to-blue-500 mx-auto mb-6 shadow-xl group-hover:scale-110 transition-transform duration-500">
                  {item.step}
                </div>
                <h3 className="text-2xl font-bold mb-4 text-white group-hover:text-cyan-300 transition-colors">{item.title}</h3>
                <p className="text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Trusted by Future Doctors</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <TestimonialCard
              name="Dr. Ananya Sharma"
              role="MBBS Intern"
              text="The AI mentor structured my messy case files directly into perfect university-standard presentations. A massive time saver during my grueling rotations!"
            />
            <TestimonialCard
              name="Dr. Rohan Iyer"
              role="Assistant Professor"
              text="MedEduAI's Evaluation Management System and auto-rubric generator means I grade batches of scripts with high precision in a fraction of the usual time."
            />
            <TestimonialCard
              name="Dr. Meera Nair"
              role="BDS Final Year"
              text="The Viva Simulator correctly pointed out when I used the wrong oral pathology descriptors. Truly remarkable system."
            />
            <TestimonialCard
              name="Dr. Arjun Patel"
              role="Medical Educator"
              text="Unbelievable. The platform correctly adapts different modules whether I'm preparing a detailed lesson plan or formulating standard question papers."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-white/10 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <MededuLogo size={32} />
            <span className="font-bold text-xl text-white">MedEduAI</span>
          </div>
          <p className="text-slate-500 text-sm">© 2026 MedEduAI Platform. Built for the future of Medicine.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description, color }: any) {
  const styles: Record<string, { bg: string, hoverBg: string, text: string, border: string, iconBg: string, hoverBorder: string, hoverShadow: string }> = {
    cyan:   { bg: 'bg-slate-900', hoverBg: 'hover:bg-slate-800', text: 'text-cyan-400', border: 'border-cyan-500/20', iconBg: 'bg-cyan-500/10', hoverBorder: 'hover:border-cyan-500/50', hoverShadow: 'hover:shadow-cyan-500/10' },
    blue:   { bg: 'bg-slate-900', hoverBg: 'hover:bg-slate-800', text: 'text-blue-400', border: 'border-blue-500/20', iconBg: 'bg-blue-500/10', hoverBorder: 'hover:border-blue-500/50', hoverShadow: 'hover:shadow-blue-500/10' },
    indigo: { bg: 'bg-slate-900', hoverBg: 'hover:bg-slate-800', text: 'text-indigo-400', border: 'border-indigo-500/20', iconBg: 'bg-indigo-500/10', hoverBorder: 'hover:border-indigo-500/50', hoverShadow: 'hover:shadow-indigo-500/10' }
  };

  const s = styles[color] || styles.cyan;

  return (
    <div className={`${s.bg} p-8 border ${s.border} rounded-3xl ${s.hoverBg} ${s.hoverBorder} hover:shadow-2xl ${s.hoverShadow} transition-all duration-300 group`}>
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 border ${s.border} ${s.iconBg} ${s.text} group-hover:scale-110 transition-transform duration-500 shadow-inner`}>
        {icon}
      </div>
      <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-cyan-300 transition-colors">{title}</h3>
      <p className="text-slate-400 leading-relaxed text-sm">{description}</p>
    </div>
  );
}

function TestimonialCard({ name, role, text }: any) {
  return (
    <div className="bg-slate-900 p-8 border border-white/5 rounded-3xl hover:border-cyan-500/30 transition-all duration-500 group relative overflow-hidden">
      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-cyan-400 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
      <div className="flex text-amber-400 mb-6 gap-1">
        {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current drop-shadow-md" />)}
      </div>
      <p className="text-slate-300 mb-8 font-medium leading-relaxed md:text-lg">"{text}"</p>
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-lg font-bold text-white shadow-inner border border-white/10">
          {name.charAt(4)}
        </div>
        <div>
          <p className="font-bold text-white">{name}</p>
          <p className="text-sm text-cyan-400 font-semibold">{role}</p>
        </div>
      </div>
    </div>
  );
}
