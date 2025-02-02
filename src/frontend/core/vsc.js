/**
 * @type {{ postMessage: (message: any, transfer: any) => void, setState: (newState: any) => void, getState: () => any }}
 */
// @ts-ignore
export const vsc = acquireVsCodeApi();

// @ts-ignore
window.vsc = vsc;