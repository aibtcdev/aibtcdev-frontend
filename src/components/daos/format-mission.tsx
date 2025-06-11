interface FormatMissionProps {
  content: string;
  inline?: boolean; // When true, renders a compact version for tables/lists
}

/**
 * Component for formatting and displaying DAO mission content
 * @param content - The mission content to format and display
 * @param inline - Whether to render in compact inline mode for tables/lists
 * @returns Formatted mission content as JSX
 */
export function FormatMission({ content, inline = false }: FormatMissionProps) {
  // First, convert the literal \n characters to actual line breaks
  const processedContent = content.replace(/\\n/g, "\n");

  // For inline mode, just return a simple formatted version
  if (inline) {
    // Extract just the mission text (usually after ## Mission)
    // Using a regex without the /s flag for compatibility
    const missionMatch = processedContent.match(
      /## Mission\s*\n\s*\n([\s\S]*?)(?=\n\n|$)/
    );
    if (missionMatch && missionMatch[1]) {
      return <span>{missionMatch[1].trim()}</span>;
    }

    // If no mission section found, return the first paragraph or the whole content
    const firstParagraph = processedContent
      .split("\n\n")[0]
      .replace(/^# .*\n/, "")
      .trim();
    return <span>{firstParagraph || content}</span>;
  }

  // FULL FORMATTING MODE (non-inline)
  // Split the content by sections (# headings)
  const sections = processedContent.split(/(?=^# )/gm).filter(Boolean);

  return (
    <div className="max-w-3xl mx-auto p-6  rounded-lg shadow-md">
      {sections.map((section, sectionIndex) => {
        // Process each section
        const lines = section.split("\n");
        const mainTitle = lines[0].replace(/^# /, "");

        // Remove the main title from lines
        const remainingLines = lines.slice(1);

        // Group content by subsections (## headings)
        const subsections: { title: string; content: string[] }[] = [];
        let currentSubsection: { title: string; content: string[] } | null =
          null;

        remainingLines.forEach((line) => {
          if (line.startsWith("## ")) {
            if (currentSubsection) {
              subsections.push(currentSubsection);
            }
            currentSubsection = {
              title: line.replace(/^## /, ""),
              content: [],
            };
          } else if (currentSubsection && line.trim() !== "") {
            currentSubsection.content.push(line);
          }
        });

        if (currentSubsection) {
          subsections.push(currentSubsection);
        }

        return (
          <div key={sectionIndex} className="mb-6">
            <h1 className="text-2xl font-bold mb-4">{mainTitle}</h1>

            {subsections.map((subsection, subIndex) => {
              // Process the content of each subsection
              const paragraphs: string[] = [];
              const listItems: { number: string; content: string }[] = [];

              let currentParagraph = "";

              subsection.content.forEach((line) => {
                // Check if it's a list item
                const listMatch = line.match(/^(\d+)\.\s+(.*)/);

                if (listMatch) {
                  // If we were building a paragraph, save it
                  if (currentParagraph) {
                    paragraphs.push(currentParagraph);
                    currentParagraph = "";
                  }

                  listItems.push({
                    number: listMatch[1],
                    content: listMatch[2],
                  });
                } else if (line.trim() !== "") {
                  // It's part of a paragraph
                  if (currentParagraph) {
                    currentParagraph += " " + line;
                  } else {
                    currentParagraph = line;
                  }
                } else if (currentParagraph) {
                  // Empty line, end of paragraph
                  paragraphs.push(currentParagraph);
                  currentParagraph = "";
                }
              });

              // Don't forget the last paragraph
              if (currentParagraph) {
                paragraphs.push(currentParagraph);
              }

              return (
                <div key={subIndex} className="mb-4">
                  <h2 className="text-xl font-bold mb-2">{subsection.title}</h2>

                  {paragraphs.map((para, pIndex) => (
                    <p
                      key={pIndex}
                      className="mb-3 text-gray-700 leading-relaxed"
                    >
                      {para}
                    </p>
                  ))}

                  {listItems.length > 0 && (
                    <ol className="list-decimal pl-6 mt-3 space-y-2">
                      {listItems.map((item, lIndex) => {
                        // Split the content into title and description if it contains a colon
                        const parts = item.content.split(": ");
                        const title = parts[0];
                        const description =
                          parts.length > 1 ? parts.slice(1).join(": ") : null;

                        return (
                          <li key={lIndex} className="text-gray-700">
                            <span className="font-semibold">{title}</span>
                            {description && ": "}
                            {description}
                          </li>
                        );
                      })}
                    </ol>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
