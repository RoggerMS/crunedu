import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class CommunitiesService {
  constructor(private prisma: PrismaService) {}

  async index() {
    const communities = await this.prisma.community.findMany({
      where: {
        status: "PUBLISHED",
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        avatarUrl: true,
        coverUrl: true,
        status: true,
        createdAt: true,
        _count: {
          select: {
            members: true,
            posts: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return communities.map((community: { id: number; name: string; slug: string; description: string | null; avatarUrl: string | null; coverUrl: string | null; status: string; createdAt: Date; _count: { members: number; posts: number } }) => ({
      id: community.id,
      name: community.name,
      slug: community.slug,
      description: community.description,
      avatarUrl: community.avatarUrl,
      coverUrl: community.coverUrl,
      status: community.status,
      createdAt: community.createdAt,
      membersCount: community._count.members,
      postsCount: community._count.posts,
    }));
  }
}