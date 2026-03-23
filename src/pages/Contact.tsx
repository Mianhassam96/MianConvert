import { useState } from "react";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import AnimatedButton from "@/components/ui/AnimatedButton";
import { Github, Mail, MessageSquare, Send, ExternalLink } from "lucide-react";
import { fadeUp, stagger } from "@/lib/motion";

const LINKS = [
  { icon: Github, label: "GitHub", desc: "View source, report bugs, contribute", href: "https://github.com/Mianhassam96/MianConvert", color: "text-gray-700 dark:text-gray-200" },
  { icon: Mail, label: "Email", desc: "Direct contact for serious inquiries", href: "mailto:mianhassam96@gmail.com", color: "text-violet-600" },
];

const Contact = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) {
      toast({ variant: "destructive", title: "Please fill all fields" });
      return;
    }
    const subject = encodeURIComponent(`MianConvert feedback from ${name}`);
    const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`);
    window.open(`mailto:mianhassam96@gmail.com?subject=${subject}&body=${body}`);
    setSent(true);
    toast({ title: "Opening email client…", description: "Your message is pre-filled and ready to send." });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-[#0a0b14] transition-colors relative overflow-x-hidden">

      {/* Background blobs */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <motion.div animate={{ x: [0, 25, 0], y: [0, -20, 0] }} transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-violet-500/8 dark:bg-violet-600/12 blur-3xl" />
        <motion.div animate={{ x: [0, -20, 0], y: [0, 25, 0] }} transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 3 }}
          className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-fuchsia-500/8 dark:bg-fuchsia-600/12 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(124,58,237,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(124,58,237,0.03)_1px,transparent_1px)] bg-[size:60px_60px] dark:bg-[linear-gradient(rgba(124,58,237,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(124,58,237,0.06)_1px,transparent_1px)]" />
      </div>

      <Header />

      <main className="flex-grow px-3 sm:px-4 py-8 sm:py-12">
        <div className="max-w-3xl mx-auto space-y-8 sm:space-y-10">

          {/* Hero */}
          <motion.section variants={stagger} initial="hidden" animate="show" className="text-center space-y-3 pt-2">
            <motion.div variants={fadeUp} className="flex justify-center">
              <span className="inline-flex items-center gap-2 glass px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold text-violet-700 dark:text-violet-300 shadow-sm shadow-violet-500/10">
                <MessageSquare className="w-4 h-4" /> Get in touch
              </span>
            </motion.div>
            <motion.h1 variants={fadeUp} className="text-3xl sm:text-5xl font-black text-gray-900 dark:text-white tracking-tight">
              Contact Us
            </motion.h1>
            <motion.p variants={fadeUp} className="text-gray-500 dark:text-gray-400 max-w-md mx-auto text-sm sm:text-base">
              Found a bug? Have a feature idea? Want to contribute? We'd love to hear from you.
            </motion.p>
          </motion.section>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.4 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">

            {/* Contact links */}
            <div className="space-y-4">
              <h2 className="font-bold text-gray-900 dark:text-white text-sm sm:text-base">Reach out directly</h2>
              {LINKS.map((l, i) => (
                <motion.a key={l.label} href={l.href} target="_blank" rel="noreferrer"
                  initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + i * 0.1 }}
                  whileHover={{ x: 4, scale: 1.01 }}
                  className="flex items-center gap-4 glass-card p-4 hover:border-violet-300 dark:hover:border-violet-700 transition-all duration-300 hover:shadow-lg hover:shadow-violet-500/10 group">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
                    <l.icon className={`w-5 h-5 ${l.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">{l.label}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{l.desc}</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-violet-500 transition-colors shrink-0" />
                </motion.a>
              ))}

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.65 }}
                className="glass-card p-4 space-y-1 border-violet-200 dark:border-violet-800/60">
                <p className="text-sm font-semibold text-violet-800 dark:text-violet-300">💡 Feature requests</p>
                <p className="text-xs text-violet-600 dark:text-violet-400">Open a GitHub issue for feature requests — it helps track and prioritize them.</p>
              </motion.div>
            </div>

            {/* Contact form */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.4 }}
              className="glass-card p-5 sm:p-6 space-y-4">
              <h2 className="font-bold text-gray-900 dark:text-white text-sm sm:text-base">Send a message</h2>
              {sent ? (
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  className="text-center py-8 space-y-2">
                  <div className="text-4xl">✉️</div>
                  <p className="font-semibold text-gray-900 dark:text-white">Email client opened!</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Your message is pre-filled. Just hit send.</p>
                  <AnimatedButton variant="outline" onClick={() => setSent(false)} className="mt-2">Send another</AnimatedButton>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500 dark:text-gray-400">Name</Label>
                    <Input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500 dark:text-gray-400">Email</Label>
                    <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500 dark:text-gray-400">Message</Label>
                    <textarea value={message} onChange={e => setMessage(e.target.value)}
                      placeholder="Tell us what's on your mind…" rows={4}
                      className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none transition-colors" />
                  </div>
                  <AnimatedButton type="submit" className="w-full" size="lg">
                    <Send className="w-4 h-4" /> Send Message
                  </AnimatedButton>
                </form>
              )}
            </motion.div>
          </motion.div>

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Contact;
