import React, { useState, useEffect } from 'react'
import httpClient from '../httpClient';

import { Box, Button, IconButton, useTheme } from "@mui/material";
import { ColorModeContext, tokens } from '../theme';
import { Grid, Paper, Avatar, TextField } from "@mui/material";
import { useContext } from "react";
import { useNavigate } from 'react-router-dom';


function LoginPage() {

  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const colorMode = useContext(ColorModeContext);

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState(null);
  const [csrf_token, setCsrfToken] = useState(null);
  const navigate = useNavigate();

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

  const handleEmailChange = (event) => {
    const newEmail = event.target.value;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (emailRegex.test(newEmail)) {
          setEmailError(null);
          setEmail(newEmail);
        } else {
          setEmail(newEmail);
          setEmailError('Please enter a valid email address.');
        }
      };

    const checkUser = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (email && emailRegex.test(email)) {
        try {
            const resp = await httpClient.post("//localhost/api/login/set", {
            email
        }, {
            headers: {
                "X-CSRFToken": csrf_token
            }
        });
            navigate('/otp', { state: { keyCombination: resp.data.combination, email: email } });
        } catch (error) {
            setEmailError("Something went wrong");
        }
    } else {
        setEmailError('Please enter a valid email address.');
        }
    };

    const paperStyle = {
      padding: 20,
      height: "70vh",
      width: 280,
      margin: "auto",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
    };

    const textFieldStyle = {
      margin: "10px 0",
    };

  return (
    <Grid>
    <Paper elevation={10} style={paperStyle}>
      <Grid align="center">
        <div> </div>
        <TextField
          placeholder="Email"
          fullWidth
          required
          sx={textFieldStyle}
          error={!!emailError}
          helperText={emailError}
          value={email}
          onChange={handleEmailChange}
        />
        <input type="hidden" name="csrf_token"/>
        <Button
          color="neutral"
          variant="contained"
          size="medium"
          onClick={checkUser}
        >
          Next
        </Button>
      </Grid>
    </Paper>
  </Grid>
  )
}


export default LoginPage