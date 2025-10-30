// apps/web/src/lib/queryClient.ts
'use client';
import { QueryClient } from '@tanstack/react-query';


let client: QueryClient | null = null;
export function getQueryClient() {
if (!client) {
client = new QueryClient({
defaultOptions: {
queries: { retry: 1, refetchOnWindowFocus: false },
mutations: { retry: 1 },
},
});
}
return client;
}