import { registerDecorator, ValidationOptions } from 'class-validator';

export function isValidCpf(cpf: string): boolean {
    // deve ter exatamente 11 digitos numericos
    if (!/^\d{11}$/.test(cpf)) return false;

    // sequencias como 11111111111 sao invalidas mesmo passando no calculo
    if (/^(\d)\1{10}$/.test(cpf)) return false;

    // primeiro digito verificador: multiplica os digitos 0-8 por pesos 10 ate 2 e soma
    let sum = 0;
    for (let i = 0; i < 9; i++) {
        sum += parseInt(cpf[i]) * (10 - i);
    }
    // resto >= 10 significa que o digito verificador e 0 (regra da Receita Federal)
    let remainder = (sum * 10) % 11;
    if (remainder >= 10) remainder = 0;
    if (remainder !== parseInt(cpf[9])) return false;

    // segundo digito verificador: mesma logica usando os digitos 0-9 com pesos 11 ate 2
    sum = 0;
    for (let i = 0; i < 10; i++) {
        sum += parseInt(cpf[i]) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder >= 10) remainder = 0;
    if (remainder !== parseInt(cpf[10])) return false;

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
                    return 'document must contain exactly 11 numeric digits and be a valid CPF';
                },
            },
        });
    };
}
