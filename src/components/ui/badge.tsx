import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "bg-gray-50 text-gray-700 border-gray-200",
        destructive:
          "bg-red-50 text-red-700 border-red-200",
        outline: "text-foreground",
        success:
          "bg-emerald-50 text-emerald-700 border-emerald-200",
        warning:
          "bg-yellow-50 text-yellow-700 border-yellow-200",
        blue:
          "bg-blue-50 text-blue-700 border-blue-200",
        purple:
          "bg-purple-50 text-purple-700 border-purple-200",
        cyan:
          "bg-cyan-50 text-cyan-700 border-cyan-200",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }


