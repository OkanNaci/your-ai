import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth, enabledSocialProviders } from "@/lib/auth";
import { SignUpView } from "@/modules/auth/ui/views/sign-up-view";
const Page = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!!session) {
    redirect("/");
  }
  return <SignUpView socialProviders={enabledSocialProviders} />;
};
export default Page;
