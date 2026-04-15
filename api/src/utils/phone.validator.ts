import { registerDecorator, ValidationOptions } from 'class-validator';

export function stripPhone(phone: string): string {
    return phone.replace(/\D/g, '');
}

export function formatPhone(phone: string): string {
    const digits = stripPhone(phone);
    return `${digits.slice(0, 2)}-${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function IsPhone(validationOptions?: ValidationOptions) {
    return function (object: object, propertyName: string) {
        registerDecorator({
            name: 'isPhone',
            target: (object as any).constructor,
            propertyName,
            options: validationOptions,
            validator: {
                validate(value: any) {
                    return typeof value === 'string' && stripPhone(value).length === 11;
                },
                defaultMessage() {
                    return 'phone must contain exactly 11 numeric digits';
                },
            },
        });
    };
}
