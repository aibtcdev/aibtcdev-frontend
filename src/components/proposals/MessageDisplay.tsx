"use client";

interface MessageDisplayProps {
  message?: string;
}

const MessageDisplay = ({ message }: MessageDisplayProps) => {
  // Handle empty message
  if (!message) {
    return (
      <div className="text-xs text-muted-foreground">No message available</div>
    );
  }

  // Parse metadata from message
  const metadataRegex = /--- Metadata ---\s*\n([\s\S]*?)(?=\n\n|\n$|$)/;
  const metadataMatch = message.match(metadataRegex);

  let cleanMessage = message;
  let tags: string[] = [];

  if (metadataMatch) {
    // Remove metadata section from message
    cleanMessage = message.replace(metadataRegex, "").trim();

    // Extract tags from metadata
    const metadataContent = metadataMatch[1];
    const tagsMatch = metadataContent.match(/Tags:\s*(.+)/);
    if (tagsMatch) {
      tags = tagsMatch[1]
        .split("|")
        .map((tag) => tag.trim())
        .filter(Boolean);
    }
  }

  return (
    <div className="space-y-3">
      {/* Main message content */}
      <div className="p-2 rounded text-xs break-words whitespace-pre-wrap">
        {cleanMessage}
      </div>

      {/* Tags as hashtags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag, index) => (
            <span
              key={index}
              className="text-xs text-primary/80 bg-primary/10 px-2 py-1 rounded-sm"
            >
              #{tag.replace(/\s+/g, "")}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default MessageDisplay;
