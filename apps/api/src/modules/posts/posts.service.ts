import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreatePostDto } from "./dto/create-post.dto";
import { PostResponseDto } from "./dto/post-response.dto";

@Injectable()
export class PostsService {
  constructor(private readonly prisma: PrismaService) {}

  async index(): Promise<PostResponseDto[]> {
    const posts = await this.prisma.post.findMany({
      where: {
        status: "PUBLISHED",
      },
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        community: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        _count: {
          select: {
            comments: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return posts.map((post: (typeof posts)[number]) => ({
      id: post.id,
      title: post.title,
      content: post.content,
      createdAt: post.createdAt,
      author: {
        id: post.user.id,
        email: post.user.email,
        firstName: post.user.profile?.firstName ?? null,
        lastName: post.user.profile?.lastName ?? null,
      },
      community: post.community,
      commentsCount: post._count?.comments ?? 0,
    }));
  }

  async create(dto: CreatePostDto, userId: number): Promise<PostResponseDto> {
    const community = await this.prisma.community.findUnique({
      where: {
        id: dto.communityId,
      },
      select: {
        id: true,
      },
    });

    if (!community) {
      throw new BadRequestException("La comunidad seleccionada no existe.");
    }

    const title = dto.title?.trim() ?? "";

    const post = await this.prisma.post.create({
      data: {
        title,
        content: dto.content,
        communityId: dto.communityId,
        userId,
      },
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        community: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        _count: {
          select: {
            comments: true,
          },
        },
      },
    });

    return {
      id: post.id,
      title: post.title,
      content: post.content,
      createdAt: post.createdAt,
      author: {
        id: post.user.id,
        email: post.user.email,
        firstName: post.user.profile?.firstName ?? null,
        lastName: post.user.profile?.lastName ?? null,
      },
      community: post.community,
      commentsCount: post._count?.comments ?? 0,
    };
  }
}
