import styles from './css/SectionHeader.module.css'

const HEADING = {
    headingFontSize: {
        H1 : "var(--h1-size)",
        H2 : "var(--h2-size)",
        H3 : "var(--h3-size)",
        H4 : "var(--h4-size)",
        H5 : "var(--h5-size)",
        H6 : "var(--h6-size)"
    },
    headingFontWeight: {
        H1 : "var(--h1-fontWeight)",
        H2 : "var(--h2-fontWeight)",
        H3 : "var(--h3-fontWeight)",
        H4 : "var(--h4-fontWeight)",
        H5 : "var(--h5-fontWeight)",
        H6 : "var(--h6-fontWeight)"
    }
}

export function SectionHeader({ header }) {
    let fontStyle = {};
    switch (header.fontSize) {
        case "H1":
            fontStyle = {"fontSize" : HEADING.headingFontSize.H1, "fontWeight": HEADING.headingFontWeight.H1}
            break;
        case "H2":
            fontStyle = {"fontSize" : HEADING.headingFontSize.H2, "fontWeight": HEADING.headingFontWeight.H2}
            break;
        case "H3":
            fontStyle = {"fontSize" : HEADING.headingFontSize.H3, "fontWeight": HEADING.headingFontWeight.H3}
            break;
        case "H4":
            fontStyle = {"fontSize" : HEADING.headingFontSize.H4, "fontWeight": HEADING.headingFontWeight.H4}
            break;
        case "H5":
            fontStyle = {"fontSize" : HEADING.headingFontSize.H5, "fontWeight": HEADING.headingFontWeight.H5}
            break;
        case "H6":
            fontStyle = {"fontSize" : HEADING.headingFontSize.H6, "fontWeight": HEADING.headingFontWeight.H6}
            break;
        default:
            fontStyle = {"fontSize" : HEADING.headingFontSize.H3, "fontWeight": HEADING.headingFontWeight.H7}
            break;
    }

    const mainHeader = header.isMainHeader ? styles.isMainTitle : "";

    return (
        <div className={styles.sectionHeader}>
            <div className={`${styles.sectionTitle} ${mainHeader}`} style={fontStyle}>
                {header.title}
            </div>

            {header.isButton && (
                <div>
                    <button
                        className={styles.sectionButton}
                        onClick={header.buttonHandler}
                        disabled={header.disabled}
                    >
                        {header.buttonName}
                    </button>
                </div>
            )}

        </div>
    )
}
