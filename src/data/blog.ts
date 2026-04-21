import type { ArticleDoc, BlogPost } from "./types";
import articlesJson from "./json/articles.json";

export const articles = articlesJson as ArticleDoc[];

export function getArticleBySlug(slug: string): ArticleDoc | undefined {
  return articles.find((a) => a.slug === slug);
}

export function getArticlesByCategory(category: string): ArticleDoc[] {
  return articles.filter((a) => a.category === category);
}

export const blogPosts: BlogPost[] = articles.map((a): BlogPost => ({
  slug: a.slug,
  title: a.title,
  excerpt: a.excerpt,
  category: a.category,
  author: a.author,
  readMins: a.readMins,
  publishedAt: a.publishedAt,
  coverImage: a.coverImage,
  tags: a.tags,
  trending: a.trending,
  featured: a.featured,
  videoUrl: a.videoUrl,
}));

export const trendingTopics = [
  ...new Set(articles.flatMap((a) => a.tags).filter(Boolean)),
].slice(0, 14) as string[];
