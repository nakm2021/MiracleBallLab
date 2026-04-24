/// <reference types="vite/client" />

declare module "tippy.js/dist/tippy.css";

declare module "gif.js/dist/gif.worker.js?url" {
  const workerUrl: string;
  export default workerUrl;
}

declare module "gif.js" {
  const GIF: any;
  export default GIF;
}