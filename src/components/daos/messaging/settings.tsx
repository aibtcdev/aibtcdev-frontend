import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export default function MessagingSettings() {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Messaging Settings</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="maxMessageSize">Maximum Message Size (bytes)</Label>
          <Input id="maxMessageSize" type="number" defaultValue={1048576} />
          <p className="text-sm text-muted-foreground">
            Maximum size for individual messages
          </p>
        </div>

        <div className="space-y-2">
          <Label className="block mb-2">Message Retention</Label>
          <div className="flex items-center space-x-2">
            <Switch id="retainMessages" defaultChecked />
            <Label htmlFor="retainMessages">
              Archive messages for analysis
            </Label>
          </div>
          <p className="text-sm text-muted-foreground">
            Keep message history for analytics
          </p>
        </div>
      </div>
    </div>
  );
}
