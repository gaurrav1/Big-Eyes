import { Outlet, useLocation } from "react-router-dom";
import { Header } from "../components/header/Header";
import { Footer } from "../components/footer/Footer";
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
          flex: 1,
          textAlign: "center",
          fontWeight: 600,
          fontSize: "1.1rem",
          color: "var(--fg)",
          letterSpacing: "0.01em",
        }}
      >
        {title}
      </div>
      {/* Empty div to balance flex space */}
      <div style={{ width: 60 }} />
    </div>
  );
}

export function MyOutlet() {
  const location = useLocation();
  const showFooter = ["/main", "/settings", "/history"].includes(
    location.pathname,
  );
  const isMain = location.pathname === "/main";

  return (
    <div className="layout">
      {isMain ? <Header /> : <NavBar location={location} />}
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>
      {showFooter && <Footer />}
    </div>
  );
}
