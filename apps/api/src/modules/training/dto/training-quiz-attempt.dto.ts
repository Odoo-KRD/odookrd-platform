import { ArrayMaxSize, IsArray, IsUUID } from 'class-validator';

export class SaveTrainingQuizAnswerDto {
  @IsArray()
  @ArrayMaxSize(20)
  @IsUUID('4', { each: true })
  selectedOptionIds!: string[];
}
