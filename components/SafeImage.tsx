'use client'

import { useState } from 'react'
import Image from 'next/image'

interface SafeImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  fallbackSrc?: string
  style?: React.CSSProperties
  priority?: boolean
  unoptimized?: boolean
}

export default function SafeImage({
  src,
  alt,
  width,
  height,
  className = '',
  fallbackSrc,
  style,
  priority = false,
  unoptimized = true,
}: SafeImageProps) {
  const [imgSrc, setImgSrc] = useState(src)
  const [hasError, setHasError] = useState(false)

  const handleError = () => {
    if (!hasError) {
      setHasError(true)
      if (fallbackSrc) {
        setImgSrc(fallbackSrc)
      } else {
        // Generate a simple SVG placeholder
        const placeholder = `data:image/svg+xml;base64,${btoa(`
          <svg width="300" height="420" xmlns="http://www.w3.org/2000/svg">
            <rect width="300" height="420" fill="#152642"/>
            <text x="50%" y="50%" font-size="16" fill="#FFD700" text-anchor="middle" dy=".3em" font-family="Arial, sans-serif">
              Image Not Available
            </text>
          </svg>
        `)}`
        setImgSrc(placeholder)
      }
    }
  }

  // Use proxy for external images
  const getProxiedUrl = (url: string) => {
    if (url.startsWith('data:') || url.startsWith('/')) {
      return url
    }
    
    // Check if it's a problematic external URL
    if (url.includes('wikimedia.org') || url.includes('wikia.nocookie.net')) {
      return `/api/proxy-image?url=${encodeURIComponent(url)}`
    }
    
    return url
  }

  if (width && height) {
    return (
      <Image
        src={getProxiedUrl(imgSrc)}
        alt={alt}
        width={width}
        height={height}
        className={className}
        style={style}
        onError={handleError}
        priority={priority}
        unoptimized={unoptimized}
      />
    )
  }

  return (
    <img
      src={getProxiedUrl(imgSrc)}
      alt={alt}
      className={className}
      style={style}
      onError={handleError}
    />
  )
}