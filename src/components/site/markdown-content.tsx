import React from "react";
import ReactMarkdown from "react-markdown";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";

interface MarkdownContentProps {
  content: string;
  className?: string;
}

export function MarkdownContent({ content, className = "" }: MarkdownContentProps) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  let allowedOrigin = "";
  try {
    if (supabaseUrl) allowedOrigin = new URL(supabaseUrl).origin;
  } catch {
    allowedOrigin = "";
  }

  return (
    <div className={`prose prose-invert max-w-none text-bone/90 ${className}`}>
      <ReactMarkdown
        rehypePlugins={[[rehypeSanitize, defaultSchema]]}

        components={{
          img: ({ src, alt }) => {
            if (!src || typeof src !== "string") return null;
            // Validate image URL: only allow images from the project's jf-media bucket
            try {
              const url = new URL(src, allowedOrigin || "https://dummy.local");
              const isAllowed =
                allowedOrigin &&
                url.origin === allowedOrigin &&
                url.pathname.startsWith("/storage/v1/object/public/jf-media/");
              if (!isAllowed) {
                return null;
              }
            } catch {
              return null;
            }

            return (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={src}
                alt={alt || "Journal article illustration"}
                className="my-6 rounded-2xl border border-white/10"
                loading="lazy"
              />
            );
          },
          a: ({ href, children }) => {
            const isExternal = typeof href === "string" && href.startsWith("http");
            return (
              <a
                href={href}
                target={isExternal ? "_blank" : undefined}
                rel={isExternal ? "noreferrer noopener" : undefined}
                className="text-gold underline underline-offset-4 hover:text-gold/80"
              >
                {children}
              </a>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
