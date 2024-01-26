import React, { useRef, useState, useEffect } from 'react';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import { ColorModeContext, tokens } from '../theme';
import { useContext } from "react";
import { useTheme } from "@mui/system";
import { useLocation } from 'react-router-dom';
import httpClient from '../httpClient';


const squareInputStyle = {
  width: '48px',
  height: '48px',
};

function OtpInputWithValidation({numberOfDigits}) {
  const [otp, setOtp] = useState(new Array(numberOfDigits).fill(""));
  const [otpError, setOtpError] = useState(null);
  const [csrf_token, setCsrfToken] = useState(null);

  const otpBoxReference = useRef([]);
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const location = useLocation();
  const keyCombination = location.state?.keyCombination || [];
  const email = location.state?.email;

   const allIndices = Array.from({ length: numberOfDigits }, (_, index) => index);
   const blockedCells = allIndices.filter(index => !keyCombination.includes(index));


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


  function getNextNonBlockedIndex(currentIndex) {
    for (let i = currentIndex + 1; i < numberOfDigits; i++) {
      if (!blockedCells.includes(i)) {
        return i;
      }
    }
    return currentIndex;
  }


  function handleKeyDown(event, index) {
    if (event.key === "Backspace") {
      event.preventDefault(); 
      setOtpError("");
      const prevIndex = index - 1;
      const isPrevBlocked = blockedCells.includes(prevIndex);

      let newArr = [...otp];
      newArr[index] = "";
      setOtp(newArr);

      if (prevIndex >= 0 && isPrevBlocked) {
        for (let i = prevIndex - 1; i >= 0; i--) {
          if (!blockedCells.includes(i)) {
            otpBoxReference.current[i].focus();
            break;
          }
        }
      } else if (prevIndex >= 0) {
        otpBoxReference.current[prevIndex].focus();
      }
    }
  }

  function handleChange(value, index) {
    if (!blockedCells.includes(index)) {
      let newArr = [...otp];
      newArr[index] = value;
      setOtp(newArr);

      const nextIndex = getNextNonBlockedIndex(index);

      if (nextIndex < numberOfDigits) {
        otpBoxReference.current[nextIndex].focus();
      }
    }
  }

  async function handleSubmit() {
    if(email){
    const password = otp.join("");
    console.log("Submitted Password:", password);
      try{
        const resp = await httpClient.post("//localhost/api/login",{
            email,
            password
        }, {
            headers: {
                "X-CSRFToken": csrf_token
            }
        });
        window.location.href = "/";
      }catch(error){
          if (error.response && error.response.status === 401) {
            setOtpError("❌");
          } 
      }
    }else {
      setOtpError("Email is required");
    }
  }



  return (
    <article className="w-1/2">
    <h2>Password section</h2>
      <h3>Our system is being really secure...</h3>
      <div className="flex items-center gap-4">
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
      {otp.map((digit, index) => (
        <div key={index}>
        <React.Fragment key={index}>
              <TextField
                value={digit}
                type="password"
                variant="outlined"
                margin="dense"
                size="medium"
                inputProps={{ maxLength: 1 }}
                onChange={(e) => handleChange(e.target.value, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                inputRef={(reference) => (otpBoxReference.current[index] = reference)}
                error={otpError !== null}
                style={{
                  ...squareInputStyle,
                  cursor: blockedCells.includes(index) ? 'not-allowed' : 'text',
                  backgroundColor: blockedCells.includes(index) ? colors.primary[200] : colors.primary[100],
                }}
                disabled={blockedCells.includes(index)}
              />
              <div></div>
              <span style={{ marginLeft: '18px', marginTop: '4px', alignContent: "center"}}>{index}</span>
            </React.Fragment>
          <div> </div>
           </div>
        ))}
        </div>
      </div>

      <p className={`text-lg text-white mt-4 ${otpError ? 'error-show' : ''}`}>
        {otpError}
      </p>
      <Button
        onClick={handleSubmit}
        variant="contained"
        color="primary"
        className="mt-4"
      >
        Submit
      </Button>
    </article>
  );
}

export default OtpInputWithValidation;
