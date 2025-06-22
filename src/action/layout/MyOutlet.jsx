import { Outlet, useLocation } from "react-router-dom";
import { Header } from "../components/header/Header";
import { Footer } from "../components/footer/Footer";

export function MyOutlet() {
    const location = useLocation();
    const showFooter = ["/main", "/settings", "/history"].includes(location.pathname);

    return (
        <div className="layout">
            <Header />
            <main style={{ flex: 1 }}>
                <Outlet />
            </main>
            {showFooter && <Footer />}
        </div>
    );
};