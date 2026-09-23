import type { BlogPost } from '@/lib/blog';
import { messages } from '@/messages';
import { BlogCard } from './blog-card';

export function BlogGrid({ posts }: { posts: BlogPost[] }) {
  if (posts.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        {messages.blog.noPosts}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {posts.map((post) => (
        <BlogCard key={post.slug} post={post} />
      ))}
    </div>
  );
}
