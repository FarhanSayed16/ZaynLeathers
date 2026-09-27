import { Link } from "react-router-dom";
import SEO from "../components/SEO";

const NotFound = () => (
  <div className="min-h-[50vh] flex flex-col items-center justify-center px-4 text-center">
    <SEO title="Page not found" />
    <p className="text-xs tracking-[0.2em] uppercase text-tz-navy/40 mb-3">404</p>
    <h1 className="font-display text-4xl text-tz-navy mb-3">This page has wandered off</h1>
    <p className="text-sm text-tz-navy/60 mb-8 max-w-md">
      The link may be old, or the product is no longer listed. Head back to the shop to keep browsing.
    </p>
    <Link
      to="/shop"
      className="bg-tz-navy text-white px-6 py-3 rounded-full text-sm font-semibold hover:bg-tz-pink"
    >
      Browse the shop
    </Link>
  </div>
);

export default NotFound;
