import { css, unsafeCSS } from 'lit';
import styles from './tailwind.css?inline';

export const tailwindStyles = css`${unsafeCSS(styles)}`;
