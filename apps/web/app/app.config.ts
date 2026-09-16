export default defineAppConfig({
  ui: {
    colors: {
      primary: "primary",
      secondary: "secondary",
      neutral: "slate",
    },
    header: {
      slots: {
        root: "bg-app-navigation-background border-none",
      },
    },
    container: {
      base: "max-w-auto container sm:px-3 lg:px-5 xl:px-[70px]",
    },
    button: {
      slots: {
        base: "w-fit h-fit uppercase text-center-lg",
      },
      variants: {
        color: {
          primary:
            "bg-primary-500 hover:bg-primary-500/70 active:bg-primary-600",
          neutral: "bg-slate-100 hover:bg-slate-100/70 active:bg-slate-200",
          ghost: "bg-transparent hover:bg-slate-100/70 active:bg-slate-200",
        },
        size: {
          xl: {
            base: "min-w-[6rem] h-11 px-[14px]",
          },
        },
        variant: {
          translate: "",
        },
      },
      defaultVariants: {
        size: "xl",
      },
      compoundVariants: [
        {
          color: "primary",
          size: "xl",
          class: "font-medium text-base-medium text-slate-100 rounded-lg",
        },
        {
          color: "neutral",
          size: "xl",
          class:
            "font-medium text-base-medium text-neutral-grey-1000 rounded-lg",
        },
      ],
    },
    link: {
      base: "uppercase font-medium text-base-medium text-primary-500 hover:text-primary-400",
    },
  },
});
