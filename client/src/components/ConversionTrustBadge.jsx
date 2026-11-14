import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { statsApi } from "../utils/apiClient";

const formatCount = (value) => {
  const count = Number(value) || 0;

  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(count >= 10000000 ? 0 : 1)}M+`;
  }

  if (count >= 1000) {
    return `${(count / 1000).toFixed(count >= 10000 ? 0 : 1)}K+`;
  }

  return count.toLocaleString();
};

const ConversionTrustBadge = ({ className = "", variant = "default" }) => {
  const [total, setTotal] = useState(null);

  useEffect(() => {
    let cancelled = false;

    statsApi.getTotal()
      .then((data) => {
        if (!cancelled) {
          setTotal(Number.isSafeInteger(data?.total) && data.total >= 0 ? data.total : null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setTotal(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const isHero = variant === "hero";
  const isPreFooter = variant === "prefooter";

  if (isPreFooter) {
    return (
      <section aria-label="Tool usage" className={`border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 ${className}`}>
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
            <span aria-hidden="true" className="material-icons text-emerald-600 dark:text-emerald-400">verified</span>
            Practical tools for everyday work
          </div>
          {total !== null && (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-slate-900 dark:text-slate-100">{formatCount(total)}</span> recorded tool actions
            </p>
          )}
        </div>
      </section>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800 shadow-sm dark:border-emerald-900/70 dark:bg-emerald-950/30 dark:text-emerald-200 ${className}`}
    >
      <div className={`${isHero ? "h-11 w-11" : "h-9 w-9"} flex items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm`}>
        <span aria-hidden="true" className="material-icons text-[20px]">verified</span>
      </div>
      <div className="text-left">
        <p className={`${isHero ? "text-2xl" : "text-lg"} font-black leading-none`}>
          {total === null ? "..." : formatCount(total)}
        </p>
        <p className="mt-1 text-[10px] font-black uppercase tracking-widest opacity-75">
          Recorded tool actions
        </p>
      </div>
    </div>
  );
};

ConversionTrustBadge.propTypes = {
  className: PropTypes.string,
  variant: PropTypes.oneOf(["default", "hero", "prefooter"]),
};

export default ConversionTrustBadge;
