import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { PublicUser, UsersService } from '../users/users.service';
import { JwtPayload } from './auth.types';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { resolveSessionTtlMinutes } from './session-ttl';

const BCRYPT_ROUNDS = 12;

export interface LoginResult {
  accessToken: string;
  /** ISO timestamp at which the session stops being accepted. */
  expiresAt: string;
  user: PublicUser;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  private get sessionTtlMinutes(): number {
    return resolveSessionTtlMinutes(
      this.config.get<string>('SESSION_TTL_MINUTES'),
    );
  }

  async signup(dto: SignupDto): Promise<PublicUser> {
    const existing = await this.users.findByUsername(dto.username);
    if (existing) {
      throw new ConflictException('That username is already taken');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const user = await this.users.create({
      username: dto.username,
      passwordHash,
      phoneNumber: dto.phoneNumber,
    });

    return UsersService.toPublic(user);
  }

  async login(dto: LoginDto): Promise<LoginResult> {
    const user = await this.users.findByUsername(dto.username);
    // Compare against a dummy hash when the user is unknown so that a missing
    // account and a wrong password take roughly the same amount of time.
    const hash = user?.passwordHash ?? (await bcrypt.hash('not-a-real-user', 4));
    const passwordMatches = await bcrypt.compare(dto.password, hash);

    if (!user || !passwordMatches) {
      throw new UnauthorizedException('Invalid username or password');
    }

    const expiresAt = new Date(Date.now() + this.sessionTtlMinutes * 60_000);
    const session = await this.prisma.session.create({
      data: { userId: user.id, expiresAt },
    });

    const payload: JwtPayload = {
      sub: user.id,
      sid: session.id,
      username: user.username,
    };

    const accessToken = await this.jwt.signAsync(payload, {
      expiresIn: this.sessionTtlMinutes * 60,
    });

    return {
      accessToken,
      expiresAt: expiresAt.toISOString(),
      user: UsersService.toPublic(user),
    };
  }

  /** Revokes the session immediately, before its natural expiry. */
  async logout(sessionId: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { id: sessionId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async me(userId: string): Promise<PublicUser> {
    const user = await this.users.findById(userId);
    if (!user) {
      throw new UnauthorizedException('Account no longer exists');
    }
    return UsersService.toPublic(user);
  }
}
