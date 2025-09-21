// ============================
// 📂 AdSenseAd.jsx (Reusable Component)
// ============================
import { useEffect } from "react";
import PropTypes from "prop-types";

const AdSenseAd = ({ adSlot, layout = "in-article", format = "auto" }) => {
  useEffect(() => {
    try {
      if (window.adsbygoogle) {
        window.adsbygoogle.push({});
      }
    } catch (e) {
      console.error("AdSense error:", e);
    }
  }, []);

  return (
    <ins
      className="adsbygoogle"
      style={{ display: "block", textAlign: "center" }}
      data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
      data-ad-slot={adSlot}
      data-ad-format={format}
      data-ad-layout={layout}
      data-full-width-responsive="true"
    ></ins>
  );
};

AdSenseAd.propTypes = {
  adSlot: PropTypes.string.isRequired,
  layout: PropTypes.string,
  format: PropTypes.string,
};

export default AdSenseAd;
