import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { CommandSelect } from "@/components/command-select";
import { GeneratedAvatar } from "@/components/generated-avatar";
// 1. Import your hook
import { useMeetingsFilters } from "../../hooks/use-meetings-filters";

export const AgentIdFilter = () => {
  // 2. DELETE the local useState. Use the shared hook instead.
  const [filters, setFilters] = useMeetingsFilters();

  const trpc = useTRPC();
  const [agentSearch, setAgentSearch] = useState("");

  const { data } = useQuery(
    trpc.agents.getMany.queryOptions({
      pageSize: 100,
      search: agentSearch,
    }),
  );

  return (
    <CommandSelect
      className="h-9"
      placeholder="Agent"
      options={(data?.items || []).map((agent) => ({
        id: agent.id,
        value: agent.id,
        children: (
          <div className="flex items-center gap-2">
            <GeneratedAvatar
              className="size-4"
              seed={agent.name}
              variant="botttsNeutral"
            />
            {agent.name}
          </div>
        ),
      }))}
      // 3. Update the URL state when an agent is selected
      // Also reset the page to null (page 1) so the results refresh correctly
      onSelect={(value) => setFilters({ agentId: value, page: null })}
      onSearch={setAgentSearch}
      // 4. Now this 'value' will clear automatically when the URL clears!
      value={filters.agentId ?? ""}
    />
  );
};
