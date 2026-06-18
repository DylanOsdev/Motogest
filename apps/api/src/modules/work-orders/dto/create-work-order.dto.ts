import {
  IsString,
  IsUUID,
  IsOptional,
  IsDateString,
  IsIn,
  MaxLength,
  IsNotEmpty,
} from 'class-validator';

export class CreateWorkOrderDto {
  @IsUUID()
  @IsNotEmpty()
  vehicleId: string;

  @IsUUID()
  @IsNotEmpty()
  clientId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  description: string;

  @IsString()
  @IsOptional()
  @IsIn(['low', 'normal', 'high', 'urgent'])
  priority?: string;

  @IsDateString()
  @IsOptional()
  scheduledAt?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  clientNotes?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  internalNotes?: string;
}
