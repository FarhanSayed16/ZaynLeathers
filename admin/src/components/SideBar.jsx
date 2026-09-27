import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  PlusSquare,
  Shirt,
  Folders,
  ShoppingBag,
  Ticket,
  Users,
  Mail,
  Image,
  Instagram,
  Video,
  Star,
  BarChart3,
  Settings,
  Wrench,
  FileText,
  X,
} from "lucide-react";

const baseLinks = [
  { to: "/", label: "Overview", icon: LayoutDashboard, end: true, group: "Dashboard" },
  { to: "/add", label: "Add product", icon: PlusSquare, group: "Catalog" },
  { to: "/list", label: "Products", icon: Shirt, group: "Catalog" },
  { to: "/categories", label: "Categories", icon: Folders, group: "Catalog" },
  { to: "/catalog-cleanup", label: "Catalog cleanup", icon: Wrench, group: "Catalog" },
  { to: "/orders", label: "Orders", icon: ShoppingBag, group: "Sales" },
  { to: "/coupons", label: "Coupons", icon: Ticket, group: "Sales" },
  { to: "/users", label: "Customers", icon: Users, group: "Sales" },
  { to: "/contacts", label: "Inbox", icon: Mail, group: "Sales" },
  { to: "/admin/hero", label: "Hero banners", icon: Image, group: "Storefront" },
  { to: "/instagram", label: "Instagram", icon: Instagram, group: "Storefront" },
  { to: "/review", label: "Homepage videos", icon: Video, group: "Storefront" },
  { to: "/product-reviews", label: "Product reviews", icon: Star, group: "Storefront" },
  { to: "/settings", label: "Settings", icon: Settings, group: "System" },
];

const analyticsLink = {
  to: "/analytics",
  label: "Analytics Pro",
  icon: BarChart3,
  group: "Dashboard",
};

const bulkInvoicesLink = {
  to: "/invoices/bulk",
  label: "Bulk invoices",
  icon: FileText,
  group: "Sales",
};

const SideBar = ({ mobileOpen, onClose, features = {} }) => {
  let links = [...baseLinks];
  if (features.analyticsPro) {
    links = [baseLinks[0], analyticsLink, ...baseLinks.slice(1)];
  }
  if (features.invoicing) {
    const ordersIdx = links.findIndex((l) => l.to === "/orders");
    if (ordersIdx >= 0) {
      links = [...links.slice(0, ordersIdx + 1), bulkInvoicesLink, ...links.slice(ordersIdx + 1)];
    }
  }

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium transition ${
      isActive
        ? "bg-tz-navy text-white shadow-sm"
        : "text-tz-navy/75 hover:bg-tz-pink-soft/70 hover:text-tz-navy"
    }`;

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 md:hidden" onClick={onClose} />
      )}
      <aside
        className={`fixed md:static z-50 top-16 md:top-0 h-[calc(100vh-64px)] md:h-full w-64 shrink-0 bg-white border-r border-tz-pink-soft transition-transform duration-300
        ${mobileOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
      >
        <div className="flex md:hidden items-center justify-between p-3 border-b border-tz-pink-soft">
          <p className="font-display font-semibold text-tz-navy px-2">Menu</p>
          <button type="button" className="p-2 rounded-lg hover:bg-tz-cream" onClick={onClose} aria-label="Close menu">
            <X size={18} />
          </button>
        </div>
        <nav className="p-3 space-y-0.5 overflow-y-auto h-[calc(100%-52px)] md:h-full">
          {links.map((item, i) => (
            <div key={item.to}>
              {(i === 0 || item.group !== links[i - 1].group) && (
                <p className="text-[10px] font-bold text-tz-navy/35 uppercase tracking-[0.16em] mt-3 first:mt-1 px-3 mb-1">
                  {item.group}
                </p>
              )}
              <NavLink to={item.to} end={item.end} className={linkClass} onClick={onClose}>
                <item.icon size={16} strokeWidth={1.75} />
                {item.label}
              </NavLink>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
};

export default SideBar;
