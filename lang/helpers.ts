import en from "./locale/en";
import zh from "./locale/zh";

let locale = en;

const lang = window.localStorage.getItem("language");
if (lang) {
    const lowerLang = lang.toLowerCase();
    if (lowerLang.startsWith("zh")) {
        locale = zh;
    }
}

export function t(str: keyof typeof en, vars?: Record<string, string | number>): string {
    let translation = locale[str] || en[str] || str;
    
    if (vars) {
        Object.keys(vars).forEach((key) => {
            translation = translation.replace(`{${key}}`, String(vars[key]));
        });
    }
    
    return translation;
}
