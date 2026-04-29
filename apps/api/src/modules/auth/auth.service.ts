import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { compare, hash } from "bcryptjs";
import { randomBytes } from "node:crypto";
import { PrismaService } from "../prisma/prisma.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { ObservabilityService } from "../observability/observability.service";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly observability: ObservabilityService,
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email.toLowerCase();

    const existing = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      throw new BadRequestException("El correo ya está registrado.");
    }

    const passwordHash = await hash(dto.password, 12);
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        profile: {
          create: {
            firstName: dto.firstName,
            lastName: dto.lastName,
          },
        },
        emailVerificationTokens: {
          create: {
            token,
            expiresAt,
          },
        },
      },
      include: {
        profile: true,
      },
    });
    this.observability.registerUserInCohort(user.id, user.createdAt);

    return {
      message:
        "Cuenta creada. En desarrollo local, revisa Mailhog para simular la verificación.",
      verificationTokenPreview: token,
      user: this.safeUser(user),
    };
  }

  async login(dto: LoginDto) {
    const email = dto.email.toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        profile: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException("Credenciales inválidas.");
    }

    const valid = await compare(dto.password, user.passwordHash);

    if (!valid) {
      throw new UnauthorizedException("Credenciales inválidas.");
    }

    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    this.observability.recordLoginSuccessful(user.id);

    return {
      accessToken,
      user: this.safeUser(user),
    };
  }

  private safeUser(user: {
    id: number;
    email: string;
    role: string;
    isVerified: boolean;
    profile?: unknown;
  }) {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      profile: user.profile,
    };
  }
}
