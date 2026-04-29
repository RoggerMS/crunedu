import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { SearchQueryDto } from "./dto/search-query.dto";

const RESULT_LIMIT = 5;

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async index(query: SearchQueryDto) {
    const text = query.q?.trim();

    if (!text) {
      return {
        query: "",
        posts: [],
        questions: [],
        communities: [],
      };
    }

    const [posts, questions, communities] = await Promise.all([
      this.prisma.post.findMany({
        where: {
          status: "PUBLISHED",
          OR: [{ title: { contains: text, mode: "insensitive" } }, { content: { contains: text, mode: "insensitive" } }],
        },
        orderBy: { createdAt: "desc" },
        take: RESULT_LIMIT,
        select: {
          id: true,
          title: true,
          content: true,
          createdAt: true,
          community: { select: { id: true, name: true, slug: true } },
        },
      }),
      this.prisma.question.findMany({
        where: {
          status: "PUBLISHED",
          OR: [{ title: { contains: text, mode: "insensitive" } }, { content: { contains: text, mode: "insensitive" } }],
        },
        orderBy: { createdAt: "desc" },
        take: RESULT_LIMIT,
        select: {
          id: true,
          title: true,
          content: true,
          createdAt: true,
          community: { select: { id: true, name: true, slug: true } },
        },
      }),
      this.prisma.community.findMany({
        where: {
          status: "PUBLISHED",
          OR: [{ name: { contains: text, mode: "insensitive" } }, { description: { contains: text, mode: "insensitive" } }],
        },
        orderBy: { createdAt: "desc" },
        take: RESULT_LIMIT,
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
        },
      }),
    ]);

    return { query: text, posts, questions, communities };
  }
}
