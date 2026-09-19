import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface PublicUser {
  id: string;
  username: string;
  phoneNumber: string;
  createdAt: Date;
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findByUsername(username: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { username } });
  }

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  create(data: {
    username: string;
    passwordHash: string;
    phoneNumber: string;
  }): Promise<User> {
    return this.prisma.user.create({ data });
  }

  static toPublic(user: User): PublicUser {
    return {
      id: user.id,
      username: user.username,
      phoneNumber: user.phoneNumber,
      createdAt: user.createdAt,
    };
  }
}
