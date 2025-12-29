import { AgentGetOne } from "../../../types";
import { useTRPC } from "@/trpc/client";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { agentInsertSchema } from "../../../schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { Textarea } from "@/components/ui/textarea";
import { GeneratedAvatar } from "@/components/generated-avatar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
interface AgentFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  initialValues?: AgentGetOne;
}
export const AgentForm = ({
  onSuccess,
  onCancel,
  initialValues,
}: AgentFormProps) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const createAgent = useMutation(
    trpc.agents.create.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(trpc.agents.getMany.queryOptions());
        if (initialValues?.id) {
          await queryClient.invalidateQueries(
            trpc.agents.getOne.queryOptions({ id: initialValues.id })
          );
        }
        onSuccess?.();
      },
      onError: (error) => {
        toast.error(error.message);
      },
    })
  );
  const form = useForm<z.infer<typeof agentInsertSchema>>({
    resolver: zodResolver(agentInsertSchema),
    defaultValues: {
      name: initialValues?.name ?? "",
      instructions: initialValues?.instructions ?? "",
    },
  });
  const isEdit = !!initialValues?.id;
  const isPending = createAgent.isPending;
  const onSubmit = (values: z.infer<typeof agentInsertSchema>) => {
    if (isEdit) {
      console.log("Edit agent not implemented yet");
    } else {
      createAgent.mutate(values);
    }
  };
  return (
    <Form {...form}>
      <form className=" space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        <GeneratedAvatar
          className="border size-16"
          variant="botttsNeutral"
          seed={form.watch("name")}
        />
        <FormField
          name="name"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Textarea placeholder="e.g. Finance Assistant" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          name="instructions"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Instructions</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="You are an helpful finance assistant that can answer questions with assignment."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-between gap-x-2">
          {onCancel && (
            <Button
              variant="ghost"
              disabled={isPending}
              type="button"
              onClick={() => {
                onCancel();
              }}
            >
              Cancel
            </Button>
          )}
          <Button disabled={isPending} type="submit">
            {isEdit ? "Update" : "Create"} Agent
          </Button>
        </div>
      </form>
    </Form>
  );
};
