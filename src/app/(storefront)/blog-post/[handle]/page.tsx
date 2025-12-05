import { queryOne } from '@/lib/db';
import { notFound } from 'next/navigation';

async function getBlogPost(handle: string, storeId: number) {
  const post = await queryOne<{
    id: number;
    title: string;
    handle: string;
    body_html: string | null;
    excerpt: string | null;
    published_at: Date | null;
  }>(
    'SELECT id, title, handle, body_html, excerpt, published_at FROM blog_posts WHERE store_id = $1 AND handle = $2',
    [storeId, handle]
  );

  if (!post || !post.published_at) {
    return null;
  }

  return post;
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const storeId = 1; // TODO: Get from domain/subdomain

  const post = await getBlogPost(handle, storeId);

  if (!post) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <article>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">{post.title}</h1>
        {post.excerpt && (
          <p className="text-xl text-gray-600 mb-8">{post.excerpt}</p>
        )}
        {post.body_html && (
          <div
            className="prose prose-lg max-w-none text-gray-700"
            dangerouslySetInnerHTML={{ __html: post.body_html }}
          />
        )}
      </article>
    </div>
  );
}

