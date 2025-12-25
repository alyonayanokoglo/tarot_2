import { motion } from "framer-motion";

export default function LoadingScreen() {
  return (
    <motion.div
      className="fixed inset-0 z-50 grid place-items-center bg-[#1C1C1C]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="flex flex-col items-center gap-5 px-6 text-center">
        <div
          className="fortune-orb select-none text-5xl leading-none"
          aria-hidden="true"
        >
          🔮
        </div>

        <div className="font-bounded text-2xl font-semibold tracking-tight text-white/90">
          смотрим твою судьбу
        </div>
      </div>
    </motion.div>
  );
}


