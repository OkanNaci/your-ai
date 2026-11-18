import { useRouter } from "next/navigation";
import { CommandResponsiveDialog, CommandInput, CommandList, CommandItem, CommandEmpty } from "@/components/ui/command";

interface Props {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const destinations = [
  { name: "Home", href: "/" },
  { name: "Agents", href: "/agents" },
  { name: "Meetings", href: "/meetings" },
];

export const DashboardCommand = ({ open, setOpen }: Props) => {
  const router = useRouter();
  return (
    <CommandResponsiveDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Go to a page" />
      <CommandList>
        <CommandEmpty>No matching pages.</CommandEmpty>
        {destinations.map(({ name, href }) => (
          <CommandItem key={href} onSelect={() => {
            setOpen(false);
            router.push(href);
          }}>{name}</CommandItem>
        ))}
      </CommandList>
    </CommandResponsiveDialog>
  );
};
