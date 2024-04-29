import { useState } from "react";
import { Button } from "./components/ui/button";
import { Logo } from "./composites/logo";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Route, Routes, useNavigate } from "react-router-dom";
import { Profile } from "./Profile";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/profile" element={<Profile />} />
    </Routes>
  );
}

export function Landing() {
  const [forceOpenTooltip, setForceOpenTooltip] = useState(false);
  const navigate = useNavigate();
  return (
    <div className="w-[100vw] h-[100vh] flex flex-col justify-center items-center gap-10 invert-0">
      <Logo />
      <div className="flex flex-col gap-8 items-center">
        <div className="flex flex-col gap-3 items-center">
          <h1 className="text-4xl font-extrabold">
            Hook
            <span className="text-lg font-medium text-muted-foreground">
              .ac
            </span>
          </h1>
          <blockquote className="border-l-2 pl-6 italic">
            "if u cant bypass the delta check then what are u even"
          </blockquote>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => {
              location.href = "https://edit.hook.ac";
            }}
            className="w-36"
            variant="outline"
          >
            Editor
          </Button>
          <Button
            onClick={() => {
              location.href = "https://github.com/hook-ac";
            }}
            className="w-36"
            variant="outline"
          >
            Github
          </Button>
          <Button
            className="w-36"
            variant="outline"
            onClick={async () => {
              navigate("/profile");
            }}
          >
            Profile
          </Button>
        </div>
      </div>
    </div>
  );
}

export default App;
