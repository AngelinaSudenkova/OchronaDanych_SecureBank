import { BrowserRouter, Routes, Route } from "react-router-dom"
import LandingPage from "./pages/LandingPage"
import NotFound from "./pages/NotFound";
import App from "./App";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import SettingsPage from "./pages/SettingsPage";
import { ColorModeContext, useMode } from "./theme";
import { ThemeProvider } from "@emotion/react";
import { CssBaseline } from "@mui/material";
import OtpInputWithValidation from "./components/OTPinput";

const Router = () => {

    const [theme, colorMode] = useMode();

    return (
        <ColorModeContext.Provider value={colorMode}>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                <BrowserRouter>
                    <Routes>
                        <Route path="/" element={<LandingPage />} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/register" element={<RegisterPage />} />
                        <Route path="/settings" element={<SettingsPage />} />
                        <Route path="/otp" element={<OtpInputWithValidation numberOfDigits={20}/>}/>
                        <Route path="*" element={<NotFound />} />
                    </Routes>
                </BrowserRouter>
            </ThemeProvider>
        </ColorModeContext.Provider>);
};

export default Router;