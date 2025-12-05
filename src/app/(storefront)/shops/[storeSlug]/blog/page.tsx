import { query } from '@/lib/db';
import { getStoreIdBySlug } from '@/lib/utils/store';
import { notFound } from 'next/navigation';
import Link from 'next/link';

async function getBlogPosts(storeId: number) {
  const posts = await query<{
    id: number;
    title: string;
    handle: string;
    excerpt: string | null;
    published_at: Date | null;
  }>(
    `SELECT id, title, handle, excerpt, published_at 
     FROM blog_posts 
     WHERE store_id = $1 AND published_at IS NOT NULL 
     ORDER BY published_at DESC 
     LIMIT 20`,
    [storeId]
  );

  return posts;
}

export default async function BlogPage({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}) {
  const { storeSlug } = await params;
  const storeId = await getStoreIdBySlug(storeSlug);
  
  if (!storeId) {
    notFound();
  }

  const posts = await getBlogPosts(storeId);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12" dir="rtl">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">בלוג</h1>
      
      {posts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">אין פוסטים להצגה כרגע</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/shops/${storeSlug}/blog-post/${post.handle}`}
              className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow p-6"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-2">{post.title}</h2>
              {post.excerpt && (
                <p className="text-gray-600 mb-4">{post.excerpt}</p>
              )}
              {post.published_at && (
                <p className="text-sm text-gray-500">
                  {new Date(post.published_at).toLocaleDateString('he-IL')}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

