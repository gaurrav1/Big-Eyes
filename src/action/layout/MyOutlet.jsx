import { Outlet } from "react-router-dom";
import { Header } from "../components/header/Header";

export function MyOutlet() {
    return (
        <div className="layout">
            <Header />
            <Outlet />
        </div>
    );
};