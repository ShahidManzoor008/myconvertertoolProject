import SEO from '../utils/SEO.jsx';

const About = () => {
  const seoData = {
    title: 'About MyConverterTool - Free Online Developer Tools & Utilities',
    description: 'Learn about MyConverterTool, your one-stop platform for free online developer tools, text utilities, PDF converters, and more. Discover our mission to simplify developers\' daily tasks.',
    keywords: 'about myconvertertool, online tools, developer utilities, free web tools, code conversion tools, about us',
    canonicalUrl: '/about',
    ogType: 'website',
    ogImage: '/assets/MyConverterTool.png'
  };

  return (
    <>
      <SEO seoData={seoData} />
      <div className="text-center p-10">
        <h1 className="text-3xl font-bold text-purple-600">About Us</h1>
        <p className="mt-4 text-gray-700">This website provides free online tools for developers.</p>
      </div>
    </>
  );
};

export default About;