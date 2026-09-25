import type { ButtonHTMLAttributes, Ref } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-medium transition-[transform,background-color,color,border-color,opacity] duration-150 ease-out active:not-disabled:scale-[0.96] disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
  {
    variants: {
      variant: {
        primary: "bg-accent text-accent-fg hover:bg-accent-deep",
        ink: "bg-ink text-surface hover:bg-ink-soft",
        outline:
          "border border-line-strong bg-transparent text-ink hover:border-ink hover:bg-surface",
        ghost: "text-ink-soft hover:text-ink hover:bg-bg-warm",
        danger: "bg-danger text-surface hover:opacity-90",
      },
      size: {
        sm: "h-10 px-3.5 text-sm rounded-[8px]",
        md: "h-11 px-5 text-sm rounded-[10px]",
        lg: "h-12 px-6 text-[15px] rounded-[12px]",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

type Props = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    ref?: Ref<HTMLButtonElement>;
  };

export function Button({ className, variant, size, type = "button", ref, ...props }: Props) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
