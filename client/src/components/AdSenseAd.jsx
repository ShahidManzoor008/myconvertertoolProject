import { useEffect } from "react";
import PropTypes from "prop-types";

const ADSENSE_CLIENT_ID = import.meta.env.VITE_GOOGLE_ADSENSE_CLIENT;

const AdSenseAd = ({ adSlot, layout = "in-article", format = "auto" }) => {
  useEffect(() => {
    if (!ADSENSE_CLIENT_ID || !adSlot) return;

    try {
      if (window.adsbygoogle) {
        window.adsbygoogle.push({});
      }
    } catch (e) {
      console.error("AdSense error:", e);
    }
  }, [adSlot]);

  if (!ADSENSE_CLIENT_ID || ADSENSE_CLIENT_ID.includes("XXXXXXXXXXXXXXXX") || !adSlot) {
    return null;
  }

  return (
    <ins
      className="adsbygoogle"
      style={{ display: "block", textAlign: "center" }}
      data-ad-client={ADSENSE_CLIENT_ID}
      data-ad-slot={adSlot}
      data-ad-format={format}
      data-ad-layout={layout}
      data-full-width-responsive="true"
    />
  );
};

AdSenseAd.propTypes = {
  adSlot: PropTypes.string.isRequired,
  layout: PropTypes.string,
  format: PropTypes.string,
};

export default AdSenseAd;
