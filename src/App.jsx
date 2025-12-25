import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import TarotCarousel from "./components/TarotCarousel.jsx";
import LoadingScreen from "./components/LoadingScreen.jsx";
import { cards } from "./data/cards.js";

export default function App() {
  const [isBooting, setIsBooting] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const minDelay = new Promise((r) => window.setTimeout(r, 4000));
    const fontsReady = document.fonts?.ready ?? Promise.resolve();
    Promise.all([minDelay, fontsReady]).then(() => {
      if (!cancelled) setIsBooting(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AnimatePresence mode="wait">
      {isBooting ? (
        <LoadingScreen key="loading" />
      ) : (
        <motion.div
          key="app"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex h-dvh flex-col overflow-hidden bg-transparent md:min-h-dvh md:overflow-auto"
        >
          <header className="mx-auto w-full max-w-5xl px-6 pb-2 pt-6 md:px-10 md:pt-10">
            <div className="flex flex-col items-center text-center">
              <div>
                <img
                  src="/img/Logo%20Long%20NEW.svg"
                  alt="Tarot"
                  className="mx-auto h-6 w-auto opacity-90"
                  draggable={false}
                />
                <h1 className="mt-2 font-bounded text-[22px] leading-[31px] font-semibold uppercase tracking-tight text-white/90 md:text-3xl md:leading-[36px]">
                  Приоткрой завесу 2026 года
                </h1>
                <p className="mt-2 hidden max-w-[52ch] text-sm leading-relaxed text-white/70 sm:block">
                  Нажми «Выбрать предсказание» — рулетка выберет карту. Затем
                  нажми на выбранную карту, чтобы открыть послание.
                </p>
              </div>
            </div>
          </header>

          <main className="mx-auto flex w-full max-w-5xl flex-1 items-center">
            <TarotCarousel cards={cards} />
          </main>

          <div className="pb-4 md:pb-10" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}


