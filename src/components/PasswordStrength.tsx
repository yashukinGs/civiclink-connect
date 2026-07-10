import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Rule = { label: string; test: (v: string) => boolean };

const RULES: Rule[] = [
  { label: "At least 8 characters", test: (v) => v.length >= 8 },
  { label: "An uppercase letter", test: (v) => /[A-Z]/.test(v) },
  { label: "A lowercase letter", test: (v) => /[a-z]/.test(v) },
  { label: "A number", test: (v) => /[0-9]/.test(v) },
  { label: "A special character", test: (v) => /[^A-Za-z0-9]/.test(v) },
];

const LEVELS = [
  { label: "Very weak", color: "bg-destructive" },
  { label: "Weak", color: "bg-destructive" },
  { label: "Fair", color: "bg-amber-500" },
  { label: "Good", color: "bg-amber-400" },
  { label: "Strong", color: "bg-emerald-500" },
  { label: "Very strong", color: "bg-emerald-500" },
];

export function PasswordStrength({ value }: { value: string }) {
  if (!value) return null;

  const passed = RULES.map((r) => r.test(value));
  const score = passed.filter(Boolean).length;
  const level = LEVELS[score];

  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        {RULES.map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors",
              i < score ? level.color : "bg-border",
            )}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Password strength: <span className="font-medium text-foreground">{level.label}</span>
      </p>
      <ul className="space-y-1">
        {RULES.map((rule, i) => (
          <li
            key={rule.label}
            className={cn(
              "flex items-center gap-1.5 text-xs",
              passed[i] ? "text-emerald-500" : "text-muted-foreground",
            )}
          >
            {passed[i] ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
            {rule.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
