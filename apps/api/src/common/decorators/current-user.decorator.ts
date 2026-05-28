import {
  createParamDecorator,
  ExecutionContext,
  InternalServerErrorException,
} from '@nestjs/common';

/**
 * Shape that JwtStrategy.validate() returns and Passport attaches to
 * `req.user`. Mirror it here so consumers don't depend on the strategy
 * directly.
 */
export interface AuthenticatedUser {
  id: string;
  tenantId: string;
  role: string;
}

/**
 * Pulls the authenticated user from the request. Routes using this
 * decorator MUST be protected by JwtAuthGuard (the global guard satisfies
 * this for every endpoint not marked `@Public()`).
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const request = ctx
      .switchToHttp()
      .getRequest<{ user?: AuthenticatedUser }>();
    if (!request.user) {
      throw new InternalServerErrorException(
        'CurrentUser decorator used on an endpoint without JwtAuthGuard',
      );
    }
    return request.user;
  },
);
