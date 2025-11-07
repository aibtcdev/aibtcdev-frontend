"use client";

import type React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Info } from "lucide-react";
import { DAOTabLayout } from "@/components/aidaos/DAOTabLayout";

type MarkdownComponentProps = {
  children?: React.ReactNode;
  href?: string;
  [key: string]: unknown;
};

interface MissionContentProps {
  description?: string;
}

export function MissionContent({ description }: MissionContentProps) {
  const markdownComponents = {
    h1: ({ children, ...props }: MarkdownComponentProps) => (
      <h1
        className="text-2xl font-bold text-foreground mb-4 mt-6 first:mt-0"
        {...props}
      >
        {children}
      </h1>
    ),
    h2: ({ children, ...props }: MarkdownComponentProps) => (
      <h2
        className="text-xl font-bold text-foreground mb-3 mt-6 first:mt-0"
        {...props}
      >
        {children}
      </h2>
    ),
    h3: ({ children, ...props }: MarkdownComponentProps) => (
      <h3
        className="text-lg font-semibold text-foreground mb-2 mt-4 first:mt-0"
        {...props}
      >
        {children}
      </h3>
    ),
    p: ({ children, ...props }: MarkdownComponentProps) => (
      <p
        className="text-muted-foreground leading-relaxed mb-4 last:mb-0 text-base"
        {...props}
      >
        {children}
      </p>
    ),
    ul: ({ children, ...props }: MarkdownComponentProps) => (
      <ul
        className="list-disc list-inside text-muted-foreground mb-4 space-y-1 ml-4"
        {...props}
      >
        {children}
      </ul>
    ),
    ol: ({ children, ...props }: MarkdownComponentProps) => (
      <ol
        className="list-decimal list-inside text-muted-foreground mb-4 space-y-1 ml-4"
        {...props}
      >
        {children}
      </ol>
    ),
    li: ({ children, ...props }: MarkdownComponentProps) => (
      <li className="text-muted-foreground leading-relaxed" {...props}>
        {children}
      </li>
    ),
    strong: ({ children, ...props }: MarkdownComponentProps) => (
      <strong className="font-semibold text-foreground" {...props}>
        {children}
      </strong>
    ),
    em: ({ children, ...props }: MarkdownComponentProps) => (
      <em className="italic text-muted-foreground" {...props}>
        {children}
      </em>
    ),
    a: ({ href, children, ...props }: MarkdownComponentProps) => (
      <a
        href={href}
        className="text-primary hover:text-primary/80 underline font-medium transition-colors duration-300"
        target="_blank"
        rel="noopener noreferrer"
        {...props}
      >
        {children}
      </a>
    ),
    blockquote: ({ children, ...props }: MarkdownComponentProps) => (
      <blockquote
        className="border-l-4 border-primary pl-4 italic text-muted-foreground my-4 bg-muted/20 py-3 rounded-r-lg"
        {...props}
      >
        {children}
      </blockquote>
    ),
    code: ({ children, ...props }: MarkdownComponentProps) => (
      <code
        className="bg-muted/50 text-foreground px-2 py-1 rounded-lg text-sm font-mono border border-border/30"
        {...props}
      >
        {children}
      </code>
    ),
    pre: ({ children, ...props }: MarkdownComponentProps) => (
      <pre
        className="bg-muted/50 text-foreground p-4 rounded-xl overflow-x-auto mb-4 border border-border/30"
        {...props}
      >
        {children}
      </pre>
    ),
  };

  return (
    <DAOTabLayout
      // title="Charter"
      // description="Learn about our vision and goals"
      // icon={Info}
      isEmpty={!description}
      emptyTitle="No Mission Statement"
      emptyDescription="This DAO hasn't provided a mission statement yet. Check back later for updates."
      emptyIcon={Info}
    >
      {description && (
        <div className="prose prose-invert prose-zinc max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            className="text-muted-foreground leading-relaxed"
            components={
              markdownComponents as Record<
                string,
                React.ComponentType<MarkdownComponentProps>
              >
            }
          >
            {description.replace(/\\n/g, "\n")}
          </ReactMarkdown>
        </div>
      )}
    </DAOTabLayout>
  );
}
