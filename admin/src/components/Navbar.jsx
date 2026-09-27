import { Menu, LogOut } from "lucide-react";
import brand from "../brand";

const Navbar = ({ setToken, onMenu }) => {
  return (
    <header className="h-16 w-full bg-white/90 backdrop-blur border-b border-tz-pink-soft flex items-center justify-between px-4 sm:px-6 z-40 no-print">
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          className="md:hidden p-2 rounded-xl hover:bg-tz-pink-soft text-tz-navy"
          onClick={onMenu}
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
        <img src={brand.logos.navbar} alt={brand.name} className="h-8 w-auto object-contain" />
        <span className="hidden sm:inline text-[11px] font-semibold tracking-[0.18em] uppercase text-tz-navy/45 border-l border-tz-navy/10 pl-3">
          Admin
        </span>
      </div>
      <button
        type="button"
        onClick={() => setToken("")}
        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-tz-navy/15 text-sm font-semibold text-tz-navy hover:bg-tz-navy hover:text-white transition"
      >
        <LogOut size={15} />
        Logout
      </button>
    </header>
  );
};

export default Navbar;
