import styles from './css/WarningText.module.css'

export function WarningText({ text, isError = false }) {
    return (
        <div className={styles.warningText} style={isError ? {"color": "var(--color-error)"} : {"color" : "var(--color-warning)"}}>
            {text}
        </div>
    )
}
