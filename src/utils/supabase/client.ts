import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl =
  ((globalThis as any).process?.env?.NEXT_PUBLIC_SUPABASE_URL as string | undefined) ||
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://eyrbpysnxjwxklzmylff.supabase.co";

const supabaseKey =
  ((globalThis as any).process?.env?.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY as string | undefined) ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  "sb_publishable_ATtycksolP9Q6qNuT6Qzcw_hon74iVM";

export const createClient = () =>
  createBrowserClient(
    supabaseUrl,
    supabaseKey,
  );

export const supabase = createClient();

