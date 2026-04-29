import { Body, Controller, Post } from "@nestjs/common";
import { RateLimit } from "../core/rate-limit.decorator";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  @RateLimit({ windowMs: 60_000, maxPerIp: 5, message: "Demasiados intentos de registro. Intenta nuevamente en 1 minuto." })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post("login")
  @RateLimit({ windowMs: 60_000, maxPerIp: 8, message: "Demasiados intentos de inicio de sesión. Intenta nuevamente en 1 minuto." })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }
}
