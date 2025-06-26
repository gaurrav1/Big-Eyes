import {SectionHeader} from "./SectionHeader.jsx";
import styles from './css/Section.module.css'

export function Section({ children, className = "", header }) {
    return (
        <div className={`${styles.section} ${className}`}>
            <SectionHeader header={header} />
            {children}
        </div>
    )
}
