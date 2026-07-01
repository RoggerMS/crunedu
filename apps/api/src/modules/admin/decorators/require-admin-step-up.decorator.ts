import { SetMetadata } from "@nestjs/common";

export const ADMIN_STEP_UP_KEY = "admin:step-up";

export const RequireAdminStepUp = () => SetMetadata(ADMIN_STEP_UP_KEY, true);
