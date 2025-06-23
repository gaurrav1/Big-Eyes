import { useLocation } from "react-router-dom";
import { Logo } from "../Logo/Logo";
import { ThemeSwitcher } from "./ThemeSwitcher";
import styles from './css/Header.module.css';
import { PrevNav } from '../button/PrevNav'

export function Header() {
    const location = useLocation();
    const isMainHeader = ["/main"].includes(location.pathname);
    return (
            <div className={styles.header}>
                {isMainHeader ? <Logo /> : <PrevNav locate={"/main"} text={"Home"}/>}
                {isMainHeader ? <ThemeSwitcher /> : null}
            </div>
    );
};
