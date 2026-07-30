import { t } from '../locales';
import { getSettings } from '../utils';

export default class ApiStatusIndicator {
    private static element: HTMLElement | null = null;
    private static timeout: NodeJS.Timeout | null = null;

    private static create() {
        if (this.element) return;

        const locale = getSettings().locale;

        this.element = document.createElement('div');
        this.element.id = 'slopless-api-status';
        this.element.textContent = t(locale, 'api_error.label');
        this.element.title = t(locale, 'api_error.tooltip');

        this.element.style.cssText = `
            position: fixed;
            bottom: 8px;
            left: 8px;
            background: rgba(28, 28, 28, 0.85);
            color: #ef4444;
            border: 1px solid rgba(239, 68, 68, 0.4);
            padding: 3px 6px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: 600;
            font-family: monospace;
            z-index: 99999;
            opacity: 0;
            cursor: help;
            transition: opacity 0.2s ease;
        `;

        document.body.appendChild(this.element);
    }

    public static show() {
        if (!this.element) this.create();

        requestAnimationFrame(() => {
            if (this.element) {
                this.element.style.opacity = '1';
            }
        });
    }

    public static hide() {
        if (!this.element) return;

        this.element.style.opacity = '0';

        if (this.timeout) clearTimeout(this.timeout);
        this.timeout = setTimeout(() => {
            if (this.element && this.element.parentNode) {
                this.element.parentNode.removeChild(this.element);
                this.element = null;
            }
        }, 200);
    }
}