import * as React from "react"
import { cn } from "@/lib/utils"

const collapsible = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("", className)} {...props} />
))
collapsible.displayName = "collapsible"

export { collapsible }
