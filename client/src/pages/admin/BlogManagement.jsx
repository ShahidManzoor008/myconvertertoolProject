import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { blogApi, apiClient } from '../../utils/apiClient';
import { API_ENDPOINTS } from '../../config/apiEndpoints';

const BlogManagement = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPosts, setSelectedPosts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      // Walk through every page with cursor pagination until exhaustion,
      // collecting all posts for the admin table view.
      const allPosts = [];
      let cursor = undefined;
      let hasMore = true;
      while (hasMore) {
        const data = await blogApi.getPosts({ cursor, limit: 50 });
        allPosts.push(...(data.posts || []));
        cursor = data.nextCursor;
        hasMore = Boolean(data.hasNextPage);
      }
      setPosts(allPosts);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (post) => {
    if (!window.confirm(`Are you sure you want to delete "${post.title}"?`)) return;

    try {
      await apiClient.delete(`${API_ENDPOINTS.blog.posts}/${post.slug}`);
      setPosts(posts.filter(p => p._id !== post._id));
    } catch (err) {
      console.error('Error deleting post:', err);
      alert('Failed to delete post: ' + err.message);
    }
  };

  const handleBulkDelete = async () => {
    const postsToDelete = posts.filter(post => selectedPosts.includes(post._id));
    if (!window.confirm(`Are you sure you want to delete ${postsToDelete.length} posts?`)) return;

    try {
      await Promise.all(postsToDelete.map(post => 
        apiClient.delete(`${API_ENDPOINTS.blog.posts}/${post.slug}`)
      ));

      setPosts(posts.filter(post => !selectedPosts.includes(post._id)));
      setSelectedPosts([]);
    } catch (err) {
      console.error('Error deleting posts:', err);
      alert('Failed to delete some posts');
    }
  };

  const filteredPosts = posts.filter(post => 
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (error) {
    return (
      <div className="text-center text-red-600 dark:text-red-400 p-4">
        <h2 className="text-2xl font-semibold mb-4">Error</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
      {/* Actions Bar */}
      <div className="p-4 border-b dark:border-gray-700 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <Link
            to="/admin/posts/new"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
          >
            <span className="material-icons mr-2">add</span>
            New Post
          </Link>
          {selectedPosts.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
            >
              <span className="material-icons mr-2">delete</span>
              Delete Selected
            </button>
          )}
        </div>

        <div className="flex-1 max-w-md ml-4">
          <div className="relative">
            <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              search
            </span>
            <input
              type="text"
              placeholder="Search posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Posts Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedPosts.length === posts.length}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedPosts(posts.map(post => post._id));
                    } else {
                      setSelectedPosts([]);
                    }
                  }}
                  className="rounded border-gray-300 dark:border-gray-600"
                />
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300">Title</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300">Author</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300">Date</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300">Status</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-600 dark:text-gray-300">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y dark:divide-gray-700">
            {loading ? (
              <tr>
                <td colSpan="6" className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                  Loading posts...
                </td>
              </tr>
            ) : filteredPosts.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                  No posts found
                </td>
              </tr>
            ) : (
              filteredPosts.map((post) => (
                <motion.tr
                  key={post._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedPosts.includes(post._id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedPosts([...selectedPosts, post._id]);
                        } else {
                          setSelectedPosts(selectedPosts.filter(id => id !== post._id));
                        }
                      }}
                      className="rounded border-gray-300 dark:border-gray-600"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center">
                      {post.coverImage && (
                        <img
                          src={post.coverImage}
                          alt=""
                          className="w-10 h-10 rounded object-cover mr-3"
                        />
                      )}
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {post.title}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-md">
                          {post.excerpt}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                    {post.author}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                    {new Date(post.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                      Published
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <Link
                        to={`/admin/posts/${post.slug}/edit`}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg dark:text-blue-400 dark:hover:bg-blue-900/30"
                      >
                        <span className="material-icons">edit</span>
                      </Link>
                      <button
                        onClick={() => handleDelete(post)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg dark:text-red-400 dark:hover:bg-red-900/30"
                      >
                        <span className="material-icons">delete</span>
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BlogManagement;