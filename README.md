# InnerMe Chat UI Preview

Temporary, test-only browser preview of the Swayphics InnerMe chat interface from PR #96.

- Connected to the isolated Supabase project `Swayphics InnerMe Test` only.
- Not for production use; no custom domain is configured.
- Chat sending/model requests are disabled for UI QA. A previous separately authorized test already verified one streaming backend response.
- All non-auth writes are blocked by the browser-side preview guard. The preview uses session storage for per-tab auth tokens and carries no production API credentials.
