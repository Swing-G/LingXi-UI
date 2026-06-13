import { useMemo, useState } from "react";

type AvatarProps = {
  src?: string | null;
  name: string;
  size?: number;
  className?: string;
};

/** 根据名字生成稳定的颜色 (HSL) */
const colorFromName = (name: string): string => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  const s = 40 + (Math.abs(hash * 7) % 30);
  const l = 25 + (Math.abs(hash * 3) % 15);
  return `hsl(${h}, ${s}%, ${l}%)`;
};

/** 提取名字的前 1-2 个字符 */
const initials = (name: string): string => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
  }
  return name.trim().charAt(0).toUpperCase() || "?";
};

const Avatar = ({ src, name, size = 36, className }: AvatarProps) => {
  const [imgError, setImgError] = useState(false);
  const bgColor = useMemo(() => colorFromName(name), [name]);

  if (src && !imgError) {
    return (
      <img
        src={src}
        alt={name}
        className={className}
        style={{ width: size, height: size, borderRadius: 10, objectFit: "cover", flexShrink: 0 }}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: 10,
        display: "grid",
        placeItems: "center",
        background: bgColor,
        color: "#fff",
        fontSize: size * 0.4,
        fontWeight: 720,
        flexShrink: 0,
        userSelect: "none",
      }}
    >
      {initials(name)}
    </div>
  );
};

export default Avatar;
