// أدوات بناء الميزات — كل ميزة سطر واحد.
export const col = (key, label, fmt, extra = {}) => ({ key, label, fmt, ...extra });
const simple = (type) => (id, title, rpc, opts = {}) => ({ id, title, type, rpc, ...opts });
export const stat = simple("stat");
export const bars = simple("bars");
export const table = (id, title, rpc, columns, opts = {}) => ({ id, title, type: "table", rpc, columns, size: "full", ...opts });
export const form = (id, title, rpc, fields, opts = {}) => ({ id, title, type: "form", rpc, fields, ...opts });
export const section = (id, label, order, features) => ({ id, label, order, features });
