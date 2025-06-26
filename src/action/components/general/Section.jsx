import {SectionHeader} from "./SectionHeader.jsx";
import styles from './css/Section.module.css'

export function Section({ children, header }) {
    return (
        <div className={styles.section}>
            <SectionHeader header={header} />
            {children}
        </div>
    )
}
