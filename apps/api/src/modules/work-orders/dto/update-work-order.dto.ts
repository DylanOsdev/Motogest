import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateWorkOrderDto } from './create-work-order.dto';

export class UpdateWorkOrderDto extends PartialType(
  OmitType(CreateWorkOrderDto, ['vehicleId', 'clientId'] as const),
) {}
