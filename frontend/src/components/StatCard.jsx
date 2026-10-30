import { motion } from "motion/react";
import { Tilt } from "./motion-primitives/tilt";
import { Spotlight } from "./motion-primitives/spotlight";
import { AnimatedNumber } from "./motion-primitives/animated-number";

// One dashboard card, built from Motion Primitives:
//   Tilt           -> 3D tilt that follows the mouse
//   Spotlight      -> soft glow that follows the mouse
//   AnimatedNumber -> number springs up to its new value
export default function StatCard({ label, value, total, icon: Icon, tone, active, onClick, index }) {
  const share = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <Tilt rotationFactor={6} isRevese springOptions={{ stiffness: 260, damping: 26 }} className="stat-tilt">
      <motion.button
        type="button"
        className={`stat-card tone-${tone} ${active ? "is-active" : ""}`}
        onClick={onClick}
        whileTap={{ scale: 0.98 }}
        aria-pressed={active}
      >
        <Spotlight className="stat-spotlight" size={220} springOptions={{ bounce: 0, duration: 0.2 }} />

        <span className="stat-top">
          <span className="stat-label">{label}</span>
          <span className="stat-icon">
            <Icon size={18} strokeWidth={2} />
          </span>
        </span>

        <AnimatedNumber
          className="stat-value"
          value={value}
          springOptions={{ bounce: 0, duration: 1200 }}
        />

        <span className="stat-bar" aria-hidden="true">
          <motion.span
            className="stat-bar-fill"
            initial={{ width: 0 }}
            animate={{ width: `${share}%` }}
            transition={{ duration: 0.9, delay: 0.3 + 0.08 * index, ease: [0.16, 1, 0.3, 1] }}
          />
        </span>

        <span className="stat-foot">{total > 0 ? `${share}% of all cases` : "No cases yet"}</span>
      </motion.button>
    </Tilt>
  );
}
