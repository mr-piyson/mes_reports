import {
  AlertCircle,
  AlertTriangle,
  Ban,
  CheckCircle,
  Info,
  Shield,
  X,
  XCircle,
  Zap,
} from "lucide-react"
import type React from "react"

import { Alert, AlertDescription } from "@/components/ui/alert"

// Define available icons with their names for autocomplete
const iconMap = {
  "alert-circle": AlertCircle,
  "x-circle": XCircle,
  "alert-triangle": AlertTriangle,
  info: Info,
  "check-circle": CheckCircle,
  x: X,
  ban: Ban,
  zap: Zap,
  shield: Shield,
} as const

// Type for icon names to enable autocomplete
type IconName = keyof typeof iconMap

interface ErrorAlertProps {
  /**
   * The error message to display
   */
  message: string
  /**
   * The icon to display at the top center
   * @example "alert-circle" | "x-circle" | "alert-triangle" | "info" | "check-circle" | "x" | "ban" | "zap" | "shield"
   */
  icon: IconName
  /**
   * Additional CSS classes
   */
  className?: string
  /**
   * Alert variant
   */
  variant?: "default" | "destructive"
}

export const Error: React.FC<ErrorAlertProps> = ({
  message,
  icon,
  className = "",
  variant = "destructive",
}) => {
  const IconComponent = iconMap[icon]

  return (
    <Alert className={`relative pt-12 ${className}`} variant={variant}>
      {/* Icon positioned at top center */}
      <div className="absolute top-3 left-1/2 transform -translate-x-1/2">
        <IconComponent className="h-8 w-8" />
      </div>

      {/* Alert content with top padding to accommodate icon */}
      <AlertDescription className="text-center mt-2">
        {message}
      </AlertDescription>
    </Alert>
  )
}
