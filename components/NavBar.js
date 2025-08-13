import Link from "next/link";
import { Select, SelectOption } from "./ui/select";
import { Label } from "./ui/label";
import { usePeriod } from "./PeriodContext";

export default function NavBar() {
  const { period, setPeriod } = usePeriod();

  return (
    <nav className="border-b bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between p-4">
        <Link href="/" className="flex items-center gap-1 text-lg font-bold">
          <span role="img" aria-label="lightning">
            ⚡️
          </span>
          Wattsup for OpenRouter
        </Link>
        <div className="flex items-center gap-3">
          <Label htmlFor="navbar-period-select" className="text-sm">
            Period:
          </Label>
          <Select
            id="navbar-period-select"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="w-auto min-w-[140px]"
          >
            <SelectOption value="day">Today</SelectOption>
            <SelectOption value="week">This week</SelectOption>
            <SelectOption value="month">This month</SelectOption>
          </Select>
        </div>
      </div>
    </nav>
  );
}
