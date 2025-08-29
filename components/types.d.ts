import 'react';

declare module 'react' {
  interface JSX {
    IntrinsicElements: {
      [elemName: string]: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    };
  }
}
