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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { useEffect } from "react";
import { Database } from "./supabase";
import { isEqual } from "lodash";
import { FeatureDefinition } from "./types";
import { Switch } from "./components/ui/switch";
import { Slider } from "./components/ui/slider";
export const profile = create(() => ({
  loading: true,
  user: null as User | null,
  features: null as Database["public"]["Tables"]["features"]["Insert"][] | null,
  userSettings: null as
    | Database["public"]["Tables"]["userSettings"]["Insert"][]
    | null,
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
  let { data: features, error } = await supabase.from("features").select("*");

  let { data: userSettings, error: userSettingsError } = await supabase
    .from("userSettings")
    .select("*");

  profile.setState(() => ({
    loading: false,
    user: user.data.user,
    features,
    userSettings,
  }));

  profile.subscribe(async (profile, prefProfile) => {
    if (!profile.userSettings) return;

    if (!isEqual(profile.userSettings, prefProfile.userSettings)) {
      console.log("not equals");
      for (const setting of profile.userSettings) {
        console.log(setting);
        let data = await supabase.from("userSettings").upsert(setting);
        console.log(data.error);
        console.log("upserted");
      }
    }
    return profile;
  });
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

  return (
    <div className="w-[100vw] max-w-[800px] h-[100vh] flex flex-col items-center py-24 m-auto px-4 gap-4">
      <div className="w-full flex gap-4 p-4 border-b-2">
        <img
          src={user.user_metadata.avatar_url}
          width={48}
          className="rounded-full"
        ></img>
        <div>
          <CardTitle>{user.user_metadata.full_name}</CardTitle>
          <CardDescription>
            User since {new Date(user.created_at).toUTCString()}
          </CardDescription>
        </div>
      </div>
      <Settings />
    </div>
  );
}

export function Settings() {
  const { features, userSettings } = profile();

  return (
    <Tabs defaultValue={2} className="w-full">
      <TabsList className="w-full justify-start bg-transparent">
        {features
          ?.sort((a, b) => b.priority! - a.priority!)
          .map((feature) => {
            return (
              <TabsTrigger
                value={feature.id}
                className="data-[state=active]:bg-muted rounded-full"
              >
                {feature.name}
              </TabsTrigger>
            );
          })}
      </TabsList>

      {features?.map((feature) => {
        return (
          <TabsContent value={feature.id}>
            <div className="flex flex-col gap-2">
              {(
                feature.defaultDefinition as any as FeatureDefinition
              ).fields.map((field) => {
                if (field.type == "boolean") {
                  return (
                    <Card className="flex p-2 px-4 text-sm justify-between items-center">
                      {field.name}
                      <Switch onCheckedChange={() => {}}></Switch>
                    </Card>
                  );
                }

                if (field.type == "number") {
                  return (
                    <Card className="flex p-2 px-4 text-sm justify-between items-center">
                      {field.name}
                      <Slider
                        defaultValue={[33]}
                        max={100}
                        step={1}
                        className="w-64"
                      />
                    </Card>
                  );
                }
                if (field.type == "string") {
                }
                if (field.type == "choose") {
                }
                return <Card className="p-2 px-4 text-sm">{field.name}</Card>;
              })}
            </div>
          </TabsContent>
        );
      })}
    </Tabs>
  );
}
