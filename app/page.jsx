import ClientHomePage from './ClientHomePage';
import { fetchAllData } from '@/lib/data';

// Note: Next.js will cache this route if possible.
// Use 'force-dynamic' if prompts update frequently and you want fresh data on each request.
export const dynamic = 'force-dynamic';

export default async function Page() {
  const { prompts, categories } = await fetchAllData();
  
  return <ClientHomePage initialPrompts={prompts} initialCategories={categories} />;
}
