import { useState, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";
import { motion } from "framer-motion";
import { FaPlus, FaMinus, FaDownload } from "react-icons/fa";

pdfjs.GlobalWorkerOptions.workerSrc = `/assets/pdf.worker.min.js`;

const PdfEditor = () => {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [textToAdd, setTextToAdd] = useState("");
  const [addTextMode, setAddTextMode] = useState(false);
  const [removeTextMode, setRemoveTextMode] = useState(false);
  const [edits, setEdits] = useState([]);
  const pdfContainerRef = useRef(null);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setPageNumber(1);
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setPdfFile(file);
      setPdfUrl(URL.createObjectURL(file));
      setEdits([]); // Clear previous edits
    }
  };

  const handlePageClick = (event) => {
    if (!pdfFile || !pdfContainerRef.current) return;

    const pdfContainer = pdfContainerRef.current;
    const rect = pdfContainer.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Convert client coordinates to PDF coordinates (assuming 1:1 scale for now)
    // This will need refinement for actual PDF coordinate systems and scaling
    const pdfX = x;
    const pdfY = rect.height - y; // PDF y-coordinates are often inverted

    if (addTextMode && textToAdd) {
      setEdits((prev) => [
        ...prev,
        { type: "addText", pageIndex: pageNumber - 1, text: textToAdd, x: pdfX, y: pdfY, size: 12, color: [0, 0, 0] },
      ]);
      setTextToAdd("");
      setAddTextMode(false);
    } else if (removeTextMode) {
      // For removeText, we'd ideally need to select an area.
      // For simplicity, let's assume a fixed size rectangle for now or implement a drag selection later.
      // This is a placeholder for actual text removal logic.
      const removeWidth = 100; // Example width
      const removeHeight = 20; // Example height
      setEdits((prev) => [
        ...prev,
        { type: "removeText", pageIndex: pageNumber - 1, x: pdfX, y: pdfY, width: removeWidth, height: removeHeight },
      ]);
      setRemoveTextMode(false);
    }
  };

  const handleSavePdf = async () => {
    if (!pdfFile || edits.length === 0) {
      alert("No PDF or no edits to save.");
      return;
    }

    const formData = new FormData();
    formData.append("file", pdfFile);
    formData.append("edits", JSON.stringify(edits));

    try {
      const response = await fetch("/api/edit-pdf", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "edited.pdf";
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        alert("PDF saved successfully!");
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error}`);
      }
    } catch (error) {
      console.error("Error saving PDF:", error);
      alert("Failed to save PDF.");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="p-6 max-w-5xl mx-auto"
    >
      <Helmet>
        <title>PDF Editor - Add & Remove Text</title>
        <meta name="description" content="Edit PDF files online: add text, remove text, and download your modified PDFs." />
      </Helmet>

      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-6">PDF Editor</h1>

      <div className="mb-4">
        <input
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>

      {pdfUrl && (
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="lg:w-2/3 bg-gray-200 dark:bg-gray-700 p-4 rounded-md shadow-md relative" ref={pdfContainerRef} onClick={handlePageClick}>
            <Document file={pdfUrl} onLoadSuccess={onDocumentLoadSuccess}>
              <Page pageNumber={pageNumber} width={pdfContainerRef.current?.offsetWidth} />
            </Document>
            {edits.map((edit, index) => {
              if (edit.pageIndex === pageNumber - 1) {
                if (edit.type === "addText") {
                  return (
                    <div
                      key={index}
                      style={{
                        position: "absolute",
                        left: edit.x,
                        top: pdfContainerRef.current.offsetHeight - edit.y - edit.size, // Adjust for inverted Y and text size
                        fontSize: edit.size,
                        color: `rgb(${edit.color[0]}, ${edit.color[1]}, ${edit.color[2]})`,
                        pointerEvents: "none", // Prevent interfering with PDF clicks
                      }}
                      className="bg-yellow-200 bg-opacity-50 p-1 rounded"
                    >
                      {edit.text}
                    </div>
                  );
                } else if (edit.type === "removeText") {
                  return (
                    <div
                      key={index}
                      style={{
                        position: "absolute",
                        left: edit.x,
                        top: pdfContainerRef.current.offsetHeight - edit.y - edit.height, // Adjust for inverted Y
                        width: edit.width,
                        height: edit.height,
                        backgroundColor: "rgba(255, 255, 255, 0.7)", // Semi-transparent white to simulate removal
                        border: "1px dashed red",
                        pointerEvents: "none",
                      }}
                    ></div>
                  );
                }
              }
              return null;
            })}
            <p className="text-center mt-4">
              Page {pageNumber} of {numPages}
            </p>
            <div className="flex justify-center gap-2 mt-2">
              <button
                onClick={() => setPageNumber(prev => Math.max(1, prev - 1))}
                disabled={pageNumber <= 1}
                className="px-4 py-2 bg-blue-500 text-white rounded-md disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPageNumber(prev => Math.min(numPages, prev + 1))}
                disabled={pageNumber >= numPages}
                className="px-4 py-2 bg-blue-500 text-white rounded-md disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>

          <div className="lg:w-1/3 bg-white dark:bg-gray-800 p-4 rounded-md shadow-md">
            <h2 className="text-xl font-semibold mb-4">Editing Tools</h2>
            <div className="mb-4">
              <label htmlFor="addText" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Text to Add:</label>
              <input
                type="text"
                id="addText"
                value={textToAdd}
                onChange={(e) => setTextToAdd(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              />
              <button
                onClick={() => setAddTextMode(!addTextMode)}
                className={`mt-2 w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md transition duration-300 ${addTextMode ? "bg-red-500 hover:bg-red-600" : "bg-blue-500 hover:bg-blue-600"} text-white`}
              >
                <FaPlus /> {addTextMode ? "Cancel Add Text" : "Add Text Mode"}
              </button>
            </div>

            <div className="mb-4">
              <button
                onClick={() => setRemoveTextMode(!removeTextMode)}
                className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md transition duration-300 ${removeTextMode ? "bg-red-500 hover:bg-red-600" : "bg-blue-500 hover:bg-blue-600"} text-white`}
              >
                <FaMinus /> {removeTextMode ? "Cancel Remove Text" : "Remove Text Mode"}
              </button>
            </div>

            <button
              onClick={handleSavePdf}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition duration-300"
            >
              <FaDownload /> Save PDF
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default PdfEditor;