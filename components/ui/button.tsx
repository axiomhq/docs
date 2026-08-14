import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import type { ComponentProps } from "react"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-md border border-transparent bg-clip-padding text-xs/relaxed font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/80",
        outline:
          "border-border hover:bg-interactive-hover hover:text-foreground aria-expanded:bg-interactive-selected aria-expanded:text-foreground dark:bg-input/30",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)] aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost:
          "hover:bg-interactive-hover hover:text-foreground aria-expanded:bg-interactive-selected aria-expanded:text-foreground",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
        link: "text-primary underline-offset-4 hover:underline",
        "solid-color":
          "bg-(--btn-accent) text-white hover:opacity-90 focus-visible:border-[var(--btn-accent,var(--primary))] focus-visible:ring-[var(--btn-accent,var(--primary))]/30",
      },
      size: {
        default:
          "h-7 gap-1 px-2 text-xs/relaxed has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        xs: "h-5 gap-1 rounded-sm px-2 text-[0.625rem] has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-2.5",
        sm: "h-6 gap-1 px-2 text-xs/relaxed has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        lg: "h-8 gap-1 px-2.5 text-xs/relaxed has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-4",
        icon: "size-7 [&_svg:not([class*='size-'])]:size-3.5",
        "icon-xs": "size-5 rounded-sm [&_svg:not([class*='size-'])]:size-2.5",
        "icon-sm": "size-6 [&_svg:not([class*='size-'])]:size-3",
        "icon-lg": "size-8 [&_svg:not([class*='size-'])]:size-4",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  arrow = false,
  children,
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props &
  VariantProps<typeof buttonVariants> & { arrow?: boolean }) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(
        buttonVariants({ variant, size, className }),
        arrow && "group/btn gap-2",
      )}
      {...props}
    >
      {children}
      {arrow && <AnimatedArrow />}
    </ButtonPrimitive>
  )
}

function ButtonLink({
  arrow = false,
  children,
  className,
  variant = "default",
  size = "default",
  ...props
}: ComponentProps<"a"> &
  VariantProps<typeof buttonVariants> & { arrow?: boolean }) {
  return (
    <a
      data-slot="button"
      className={cn(
        buttonVariants({ variant, size, className }),
        arrow && "group/btn gap-2",
      )}
      {...props}
    >
      {children}
      {arrow && <AnimatedArrow />}
    </a>
  )
}

/**
 * Two arrows share one fixed-width slot: the visible arrow exits right while
 * its replacement enters from the left. Reduced-motion users keep one static
 * arrow so the button meaning stays intact without positional movement.
 */
function AnimatedArrow() {
  return (
    <span
      aria-hidden="true"
      className="button-arrow mono-lg-medium relative inline-block align-middle"
    >
      <span className="inline-block transition duration-0 ease-out group-hover/btn:translate-x-[200%] group-hover/btn:opacity-0 group-hover/btn:duration-300 motion-reduce:transition-none motion-reduce:group-hover/btn:translate-x-0 motion-reduce:group-hover/btn:opacity-100">
        →
      </span>
      <span className="absolute top-0 left-0 inline-block translate-x-[-200%] opacity-0 transition duration-0 ease-out group-hover/btn:translate-x-0 group-hover/btn:opacity-100 group-hover/btn:duration-300 motion-reduce:hidden">
        →
      </span>
    </span>
  )
}

export { AnimatedArrow, Button, ButtonLink, buttonVariants }
