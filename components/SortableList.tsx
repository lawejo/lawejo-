"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";

type Item = { id: string; content: ReactNode };
type Props = { items: Item[]; onReorder: (ids: string[]) => Promise<void> };

const LONG_PRESS_MS = 400;
const MOVE_TOLERANCE = 8; // så meget må fingeren flytte sig, før et langt tryk bliver til scroll

// Flyt rækkefølgen: på telefonen ved at holde på et kort, med musen ved at trække i ⠿,
// og med tastaturet med pil op/ned på ⠿. Gemmes, når man slipper.
export function SortableList({ items, onReorder }: Props) {
  const [order, setOrder] = useState(items.map((i) => i.id));
  const [dragging, setDragging] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [failed, setFailed] = useState(false);
  const refs = useRef(new Map<string, HTMLElement>());
  const gesture = useRef<{ id: string; startY: number; timer?: number; active: boolean } | null>(null);

  // Ny data fra serveren (fx en ny vane) giver en ny rækkefølge.
  const serverOrder = items.map((i) => i.id).join();
  const [prevServerOrder, setPrevServerOrder] = useState(serverOrder);
  if (serverOrder !== prevServerOrder) {
    setPrevServerOrder(serverOrder);
    setOrder(items.map((i) => i.id));
  }

  // iOS scroller, medmindre touchmove stoppes, mens et kort trækkes.
  useEffect(() => {
    const stopScroll = (e: TouchEvent) => gesture.current?.active && e.preventDefault();
    document.addEventListener("touchmove", stopScroll, { passive: false });
    return () => document.removeEventListener("touchmove", stopScroll);
  }, []);

  function start(id: string, y: number) {
    gesture.current = { id, startY: y, active: true };
    setDragging(id);
    setOffset(0);
    navigator.vibrate?.(10);
  }

  function onPointerDown(id: string, e: PointerEvent) {
    const target = e.target as HTMLElement;
    if (target.closest("[data-drag-handle]") && e.pointerType === "mouse") {
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      start(id, e.clientY);
      return;
    }
    if (e.pointerType === "mouse" || target.closest("button, a, input, select, textarea, summary, label")) return;
    const startY = e.clientY;
    gesture.current = {
      id,
      startY,
      active: false,
      timer: window.setTimeout(() => start(id, startY), LONG_PRESS_MS),
    };
  }

  function onPointerMove(e: PointerEvent) {
    const g = gesture.current;
    if (!g) return;
    if (!g.active) {
      if (Math.abs(e.clientY - g.startY) > MOVE_TOLERANCE) cancel();
      return;
    }

    // Byt plads med naboen, når kortet er trukket mere end halvt forbi den.
    let dy = e.clientY - g.startY;
    const index = order.indexOf(g.id);
    const neighbour = order[dy > 0 ? index + 1 : index - 1];
    const current = refs.current.get(g.id);
    const other = neighbour && refs.current.get(neighbour);
    if (current && other) {
      // Så langt flytter kortet, når det bytter plads med naboen.
      const shift =
        dy > 0
          ? other.offsetTop + other.offsetHeight - (current.offsetTop + current.offsetHeight)
          : current.offsetTop - other.offsetTop;
      if (Math.abs(dy) > shift / 2) {
        const next = [...order];
        next.splice(index, 1);
        next.splice(dy > 0 ? index + 1 : index - 1, 0, g.id);
        setOrder(next);
        g.startY += dy > 0 ? shift : -shift;
        dy = e.clientY - g.startY;
      }
    }
    setOffset(dy);
  }

  function cancel() {
    window.clearTimeout(gesture.current?.timer);
    gesture.current = null;
  }

  function end() {
    const wasActive = gesture.current?.active;
    cancel();
    setDragging(null);
    setOffset(0);
    if (wasActive) save(order);
  }

  function save(next: string[]) {
    const before = items.map((i) => i.id);
    if (next.join() === before.join()) return;
    setFailed(false);
    onReorder(next).catch(() => {
      setOrder(before);
      setFailed(true);
    });
  }

  function onKeyDown(id: string, e: KeyboardEvent) {
    if (!(e.target as HTMLElement).closest("[data-drag-handle]")) return;
    const step = e.key === "ArrowUp" ? -1 : e.key === "ArrowDown" ? 1 : 0;
    const index = order.indexOf(id);
    if (!step || !order[index + step]) return;
    e.preventDefault();
    const next = [...order];
    next.splice(index, 1);
    next.splice(index + step, 0, id);
    setOrder(next);
    save(next);
  }

  const byId = new Map(items.map((i) => [i.id, i.content]));
  return (
    <>
      {failed && <p className="error">Rækkefølgen kunne ikke gemmes. Prøv igen.</p>}
      {order
        .filter((id) => byId.has(id))
        .map((id) => (
          <div
            key={id}
            ref={(el) => {
              if (el) refs.current.set(id, el);
              else refs.current.delete(id);
            }}
            className={`sortable ${dragging === id ? "dragging" : ""}`}
            style={dragging === id ? { transform: `translateY(${offset}px)` } : undefined}
            onPointerDown={(e) => onPointerDown(id, e)}
            onPointerMove={onPointerMove}
            onPointerUp={end}
            onPointerCancel={end}
            onKeyDown={(e) => onKeyDown(id, e)}
          >
            {byId.get(id)}
          </div>
        ))}
    </>
  );
}
