import styles from './css/Footer.module.css';
import { NavButton } from '../general/NavButton';
import { HeartIcon } from '../../svgs/Svg';

export function Footer() {
    return (
        <div className={styles.footerWrapper}>
            <div className={styles.buttonGroup}>
                <NavButton location={'settings'} title={'Settings'} />
                <NavButton location={'history'} title={'history'} />
            </div>

            <div className={styles.footer}>
                Wish you Luck <HeartIcon />
            </div>
        </div>
    )
}
