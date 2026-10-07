"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext, DragOverlay, KeyboardSensor, PointerSensor, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent, type Announcements,
} from "@dnd-kit/core";
import { CalendarClock, MoreHorizontal } from "lucide-react";
import { Menu } from "@/components/ui/menu";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/components/ui/cn";
import { StatusDot } from "@/components/ui/badge";
import { setStatusAction } from "@/app/actions/prospects";
import { STATUS_META } from "@/lib/status";
import type { CrmStatus, FitLevel } from "@/lib/db/schema";
import { relativeDay } from "@/lib/format";

type CardT = { id: string; name: string; status: CrmStatus; realStatus: CrmStatus; contact: string | null; nextFollowUpAt: number | null; fit: FitLevel | null };

const COLUMNS: CrmStatus[] = ["new", "qualified", "contacted", "replied", "meeting", "opportunity"];
const CLOSED: CrmStatus[] = ["won", "lost"];
const MOVE_TARGETS: CrmStatus[] = [...COLUMNS, ...CLOSED];

export function PipelineBoard({ cards: initial }: { cards: CardT[] }) {
  const router = useRouter();
  const toast = useToast();
  const [cards, setCards] = useState(initial);
  const [active, setActive] = useState<CardT | null>(null);
  const [, start] = useTransition();
  useEffect(() => setCards(initial), [initial]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor));

  const move = (id: string, to: CrmStatus) => {
    const card = cards.find((c) => c.id === id);
    if (!card || card.status === to) return;
    const before = cards;
    setCards((cs) => cs.map((c) => (c.id === id ? { ...c, status: to, realStatus: to } : c)));
    start(async () => {
      const r = await setStatusAction(id, to);
      if (!r.ok) {
        setCards(before);
        toast({ kind: "error", title: r.error });
      } else {
        toast({ title: `${card.name} moved to ${STATUS_META[to].label}` });
        router.refresh();
      }
    });
  };

  const onDragEnd = (e: DragEndEvent) => {
    setActive(null);
    if (e.over) move(String(e.active.id), e.over.id as CrmStatus);
  };

  const name = (id: string | number) => cards.find((c) => c.id === id)?.name ?? "Card";
  const col = (id?: string | number) => (id ? STATUS_META[id as CrmStatus]?.label : "");
  const announcements: Announcements = {
    onDragStart: ({ active: a }) => `Picked up ${name(a.id)}.`,
    onDragOver: ({ active: a, over }) => (over ? `${name(a.id)} is over ${col(over.id)}.` : `${name(a.id)} is not over a stage.`),
    onDragEnd: ({ active: a, over }) => (over ? `${name(a.id)} moved to ${col(over.id)}.` : `${name(a.id)} dropped.`),
    onDragCancel: ({ active: a }) => `Moving ${name(a.id)} cancelled.`,
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={(e) => setActive(cards.find((c) => c.id === e.active.id) ?? null)}
      onDragEnd={onDragEnd}
      onDragCancel={() => setActive(null)}
      accessibility={{ announcements, screenReaderInstructions: { draggable: "To move a company, press space or enter, use the arrow keys to choose a stage, then press space or enter again. Or use the “Move to” menu on each card." } }}
    >
      <div className="-mx-4 overflow-x-auto px-4 pb-4 scrollbar-thin sm:-mx-8 sm:px-8">
        <div className="grid min-w-[1080px] grid-cols-7 gap-3">
          {COLUMNS.map((s) => (
            <Column key={s} status={s} cards={cards.filter((c) => c.status === s)} onMove={move} />
          ))}
          <div className="flex flex-col gap-3">
            {CLOSED.map((s) => (
              <Column key={s} status={s} cards={cards.filter((c) => c.status === s)} onMove={move} compact />
            ))}
          </div>
        </div>
      </div>
      <DragOverlay dropAnimation={null}>{active && <CardBody c={active} dragging />}</DragOverlay>
    </DndContext>
  );
}

function Column({ status, cards, onMove, compact }: { status: CrmStatus; cards: CardT[]; onMove: (id: string, to: CrmStatus) => void; compact?: boolean }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const meta = STATUS_META[status];
  return (
    <section
      ref={setNodeRef}
      aria-label={`${meta.label}: ${cards.length} ${cards.length === 1 ? "company" : "companies"}`}
      style={{ borderTopColor: `var(--${{ neutral: "border-strong", accent: "accent", strong: "strong", moderate: "moderate", weak: "weak", info: "info", violet: "violet" }[meta.tone]})` }}
      className={cn("flex flex-col rounded-lg border border-t-[3px] bg-surface-2 p-2 transition-colors", isOver ? "border-accent bg-accent-soft/60" : "border-border", compact ? "min-h-28" : "min-h-56")}
    >
      <header className="flex items-center gap-2 px-1.5 pt-1 pb-2.5">
        <StatusDot tone={meta.tone} />
        <h2 className="text-sm font-semibold">{meta.label}</h2>
        <span className="ml-auto text-xs tabular-nums text-subtle">{cards.length}</span>
      </header>
      <ul className="flex flex-col gap-2">
        {cards.map((c) => (
          <DraggableCard key={c.id} c={c} onMove={onMove} />
        ))}
      </ul>
      {cards.length === 0 && <p className="rounded-md border border-dashed border-border-strong px-2 py-4 text-center text-xs text-subtle">{isOver ? "Drop here" : "Nothing here"}</p>}
    </section>
  );
}

function DraggableCard({ c, onMove }: { c: CardT; onMove: (id: string, to: CrmStatus) => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: c.id });
  return (
    <li ref={setNodeRef} className={cn("relative", isDragging && "opacity-30")}>
      <div {...listeners} {...attributes} aria-roledescription="Draggable company" aria-label={`${c.name}, ${STATUS_META[c.realStatus].label}`} className="rounded-md outline-none focus-visible:shadow-[var(--ring)]">
        <CardBody c={c} />
      </div>
      <div className="absolute top-1.5 right-1.5">
        <Menu
          align="end"
          width={200}
          items={[{ type: "label", label: "Move to" }, ...MOVE_TARGETS.filter((s) => s !== c.status).map((s) => ({ label: STATUS_META[s].label, icon: <StatusDot tone={STATUS_META[s].tone} className="mx-1" />, onSelect: () => onMove(c.id, s) }))]}
          trigger={({ ref, ...p }) => (
            <button ref={ref} {...p} aria-label={`Move ${c.name} to another stage`} className="rounded p-1 text-subtle hover:bg-surface-2 hover:text-text">
              <MoreHorizontal className="size-3.5" />
            </button>
          )}
        />
      </div>
    </li>
  );
}

function CardBody({ c, dragging }: { c: CardT; dragging?: boolean }) {
  const overdue = c.nextFollowUpAt && c.nextFollowUpAt < new Date().setHours(0, 0, 0, 0);
  return (
    <div className={cn("cursor-grab rounded-md border border-border bg-surface px-3 py-2.5 shadow-sm active:cursor-grabbing", dragging && "rotate-1 shadow-lg")}>
      <Link href={`/prospects/${c.id}`} className="block pr-5 text-sm leading-5 font-medium hover:underline" onClick={(e) => dragging && e.preventDefault()}>
        {c.name}
      </Link>
      {c.contact && <p className="mt-0.5 truncate text-xs text-muted">{c.contact}</p>}
      {c.nextFollowUpAt && (
        <p className={cn("mt-1.5 flex items-center gap-1 text-xs", overdue ? "font-medium text-weak" : "text-subtle")}>
          <CalendarClock className="size-3" aria-hidden />
          {relativeDay(c.nextFollowUpAt)}
        </p>
      )}
    </div>
  );
}
