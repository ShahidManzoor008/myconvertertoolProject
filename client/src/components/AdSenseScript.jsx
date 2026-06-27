import { Helmet } from 'react-helmet-async';

const ADSENSE_CLIENT_ID = import.meta.env.VITE_GOOGLE_ADSENSE_CLIENT;

const AdSenseScript = () => {
  if (!ADSENSE_CLIENT_ID || ADSENSE_CLIENT_ID.includes('XXXXXXXXXXXXXXXX')) {
    return null;
  }

  return (
    <Helmet>
      <script
        async
        src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`}
        crossOrigin="anonymous"
      />
    </Helmet>
  );
};

export default AdSenseScript;
