/// <reference types="vite/client" />

declare module "tippy.js" {
    const tippy: any;
    export default tippy;
}

declare module "tippy.js/dist/tippy.css";

declare module "gif.js" {
    const GIF: any;
    export default GIF;
}

declare module "gif.js/dist/gif.worker.js?url" {
    const url: string;
    export default url;
}

declare module "roughjs/bundled/rough.esm" {
  const rough: any;
  export default rough;
}