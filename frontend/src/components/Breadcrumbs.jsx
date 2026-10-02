import { Link } from "react-router-dom";

const Breadcrumbs = ({ items = [], tone = "default" }) => {
  if (!items.length) return null;
  const light = tone === "light";
  return (
    <nav
      aria-label="Breadcrumb"
      className={`text-xs mb-4 ${light ? "text-white/55" : "text-tz-navy/50"}`}
    >
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={`${item.label}-${i}`} className="flex items-center gap-1">
              {i > 0 && (
                <span className={light ? "text-white/35" : "text-tz-navy/30"}>/</span>
              )}
              {last || !item.to ? (
                <span
                  className={
                    last
                      ? light
                        ? "text-white/90 font-medium"
                        : "text-tz-navy/80 font-medium"
                      : ""
                  }
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  to={item.to}
                  className={light ? "text-white/70 hover:text-white" : "hover:text-tz-navy"}
                >
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
