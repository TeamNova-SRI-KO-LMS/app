import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../context/useAuth';
import { useState } from 'react';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
  });

  const [validationError, setValidationError] = useState('');
  const { register, loading, error } = useAuth();
  const navigate = useNavigate();

  const handleChange = e => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (validationError) {
      setValidationError('');
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setValidationError('Passwords do not match');
      return;
    }

    setValidationError('');
    const result = await register(
      formData.name,
      formData.email,
      formData.password,
      formData.role,
    );
    if (result.success) {
      navigate('/home');
    }
  };

  const formError = validationError || error;

  return (
    <div className="h-screen overflow-hidden flex flex-col items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-4">
        
        {/* Header Section */}
        <div>
          <div className="flex justify-center">
            <img 
              src="/sri-ko-logo.png" 
              alt="SRI-KO Foreign Language Training Center" 
              className="h-10 w-auto object-contain"
            />
          </div>
          <h2 className="mt-2 text-center text-2xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-1 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              Sign in here
            </Link>
          </p>
        </div>

        {/* Form Section */}
        <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-3">
            <div>
              <label
                htmlFor="name"
                className="block text-xs font-medium text-gray-700"
              >
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                className="input-field mt-1 w-full text-sm"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={handleChange}
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-xs font-medium text-gray-700"
              >
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="input-field mt-1 w-full text-sm"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div>
              <label
                htmlFor="role"
                className="block text-xs font-medium text-gray-700"
              >
                Account Type
              </label>
              <select
                id="role"
                name="role"
                className="input-field mt-1 w-full text-sm"
                value={formData.role}
                onChange={handleChange}
              >
                <option value="student">Student</option>
                <option value="instructor">Instructor</option>
              </select>
            </div>

            {/* Passwords placed side-by-side to save vertical space */}
            <div className="grid grid-row sm:grid-row-3 gap-3">
              <div>
                <label
                  htmlFor="password"
                  className="block text-xs font-medium text-gray-700"
                >
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="input-field mt-1 w-full text-sm"
                  placeholder="Create password"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-xs font-medium text-gray-700"
                >
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="input-field mt-1 w-full text-sm"
                  placeholder="Confirm password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {formError ? (
            <p className="text-sm text-red-600 bg-red-50 p-2 rounded" role="alert">
              {formError}
            </p>
          ) : null}

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className={`w-full btn-primary ${loading ? 'opacity-50 cursor-not-allowed' : ''} text-sm`}
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;