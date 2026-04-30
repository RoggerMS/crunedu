import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { QuestionsController } from "./questions.controller";
import { QuestionsService } from "./questions.service";

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? "change_this_local_secret",
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN ?? "7d" },
    }),
  ],
  controllers: [QuestionsController],
  providers: [QuestionsService],
})
export class QuestionsModule {}
