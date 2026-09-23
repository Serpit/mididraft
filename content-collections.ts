import { defineCollection, defineConfig } from '@content-collections/core';
import { z } from 'zod';

const blog = defineCollection({
  name: 'blog',
  directory: 'content/blog',
  include: '**/*.md',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.string(),
    category: z.string(),
    content: z.string(),
    image: z.union([z.url(), z.string().startsWith('/')]),
  }),
  transform: (doc) => ({
    ...doc,
    slug: (doc as { _meta: { path: string } })._meta.path,
  }),
});

const pages = defineCollection({
  name: 'pages',
  directory: 'content/pages',
  include: '**/*.md',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.string().optional(),
    content: z.string(),
  }),
  transform: (doc) => ({
    ...doc,
    slug: (doc as { _meta: { path: string } })._meta.path,
  }),
});

const changelog = defineCollection({
  name: 'changelog',
  directory: 'content/changelog',
  include: '**/*.md',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.string(),
    version: z.string(),
    published: z.boolean().default(true),
    content: z.string(),
  }),
  transform: (doc) => ({
    ...doc,
    slug: (doc as { _meta: { path: string } })._meta.path,
  }),
});

export default defineConfig({
  collections: [blog, pages, changelog],
});
