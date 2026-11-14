import RegisterForm from '../components/RegisterForm';
import SEO from '../utils/SEO.jsx';

const Register = () => (
  <div className="auth-page flex min-h-[calc(100dvh-5rem)] flex-col items-center justify-center bg-gray-50 py-8 dark:bg-slate-900">
    <SEO
      title="Create Account - MyConverterTool"
      description="Create a MyConverterTool account."
      canonicalUrl="/register"
      robots="noindex, follow"
    />
    <RegisterForm />
  </div>
);

export default Register;
