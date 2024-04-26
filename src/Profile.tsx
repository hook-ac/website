import { User } from "@supabase/supabase-js";
import { create } from "zustand";
import { supabase } from "./state";
import { Button } from "./components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
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
  lUpdate: Date.now(),
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

  // Retrieve features and user settings
  let { data: features } = await supabase.from("features").select("*");
  let { data: userSettings } = await supabase.from("userSettings").select("*");

  if (user.data.user) {
    // Cast to Insert data type
    let settings =
      userSettings![0] as any as Database["public"]["Tables"]["userSettings"]["Insert"];

    if (!settings) {
      // Define a settings row
      settings = {
        user: user.data.user.id,
        definition: {
          init: Date.now(),
        },
      };

      // Insert and retrieve back the newly created row.
      await supabase.from("userSettings").upsert(settings);
      let { data: newSettings } = await supabase
        .from("userSettings")
        .select("*");

      profile.setState({
        userSettings: newSettings,
      });
    }

    // Subscribe for config changes
    profile.subscribe(async (profile, prefProfile) => {
      if (!profile.userSettings) return;
      if (!isEqual(profile.lUpdate, prefProfile.lUpdate)) {
        for (const setting of profile.userSettings) {
          await supabase.from("userSettings").upsert(setting);
        }
      }
      return profile;
    });
  }

  // Create profile state, reuse userSettings if they were created.
  profile.setState((prev) => ({
    loading: false,
    user: user.data.user,
    features,
    userSettings: prev.userSettings ? prev.userSettings : userSettings,
    lUpdate: Date.now(),
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
  function updateField(fieldName: string, state: any) {
    let settings = userSettings![0];

    // Recreate the definition with the new field (upsert field)
    settings.definition = {
      ...(settings.definition as any),
      [fieldName]: state,
    };

    // Set the new state and indicate to update
    profile.setState({
      userSettings: [settings],
      lUpdate: Date.now(),
    });
  }

  function getConfigValue(fieldName: string, defaultValue: any) {
    // If there's no such field, insert it into DB before displaying.
    if ((userSettings![0].definition as any)[fieldName] === undefined) {
      updateField(fieldName, defaultValue);
      return defaultValue;
    }
    return (userSettings![0].definition as any)[fieldName];
  }
  return (
    <Tabs defaultValue={(2).toString()} className="w-full">
      <TabsList className="w-full justify-start bg-transparent">
        {features
          ?.sort((a, b) => b.priority! - a.priority!)
          .map((feature) => {
            return (
              <TabsTrigger
                value={feature.id!.toString()}
                className="data-[state=active]:bg-muted rounded-full"
              >
                {feature.name}
              </TabsTrigger>
            );
          })}
      </TabsList>

      {features?.map((feature) => {
        return (
          <TabsContent value={feature.id!.toString()}>
            <div className="flex flex-col gap-2">
              {(
                feature.defaultDefinition as any as FeatureDefinition
              ).fields.map((field) => {
                if (field.type == "boolean") {
                  return (
                    <Card className="flex p-2 px-4 text-sm justify-between items-center">
                      {field.name}
                      <Switch
                        checked={getConfigValue(
                          `${feature.name}:${field.name}`,
                          field.value
                        )}
                        onCheckedChange={(state) => {
                          updateField(`${feature.name}:${field.name}`, state);
                        }}
                      ></Switch>
                    </Card>
                  );
                }

                if (field.type == "number") {
                  return (
                    <Card className="flex p-2 px-4 text-sm justify-between items-center">
                      {field.name}
                      <Slider
                        defaultValue={[field.value]}
                        max={Number(field.max)}
                        step={1}
                        min={Number(field.min)}
                        onValueCommit={(value) => {
                          updateField(
                            `${feature.name}:${field.name}`,
                            value[0]
                          );
                        }}
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
