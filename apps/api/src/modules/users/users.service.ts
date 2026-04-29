import { NotFoundException, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { UpdateMeDto } from "./dto/update-me.dto";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        profile: {
          select: {
            firstName: true,
            lastName: true,
            description: true,
            cycle: true,
            faculty: { select: { name: true } },
            career: { select: { name: true } },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException("Usuario no encontrado.");
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.profile?.firstName ?? "",
      lastName: user.profile?.lastName ?? "",
      bio: user.profile?.description ?? "",
      faculty: user.profile?.faculty?.name ?? "",
      career: user.profile?.career?.name ?? "",
      cycle: user.profile?.cycle ?? "",
    };
  }

  async updateMe(userId: number, dto: UpdateMeDto) {
    const [faculty, career] = await Promise.all([
      dto.faculty
        ? this.prisma.faculty.findFirst({ where: { name: { equals: dto.faculty, mode: "insensitive" } }, select: { id: true } })
        : null,
      dto.career
        ? this.prisma.career.findFirst({ where: { name: { equals: dto.career, mode: "insensitive" } }, select: { id: true } })
        : null,
    ]);

    await this.prisma.profile.upsert({
      where: { userId },
      create: {
        userId,
        firstName: dto.firstName ?? "",
        lastName: dto.lastName ?? "",
        description: dto.bio ?? null,
        cycle: dto.cycle ?? null,
        facultyId: dto.faculty ? (faculty?.id ?? null) : null,
        careerId: dto.career ? (career?.id ?? null) : null,
      },
      update: {
        ...(dto.firstName !== undefined ? { firstName: dto.firstName ?? "" } : {}),
        ...(dto.lastName !== undefined ? { lastName: dto.lastName ?? "" } : {}),
        ...(dto.bio !== undefined ? { description: dto.bio } : {}),
        ...(dto.cycle !== undefined ? { cycle: dto.cycle } : {}),
        ...(dto.faculty !== undefined ? { facultyId: dto.faculty ? (faculty?.id ?? null) : null } : {}),
        ...(dto.career !== undefined ? { careerId: dto.career ? (career?.id ?? null) : null } : {}),
      },
    });

    return this.getMe(userId);
  }
}
