import bcrypt from "bcrypt";
import jsonwebtoken from "jsonwebtoken";
import { IUserRepository } from "../contracts/user-repository.interface";
import { ICacheProvider } from "../contracts/cache-provider.interface";
import { LoginDto } from "../dtos/auth/login.dto";
import { RegisterDto } from "../dtos/auth/register.dto";
import { User } from "../infra/database/entities/user.entity";
import { ConflictError } from "../errors/conflict.error";
import { UnauthorizedError } from "../errors/unauthorized.error";
import { formatPhone } from "../utils/phone.validator";

const SALT_ROUNDS = 10;

function parseExpiresInToSeconds(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)(s|m|h|d)$/);
    if (!match) return 7200;
    const multipliers: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 };
    return parseInt(match[1]) * multipliers[match[2]];
}

export class AuthService {

    constructor(
        private readonly userRepository: IUserRepository,
        private readonly cacheProvider: ICacheProvider,
    ) {}

    async register(data: RegisterDto): Promise<User> {
        const existingUser = await this.userRepository.findByEmail(data.email);

        if (existingUser) {
            throw new ConflictError({ message: "Email already in use" });
        }

        data.phone = formatPhone(data.phone);
        data.password = await AuthService.hashPassword(data.password);

        return this.userRepository.create(data);
    }

    async login(data: LoginDto) {
        const user = await this.userRepository.findByEmail(data.email);

        if (!user) {
            throw new UnauthorizedError({ message: "Invalid credentials" });
        }

        const isMatch = await bcrypt.compare(data.password, user.password);

        if (!isMatch) {
            throw new UnauthorizedError({ message: "Invalid credentials" });
        }

        const expiresIn = process.env.JWT_EXPIRES_IN ?? '2h';
        const cacheKey = `auth:session:${user.id}`;

        try {
            const cached = await this.cacheProvider.get(cacheKey);
            if (cached) {
                return JSON.parse(cached);
            }
        } catch {
            // Redis unavailable — proceed to generate a new token
        }

        const token = jsonwebtoken.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET as string,
            { expiresIn } as object
        );

        const response = {
            tokenType: "Bearer",
            expiresIn,
            accessToken: token,
        };

        try {
            await this.cacheProvider.set(cacheKey, JSON.stringify(response), parseExpiresInToSeconds(expiresIn));
        } catch {
            // Redis unavailable — token generated without caching
        }

        return response;
    }

    static async hashPassword(password: string): Promise<string> {
        return bcrypt.hash(password, SALT_ROUNDS);
    }

    static async comparePassword(plain: string, hashed: string): Promise<boolean> {
        return bcrypt.compare(plain, hashed);
    }
}
