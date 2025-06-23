import { AppContextProvider } from "../context/AppContext";
import { ThemeProvider } from "../context/ThemeContext";
import { MyOutlet } from "./MyOutlet";

export function RootLayout() {
  return (
    <>
      <AppContextProvider>
        <ThemeProvider>
          <MyOutlet />
        </ThemeProvider>
      </AppContextProvider>
    </>
  );
};