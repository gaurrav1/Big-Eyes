import { useLocation } from "react-router-dom";
import { Logo } from "../Logo/Logo";
import { ThemeSwitcher } from "./ThemeSwitcher";
import styles from './css/Header.module.css';
import { PrevNav } from '../button/PrevNav'

export function Header() {
    const location = useLocation();
    const showLogo = ["/main"].includes(location.pathname);
    return (
        <div className={styles.headerWrapper}>
            <div className={styles.header}>
                {showLogo ? <Logo /> : <PrevNav locate={"/main"} text={"Home"}/>}
                <ThemeSwitcher />
            </div>
        </div>
    );
};
