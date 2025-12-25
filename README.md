# Tarot 2026 (React + Tailwind) — mobile-first “рулетка”

## Запуск

```bash
npm install
npm run dev
```

Открой адрес из консоли (обычно `http://localhost:5173`).

## Что внутри

- `src/components/TarotCard.jsx` — карточка (картинка + название)
- `src/components/TarotCarousel.jsx` — горизонтальная карусель со **scroll-snap** + кнопка **«Выбрать предсказание»** (рулетка ~4с, затем остановка и показ prediction)
- `src/data/cards.js` — 6 карт `{ id, title, image, prediction }`
- `public/cards/*.svg` — атмосферные SVG-заглушки карт + `00-back.svg` (рубашка)


