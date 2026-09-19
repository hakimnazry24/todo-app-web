import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateTaskDto {
  @IsString()
  @MinLength(1, { message: 'Task name is required' })
  @MaxLength(120)
  name!: string;

  @IsString()
  @MinLength(1, { message: 'Task description is required' })
  @MaxLength(2000)
  description!: string;
}
