// utils/validation.js
export const validateParams = (params) => {
    for (const key in params) {
        if (!params[key]) {
            return `Missing parameter: ${key}`;
        }
    }
    return null;
};