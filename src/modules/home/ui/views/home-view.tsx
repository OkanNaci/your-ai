import Link from "next/link";
import { ArrowRight, BotIcon, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";

const destinations = [
  {
    name: "Agents",
    description: "Give an assistant a name, a role, and instructions for a specific topic.",
    href: "/agents",
    icon: BotIcon,
  },
  {
    name: "Meetings",
    description: "Choose an agent, set an agenda, and save decisions and next steps.",
    href: "/meetings",
    icon: CalendarDays,
  },
];

export const HomeView = () => (
  <div className="mx-auto w-full max-w-5xl space-y-8 px-4 py-8 md:px-8">
    <section className="rounded-2xl bg-sidebar px-6 py-10 text-sidebar-foreground md:px-10">
      <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Your meeting workspace</h1>
      <p className="mt-3 max-w-xl text-base">
        Create a specialist assistant and use it to prepare for focused meetings.
      </p>
      <Button asChild className="mt-6" variant="secondary">
        <Link href="/agents">Set up an agent <ArrowRight /></Link>
      </Button>
    </section>
    <div className="grid gap-4 sm:grid-cols-2">
      {destinations.map(({ name, description, href, icon: Icon }) => (
        <Link key={href} href={href} className="rounded-xl border bg-card p-6 transition-colors hover:border-primary">
          <Icon className="size-6 text-primary" aria-hidden="true" />
          <h2 className="mt-4 text-lg font-semibold">{name}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        </Link>
      ))}
    </div>
  </div>
);
