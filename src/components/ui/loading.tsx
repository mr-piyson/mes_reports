import * as LucideIcons from "lucide-react"
import type { Icon } from "lucide-react"
import React, { useMemo, useState } from "react"

import { cn } from "@/lib/utils"

// Extract all icon names from lucide-react (excluding non-icon exports)
const getAllIconNames = () => {
  return Object.keys(LucideIcons).filter(
    (key) =>
      key !== "createLucideIcon" &&
      key !== "Icon" &&
      typeof LucideIcons[key as keyof typeof LucideIcons] === "function"
  )
}

interface ListLoadingSpinnerProps {
  variant?: "default" | "skeleton" | "dots" | "pulse"
  size?: "sm" | "md" | "lg"
  itemCount?: number
  className?: string
  message?: string
  icon?: string
}

export function Loading({
  variant = "default",
  size = "md",
  itemCount = 3,
  className,
  message = "Loading...",
  icon,
}: ListLoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  }

  const containerSizeClasses = {
    sm: "gap-2 p-4",
    md: "gap-3 p-6",
    lg: "gap-4 p-8",
  }

  const iconSizeClasses = {
    sm: "h-8 w-8",
    md: "h-12 w-12",
    lg: "h-16 w-16",
  }

  const getIcon = () => {
    if (!icon) return null

    const IconComponent = LucideIcons[
      icon as keyof typeof LucideIcons
    ] as React.ComponentType<{
      className?: string
      strokeWidth?: number
    }>

    return IconComponent ? (
      <IconComponent
        className={cn("text-muted-foreground mb-4", iconSizeClasses[size])}
        strokeWidth={1.5}
      />
    ) : null
  }

  if (variant === "skeleton") {
    return (
      <div
        className={cn(
          "space-y-3 animate-pulse",
          containerSizeClasses[size],
          className
        )}
        role="status"
        aria-label={message}
      >
        {icon && <div className="flex justify-center mb-4">{getIcon()}</div>}
        {Array.from({ length: itemCount }).map((_, index) => (
          <div key={index} className="flex items-center space-x-4">
            <div className={cn("rounded-full bg-muted", sizeClasses[size])} />
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </div>
          </div>
        ))}
        <span className="sr-only">{message}</span>
      </div>
    )
  }

  if (variant === "dots") {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center",
          containerSizeClasses[size],
          className
        )}
        role="status"
        aria-label={message}
      >
        {getIcon()}
        <div className="flex space-x-2">
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              className={cn(
                "rounded-full bg-primary animate-bounce",
                sizeClasses[size]
              )}
              style={{
                animationDelay: `${index * 0.1}s`,
                animationDuration: "0.6s",
              }}
            />
          ))}
        </div>
        <p className="mt-4 text-sm text-muted-foreground font-medium">
          {message}
        </p>
        <span className="sr-only">{message}</span>
      </div>
    )
  }

  if (variant === "pulse") {
    return (
      <div
        className={cn("space-y-4", containerSizeClasses[size], className)}
        role="status"
        aria-label={message}
      >
        {icon && <div className="flex justify-center mb-4">{getIcon()}</div>}
        {Array.from({ length: itemCount }).map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="flex items-center space-x-4">
              <div
                className={cn(
                  "rounded-lg bg-muted",
                  size === "sm"
                    ? "h-12 w-12"
                    : size === "md"
                      ? "h-16 w-16"
                      : "h-20 w-20"
                )}
              />
              <div className="space-y-3 flex-1">
                <div className="h-4 bg-muted rounded-md w-full" />
                <div className="h-3 bg-muted rounded-md w-4/5" />
                <div className="h-3 bg-muted rounded-md w-3/5" />
              </div>
            </div>
          </div>
        ))}
        <span className="sr-only">{message}</span>
      </div>
    )
  }

  // Default spinner variant
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center",
        containerSizeClasses[size],
        className
      )}
      role="status"
      aria-label={message}
    >
      {getIcon()}
      <div
        className={cn(
          "animate-spin rounded-full border-2 border-muted border-t-primary",
          sizeClasses[size]
        )}
      />
      <p className="mt-4 text-sm text-muted-foreground font-medium">
        {message}
      </p>
      <span className="sr-only">{message}</span>
    </div>
  )
}

// Icon Picker Component with autocomplete and preview
interface IconPickerProps {
  selectedIcon?: string
  onIconSelect: (iconName: string | undefined) => void
  className?: string
}

export function IconPicker({
  selectedIcon,
  onIconSelect,
  className,
}: IconPickerProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [isOpen, setIsOpen] = useState(false)

  const allIconNames = useMemo(() => getAllIconNames(), [])

  const filteredIcons = useMemo(() => {
    if (!searchTerm) return allIconNames.slice(0, 50) // Show first 50 by default
    return allIconNames
      .filter((name) => name.toLowerCase().includes(searchTerm.toLowerCase()))
      .slice(0, 100) // Limit to 100 results for performance
  }, [searchTerm, allIconNames])

  const renderIcon = (iconName: string) => {
    const IconComponent = LucideIcons[
      iconName as keyof typeof LucideIcons
    ] as React.ComponentType<{
      className?: string
      size?: number
    }>
    return IconComponent ? (
      <IconComponent size={20} className="text-current" />
    ) : null
  }

  return (
    <div className={cn("relative w-full max-w-sm", className)}>
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder="Search icons..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {selectedIcon && (
          <div className="absolute right-10 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {renderIcon(selectedIcon)}
            <span className="text-sm text-gray-600">{selectedIcon}</span>
          </div>
        )}
        <button
          onClick={() => onIconSelect(undefined)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          type="button"
        >
          ×
        </button>
      </div>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto">
            <div className="p-2 text-sm text-gray-500 border-b">
              {filteredIcons.length} icons found
            </div>
            {filteredIcons.map((iconName) => (
              <button
                key={iconName}
                onClick={() => {
                  onIconSelect(iconName)
                  setIsOpen(false)
                  setSearchTerm("")
                }}
                className={cn(
                  "w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center gap-3 transition-colors",
                  selectedIcon === iconName && "bg-blue-50 text-blue-700"
                )}
              >
                <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                  {renderIcon(iconName)}
                </div>
                <span className="text-sm">{iconName}</span>
              </button>
            ))}
            {filteredIcons.length === 0 && (
              <div className="p-4 text-center text-gray-500 text-sm">
                No icons found matching "{searchTerm}"
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

// Demo Component to showcase the functionality
export default function LoadingDemo() {
  const [selectedVariant, setSelectedVariant] = useState<
    "default" | "skeleton" | "dots" | "pulse"
  >("default")
  const [selectedSize, setSelectedSize] = useState<"sm" | "md" | "lg">("md")
  const [selectedIcon, setSelectedIcon] = useState<string | undefined>(
    "Loader2"
  )
  const [message, setMessage] = useState("Loading...")
  const [itemCount, setItemCount] = useState(3)

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Loading Component Demo
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Controls */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <h2 className="text-xl font-semibold mb-4">Configuration</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Variant
                  </label>
                  <select
                    value={selectedVariant}
                    onChange={(e) => setSelectedVariant(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="default">Default Spinner</option>
                    <option value="skeleton">Skeleton</option>
                    <option value="dots">Dots</option>
                    <option value="pulse">Pulse</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Size</label>
                  <select
                    value={selectedSize}
                    onChange={(e) => setSelectedSize(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="sm">Small</option>
                    <option value="md">Medium</option>
                    <option value="lg">Large</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Icon</label>
                  <IconPicker
                    selectedIcon={selectedIcon}
                    onIconSelect={setSelectedIcon}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Message
                  </label>
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {(selectedVariant === "skeleton" ||
                  selectedVariant === "pulse") && (
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Item Count
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={itemCount}
                      onChange={(e) =>
                        setItemCount(parseInt(e.target.value) || 3)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <h3 className="text-lg font-semibold mb-3">Usage</h3>
              <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
                {`<Loading
  variant="${selectedVariant}"
  size="${selectedSize}"
  ${selectedIcon ? `icon="${selectedIcon}"` : ""}
  message="${message}"
  ${
    selectedVariant === "skeleton" || selectedVariant === "pulse"
      ? `itemCount={${itemCount}}`
      : ""
  }
/>`}
              </pre>
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border min-h-96 flex items-center justify-center">
              <Loading
                variant={selectedVariant}
                size={selectedSize}
                icon={selectedIcon}
                message={message}
                itemCount={itemCount}
              />
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <h3 className="text-lg font-semibold mb-3">Features</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Dynamic icon selection from all Lucide React icons</li>
                <li>• Real-time icon search and preview</li>
                <li>
                  • Multiple loading variants (spinner, skeleton, dots, pulse)
                </li>
                <li>• Configurable sizes and item counts</li>
                <li>• Accessibility features with proper ARIA labels</li>
                <li>• TypeScript support with full type safety</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
