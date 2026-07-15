import LoginForm from '../components/LoginForm';
import SEO from '../utils/SEO.jsx';

const Login = () => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
    <SEO
      title="Sign In - MyConverterTool"
      description="Sign in to your MyConverterTool account."
      canonicalUrl="/login"
      robots="noindex, follow"
    />
    <LoginForm />
  </div>
);

export default Login;
