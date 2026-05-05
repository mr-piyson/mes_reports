"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, ToasterProps, useSonner } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()
  // get the variant of the sonner

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          success: "bg-success text-success-foreground",
          error: "!bg-error !text-error-foreground",
          warning: "bg-warning text-warning-foreground",
          info: "bg-info text-info-foreground",
        },
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
