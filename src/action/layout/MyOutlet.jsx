import { Outlet, useLocation } from "react-router-dom";
import { Footer } from "../components/footer/Footer";

export function MyOutlet() {
  const location = useLocation();
  const showFooter = ["/main", "/settings", "/history"].includes(
    location.pathname,
  );


  return (
    <div className="layout">

        <Outlet />
      {showFooter && <Footer />}
    </div>
  );
}
