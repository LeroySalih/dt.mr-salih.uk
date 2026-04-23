"use client"
import * as React from "react"

export const TINTS = ["mint", "peach", "sky", "lilac", "lemon", "coral", "teal"] as const
export type Tint = (typeof TINTS)[number]

export function tintFor(index: number): Tint {
  return TINTS[index % TINTS.length]
}

export const ICON_FOR: Record<string, string> = {
  "1.1": "leaf", "1.2": "star", "1.3": "bulb", "1.4": "book",
  "1.5": "bulb", "1.6": "tools", "1.7": "gear", "1.8": "book",
  "1.9": "star", "1.10": "leaf", "1.11": "tools", "1.12": "wave",
  "1.13": "gear", "1.14": "book", "1.15": "star", "1.16": "gear", "1.17": "chip",
  "5.1": "chip", "5.2": "wave", "5.3": "gear", "5.4": "chip",
  "5.5": "wave", "5.6": "tools", "5.7": "chip", "5.8": "tools",
}

export const Icons: Record<string, React.ReactNode> = {
  bulb: (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M24 6c-7 0-12 5-12 12 0 5 3 8 5 11v4h14v-4c2-3 5-6 5-11 0-7-5-12-12-12Z" fill="#fff" stroke="#2A2344" strokeWidth="2" strokeLinejoin="round"/>
      <path d="M18 38h12M19 42h10" stroke="#2A2344" strokeWidth="2" strokeLinecap="round"/>
      <path d="M22 20l2 4 2-4" stroke="#2A2344" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  gear: (
    <svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <circle cx="24" cy="24" r="8" fill="#fff" stroke="#2A2344" strokeWidth="2"/>
      <circle cx="24" cy="24" r="3" fill="#2A2344"/>
      <g stroke="#2A2344" strokeWidth="2" strokeLinecap="round">
        <path d="M24 4v6M24 38v6M4 24h6M38 24h6M10 10l4 4M34 34l4 4M38 10l-4 4M14 34l-4 4"/>
      </g>
    </svg>
  ),
  chip: (
    <svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <rect x="12" y="12" width="24" height="24" rx="3" fill="#fff" stroke="#2A2344" strokeWidth="2"/>
      <rect x="18" y="18" width="12" height="12" rx="1" fill="#2A2344"/>
      <g stroke="#2A2344" strokeWidth="2" strokeLinecap="round">
        <path d="M18 6v6M24 6v6M30 6v6M18 36v6M24 36v6M30 36v6"/>
        <path d="M6 18h6M6 24h6M6 30h6M36 18h6M36 24h6M36 30h6"/>
      </g>
    </svg>
  ),
  tools: (
    <svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path d="M30 8a8 8 0 0 0-8 10L8 32l4 4 14-14a8 8 0 0 0 10-8l-4 4-4-1-1-4 4-4Z" fill="#fff" stroke="#2A2344" strokeWidth="2" strokeLinejoin="round"/>
    </svg>
  ),
  book: (
    <svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path d="M8 10h14c2 0 4 2 4 4v26c0-2-2-4-4-4H8V10Z" fill="#fff" stroke="#2A2344" strokeWidth="2" strokeLinejoin="round"/>
      <path d="M40 10H26c-2 0-4 2-4 4v26c0-2 2-4 4-4h14V10Z" fill="#fff" stroke="#2A2344" strokeWidth="2" strokeLinejoin="round"/>
    </svg>
  ),
  leaf: (
    <svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path d="M38 8c-14 0-26 8-26 22 0 6 4 10 10 10 12 0 20-14 16-32ZM18 38l12-14" fill="#fff" stroke="#2A2344" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"/>
    </svg>
  ),
  wave: (
    <svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path d="M6 24c4-8 8-8 12 0s8 8 12 0 8-8 12 0" stroke="#2A2344" strokeWidth="2" strokeLinecap="round" fill="none"/>
      <circle cx="24" cy="24" r="18" stroke="#2A2344" strokeWidth="2" fill="none"/>
    </svg>
  ),
  star: (
    <svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path d="m24 6 5 12 13 1-10 9 3 13-11-7-11 7 3-13-10-9 13-1 5-12Z" fill="#fff" stroke="#2A2344" strokeWidth="2" strokeLinejoin="round"/>
    </svg>
  ),
}

export function iconForCode(code: string): string {
  // Icon map keys are 2-level codes (1.1, 5.4). For 3-level codes (1.1.1),
  // fall back to the 2-level prefix.
  if (ICON_FOR[code]) return ICON_FOR[code]
  const parts = code.split(".")
  if (parts.length >= 2) {
    const twoLevel = `${parts[0]}.${parts[1]}`
    if (ICON_FOR[twoLevel]) return ICON_FOR[twoLevel]
  }
  return "star"
}
