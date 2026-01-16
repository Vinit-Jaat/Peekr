const Footer = () => {
  return (
    <footer className="w-full bg-zinc-950 border-t border-zinc-800 mt-16">
      <div className="max-w-7xl mx-auto px-6 py-10">

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
          <p className="text-zinc-500">
            © {new Date().getFullYear()} Peekr. All rights reserved.
          </p>

          <div className="flex gap-4">
            <a href="#" className="text-zinc-500 hover:text-white transition">
              Privacy
            </a>
            <a href="#" className="text-zinc-500 hover:text-white transition">
              Terms
            </a>
            <a href="#" className="text-zinc-500 hover:text-white transition">
              Support
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
