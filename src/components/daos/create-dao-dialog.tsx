import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { PlusCircle, X } from "lucide-react";

const CreateDaoDialog = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [extensions, setExtensions] = useState([""]); // Array to store extension contract addresses
  const [includeDeployer, setIncludeDeployer] = useState(true);

  const handleAddExtension = () => {
    setExtensions([...extensions, ""]);
  };

  const handleRemoveExtension = (index: number) => {
    const newExtensions = extensions.filter((_, i) => i !== index);
    setExtensions(newExtensions);
  };

  const handleExtensionChange = (index: number, value: string) => {
    const newExtensions = [...extensions];
    newExtensions[index] = value;
    setExtensions(newExtensions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Filter out empty extensions
      const validExtensions = extensions.filter((ext) => ext.trim() !== "");

      // Prepare request payload
      const payload = {
        name,
        description,
        extensions: validExtensions,
        includeDeployer,
      };

      console.log("Submitting request with payload:", payload);

      // Make API call to generate contract
      const response = await fetch("/api/daos/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      // Log detailed response information
      console.log("API Response Status:", response.status);
      console.log(
        "API Response Headers:",
        Object.fromEntries(response.headers)
      );
      console.log("API Response Data:", data);

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate contract");
      }

      setIsOpen(false);
    } catch (error) {
      console.error("Error generating contract:", {
        message: error instanceof Error ? error.message : "Unknown error",
        error,
      });
      // You might want to add error handling UI here
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="">
          Create New DAO
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New DAO</DialogTitle>
          <DialogDescription>
            Deploy a new DAO with initial extension configurations
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="name"
                  className="text-sm font-medium block mb-1"
                >
                  Name
                </label>
                <Input
                  id="name"
                  placeholder="Enter DAO name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="text-sm font-medium block mb-1"
                >
                  Description
                </label>
                <Input
                  id="description"
                  placeholder="Enter DAO description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeDeployer"
                checked={includeDeployer}
                onCheckedChange={(checked) =>
                  setIncludeDeployer(checked === true)
                }
              />
              <label
                htmlFor="includeDeployer"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Include deployer as extension
              </label>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium">Initial Extensions</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddExtension}
                  className="h-8"
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Extension
                </Button>
              </div>

              {extensions.map((extension, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    placeholder="Extension contract address"
                    value={extension}
                    onChange={(e) =>
                      handleExtensionChange(index, e.target.value)
                    }
                    className="flex-1"
                  />
                  {extensions.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveExtension(index)}
                      className="h-8 w-8"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Deploy DAO</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateDaoDialog;
