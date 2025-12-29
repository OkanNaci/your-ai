import { ResponsiveDialog } from "@/components/responsive-dialog";
interface NewAgentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
import { AgentForm } from "./agent-form";
export const NewAgentDialog = ({ open, onOpenChange }: NewAgentDialogProps) => {
  return (
    <ResponsiveDialog
      title="New Agent"
      description="Create a new AI agent to assist you with various tasks."
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
      />
    </ResponsiveDialog>
  );
};
