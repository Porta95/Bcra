import { avatarFor } from "@/lib/comparador-helpers";

interface Props {
  name: string;
  size?: number;
}

export default function BankAvatar({ name, size = 44 }: Props) {
  const { text, bg, ink } = avatarFor(name);
  return (
    <div
      role="img"
      aria-label={name}
      className="shrink-0 rounded-full flex items-center justify-center font-bold tracking-tight"
      style={{
        width: size,
        height: size,
        background: bg,
        color: ink,
        fontSize: size * 0.36,
        lineHeight: 1,
      }}
    >
      {text}
    </div>
  );
}
