import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import TarotCard from "./TarotCard.jsx";

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

export default function TarotCarousel({ cards }) {
  const containerRef = useRef(null);
  const itemRefs = useRef([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeAbsIndex, setActiveAbsIndex] = useState(0);
  const [phase, setPhase] = useState("idle"); // idle | spinning | selected | prediction
  const [selectedAbsIndex, setSelectedAbsIndex] = useState(null);
  const spinRafRef = useRef(null);
  const strideRef = useRef(null); // px between item starts (includes gap)
  const baseCenterRef = useRef(null); // center position of absIndex=0 when scrollLeft=0
  const lastCenteredAbsRef = useRef(0);
  const userInteractingRef = useRef(false);
  const loopsCount = 20; // duplicated circles to simulate infinite roulette (more headroom = fewer edge bugs)

  const safeCards = useMemo(() => cards ?? [], [cards]);
  const len = safeCards.length;

  const isSpinning = phase === "spinning";
  const hasSelected = selectedAbsIndex != null;
  const isPrediction = phase === "prediction" && hasSelected;

  const repeated = useMemo(() => {
    if (!len) return [];
    const out = [];
    for (let loop = 0; loop < loopsCount; loop++) {
      for (let i = 0; i < len; i++) {
        const absIndex = loop * len + i;
        out.push({
          absIndex,
          baseIndex: i,
          card: safeCards[i],
          key: `${loop}-${safeCards[i].id}`,
        });
      }
    }
    return out;
  }, [len, safeCards]);

  // Center a card by index (works with scroll-snap but also for programmatic control).
  const centerAbsIndex = (absIndex, behavior = "smooth") => {
    const el = containerRef.current;
    const node = itemRefs.current[absIndex];
    if (!el || !node) return;
    const targetLeft = node.offsetLeft - (el.clientWidth - node.offsetWidth) / 2;
    el.scrollTo({ left: targetLeft, behavior });
  };

  const computeCenteredAbsIndex = () => {
    const el = containerRef.current;
    const stride = strideRef.current;
    const baseCenter = baseCenterRef.current;
    if (!el || !stride || baseCenter == null) return lastCenteredAbsRef.current ?? 0;

    const centerPos = el.scrollLeft + el.clientWidth / 2;
    const abs = Math.round((centerPos - baseCenter) / stride);
    const maxAbs = Math.max(0, repeated.length - 1);
    const clamped = clamp(abs, 0, maxAbs);
    lastCenteredAbsRef.current = clamped;
    return clamped;
  };

  const recenterInfiniteIfNeeded = () => {
    const el = containerRef.current;
    const stride = strideRef.current;
    if (!el || !stride || !len) return;

    const loopWidth = stride * len; // px per full circle
    const shiftLoops = Math.floor(loopsCount / 2); // move by half the tape (integer loops)
    const shiftPx = loopWidth * shiftLoops;

    // Guard zones (in loops) to avoid hitting hard edges of the duplicated tape.
    const leftGuardPx = loopWidth * 2;
    const rightGuardPx = loopWidth * (loopsCount - 3);

    if (el.scrollLeft < leftGuardPx) {
      el.scrollLeft += shiftPx;
      lastCenteredAbsRef.current += shiftLoops * len;
    } else if (el.scrollLeft > rightGuardPx) {
      el.scrollLeft -= shiftPx;
      lastCenteredAbsRef.current -= shiftLoops * len;
    }
  };

  const recenterToMiddleSameCard = () => {
    const el = containerRef.current;
    const stride = strideRef.current;
    if (!el || !stride || !len) return;

    const currentAbs = computeCenteredAbsIndex();
    const base = currentAbs % len;
    const middleLoop = Math.floor(loopsCount / 2);
    const targetAbs = middleLoop * len + base;

    centerAbsIndex(targetAbs, "auto");
    lastCenteredAbsRef.current = targetAbs;
    setActiveAbsIndex(targetAbs);
    setActiveIndex(base);
  };

  const setActiveFromCentered = () => {
    if (!len) return;
    const abs = computeCenteredAbsIndex();
    const base = abs % len;
    setActiveAbsIndex((prev) => (prev === abs ? prev : abs));
    setActiveIndex((prev) => (prev === base ? prev : base));
  };

  // Keep active index synced when user swipes (only when not spinning).
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let t;
    const onScroll = () => {
      if (isSpinning) return;
      recenterInfiniteIfNeeded();
      setActiveFromCentered();
      window.clearTimeout(t);
      t = window.setTimeout(() => {
        // IMPORTANT:
        // We only reset selection on *user-initiated* scrolling.
        // Programmatic scroll (roulette / final centering) should NOT flip the card back.
        if (userInteractingRef.current && phase !== "spinning") {
          setPhase("idle");
          setSelectedAbsIndex(null);
        }
      }, 120);
    };

    el.addEventListener("scroll", onScroll, { passive: true });

    const onPointerDown = () => {
      userInteractingRef.current = true;
    };
    const onPointerUp = () => {
      // Delay a bit so scroll inertia still counts as user scroll
      window.setTimeout(() => {
        userInteractingRef.current = false;
      }, 240);
    };

    el.addEventListener("pointerdown", onPointerDown, { passive: true });
    window.addEventListener("pointerup", onPointerUp, { passive: true });
    window.addEventListener("pointercancel", onPointerUp, { passive: true });
    return () => {
      window.clearTimeout(t);
      el.removeEventListener("scroll", onScroll);
      el.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    };
  }, [isSpinning, phase, len, repeated.length]);

  // Measure stride/baseCenter from DOM once items are mounted.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => {
      const n0 = itemRefs.current[0];
      const n1 = itemRefs.current[1];
      if (!n0 || !n1) return;
      strideRef.current = n1.offsetLeft - n0.offsetLeft;
      baseCenterRef.current = n0.offsetLeft + n0.offsetWidth / 2;
      setActiveFromCentered();
    };

    // Delay a frame for layout
    const raf = window.requestAnimationFrame(measure);
    const ro = new ResizeObserver(() => measure());
    ro.observe(el);
    return () => {
      window.cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [len, repeated.length]);

  // On first mount / cards change: jump to middle loop so roulette feels “endless”.
  useEffect(() => {
    if (!len) return;
    const startLoop = Math.floor(loopsCount / 2) - 4; // keep room to the right for long spins
    const startAbs = startLoop * len;
    setPhase("idle");
    setSelectedAbsIndex(null);
    setActiveIndex(0);
    setActiveAbsIndex(startAbs);
    // jump without animation
    window.requestAnimationFrame(() => centerAbsIndex(startAbs, "auto"));
    lastCenteredAbsRef.current = startAbs;
  }, [len]);

  // Roulette spin: accelerate then slow down, total ~4s.
  const startSpin = () => {
    if (!len) return;
    if (isSpinning) return;

    // Cancel previous spin if any
    if (spinRafRef.current) {
      window.cancelAnimationFrame(spinRafRef.current);
      spinRafRef.current = null;
    }

    setPhase("spinning");
    setSelectedAbsIndex(null);

    const el = containerRef.current;
    const stride = strideRef.current;
    if (!el || !stride) {
      setPhase("idle");
      return;
    }

    // Always start from the middle of the duplicated tape to guarantee "infinite" headroom.
    recenterToMiddleSameCard();

    const startAbs = computeCenteredAbsIndex();
    const startBase = startAbs % len;
    const targetBase = Math.floor(Math.random() * len);
    const deltaBase = (targetBase - startBase + len) % len;
    const loops = 6 + Math.floor(Math.random() * 2); // 6–7 circles: gives “real roulette” feel
    const steps = loops * len + deltaBase;

    const startScroll = el.scrollLeft;
    const endScroll = startScroll + steps * stride;

    const durationMs = 4000;
    const t0 = performance.now();
    let lastAbs = -1;

    // accelerate first 20%, then long smooth deceleration
    const easeInCubic = (t) => t * t * t;
    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
    const easeRoulette = (t) => {
      const a = 0.2;
      if (t <= a) return a * easeInCubic(t / a);
      return a + (1 - a) * easeOutCubic((t - a) / (1 - a));
    };

    const tick = (now) => {
      const t = clamp((now - t0) / durationMs, 0, 1);
      const eased = easeRoulette(t);
      el.scrollLeft = startScroll + (endScroll - startScroll) * eased;

      // Safety: if we ever drift near an edge while animating, jump by full loops (visually identical).
      recenterInfiniteIfNeeded();

      const abs = computeCenteredAbsIndex();
      if (abs !== lastAbs) {
        lastAbs = abs;
        setActiveAbsIndex(abs);
        setActiveIndex(abs % len);
      }

      if (t < 1) {
        spinRafRef.current = window.requestAnimationFrame(tick);
        return;
      }

      // Final snap and select (show card front, but NO prediction yet)
      const finalAbs = computeCenteredAbsIndex();
      centerAbsIndex(finalAbs, "smooth");
      setActiveAbsIndex(finalAbs);
      setActiveIndex(finalAbs % len);
      setSelectedAbsIndex(finalAbs);
      setPhase("selected");
      spinRafRef.current = null;
    };

    spinRafRef.current = window.requestAnimationFrame(tick);
  };

  const onClickSelectedCard = () => {
    if (phase !== "selected") return;
    setPhase("prediction");
  };

  const reset = () => {
    setPhase("idle");
    setSelectedAbsIndex(null);
  };

  return (
    <div className="w-full">
      <div className="relative">
        <div
          ref={containerRef}
          className={[
            // Add extra bottom space on mobile because the action button is fixed to the viewport.
            "no-scrollbar my-[23px] flex w-full items-center gap-4 overflow-x-auto pt-[19px] pb-[19px]",
            isSpinning ? "snap-none" : "snap-x snap-mandatory",
            "scroll-px-8 md:scroll-px-16",
            "px-7 md:px-10",
          ].join(" ")}
          style={{
            WebkitOverflowScrolling: "touch",
            overscrollBehaviorX: "contain",
            pointerEvents: isSpinning ? "none" : "auto",
          }}
        >
          {repeated.map((item) => (
            <div
              key={item.key}
              ref={(node) => {
                itemRefs.current[item.absIndex] = node;
              }}
              className="snap-center flex shrink-0 items-center"
              style={{
                scrollSnapAlign: "center",
                scrollSnapStop: "always",
              }}
            >
              <TarotCard
                title={item.card.title}
                image={item.card.image}
                isActive={item.absIndex === activeAbsIndex}
                prediction={item.card.prediction}
                face={
                  phase === "idle" || phase === "spinning"
                    ? "back"
                    : item.absIndex === selectedAbsIndex
                      ? phase === "prediction"
                        ? "prediction"
                        : "front"
                      : "back"
                }
                isClickable={phase === "selected" && item.absIndex === selectedAbsIndex}
                onClick={onClickSelectedCard}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Bottom controls */}
      <div
        className={[
          // Mobile: keep action button always on-screen.
          "fixed inset-x-0 bottom-0 z-20 px-6 pb-[calc(env(safe-area-inset-bottom,0px)+12px)] pt-3 md:static md:mt-2 md:px-10 md:pb-0 md:pt-0",
        ].join(" ")}
      >
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3">
          {phase === "selected" || phase === "prediction" ? (
            <button
              onClick={reset}
              className="w-full rounded-2xl border border-white/10 bg-[#1C1C1C]/85 px-4 py-3 text-sm font-semibold text-white/90 backdrop-blur hover:bg-[#1C1C1C]/75 active:bg-[#1C1C1C]/70 md:bg-white/5 md:text-white/85 md:hover:bg-white/10 md:active:bg-white/15"
            >
              Выбрать заново
            </button>
          ) : (
            <button
              onClick={startSpin}
              disabled={isSpinning}
              className={[
                "w-full rounded-2xl border px-4 py-[14px] text-sm font-semibold tracking-wide",
                "transition active:scale-[0.99]",
                isSpinning
                  ? "border-white/10 bg-[#1C1C1C]/85 text-white/65 backdrop-blur md:bg-white/5 md:text-white/55"
                  : "border-accent bg-accent text-white shadow-glow hover:brightness-110",
              ].join(" ")}
            >
              {isSpinning ? "Крутим…" : "Выбрать предсказание"}
            </button>
          )}
        </div>
      </div>

      {/* Intentionally no hints text */}
    </div>
  );
}


