import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";

export { default as Button } from "./Button.vue";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md uppercase text-sm lg:text-base font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none",
  {
    variants: {
      variant: {
        primary: "bg-primary-500 text-neutral-grey-100 hover:bg-primary/90",
        outline:
          "border bg-neutral-grey-100 border-neutral-grey-500 text-neutral-grey-1000",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        lg: "h-11 px-[14px]",
        md: "h-10 px-[14px]",
        sm: "h-9 px-3",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "lg",
    },
  }
);
export type ButtonVariants = VariantProps<typeof buttonVariants>;
