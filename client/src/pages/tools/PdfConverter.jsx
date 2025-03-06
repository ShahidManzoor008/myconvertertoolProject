import { Helmet } from "react-helmet-async";
import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { motion } from "framer-motion";
import API_BASE_URL from "../../../api.config";

const PdfConverter = () => {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [convertedFiles, setConvertedFiles] = useState([]); // For storing converted files

  // Show a popup message for 2.5 seconds
  const showPopup = (message) => {
    setPopupMessage(message);
    setTimeout(() => setPopupMessage(""), 2500);
  };

  // Configure dropzone for file uploads
  const { getRootProps, getInputProps } = useDropzone({
    multiple: true,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "application/vnd.ms-excel": [".xlsx"],
      "text/markdown": [".md", ".MD"],
      "application/vnd.ms-powerpoint": [".ppt", ".pptx"],
      "image/jpeg": [".jpg", ".jpeg", ".JPEG"],
      "image/png": [".png"],
    },
    onDrop: (acceptedFiles, rejectedFiles) => {
      if (rejectedFiles.length > 0) {
        showPopup(`Invalid file types: ${rejectedFiles.map((f) => f.name).join(", ")}`);
      }

      // Filter valid files
      const filteredFiles = acceptedFiles.filter((file) => {
        const ext = file.name.split(".").pop().toLowerCase();
        return ["pdf", "docx", "xlsx","xls", "md", "ppt", "pptx", "jpg", "jpeg", "png"].includes(ext);
      });

      if (filteredFiles.length === 0) {
        showPopup("No valid files selected!");
        return;
      }

      setUploadedFiles(filteredFiles);
      showPopup(`${filteredFiles.length} valid file(s) selected`);
    },
  });

  // Clear selected files
  const handleClearSelection = () => {
    setUploadedFiles([]);
    setConvertedFiles([]); // Clear converted files
    showPopup("Selection cleared");
  };

  // Check if all files are images
  const areAllImages = (files) => {
    return files.every((file) => {
      const ext = file.name.split(".").pop().toLowerCase();
      return ["jpg", "jpeg", "png"].includes(ext);
    });
  };

  // Handle batch conversion
  const handleBatchConversion = async () => {
    if (uploadedFiles.length === 0) {
      showPopup("No files selected for conversion");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    uploadedFiles.forEach((file) => formData.append("files", file));

    try {
      let response;
      if (areAllImages(uploadedFiles)) {
        // 🔹 Send to the API for combining images into a single PDF
        response = await fetch(`${API_BASE_URL}/api/batch-convert`, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Image conversion failed");
        }

        // Get the combined PDF file as a blob
        const blob = await response.blob();
        const downloadUrl = URL.createObjectURL(blob);

        // Set the converted file for download
        setConvertedFiles([
          {
            filename: "Converterd_images.pdf", // Default filename for combined PDF
            url: downloadUrl,
          },
        ]);
      } else {
        // 🔹 Send to the API for document conversion
        response = await fetch(`${API_BASE_URL}/api/files/upload`, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Document conversion failed");
        }

        // Handle the response for documents
        const contentType = response.headers.get("Content-Type");
        if (contentType.includes("application/json")) {
          // For Base64 responses (e.g., images converted to PDF)
          const results = await response.json();
          setConvertedFiles(
            results.map((result) => ({
              filename: result.filename,
              url: `data:application/pdf;base64,${result.base64}`,
            }))
          );
        } else {
          // For direct file downloads (e.g., PDF or ZIP)
          const blob = await response.blob();
          const downloadUrl = URL.createObjectURL(blob);
          setConvertedFiles([
            {
              filename: uploadedFiles.length > 1 ? "converted_files.zip" : "converted_document.pdf",
              url: downloadUrl,
            },
          ]);
        }
      }

      showPopup("Conversion completed! Click download to get your file.");
    } catch (error) {
      showPopup("Batch conversion failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="p-6 bg-white border rounded shadow w-9/10"
    >
      <Helmet>
        <title>Free PDF Converter | Convert Word, Excel, Images to PDF Online</title>
        <meta
          name="description"
          content="Use our free PDF converter to convert Word to PDF, Excel to PDF, images to PDF, and more. Merge, split, compress PDFs online instantly."
        />
      </Helmet>

      <motion.h2
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="text-3xl font-bold text-blue-600 mb-4 text-center"
      >
        Complete PDF Converter Tool
      </motion.h2>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="text-center text-gray-500 mb-6"
      >
        Convert DOCX, XLSX, Images, Markdown to PDF, merge or preview files.
      </motion.p>

      {/* File Dropzone */}
      <motion.div
        {...getRootProps()}
        whileHover={{ scale: 1.02 }}
        className="border-2 border-dashed p-6 text-center cursor-pointer rounded-md mb-6"
      >
        <input {...getInputProps()} />
        <p className="text-gray-600">Drag & drop files here, or click to select</p>
      </motion.div>

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <motion.ul
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="list-disc pl-5 mb-6"
        >
          {uploadedFiles.map((file, idx) => (
            <li key={idx} className="text-sm text-gray-700">
              📄 {file.name}
            </li>
          ))}
        </motion.ul>
      )}

      {/* Buttons */}
      <div className="flex justify-between">
        <motion.button
          whileHover={{ scale: 1.05 }}
          onClick={handleBatchConversion}
          disabled={loading}
          className="bg-indigo-500 text-white px-4 py-2 rounded-md"
        >
          {loading ? "Converting..." : uploadedFiles.length > 1 ? "Convert All to PDF" : "Convert to PDF"}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          onClick={handleClearSelection}
          className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition"
        >
          Clear Selection
        </motion.button>
      </div>

      {/* Conversion Results */}
      {convertedFiles.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Conversion Results</h3>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {convertedFiles.map((file, idx) => (
              <li key={idx} className="p-4 border rounded-lg shadow-sm">
                <a
                  href={file.url}
                  download={file.filename}
                  className="bg-blue-500 text-white px-3 py-1 text-sm rounded-md hover:bg-blue-600 transition"
                >
                  📥 Download {file.filename}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Popup Message */}
      {popupMessage && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg"
        >
          {popupMessage}
        </motion.div>
      )}
    </motion.div>
  );
};

export default PdfConverter;