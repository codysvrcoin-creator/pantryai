"use client";

import { useEffect } from "react";
import { ExternalLink, Youtube, Link as LinkIcon } from "lucide-react";
import { detectPlatform, getYouTubeEmbedId } from "@/lib/recipeLink";

declare global {
  interface Window {
    instgrm?: { Embeds: { process: () => void } };
  }
}

function loadScriptOnce(src: string, id: string) {
  if (document.getElementById(id)) return;
  const script = document.createElement("script");
  script.id = id;
  script.src = src;
  script.async = true;
  document.body.appendChild(script);
}

/**
 * Renders a live preview of a pasted recipe link — an official public embed
 * for Instagram Reels / TikTok / YouTube (no API key needed, same mechanism
 * any website uses to embed a public post), or a simple link card for
 * anything else.
 */
export default function RecipeLinkEmbed({ url }: { url: string }) {
  const platform = detectPlatform(url);

  useEffect(() => {
    if (platform === "instagram") {
      loadScriptOnce("https://www.instagram.com/embed.js", "ig-embed-script");
      const t = setTimeout(() => window.instgrm?.Embeds.process(), 300);
      return () => clearTimeout(t);
    }
    if (platform === "tiktok") {
      // TikTok's embed.js only scans the DOM once on load, so re-inject a
      // fresh copy whenever a new blockquote needs processing.
      document.getElementById("tt-embed-script")?.remove();
      loadScriptOnce("https://www.tiktok.com/embed.js", "tt-embed-script");
    }
  }, [platform, url]);

  if (platform === "instagram") {
    return (
      <div className="overflow-hidden rounded-2xl">
        <blockquote
          className="instagram-media"
          data-instgrm-permalink={url}
          data-instgrm-version="14"
          style={{ margin: 0, width: "100%" }}
        >
          <a href={url} target="_blank" rel="noreferrer">
            View this recipe on Instagram
          </a>
        </blockquote>
      </div>
    );
  }

  if (platform === "tiktok") {
    return (
      <div className="overflow-hidden rounded-2xl">
        <blockquote className="tiktok-embed" cite={url} style={{ margin: 0, maxWidth: "100%" }}>
          <a href={url} target="_blank" rel="noreferrer">
            View this recipe on TikTok
          </a>
        </blockquote>
      </div>
    );
  }

  if (platform === "youtube") {
    const videoId = getYouTubeEmbedId(url);
    if (videoId) {
      return (
        <div
          className="overflow-hidden rounded-2xl bg-black"
          style={{ aspectRatio: "9 / 16", maxHeight: 480 }}
        >
          <iframe
            src={`https://www.youtube.com/embed/${videoId}`}
            title="Recipe video"
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      );
    }
  }

  let hostname = url;
  try {
    hostname = new URL(url).hostname.replace(/^www\./, "");
  } catch {
    // Not a valid URL — fall through and just show it as-is.
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-3 rounded-2xl border border-border bg-muted p-3.5"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-card">
        {platform === "youtube" ? (
          <Youtube size={18} className="text-muted-foreground" />
        ) : (
          <LinkIcon size={18} className="text-muted-foreground" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{hostname}</p>
        <p className="text-xs text-muted-foreground">Open the original recipe</p>
      </div>
      <ExternalLink size={14} className="shrink-0 text-muted-foreground" />
    </a>
  );
}
