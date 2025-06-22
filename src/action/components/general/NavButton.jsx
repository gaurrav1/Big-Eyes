import styles from './css/NavButton.module.css';
import { Link } from 'react-router-dom';

export function NavButton({location, title}) {
    return (
        <Link to={`/${location}`}
            className={styles.actionButton}
        >
            {title}
        </Link>
    )
}
