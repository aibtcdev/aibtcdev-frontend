import { useMemo } from "react";
import { AlertTriangle } from "lucide-react";

export interface UnicodeIssue {
  char: string;
  code: number;
  position: number;
  type: "control" | "non-ascii" | "suspicious";
  description: string;
}

export function useUnicodeValidation(text: string) {
  const issues = useMemo((): UnicodeIssue[] => {
    const found: UnicodeIssue[] = [];
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const code = char.charCodeAt(0);
      // Control characters (0-31, except tab, newline, carriage return)
      if (code >= 0 && code <= 31 && ![9, 10, 13].includes(code)) {
        found.push({
          char,
          code,
          position: i,
          type: "control",
          description: `Invisible control character U+${code.toString(16).padStart(4, "0").toUpperCase()}`,
        });
      }
      // Non-ASCII characters (128+)
      else if (code > 127) {
        found.push({
          char,
          code,
          position: i,
          type: "non-ascii",
          description: `Non-ASCII character U+${code.toString(16).padStart(4, "0").toUpperCase()}`,
        });
      }
      // Zero-width and other suspicious characters
      else if ([0x200b, 0x200c, 0x200d, 0x2060, 0xfeff].includes(code)) {
        found.push({
          char,
          code,
          position: i,
          type: "suspicious",
          description: `Zero-width or suspicious character U+${code.toString(16).padStart(4, "0").toUpperCase()}`,
        });
      }
    }
    return found;
  }, [text]);

  const hasControlChars = issues.some((issue) => issue.type === "control");
  const hasNonAscii = issues.some((issue) => issue.type === "non-ascii");
  const hasSuspicious = issues.some((issue) => issue.type === "suspicious");
  const hasAnyIssues = issues.length > 0;

  const cleanText = text.replace(/[\x00-\x1F\x7F-\uFFFF]/g, "");
  const asciiLength = cleanText.length;

  return {
    issues,
    hasControlChars,
    hasNonAscii,
    hasSuspicious,
    hasAnyIssues,
    cleanText,
    asciiLength,
    originalLength: text.length,
    nonAsciiCount: text.length - asciiLength,
  };
}

export function UnicodeIssueWarning({ issues }: { issues: UnicodeIssue[] }) {
  if (issues.length === 0) return null;

  const controlCount = issues.filter((i) => i.type === "control").length;
  const nonAsciiCount = issues.filter((i) => i.type === "non-ascii").length;
  const suspiciousCount = issues.filter((i) => i.type === "suspicious").length;

  return (
    <div className="mt-1 p-3 bg-primary/10 border border-primary/20 rounded-sm">
      <div className="flex items-start gap-1">
        <AlertTriangle className="w-4 h-4 text-primary-600 mt-0.5 flex-shrink-0" />
        <div className="text-sm flex-1 text-primary-700">
          <p className="font-medium text-primary-700 mb-1">
            Input contains {issues.length} problematic character
            {issues.length !== 1 ? "s" : ""}:
          </p>

          <div className="space-y-4">
            {controlCount > 0 && (
              <div>
                <p className="text-primary-700 font-medium mb-1">
                  • {controlCount} invisible control character
                  {controlCount !== 1 ? "s" : ""} (security risk):
                </p>
                <div className="ml-4 space-y-1">
                  {issues
                    .filter((i) => i.type === "control")
                    .map((issue, idx) => (
                      <div
                        key={idx}
                        className="text-sm font-mono bg-primary/20 p-2 rounded border border-primary/30 text-primary-800"
                      >
                        <span className="text-primary-800">
                          Position {issue.position}: "
                          {issue.char === "\t"
                            ? "\\t"
                            : issue.char === "\n"
                              ? "\\n"
                              : issue.char === "\r"
                                ? "\\r"
                                : `\\x${issue.code.toString(16).padStart(2, "0")}`}
                          "
                        </span>
                        <span className="text-primary-600 ml-2">
                          ({issue.description})
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {nonAsciiCount > 0 && (
              <div>
                <p className="text-primary-700 font-medium mb-1">
                  • {nonAsciiCount} non-ASCII character
                  {nonAsciiCount !== 1 ? "s" : ""} (will be rejected):
                </p>
                <div className="ml-4 space-y-1">
                  {issues
                    .filter((i) => i.type === "non-ascii")
                    .map((issue, idx) => (
                      <div
                        key={idx}
                        className="text-sm font-mono bg-primary/20 p-2 rounded border border-primary/30 text-primary-800"
                      >
                        <span className="text-primary-800">
                          Position {issue.position}: "{issue.char}"
                        </span>
                        <span className="text-primary-600 ml-2">
                          ({issue.description})
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {suspiciousCount > 0 && (
              <div>
                <p className="text-primary-700 font-medium mb-1">
                  • {suspiciousCount} suspicious character
                  {suspiciousCount !== 1 ? "s" : ""} (potential issue):
                </p>
                <div className="ml-4 space-y-1">
                  {issues
                    .filter((i) => i.type === "suspicious")
                    .map((issue, idx) => (
                      <div
                        key={idx}
                        className="text-sm font-mono bg-primary/20 p-2 rounded border border-primary/30 text-primary-800"
                      >
                        <span className="text-primary-800">
                          Position {issue.position}: "{issue.char}"
                        </span>
                        <span className="text-primary-600 ml-2">
                          ({issue.description})
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
