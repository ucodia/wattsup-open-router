"use client";

import { ExternalLink } from "@/components/external-link";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import electricityMixes from "@/lib/data/electricity_mixes.json";
import { Lightbulb } from "lucide-react";
import { useEffect, useState } from "react";

const DEFAULT_CONFIG = {
  totalParameters: 120,
  activeParameters: 20,
  requestLatency: 500,
  energyMix: "WOR",
};

const STORAGE_KEY = "simulation-config";

export function SimulationConfigEditor({ config, onConfigChange, children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempConfig, setTempConfig] = useState(config);

  useEffect(() => {
    setTempConfig(config);
  }, [config]);

  const handleSave = () => {
    onConfigChange(tempConfig);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tempConfig));
    setIsOpen(false);
  };

  const handleReset = () => {
    setTempConfig(DEFAULT_CONFIG);
  };

  const handleCancel = () => {
    setTempConfig(config);
    setIsOpen(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Simulation parameters</SheetTitle>
          <SheetDescription>
            Adjust the parameters used for LLM energy usage simulation.
          </SheetDescription>
        </SheetHeader>

        <div className="grid gap-6 p-6">
          <div className="grid gap-3">
            <Label htmlFor="totalParameters">Total parameters (billions)</Label>
            <Input
              id="totalParameters"
              type="number"
              min="0"
              step="1"
              value={tempConfig.totalParameters}
              onChange={(e) =>
                setTempConfig({
                  ...tempConfig,
                  totalParameters: parseInt(e.target.value) || 0,
                })
              }
            />
            <p className="text-xs text-muted-foreground">
              Total number of parameters in the model
            </p>
          </div>

          <div className="grid gap-3">
            <Label htmlFor="activeParameters">
              Active parameters (billions)
            </Label>
            <Input
              id="activeParameters"
              type="number"
              min="0"
              step="1"
              value={tempConfig.activeParameters}
              onChange={(e) =>
                setTempConfig({
                  ...tempConfig,
                  activeParameters: parseInt(e.target.value) || 0,
                })
              }
            />
            <p className="text-xs text-muted-foreground">
              Number of parameters actively used during inference
            </p>
          </div>

          <div className="grid gap-3">
            <Label htmlFor="requestLatency">Request Latency (ms)</Label>
            <Input
              id="requestLatency"
              type="number"
              min="0"
              step="50"
              value={tempConfig.requestLatency}
              onChange={(e) =>
                setTempConfig({
                  ...tempConfig,
                  requestLatency: parseInt(e.target.value) || 0,
                })
              }
            />
            <p className="text-xs text-muted-foreground">
              Average latency per request in milliseconds
            </p>
          </div>

          <div className="grid gap-3">
            <Label htmlFor="energyMix">Energy Mix</Label>
            <Select
              value={tempConfig.energyMix}
              onValueChange={(value) =>
                setTempConfig({
                  ...tempConfig,
                  energyMix: value,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select energy mix" />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(electricityMixes)
                  .sort((a, b) => {
                    if (a === "WOR") return -1;
                    if (b === "WOR") return 1;
                    if (a === "EEE") return -1;
                    if (b === "EEE") return 1;
                    return electricityMixes[a].name.localeCompare(
                      electricityMixes[b].name
                    );
                  })
                  .map((zoneCode) => (
                    <SelectItem key={zoneCode} value={zoneCode}>
                      {electricityMixes[zoneCode]?.name || zoneCode}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Regional electricity mix for emissions calculations
            </p>
          </div>

          <Alert>
            <Lightbulb />
            <AlertDescription>
              Learn more about the methodology on{" "}
              <ExternalLink href="https://ecologits.ai/latest/methodology/llm_inference/">
                Ecologits website.
              </ExternalLink>{" "}
            </AlertDescription>
          </Alert>
        </div>

        <SheetFooter className="flex flex-col gap-2 pt-6">
          <Button variant="outline" onClick={handleReset}>
            Reset to Defaults
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCancel} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSave} className="flex-1">
              Save Changes
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export function loadSimulationConfig() {
  if (typeof window === "undefined") return DEFAULT_CONFIG;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.warn("Failed to load simulation config from localStorage:", error);
  }

  return DEFAULT_CONFIG;
}
