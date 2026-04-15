import { UserService } from "../../src/services/user.service";
import { IUserRepository } from "../../src/contracts/user-repository.interface";
import { ConflictError } from "../../src/errors/conflict.error";
import { NotFoundError } from "../../src/errors/not-found.error";
import { BadRequestError } from "../../src/errors/bad-request.error";
import { UserCreateDto } from "../../src/dtos/user/create-user.dto";
import { User } from "../../src/infra/database/entities/user.entity";
import { ICacheProvider } from "../../src/contracts/cache-provider.interface";

describe("UserService", () => {
  let userService: UserService;
  let userRepository: jest.Mocked<IUserRepository>;
  let cacheProvider: jest.Mocked<ICacheProvider>;

  beforeEach(() => {
    userRepository = {
      get: jest.fn(),
      findByEmail: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    cacheProvider = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };

    userService = new UserService(userRepository, cacheProvider);
  });

  // get tests
  it("get should return all users", async () => {
    userRepository.get.mockResolvedValue([
        {
            "id": 14,
            "name": "admin",
            "email": "admin@admin.com",
            "phone": "32-99909-3190"
        } as User,
    ]);

    const result = await userService.get();

    expect(result.length).toBe(1);
    expect(userRepository.get).toHaveBeenCalledTimes(1);
    expect(result[0]).toHaveProperty("id");
    expect(result[0]).toHaveProperty("email");
  });

  it("get should throw NotFoundError if no users exist", async () => {
    userRepository.get.mockResolvedValue([]);

    await expect(userService.get()).rejects.toBeInstanceOf(NotFoundError);
  });

  // create tests
  it("create should create a new user", async () => {
    userRepository.findByEmail.mockResolvedValue(null);

    userRepository.create.mockResolvedValue({
      id: 1,
      name: "Luan",
      email: "luan@test.com",
    } as User);

    const user: UserCreateDto = {
        name: "Luan",
        email: "luan@test.com",
        phone: "9999",
        username: "teste"
    }

    const result = await userService.create(user);

    expect(result.id).toBe(1);
    expect(userRepository.create).toHaveBeenCalledTimes(1);
  });

  it("create should throw ConflictError if email already exists", async () => {
    userRepository.findByEmail.mockResolvedValue({
      id: 99,
      email: "luan@test.com",
    } as any);

    await expect(
      userService.create({
        name: "Luan",
        email: "luan@test.com",
        phone: "9999",
      } as UserCreateDto)
    ).rejects.toBeInstanceOf(ConflictError);
  });

  // findById tests
  it("findById should return user by id", async () => {
    userRepository.findById.mockResolvedValue({
      id: 1,
      name: "Luan",
    } as any);

    const result = await userService.findById(1);

    expect(result.id).toBe(1);
    expect(userRepository.findById).toHaveBeenCalledWith(1);
  });

  it("findById should throw NotFoundError if user does not exist", async () => {
    userRepository.findById.mockResolvedValue(null);

    await expect(userService.findById(1)).rejects.toBeInstanceOf(NotFoundError);
  });

  // update tests
  it("update should update user successfully", async () => {
    userRepository.findById.mockResolvedValue({
      id: 1,
      name: "Old Name",
    } as any);

    userRepository.update.mockResolvedValue({
      id: 1,
      name: "New Name",
    } as any);

    const result = await userService.update(1, { name: "New Name" });

    expect(result.name).toBe("New Name");
    expect(userRepository.update).toHaveBeenCalledWith(1, {
      name: "New Name",
      phone: undefined,
    });
  });

  it("update should throw BadRequestError if no data provided", async () => {
    userRepository.findById.mockResolvedValue({ id: 1 } as any);

    await expect(userService.update(1, {})).rejects.toBeInstanceOf(
      BadRequestError
    );
  });

  // delete tests
  it("delete should delete user successfully", async () => {
    userRepository.findById.mockResolvedValue({ id: 1 } as any);

    userRepository.delete.mockResolvedValue(undefined);

    await userService.delete(1);

    expect(userRepository.delete).toHaveBeenCalledWith(1);
  });

  it("delete should throw NotFoundError if deleting non-existing user", async () => {
    userRepository.findById.mockResolvedValue(null);

    await expect(userService.delete(1)).rejects.toBeInstanceOf(NotFoundError);
  });
});
