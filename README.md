# InnerMe Chat UI Preview

Temporary, test-only browser preview of the Swayphics InnerMe chat interface from PR #96.

- Connected only to the isolated Supabase project `Swayphics InnerMe Test` for admin sign-in and read-only setup.
- Hosted on GitHub Pages for QA only; not for production use.
- Chat UI submissions are intercepted in the browser and return one synthetic local Server-Sent Events (SSE) response per page load. The mock is designed to exercise the real frontend renderer without contacting Gemini or any model provider.
- Mock content covers Markdown headings, lists, inline/fenced code, tables, a safe external link, and HTML/script escaping.
- Other non-read-only REST/function writes are blocked. Push notifications are disabled. Preview auth tokens use per-tab session storage. Production Supabase URL/keys are absent from the preview configuration.
