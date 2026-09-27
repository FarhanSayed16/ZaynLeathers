import { Link } from "react-router-dom";

const Breadcrumbs = ({ items = [] }) => {
  if (!items.length) return null;
  return (
    <nav aria-label="Breadcrumb" className="text-xs text-tz-navy/50 mb-4">
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={`${item.label}-${i}`} className="flex items-center gap-1">
              {i > 0 && <span className="text-tz-navy/30">/</span>}
              {last || !item.to ? (
                <span className={last ? "text-tz-navy/80 font-medium" : ""}>{item.label}</span>
              ) : (
                <Link to={item.to} className="hover:text-tz-navy">
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;
