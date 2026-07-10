import { Link } from "@tanstack/react-router";
import ccLogo from "@/assets/cc-logo.png.asset.json";

export function Logo({
  className = "",
  showText = true,
  to = "/",
}: {
  className?: string;
  showText?: boolean;
  to?: string;
}) {
  return (
    <Link to={to} className={`flex items-center gap-2.5 ${className}`}>
      <span className="relative inline-flex h-10 w-10 items-center justify-center">
        <img
          src={ccLogo.url}
          alt="CivicConnect logo"
          className="h-10 w-10 rounded-full object-cover"
        />
      </span>
      {showText && (
        <span className="flex flex-col leading-none">
          <span className="font-display text-lg font-bold tracking-tight">
            Civic<span className="text-gradient">Connect</span>
          </span>
          <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Citizen Platform
          </span>
        </span>
      )}
    </Link>
  );
}
