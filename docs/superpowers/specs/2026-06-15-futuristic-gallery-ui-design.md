# Futuristic Gallery UI Design

## Goal

Refresh the wedding photo gallery from a basic utility layout into a futuristic, interactive experience while preserving the existing guest upload, public gallery, lightbox, and admin actions.

## Approved Direction

Use an Aurora Glass interface as the primary experience, with a Memory Constellation alternate gallery view. The design should feel premium, modern, and wedding-appropriate rather than purely cyberpunk.

## Experience

- The page uses a dark cinematic background with aurora color fields, subtle animated star/noise texture, and glass surfaces.
- The upload form becomes a glowing command panel with clear mobile-first controls.
- Gallery cards gain dimensional hover, luminous borders, and stronger metadata treatment.
- Guests can switch between Gallery and Constellation views.
- The Constellation view lays photos out as memory nodes connected by soft lines. It remains usable on mobile and opens the existing lightbox.
- Empty/loading states should feel intentional and immersive.
- Admin controls stay available but visually secondary.

## Constraints

- Do not change Cloudflare Worker API behavior.
- Do not change upload validation.
- Keep no-login guest uploads.
- Keep individual downloads.
- Keep admin hide/delete actions.
- Keep text legible and controls accessible on mobile.
- Avoid decorative UI that blocks scanning or upload flow.

## Verification

- Existing tests must pass.
- Add a focused unit test for view-mode behavior.
- Production build must pass.
- Verify locally in a browser at desktop and mobile widths.
