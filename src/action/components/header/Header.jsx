import { ThemeSwitcher } from "./ThemeSwitcher";

export function Header() {
    return (
        <div className="header">
            <h1 className="logo">Amazon Jobs</h1>
            <ThemeSwitcher />
        </div>
    );
};
