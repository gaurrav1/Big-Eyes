import { AppContextProvider } from "../context/AppContext";
import { ThemeProvider } from "../context/ThemeContext";
import { MyOutlet } from "./MyOutlet";
import {Header} from "../components/header/Header.jsx";
import {useLocation} from "react-router-dom";
import { PrevNav } from "../components/button/PrevNav";
import styles from "../components/header/css/Header.module.css";

const PAGE_TITLES = {
    "/location": "Location",
    "/settings": "Settings",
    "/history": "History",
    "/shifts": "Shifts",
};

function NavBar({ location }) {
    const title = PAGE_TITLES[location.pathname] || "";
    return (
        <div className={styles.header}>
            <PrevNav locate={"/main"} text={"Home"} />
            <div
                style={{
                    "position": "fixed",
                    "top": 0,
                    "left": 0,
                    "right": 0,
                    "zIndex": -999,
                    "minHeight": "48px",
                    "padding": "0.3rem 1.2rem",
                    "background": "var(--background-glass)",
                    "borderRadius": "18px",
                    "boxShadow": "0 4px 24px 0 rgba(31, 38, 135, 0.1)",
                    "display": "flex",
                    "flexDirection": "row",
                    "justifyContent": "center",
                    "alignItems": "center",
                    "transition": "background 0.3s, box-shadow 0.3s",
                    "textAlign": "center",
                    "fontWeight": 600,
                    "fontSize": "1.1rem",
                    "color": "var(--fg)",
                    "letterSpacing": "0.01em",
                }}
            >
                {title}
            </div>
            {/* Empty div to balance flex space */}
            <div style={{ width: 60 }} />
        </div>
    );
}

export function RootLayout() {
    const location = useLocation();
    const isMain = location.pathname === "/main";
  return (
    <>
      <AppContextProvider>
        <ThemeProvider>
            {isMain ? <Header /> : <NavBar location={location} />}
          <MyOutlet />
        </ThemeProvider>
      </AppContextProvider>
    </>
  );
};