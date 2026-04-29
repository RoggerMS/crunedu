import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreatePostDto } from "./dto/create-post.dto";
import { PostResponseDto } from "./dto/post-response.dto";
import { UpdatePostDto } from "./dto/update-post.dto";

@Injectable()
export class PostsService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly postSelect = {
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
  } as const;

  private mapPostResponse(post: {
    id: number;
    title: string;
    content: string;
    createdAt: Date;
    user: { id: number; email: string; profile: { firstName: string | null; lastName: string | null } | null };
    community: { id: number; name: string; slug: string } | null;
    _count: { comments: number } | null;
  }): PostResponseDto {
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

  async index(): Promise<PostResponseDto[]> {
    const posts = await this.prisma.post.findMany({
      where: {
        status: "PUBLISHED",
      },
      select: this.postSelect,
      orderBy: {
        createdAt: "desc",
      },
    });

    return posts.map((post: (typeof posts)[number]) => this.mapPostResponse(post));
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
      select: this.postSelect,
    });

    return this.mapPostResponse(post);
  }

  async findOne(id: number): Promise<PostResponseDto> {
    const post = await this.prisma.post.findFirst({
      where: { id, status: "PUBLISHED" },
      select: this.postSelect,
    });

    if (!post) {
      throw new NotFoundException("Publicación no encontrada.");
    }

    return this.mapPostResponse(post);
  }

  async update(id: number, dto: UpdatePostDto, userId: number): Promise<PostResponseDto> {
    const existingPost = await this.prisma.post.findUnique({
      where: { id },
      select: { id: true, userId: true },
    });

    if (!existingPost) {
      throw new NotFoundException("Publicación no encontrada.");
    }

    if (existingPost.userId !== userId) {
      throw new ForbiddenException("No tienes permisos para editar esta publicación.");
    }

    if (dto.communityId) {
      const community = await this.prisma.community.findUnique({
        where: { id: dto.communityId },
        select: { id: true },
      });

      if (!community) {
        throw new BadRequestException("La comunidad seleccionada no existe.");
      }
    }

    const updatedPost = await this.prisma.post.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
        ...(dto.content !== undefined ? { content: dto.content.trim() } : {}),
        ...(dto.communityId !== undefined ? { communityId: dto.communityId } : {}),
      },
      select: this.postSelect,
    });

    return this.mapPostResponse(updatedPost);
  }

  async remove(id: number, userId: number, role: string): Promise<{ message: string }> {
    const existingPost = await this.prisma.post.findUnique({
      where: { id },
      select: { id: true, userId: true },
    });

    if (!existingPost) {
      throw new NotFoundException("Publicación no encontrada.");
    }

    const isAuthor = existingPost.userId === userId;
    const isAdmin = role === "ADMIN";

    if (!isAuthor && !isAdmin) {
      throw new ForbiddenException("No tienes permisos para eliminar esta publicación.");
    }

    await this.prisma.post.update({
      where: { id },
      data: { status: "DELETED" },
    });

    return { message: "Publicación eliminada correctamente." };
  }
}
