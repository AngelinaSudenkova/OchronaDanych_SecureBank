import React, { useState, useEffect } from 'react';
import httpClient from '../httpClient';
import {

  Typography,
  CardContent,

} from '@mui/material';
 
const SettingPage = () => {
  const [user, setUser] = useState()
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [recipientCard, setRecipientEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [cardNumber, setCardNumber] = useState('');
  const [cvv, setCVV] = useState('');
  const [csrf_token, setCsrfToken] = useState(null);


  useEffect(() => {
    (async () => {
      try{
      const resp = await httpClient.get("//localhost/api/@me")
      setUser(resp.data);}
      catch (error){
      }
    })();
  }, []);

  const getCsrfToken = async () => {
          try {
            const response = await httpClient.get("//localhost/api/csrf-token");
            setCsrfToken(response.data.token)
          } catch (error) {
            return "";
          }
        };
  useEffect(() => {
        getCsrfToken();
      }, []);

  useEffect(() => {
    (async () => {
      try {
        const cardResponse = await httpClient.get('//localhost/api/card');
        setCardNumber(cardResponse.data.card_number);
        setCVV(cardResponse.data.cvv);
      } catch (error) {
        setError('An error occurred while fetching your card information.');
      }
    })();
  }, []);

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      const resp = await httpClient.post('//localhost/api/change_password', {
        current_password: currentPassword,
        new_password: newPassword
      }, {
            headers: {
                "X-CSRFToken": csrf_token
            }
        });

        if (resp.data.error) {
          alert(resp.data.error);
          setError(resp.data.error);
      } else if (resp.data.message) {
          alert(resp.data.message);
          setError(null);
      } else {
          setError('Failed to change password');
      }
  } catch (error) {
      const errorMessage = error.response.data.error;
      setError(errorMessage);
  }
  };

  return (
    <div>{user != null ? (
      <div>
      <CardContent>
            <Typography variant="h4" color="textPrimary">
              Your card number: {cardNumber}
              <br />
              Your card CVV: {cvv}
            </Typography>
      </CardContent>
      <h2>Settings</h2>
      <label htmlFor="newPassword">New Password:</label>
      <input
        type="password"
        id="newPassword"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
      />
      <br />
      <label htmlFor="confirmPassword">Confirm Password:</label>
      <input
        type="password"
        id="confirmPassword"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
      />
      <br />
      {error && <p className="error">{error}</p>}
      <button onClick={handleChangePassword}>Change Password</button>
      <a href="/" ><button>Back</button></a>
      </div>
    ) :  (<div>
      <p>You are not logged in</p>
      <div className="button-span">
      <a href="/login" ><button>Login</button></a>
      <a href="/register"> <button>Register</button> </a>
      </div>
      </div>) }
    </div>
  );
};

export default SettingPage;
