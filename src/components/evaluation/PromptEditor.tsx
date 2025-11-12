import React, { useState, useEffect, useRef } from "react";
import { Send, AlertCircle, X, Loader2, RotateCcw, Plus } from "lucide-react";

interface DefaultPrompts {
  system_prompt: string;
  user_prompt_template: string;
}

interface PromptEditorProps {
  defaultPrompts?: DefaultPrompts;
  promptsLoading: boolean;
  promptsError: Error | null;
  onSubmit: (systemPrompt: string, userPrompt: string) => void;
  isSubmitting: boolean;
  submitError: string | null;
  canSubmit: boolean;
}

// Available context variables
const AVAILABLE_VARIABLES = [
  "proposal_content",
  "dao_mission",
  "community_info",
  "past_proposals",
];

// Convert variable names to human-readable titles
const formatVariableTitle = (variableName: string): string => {
  return (
    variableName
      // Handle camelCase: convert to snake_case first
      .replace(/([a-z])([A-Z])/g, "$1_$2")
      // Split by underscores and capitalize each word
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ")
  );
};

// Badge component for variables
const VariableBadge = ({
  variableName,
  displayTitle,
}: {
  variableName: string;
  displayTitle: string;
}) => (
  <span
    className="inline-flex items-center px-2 py-0.5 mx-0.5 text-xs font-medium bg-primary/10 text-primary border border-primary/20 rounded-sm variable-badge"
    data-variable={variableName}
    title={`Variable: {${variableName}}`}
  >
    {displayTitle}
  </span>
);

// Draggable badge component for the variable palette
const DraggableBadge = ({
  variableName,
  displayTitle,
}: {
  variableName: string;
  displayTitle: string;
}) => {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("text/plain", `{${variableName}}`);
    e.dataTransfer.effectAllowed = "copy";
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium bg-primary/5 text-primary border border-primary/30 rounded-sm hover:bg-primary/10 hover:border-primary/50 cursor-grab active:cursor-grabbing transition-all duration-200 select-none"
      title={`Drag to add {${variableName}} to your prompt`}
    >
      <Plus className="h-3 w-3" />
      {displayTitle}
    </div>
  );
};

// Variable palette component
const VariablePalette = () => (
  <div className="space-y-3">
    <div className="flex items-center gap-2">
      <h3 className="text-sm font-medium text-foreground">
        Available Context Variables
      </h3>
      <div className="text-xs text-muted-foreground bg-muted/20 px-2 py-1 rounded">
        Drag & drop into prompts
      </div>
    </div>
    <div className="flex flex-wrap gap-2 p-3 bg-muted/10 border border-muted/20 rounded-sm">
      {AVAILABLE_VARIABLES.map((variable) => (
        <DraggableBadge
          key={variable}
          variableName={variable}
          displayTitle={formatVariableTitle(variable)}
        />
      ))}
    </div>
  </div>
);

// Parse text content and render variables as badges
const parseContentWithBadges = (content: string) => {
  const parts = content.split(/(\{[^}]+\})/g);
  return parts.map((part, index) => {
    if (part.match(/^\{[^}]+\}$/)) {
      // Remove the curly braces and get the variable name
      const variableName = part.slice(1, -1);
      const displayTitle = formatVariableTitle(variableName);
      return (
        <VariableBadge
          key={index}
          variableName={variableName}
          displayTitle={displayTitle}
        />
      );
    }
    return part;
  });
};

// Convert HTML content back to plain text with variables
const convertToPlainText = (element: HTMLElement): string => {
  let result = "";
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_ALL, null);

  let node = walker.nextNode();
  while (node) {
    if (node.nodeType === Node.TEXT_NODE) {
      result += node.textContent || "";
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      if (el.classList.contains("variable-badge")) {
        // Add curly braces back when converting to plain text
        const variableName =
          el.getAttribute("data-variable") || el.textContent || "";
        result += `{${variableName}}`;
      } else if (el.tagName === "BR") {
        result += "\n";
      } else if (el.tagName === "DIV") {
        result += "\n";
      }
    }
    node = walker.nextNode();
  }

  return result.replace(/\n+$/, ""); // Remove trailing newlines
};

// Custom contentEditable component
const VariableEditor = ({
  value,
  onChange,
  placeholder,
  disabled,
  className,
  minHeight,
  id,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  disabled: boolean;
  className: string;
  minHeight: string;
  id: string;
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (editorRef.current && !isFocused) {
      // Only update content when not focused to avoid cursor issues
      const currentText = convertToPlainText(editorRef.current);
      if (currentText !== value) {
        editorRef.current.innerHTML = "";
        const content = parseContentWithBadges(value);
        content.forEach((part) => {
          if (typeof part === "string") {
            const textNode = document.createTextNode(part);
            editorRef.current?.appendChild(textNode);
          } else {
            const span = document.createElement("span");
            span.className =
              "inline-flex items-center px-2 py-0.5 mx-0.5 text-xs font-medium bg-primary/10 text-primary border border-primary/20 rounded-sm variable-badge";
            span.textContent = part.props.displayTitle;
            span.setAttribute("data-variable", part.props.variableName);
            span.setAttribute(
              "title",
              `Variable: {${part.props.variableName}}`
            );
            span.contentEditable = "false";
            editorRef.current?.appendChild(span);
          }
        });
      }
    }
  }, [value, isFocused]);

  const handleInput = () => {
    if (editorRef.current) {
      const plainText = convertToPlainText(editorRef.current);
      onChange(plainText);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle common editing behaviors
    if (e.key === "Enter") {
      e.preventDefault();
      document.execCommand("insertLineBreak");
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedText = e.dataTransfer.getData("text/plain");
    if (droppedText && editorRef.current) {
      // Focus the editor and insert the text at the cursor position
      editorRef.current.focus();
      document.execCommand("insertText", false, droppedText);
    }
  };

  const handleCopy = (e: React.ClipboardEvent) => {
    e.preventDefault();
    if (editorRef.current) {
      // Convert the current content to plain text with {variables}
      const plainText = convertToPlainText(editorRef.current);
      e.clipboardData.setData("text/plain", plainText);
    }
  };

  return (
    <div className="relative">
      <div
        ref={editorRef}
        contentEditable={!disabled}
        onInput={handleInput}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onCopy={handleCopy}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`${className} ${minHeight} outline-none`}
        style={{ whiteSpace: "pre-wrap" }}
        id={id}
        role="textbox"
        aria-multiline="true"
        suppressContentEditableWarning={true}
      />
      {!value && !isFocused && (
        <div className="absolute top-4 left-4 text-muted-foreground/60 pointer-events-none text-sm font-mono">
          {placeholder}
        </div>
      )}
    </div>
  );
};

export default function PromptEditor({
  defaultPrompts,
  promptsLoading,
  promptsError,
  onSubmit,
  isSubmitting,
  submitError,
  canSubmit,
}: PromptEditorProps) {
  const [systemPrompt, setSystemPrompt] = useState<string>("");
  const [userPrompt, setUserPrompt] = useState<string>("");

  // Load default prompts when they become available
  useEffect(() => {
    if (defaultPrompts && systemPrompt === "" && userPrompt === "") {
      setSystemPrompt(defaultPrompts.system_prompt);
      setUserPrompt(defaultPrompts.user_prompt_template);
    }
  }, [defaultPrompts, systemPrompt, userPrompt]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit || isSubmitting) return;
    onSubmit(systemPrompt, userPrompt);
  };

  const handleReset = () => {
    if (defaultPrompts) {
      setSystemPrompt(defaultPrompts.system_prompt);
      setUserPrompt(defaultPrompts.user_prompt_template);
    }
  };

  const isFormValid =
    systemPrompt.trim() !== "" && userPrompt.trim() !== "" && canSubmit;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">
          Evaluation Prompts
        </h2>
        {defaultPrompts && (
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground border border-border rounded-sm hover:bg-muted/30 transition-colors duration-200"
            disabled={isSubmitting}
          >
            <RotateCcw className="h-3 w-3" />
            Reset to Defaults
          </button>
        )}
      </div>

      {promptsLoading && (
        <div className="bg-muted/20 border border-muted/30 rounded-sm p-4 flex items-center gap-3">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Loading default prompts...
          </span>
        </div>
      )}

      {promptsError && (
        <div className="bg-warning/10 border border-warning/20 rounded-sm p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-warning mb-1">
              Unable to Load Default Prompts
            </h3>
            <p className="text-sm text-warning/80">
              You can still enter custom prompts manually.
            </p>
          </div>
        </div>
      )}

      {/* Variable Palette */}
      <VariablePalette />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* System Prompt */}
        <div className="space-y-3">
          <label
            htmlFor="system-prompt"
            className="block text-base font-medium text-foreground"
          >
            System Prompt
          </label>
          <p className="text-sm text-muted-foreground">
            Define the AI evaluator's role and evaluation framework. Use{" "}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">
              {"{variable}"}
            </code>{" "}
            for dynamic content.
          </p>
          <VariableEditor
            id="system-prompt"
            value={systemPrompt}
            onChange={setSystemPrompt}
            placeholder="You are a comprehensive DAO governance evaluator with expertise across multiple domains..."
            disabled={isSubmitting}
            className="w-full p-4 text-sm bg-background border border-border rounded-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 resize-y font-mono"
            minHeight="min-h-[200px]"
          />
          <div className="flex justify-between items-center text-xs text-muted-foreground">
            <span>{systemPrompt.length} characters</span>
          </div>
        </div>

        {/* User Prompt */}
        <div className="space-y-3">
          <label
            htmlFor="user-prompt"
            className="block text-base font-medium text-foreground"
          >
            User Prompt Template
          </label>
          <p className="text-sm text-muted-foreground">
            Define the specific evaluation instructions and data structure. Use{" "}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">
              {"{variable}"}
            </code>{" "}
            for dynamic content.
          </p>
          <VariableEditor
            id="user-prompt"
            value={userPrompt}
            onChange={setUserPrompt}
            placeholder="Please conduct a comprehensive evaluation of the following proposal..."
            disabled={isSubmitting}
            className="w-full p-4 text-sm bg-background border border-border rounded-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 resize-y font-mono"
            minHeight="min-h-[250px]"
          />
          <div className="flex justify-between items-center text-xs text-muted-foreground">
            <span>{userPrompt.length} characters</span>
          </div>
        </div>

        {/* Submission Error */}
        {submitError && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-sm p-4 flex items-start gap-3">
            <X className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-destructive mb-1">
                Evaluation Failed
              </h3>
              <p className="text-sm text-destructive/80">{submitError}</p>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-center pt-4">
          <button
            type="submit"
            disabled={!isFormValid || isSubmitting}
            className="inline-flex items-center gap-2 px-6 py-3 text-base font-medium text-white bg-primary rounded-sm hover:bg-primary/90 focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary min-w-[200px] justify-center"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-sm h-4 w-4 border-2 border-white border-t-transparent" />
                Evaluating...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Evaluate Proposal
              </>
            )}
          </button>
        </div>

        {/* Form Validation Help Text */}
        {!isFormValid && !isSubmitting && (
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              {!canSubmit
                ? "Please select a proposal first"
                : !systemPrompt.trim()
                  ? "Please enter a system prompt"
                  : !userPrompt.trim()
                    ? "Please enter a user prompt"
                    : "Form ready to submit"}
            </p>
          </div>
        )}
      </form>
    </div>
  );
}
