/// <reference types="react" />

declare namespace JSX {
  interface IntrinsicElements {
    html: React.DetailedHTMLProps<React.HtmlHTMLAttributes<HTMLHtmlElement>, HTMLHtmlElement>;
    body: React.DetailedHTMLProps<React.HTMLAttributes<HTMLBodyElement>, HTMLBodyElement>;
    div: React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>;
    main: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    // Add other elements as needed
    [elemName: string]: any;
  }
}
