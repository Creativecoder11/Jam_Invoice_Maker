import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border-0 px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[#5A378F]/30 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "bg-[#E1F5EE] text-[#085041]",
        secondary:
          "bg-[#EEEDFE] text-[#3C3489]",
        destructive:
          "bg-[#FBEAF0] text-[#72243E]",
        outline:
          "border border-[#E8E8E8] text-[#1A1A1A]/60",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof badgeVariants> { }

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
