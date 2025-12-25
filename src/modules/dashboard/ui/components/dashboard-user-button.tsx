import { authClient } from "@/lib/auth-client";
import { ChevronDownIcon } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  DropdownMenu,
  DropdownMenuLabel,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { GeneratedAvatar } from "@/components/generated-avatar";
import { CreditCardIcon, LogOutIcon } from "lucide-react";
import { useRouter } from "next/navigation";
export const DashboardUserButton = () => {
  const { data, isPending } = authClient.useSession();
  const router = useRouter();
  const isMobile = useIsMobile(); // Replace with actual mobile detection logic
  const onLogout = () => {
    authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/sign-in");
        },
      },
    });
  };

  if (isPending || !data?.user) {
    return null;
  }
  if (isMobile) {
    return (
      <Drawer>
        <DrawerTrigger asChild>
          <button className="rounded-lg border border-border/10 p-3 w-full flex items-center justify-between bg-white/5 hover:bg-white/10 overflow-hidden gap-x-2">
            {data.user.image ? (
              <Avatar>
                <AvatarImage src={data.user.image} />
              </Avatar>
            ) : (
              <GeneratedAvatar
                seed={data.user.email}
                variant="initials"
                className="size-9 mr-3"
              />
            )}
            <div className="flex flex-col gap-0.5 text-left overflow-hidden flex-1 min-w-0">
              <p className="text-sm truncate w-full">{data.user.name}</p>
              <p className="text-xs truncate w-full">{data.user.email}</p>
            </div>
            <ChevronDownIcon className="size-4 shrink-0" />
          </button>
        </DrawerTrigger>

        <DrawerContent>
          <DrawerHeader className="text-left">
            <DrawerTitle>User Profile</DrawerTitle>
            <DrawerDescription>Manage your account settings</DrawerDescription>
          </DrawerHeader>

          <div className="p-4 flex items-center gap-3 border-b border-border/50">
            {data.user.image ? (
              <Avatar className="size-12">
                <AvatarImage src={data.user.image} />
              </Avatar>
            ) : (
              <GeneratedAvatar
                seed={data.user.email}
                variant="initials"
                className="size-12"
              />
            )}
            <div className="flex flex-col overflow-hidden">
              <p className="font-semibold truncate">{data.user.name}</p>
              <p className="text-sm text-muted-foreground truncate">
                {data.user.email}
              </p>
            </div>
          </div>

          <DrawerFooter className="gap-2 pt-4">
            <button className="flex w-full items-center justify-between rounded-md p-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground border border-border/50">
              Billing
              <CreditCardIcon className="size-4" />
            </button>

            <button
              onClick={onLogout}
              className="flex w-full items-center justify-between rounded-md p-3 text-sm font-medium text-destructive hover:bg-destructive/10 border border-destructive/20"
            >
              Logout
              <LogOutIcon className="size-4" />
            </button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="rounded-lg border border-border/10 p-3 w-full flex items-center justify-between bg-white/5 hover:bg-white/10 overflow-hidden gap-x-2">
        {data.user.image ? (
          <Avatar>
            <AvatarImage src={data.user.image} />
          </Avatar>
        ) : (
          <GeneratedAvatar
            seed={data.user.email}
            variant="initials"
            className="size-9 mr-3"
          />
        )}
        <div className="flex flex-col gap-0.5 text-left overflow-hidden flex-1 min-w-0">
          <p className="text-sm truncate w-full">{data.user.name}</p>
          <p className="text-xs truncate w-full">{data.user.email}</p>
        </div>
        <ChevronDownIcon className="size-4 shrink-0" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72" side="right">
        <DropdownMenuLabel>
          <div className="flex flex-col gap-1">
            <span className="font-medium truncate">{data.user.name}</span>
            <span className="text-sm font-normal text-muted-foreground truncate">
              {data.user.email}
            </span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer items-center justify-between">
          Billing
          <CreditCardIcon className="size-4" />
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={onLogout}
          className="cursor-pointer items-center justify-between"
        >
          Logout
          <LogOutIcon className="size-4" />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
