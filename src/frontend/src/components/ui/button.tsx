import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Defines the visual styles for the Button component.
 * Includes variants for different semantic purposes and sizes.
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      /**
       * Defines the visual style of the button.
       * - `default`: Standard primary button.
       * - `destructive`: Button for actions that delete data or are potentially dangerous.
       * - `outline`: Button with a border and transparent background.
       * - `secondary`: Less prominent button, often used for alternative actions.
       * - `ghost`: Button with no background or border, primarily text/icon.
       * - `link`: Button styled like a hyperlink.
       * - `tertiary`: Button with muted text color, often for less important actions.
       * - `nav`: Button optimized for navigation menus (e.g., sidebars), using ghost styling with left alignment.
       */
      variant: {
        default:
          "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        tertiary: "text-muted-foreground hover:text-accent-foreground hover:bg-accent",
        nav: "hover:bg-accent hover:text-accent-foreground justify-start px-2 h-auto",
      },
      /**
       * Defines the size of the button.
       * - `default`: Standard size.
       * - `sm`: Small size.
       * - `lg`: Large size.
       * - `icon`: Square button optimized for holding a single icon.
       */
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /**
   * If true, the button will render as its child component, merging their props.
   * Useful for integrating with components like `<Link>` from routing libraries.
   * @default false
   */
  asChild?: boolean
}

/**
 * Renders a button or a link element with various styles and sizes.
 *
 * Based on the shadcn/ui Button component.
 *
 * @example
 * // Default button
 * <Button>Click me</Button>
 *
 * @example
 * // Destructive button, small size
 * <Button variant="destructive" size="sm">Delete</Button>
 *
 * @example
 * // Navigation button with an icon
 * <Button variant="nav" size="sm">
 *   <HomeIcon className="mr-2 h-4 w-4" />
 *   Home
 * </Button>
 *
 * @example
 * // Button as a child (e.g., for react-router Link)
 * <Button asChild variant="link">
 *   <Link to="/dashboard">Go to Dashboard</Link>
 * </Button>
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
