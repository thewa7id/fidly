'use client'

import { useEffect, useRef } from 'react'
import * as PDF417 from 'pdf417-generator'

interface PDF417BarcodeProps {
    value: string
    aspectRatio?: number
    ecl?: number
    className?: string
}

export default function PDF417Barcode({ value, aspectRatio = 4, ecl = 2, className }: PDF417BarcodeProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        if (canvasRef.current && value) {
            try {
                // Clear canvas before drawing
                const ctx = canvasRef.current.getContext('2d')
                if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
                PDF417.draw(value, canvasRef.current, aspectRatio, ecl)
            } catch (err) {
                console.error('PDF417 generation failed:', err)
            }
        }
    }, [value, aspectRatio, ecl])

    return <canvas ref={canvasRef} className={className ?? "max-w-full h-auto"} />
}
