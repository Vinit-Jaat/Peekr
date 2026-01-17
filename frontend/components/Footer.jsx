import { Github, Twitter, Youtube } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="w-full bg-[#09090b] border-t border-zinc-800/50 pt-16 pb-8">
      <div className="max-w-[1800px] mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          {/* Brand Info */}
          <div className="col-span-1 md:col-span-2">
            <h2 className="text-white text-2xl font-black tracking-tighter mb-4 italic">PEEKR</h2>
            <p className="text-zinc-500 max-w-sm leading-relaxed">
              The next generation of high-quality video streaming. Built for speed,
              designed for the good experience.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-bold mb-6 text-sm uppercase tracking-widest">Platform</h3>
            <ul className="space-y-4 text-sm text-zinc-500">
              <li><a href="/" className="hover:text-indigo-400 transition-colors">Browse Videos</a></li>
              <li><a href="/upload" className="hover:text-indigo-400 transition-colors">Upload</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">API Docs</a></li>
            </ul>
          </div>

          {/* Socials */}
          <div>
            <h3 className="text-white font-bold mb-6 text-sm uppercase tracking-widest">Connect</h3>
            <div className="flex gap-4">
              <a href="#" className="p-2 bg-zinc-900 rounded-lg text-zinc-400 hover:text-white hover:bg-indigo-600 transition-all">
                <Github size={20} />
              </a>
              <a href="#" className="p-2 bg-zinc-900 rounded-lg text-zinc-400 hover:text-white hover:bg-indigo-600 transition-all">
                <Twitter size={20} />
              </a>
              <a href="#" className="p-2 bg-zinc-900 rounded-lg text-zinc-400 hover:text-white hover:bg-indigo-600 transition-all">
                <Youtube size={20} />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-zinc-800/30 gap-6">
          <p className="text-zinc-600 text-xs">
            © {new Date().getFullYear()} PEEKR STUDIOS. ALL RIGHTS RESERVED.
          </p>

          <div className="flex gap-8 text-[11px] font-bold text-zinc-600 uppercase tracking-widest">
            <a href="#" className="hover:text-zinc-300 transition-colors underline decoration-zinc-800 underline-offset-4">Privacy Policy</a>
            <a href="#" className="hover:text-zinc-300 transition-colors underline decoration-zinc-800 underline-offset-4">Terms of Use</a>
            <a href="#" className="hover:text-zinc-300 transition-colors underline decoration-zinc-800 underline-offset-4">Support</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
