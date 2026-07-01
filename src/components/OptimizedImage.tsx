import { useState } from "react";

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  /** Set to true for the LCP image (first/primary banner) */
  isPriority?: boolean;
  /** Aspect ratio in "width/height" format, e.g. "21/9" or "4/1" */
  aspectRatio?: string;
  /** Explicit width attribute (for CLS prevention) */
  width?: number;
  /** Explicit height attribute (for CLS prevention) */
  height?: number;
  onLoad?: () => void;
  draggable?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export default function OptimizedImage({
  src,
  alt,
  className = "",
  isPriority = false,
  aspectRatio,
  width,
  height,
  onLoad,
  draggable,
  onClick,
  style,
}: OptimizedImageProps) {
  const [loaded, setLoaded] = useState(false);

  const handleLoad = () => {
    setLoaded(true);
    onLoad?.();
  };

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: aspectRatio || (width && height ? `${width}/${height}` : undefined),
        ...style,
      }}
    >
      {/* Skeleton placeholder while loading */}
      {!loaded && (
        <div
          className="absolute inset-0 bg-gray-200 animate-pulse rounded-inherit"
          style={{ borderRadius: "inherit" }}
        />
      )}

      <img
        src={src}
        alt={alt}
        className={className}
        width={width}
        height={height}
        // Priority image: eager loading + high fetchPriority
        // Non-priority: lazy loading
        loading={isPriority ? "eager" : "lazy"}
        fetchPriority={isPriority ? "high" : undefined}
        draggable={draggable}
        onClick={onClick}
        onLoad={handleLoad}
        style={{
          ...(loaded ? {} : { opacity: 0 }),
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transition: "opacity 300ms ease-in-out",
        }}
      />
    </div>
  );
}