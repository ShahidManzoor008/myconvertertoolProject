import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import { FiEdit, FiTrash2, FiEye, FiPlus } from 'react-icons/fi';
import ReactMarkdown from 'react-markdown';
import SimpleMDE from 'react-simplemde-editor';
import 'easymde/dist/easymde.min.css';

const BlogList = ({ blogs, onEdit, onDelete, onView }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-900">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Title
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Author
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Date
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {blogs.map((blog) => (
            <tr key={blog._id}>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {blog.title}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {blog.author}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {new Date(blog.createdAt).toLocaleDateString()}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  blog.status === 'published' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                }`}>
                  {blog.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button
                  onClick={() => onView(blog)}
                  className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 mr-3"
                >
                  <FiEye className="w-5 h-5" />
                </button>
                <button
                  onClick={() => onEdit(blog)}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-900 mr-3"
                >
                  <FiEdit className="w-5 h-5" />
                </button>
                <button
                  onClick={() => onDelete(blog)}
                  className="text-red-600 dark:text-red-400 hover:text-red-900"
                >
                  <FiTrash2 className="w-5 h-5" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const BlogEditor = ({ blog, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    tags: '',
    status: 'draft',
    coverImage: null,
    ...blog
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleContentChange = (value) => {
    setFormData((prev) => ({ ...prev, content: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setFormData((prev) => ({ ...prev, coverImage: file }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Title
        </label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Content
        </label>
        <SimpleMDE
          value={formData.content}
          onChange={handleContentChange}
          options={{
            spellChecker: false,
            toolbar: ["bold", "italic", "heading", "|", "quote", "unordered-list", "ordered-list", "|", "link", "image", "|", "preview"],
          }}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Excerpt
        </label>
        <textarea
          name="excerpt"
          value={formData.excerpt}
          onChange={handleChange}
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Tags (comma-separated)
        </label>
        <input
          type="text"
          name="tags"
          value={formData.tags}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Cover Image
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="mt-1 block w-full"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Status
        </label>
        <select
          name="status"
          value={formData.status}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        >
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
      </div>

      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
        >
          Save
        </button>
      </div>
    </form>
  );
};

const BlogPreview = ({ blog, onClose }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
    <div className="mb-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        {blog.title}
      </h2>
      <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm">
        <span>{blog.author}</span>
        <span className="mx-2">•</span>
        <span>{new Date(blog.createdAt).toLocaleDateString()}</span>
      </div>
    </div>

    {blog.coverImage && (
      <img
        src={blog.coverImage}
        alt={blog.title}
        className="w-full h-48 object-cover rounded-lg mb-6"
      />
    )}

    <div className="prose dark:prose-invert max-w-none">
      <ReactMarkdown>{blog.content}</ReactMarkdown>
    </div>

    <div className="mt-6 flex justify-end">
      <button
        onClick={onClose}
        className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
      >
        Close
      </button>
    </div>
  </div>
);

const BlogManagement = () => {
  const [blogs, setBlogs] = useState([]);
  const [selectedBlog, setSelectedBlog] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      const response = await fetch('/api/blog/posts');
      const data = await response.json();
      setBlogs(data);
    } catch (error) {
      console.error('Error fetching blogs:', error);
    }
  };

  const handleCreate = () => {
    setSelectedBlog(null);
    setIsEditing(true);
  };

  const handleEdit = (blog) => {
    setSelectedBlog(blog);
    setIsEditing(true);
  };

  const handleView = (blog) => {
    setSelectedBlog(blog);
    setIsPreviewing(true);
  };

  const handleDelete = async (blog) => {
    if (window.confirm('Are you sure you want to delete this blog post?')) {
      try {
        await fetch(`/api/blog/posts/${blog.slug}`, {
          method: 'DELETE',
        });
        await fetchBlogs();
      } catch (error) {
        console.error('Error deleting blog:', error);
      }
    }
  };

  const handleSave = async (formData) => {
    try {
      const form = new FormData();
      Object.keys(formData).forEach(key => {
        if (key === 'tags' && typeof formData[key] === 'string') {
          form.append(key, JSON.stringify(formData[key].split(',').map(tag => tag.trim())));
        } else {
          form.append(key, formData[key]);
        }
      });

      const url = selectedBlog
        ? `/api/blog/posts/${selectedBlog.slug}`
        : '/api/blog/posts';

      const response = await fetch(url, {
        method: selectedBlog ? 'PUT' : 'POST',
        body: form,
      });

      if (response.ok) {
        await fetchBlogs();
        setIsEditing(false);
        setSelectedBlog(null);
      }
    } catch (error) {
      console.error('Error saving blog:', error);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {!isEditing && !isPreviewing && (
        <>
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Blog Posts
            </h2>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCreate}
              className="px-4 py-2 flex items-center space-x-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              <FiPlus className="w-5 h-5" />
              <span>New Post</span>
            </motion.button>
          </div>
          <BlogList
            blogs={blogs}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onView={handleView}
          />
        </>
      )}

      {isEditing && (
        <BlogEditor
          blog={selectedBlog}
          onSave={handleSave}
          onCancel={() => {
            setIsEditing(false);
            setSelectedBlog(null);
          }}
        />
      )}

      {isPreviewing && selectedBlog && (
        <BlogPreview
          blog={selectedBlog}
          onClose={() => {
            setIsPreviewing(false);
            setSelectedBlog(null);
          }}
        />
      )}
    </div>
  );
};

BlogList.propTypes = {
  blogs: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      author: PropTypes.string.isRequired,
      createdAt: PropTypes.string.isRequired,
      status: PropTypes.string.isRequired,
    })
  ).isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onView: PropTypes.func.isRequired,
};

BlogEditor.propTypes = {
  blog: PropTypes.shape({
    title: PropTypes.string,
    content: PropTypes.string,
    excerpt: PropTypes.string,
    tags: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.arrayOf(PropTypes.string),
    ]),
    status: PropTypes.string,
    coverImage: PropTypes.any,
  }),
  onSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

BlogPreview.propTypes = {
  blog: PropTypes.shape({
    title: PropTypes.string.isRequired,
    author: PropTypes.string.isRequired,
    createdAt: PropTypes.string.isRequired,
    content: PropTypes.string.isRequired,
    coverImage: PropTypes.string,
  }).isRequired,
  onClose: PropTypes.func.isRequired,
};

export default BlogManagement;