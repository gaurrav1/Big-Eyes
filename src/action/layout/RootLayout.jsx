import { ThemeProvider } from "../context/ThemeContext";
import { MyOutlet } from "./MyOutlet";

export function RootLayout() {
  return (
    <>
      <ThemeProvider>
        <MyOutlet />
      </ThemeProvider>
    </>
  );
};