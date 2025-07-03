import styles from './GlassCountrySelector.module.css'

// Canada Flag SVG (React-optimized)
export function CanadaFlag({ height = 64, width = 64 }) {
    return (
        <svg
            width={width}
            height={height}
            viewBox="0 0 36 36"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            role="img"
            className={styles.flagIcon}
            preserveAspectRatio="xMidYMid meet"
            fill="none"
        >
            <rect x="0" y="0" width="36" height="36" fill="transparent" />
            <path
                fill="#D52B1E"
                d="M4 5a4 4 0 0 0-4 4v18a4 4 0 0 0 4 4h6V5H4zm28 0h-6v26h6a4 4 0 0 0 4-4V9a4 4 0 0 0-4-4z"
            ></path>
            <rect x="10" y="5" width="16" height="26" fill="#EEE" />
            <path
                fill="#D52B1E"
                d="M18.615 22.113c1.198.139 2.272.264 3.469.401l-.305-1.002a.46.46 0 0 1 .159-.476l3.479-2.834-.72-.339c-.317-.113-.23-.292-.115-.722l.531-1.936-2.021.427c-.197.03-.328-.095-.358-.215l-.261-.911-1.598 1.794c-.227.288-.687.288-.544-.376l.683-3.634-.917.475c-.257.144-.514.168-.657-.089l-1.265-2.366v.059-.059l-1.265 2.366c-.144.257-.401.233-.658.089l-.916-.475.683 3.634c.144.664-.317.664-.544.376l-1.598-1.793-.26.911c-.03.12-.162.245-.359.215l-2.021-.427.531 1.936c.113.43.201.609-.116.722l-.72.339 3.479 2.834c.138.107.208.3.158.476l-.305 1.002 3.47-.401c.106 0 .176.059.175.181l-.214 3.704h.956l-.213-3.704c.002-.123.071-.182.177-.182z"
            ></path>
        </svg>
    );
}

// USA Flag SVG (React-optimized)
export function UsaFlag({ height = 64, width = 64 }) {
    return (
        <svg
            width={width}
            height={height}
            viewBox="0 0 7410 3900"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            role="img"
            className={styles.flagIcon}
            fill="none"
        >
            <rect width="7410" height="3900" fill="#b31942" />
            <g>
                <path
                    d="M0,450H7410m0,600H0m0,600H7410m0,600H0m0,600H7410m0,600H0"
                    stroke="#FFF"
                    strokeWidth="300"
                />
                <rect width="2964" height="2100" fill="#0a3161" />
                {/* Stars */}
                <g fill="#FFF">
                    {/* 9 rows of stars */}
                    {[...Array(9)].map((_, row) =>
                        [...Array(row % 2 === 0 ? 6 : 5)].map((_, col) => {
                            const x = 247 + col * 494 + (row % 2 === 0 ? 0 : 247);
                            const y = 210 + row * 210;
                            return (
                                <polygon
                                    key={`star-${row}-${col}`}
                                    points="247,90 317.534,307.082 132.873,172.918 361.127,172.918 176.466,307.082"
                                    transform={`translate(${x - 247},${y - 90}) scale(0.6)"`}
                                />
                            );
                        }),
                    )}
                </g>
            </g>
        </svg>
    );
}