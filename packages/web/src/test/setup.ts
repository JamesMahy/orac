import '@testing-library/jest-dom/vitest';

Element.prototype.scrollIntoView = () => {};

global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
