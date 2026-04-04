import { ResponsiveDialog } from "@/components/responsive-dialog";
import { AgentGetOne } from "@/modules/agents/types";
interface UpdateAgentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValues: AgentGetOne;
}
import { AgentForm } from "./agent-form";
export const UpdateAgentDialog = ({
  open,
  onOpenChange,
  initialValues,
}: UpdateAgentDialogProps) => {
  return (
    <ResponsiveDialog
      title="Edit Agent"
      description="Edit an existing AI agent to assist you with various tasks."
      open={open}
      onOpenChange={onOpenChange}
    >
      <AgentForm
        onSuccess={() => {
          onOpenChange(false);
        }}
        onCancel={() => {
          onOpenChange(false);
        }}
        initialValues={initialValues}
      />
    </ResponsiveDialog>
  );
};
