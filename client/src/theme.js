import { createContext, useState, useMemo } from "react";
import { createTheme } from "@mui/material/styles";


export const tokens = (mode) => ({
  ...(mode === "dark"
    ? {
        primary: {
          100: "#3B3B3B",
          200: "#676767",
          300: "#9C9C9C",
          400: "#CACACA",
          500: "#D9D9D9",
          600: "#EEEEEE",
        },

        greenAccent: {
          500: "#30721F",
        },

        redAccent: {
          500: "#D62323",
        },
      }
    : {
        primary: {
          100: "#EEEEEE",
          200: "#D9D9D9",
          300: "#CACACA",
          400: "#9C9C9C",
          500: "#676767",
          600: "#3B3B3B",
        },

        greenAccent: {
          500: "#30721F",
        },
        redAccent: {
          500: "#D62323",
        },
      }),
});

export const themeSettings = (mode) => {
  const colors = tokens(mode);

  return {
    palette: {
      mode: mode,
      ...(mode === "dark"
        ? {
            primary: {
              main: colors.primary[200],
            },
            error: {
              main: colors.redAccent[500],
            },
            success: {
              main: colors.greenAccent[500],
            },
            neutral: {
              dark: colors.primary[100],
              main: colors.primary[300],
              light: colors.primary[500],
            },
            background: {
              default: colors.primary[100],
            },
          }
        : {
            primary: {
              main: colors.primary[300],
            },
            secondary: {
              main: colors.greenAccent[500],
            },
            neutral: {
              dark: colors.primary[600],
              main: colors.primary[300],
              light: colors.primary[100],
            },
            background: {
              default: colors.primary[100],
            },
          }),
    },
    typography: {
      fontFamily: ["Roboto Slab", "serif"].join(","),
      fontSize: 12,
      h1: {
        fontFamily: ["Roboto Slab", "serif"].join(","),
        fontSize: 40,
      },
      h2: {
        fontFamily: ["Roboto Slab", "serif"].join(","),
        fontSize: 32,
      },
      h3: {
        fontFamily: ["Roboto Slab", "serif"].join(","),
        fontSize: 24,
      },
      h4: {
        fontFamily: ["Roboto Slab", "serif"].join(","),
        fontSize: 20,
      },
      h5: {
        fontFamily: ["Roboto Slab", "serif"].join(","),
        fontSize: 16,
      },
      h6: {
        fontFamily: ["Roboto Slab", "serif"].join(","),
        fontSize: 12,
      },
    },
  };
};

//context for color mode
// context for color mode
export const ColorModeContext = createContext({
  toggleColorMode: () => {},
});

export const useMode = () => {
  const [mode, setMode] = useState("dark");

  const colorMode = useMemo(
    () => ({
      toggleColorMode: () =>
        setMode((prev) => (prev === "light" ? "dark" : "light")),
    }),
    []
  );

  const theme = useMemo(() => createTheme(themeSettings(mode)), [mode]);
  return [theme, colorMode];
};
