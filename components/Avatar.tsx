import type { User } from "@/lib/types";

export type AvatarProps = { user: User; size?: number; dimmed?: boolean };

function hue(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h % 360;
}

function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const letters = words.length > 1 ? words[0][0] + words[words.length - 1][0] : (words[0]?.slice(0, 1) ?? "?");
  return letters.toUpperCase();
}

export function Avatar({ user, size = 24, dimmed = false }: AvatarProps) {
  const h = hue(user.id);
  return (
    <span
      title={user.name}
      className="inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold select-none"
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.4),
        background: `hsl(${h} 70% 86%)`,
        color: `hsl(${h} 45% 28%)`,
        opacity: dimmed ? 0.45 : undefined,
        filter: dimmed ? "grayscale(1)" : undefined,
      }}
    >
      {user.image ? (
        // eslint-disable-next-line @next/next/no-img-element -- tiny remote Google avatars; no optimizer config needed
        <img
          src={user.image}
          alt=""
          width={size}
          height={size}
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover"
        />
      ) : (
        initials(user.name)
      )}
    </span>
  );
}
