import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="mx-auto max-w-7xl px-4 pb-10 pointer-events-auto">
      <div className="rounded-2xl p-4 glass-card">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-[12px] text-neutral-400">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 shrink-0 rounded-full ring-2 ring-white/30 overflow-hidden bg-white/10">
              <Image src="/favicon.png" alt="Founder Flow Logo" width={28} height={28} className="w-full h-full object-cover" />
            </div>
            <span>&copy; {new Date().getFullYear()} Founder Flow</span>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <a href="/companies" className="hover:text-neutral-200 transition-colors">Companies</a>
            <a href="/companies/hiring-for" className="hover:text-neutral-200 transition-colors">Browse by role</a>
            <a href="/about" className="hover:text-neutral-200 transition-colors">About</a>
            <a href="/blog" className="hover:text-neutral-200 transition-colors">Blog</a>
            <a href="/terms" className="hover:text-neutral-200 transition-colors">Terms</a>
            <a href="/privacy" className="hover:text-neutral-200 transition-colors">Privacy</a>
            <a href="/data-removal" className="hover:text-neutral-200 transition-colors">Data Removal</a>
            <a href="mailto:info@founderflow.space" className="hover:text-neutral-200 transition-colors">Contact</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
