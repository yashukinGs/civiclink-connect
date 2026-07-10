import { motion } from "framer-motion";
import ccLogo from "@/assets/cc-logo.png.asset.json";

export function SplashScreen() {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background">
      <div className="absolute inset-0 bg-hero-glow opacity-60" />

      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative flex flex-col items-center gap-8"
      >
        {/* Passport-size framed logo with orbiting ring */}
        <div className="relative flex items-center justify-center">
          {/* Rotating gradient ring */}
          <motion.div
            className="absolute h-52 w-52 rounded-full border-2 border-transparent"
            style={{
              background:
                "conic-gradient(from 0deg, transparent 0deg, oklch(0.74 0.16 210) 120deg, oklch(0.62 0.2 285) 240deg, transparent 360deg)",
              WebkitMask:
                "radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 3px))",
              mask: "radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 3px))",
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "linear" }}
          />

          {/* Circular logo filling the ring */}
          <motion.div
            className="relative flex h-44 w-44 items-center justify-center overflow-hidden rounded-full"
            animate={{ scale: [1, 1.04, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <img
              src={ccLogo.url}
              alt="CivicConnect logo"
              className="h-full w-full rounded-full object-cover"
            />
          </motion.div>

          {/* Orbiting dot */}
          <motion.div
            className="absolute h-52 w-52"
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          >
            <span className="absolute left-1/2 top-0 h-3 w-3 -translate-x-1/2 rounded-full bg-primary shadow-[0_0_12px_oklch(0.74_0.16_210)]" />
          </motion.div>
        </div>

        {/* Wordmark */}
        <span className="font-display text-2xl font-bold tracking-tight">
          Civic<span className="text-gradient">Connect</span>
        </span>

        {/* Bouncing dots loader */}
        <div className="flex items-center gap-2">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="h-2.5 w-2.5 rounded-full bg-gradient-primary"
              animate={{ y: [0, -10, 0], opacity: [0.4, 1, 0.4] }}
              transition={{
                duration: 0.9,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.18,
              }}
            />
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-sm text-muted-foreground"
        >
          Connecting Citizens. Solving Problems.
        </motion.p>
      </motion.div>
    </div>
  );
}
