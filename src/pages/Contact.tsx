import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Github, Mail, MessageSquare, Send, ExternalLink } from "lucide-react";

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
    // Open mailto with prefilled content
    const subject = encodeURIComponent(`MianConvert feedback from ${name}`);
    const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`);
    window.open(`mailto:mianhassam96@gmail.com?subject=${subject}&body=${body}`);
    setSent(true);
    toast({ title: "Opening email client…", description: "Your message is pre-filled and ready to send." });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950 transition-colors">
      <Header />
      <main className="flex-grow px-4 py-12">
        <div className="max-w-3xl mx-auto space-y-10 animate-fade-in">

          {/* Hero */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 bg-violet-100 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 px-4 py-1.5 rounded-full text-sm font-medium">
              <MessageSquare className="w-4 h-4" /> Get in touch
            </div>
            <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white">Contact Us</h1>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
              Found a bug? Have a feature idea? Want to contribute? We'd love to hear from you.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Contact links */}
            <div className="space-y-4">
              <h2 className="font-semibold text-gray-900 dark:text-white">Reach out directly</h2>
              {LINKS.map(l => (
                <a key={l.label} href={l.href} target="_blank" rel="noreferrer"
                  className="flex items-center gap-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 hover:border-violet-300 dark:hover:border-violet-700 transition-colors group">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
                    <l.icon className={`w-5 h-5 ${l.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white">{l.label}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{l.desc}</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-violet-500 transition-colors shrink-0" />
                </a>
              ))}

              <div className="bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800 rounded-xl p-4 space-y-1">
                <p className="text-sm font-semibold text-violet-800 dark:text-violet-300">💡 Feature requests</p>
                <p className="text-xs text-violet-600 dark:text-violet-400">Open a GitHub issue for feature requests — it helps track and prioritize them.</p>
              </div>
            </div>

            {/* Contact form */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 space-y-4">
              <h2 className="font-semibold text-gray-900 dark:text-white">Send a message</h2>
              {sent ? (
                <div className="text-center py-8 space-y-2">
                  <div className="text-4xl">✉️</div>
                  <p className="font-semibold text-gray-900 dark:text-white">Email client opened!</p>
                  <p className="text-sm text-gray-500">Your message is pre-filled. Just hit send.</p>
                  <Button variant="outline" onClick={() => setSent(false)} className="mt-2">Send another</Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">Name</Label>
                    <Input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">Email</Label>
                    <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">Message</Label>
                    <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Tell us what's on your mind…"
                      rows={4} className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none" />
                  </div>
                  <Button type="submit" className="w-full bg-violet-600 hover:bg-violet-700 text-white gap-2">
                    <Send className="w-4 h-4" /> Send Message
                  </Button>
                </form>
              )}
            </div>
          </div>

        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Contact;
