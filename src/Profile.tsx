import { User } from "@supabase/supabase-js";
import { create } from "zustand";
import { supabase } from "./state";
import { Button } from "./components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
export const profile = create(() => ({
  loading: true,
  user: null as User | null,
}));

supabase.auth.onAuthStateChange(async (state) => {
  if (state == "SIGNED_OUT") {
    profile.setState(() => ({
      loading: false,
      user: null,
    }));
  }
  if (state != "INITIAL_SESSION") return;

  const user = await supabase.auth.getUser();
  profile.setState(() => ({
    loading: false,
    user: user.data.user,
  }));
});

export function Profile() {
  const { loading, user } = profile();

  if (loading) {
    return <>Loading...</>;
  }
  if (!user) {
    return (
      <div className="w-[100vw] h-[100vh] flex flex-col justify-center items-center">
        <Button
          className=""
          onClick={() => {
            supabase.auth.signInWithOAuth({
              provider: "discord",
              options: {
                redirectTo:
                  document.location.origin + document.location.pathname,
              },
            });
          }}
        >
          Login with Discord
        </Button>
      </div>
    );
  }

  console.log(user);
  return (
    <div className="w-[100vw] h-[100vh] flex flex-col justify-center items-center">
      <Card className="w-96">
        <CardHeader>
          <img
            src={user.user_metadata.avatar_url}
            width={48}
            className="rounded-full"
          ></img>
          <CardTitle>{user.user_metadata.full_name}</CardTitle>
          <CardDescription>
            User since {new Date(user.created_at).toUTCString()}
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button
            onClick={() => {
              supabase.auth.signOut();
            }}
          >
            Sign Out
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
