import { Helmet } from "react-helmet";

const SEO = ({ title, description, jsonLd }) => {
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content="online tools, file converter, QR code generator, JSON formatter, PDF tools" />
      <meta property="og:type" content="website" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={window.location.href} />
      <meta property="og:image" content="/public/logo.png" />
      <script type="application/ld+json">
        {JSON.stringify(jsonLd)}
      </script>
    </Helmet>
  );
};

export const seoData = {
  home: {
    title: "MyConverterTool - Free Online File & Code Conversion Tools",
    description: "Convert files, format JSON, generate QR codes, and more with MyConverterTool's free online tools.",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "MyConverterTool",
      "url": "https://myconvertertool.com"
    }
  },
  pdfConverter: {
    title: "PDF Converter - Convert Your Files to PDF Online",
    description: "Easily convert Word, Excel, PPT, and images to PDF with our free online PDF Converter.",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "PDF Converter",
      "applicationCategory": "Utility",
      "operatingSystem": "Web",
      "url": "https://myconvertertool.com/tools/pdf-converter"
    }
  },
  qrCodeGenerator: {
    title: "QR Code Generator - Free Online QR Code Maker",
    description: "Create custom QR codes instantly with our free online QR Code Generator.",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "QR Code Generator",
      "applicationCategory": "Utility",
      "operatingSystem": "Web",
      "url": "https://myconvertertool.com/tools/qr-code-generator"
    }
  },
  jsonFormatter: {
    title: "JSON Formatter - Beautify & Validate JSON Online",
    description: "Format, beautify, and validate your JSON code with our free JSON Formatter tool.",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "JSON Formatter",
      "applicationCategory": "DevelopmentTool",
      "operatingSystem": "Web",
      "url": "https://myconvertertool.com/tools/json-formatter"
    }
  }
};

export default SEO;
