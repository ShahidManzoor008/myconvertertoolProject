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
  const [media, setMedia] = useState(null);
  const [mediaBusy, setMediaBusy] = useState(false);
  const [mediaMessage, setMediaMessage] = useState('');
  const inspectMedia = async () => {
    setMediaBusy(true); setMediaMessage('');
    try { setMedia(await apiClient.get('/api/blog/media/unused')); }
    catch { setMediaMessage('Image usage could not be checked. Try again later.'); }
    finally { setMediaBusy(false); }
  };
  const cleanMedia = async () => {
    if (!window.confirm('Remove unused generated image sizes older than seven days? Images used by drafts and published articles are kept.')) return;
    setMediaBusy(true);
    try { const result = await apiClient.post('/api/blog/media/cleanup', { confirm: true }); setMediaMessage(`${result.removed} unused image files removed.`); setMedia(null); }
    catch { setMediaMessage('Image cleanup failed. No further action was taken.'); }
    finally { setMediaBusy(false); }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      // Walk through every page with cursor pagination until exhaustion,
      // collecting all posts for the admin table view.
      const allPosts = [];
      let cursor = undefined;
      let hasMore = true;
      while (hasMore) {
        const data = await blogApi.getPosts({ cursor, limit: 50, admin: true });
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
      setSelectedPosts(current => current.filter(id => id !== post._id));
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
    (post.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (post.excerpt || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const editPath = post => `/admin/posts/${encodeURIComponent(post.slug)}/edit`;
  const statusClass = status => status === 'draft'
    ? 'bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-200'
    : status === 'archived' ? 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
      : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';

  if (error) {
    return (
      <div className="text-center text-red-600 dark:text-red-400 p-4">
        <h1 className="font-semibold mb-4">Blog posts</h1>
        <p role="alert">{error}</p>
        <button type="button" onClick={fetchPosts} className="mt-3 min-h-11 underline">Try again</button>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
      <h1 className="px-4 pt-5 font-semibold text-gray-900 dark:text-white">Blog posts</h1>
      {/* Actions Bar */}
      <div className="p-4 border-b dark:border-gray-700 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/admin/posts/new"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
          >
            <span aria-hidden="true" className="material-icons mr-2">add</span>
            New Post
          </Link>
          {selectedPosts.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
            >
              <span aria-hidden="true" className="material-icons mr-2">delete</span>
              Delete Selected
            </button>
          )}
        </div>

        <div className="w-full sm:max-w-md sm:flex-1">
          <div className="relative">
            <span aria-hidden="true" className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              search
            </span>
            <input
              type="text"
              aria-label="Search posts"
              placeholder="Search posts..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setSelectedPosts([]); }}
              className="w-full pl-10 pr-4 py-2 rounded-lg border dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <p className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">Drafts are private. Open an article to edit its content, preview it, and publish when ready.</p>
      <div className="space-y-3 p-4 lg:hidden" aria-label="Articles">
        {loading ? <p role="status">Loading posts...</p> : filteredPosts.length === 0 ? <p>No posts found</p> : filteredPosts.map(post => <article key={post._id} className="min-w-0 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
          <div className="flex items-start gap-3">
            <input type="checkbox" aria-label={`Select ${post.title}`} checked={selectedPosts.includes(post._id)} onChange={event => setSelectedPosts(current => event.target.checked ? [...current, post._id] : current.filter(id => id !== post._id))} className="mt-1 h-5 w-5 shrink-0 rounded border-gray-300" />
            <div className="min-w-0 flex-1"><span className={`inline-block rounded-full px-2 py-1 text-xs font-semibold ${statusClass(post.status)}`}>{post.status || 'published'}</span>
              <h2 className="mt-2 break-words text-base font-semibold"><Link to={editPath(post)} className="hover:underline">{post.title}</Link></h2>
              <p className="mt-2 break-words text-sm text-slate-500 dark:text-slate-400">{post.excerpt}</p>
              <p className="mt-2 text-xs text-slate-500">{post.author} · {new Date(post.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2"><Link to={editPath(post)} className="inline-flex min-h-11 flex-1 items-center justify-center rounded-lg bg-blue-700 px-3 py-2 text-sm font-semibold text-white">{post.status === 'draft' ? 'Review & publish' : 'Edit article'}</Link><button type="button" aria-label={`Delete ${post.title}`} onClick={() => handleDelete(post)} className="min-h-11 rounded-lg border border-slate-300 px-3 text-sm font-semibold text-red-700 dark:border-slate-600 dark:text-red-300">Delete</button></div>
        </article>)}
      </div>
      {/* Posts Table */}
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  aria-label="Select all matching posts"
                  checked={filteredPosts.length > 0 && filteredPosts.every(post => selectedPosts.includes(post._id))}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedPosts(filteredPosts.map(post => post._id));
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
                      aria-label={`Select ${post.title}`}
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
                          <Link to={editPath(post)} className="hover:underline">{post.title}</Link>
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
                    <span className={`px-2 py-1 text-xs rounded-full ${statusClass(post.status)}`}>
                      {post.status || 'published'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <Link
                        to={editPath(post)}
                        aria-label={`Edit ${post.title}`}
                        className="inline-flex min-h-11 min-w-11 items-center justify-center p-2 text-blue-600 hover:bg-blue-50 rounded-lg dark:text-blue-400 dark:hover:bg-blue-900/30"
                      >
                        <span className="text-sm font-semibold whitespace-nowrap">{post.status === 'draft' ? 'Review & publish' : 'Edit'}</span>
                      </Link>
                      <button aria-label={`Delete ${post.title}`}
                        onClick={() => handleDelete(post)}
                        className="inline-flex min-h-11 min-w-11 items-center justify-center p-2 text-red-600 hover:bg-red-50 rounded-lg dark:text-red-400 dark:hover:bg-red-900/30"
                      >
                        <span aria-hidden="true" className="material-icons">delete</span>
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <section className="border-t border-slate-200 p-4 dark:border-slate-700" aria-label="Blog image maintenance">
        <h2 className="text-base font-semibold">Image library maintenance</h2>
        <p className="mt-1 text-sm text-slate-500">Inspect unused generated images older than seven days. Images referenced by any saved article or draft are kept; legacy source images are excluded.</p>
        <button type="button" disabled={mediaBusy} onClick={inspectMedia} className="mt-2 min-h-11 text-sm font-semibold text-blue-700 underline disabled:opacity-50 dark:text-blue-300">{mediaBusy ? 'Checking…' : 'Check unused images'}</button>
        {media && <p className="text-sm">{media.images.length} unused files · {(media.images.reduce((sum, image) => sum + image.bytes, 0) / 1024 / 1024).toFixed(1)} MB {media.images.length > 0 && <button type="button" disabled={mediaBusy} onClick={cleanMedia} className="min-h-11 px-3 font-semibold text-red-700 underline dark:text-red-300">Clean unused images</button>}</p>}
        {mediaMessage && <p role="status" className="mt-2 text-sm">{mediaMessage}</p>}
      </section>
    </div>
  );
};

export default BlogManagement;