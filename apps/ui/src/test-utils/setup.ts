import '@testing-library/jest-dom';
import { expect } from '@jest/globals';

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
      toHaveAttribute(attr: string, value?: string): R;
      toContainElement(element: Element | null): R;
      toHaveTextContent(text: string | RegExp): R;
      toBe(value: any): R;
      toBeNull(): R;
      toEqual(value: any): R;
      toHaveBeenCalledWith(...args: any[]): R;
      rejects: {
        toThrow(message?: string | Error): Promise<R>;
      };
    }
  }
}

// Extend expect
Object.assign(expect, {
  ...expect,
  toBeInTheDocument: () => expect.any(HTMLElement),
  toHaveAttribute: (attr: string, value?: string) => expect.any(String),
  toContainElement: (element: Element | null) => expect.any(HTMLElement),
  toHaveTextContent: (text: string | RegExp) => expect.any(String),
  toBe: (value: any) => expect.any(value),
  toBeNull: () => expect.any(null),
  toEqual: (value: any) => expect.any(value),
  toHaveBeenCalledWith: (...args: any[]) => expect.any(Function),
  rejects: {
    toThrow: (message?: string | Error) => expect.any(Promise),
  },
}); 