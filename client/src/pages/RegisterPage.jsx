import React, { useState, useEffect } from 'react';
import httpClient from '../httpClient';
import { useNavigate } from 'react-router-dom';

function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [csrf_token, setCsrfToken] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();


  const getCsrfToken = async () => {
          try {
            const response = await httpClient.get("//localhost/api/csrf-token");
            setCsrfToken(response.data.token)
          } catch (error) {
            console.error("Error fetching CSRF token:", error);
            return "";
          }
        };
  useEffect(() => {
        getCsrfToken();
      }, []);


  const handleRegister = async (event) => {
    event.preventDefault();

    const isValid = validateForm();
    if (!isValid) {
      return;
    }

    try {
      const resp = await httpClient.post('//localhost/api/register', {
        email,
        password,
      }, {
            headers: {
                "X-CSRFToken": csrf_token
            }
        });

      navigate('/login', { state: { message: 'Registration successful!' } });
    } catch (error) {
      if (error.response && error.response.status === 400) {
        const errorMessage = error.response.data.error;
        setErrorMessage(errorMessage);
      } else {
        console.error('Registration failed:', error);
        setErrorMessage('Registration failed. Please try again.');
      }
    }
  };

  const validateForm = () => {
    setErrorMessage('');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMessage('Invalid email address');
      return false;
    }

    if (password.length < 11) {
      setErrorMessage('Password must be at least 11 characters long');
      return false;
    }

    return true;
  };

  return (
    <div>
      <h1>Register</h1>
      {errorMessage && <div className="error">{errorMessage}</div>}
      <form onSubmit={handleRegister}>
        <div>
          <label htmlFor="email">Email:</label>
          <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label htmlFor="password">Password:</label>
          <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <button type="submit">Register</button>
      </form>
    </div>
  );
}

export default RegisterPage;
