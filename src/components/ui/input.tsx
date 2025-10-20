import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import clsx from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: Array<string | undefined | null | false>) {
  return twMerge(clsx(inputs));
}

const inputStyles = cva(
  "w-full rounded-md border bg-background text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20 disabled:cursor-not-allowed disabled:opacity-50 transition-shadow",
  {
    variants: {
      size: {
        sm: "h-9 px-3 text-sm",
        md: "h-10 px-3.5 text-base",
        lg: "h-11 px-4 text-base",
      },
      invalid: {
        true: "border-red-500 focus-visible:ring-red-500/20",
        false: "border-border",
      },
      withAdornment: {
        left: "pl-10",
        right: "pr-10",
        both: "pl-10 pr-10",
        none: "",
      },
    },
    defaultVariants: {
      size: "md",
      invalid: false,
      withAdornment: "none",
    },
  }
);

export type InputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> &
  VariantProps<typeof inputStyles> & {
    /** Left adornment (icon, text). Positioned absolutely. */
    left?: React.ReactNode;
    /** Right adornment (icon, button). Positioned absolutely. */
    right?: React.ReactNode;
    /** Error state. If string, also renders helper text below. */
    error?: boolean | string;
  };

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, size, error, left, right, withAdornment, ...props }, ref) => {
    const invalid = Boolean(error);
    const adornmentVariant = left && right ? "both" : left ? "left" : right ? "right" : "none";

    return (
      <div className="relative">
        {left ? (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
            {left}
          </div>
        ) : null}
        <input
          ref={ref}
          aria-invalid={invalid || undefined}
          className={cn(inputStyles({ size, invalid, withAdornment: withAdornment ?? adornmentVariant }), className)}
          {...props}
        />
        {right ? (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground">
            {right}
          </div>
        ) : null}
        {typeof error === "string" && (
          <p className="mt-1 text-xs text-red-600">{error}</p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export type InputFieldProps = InputProps & {
  label?: string;
  description?: string;
  /** Associates label with input via id. If omitted, one is generated. */
  id?: string;
  requiredMark?: boolean;
};

export const InputField = React.forwardRef<HTMLInputElement, InputFieldProps>(
  ({ label, description, id: idProp, required, requiredMark = true, ...props }, ref) => {
    const [id] = React.useState(idProp ?? React.useId());

    return (
      <div className="grid gap-1.5">
        {label ? (
          <label htmlFor={id} className="text-sm font-medium text-foreground">
            {label}
            {required && requiredMark ? <span className="text-red-600">*</span> : null}
          </label>
        ) : null}
        <Input id={id} ref={ref} required={required} {...props} />
        {description ? (
          <p className="text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>
    );
  }
);
InputField.displayName = "InputField";

export type PasswordInputProps = Omit<InputProps, "type" | "right"> & {
  revealByDefault?: boolean;
};

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ revealByDefault = false, ...props }, ref) => {
    const [visible, setVisible] = React.useState(revealByDefault);
    return (
      <Input
        ref={ref}
        type={visible ? "text" : "password"}
        right={
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="rounded px-1.5 py-0.5 text-xs font-medium hover:bg-foreground/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20"
            aria-label={visible ? "Hide password" : "Show password"}
          >
            {visible ? "Hide" : "Show"}
          </button>
        }
        autoComplete="current-password"
        {...props}
      />
    );
  }
);
PasswordInput.displayName = "PasswordInput";

export default Input;
