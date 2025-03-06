import { Link } from "react-router-dom";

const PdfTools = () => {
  const tools = [
    { title: "PDF Converter", link: "/tools/pdf-converter" },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold text-red-600 dark:text-red-400 text-center">
        PDF Tools 📄
      </h1>
      <p className="text-center text-gray-600 dark:text-gray-300 mt-2">
        Free PDF tools to convert and manage PDF files.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {tools.map((tool, index) => (
          <Link key={index} to={tool.link} className="block p-6 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 transition-transform transform hover:scale-105 hover:shadow-xl">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">{tool.title}</h3>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default PdfTools;
