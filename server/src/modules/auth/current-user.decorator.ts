import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): { id: number; email: string } => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
