import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticlePremium } from "@/components/blog/article-premium";
import { JsonLdScript, articleJsonLd } from "@/components/seo/json-ld";
import { articles, getArticleBySlug } from "@/data";
import { SITE_URL } from "@/lib/seo/site";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = true;

export async function generateStaticParams() {
  return articles.slice(0, 72).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getArticleBySlug(slug);
  if (!post) return { title: "Article" };
  return {
    title: post.title,
    description: post.excerpt,
    keywords: post.tags.join(", "),
    alternates: { canonical: `${SITE_URL}/blog/${post.slug}` },
    openGraph: { title: post.title, description: post.excerpt },
  };
}

export default async function BlogArticlePage({ params }: Props) {
  const { slug } = await params;
  const post = getArticleBySlug(slug);
  if (!post) notFound();
  return (
    <>
      <JsonLdScript data={articleJsonLd(post, "/blog")} />
      <ArticlePremium post={post} />
    </>
  );
}
