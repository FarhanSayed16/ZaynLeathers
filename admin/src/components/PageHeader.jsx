const PageHeader = ({ title, subtitle, actions }) => (
  <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
    <div>
      <h1 className="text-2xl sm:text-[1.65rem] font-display font-semibold text-tz-navy tracking-tight">
        {title}
      </h1>
      {subtitle ? <p className="text-sm text-tz-navy/50 mt-1 max-w-2xl">{subtitle}</p> : null}
    </div>
    {actions ? <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div> : null}
  </div>
);

export default PageHeader;
