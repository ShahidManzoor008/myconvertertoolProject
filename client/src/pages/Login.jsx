import LoginForm from '../components/LoginForm';
import SEO from '../utils/SEO.jsx';

const Login = () => (
  <div className="auth-page flex min-h-[calc(100dvh-5rem)] flex-col items-center justify-center bg-gray-50 py-8 dark:bg-slate-900">
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
