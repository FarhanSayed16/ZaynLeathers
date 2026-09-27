import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import brand from "../brand";
import { adminThumb, imageSrc } from "../utils/media";

const PRESETS = [
  { label: "Men", link: "/shop?department=men" },
  { label: "Women", link: "/shop?department=women" },
  { label: "Bags", link: "/shop?department=bags" },
  { label: "Accessories", link: "/shop?department=accessories" },
  { label: "All shop", link: "/shop" },
];

function TilePreview({ tile }) {
  const [broken, setBroken] = useState(false);
  const src = tile.image;
  const showImg = src && !broken;

  return (
    <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden bg-tz-cream border border-tz-pink-soft">
      {showImg ? (
        <img
          src={adminThumb(imageSrc(src)) || src}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          onError={() => setBroken(true)}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-tz-navy/25 font-display text-4xl">
          {(tile.label || "?").slice(0, 1).toUpperCase()}
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
      <div className="absolute bottom-3 left-3 right-3">
        <p className="font-display text-white text-xl leading-tight">{tile.label || "Untitled"}</p>
        <p className="text-[10px] uppercase tracking-widest text-white/70 mt-0.5">Explore</p>
      </div>
    </div>
  );
}

function PickThumb({ src, label, selected, onPick }) {
  const [broken, setBroken] = useState(false);
  if (broken || !src) return null;
  return (
    <button
      type="button"
      title={label}
      onClick={onPick}
      className={`shrink-0 w-[4.5rem] text-left ${selected ? "opacity-100" : "opacity-90 hover:opacity-100"}`}
    >
      <span
        className={`block rounded-xl overflow-hidden border-2 ${
          selected ? "border-tz-navy" : "border-transparent hover:border-tz-pink/40"
        }`}
      >
        <img
          src={adminThumb(imageSrc(src)) || src}
          alt=""
          className="w-[4.5rem] h-[4.5rem] object-cover bg-tz-cream"
          onError={() => setBroken(true)}
        />
      </span>
      {label ? (
        <span className="block mt-1 text-[10px] leading-tight text-tz-navy/60 line-clamp-2">{label}</span>
      ) : null}
    </button>
  );
}

const CategoryTilesEditor = ({ tiles = [], products = [], onChange }) => {
  const [showUrl, setShowUrl] = useState({});

  const productPicks = useMemo(() => {
    const seen = new Set();
    const list = [];
    products.forEach((p) => {
      const src = imageSrc(p.image?.[0]);
      if (!src || seen.has(src)) return;
      seen.add(src);
      list.push({ label: p.name, path: src });
    });
    return list.slice(0, 36);
  }, [products]);

  const setTiles = (next) => onChange(next.map((t, i) => ({ ...t, order: i })));

  const update = (index, patch) => {
    const next = tiles.map((t, i) => (i === index ? { ...t, ...patch } : t));
    setTiles(next);
  };

  const move = (index, dir) => {
    const j = index + dir;
    if (j < 0 || j >= tiles.length) return;
    const next = [...tiles];
    [next[index], next[j]] = [next[j], next[index]];
    setTiles(next);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-tz-navy/55">
        These four homepage cards match the shop. Pick a department, then a photo from your catalogue — missing brand files will not show a broken icon.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {tiles.map((tile, index) => (
          <article key={`${tile.order}-${index}`} className="bg-tz-cream/40 border border-tz-pink-soft rounded-2xl p-4 sm:p-5">
            <div className="flex gap-4">
              <div className="w-28 sm:w-36 shrink-0">
                <TilePreview tile={tile} />
              </div>
              <div className="flex-1 min-w-0 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-tz-navy/40">
                    Tile {index + 1}
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => move(index, -1)}
                      className="p-1.5 rounded-lg border border-tz-navy/10 disabled:opacity-30"
                      aria-label="Move up"
                    >
                      <ChevronUp size={14} />
                    </button>
                    <button
                      type="button"
                      disabled={index === tiles.length - 1}
                      onClick={() => move(index, 1)}
                      className="p-1.5 rounded-lg border border-tz-navy/10 disabled:opacity-30"
                      aria-label="Move down"
                    >
                      <ChevronDown size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setTiles(tiles.filter((_, i) => i !== index))}
                      className="p-1.5 rounded-lg border border-tz-cherry/30 text-tz-cherry"
                      aria-label="Remove tile"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-tz-navy">Label on homepage</label>
                  <input
                    className="mt-1 w-full border p-2 rounded-xl text-sm"
                    value={tile.label || ""}
                    onChange={(e) => update(index, { label: e.target.value })}
                  />
                </div>

                <div>
                  <p className="text-xs font-medium text-tz-navy mb-1.5">Opens this shop filter</p>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESETS.map((p) => {
                      const on = tile.link === p.link;
                      return (
                        <button
                          key={p.link}
                          type="button"
                          onClick={() => update(index, { label: tile.label || p.label, link: p.link })}
                          className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                            on ? "bg-tz-navy text-white" : "bg-white border border-tz-pink-soft text-tz-navy"
                          }`}
                        >
                          {p.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <p className="text-xs font-medium text-tz-navy mb-2">Photo from catalogue</p>
              {productPicks.length === 0 ? (
                <p className="text-xs text-tz-navy/45">Add products first — tiles use those photos.</p>
              ) : (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {productPicks.map((item) => (
                    <PickThumb
                      key={item.path}
                      src={item.path}
                      label={item.label}
                      selected={tile.image === item.path}
                      onPick={() => update(index, { image: item.path })}
                    />
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              className="mt-3 text-[11px] font-semibold text-tz-navy/45 underline"
              onClick={() => setShowUrl((s) => ({ ...s, [index]: !s[index] }))}
            >
              {showUrl[index] ? "Hide image URL" : "Paste image URL"}
            </button>
            {showUrl[index] && (
              <input
                className="mt-2 w-full border p-2 rounded-xl text-xs"
                value={tile.image || ""}
                onChange={(e) => update(index, { image: e.target.value })}
                placeholder="Cloudinary or site URL"
              />
            )}
          </article>
        ))}
      </div>

      {tiles.length === 0 && (
        <p className="text-sm text-center text-tz-navy/50 py-8 border border-dashed rounded-2xl">
          No tiles yet. Use Add tile or restore {brand.name} defaults.
        </p>
      )}
    </div>
  );
};

export default CategoryTilesEditor;
