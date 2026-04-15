import { registerDecorator, ValidationOptions } from 'class-validator';

export function isValidCpf(cpf: string): boolean {
    const stripped = cpf.replace(/\D/g, '');

    if (stripped.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(stripped)) return false;

    let sum = 0;
    for (let i = 0; i < 9; i++) {
        sum += parseInt(stripped[i]) * (10 - i);
    }
    let remainder = (sum * 10) % 11;
    if (remainder >= 10) remainder = 0;
    if (remainder !== parseInt(stripped[9])) return false;

    sum = 0;
    for (let i = 0; i < 10; i++) {
        sum += parseInt(stripped[i]) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder >= 10) remainder = 0;
    if (remainder !== parseInt(stripped[10])) return false;

    return true;
}

export function IsCpf(validationOptions?: ValidationOptions) {
    return function (object: object, propertyName: string) {
        registerDecorator({
            name: 'isCpf',
            target: (object as any).constructor,
            propertyName,
            options: validationOptions,
            validator: {
                validate(value: any) {
                    return typeof value === 'string' && isValidCpf(value);
                },
                defaultMessage() {
                    return 'document must be a valid CPF';
                },
            },
        });
    };
}
