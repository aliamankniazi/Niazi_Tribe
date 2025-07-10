import '@testing-library/jest-dom';

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