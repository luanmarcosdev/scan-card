import { User } from "../infra/database/entities/user.entity";
import { UserResponseDto } from "../dtos/user/response-user.dto";

export function userToUserResponseDto(user: User): UserResponseDto {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    document: user.document,
    salary: user.salary,
    phone: user.phone,
    created_at: user.created_at,
    updated_at: user.updated_at,
  };
}
