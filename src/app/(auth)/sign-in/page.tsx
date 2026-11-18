import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth, enabledSocialProviders } from "@/lib/auth";
import { SignInView } from "@/modules/auth/ui/views/sign-in-view";
const Page = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!!session) {
    redirect("/");
  }
  return <SignInView socialProviders={enabledSocialProviders} />;
};
export default Page;
