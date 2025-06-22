export const LocationIcon = ({ width = 24, height = 24 }) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="24" height="24" fill="var(--location-bg)" />
    <path
      d="M12 21C15.5 17.4 19 14.1764 19 10.2C19 6.22355 15.866 3 12 3C8.13401 3 5 6.22355 5 10.2C5 14.1764 8.5 17.4 12 21Z"
      stroke={'var(--svg-color)'}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12 12C13.1046 12 14 11.1046 14 10C14 8.89543 13.1046 8 12 8C10.8954 8 10 8.89543 10 10C10 11.1046 10.8954 12 12 12Z"
      stroke={'var(--svg-color)'}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);


export const CalendarIcon = ({ width = 24, height = 24 }) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="24" height="24" fill="var(--calender-bg)" />
    <path
      d="M19,4H17V3a1,1,0,0,0-2,0V4H9V3A1,1,0,0,0,7,3V4H5A3,3,0,0,0,2,7V19a3,3,0,0,0,3,3H19a3,3,0,0,0,3-3V7A3,3,0,0,0,19,4Zm1,15a1,1,0,0,1-1,1H5a1,1,0,0,1-1-1V12H20Zm0-9H4V7A1,1,0,0,1,5,6H7V7A1,1,0,0,0,9,7V6h6V7a1,1,0,0,0,2,0V6h2a1,1,0,0,1,1,1Z"
      fill={'var(--svg-color)'}
    />
  </svg>
);

export const HeartIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
);

export const CloseIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

export function Close({ height, width }) {
    return (
        <svg width={width} height={height} viewBox="-3.75 -3.75 32.50 32.50" fill="none"
            xmlns="http://www.w3.org/2000/svg">
            <g id="SVGRepo_bgCarrier" strokeWidth="0" transform="translate(0,0), scale(1)">
                <rect x="-3.75" y="-3.75" width="32.50" height="32.50" rx="16.25" fill={'var(--nav-bg)'} strokeWidth="0"></rect>
            </g>
            <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
            <g id="SVGRepo_iconCarrier">
                <path d="M3 21.32L21 3.32001" stroke={'var(--color-text)'} strokeWidth="1.725" strokeLinecap="round"
                    strokeLinejoin="round"></path>
                <path d="M3 3.32001L21 21.32" stroke={'var(--color-text)'} strokeWidth="1.725" strokeLinecap="round"
                    strokeLinejoin="round"></path>
            </g>
        </svg>
    )
}


export function Contrast({ height, width }) {
    return (
        <svg fill={'var(--color-text)'} width={width} height={height} viewBox="-1.92 -1.92 35.84 35.84" version="1.1"
            xmlns="http://www.w3.org/2000/svg">
            <g id="SVGRepo_bgCarrier" strokeWidth="0">
                <rect x="-1.92" y="-1.92" width="35.84" height="35.84" rx="17.92" fill={'var(--nav-bg)'} strokeWidth="0"></rect>
            </g>
            <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
            <g id="SVGRepo_iconCarrier"><title>contrast</title>
                <path
                    d="M0 16q0 3.264 1.28 6.24t3.392 5.088 5.12 3.424 6.208 1.248q3.264 0 6.24-1.248t5.088-3.424 3.392-5.088 1.28-6.24-1.28-6.208-3.392-5.12-5.088-3.392-6.24-1.28q-3.264 0-6.208 1.28t-5.12 3.392-3.392 5.12-1.28 6.208zM4 16q0-3.264 1.6-6.016t4.384-4.352 6.016-1.632 6.016 1.632 4.384 4.352 1.6 6.016-1.6 6.048-4.384 4.352-6.016 1.6-6.016-1.6-4.384-4.352-1.6-6.048zM16 26.016q2.72 0 5.024-1.344t3.648-3.648 1.344-5.024-1.344-4.992-3.648-3.648-5.024-1.344v20z"></path>
            </g>
        </svg>
    )
}


export function Sun({ height, width }) {
    return (
        <svg width={height} height={width} viewBox="-0.24 -0.24 24.48 24.48" fill="none"
            xmlns="http://www.w3.org/2000/svg">
            <g id="SVGRepo_bgCarrier" strokeWidth="0">
                <rect x="-0.24" y="-0.24" width="24.48" height="24.48" rx="12.24" fill={'var(--nav-bg)'} strokeWidth="0"></rect>
            </g>
            <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
            <g id="SVGRepo_iconCarrier">
                <path
                    d="M12 3V4M12 20V21M4 12H3M6.31412 6.31412L5.5 5.5M17.6859 6.31412L18.5 5.5M6.31412 17.69L5.5 18.5001M17.6859 17.69L18.5 18.5001M21 12H20M16 12C16 14.2091 14.2091 16 12 16C9.79086 16 8 14.2091 8 12C8 9.79086 9.79086 8 12 8C14.2091 8 16 9.79086 16 12Z"
                    stroke={'var(--color-text)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
            </g>
        </svg>
    )
}


export function Moon({ height, width }) {
    return (
        <svg width={width} height={height} viewBox="-0.72 -0.72 25.44 25.44" fill="none"
            xmlns="http://www.w3.org/2000/svg">
            <g id="SVGRepo_bgCarrier" strokeWidth="0">
                <rect x="-0.72" y="-0.72" width="25.44" height="25.44" rx="12.72" fill={'var(--nav-bg)'} strokeWidth="0"></rect>
            </g>
            <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
            <g id="SVGRepo_iconCarrier">
                <path
                    d="M14.5739 1.11056L13.7826 2.69316C13.7632 2.73186 13.7319 2.76325 13.6932 2.7826L12.1106 3.5739C11.9631 3.64761 11.9631 3.85797 12.1106 3.93167L13.6932 4.72297C13.7319 4.74233 13.7632 4.77371 13.7826 4.81241L14.5739 6.39502C14.6476 6.54243 14.858 6.54243 14.9317 6.39502L15.723 4.81241C15.7423 4.77371 15.7737 4.74232 15.8124 4.72297L17.395 3.93167C17.5424 3.85797 17.5424 3.64761 17.395 3.5739L15.8124 2.7826C15.7737 2.76325 15.7423 2.73186 15.723 2.69316L14.9317 1.11056C14.858 0.963147 14.6476 0.963148 14.5739 1.11056Z"
                    fill={'var(--color-text)'}></path>
                <path
                    d="M19.2419 5.07223L18.4633 7.40815C18.4434 7.46787 18.3965 7.51474 18.3368 7.53464L16.0009 8.31328C15.8185 8.37406 15.8185 8.63198 16.0009 8.69276L18.3368 9.4714C18.3965 9.4913 18.4434 9.53817 18.4633 9.59789L19.2419 11.9338C19.3027 12.1161 19.5606 12.1161 19.6214 11.9338L20.4 9.59789C20.42 9.53817 20.4668 9.4913 20.5265 9.4714L22.8625 8.69276C23.0448 8.63198 23.0448 8.37406 22.8625 8.31328L20.5265 7.53464C20.4668 7.51474 20.42 7.46787 20.4 7.40815L19.6214 5.07223C19.5606 4.88989 19.3027 4.88989 19.2419 5.07223Z"
                    fill={'var(--color-text)'}></path>
                <path fillRule="evenodd" clipRule="evenodd"
                    d="M10.4075 13.6642C13.2348 16.4915 17.6517 16.7363 20.6641 14.3703C20.7014 14.341 20.7385 14.3113 20.7754 14.2812C20.9148 14.1674 21.051 14.0479 21.1837 13.9226C21.2376 13.8718 21.2909 13.8201 21.3436 13.7674C21.8557 13.2552 22.9064 13.5578 22.7517 14.2653C22.6983 14.5098 22.6365 14.7517 22.5667 14.9905C22.5253 15.1321 22.4811 15.2727 22.4341 15.4122C22.4213 15.4502 22.4082 15.4883 22.395 15.5262C20.8977 19.8142 16.7886 23.0003 12 23.0003C5.92487 23.0003 1 18.0754 1 12.0003C1 7.13315 4.29086 2.98258 8.66889 1.54252L8.72248 1.52504C8.8185 1.49401 8.91503 1.46428 9.01205 1.43587C9.26959 1.36046 9.5306 1.29438 9.79466 1.23801C10.5379 1.07934 10.8418 2.19074 10.3043 2.72815C10.251 2.78147 10.1987 2.83539 10.1473 2.88989C10.0456 2.99777 9.94766 3.10794 9.8535 3.22023C9.83286 3.24485 9.8124 3.26957 9.79212 3.29439C7.32966 6.30844 7.54457 10.8012 10.4075 13.6642ZM8.99331 15.0784C11.7248 17.8099 15.6724 18.6299 19.0872 17.4693C17.4281 19.6024 14.85 21.0003 12 21.0003C7.02944 21.0003 3 16.9709 3 12.0003C3 9.09163 4.45653 6.47161 6.66058 4.81846C5.41569 8.27071 6.2174 12.3025 8.99331 15.0784Z"
                    fill={'var(--color-text)'}></path>
            </g>
        </svg>
    )
}

export function Next({ height, width }) {
    return (
        <svg width={width} height={height} viewBox="-0.72 -0.72 25.44 25.44" fill="none"
            xmlns="http://www.w3.org/2000/svg">
            <g id="SVGRepo_bgCarrier" strokeWidth="0">
                <rect x="-0.72" y="-0.72" width="25.44" height="25.44" rx="12.72" fill={'var(--nav-bg)'} strokeWidth="0"></rect>
            </g>
            <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
            <g id="SVGRepo_iconCarrier">
                <path
                    d="M9 7L15 12L9 17"
                    stroke={'var(--color-text)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
            </g>
        </svg>
    )
}

export function Previous({ height, width }) {
    return (
        <svg width={width} height={height} viewBox="-0.72 -0.72 25.44 25.44" fill="none"
            xmlns="http://www.w3.org/2000/svg">
            <g id="SVGRepo_bgCarrier" strokeWidth="0">
                <rect x="-0.72" y="-0.72" width="25.44" height="25.44" rx="12.72" fill={'var(--nav-bg)'} strokeWidth="0"></rect>
            </g>
            <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
            <g id="SVGRepo_iconCarrier">
                <path
                    d="M15 7L9 12L15 17"
                    stroke={'var(--color-text)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
            </g>
        </svg>
    )
}