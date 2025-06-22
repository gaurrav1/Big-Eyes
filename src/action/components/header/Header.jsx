import { ThemeSwitcher } from "./ThemeSwitcher";
import styles from './css/Header.module.css';

export function Header() {
    return (
        <div className={styles.header}>
            <div className={styles.company}>
                <h1 className={styles.logo}>Amazon Jobs</h1>
            </div>
            <ThemeSwitcher />
        </div>
    );
};
