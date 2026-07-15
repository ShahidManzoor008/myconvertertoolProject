import RegisterForm from '../components/RegisterForm';
import SEO from '../utils/SEO.jsx';

const Register = () => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
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
