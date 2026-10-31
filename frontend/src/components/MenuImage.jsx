import { useState } from "react";
import { ImageOff } from "lucide-react";
import { getMenuImage, getMenuImageFallback } from "../data/menuData";

export default function MenuImage({ item, className, alt = "", loading = "lazy" }) {
  const [failed, setFailed] = useState(false);
  const [useFallback, setUseFallback] = useState(false);
  const image = getMenuImage(item);
  const fallbackImage = getMenuImageFallback(item);

  if ((!image && !fallbackImage) || failed) {
    return (
      <span className={`${className} menu-image-fallback`} role="img" aria-label={`${item.name} image unavailable`}>
        <ImageOff size={17} />
      </span>
    );
  }

  return (
    <img
      className={className}
      src={useFallback ? fallbackImage : image || fallbackImage}
      alt={alt}
      loading={loading}
      onError={() => {
        if (!useFallback && image && fallbackImage && fallbackImage !== image) {
          setUseFallback(true);
        } else {
          setFailed(true);
        }
      }}
    />
  );
}
