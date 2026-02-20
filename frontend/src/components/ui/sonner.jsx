import { Toaster as Sonner } from "sonner";

const Toaster = ({ ...props }) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      style={{
        "--normal-bg": "var(--popover, #fff)",
        "--normal-text": "var(--popover-foreground, #0f172a)",
        "--normal-border": "var(--border, #e2e8f0)",
      }}
      {...props}
    />
  );
};

export { Toaster };
