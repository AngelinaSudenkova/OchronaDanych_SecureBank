import React from 'react'
import { useState, useEffect } from 'react'
import httpClient from '../httpClient'
import DashboardPage from './DashboardPage';


const LandingPage = () => {
  const [user, setUser] = useState()
  const [csrf_token, setCsrfToken] = useState(null);

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

  const logOutUser = async () => {
    const resp = await httpClient.post("//localhost/api/logout",{}, {
            headers: {
                "X-CSRFToken": csrf_token
            }
        });
    window.location.href = "/";
  }

  useEffect(() => {
    (async () => {
      try{
      const resp = await httpClient.get("//localhost/api/@me")
      setUser(resp.data);}
      catch (error){
      }
    })();
  }, []);

  return(
    <div>
      <h1>Welcome to Xteraform Bank</h1>
      {user != null ? (
        <div>
          <DashboardPage />
          <button onClick={logOutUser}>Log out</button>
        </div>
      ) :  (<div>
    <p>You are not logged in</p>
    <div className="button-span">
    <a href="/login" ><button>Login</button></a>
    <a href="/register"> <button>Register</button> </a>
    </div>
    </div>) }
    </div>
  )
}

export default LandingPage