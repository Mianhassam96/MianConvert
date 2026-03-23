import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Loader2, CheckCircle } from "lucide-react";

interface AnimatedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  success?: boolean;
  variant?: "gradient" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
}

const AnimatedButton = ({
  children, loading, success, variant = "gradient", size = "md", className, disabled, ...props
}: AnimatedButtonProps) => {
  const base = "relative overflow-hidden font-semibold rounded-xl flex items-center justify-center gap-2 transition-all select-none";
  const sizes = { sm: "px-3 py-1.5 text-xs", md: "px-5 py-2.5 text-sm h-11", lg: "px-7 py-3 text-base" };
  const variants = {
    gradient: "btn-gradient ripple-btn text-white",
    outline: "border-2 border-violet-500 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/30 glow-violet",
    ghost: "text-gray-500 dark:text-gray-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-950/20",
  };

  return (
    <motion.button
      whileHover={!disabled && !loading ? { scale: 1.02 } : {}}
      whileTap={!disabled && !loading ? { scale: 0.97 } : {}}
      className={cn(base, sizes[size], variants[variant], disabled && "opacity-50 cursor-not-allowed", className)}
      disabled={disabled || loading}
      {...(props as any)}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
      {success && !loading && (
        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 400 }}>
          <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
        </motion.span>
      )}
      {children}
    </motion.button>
  );
};

export default AnimatedButton;
