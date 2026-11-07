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
      <section className={`mx-auto w-full max-w-7xl px-3 sm:px-6 lg:px-8 ${className}`}>
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
                <span aria-hidden="true" className="material-icons text-[26px]">verified</span>
              </div>
              <div>
                <h2 className="text-xl font-black tracking-tight text-slate-950 dark:text-white sm:text-2xl">
                  Practical tools for everyday work
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">
                  Built for clean outputs, quick downloads, and practical tools people can use without friction.
                </p>
              </div>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-emerald-800 dark:border-emerald-900/70 dark:bg-emerald-950/30 dark:text-emerald-200">
              <p className="text-3xl font-black leading-none">
                {total === null ? "..." : formatCount(total)}
              </p>
              <p className="mt-2 text-[10px] font-black uppercase tracking-widest opacity-75">
                Recorded tool actions
              </p>
            </div>
          </div>
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
