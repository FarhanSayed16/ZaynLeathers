import { useState } from "react";
import { Link } from "react-router-dom";

const FaqList = ({ groups, initialId = null }) => {
  const [openId, setOpenId] = useState(initialId);

  return (
    <div className="space-y-10">
      {groups.map((group) => (
        <section key={group.id} id={group.id} className="scroll-mt-28">
          {group.title ? (
            <h2 className="font-display text-2xl sm:text-3xl text-tz-navy mb-4">{group.title}</h2>
          ) : null}
          <div className="border border-tz-navy/10 bg-white divide-y divide-tz-navy/10">
            {group.items.map((item, index) => {
              const id = `${group.id}-${index}`;
              const open = openId === id;
              return (
                <div key={id}>
                  <button
                    type="button"
                    className="w-full flex items-start justify-between gap-4 text-left px-4 sm:px-6 py-4 sm:py-5"
                    aria-expanded={open}
                    onClick={() => setOpenId(open ? null : id)}
                  >
                    <span className="text-sm sm:text-base font-semibold text-tz-navy leading-snug">
                      {item.q}
                    </span>
                    <span
                      className="mt-0.5 shrink-0 text-lg leading-none text-tz-navy/50"
                      aria-hidden="true"
                    >
                      {open ? "–" : "+"}
                    </span>
                  </button>
                  {open && (
                    <div className="px-4 sm:px-6 pb-5 space-y-3 text-sm leading-7 text-tz-navy/75">
                      {item.a.map((paragraph) => (
                        <p key={paragraph.slice(0, 32)}>{paragraph}</p>
                      ))}
                      {item.links?.length ? (
                        <p className="flex flex-wrap gap-x-4 gap-y-2 pt-1">
                          {item.links.map((link) => (
                            <Link
                              key={link.to + link.label}
                              to={link.to}
                              className="font-semibold text-tz-navy underline underline-offset-4"
                            >
                              {link.label}
                            </Link>
                          ))}
                        </p>
                      ) : null}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
};

export default FaqList;
