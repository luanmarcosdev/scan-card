import { validate } from 'class-validator';
import { stripPhone, formatPhone, IsPhone } from '../../src/utils/phone.validator';

describe('stripPhone', () => {
    it('should remove all non-numeric characters', () => {
        expect(stripPhone('(11) 99999-9999')).toBe('11999999999');
    });

    it('should return only digits when input is already clean', () => {
        expect(stripPhone('11999999999')).toBe('11999999999');
    });
});

describe('formatPhone', () => {
    it('should format 11-digit phone number', () => {
        expect(formatPhone('11999999999')).toBe('11-99999-9999');
    });

    it('should format phone with non-numeric characters', () => {
        expect(formatPhone('(11) 99999-9999')).toBe('11-99999-9999');
    });
});

describe('IsPhone decorator', () => {
    class TestDto {
        @IsPhone()
        phone!: string;
    }

    it('should pass for a valid 11-digit phone number', async () => {
        const dto = Object.assign(new TestDto(), { phone: '11999999999' });
        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
    });

    it('should pass for a phone with formatting characters that total 11 digits', async () => {
        const dto = Object.assign(new TestDto(), { phone: '(11) 99999-9999' });
        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
    });

    it('should fail for a phone with fewer than 11 digits', async () => {
        const dto = Object.assign(new TestDto(), { phone: '1199999999' });
        const errors = await validate(dto);
        expect(errors).toHaveLength(1);
        expect(errors[0].constraints?.isPhone).toBe('phone must contain exactly 11 numeric digits');
    });

    it('should fail for a phone with more than 11 digits', async () => {
        const dto = Object.assign(new TestDto(), { phone: '119999999999' });
        const errors = await validate(dto);
        expect(errors).toHaveLength(1);
    });

    it('should fail for a non-string value', async () => {
        const dto = Object.assign(new TestDto(), { phone: 11999999999 });
        const errors = await validate(dto);
        expect(errors).toHaveLength(1);
    });
});
