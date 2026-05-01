import { Injectable, NotFoundException } from "@nestjs/common";
import { CreateDebateDto } from "./dto/create-debate.dto";
import { CreateDebateResponseDto } from "./dto/create-debate-response.dto";
import { ListDebatesQueryDto } from "./dto/list-debates-query.dto";

type DebateResponse = {
  id: number;
  content: string;
  createdAt: Date;
  authorId: number;
};

type DebateItem = {
  id: number;
  courseKey: string;
  weeklyTopic: string;
  stance: string;
  audioNoteUrl: string | null;
  createdAt: Date;
  authorId: number;
  responses: DebateResponse[];
};

@Injectable()
export class DebatesService {
  private debates: DebateItem[] = [];
  private nextDebateId = 1;
  private nextResponseId = 1;

  list(query: ListDebatesQueryDto) {
    const filtered = this.debates.filter((debate) => {
      if (debate.courseKey !== query.courseKey) return false;
      if (!query.week) return true;
      return this.getIsoWeekLabel(debate.createdAt) === query.week;
    });

    return {
      items: filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    };
  }

  create(dto: CreateDebateDto, userId: number) {
    const created: DebateItem = {
      id: this.nextDebateId++,
      courseKey: dto.courseKey,
      weeklyTopic: dto.weeklyTopic.trim(),
      stance: dto.stance.trim(),
      audioNoteUrl: dto.audioNoteUrl ?? null,
      createdAt: new Date(),
      authorId: userId,
      responses: [],
    };
    this.debates.push(created);
    return created;
  }

  respond(debateId: number, dto: CreateDebateResponseDto, userId: number) {
    const debate = this.debates.find((item) => item.id === debateId);
    if (!debate) throw new NotFoundException("Debate no encontrado.");

    const response: DebateResponse = {
      id: this.nextResponseId++,
      content: dto.content.trim(),
      createdAt: new Date(),
      authorId: userId,
    };

    debate.responses.push(response);
    return response;
  }

  private getIsoWeekLabel(date: Date): string {
    const copied = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    const day = copied.getUTCDay() || 7;
    copied.setUTCDate(copied.getUTCDate() + 4 - day);
    const yearStart = new Date(Date.UTC(copied.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((copied.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return `${copied.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
  }
}
