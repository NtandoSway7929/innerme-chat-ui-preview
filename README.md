# InnerMe Chat UI Preview

Temporary, test-only browser preview of the Swayphics InnerMe chat interface.

- Connected to the isolated Supabase project: `Swayphics InnerMe Test`.
- Not for production use.
- Browser-side preview guard allows only authenticated `assistant_chat` requests with streaming enabled and blocks mutating REST/function requests.
- Preview-specific auth tokens use session storage rather than shared local storage.
