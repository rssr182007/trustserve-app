import * as React from "react"
import { cn } from "@/lib/utils"

const carousel = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("", className)} {...props} />
))
carousel.displayName = "carousel"

export { carousel }
