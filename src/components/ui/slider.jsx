import * as React from "react"
import { cn } from "@/lib/utils"

const slider = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("", className)} {...props} />
))
slider.displayName = "slider"

export { slider }
