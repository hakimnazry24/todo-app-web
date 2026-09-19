import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/** Requires a valid, unrevoked, unexpired session on the request. */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
