"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface SliderProps {
  className?: string
  defaultValue?: number[]
  value?: number[]
  min?: number
  max?: number
  step?: number
  onValueChange?: (value: number[]) => void
}

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ className, defaultValue, value, min = 0, max = 100, step = 1, onValueChange, ...props }, ref) => {
    
    // Support array-based values from the existing API
    const initialValue = value ? value[0] : (defaultValue ? defaultValue[0] : min)
    const [localValue, setLocalValue] = React.useState(initialValue)

    // Sync with external value if it changes
    React.useEffect(() => {
      if (value !== undefined) {
        setLocalValue(value[0])
      }
    }, [value])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = Number(e.target.value)
      setLocalValue(newValue)
      if (onValueChange) {
        onValueChange([newValue])
      }
    }

    return (
      <div className={cn("relative flex w-full touch-none items-center select-none", className)}>
        <input
          type="range"
          ref={ref}
          min={min}
          max={max}
          step={step}
          value={localValue}
          onChange={handleChange}
          className={cn(
            "h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 active:accent-indigo-700 disabled:cursor-not-allowed disabled:opacity-50",
            // Custom thumb styling via pseudo-elements
            "[&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-indigo-600 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:transition-all hover:[&::-webkit-slider-thumb]:scale-110 active:[&::-webkit-slider-thumb]:scale-125 [&::-webkit-slider-thumb]:cursor-grab active:[&::-webkit-slider-thumb]:cursor-grabbing",
            "[&::-moz-range-thumb]:size-4 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-indigo-600 [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:shadow-lg [&::-moz-range-thumb]:transition-all hover:[&::-moz-range-thumb]:scale-110 active:[&::-moz-range-thumb]:scale-125 [&::-moz-range-thumb]:cursor-grab active:[&::-moz-range-thumb]:cursor-grabbing"
          )}
          {...props}
        />
      </div>
    )
  }
)

Slider.displayName = "Slider"

export { Slider }
