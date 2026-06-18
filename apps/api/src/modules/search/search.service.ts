import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { SearchQueryDto } from "./dto/search-query.dto";

type SearchableItem = {
  id: number;
  title: string;
  content: string;
  createdAt: Date;
  interactions: number;
};

const DEFAULT_LIMIT = 5;

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  private scoreItem(item: SearchableItem, query: string) {
    const normalizedQuery = query.toLowerCase();
    const title = item.title.toLowerCase();
    const content = item.content.toLowerCase();

    const countLiteralMatches = (value: string) => value.split(normalizedQuery).length - 1;
    const titleMatches = countLiteralMatches(title);
    const contentMatches = countLiteralMatches(content);

    const textScore = titleMatches * 4 + contentMatches * 2;
    const daysSinceCreation = Math.max(0, (Date.now() - new Date(item.createdAt).getTime()) / (1000 * 60 * 60 * 24));
    const recencyScore = Math.max(0, 30 - daysSinceCreation);

    return textScore + recencyScore + item.interactions;
  }

  private highlight(text: string, query: string) {
    const safeQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(${safeQuery})`, "ig");
    return text.replace(regex, "<mark>$1</mark>");
  }

  async index(query: SearchQueryDto) {
    const text = query.q?.trim() ?? "";
    const type = query.type;
    const page = query.page ?? 1;
    const limit = query.limit ?? DEFAULT_LIMIT;

    if (!text) {
      return {
        query: "",
        type: type ?? "all",
        page,
        limit,
        total: 0,
        noResultsTracked: false,
        posts: [],
        questions: [],
        communities: [],
        products: [],
      };
    }

    const shouldSearch = (value: string) => !type || type === "all" || type === value;

    const [posts, questions, communities, products] = await Promise.all([
      shouldSearch("posts")
        ? this.prisma.post.findMany({ where: { status: "PUBLISHED", OR: [{ title: { contains: text, mode: "insensitive" } }, { content: { contains: text, mode: "insensitive" } }] }, select: { id: true, title: true, content: true, createdAt: true, _count: { select: { comments: true, reactions: true } }, community: { select: { id: true, name: true, slug: true } } }, take: 60 })
        : Promise.resolve([]),
      shouldSearch("questions")
        ? this.prisma.question.findMany({ where: { status: "PUBLISHED", OR: [{ title: { contains: text, mode: "insensitive" } }, { content: { contains: text, mode: "insensitive" } }] }, select: { id: true, title: true, content: true, createdAt: true, _count: { select: { answers: true } }, community: { select: { id: true, name: true, slug: true } } }, take: 60 })
        : Promise.resolve([]),
      shouldSearch("communities")
        ? this.prisma.community.findMany({ where: { status: "PUBLISHED", OR: [{ name: { contains: text, mode: "insensitive" } }, { description: { contains: text, mode: "insensitive" } }] }, select: { id: true, name: true, slug: true, description: true, createdAt: true, _count: { select: { posts: true, questions: true, members: true } } }, take: 60 })
        : Promise.resolve([]),
      shouldSearch("products")
        ? this.prisma.product.findMany({ where: { status: "ACTIVE", OR: [{ title: { contains: text, mode: "insensitive" } }, { description: { contains: text, mode: "insensitive" } }] }, select: { id: true, title: true, description: true, createdAt: true, viewCount: true, contactClickCount: true, category: { select: { id: true, name: true } } }, take: 60 })
        : Promise.resolve([]),
    ]);

    const rankedPosts = posts.map((item) => ({ ...item, relevance: this.scoreItem({ id: item.id, title: item.title, content: item.content, createdAt: item.createdAt, interactions: item._count.comments + item._count.reactions }, text) })).sort((a, b) => b.relevance - a.relevance);
    const rankedQuestions = questions.map((item) => ({ ...item, relevance: this.scoreItem({ id: item.id, title: item.title, content: item.content, createdAt: item.createdAt, interactions: item._count.answers }, text) })).sort((a, b) => b.relevance - a.relevance);
    const rankedCommunities = communities.map((item) => ({ ...item, relevance: this.scoreItem({ id: item.id, title: item.name, content: item.description ?? "", createdAt: item.createdAt, interactions: item._count.posts + item._count.questions + item._count.members }, text) })).sort((a, b) => b.relevance - a.relevance);
    const rankedProducts = products.map((item) => ({ ...item, relevance: this.scoreItem({ id: item.id, title: item.title, content: item.description, createdAt: item.createdAt, interactions: item.viewCount + item.contactClickCount }, text) })).sort((a, b) => b.relevance - a.relevance);

    const paginate = <T>(items: T[]) => items.slice((page - 1) * limit, page * limit);
    const pagedPosts = paginate(rankedPosts);
    const pagedQuestions = paginate(rankedQuestions);
    const pagedCommunities = paginate(rankedCommunities);
    const pagedProducts = paginate(rankedProducts);

    const total = rankedPosts.length + rankedQuestions.length + rankedCommunities.length + rankedProducts.length;

    return {
      query: text,
      type: type ?? "all",
      page,
      limit,
      total,
      noResultsTracked: total === 0,
      posts: pagedPosts.map((item) => ({ ...item, titleHighlighted: this.highlight(item.title, text), contentHighlighted: this.highlight(item.content, text) })),
      questions: pagedQuestions.map((item) => ({ ...item, titleHighlighted: this.highlight(item.title, text), contentHighlighted: this.highlight(item.content, text) })),
      communities: pagedCommunities.map((item) => ({ ...item, nameHighlighted: this.highlight(item.name, text), descriptionHighlighted: this.highlight(item.description ?? "", text) })),
      products: pagedProducts.map((item) => ({ ...item, titleHighlighted: this.highlight(item.title, text), descriptionHighlighted: this.highlight(item.description, text) })),
    };
  }
}
