import { useState } from "react";

interface ResponsiveImageProps {
  src: string;
  alt: string;
  /** CSS class names */
  className?: string;
  /** Aspect ratio in "width/height" format, e.g. "21/9" or "4/1" */
  aspectRatio?: string;
  /** Explicit width (for CLS prevention) */
  width?: number;
  /** Explicit height (for CLS prevention) */
  height?: number;
  /** Set to true for the LCP image (first/primary banner) */
  isPriority?: boolean;
  /** Image sizes attribute for responsive images */
  sizes?: string;
  /** Image srcset (if not provided, will try to generate WebP via API transformation) */
  srcSet?: string;
  /** Fallback image on error */
  fallbackSrc?: string;
  onLoad?: () => void;
  draggable?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}

/**
 * Generates a WebP URL from the API if the API supports it.
 * The API at api-marketplace.anandamcomputer.com may support format conversion
 * via query parameters. If not, the original URL is returned.
 */
function getWebPUrl(url: string): string {
  if (!url) return url;
  // If the URL already has query params, append; otherwise add
  const separator = url.includes("?") ? "&" : "?";
  // Try to request WebP format - many image servers support this
  // If the API doesn't support it, the original format will be served
  return `${url}${separator}format=webp`;
}

/**
 * Generates srcset for responsive images at different breakpoints.
 * Uses the API URL pattern to request different sizes.
 */
function generateSrcSet(url: string): string {
  if (!url) return "";
  const separator = url.includes("?") ? "&" : "?";
  const widths = [480, 768, 1024, 1440, 1920];
  return widths
    .map((w) => `${url}${separator}width=${w}&format=webp ${w}w`)
    .join(", ");
}

export default function ResponsiveImage({
  src,
  alt,
  className = "",
  aspectRatio,
  width,
  height,
  isPriority = false,
  sizes = "(max-width: 480px) 100vw, (max-width: 768px) 100vw, (max-width: 1024px) 100vw, 100vw",
  srcSet,
  fallbackSrc = "/icon-anandam.svg",
  onLoad,
  draggable,
  onClick,
  style,
}: ResponsiveImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const handleLoad = () => {
    setLoaded(true);
    onLoad?.();
  };

  const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    if (!imgError) {
      setImgError(true);
      e.currentTarget.src = fallbackSrc;
    }
  };

  // Generate WebP URL and srcset
  const webpSrc = getWebPUrl(src);
  const autoSrcSet = srcSet || generateSrcSet(src);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: aspectRatio || (width && height ? `${width}/${height}` : undefined),
        overflow: "hidden",
        ...style,
      }}
    >
      {/* Skeleton placeholder while loading */}
      {!loaded && !imgError && (
        <div
          className="absolute inset-0 bg-gray-200 animate-pulse"
          style={{ borderRadius: "inherit" }}
        />
      )}

      {/* Use <picture> for WebP with fallback */}
      <picture>
        {/* WebP source for browsers that support it */}
        <source srcSet={autoSrcSet || webpSrc} sizes={sizes} type="image/webp" />
        {/* Fallback to original format */}
        <source srcSet={src} sizes={sizes} />
        {/* Actual img tag */}
        <img
          src={webpSrc}
          alt={alt}
          className={className}
          width={width}
          height={height}
          loading={isPriority ? "eager" : "lazy"}
          fetchPriority={isPriority ? "high" : undefined}
          draggable={draggable}
          onClick={onClick}
          onLoad={handleLoad}
          onError={handleError}
          style={{
            ...(loaded || imgError ? {} : { opacity: 0 }),
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transition: "opacity 300ms ease-in-out",
          }}
        />
      </picture>
    </div>
  );
}