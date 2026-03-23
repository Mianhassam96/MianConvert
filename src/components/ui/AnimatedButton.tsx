import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Loader2, CheckCircle } from "lucide-react";

interface AnimatedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  success?: boolean;
  variant?: "gradient" | "outline" | "ghost" | "danger";
  size?: "xs" | "sm" | "md" | "lg";
}

const AnimatedButton = ({
  children, loading, success, variant = "gradient", size = "md",
  className, disabled, type = "button", ...props
}: AnimatedButtonProps) => {
  const base = "relative overflow-hidden font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2";

  const sizes = {
    xs: "px-2.5 py-1 text-[11px] h-7",
    sm: "px-3.5 py-1.5 text-xs h-8",
    md: "px-5 py-2.5 text-sm h-10 sm:h-11",
    lg: "px-6 py-3 text-sm sm:text-base h-11 sm:h-12",
  };

  const variants = {
    gradient: "btn-gradient ripple-btn text-white shadow-md shadow-violet-500/20",
    outline:  "border-2 border-violet-500 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/30 glow-violet bg-transparent",
    ghost:    "text-gray-500 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/20 bg-transparent",
    danger:   "bg-red-500 hover:bg-red-600 text-white shadow-md shadow-red-500/20",
  };

  const isDisabled = disabled || loading;

  return (
    <motion.button
      type={type}
      whileHover={!isDisabled ? { scale: 1.02 } : {}}
      whileTap={!isDisabled ? { scale: 0.97 } : {}}
      className={cn(
        base,
        sizes[size],
        variants[variant],
        isDisabled && "opacity-50 cursor-not-allowed pointer-events-none",
        className
      )}
      disabled={isDisabled}
      {...(props as any)}
    >
      {loading && (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      )}
      {success && !loading && (
        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 400 }}>
          <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
        </motion.span>
      )}
      {children}
    </motion.button>
  );
};

export default AnimatedButton;
