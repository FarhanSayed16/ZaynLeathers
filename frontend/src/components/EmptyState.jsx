import { Link } from "react-router-dom";

const EmptyState = ({ title, text, to, cta }) => (
  <div className="text-center py-16 px-4 bg-white rounded-2xl border border-tz-pink/15 mt-6">
    <h2 className="font-display text-2xl text-tz-navy mb-2">{title}</h2>
    {text && <p className="text-sm text-tz-navy/60 max-w-md mx-auto mb-6">{text}</p>}
    {to && cta && (
      <Link
        to={to}
        className="inline-flex bg-tz-navy text-white px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-tz-pink"
      >
        {cta}
      </Link>
    )}
  </div>
);

export default EmptyState;
