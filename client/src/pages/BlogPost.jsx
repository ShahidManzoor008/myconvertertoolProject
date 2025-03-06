import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import blogPosts from "../data/blogposts.json";
import blog1 from "../assets/blog1.webp";
import blog2 from "../assets/blog2.webp";
import blog3 from "../assets/blog3.webp";
import blog4 from "../assets/blog4.webp";

// ✅ Map images from assets
const blogImages = {
  "blog1.webp": blog1,
  "blog2.webp": blog2,
  "blog3.webp": blog3,
  "blog4.webp": blog4
};

const BlogPost = () => {
  const { id } = useParams();

  // ✅ Ensure we compare ID as a string
  const post = blogPosts.find((post) => post.id === id);

  if (!post) {
    return <h1 className="text-center text-red-600 text-2xl">❌ Blog post not found!</h1>;
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* ✅ SEO Meta Tags */}
      <Helmet>
        <title>{post.title} - SMS Coding Blog</title>
        <meta name="description" content={post.excerpt} />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.excerpt} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`https://myconvertertool.com/blog/${post.id}`} />
        <meta property="og:image" content={blogImages[post.image]} />
      </Helmet>

      {/* ✅ Blog Cover Image */}
      {post.image && (
        <div className="w-full h-64 md:h-80 lg:h-96 overflow-hidden rounded-md shadow-md">
          <img 
            src={blogImages[post.image]} 
            alt={post.title} 
            className="w-full h-full object-cover" 
          />
        </div>
      )}

      {/* ✅ Blog Title */}
      <h1 className="text-4xl font-bold text-blue-600 dark:text-blue-400 text-center mt-6">
        {post.title}
      </h1>

      {/* ✅ Blog Content with Improved Styling */}
      <div
        className="mt-6 text-gray-700 dark:text-gray-300 leading-8 text-lg space-y-4"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />

      {/* 🔙 Back Button */}
      <div className="text-center mt-8">
        <Link to="/blog" className="text-blue-600 dark:text-blue-400 font-semibold text-lg hover:underline">
        🔙← Back to Blogs
        </Link>
      </div>
    </div>
  );
};

export default BlogPost;