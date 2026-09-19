import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class SignupDto {
  @IsString()
  @MinLength(3, { message: 'Username must be at least 3 characters long' })
  @MaxLength(32)
  @Matches(/^[a-zA-Z0-9_.-]+$/, {
    message: 'Username may only contain letters, numbers, dot, dash, underscore',
  })
  username!: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(72)
  password!: string;

  @IsString()
  @Matches(/^\+?[0-9][0-9\s-]{5,19}$/, {
    message: 'Phone number must be 6-20 digits, optionally starting with +',
  })
  phoneNumber!: string;
}
