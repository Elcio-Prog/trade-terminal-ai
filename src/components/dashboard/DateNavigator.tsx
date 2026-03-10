import { useState } from "react";
import { format, subDays, startOfDay, endOfDay, subWeeks, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

interface DateNavigatorProps {
  selectedDate: Date | null;
  onDateChange: (date: Date | null) => void;
}

const QUICK_OPTIONS = [
  { label: "Hoje", offset: 0 },
  { label: "Ontem", offset: 1 },
  { label: "-2d", offset: 2 },
  { label: "-1 sem", offset: 7 },
  { label: "-1 mês", offset: 30 },
];

export function DateNavigator({ selectedDate, onDateChange }: DateNavigatorProps) {
  const [calendarOpen, setCalendarOpen] = useState(false);

  const handleQuick = (offset: number) => {
    if (offset === 0) {
      onDateChange(null); // null = live / mais recente
    } else {
      onDateChange(subDays(new Date(), offset));
    }
  };

  const handlePrev = () => {
    const base = selectedDate ?? new Date();
    onDateChange(subDays(base, 1));
  };

  const handleNext = () => {
    if (!selectedDate) return;
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + 1);
    const today = startOfDay(new Date());
    if (next >= today) {
      onDateChange(null); // back to live
    } else {
      onDateChange(next);
    }
  };

  const isToday = selectedDate === null;

  return (
    <div className="flex items-center gap-1.5">
      {/* Quick buttons */}
      {QUICK_OPTIONS.map((opt) => {
        const isActive = opt.offset === 0
          ? isToday
          : selectedDate !== null &&
            format(selectedDate, "yyyy-MM-dd") === format(subDays(new Date(), opt.offset), "yyyy-MM-dd");

        return (
          <button
            key={opt.label}
            onClick={() => handleQuick(opt.offset)}
            className={cn(
              "px-2 py-1 text-xs font-mono rounded-sm transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            )}
          >
            {opt.label}
          </button>
        );
      })}

      {/* Prev / Next arrows */}
      <div className="flex items-center gap-0.5 ml-1">
        <button
          onClick={handlePrev}
          className="p-1 rounded-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
          title="Dia anterior"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={handleNext}
          disabled={isToday}
          className={cn(
            "p-1 rounded-sm transition-colors",
            isToday
              ? "text-muted-foreground/30 cursor-not-allowed"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
          )}
          title="Próximo dia"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Calendar picker */}
      <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
        <PopoverTrigger asChild>
          <button
            className={cn(
              "flex items-center gap-1.5 px-2 py-1 text-xs font-mono rounded-sm transition-colors",
              selectedDate
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            )}
          >
            <CalendarIcon className="h-3 w-3" />
            {selectedDate
              ? format(selectedDate, "dd/MM/yyyy")
              : "Live"}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            mode="single"
            selected={selectedDate ?? undefined}
            onSelect={(date) => {
              if (date) {
                const today = startOfDay(new Date());
                if (date >= today) {
                  onDateChange(null);
                } else {
                  onDateChange(date);
                }
              }
              setCalendarOpen(false);
            }}
            disabled={(date) => date > new Date()}
            initialFocus
            className={cn("p-3 pointer-events-auto")}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

/** Helper: convert a selected date to dateFrom/dateTo ISO strings for queries */
export function dateToRange(date: Date | null): { dateFrom: string | null; dateTo: string | null } {
  if (!date) return { dateFrom: null, dateTo: null };
  return {
    dateFrom: startOfDay(date).toISOString(),
    dateTo: endOfDay(date).toISOString(),
  };
}
