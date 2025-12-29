import { motion } from "framer-motion";

export default function TarotCard({
  title,
  image,
  isActive,
  face, // "back" | "front" | "prediction"
  prediction,
  onClick,
  isClickable = false,
  backImage = "/img/cover.png",
}) {
  const showFront = face === "front";
  const showPrediction = face === "prediction";
  const showPulse = isClickable && showFront;
  const baseScale = isActive ? (showFront || showPrediction ? 1.015 : 1) : 0.97;
  const baseY = isActive ? (showFront || showPrediction ? -8 : -2) : 0;

  const predictionParts = (prediction ?? "").split(/\n\s*\n/);
  const yearLine = (predictionParts[0] ?? "").trim();
  const bodyParts = predictionParts.slice(1).map((p) => p.trim()).filter(Boolean);
  const hasAdvice = bodyParts.length >= 2;
  const mainBody = (hasAdvice ? bodyParts.slice(0, -1) : bodyParts).join("\n\n");
  const adviceBody = hasAdvice ? bodyParts[bodyParts.length - 1] : "";

  return (
    <div
      className="shrink-0"
      style={{
        perspective: "1200px",
      }}
    >
      <motion.div
        layout
        animate={{
          scale: showPulse ? [baseScale, baseScale + 0.012, baseScale] : baseScale,
          y: baseY,
          rotateZ: 0,
          filter: isActive ? "saturate(1.05)" : "saturate(0.9)",
          opacity: isActive ? 1 : 0.82,
        }}
        transition={{
          type: "spring",
          stiffness: 240,
          damping: 26,
          ...(showPulse
            ? {
                scale: { duration: 1.8, repeat: Infinity, ease: "easeInOut" },
              }
            : null),
        }}
        className={[
          // Mobile: fit within dvh so page doesn't need vertical scrolling
          // Height is the source of truth; width is derived from aspect-ratio.
          // Slightly taller on mobile to fit longer predictions
          "relative h-[64dvh] max-h-[520px] min-h-[350px] w-auto select-none sm:h-[58dvh] sm:min-h-[420px]",
          "aspect-[9/14] max-w-[390px]",
          "rounded-2xl border border-white/10 bg-white/[0.04]",
          "shadow-none",
          isClickable ? "cursor-pointer" : "cursor-default",
          showPulse ? "border-[#58B0FF]/35" : null,
          "overflow-hidden",
        ].join(" ")}
        onClick={isClickable ? onClick : undefined}
        role={isClickable ? "button" : undefined}
        tabIndex={isClickable ? 0 : -1}
        onKeyDown={
          isClickable
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") onClick?.();
              }
            : undefined
        }
      >
        {/* Flip card (front/back) */}
        <motion.div
          className="relative h-full w-full"
          initial={false}
          animate={{ rotateY: showFront ? 0 : 180 }}
          transition={{ type: "spring", stiffness: 160, damping: 18 }}
          style={{
            transformStyle: "preserve-3d",
          }}
        >
          {/* FRONT */}
          <div
            className="absolute inset-0"
            style={{
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
            }}
          >
            <img
              src={image}
              alt={title}
              className="h-full w-full object-cover"
              draggable={false}
              loading="lazy"
            />
            {/* subtle inner frame */}
            <div className="pointer-events-none absolute inset-4 rounded-xl border border-white/10" />
          </div>

          {/* BACK */}
          <div
            className="absolute inset-0"
            style={{
              transform: "rotateY(180deg)",
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
            }}
          >
            {showPrediction ? (
              <div className="relative h-full w-full">
                <img
                  src={backImage}
                  alt="Фон карты"
                  className="h-full w-full object-cover opacity-55"
                  draggable={false}
                />
                <div className="absolute inset-0 p-3 sm:p-4">
                  <div className="relative h-full overflow-hidden rounded-xl bg-white p-2 sm:p-4">
                    <div className="relative">
                      {yearLine ? (
                        <div className="font-bounded mx-3 mt-[18px] mb-[18px] text-[16px] font-semibold uppercase leading-[23px] text-[#1C1C1C] sm:text-xl">
                          {yearLine}
                        </div>
                      ) : null}
                      <div className="mt-3 overflow-auto pr-1 text-[14px] leading-snug text-[#1C1C1C] sm:mt-4 sm:text-base sm:leading-relaxed">
                        {mainBody ? (
                          <div className="mx-[14px] whitespace-pre-line text-[11px] leading-[14px]">
                            {mainBody}
                          </div>
                        ) : null}

                        {hasAdvice ? (
                          <>
                            <div className="mx-3 mt-5 font-bounded text-[11px] font-bold uppercase tracking-[1.3px] text-[#1C1C1C]/75 sm:mt-7 sm:text-sm">
                              Совет
                            </div>
                            <div className="mx-3 mt-[5px] mb-[5px] whitespace-pre-line text-[10px] leading-[13px] font-extralight italic text-[#595959]">
                              {adviceBody}
                            </div>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <img
                  src={backImage}
                  alt="Рубашка карты"
                  className="h-full w-full object-cover"
                  draggable={false}
                />
                <div className="pointer-events-none absolute inset-4 rounded-xl border border-white/10" />
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}


