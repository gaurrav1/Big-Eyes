import { Link } from "react-router-dom";
import { Previous } from "../../svgs/Svg";
import styles from './PrevNav.module.css'

export function PrevNav({ locate = '..', text }) {
    return (
        <Link to={locate} className={styles.prevNavBtn}>
            <div className={styles.prevNavIcon}><Previous height={24} width={24} /></div>
            <div className={styles.prevNavText}>{text}</div>
        </Link>
    )
}
